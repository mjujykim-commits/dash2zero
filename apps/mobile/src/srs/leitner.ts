/**
 * Leitner 5-Stage SRS — dash2zero 핵심 학습 알고리즘
 *
 * Source of Truth:
 *   - C-08 (REVIEW_QA §5): Leitner 5단계, 1/3/7/14/30일 간격
 *   - CC2-10 (SERVICE_REVIEW_QA §4): 오답 시 max(1, current-1)
 *   - CC3-05: same-cycle 2연속 오답 → stage 1 + weak; Mastered 1회 오답 → stage 4
 *   - CC2-09: Mastered 후 30/60/120일 재노출은 MVP 제외 (30일 maintenance만)
 *   - CC-17: 04:00 사용자 로컬 자정 기준 (next_due_at 계산)
 *
 * Validation:
 *   - EVALUATION_SCENARIOS §2 SRS Golden 50 case (M3 진입 시 yaml로 작성)
 *   - 본 파일의 단위 테스트 (leitner.spec.ts)
 *
 * 본 함수는 클라이언트와 서버(Edge Function) 양쪽에서 동일하게 호출되며
 * 서버가 SSOT. 충돌 시 server 결과 채택 (CC-04).
 */

export type SrsStage = 1 | 2 | 3 | 4 | 5;

/**
 * Leitner 단계별 다음 due 간격 (일).
 * stage 1 정답 → 3일 후 (stage 2 due_at 기준)
 * stage 5 도달 = Mastered, 30일 maintenance review (CC2-09)
 */
export const STAGE_INTERVAL_DAYS: Readonly<Record<SrsStage, number>> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
} as const;

export interface UserWordStateInput {
  stage: SrsStage;
  weak: boolean;
  correct_count: number;
  incorrect_count: number;
  last_attempt_at: Date | null;
  last_attempt_correct: boolean | null;
  next_due_at: Date;
  mastered_at: Date | null;
}

export interface AttemptInput {
  correct: boolean;
  occurred_at: Date;
  /** 사용자 로컬 IANA timezone (예: 'America/Los_Angeles') */
  timezone: string;
}

export interface SrsTransitionResult {
  stage: SrsStage;
  weak: boolean;
  correct_count: number;
  incorrect_count: number;
  last_attempt_at: Date;
  last_attempt_correct: boolean;
  next_due_at: Date;
  mastered_at: Date | null;
}

/**
 * 사용자 로컬 04:00 기준의 같은 due cycle인지 판정.
 *
 * 두 시각이 사용자 로컬 04:00 기준으로 동일한 calendar day에 속하면 같은 cycle.
 * (예: timezone='America/Los_Angeles', 03:30 PT는 전날, 04:30 PT는 당일)
 */
export function isSameDueCycle(a: Date | null, b: Date, timezone: string): boolean {
  if (!a) return false;
  return localDay04(a, timezone) === localDay04(b, timezone);
}

/**
 * 04:00 로컬 기준 calendar day key. 'YYYY-MM-DD' 반환.
 *
 * 04:00 이전은 전날로 판정 (CC-17, CC3-08).
 * Intl API 사용 — Hermes / Node 모두 지원.
 */
export function localDay04(date: Date, timezone: string): string {
  // 사용자 로컬 시각 - 4시간 → 그 결과의 calendar date
  const shifted = new Date(date.getTime() - 4 * 60 * 60 * 1000);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(shifted); // YYYY-MM-DD
}

/**
 * 다음 due 시각 계산 — 사용자 로컬 04:00 기준 N일 뒤.
 *
 * stage = 1일 때 occurred_at + 1일의 다음 04:00 시점.
 */
export function computeNextDue(stage: SrsStage, occurredAt: Date, timezone: string): Date {
  const days = STAGE_INTERVAL_DAYS[stage];
  // occurred_at의 사용자 로컬 04:00 기준 calendar day key
  const baseDayKey = localDay04(occurredAt, timezone);
  // baseDayKey + days = 다음 due day key
  const baseDate = new Date(baseDayKey + "T00:00:00Z");
  baseDate.setUTCDate(baseDate.getUTCDate() + days);
  // 그 날 사용자 로컬 04:00 시각 (UTC로 변환은 호출측에서 timezone-aware하게 처리)
  // 단순화: baseDate(UTC 00:00) + 04:00 + timezone offset 적용은 별도 helper에서.
  // MVP에서는 UTC 04:00을 근사로 사용하며, M3에서 timezone offset 보정 추가 (Q-AR-DOC-013).
  const nextDue = new Date(baseDate.getTime() + 4 * 60 * 60 * 1000);
  return nextDue;
}

/**
 * SRS 전이의 핵심 함수.
 *
 * 적용 순서:
 *   1. 정답 시: stage++, 5에서 Mastered 진입
 *   2. 오답 시:
 *      a. same-cycle + 직전 오답 → stage 1 + weak (CC3-05)
 *      b. Mastered(5) 1회 오답 → stage 4 (CC3-05 보호)
 *      c. 일반 → max(1, stage-1)
 *
 * 부작용 없음. UserWordState 새 값을 반환만 한다.
 */
export function applySrsTransition(state: UserWordStateInput, attempt: AttemptInput): SrsTransitionResult {
  const occurred = attempt.occurred_at;

  if (attempt.correct) {
    const nextStage = Math.min(5, state.stage + 1) as SrsStage;
    const masteredAt =
      state.stage < 5 && nextStage === 5
        ? occurred
        : state.mastered_at;

    return {
      stage: nextStage,
      weak: false, // 정답 시 weak 해제
      correct_count: state.correct_count + 1,
      incorrect_count: state.incorrect_count,
      last_attempt_at: occurred,
      last_attempt_correct: true,
      next_due_at: computeNextDue(nextStage, occurred, attempt.timezone),
      mastered_at: masteredAt,
    };
  }

  // 오답
  const sameCycle = isSameDueCycle(state.last_attempt_at, occurred, attempt.timezone);
  const sameCycleConsecutiveWrong = sameCycle && state.last_attempt_correct === false;

  let nextStage: SrsStage;
  let weak: boolean;

  if (sameCycleConsecutiveWrong) {
    // CC3-05: 같은 cycle 2연속 오답 → stage 1 + weak
    nextStage = 1;
    weak = true;
  } else if (state.stage === 5) {
    // CC3-05: Mastered 보호 — 1회 오답은 stage 4로
    nextStage = 4;
    weak = false;
  } else {
    // 일반 오답: max(1, stage-1)
    nextStage = Math.max(1, state.stage - 1) as SrsStage;
    weak = state.weak; // 이미 weak였다면 유지
  }

  return {
    stage: nextStage,
    weak,
    correct_count: state.correct_count,
    incorrect_count: state.incorrect_count + 1,
    last_attempt_at: occurred,
    last_attempt_correct: false,
    next_due_at: computeNextDue(nextStage, occurred, attempt.timezone),
    mastered_at: nextStage === 5 ? state.mastered_at : null,
  };
}

/**
 * 신규 단어 학습 시작 시 초기 UserWordState 생성.
 */
export function initialUserWordState(occurredAt: Date, timezone: string): SrsTransitionResult {
  const stage: SrsStage = 1;
  return {
    stage,
    weak: false,
    correct_count: 0,
    incorrect_count: 0,
    last_attempt_at: occurredAt,
    last_attempt_correct: null as unknown as boolean, // null in DB
    next_due_at: computeNextDue(stage, occurredAt, timezone),
    mastered_at: null,
  };
}
