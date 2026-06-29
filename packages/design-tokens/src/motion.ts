/**
 * Motion Tokens — D-022 + Work Order W17 (D-028, 2026-05-27)
 *
 * Source of Truth:
 *   - dash2zero Design System / swarm-handoff/01-WORK-ORDER.md §2 (P0-0)
 *   - docs/brand/MOTION_SYSTEM_SPEC.md (v1.1 historical, D-023~D-027)
 *
 * 변경 이력:
 *   - D-023~D-027 (2026-05-21~22): MOTION_TOKENS capital case + Pulse/Shimmer/Press 상수 봉인
 *   - D-028 (2026-05-27): Work Order P0-0 drop-in 적용 — duration 객체 8키 확장 +
 *     easing.spring/shake 추가 + `rnEasing` React Native 직접 매핑 신규
 *
 * Backward compatibility 정책:
 *   - 기존 MOTION_TOKENS (capital case) 유지 — D-023~D-027 봉인 컴포넌트 8건 호환
 *     (NeonButton/ChoiceCard/Shimmer/PulseOverlay/JellySwitch/BottomSheet/useMotionPress + lesson screen)
 *   - 신규 duration/easing/rnEasing — Work Order 신규 컴포넌트 (StageReveal/MorphingKoreanWord/
 *     QuizOption/AudioButton)에서 사용
 *   - 두 API 공존 → M5 단계에서 정리 권고
 */

import { Easing, type EasingFunction } from "react-native";

// ============================================================================
// Work Order P0-0 — duration / easing / rnEasing (1차 표준)
// ============================================================================

export const duration = {
  "motion.tap":       80,   // 버튼 press scale, choice tap
  "motion.fast":     150,   // toggle color cross-fade, hover lift
  "motion.base":     200,   // default — tab swap, modal backdrop, icon morph
  "motion.stage":    240,   // ✨ Work Order · lesson stage transition signature
  "motion.spring":   320,   // ✨ Work Order · toggle knob, badge pop, ✓ scale-in
  "motion.sheet":    360,   // bottom sheet rise, slide page push
  "motion.slow":     300,   // hero scale-in (legacy)
  "motion.progress": 600,   // ✨ Work Order · progress bar fill, chain advance
  "motion.count":    900,   // ✨ Work Order · counter tick-up — hero motion, 1× per screen
} as const;

export const easing = {
  out:    "cubic-bezier(0.16, 1, 0.3, 1)",        // 95% — defaults
  in:     "cubic-bezier(0.7, 0, 0.84, 0)",        // exits
  inOut:  "cubic-bezier(0.65, 0, 0.35, 1)",       // toggles, color shifts
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",    // ✨ Work Order · overshoot for pop / badge / knob
  shake:  "cubic-bezier(0.36, 0.07, 0.19, 0.97)", // ✨ Work Order · incorrect answer
  // D-022 호환 alias (CSS 표기 — 디자이너 도구/스토리북용)
  bounce:     "cubic-bezier(0.34, 1.56, 0.64, 1)",
  decelerate: "cubic-bezier(0.22, 1, 0.36, 1)",
  exit:       "cubic-bezier(0.32, 0, 0.67, 0)",
} as const;

/** React Native Animated.timing 직접 사용 — Work Order P0-0 신규 export */
export const rnEasing = {
  out:    Easing.bezier(0.16, 1, 0.3, 1),
  in:     Easing.bezier(0.7, 0, 0.84, 0),
  inOut:  Easing.bezier(0.65, 0, 0.35, 1),
  spring: Easing.bezier(0.34, 1.56, 0.64, 1),
  shake:  Easing.bezier(0.36, 0.07, 0.19, 0.97),
} as const;

// ============================================================================
// LEGACY — MOTION_TOKENS (D-023~D-027 봉인, 기존 컴포넌트 호환)
// ============================================================================

export const MOTION_TOKENS = {
  // Easing — Work Order rnEasing과 동일 함수
  EASE_BOUNCE: rnEasing.spring,
  EASE_DECELERATE: Easing.bezier(0.22, 1, 0.36, 1),
  EASE_EXIT: Easing.bezier(0.32, 0, 0.67, 0),

  // Durations — Work Order duration과 동기
  DURATION_QUICK: duration["motion.fast"],   // 150
  DURATION_NORMAL: duration["motion.slow"],  // 300
  DURATION_SLOW: 450,

  REDUCE_MOTION_FADE_DURATION: 150,

  // Shake Deflection
  SHAKE_AMPLITUDE: 6,
  SHAKE_TOTAL_DURATION: duration["motion.sheet"], // 360 (Work Order §4.2: shake easing 360ms)

  // Pulse Ripple
  PULSE_SCALE_START: 0,
  PULSE_SCALE_END: 2.2,
  PULSE_OPACITY_START: 0.4,
  PULSE_OPACITY_END: 0,
  PULSE_DURATION: 450,

  // Skeleton Shimmer
  SHIMMER_LOOP_DURATION: 1600,

  // Button Press
  PRESSED_SCALE: 0.96,
  PRESSED_SHADOW_OPACITY_RATIO: 0.6,

  // AudioButton (Work Order §7 정합, D-028 token 일령화)
  AUDIO_RING_DURATION: 1400,    // playing 시 ring expansion 1cycle
  AUDIO_SPINNER_DURATION: 900,  // loading conic spinner 1회전
  AUDIO_PULSE_HALF: 700,        // shadow pulse 0↔1 half cycle (총 1400ms)
} as const;

export type MotionToken = keyof typeof MOTION_TOKENS;

// ============================================================================
// Shadow tokens (unchanged from D-022)
// ============================================================================

export const shadows = {
  s0:        "none",
  s1:        "0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.06)",
  s2:        "0 4px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.10)",
  "dark.s1": "0 1px 2px rgba(0,0,0,0.4)",
  "dark.s2": "0 8px 24px rgba(0,0,0,0.5)",
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
export type ShadowToken = keyof typeof shadows;

// ============================================================================
// Easing 함수 alias (D-024 호환)
// ============================================================================

export const easingFn: Record<"bounce" | "decelerate" | "exit", EasingFunction> = {
  bounce: MOTION_TOKENS.EASE_BOUNCE,
  decelerate: MOTION_TOKENS.EASE_DECELERATE,
  exit: MOTION_TOKENS.EASE_EXIT,
};
