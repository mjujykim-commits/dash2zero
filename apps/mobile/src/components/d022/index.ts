/**
 * D-022 K-pop Bold 컴포넌트 모음
 *
 * Source: docs/brand/THEME_DECISIONS.md (D-022 봉인 2026-05-18)
 *         + Motion Spec v1.1 (D-023~D-027)
 *         + Work Order W17 P0-0~P0-5 (D-028~D-029)
 *         + cleanup W18 D-3 (사이클 EE, 2026-06-02) — ChoiceCard + PulseOverlay 삭제
 *
 * 사용처: apps/mobile/app/* 13 화면. raw color/gradient 직접 사용 금지.
 */

export { GradientBackground } from "./GradientBackground";
export { GlassCard } from "./GlassCard";
export { NeonButton } from "./NeonButton";
export { GlowOrb } from "./GlowOrb";
export { GradientText } from "./GradientText";
export { Shimmer } from "./Shimmer";
export { JellySwitch } from "./JellySwitch";
export { BottomSheet } from "./BottomSheet";
export { AudioButton, type AudioState } from "./AudioButton";

// Work Order W17 P0-1 (D-029) — lesson stage 시그니처 모션
export { StageReveal } from "./StageReveal";
export { MorphingKoreanWord } from "./MorphingKoreanWord";

// Work Order W17 P0-2 (D-029) + L-M5-001 (D-032) — QuizOption with correct-passive
export { QuizOption } from "./QuizOption";

// P1 패키지 W18 D-4 (D-033 Reanimated install 후)
export { NumberCounter, useNumberCount } from "./NumberCounter";   // P1.1 Animated
export { StreakBadge } from "./StreakBadge";                       // P1.3 Animated
export { ToastProvider, useToast } from "./Toast";                 // P1.2 Reanimated (Provider + hook)
export { ConfirmSheet } from "./ConfirmSheet";                     // P1.5 BottomSheet wrapper (Animated, D-031 정합)
export { PullToRefresh } from "./PullToRefresh";                   // P1.4 Reanimated (M6 droppable, 60fps Profiler 첨부 조건)

// 삭제 이력:
//   - ChoiceCard.tsx 삭제 (사이클 EE, 2026-06-02) — D-029 QuizOption이 완전 교체
//   - PulseOverlay.tsx 삭제 (사이클 EE, 2026-06-02) — ChoiceCard 폐기 후 사용처 0
//   - MOTION_TOKENS legacy alias는 6 활성 사용처로 인해 M6+ 권고 (CLEANUP-MOTION-LEGACY-pre-audit §2 사이클 X)
