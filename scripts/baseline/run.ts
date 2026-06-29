/**
 * dash2zero — Baseline Metrics Runner (M3 W15)
 *
 * 목적
 *   Supabase staging에 적용된 vw_baseline_* view 4개를 실행하여 JSON 산출.
 *   CI nightly + on-demand (PR comment) 양쪽 호출 포인트 가정.
 *
 * 사용
 *   pnpm tsx scripts/baseline/run.ts \
 *     --supabase-url=https://<staging-project>.supabase.co \
 *     --service-role-key=<key> \
 *     [--out=baseline-report.json] \
 *     [--apply-views]   # queries.sql을 먼저 적용 (CREATE OR REPLACE)
 *
 *   환경변수: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *
 * 의존성
 *   - scripts/baseline/queries.sql  (analytics SoT)
 *   - scripts/seed/synthetic-baseline.ts (devops, staging seed)
 *   - infra/supabase/migrations/0001_init.sql 적용 완료
 *
 * 결정
 *   - prod 호스트 차단: synthetic-baseline.ts와 동일 정책 (staging|stg|dev|local).
 *   - --apply-views는 service_role 필요 (CREATE VIEW 권한). CI에서는 별도 step 권고.
 *   - JSON 형식: { computed_at, summary, breakdowns: { d3_retention[], d1_streak[],
 *     lesson_complete_rate[], paywall_funnel[] } }.
 *   - 임계값 비교는 본 runner에서 수행하지 않음 (planner PRD §8과 분리).
 *     CI gate가 필요하면 별도 wrapper에서 본 JSON을 소비.
 *
 * 책임 agent: analytics
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ----------------------------------------------------------------------------
// CLI
// ----------------------------------------------------------------------------

interface Args {
  supabaseUrl: string;
  serviceRoleKey: string;
  out: string;
  applyViews: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (k: string, fallback?: string) => {
    const hit = argv.find((a) => a.startsWith(`--${k}=`));
    return hit ? hit.split("=").slice(1).join("=") : fallback;
  };
  const url = get("supabase-url", process.env.SUPABASE_URL);
  const key = get("service-role-key", process.env.SUPABASE_SERVICE_ROLE_KEY);
  const out = get("out", "baseline-report.json")!;
  const applyViews = argv.includes("--apply-views");
  if (!url || !key) {
    console.error("FATAL: --supabase-url 와 --service-role-key (또는 환경변수) 필요");
    process.exit(2);
  }
  return { supabaseUrl: url, serviceRoleKey: key, out, applyViews };
}

function assertNotProd(url: string) {
  const allow = process.env.ALLOW_NON_STAGING === "1";
  const hostOK = /(staging|stg|dev|local)/i.test(url);
  if (!hostOK && !allow) {
    console.error(
      `FATAL: '${url}' 호스트가 staging/dev로 식별되지 않습니다.\n` +
      `       prod 보호를 위해 abort. ALLOW_NON_STAGING=1 후 재실행 (책임 호출자).`,
    );
    process.exit(3);
  }
}

// ----------------------------------------------------------------------------
// SQL 적용 (옵션)
// ----------------------------------------------------------------------------

async function applyQueriesSql(supa: SupabaseClient): Promise<void> {
  // queries.sql 파일 로드. Supabase JS SDK는 다중 statement 실행을 직접 지원
  // 하지 않으므로, supabase.rpc('exec_sql', { sql }) 형태의 헬퍼 함수가
  // 사전 배포되어 있다고 가정 (infra/supabase/migrations에 정의 권고).
  // 헬퍼 미배포 시 본 단계는 manual psql 실행으로 대체.
  const here = dirname(fileURLToPath(import.meta.url));
  const sqlPath = resolve(here, "queries.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  const { error } = await supa.rpc("exec_sql", { sql });
  if (error) {
    if (/function .* does not exist/i.test(error.message)) {
      console.warn(
        "[apply-views] exec_sql RPC 미배포. queries.sql을 psql로 수동 적용 필요:\n" +
        `  psql "<staging connection>" -f ${sqlPath}`,
      );
      return;
    }
    throw new Error(`apply queries.sql 실패: ${error.message}`);
  }
  console.log(`[apply-views] queries.sql 적용 완료 (${sql.length} bytes)`);
}

// ----------------------------------------------------------------------------
// View 조회
// ----------------------------------------------------------------------------

interface BaselineReport {
  computed_at: string;
  supabase_url: string;
  summary: SummaryRow | null;
  breakdowns: {
    d3_retention: D3Row[];
    d1_streak: D1Row[];
    lesson_complete_rate: LcRow[];
    paywall_funnel: PfRow[];
  };
  errors: string[];
}

interface SummaryRow {
  d3_retention_pct_14d: number | null;
  d1_streak_pct_14d: number | null;
  lesson_complete_rate_pct_14d: number | null;
  paywall_view_to_purchase_pct_14d: number | null;
  computed_at: string;
}
interface D3Row {
  cohort_local_day: string;
  entitlement_band: string;
  cohort_size: number;
  retained_d3: number;
  d3_retention_pct: number | null;
}
interface D1Row {
  cohort_local_day: string;
  entitlement_band: string;
  d0_completers: number;
  d1_streak_holders: number;
  d1_streak_pct: number | null;
}
interface LcRow {
  attempt_band: string;
  entitlement_band: string;
  outcome: string;
  started_user_days: number;
  completed_user_days: number;
  completion_rate_pct: number | null;
}
interface PfRow {
  view_day: string;
  source: string;
  paywall_views: number;
  signin_required_views: number;
  purchased_within_7d: number;
  view_to_purchase_pct: number | null;
}

async function selectAll<T>(
  supa: SupabaseClient,
  view: string,
  errors: string[],
): Promise<T[]> {
  const { data, error } = await supa.from(view).select("*");
  if (error) {
    errors.push(`view '${view}' select 실패: ${error.message}`);
    return [];
  }
  return (data ?? []) as T[];
}

async function selectSummary(
  supa: SupabaseClient,
  errors: string[],
): Promise<SummaryRow | null> {
  const { data, error } = await supa
    .from("vw_baseline_summary")
    .select("*")
    .single();
  if (error) {
    errors.push(`view 'vw_baseline_summary' select 실패: ${error.message}`);
    return null;
  }
  return data as SummaryRow;
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------

async function main() {
  const args = parseArgs();
  assertNotProd(args.supabaseUrl);

  console.log("=".repeat(70));
  console.log("dash2zero — Baseline Metrics Runner");
  console.log(`  url=${args.supabaseUrl}`);
  console.log(`  out=${args.out}`);
  console.log(`  apply_views=${args.applyViews}`);
  console.log("=".repeat(70));

  const supa = createClient(args.supabaseUrl, args.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (args.applyViews) {
    await applyQueriesSql(supa);
  }

  const errors: string[] = [];
  const summary = await selectSummary(supa, errors);
  const d3 = await selectAll<D3Row>(supa, "vw_baseline_d3_retention", errors);
  const d1 = await selectAll<D1Row>(supa, "vw_baseline_d1_streak", errors);
  const lc = await selectAll<LcRow>(supa, "vw_baseline_lesson_complete_rate", errors);
  const pf = await selectAll<PfRow>(supa, "vw_baseline_paywall_funnel", errors);

  const report: BaselineReport = {
    computed_at: new Date().toISOString(),
    supabase_url: args.supabaseUrl,
    summary,
    breakdowns: {
      d3_retention: d3,
      d1_streak: d1,
      lesson_complete_rate: lc,
      paywall_funnel: pf,
    },
    errors,
  };

  writeFileSync(args.out, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\n[output] ${args.out} 작성 완료 (${JSON.stringify(report).length} bytes)`);

  if (summary) {
    console.log("\n[summary 14d]");
    console.log(`  D3 retention      : ${fmt(summary.d3_retention_pct_14d)}%`);
    console.log(`  D1 streak         : ${fmt(summary.d1_streak_pct_14d)}%`);
    console.log(`  Lesson completion : ${fmt(summary.lesson_complete_rate_pct_14d)}%`);
    console.log(`  Paywall->purchase : ${fmt(summary.paywall_view_to_purchase_pct_14d)}%`);
  }

  if (errors.length > 0) {
    console.error(`\n[errors] ${errors.length}건:`);
    for (const e of errors) console.error(`  - ${e}`);
    // 4 view 중 일부만 누락이면 nightly에서 알림 (exit 0 유지),
    // summary 자체가 null이면 비정상 (exit 1)
    if (!summary) process.exit(1);
  }
  console.log("\nDONE.");
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "n/a";
  return n.toFixed(2);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
