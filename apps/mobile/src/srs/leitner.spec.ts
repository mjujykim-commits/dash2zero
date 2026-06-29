/**
 * Leitner SRS — 단위 테스트 (M2-S3)
 *
 * EVALUATION_SCENARIOS §2의 SRS Golden 50 case 중 핵심 분포만 단위로 검증.
 * M3 진입 시 yaml로 옮기고 evaluation runner가 일괄 실행.
 */

import { describe, expect, it } from "vitest";
import { applySrsTransition, computeNextDue, initialUserWordState, isSameDueCycle, localDay04 } from "./leitner";

const TZ = "America/Los_Angeles";

function makeState(overrides: Partial<Parameters<typeof applySrsTransition>[0]> = {}) {
  return {
    stage: 1 as const,
    weak: false,
    correct_count: 0,
    incorrect_count: 0,
    last_attempt_at: null,
    last_attempt_correct: null,
    next_due_at: new Date("2026-05-08T11:00:00Z"),
    mastered_at: null,
    ...overrides,
  };
}

describe("localDay04 (CC-17 04:00 로컬 자정)", () => {
  it("PT 03:30 → 전날", () => {
    // PT(=UTC-7 in summer/PDT) 2026-05-08 03:30 = UTC 2026-05-08 10:30
    expect(localDay04(new Date("2026-05-08T10:30:00Z"), TZ)).toBe("2026-05-07");
  });
  it("PT 04:30 → 당일", () => {
    expect(localDay04(new Date("2026-05-08T11:30:00Z"), TZ)).toBe("2026-05-08");
  });
});

describe("isSameDueCycle", () => {
  it("같은 calendar day (04:00 기준) → true", () => {
    const a = new Date("2026-05-08T15:00:00Z"); // PT 08:00
    const b = new Date("2026-05-09T05:00:00Z"); // PT 22:00
    expect(isSameDueCycle(a, b, TZ)).toBe(true);
  });
  it("04:00 경계 넘으면 false", () => {
    const a = new Date("2026-05-08T15:00:00Z"); // PT 08:00
    const b = new Date("2026-05-09T11:30:00Z"); // PT 04:30 (다음 cycle)
    expect(isSameDueCycle(a, b, TZ)).toBe(false);
  });
});

describe("정답 케이스 (10 of golden 50)", () => {
  it("SRS-001: stage 1 정답 → stage 2", () => {
    const state = makeState({ stage: 1 });
    const result = applySrsTransition(state, {
      correct: true,
      occurred_at: new Date("2026-05-08T17:00:00Z"),
      timezone: TZ,
    });
    expect(result.stage).toBe(2);
    expect(result.correct_count).toBe(1);
    expect(result.weak).toBe(false);
    expect(result.mastered_at).toBeNull();
  });

  it("SRS-005: stage 4 정답 → stage 5 + Mastered (CC2-09 30일 maintenance)", () => {
    const state = makeState({ stage: 4, correct_count: 3 });
    const occurred = new Date("2026-05-08T17:00:00Z");
    const result = applySrsTransition(state, { correct: true, occurred_at: occurred, timezone: TZ });
    expect(result.stage).toBe(5);
    expect(result.mastered_at).toEqual(occurred);
  });

  it("SRS-006: stage 5 정답 → stage 5 유지 (max), Mastered 보존", () => {
    const masteredAt = new Date("2026-05-01T17:00:00Z");
    const state = makeState({ stage: 5, mastered_at: masteredAt, correct_count: 4 });
    const result = applySrsTransition(state, {
      correct: true,
      occurred_at: new Date("2026-05-08T17:00:00Z"),
      timezone: TZ,
    });
    expect(result.stage).toBe(5);
    expect(result.mastered_at).toEqual(masteredAt); // 보존
    expect(result.correct_count).toBe(5);
  });
});

describe("오답 케이스 (15 of golden 50)", () => {
  it("SRS-011: stage 3 오답 → stage 2 (max(1, stage-1))", () => {
    const state = makeState({ stage: 3, correct_count: 2 });
    const result = applySrsTransition(state, {
      correct: false,
      occurred_at: new Date("2026-05-08T17:00:00Z"),
      timezone: TZ,
    });
    expect(result.stage).toBe(2);
    expect(result.weak).toBe(false);
    expect(result.incorrect_count).toBe(1);
  });

  it("SRS-013: stage 1 오답 → stage 1 (max=1)", () => {
    const state = makeState({ stage: 1 });
    const result = applySrsTransition(state, {
      correct: false,
      occurred_at: new Date("2026-05-08T17:00:00Z"),
      timezone: TZ,
    });
    expect(result.stage).toBe(1);
  });

  it("SRS-015 (CC3-05): stage 5 1회 오답 → stage 4 (Mastered 보호)", () => {
    const state = makeState({ stage: 5, mastered_at: new Date("2026-05-01"), correct_count: 4 });
    const result = applySrsTransition(state, {
      correct: false,
      occurred_at: new Date("2026-05-08T17:00:00Z"),
      timezone: TZ,
    });
    expect(result.stage).toBe(4);
    expect(result.weak).toBe(false);
    expect(result.mastered_at).toBeNull(); // Mastered 해제
  });
});

describe("같은 cycle 2연속 오답 (5 of golden 50, CC3-05)", () => {
  it("SRS-021: stage 3 → 첫 오답 → stage 2 (정상)", () => {
    const state = makeState({ stage: 3 });
    const result = applySrsTransition(state, {
      correct: false,
      occurred_at: new Date("2026-05-08T17:00:00Z"),
      timezone: TZ,
    });
    expect(result.stage).toBe(2);
    expect(result.weak).toBe(false);
  });

  it("SRS-022: stage 3에서 같은 cycle 2연속 오답 → stage 1 + weak=true", () => {
    const state = makeState({
      stage: 3,
      last_attempt_at: new Date("2026-05-08T15:00:00Z"),
      last_attempt_correct: false, // 직전 오답
      incorrect_count: 1,
    });
    const result = applySrsTransition(state, {
      correct: false,
      occurred_at: new Date("2026-05-08T17:00:00Z"), // 같은 cycle (PT 같은 날 10:00)
      timezone: TZ,
    });
    expect(result.stage).toBe(1);
    expect(result.weak).toBe(true);
    expect(result.incorrect_count).toBe(2);
  });

  it("SRS-023: 다른 cycle의 오답은 weak 적용 안 됨", () => {
    const state = makeState({
      stage: 3,
      last_attempt_at: new Date("2026-05-07T15:00:00Z"), // 전날
      last_attempt_correct: false,
    });
    const result = applySrsTransition(state, {
      correct: false,
      occurred_at: new Date("2026-05-08T17:00:00Z"),
      timezone: TZ,
    });
    expect(result.stage).toBe(2); // max(1, 3-1)
    expect(result.weak).toBe(false);
  });
});

describe("computeNextDue 간격", () => {
  it("stage 1 → 1일 후 04:00", () => {
    const due = computeNextDue(1, new Date("2026-05-08T17:00:00Z"), TZ);
    // 단순 24h 후가 아니라 calendar day + 1의 04:00 (UTC 근사)
    expect(due.getUTCDate()).toBeGreaterThan(8);
  });

  it("stage 5 → 30일 후", () => {
    const due = computeNextDue(5, new Date("2026-05-08T17:00:00Z"), TZ);
    const diffMs = due.getTime() - new Date("2026-05-08T17:00:00Z").getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(28);
    expect(diffDays).toBeLessThan(32);
  });
});

describe("initialUserWordState", () => {
  it("초기 단어 학습 시 stage=1, due=1일 후", () => {
    const occurred = new Date("2026-05-08T17:00:00Z");
    const result = initialUserWordState(occurred, TZ);
    expect(result.stage).toBe(1);
    expect(result.weak).toBe(false);
    expect(result.correct_count).toBe(0);
    expect(result.incorrect_count).toBe(0);
    expect(result.next_due_at.getTime()).toBeGreaterThan(occurred.getTime());
  });
});
