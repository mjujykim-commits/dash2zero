/**
 * RLS Evaluator — dash2zero harness (ADR-0003 + ADR-0004)
 *
 * 모드 (W15 본화): static SQL 분석
 *   - infra/supabase/migrations/0002_rls.sql 파싱 (multi-line USING / WITH CHECK 강화)
 *   - 정책 분류기:
 *       * owner-only      auth.uid() = {user_id|merged_to_user_id|reporter_user_id}
 *       * pack-tier-free  EXISTS (... wp.tier='starter')
 *       * entitlement-sub EXISTS (... subscription_entitlements e WHERE e.user_id = auth.uid() AND status IN(...))
 *       * support         is_support()
 *       * append-only     INSERT-only (UPDATE/DELETE policy 부재)
 *       * unguarded       USING (TRUE) (예: authenticated-all-read)
 *   - adversarial fixture: (attacker_role, target.table, target.operation) → 정책 매칭
 *   - 미매핑 정책 0건 fail-loud (drift 즉시 탐지) — `assertAllPoliciesClassified`
 *   - --strict mode: 미분류 정책 발견 시 evaluator 자체가 throw
 *
 * 모드 (W16 후보, ADR-0007 예정): pg_test_role hybrid
 *   - SET LOCAL ROLE + SET request.jwt.claims 기반 실측 검증
 *   - false-negative 위험 분야 (EXISTS 서브쿼리, JWT custom claim) 보강
 *
 * 책임 agent: backend (본화) + security (위협 모델 라벨)
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface RlsAdvCase {
  id: string;
  description: string;
  threat_model?: string;
  input: {
    attacker_role:
      | "anon"
      | "authenticated"
      | "service_role"
      | "other_user"
      | "external_webhook_caller"
      | "app_developer_misuse";
    target: {
      table?: string;
      user_id?: string;
      queried_user_id?: string;
      endpoint?: string;
      // W15 신규: 부가 컨텍스트
      pack_tier?: "starter" | "core" | "topik" | string;
      completed_at?: string | null;
    };
    payload?: Record<string, unknown> & { sql?: string };
  };
  expected: {
    blocked: boolean;
    row_count?: number;
    http_status?: number;
    audit_logged?: boolean;
  };
}

export interface EvalResult {
  pass: boolean;
  diff: string[];
}

export type PolicyCategory =
  | "owner-only"
  | "pack-tier-free"
  | "entitlement-subquery"
  | "support"
  | "append-only" // 분류 후 처리 (table-level 라벨, 개별 policy는 owner-only insert + 결손 update/delete)
  | "unguarded"; // USING (TRUE) — authenticated 전체 읽기 등

interface Policy {
  table: string;
  name: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL";
  role: "anon" | "authenticated" | "support" | "all" | string;
  using?: string;
  withCheck?: string;
  rawText: string;
  category?: PolicyCategory;
}

const RLS_MIGRATION_PATH = "infra/supabase/migrations/0002_rls.sql";

// ============================================================================
// Parser — multi-line CREATE POLICY 강화
// ============================================================================

/**
 * 0002_rls.sql 파싱.
 *
 * 한 statement는 `CREATE POLICY ... ;` 단위. multi-line USING(...) WITH CHECK(...) 모두 처리.
 *
 * 알고리즘:
 *   1) 라인 단위 주석(`-- ...`) 제거
 *   2) `;` 단위 split (PL/pgSQL `$$ ... $$` 함수 제외 — is_support()는 ENABLE 블록 위에 있으므로
 *      간단히 CREATE POLICY 로 시작하는 statement만 필터)
 *   3) 각 statement 내에서 `CREATE POLICY <name> ON <table>` 추출
 *   4) `FOR <op>` / `TO <role>` / `USING ( ... )` / `WITH CHECK ( ... )` 절을 균형 괄호로 추출
 */
export function parsePolicies(sql: string): Policy[] {
  // 1) 라인 단위 `-- ...` 주석 제거 (단, 문자열 내부는 본 SQL에 없음)
  const stripped = sql
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");

  // 2) statement split (`;` 기준). CREATE FUNCTION ... $$ ... $$ 도 한 statement.
  const statements = splitStatements(stripped).filter((s) =>
    /^\s*CREATE POLICY/i.test(s),
  );

  const policies: Policy[] = [];
  for (const stmt of statements) {
    const policy = parseSinglePolicy(stmt);
    if (policy) policies.push(policy);
  }
  return policies;
}

function splitStatements(sql: string): string[] {
  // 단순 split — 본 프로젝트는 dollar-quoted 함수($$ ... $$)를 ENABLE 블록 상단에 1개만 사용.
  // 그 함수는 CREATE POLICY 가 아니므로 split 결과에서 자연 제외됨.
  return sql.split(/;\s*(?=\n|$)/).map((s) => s.trim()).filter(Boolean);
}

function parseSinglePolicy(stmt: string): Policy | null {
  const text = stmt.replace(/\s+/g, " ").trim();

  // CREATE POLICY <name> ON <table>
  const head = /^CREATE POLICY\s+(\w+)\s+ON\s+(\w+)\b/i.exec(text);
  if (!head) return null;
  const name = head[1];
  const table = head[2];
  let rest = text.slice(head[0].length);

  let operation: Policy["operation"] = "ALL";
  let role: Policy["role"] = "all";
  let using: string | undefined;
  let withCheck: string | undefined;

  // FOR <op>
  const forMatch = /^\s*FOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL)\b/i.exec(rest);
  if (forMatch) {
    operation = forMatch[1].toUpperCase() as Policy["operation"];
    rest = rest.slice(forMatch[0].length);
  }

  // TO <role>
  const toMatch = /^\s*TO\s+(\w+)\b/i.exec(rest);
  if (toMatch) {
    role = toMatch[1].toLowerCase();
    rest = rest.slice(toMatch[0].length);
  }

  // USING ( ... ) — 균형 괄호
  const usingMatch = /^\s*USING\s*\(/i.exec(rest);
  if (usingMatch) {
    rest = rest.slice(usingMatch[0].length);
    const { body, remainder } = takeBalancedParen(rest);
    using = body.trim();
    rest = remainder;
  }

  // WITH CHECK ( ... ) — 균형 괄호
  const withMatch = /^\s*WITH\s+CHECK\s*\(/i.exec(rest);
  if (withMatch) {
    rest = rest.slice(withMatch[0].length);
    const { body, remainder } = takeBalancedParen(rest);
    withCheck = body.trim();
    rest = remainder;
  }

  return {
    table,
    name,
    operation,
    role,
    using,
    withCheck,
    rawText: stmt,
  };
}

/** 입력의 시작이 ')' 만나기 전까지의 본문을 반환 (균형 괄호). */
function takeBalancedParen(input: string): { body: string; remainder: string } {
  let depth = 1;
  let i = 0;
  for (; i < input.length; i++) {
    const ch = input[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) break;
    }
  }
  return { body: input.slice(0, i), remainder: input.slice(i + 1) };
}

// ============================================================================
// Classifier — 정책 의도 라벨링
// ============================================================================

const OWNER_PATTERNS = [
  /auth\.uid\(\)\s*=\s*user_id/i,
  /user_id\s*=\s*auth\.uid\(\)/i,
  /auth\.uid\(\)\s*=\s*merged_to_user_id/i,
  /auth\.uid\(\)\s*=\s*reporter_user_id/i,
  /actor\s*=\s*'user:'\s*\|\|\s*auth\.uid\(\)/i,
];

export function isOwnerOnlyPredicate(expr: string | undefined): boolean {
  if (!expr) return false;
  return OWNER_PATTERNS.some((re) => re.test(expr));
}

export function isPackTierFreePredicate(expr: string | undefined): boolean {
  if (!expr) return false;
  return /tier\s*=\s*'starter'/i.test(expr) || /tier\s*=\s*'free'/i.test(expr);
}

export function isEntitlementSubqueryPredicate(expr: string | undefined): boolean {
  if (!expr) return false;
  return /subscription_entitlements/i.test(expr) && /e\.user_id\s*=\s*auth\.uid\(\)/i.test(expr);
}

export function isSupportPredicate(expr: string | undefined): boolean {
  if (!expr) return false;
  return /is_support\s*\(\s*\)/i.test(expr);
}

export function isUnguardedPredicate(expr: string | undefined): boolean {
  if (!expr) return false;
  return /^\s*TRUE\s*$/i.test(expr);
}

/** 정책 1건을 단일 카테고리로 분류 (우선순위: support > owner > entitlement > pack-tier > unguarded). */
export function classifyPolicy(p: Policy): PolicyCategory | undefined {
  const expr = p.using ?? p.withCheck;
  if (isSupportPredicate(expr)) return "support";
  if (isOwnerOnlyPredicate(expr)) return "owner-only";
  if (isEntitlementSubqueryPredicate(expr)) return "entitlement-subquery";
  if (isPackTierFreePredicate(expr)) return "pack-tier-free";
  if (isUnguardedPredicate(expr)) return "unguarded";
  return undefined;
}

/**
 * append-only 패턴은 table 단위 라벨이므로 별도 추론.
 * 본 프로젝트:
 *   - learning_attempts: INSERT + SELECT만 정의, UPDATE/DELETE 부재
 *   - subscription_entitlements: SELECT만 정의 (write는 service_role)
 *   - daily_usage: SELECT만
 *   - audit_log: SELECT만
 *   - user_word_states: SELECT/INSERT만 (UPDATE/DELETE 부재 — service_role)
 */
const APPEND_ONLY_TABLES = new Set([
  "learning_attempts",
  "subscription_entitlements",
  "daily_usage",
  "audit_log",
  "user_word_states",
]);

// ============================================================================
// Drift 감지 — 미분류 정책 fail-loud
// ============================================================================

export interface ClassificationReport {
  total: number;
  classified: number;
  unmapped: Policy[];
  byCategory: Record<PolicyCategory, number>;
}

export function classifyAllPolicies(policies: Policy[]): {
  policies: Policy[];
  report: ClassificationReport;
} {
  const byCategory: Record<PolicyCategory, number> = {
    "owner-only": 0,
    "pack-tier-free": 0,
    "entitlement-subquery": 0,
    "support": 0,
    "append-only": 0,
    "unguarded": 0,
  };
  const unmapped: Policy[] = [];
  const annotated = policies.map((p) => {
    const cat = classifyPolicy(p);
    if (cat) {
      byCategory[cat]++;
      return { ...p, category: cat };
    }
    unmapped.push(p);
    return p;
  });
  return {
    policies: annotated,
    report: {
      total: policies.length,
      classified: policies.length - unmapped.length,
      unmapped,
      byCategory,
    },
  };
}

/**
 * --strict 모드 가드. 미분류 1건이라도 있으면 throw.
 * runner.ts에서 startup 시 호출.
 */
export function assertAllPoliciesClassified(strict: boolean): ClassificationReport {
  const { report } = classifyAllPolicies(policies());
  if (strict && report.unmapped.length > 0) {
    const lines = report.unmapped.map((p) => `  - ${p.table}.${p.name} [${p.operation}/${p.role}]`);
    throw new Error(
      `[rls] DRIFT — ${report.unmapped.length} policies could not be classified:\n${lines.join("\n")}\n` +
        `Add a classifier in scripts/eval/rls.ts or document the new pattern in ADR-0004.`,
    );
  }
  return report;
}

// ============================================================================
// Loader (cached)
// ============================================================================

function loadPolicies(): Policy[] {
  const path = join(process.cwd(), RLS_MIGRATION_PATH);
  const sql = readFileSync(path, "utf-8");
  return parsePolicies(sql);
}

let _cachedPolicies: Policy[] | null = null;
function policies(): Policy[] {
  if (!_cachedPolicies) _cachedPolicies = loadPolicies();
  return _cachedPolicies;
}

// 테스트 / runner reset
export function _resetCache() {
  _cachedPolicies = null;
}

// ============================================================================
// Operation 추론
// ============================================================================

function operationFromEndpoint(
  endpoint: string | undefined,
  sql: string | undefined,
): Policy["operation"] {
  const text = `${endpoint ?? ""} ${sql ?? ""}`.toUpperCase();
  if (/POST/.test(text) || /INSERT/.test(text)) return "INSERT";
  if (/PATCH|PUT/.test(text) || /UPDATE/.test(text)) return "UPDATE";
  if (/DELETE/.test(text)) return "DELETE";
  return "SELECT";
}

function rolesMatch(
  policyRole: string,
  attackerRole: RlsAdvCase["input"]["attacker_role"],
): boolean {
  if (policyRole === "all") return true;
  if (policyRole === attackerRole) return true;
  // other_user는 authenticated의 부분집합 (cross-user 시나리오)
  if (policyRole === "authenticated" && attackerRole === "other_user") return true;
  // service_role 은 RLS bypass — Supabase에서 BYPASSRLS attribute. 정책 무관 통과.
  // (본 evaluator는 service_role 케이스를 별도 분기 처리)
  return false;
}

// ============================================================================
// Adversarial case 평가
// ============================================================================

function check(field: string, actual: unknown, expected: unknown, diff: string[]): void {
  if (expected === undefined) return;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    diff.push(`${field}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
  }
}

export function evaluateRlsCase(c: RlsAdvCase): EvalResult {
  const diff: string[] = [];
  const all = policies();
  const i = c.input;
  const table = i.target.table;
  if (!table) {
    diff.push("target.table required");
    return { pass: false, diff };
  }

  const operation = operationFromEndpoint(i.target.endpoint, i.payload?.sql as string | undefined);

  // service_role: BYPASSRLS — 모든 정책 우회. expected.blocked=false 가 정상.
  if (i.attacker_role === "service_role") {
    const blocked = false;
    const httpStatus = 200;
    check("blocked", blocked, c.expected.blocked, diff);
    check("http_status", httpStatus, c.expected.http_status, diff);
    return { pass: diff.length === 0, diff };
  }

  const tablePolicies = all.filter((p) => p.table === table);
  const matching = tablePolicies.filter(
    (p) => (p.operation === operation || p.operation === "ALL") && rolesMatch(p.role, i.attacker_role),
  );

  let blocked: boolean;
  let rowCount: number | undefined;
  let httpStatus: number | undefined;

  if (matching.length === 0) {
    // 매칭 정책 없음 → RLS default-deny.
    // 특수 케이스: append-only 테이블의 UPDATE/DELETE 시도는 명시적 차단 의도.
    blocked = true;
    if (i.attacker_role === "anon") {
      // anon이 INSERT/UPDATE/DELETE 시 PostgREST는 401(인증 필요) 또는 403.
      // SELECT의 경우 row hide → 200 + row_count=0.
      httpStatus = operation === "SELECT" ? 200 : 401;
      if (operation === "SELECT") rowCount = 0;
    } else {
      // authenticated/other_user 의 missing policy → 403 (forbidden).
      // SELECT는 row hide → 200 + 0.
      if (operation === "SELECT") {
        httpStatus = 200;
        rowCount = 0;
      } else {
        httpStatus = 403;
      }
    }
  } else {
    // 매칭 정책 존재 — 술어 평가
    if (operation === "SELECT") {
      // pack-tier-free 정책이 있고 anon인데 비-starter pack 시도 → row hide
      const allPackTierFree = matching.every((p) => isPackTierFreePredicate(p.using));
      if (allPackTierFree && i.target.pack_tier && i.target.pack_tier !== "starter") {
        blocked = true;
        rowCount = 0;
        httpStatus = 200;
      } else if (i.target.queried_user_id && i.target.user_id) {
        // owner-only cross-user
        const allOwnerOnly = matching.every((p) => isOwnerOnlyPredicate(p.using));
        if (allOwnerOnly && i.target.queried_user_id !== i.target.user_id) {
          blocked = true;
          rowCount = 0;
          httpStatus = 200;
        } else {
          blocked = false;
          httpStatus = 200;
        }
      } else {
        blocked = false;
        httpStatus = 200;
      }
    } else if (operation === "INSERT" || operation === "UPDATE") {
      const allOwnerOnly = matching.every((p) => isOwnerOnlyPredicate(p.withCheck));
      const payloadUser = (i.payload as { user_id?: string } | undefined)?.user_id;
      if (allOwnerOnly && payloadUser && payloadUser !== i.target.user_id) {
        blocked = true;
        httpStatus = 403;
      } else if (
        operation === "UPDATE" &&
        table === "account_deletion_requests" &&
        i.target.completed_at
      ) {
        // deletion_owner_update 정책의 USING에 (auth.uid() = user_id AND completed_at IS NULL).
        // completed_at 이 set이면 해당 row는 USING 술어 false → 차단.
        blocked = true;
        httpStatus = 403;
      } else {
        blocked = false;
        httpStatus = 200;
      }
    } else if (operation === "DELETE") {
      // 본 프로젝트는 DELETE policy 거의 부재 — append-only.
      blocked = true;
      httpStatus = 403;
    } else {
      blocked = false;
      httpStatus = 200;
    }
  }

  // append-only 추가 단언: 해당 테이블에 UPDATE/DELETE 시도 시 무조건 blocked.
  if (
    APPEND_ONLY_TABLES.has(table) &&
    (operation === "UPDATE" || operation === "DELETE") &&
    !blocked
  ) {
    blocked = true;
    httpStatus = 403;
  }

  check("blocked", blocked, c.expected.blocked, diff);
  check("http_status", httpStatus, c.expected.http_status, diff);
  if (c.expected.row_count !== undefined) {
    check("row_count", rowCount ?? null, c.expected.row_count, diff);
  }

  return { pass: diff.length === 0, diff };
}
