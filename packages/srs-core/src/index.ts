/**
 * @dash2zero/srs-core — Leitner 5-Stage SRS (single SoT)
 *
 * ADR-0006 (Accepted, 2026-05-11). R-12 resolution.
 *
 * 본 패키지는 dash2zero SRS 로직의 유일한 source of truth다:
 *   - apps/mobile/src/srs/leitner.ts → 본 패키지 re-export (Phase 2, W16)
 *   - apps/api/edge-functions/_shared/srs.ts → 본 패키지 ESM dist sync (Phase 2, W16)
 *   - scripts/eval/srs.ts (golden runner) → 본 패키지 직접 import (Phase 2, W16)
 *
 * Source of Truth (도메인 규칙):
 *   - C-08  : Leitner 5단계, 1/3/7/14/30일 간격
 *   - CC2-10: 오답 시 max(1, current-1)
 *   - CC3-05: same-cycle 2연속 오답 → stage 1 + weak; Mastered 1회 오답 → stage 4
 *   - CC2-09: Mastered 후 30/60/120일 재노출은 MVP 제외 (30일 maintenance만)
 *   - CC-17 : 04:00 사용자 로컬 자정 기준 next_due_at 계산
 *
 * 호환:
 *   - Deno (Edge Functions runtime)
 *   - Node 20+ (vitest, scripts/eval)
 *   - RN/Hermes (mobile)
 *   외부 의존 0. Node-only API 금지. Intl + 표준 Date 만 사용.
 *
 * 검증:
 *   - packages/srs-core/src/index.spec.ts (vitest)
 *   - scripts/eval/srs.ts (golden 50 case)
 *
 * 본 W15 스켈레톤은 export 시그니처만 표시한다.
 * 실제 함수 본문은 backend가 W15-W16에 apps/mobile/src/srs/leitner.ts에서 이전한다.
 */

// ──────────────────────────────────────────────────────────────────────
// 타입
// ──────────────────────────────────────────────────────────────────────

export type SrsStage = 1 | 2 | 3 | 4 | 5;

/**
 * Leitner 단계별 다음 due 간격 (일).
 * stage 5 도달 = Mastered, 30일 maintenance review (CC2-09).
 */
export declare const STAGE_INTERVAL_DAYS: Readonly<Record<SrsStage, number>>;

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

// ──────────────────────────────────────────────────────────────────────
// 함수 시그니처 (W15 스켈레톤 — 본 구현은 backend가 W15-W16에 이전)
// ──────────────────────────────────────────────────────────────────────

/**
 * 04:00 로컬 기준 calendar day key. 'YYYY-MM-DD' 반환.
 * 04:00 이전은 전날로 판정 (CC-17, CC3-08).
 */
export declare function localDay04(date: Date, timezone: string): string;

/**
 * 사용자 로컬 04:00 기준의 같은 due cycle인지 판정.
 */
export declare function isSameDueCycle(a: Date | null, b: Date, timezone: string): boolean;

/**
 * 다음 due 시각 계산 — 사용자 로컬 04:00 기준 N일 뒤.
 */
export declare function computeNextDue(stage: SrsStage, occurredAt: Date, timezone: string): Date;

/**
 * SRS 전이의 핵심 함수. 부작용 없음.
 *
 * 적용 순서:
 *   1. 정답: stage++, 5에서 Mastered 진입
 *   2. 오답:
 *      a. same-cycle + 직전 오답 → stage 1 + weak (CC3-05)
 *      b. Mastered(5) 1회 오답 → stage 4 (CC3-05 보호)
 *      c. 일반 → max(1, stage-1)
 */
export declare function applySrsTransition(
  state: UserWordStateInput,
  attempt: AttemptInput,
): SrsTransitionResult;

/**
 * 신규 단어 학습 시작 시 초기 UserWordState 생성.
 */
export declare function initialUserWordState(occurredAt: Date, timezone: string): SrsTransitionResult;
