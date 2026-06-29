/**
 * Motion Tokens — drop-in replacement
 * Source: dash2zero Design System / swarm-handoff work order §2
 * Target file: packages/design-tokens/src/motion.ts
 *
 * 변경 요약:
 *   - duration token: 4개 → 8개 (motion.tap/fast/base/stage/spring/sheet/progress/count)
 *   - easing: spring · shake easing 신규 추가
 *   - rnEasing: React Native Easing.bezier 매핑 신규 export
 *
 * 호환성:
 *   - 기존 motion.fast (80ms) → motion.tap 으로 이름 변경
 *   - 기존 motion.medium (200ms) → motion.base 로 이름 변경
 *   - frontend agent: PR에서 1:1 sweep 수행
 */

import { Easing as RNEasing } from "react-native";

export const duration = {
  "motion.tap":       80,   // 버튼 press scale, choice tap
  "motion.fast":     150,   // toggle color cross-fade, hover lift
  "motion.base":     200,   // default — tab swap, modal backdrop, icon morph
  "motion.stage":    240,   // ✨ NEW · lesson stage transition signature
  "motion.spring":   320,   // ✨ NEW · toggle knob, badge pop, ✓ scale-in
  "motion.sheet":    360,   // bottom sheet rise, slide page push
  "motion.slow":     300,   // hero scale-in (legacy)
  "motion.progress": 600,   // ✨ NEW · progress bar fill, chain advance
  "motion.count":    900,   // ✨ NEW · counter tick-up — hero motion, 1× per screen
} as const;

export const easing = {
  out:    "cubic-bezier(0.16, 1, 0.3, 1)",        // 95% — defaults
  in:     "cubic-bezier(0.7, 0, 0.84, 0)",        // exits
  inOut:  "cubic-bezier(0.65, 0, 0.35, 1)",       // toggles, color shifts
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",    // ✨ NEW · overshoot for pop / badge / knob
  shake:  "cubic-bezier(0.36, 0.07, 0.19, 0.97)", // ✨ NEW · incorrect answer
} as const;

/** React Native Animated.timing 직접 사용 */
export const rnEasing = {
  out:    RNEasing.bezier(0.16, 1, 0.3, 1),
  in:     RNEasing.bezier(0.7, 0, 0.84, 0),
  inOut:  RNEasing.bezier(0.65, 0, 0.35, 1),
  spring: RNEasing.bezier(0.34, 1.56, 0.64, 1),
  shake:  RNEasing.bezier(0.36, 0.07, 0.19, 0.97),
} as const;

/**
 * Shadow tokens — unchanged from D-022 sealed values, kept here so the
 * motion.ts file remains the single source of truth for animated values.
 */
export const shadows = {
  s0:        "none",
  s1:        "0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.06)",
  s2:        "0 4px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.10)",
  "dark.s1": "0 1px 2px rgba(0,0,0,0.4)",
  "dark.s2": "0 8px 24px rgba(0,0,0,0.5)",
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken   = keyof typeof easing;
export type ShadowToken   = keyof typeof shadows;
