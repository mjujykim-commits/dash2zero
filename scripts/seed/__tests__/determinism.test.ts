/**
 * synthetic-baseline — Determinism Test
 *
 * 목적 (ADR-0007 §3 권고 3, 2026-05-21 Accepted 봉인):
 *   같은 seed로 두 번 호출 → simulate 결과가 byte-identical임을 검증.
 *   본 테스트가 통과해야 M3 게이트 #4 (3-source baseline 14d) evidence 채택 가능.
 *
 * 실행:
 *   pnpm tsx scripts/seed/__tests__/determinism.test.ts
 *
 * Exit codes:
 *   0 = PASS (모든 assertion 통과)
 *   1 = FAIL (assertion 실패 또는 예외)
 *
 * CI 통합:
 *   .github/workflows/weekly-baseline.yml에서 nightly cron 또는 weekly PR 단계 강제 호출.
 *   본 테스트가 fail이면 baseline runner 진행 차단 (synthetic source 결정성 깨짐 → R1 trigger).
 *
 * Seed 변경 정책 (Q-ADR-0007-1):
 *   분기 경계(03/06/09/12) seed 변경 시 본 spec의 EXPECTED_SEED를 갱신 + ADR-0007 §3에 seed 이력 1줄 추가.
 */

import { strict as assert } from "node:assert";
import { simulate, mulberry32, type Args, DEFAULT_DIST } from "../synthetic-baseline";

// ============================================================================
// 1. mulberry32 PRNG 자체 결정성 (low-level)
// ============================================================================

function testPrngDeterminism() {
  const seed = 20260511;
  const r1 = mulberry32(seed);
  const r2 = mulberry32(seed);

  const samples1 = Array.from({ length: 1000 }, () => r1());
  const samples2 = Array.from({ length: 1000 }, () => r2());

  assert.deepEqual(samples1, samples2, "mulberry32 not deterministic for same seed");
  assert.notDeepEqual(
    samples1,
    Array.from({ length: 1000 }, () => mulberry32(seed + 1)()),
    "mulberry32 produced same output for different seeds",
  );
}

// ============================================================================
// 2. simulate() 전체 출력 byte-identical (high-level)
// ============================================================================

function testSimulateDeterminism() {
  // anchor 결정성 보장 — args.now 주입 (ADR-0007 §3 권고 3)
  const fixedNow = new Date("2026-05-25T12:00:00Z");
  const baseArgs: Args = {
    supabaseUrl: "https://test.invalid",
    serviceRoleKey: "test-only-not-used-in-simulate",
    users: 200,
    days: 14,
    seed: 20260511,
    cohortLabel: "synth_20260511_test",
    dryRun: true,
    now: fixedNow,
  };

  const run1 = simulate(baseArgs, DEFAULT_DIST);
  const run2 = simulate(baseArgs, DEFAULT_DIST);

  // JSON 직렬화 byte-identical (ADR-0007 §3 unit test 코드 예시 정합)
  const json1 = JSON.stringify(run1);
  const json2 = JSON.stringify(run2);
  assert.equal(json1, json2, "simulate output not byte-identical for same seed + args");

  // 사용자 수 sanity
  assert.equal(run1.length, baseArgs.users, "user count mismatch");

  // 분포 sanity (DEFAULT_DIST 정합 — ±5% 허용)
  const completed = run1.filter((u) => u.lesson_completed_d0).length;
  const completedRate = completed / run1.length;
  assert.ok(
    Math.abs(completedRate - DEFAULT_DIST.lessonCompletedRate) < 0.05,
    `lesson_completed rate drift: actual ${completedRate.toFixed(3)} vs target ${DEFAULT_DIST.lessonCompletedRate}`,
  );

  // 다른 seed → 다른 출력 (negative assertion)
  const run3 = simulate({ ...baseArgs, seed: 99999999 }, DEFAULT_DIST);
  assert.notEqual(
    JSON.stringify(run3),
    json1,
    "different seed produced same output (PRNG collision or constant output)",
  );
}

// ============================================================================
// 3. KPI band drift 사전 검증 (R4 Reversal Trigger 사전 알림)
// ============================================================================

/**
 * ADR-0007 §6 R4: synthetic 분포가 PRD §8.2 KPI target과 ±50% 이상 괴리 시 fast-path 재조정.
 * 본 테스트는 R4 trigger를 사전에 감지 — assertion fail이 아닌 warn 출력으로 사람 인지.
 */
function testKpiBandSanity() {
  const fixedNow = new Date("2026-05-25T12:00:00Z");
  const args: Args = {
    supabaseUrl: "https://test.invalid",
    serviceRoleKey: "test",
    users: 200,
    days: 14,
    seed: 20260511,
    cohortLabel: "synth_kpi_sanity",
    dryRun: true,
    now: fixedNow,
  };

  const users = simulate(args, DEFAULT_DIST);

  const d1Retention = users.filter((u) => u.returned_d1).length / users.length;
  const d3Retention = users.filter((u) => u.returned_d3).length / users.length;
  const purchaseFromPaywall =
    users.filter((u) => u.purchased).length /
    Math.max(1, users.filter((u) => u.paywall_viewed).length);

  // PRD §8.2 KPI band (Minimum tier) — 참고치 (Target은 더 높음)
  // D1 retention minimum 30%, D3 retention minimum 18%, paywall_to_purchase minimum 1.5%
  // R4 trigger: 본 synthetic이 minimum의 50%로 떨어지거나 (drift down) target의 200%로 올라가면 (drift up)
  const drifts: string[] = [];
  if (d1Retention < 0.30 * 0.5) drifts.push(`D1 retention drift down: ${d1Retention.toFixed(3)}`);
  if (d3Retention < 0.18 * 0.5) drifts.push(`D3 retention drift down: ${d3Retention.toFixed(3)}`);
  if (purchaseFromPaywall < 0.015 * 0.5)
    drifts.push(`paywall→purchase drift down: ${purchaseFromPaywall.toFixed(3)}`);

  if (drifts.length > 0) {
    console.warn("⚠️ R4 trigger candidates:", drifts.join("; "));
    console.warn("→ Owner 검토 권고: ADR-0007 §6 R4 (seed 재조정 fast-path)");
  } else {
    console.log("✓ KPI band drift check: all within R4 tolerance");
  }
}

// ============================================================================
// Runner
// ============================================================================

const TESTS: Array<[string, () => void]> = [
  ["mulberry32 PRNG determinism", testPrngDeterminism],
  ["simulate() output byte-identical", testSimulateDeterminism],
  ["KPI band drift (R4 sanity)", testKpiBandSanity],
];

let pass = 0;
let fail = 0;
const failures: string[] = [];

for (const [name, fn] of TESTS) {
  try {
    fn();
    console.log(`✓ ${name}`);
    pass += 1;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err instanceof Error ? err.message : String(err)}`);
    failures.push(name);
    fail += 1;
  }
}

console.log(`\n${pass}/${TESTS.length} passed${fail > 0 ? ` (${fail} failed)` : ""}`);
process.exit(fail > 0 ? 1 : 0);
