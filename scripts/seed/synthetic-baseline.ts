/**
 * Synthetic Baseline Seed — dash2zero (M3 W15)
 *
 * 목적
 * ----
 * Supabase **staging** 환경에 14일분 cohort 시뮬레이션 데이터를 삽입하여
 * analytics agent의 `scripts/baseline/queries.sql` view (Day-3 retention,
 * Day-1 streak retention, lesson_complete_rate, paywall_view_to_purchase)
 * 가 동작하는 표면을 보장한다.
 *
 * 사용 위치
 * --------
 *   - dev/staging만. **prod 절대 금지** (assertion으로 차단).
 *   - real-user 수집은 M5에서 dogfood + closed beta로 보강 예정.
 *     본 seed는 W15 시점 "view smoke" + analytics 쿼리 회귀 기준선 제공.
 *
 * 분포 가설 (devops 자율 결정 — 향후 real-user 수치로 교체)
 * ----------------------------------------------------------
 *   가입 N명 (기본 200) → 코호트 Day 0 시작.
 *   - lesson_started      : 100% (정의상 가입 = onboarding 직후 lesson_started 1회)
 *   - lesson_completed    : 65%  (Lesson Completion Rate baseline 가설)
 *   - word_mastered (1+)  : 40%  (lesson_completed 사용자 중 stage 5 도달)
 *   - paywall_viewed      : 30%  (paywall trigger: lesson 3회 또는 7일차)
 *   - subscription_purchase_succeeded : paywall_viewed의 4% (free→paid 가설)
 *   - abandoned (Day 0 lesson_started 후 미복귀) : Day 1 35%, Day 3 60%, Day 7 78%
 *
 *   Day-K retention (Day 0 lesson_started 코호트 → Day K 재방문 비율)
 *   - Day 1 : 65% (1 - 35%)
 *   - Day 3 : 40% (1 - 60%)
 *   - Day 7 : 22% (1 - 78%)
 *   - 14d 윈도 내 매일 0~ +2일 jitter로 분포 자연화
 *
 *   Day-1 streak retention (Day 0 lesson_completed → Day 1 lesson_completed)
 *   - 50% (lesson_completed 한 사용자 중 streak 1일 유지)
 *
 * 멱등성 (idempotent)
 * -------------------
 *   - 동일 cohort_label로 재실행 시 기존 행 DELETE 후 재삽입.
 *   - cohort_label은 `synth_<YYYYMMDD>_<seed>` 형식, --seed 인자로 결정성 확보.
 *
 * 보안
 * ----
 *   - service_role 키 사용 (RLS 우회 필요 — seed 데이터 삽입). prod URL 검출 시 즉시 abort.
 *   - 사용자 이메일은 `synth+<uuid>@dash2zero.local` (실제 도메인 아님).
 *   - PII 미주입. profile.display_name = "synth-user-<n>".
 *
 * 사용
 * ----
 *   pnpm tsx scripts/seed/synthetic-baseline.ts \
 *     --supabase-url=https://<staging-project>.supabase.co \
 *     --service-role-key=<key> \
 *     --users=200 \
 *     --days=14 \
 *     --seed=20260511 \
 *     --cohort-label=synth_20260511_dev \
 *     [--dry-run]
 *
 *   환경변수도 가능: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *
 * 의존
 * ----
 *   - infra/supabase/migrations/0001_init.sql 적용 완료
 *   - analytics의 scripts/baseline/queries.sql view 정의와 컬럼 정합 (lesson_attempts, etc.)
 *
 * 책임 agent: devops (M3 W15)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID, createHash } from "node:crypto";

// ============================================================================
// CLI 파싱
// ============================================================================

export interface Args {
  supabaseUrl: string;
  serviceRoleKey: string;
  users: number;
  days: number;
  seed: number;
  cohortLabel: string;
  dryRun: boolean;
  /** 결정성 검증용 anchor (ADR-0007 §3 권고 3) — default `new Date()`. spec에서 fixed Date 주입 가능. */
  now?: Date;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (k: string, fallback?: string) => {
    const hit = argv.find((a) => a.startsWith(`--${k}=`));
    return hit ? hit.split("=").slice(1).join("=") : fallback;
  };
  const url = get("supabase-url", process.env.SUPABASE_URL);
  const key = get("service-role-key", process.env.SUPABASE_SERVICE_ROLE_KEY);
  const users = Number(get("users", "200"));
  const days = Number(get("days", "14"));
  const seedStr = get("seed", String(20260511));
  const seed = Number(seedStr);
  const cohortLabel = get("cohort-label", `synth_${seedStr}_dev`)!;
  const dryRun = argv.includes("--dry-run");

  if (!url || !key) {
    console.error("FATAL: --supabase-url 와 --service-role-key (또는 환경변수) 필요");
    process.exit(2);
  }
  if (!Number.isFinite(users) || users <= 0 || users > 5000) {
    console.error("FATAL: --users 는 1~5000 범위 (현재 5000은 staging 보호 상한)");
    process.exit(2);
  }
  if (days < 7 || days > 30) {
    console.error("FATAL: --days 는 7~30 (M3 baseline 윈도 14d 기준)");
    process.exit(2);
  }
  return { supabaseUrl: url, serviceRoleKey: key, users, days, seed, cohortLabel, dryRun };
}

// ============================================================================
// 안전 가드 — prod 절대 금지
// ============================================================================

function assertNotProd(url: string) {
  // staging 프로젝트 식별 규칙: 호스트 prefix에 staging|stg|dev 포함, 또는 환경변수 ALLOW_NON_STAGING=1.
  const allow = process.env.ALLOW_NON_STAGING === "1";
  const hostOK = /(staging|stg|dev|local)/i.test(url);
  if (!hostOK && !allow) {
    console.error(
      `FATAL: '${url}' 호스트가 staging/dev로 식별되지 않습니다.\n` +
      `       prod 보호를 위해 abort. 강제 진행하려면 ALLOW_NON_STAGING=1 후 재실행 (책임은 호출자).`
    );
    process.exit(3);
  }
}

// ============================================================================
// 결정적 PRNG (mulberry32) — seed 동일 시 동일 분포
// ============================================================================

export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// 분포 시뮬레이션
// ============================================================================

export interface SyntheticUser {
  user_id: string;
  email_hash: string;
  signup_at: Date;
  cohort_day: number; // 0..days-1
  // 행동 플래그
  lesson_started: boolean;
  lesson_completed_d0: boolean;
  word_mastered: boolean;
  paywall_viewed: boolean;
  purchased: boolean;
  // retention 플래그
  returned_d1: boolean;
  returned_d3: boolean;
  returned_d7: boolean;
  streak_d1: boolean;
}

export interface Distribution {
  // Day 0 funnel
  lessonStartedRate: number;
  lessonCompletedRate: number; // P(complete | started)
  wordMasteredRate: number;    // P(mastered+ | completed)
  paywallViewRate: number;     // P(paywall | started)
  purchaseRate: number;        // P(purchase | paywall)
  // Retention
  d1RetentionRate: number;
  d3RetentionRate: number;
  d7RetentionRate: number;
  d1StreakRate: number;        // P(complete day1 | complete day0)
}

export const DEFAULT_DIST: Distribution = {
  lessonStartedRate: 1.0,
  lessonCompletedRate: 0.65,
  wordMasteredRate: 0.40,
  paywallViewRate: 0.30,
  purchaseRate: 0.04,
  d1RetentionRate: 0.65,
  d3RetentionRate: 0.40,
  d7RetentionRate: 0.22,
  d1StreakRate: 0.50,
};

export function simulate(args: Args, dist: Distribution = DEFAULT_DIST): SyntheticUser[] {
  const rand = mulberry32(args.seed);
  const now = args.now ?? new Date();
  // anchor: now - days (UTC midnight)
  const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  anchor.setUTCDate(anchor.getUTCDate() - args.days);

  const users: SyntheticUser[] = [];
  for (let i = 0; i < args.users; i++) {
    const cohortDay = Math.floor(rand() * args.days);
    const signupAt = new Date(anchor);
    signupAt.setUTCDate(signupAt.getUTCDate() + cohortDay);
    // jitter intra-day (0..86399s)
    signupAt.setUTCSeconds(signupAt.getUTCSeconds() + Math.floor(rand() * 86400));

    const userId = randomUUID();
    const emailHash = createHash("sha256")
      .update(`synth+${userId}@dash2zero.local|${args.seed}`)
      .digest("hex");

    const lessonStarted = rand() < dist.lessonStartedRate;
    const lessonCompletedD0 = lessonStarted && rand() < dist.lessonCompletedRate;
    const wordMastered = lessonCompletedD0 && rand() < dist.wordMasteredRate;
    const paywallViewed = lessonStarted && rand() < dist.paywallViewRate;
    const purchased = paywallViewed && rand() < dist.purchaseRate;

    // retention conditioned on lessonStarted
    const returnedD1 = lessonStarted && rand() < dist.d1RetentionRate;
    const returnedD3 = lessonStarted && rand() < dist.d3RetentionRate;
    const returnedD7 = lessonStarted && rand() < dist.d7RetentionRate;
    const streakD1 = lessonCompletedD0 && rand() < dist.d1StreakRate;

    users.push({
      user_id: userId,
      email_hash: emailHash,
      signup_at: signupAt,
      cohort_day: cohortDay,
      lesson_started: lessonStarted,
      lesson_completed_d0: lessonCompletedD0,
      word_mastered: wordMastered,
      paywall_viewed: paywallViewed,
      purchased,
      returned_d1: returnedD1,
      returned_d3: returnedD3,
      returned_d7: returnedD7,
      streak_d1: streakD1,
    });
  }
  return users;
}

// ============================================================================
// Insertion
// ============================================================================

interface InsertCounts {
  profiles: number;
  learning_attempts: number;
  paywall_events: number;
  purchases: number;
}

async function purgeCohort(supa: SupabaseClient, cohortLabel: string): Promise<void> {
  // 동일 cohort_label로 이전에 seed된 행 제거 (멱등성).
  // 가정: profiles.display_name LIKE `${cohortLabel}/%` 또는 별도 cohort_label 컬럼.
  // 본 시드 스크립트는 display_name prefix로 식별 (스키마 변경 회피).
  const prefix = `${cohortLabel}/`;
  const { data: rows, error } = await supa
    .from("profiles")
    .select("user_id")
    .like("display_name", `${prefix}%`);
  if (error) {
    throw new Error(`profiles select 실패: ${error.message}`);
  }
  const ids = (rows ?? []).map((r) => r.user_id);
  if (ids.length === 0) return;

  // 종속 테이블부터 (FK 역순). 실제 스키마에 맞게 확장.
  const cascadeTables = [
    "subscription_entitlements",
    "paywall_events",          // analytics events sink (가정)
    "learning_attempts",
    "user_word_states",
    "daily_usage",
    "guest_sessions",          // merged_to_user_id 매칭
  ];
  for (const t of cascadeTables) {
    const { error: delErr } = await supa.from(t).delete().in("user_id", ids);
    if (delErr && !/does not exist/i.test(delErr.message)) {
      console.warn(`[purge] ${t} delete 경고: ${delErr.message} (continue)`);
    }
  }
  const { error: profErr } = await supa.from("profiles").delete().in("user_id", ids);
  if (profErr) throw new Error(`profiles delete 실패: ${profErr.message}`);
  // auth.users는 service_role admin api 필요. 본 seed는 profiles만 정리.
  console.log(`[purge] cohort='${cohortLabel}' 기존 ${ids.length}건 제거`);
}

async function insertCohort(
  supa: SupabaseClient,
  users: SyntheticUser[],
  cohortLabel: string,
  args: Args,
): Promise<InsertCounts> {
  const counts: InsertCounts = { profiles: 0, learning_attempts: 0, paywall_events: 0, purchases: 0 };

  // 1. profiles 일괄 삽입 (auth.users 생성은 admin api 필요 — 본 seed는 profiles만 채워
  //    analytics view (lesson_attempts 기반 SQL)가 동작하도록 함. real-user는 M5)
  const profileRows = users.map((u) => ({
    user_id: u.user_id,
    display_name: `${cohortLabel}/synth-user-${u.user_id.slice(0, 8)}`,
    learning_motivation: "kpop",
    email_hash: u.email_hash,
    locale: "en-US",
    timezone: "America/Los_Angeles",
    age_attestation_at: u.signup_at.toISOString(),
    srs_started_at: u.lesson_started ? u.signup_at.toISOString() : null,
    created_at: u.signup_at.toISOString(),
    updated_at: u.signup_at.toISOString(),
  }));
  await chunkedInsert(supa, "profiles", profileRows, 200);
  counts.profiles = profileRows.length;

  // 2. learning_attempts — Day 0 / Day 1 / Day 3 / Day 7 재방문 시 row 생성
  //    스키마 가정: { id, user_id, word_id, attempted_at, correct, mode, local_day }
  const attemptRows: Array<Record<string, unknown>> = [];
  for (const u of users) {
    if (!u.lesson_started) continue;
    pushAttempt(attemptRows, u, 0, "lesson_start", false);
    if (u.lesson_completed_d0) pushAttempt(attemptRows, u, 0, "lesson_complete", true);
    if (u.word_mastered) pushAttempt(attemptRows, u, 0, "mastered", true);
    if (u.returned_d1) pushAttempt(attemptRows, u, 1, "lesson_start", false);
    if (u.streak_d1) pushAttempt(attemptRows, u, 1, "lesson_complete", true);
    if (u.returned_d3) pushAttempt(attemptRows, u, 3, "lesson_start", false);
    if (u.returned_d7) pushAttempt(attemptRows, u, 7, "lesson_start", false);
  }
  await chunkedInsert(supa, "learning_attempts", attemptRows, 500);
  counts.learning_attempts = attemptRows.length;

  // 3. paywall_events — analytics가 view에서 funnel 측정. 테이블이 없으면 skip.
  //    스키마 가정: { id, user_id, viewed_at, source, entitlement_status }
  const paywallRows: Array<Record<string, unknown>> = [];
  for (const u of users) {
    if (!u.paywall_viewed) continue;
    const viewedAt = new Date(u.signup_at);
    viewedAt.setUTCHours(viewedAt.getUTCHours() + 2); // 가입 2h 후 paywall 노출 가정
    paywallRows.push({
      id: randomUUID(),
      user_id: u.user_id,
      viewed_at: viewedAt.toISOString(),
      source: "after_lesson_3",
      entitlement_status: u.purchased ? "active" : "none",
    });
  }
  const paywallOK = await chunkedInsertSoft(supa, "paywall_events", paywallRows, 500);
  if (paywallOK) counts.paywall_events = paywallRows.length;

  // 4. subscription_entitlements — 구매 사용자만
  const entitlementRows: Array<Record<string, unknown>> = [];
  for (const u of users) {
    if (!u.purchased) continue;
    const startAt = new Date(u.signup_at);
    startAt.setUTCDate(startAt.getUTCDate() + 1);
    entitlementRows.push({
      user_id: u.user_id,
      product_id: "premium_monthly",
      store: "app_store",
      status: "active",
      starts_at: startAt.toISOString(),
      expires_at: new Date(startAt.getTime() + 30 * 86400_000).toISOString(),
      created_at: startAt.toISOString(),
      updated_at: startAt.toISOString(),
    });
  }
  const entOK = await chunkedInsertSoft(supa, "subscription_entitlements", entitlementRows, 200);
  if (entOK) counts.purchases = entitlementRows.length;

  return counts;
}

function pushAttempt(
  rows: Array<Record<string, unknown>>,
  u: SyntheticUser,
  dayOffset: number,
  kind: string,
  correct: boolean,
) {
  const at = new Date(u.signup_at);
  at.setUTCDate(at.getUTCDate() + dayOffset);
  // local_day = YYYY-MM-DD (UTC 기준 단순화. 실제 04:00 reset은 analytics 쿼리에서 처리)
  const localDay = at.toISOString().slice(0, 10);
  rows.push({
    id: randomUUID(),
    user_id: u.user_id,
    word_id: `synth-word-${(Math.abs(hash32(u.user_id + dayOffset)) % 600) + 1}`,
    attempted_at: at.toISOString(),
    correct,
    mode: kind.startsWith("lesson") ? "lesson" : "review",
    local_day: localDay,
  });
}

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

async function chunkedInsert(
  supa: SupabaseClient,
  table: string,
  rows: Array<Record<string, unknown>>,
  chunk: number,
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await supa.from(table).insert(slice);
    if (error) {
      throw new Error(`insert ${table} 실패 (chunk ${i}): ${error.message}`);
    }
  }
}

async function chunkedInsertSoft(
  supa: SupabaseClient,
  table: string,
  rows: Array<Record<string, unknown>>,
  chunk: number,
): Promise<boolean> {
  // 테이블 미존재 시 false 반환 (nightly 보강 대상으로만 표시)
  if (rows.length === 0) return true;
  try {
    await chunkedInsert(supa, table, rows, chunk);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/does not exist|relation .* does not exist|undefined_table/i.test(msg)) {
      console.warn(`[soft] ${table} 미존재 — skip (analytics가 view에서 LEFT JOIN 시 빈 결과 처리 필요)`);
      return false;
    }
    throw err;
  }
}

// ============================================================================
// main
// ============================================================================

async function main() {
  const args = parseArgs();
  assertNotProd(args.supabaseUrl);

  console.log("=".repeat(70));
  console.log("dash2zero — Synthetic Baseline Seed");
  console.log(`  url=${args.supabaseUrl}`);
  console.log(`  cohort_label=${args.cohortLabel}`);
  console.log(`  users=${args.users} days=${args.days} seed=${args.seed}`);
  console.log(`  dry_run=${args.dryRun}`);
  console.log("=".repeat(70));

  const dist = DEFAULT_DIST;
  const users = simulate(args, dist);

  // 분포 검증 출력
  const startedN = users.filter((u) => u.lesson_started).length;
  const completedN = users.filter((u) => u.lesson_completed_d0).length;
  const masteredN = users.filter((u) => u.word_mastered).length;
  const paywallN = users.filter((u) => u.paywall_viewed).length;
  const purchasedN = users.filter((u) => u.purchased).length;
  const d1N = users.filter((u) => u.returned_d1).length;
  const d3N = users.filter((u) => u.returned_d3).length;
  const d7N = users.filter((u) => u.returned_d7).length;
  const streakN = users.filter((u) => u.streak_d1).length;

  console.log("[simulate] funnel:");
  console.log(`  signup=${users.length}`);
  console.log(`  lesson_started=${startedN} (${pct(startedN, users.length)})`);
  console.log(`  lesson_completed=${completedN} (${pct(completedN, startedN)} of started)`);
  console.log(`  word_mastered=${masteredN} (${pct(masteredN, completedN)} of completed)`);
  console.log(`  paywall_viewed=${paywallN} (${pct(paywallN, startedN)} of started)`);
  console.log(`  purchased=${purchasedN} (${pct(purchasedN, paywallN)} of paywall)`);
  console.log("[simulate] retention (of started):");
  console.log(`  D1=${pct(d1N, startedN)} D3=${pct(d3N, startedN)} D7=${pct(d7N, startedN)}`);
  console.log(`  D1_streak=${pct(streakN, completedN)} (of D0 completed)`);

  if (args.dryRun) {
    console.log("[dry-run] DB 쓰기 생략. 종료.");
    return;
  }

  const supa = createClient(args.supabaseUrl, args.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await purgeCohort(supa, args.cohortLabel);
  const counts = await insertCohort(supa, users, args.cohortLabel, args);

  console.log("[insert] counts:");
  console.log(`  profiles=${counts.profiles}`);
  console.log(`  learning_attempts=${counts.learning_attempts}`);
  console.log(`  paywall_events=${counts.paywall_events}`);
  console.log(`  subscription_entitlements=${counts.purchases}`);
  console.log("DONE.");
}

function pct(num: number, denom: number): string {
  if (!denom) return "n/a";
  return `${((num / denom) * 100).toFixed(1)}%`;
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
