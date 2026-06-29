/**
 * Shared SRS module for Edge Functions (R-12 해결)
 *
 * Deno runtime 호환. mobile/src/srs/leitner.ts와 동일 로직.
 * Edge Functions에서는 monorepo workspace import 제약이 있어
 * 본 파일이 사실상의 sibling copy. 둘은 매 sprint review에서 정합성 검증.
 *
 * M3 진입 시 esm 빌드로 단일 source 제공 검토.
 */

export type SrsStage = 1 | 2 | 3 | 4 | 5;

export const STAGE_INTERVAL_DAYS: Readonly<Record<SrsStage, number>> = {
  1: 1, 2: 3, 3: 7, 4: 14, 5: 30,
} as const;

export interface UwsState {
  stage: SrsStage;
  weak: boolean;
  correct_count: number;
  incorrect_count: number;
  last_attempt_at: Date | null;
  last_attempt_correct: boolean | null;
  mastered_at: Date | null;
}

export interface AttemptInput {
  correct: boolean;
  occurred_at: Date;
  timezone: string;
}

export interface SrsResult extends UwsState {
  next_due_at: Date;
}

export function localDay04(date: Date, timezone: string): string {
  const shifted = new Date(date.getTime() - 4 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(shifted);
}

export function isSameDueCycle(a: Date | null, b: Date, tz: string): boolean {
  if (!a) return false;
  return localDay04(a, tz) === localDay04(b, tz);
}

export function computeNextDue(stage: SrsStage, occurredAt: Date, timezone: string): Date {
  const days = STAGE_INTERVAL_DAYS[stage];
  const baseDayKey = localDay04(occurredAt, timezone);
  const baseDate = new Date(baseDayKey + "T00:00:00Z");
  baseDate.setUTCDate(baseDate.getUTCDate() + days);
  return new Date(baseDate.getTime() + 4 * 60 * 60 * 1000);
}

export function applySrs(state: UwsState, attempt: AttemptInput): SrsResult {
  if (attempt.correct) {
    const nextStage = Math.min(5, state.stage + 1) as SrsStage;
    return {
      stage: nextStage,
      weak: false,
      correct_count: state.correct_count + 1,
      incorrect_count: state.incorrect_count,
      last_attempt_at: attempt.occurred_at,
      last_attempt_correct: true,
      next_due_at: computeNextDue(nextStage, attempt.occurred_at, attempt.timezone),
      mastered_at: state.stage < 5 && nextStage === 5 ? attempt.occurred_at : state.mastered_at,
    };
  }

  const sameCycle = isSameDueCycle(state.last_attempt_at, attempt.occurred_at, attempt.timezone);
  const sameCycleConsecutiveWrong = sameCycle && state.last_attempt_correct === false;

  let nextStage: SrsStage;
  let weak: boolean;

  if (sameCycleConsecutiveWrong) {
    nextStage = 1; weak = true;
  } else if (state.stage === 5) {
    nextStage = 4; weak = false;
  } else {
    nextStage = Math.max(1, state.stage - 1) as SrsStage;
    weak = state.weak;
  }

  return {
    stage: nextStage,
    weak,
    correct_count: state.correct_count,
    incorrect_count: state.incorrect_count + 1,
    last_attempt_at: attempt.occurred_at,
    last_attempt_correct: false,
    next_due_at: computeNextDue(nextStage, attempt.occurred_at, attempt.timezone),
    mastered_at: nextStage === 5 ? state.mastered_at : null,
  };
}
