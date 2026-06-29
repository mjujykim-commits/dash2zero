/**
 * useMotionPress — 인터랙티브 Pressable에 Motion v1.1 표준 모션을 1줄로 부여하는 hook
 *
 * Source of Truth:
 *   - docs/brand/MOTION_SYSTEM_SPEC.md v1.1 §1, §2 Q-MOTION-1/4/5
 *   - packages/design-tokens/src/motion.ts (MOTION_TOKENS)
 *
 * 사용 패턴:
 *   const motion = useMotionPress();
 *   <Pressable
 *     onPressIn={motion.onPressIn}
 *     onPressOut={motion.onPressOut}
 *     onPress={() => { motion.haptic(); doStuff(); }}
 *     style={[styles.card, motion.shadowStyle]}
 *   >
 *     <Animated.View style={motion.animatedStyle}>...</Animated.View>
 *   </Pressable>
 *
 * 4-rule Merge Gate:
 *   - Rule 1 (GPU): scale transform + opacity only, useNativeDriver: true
 *   - Rule 2 (Lifecycle): AccessibilityInfo listener cleanup
 *   - Rule 3 (Timing): MOTION_TOKENS.DURATION_QUICK + EASE_BOUNCE 일관
 *   - Rule 4: 본 hook은 skeleton 아님 — Shimmer 컴포넌트 별도
 */

import { hapticImpact, type ImpactStyle } from "@/src/lib/haptics";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated } from "react-native";

import { MOTION_TOKENS } from "@dash2zero/design-tokens";

interface UseMotionPressOptions {
  /** 비활성 시 모션·햅틱 미적용 */
  disabled?: boolean;
  /** Haptic 강도 — 기본 Light. 'none'이면 미발화. */
  hapticStyle?: "light" | "medium" | "heavy" | "none";
  /** Reduce Motion 시 추가 동작 — 기본은 scale 미발생 (Q-MOTION-5 정합) */
}

export function useMotionPress(options: UseMotionPressOptions = {}) {
  const { disabled = false, hapticStyle = "light" } = options;

  const scale = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      setReduceMotion(enabled);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const animateTo = (value: number) => {
    if (reduceMotion || disabled) return;
    Animated.timing(scale, {
      toValue: value,
      duration: MOTION_TOKENS.DURATION_QUICK,
      easing: MOTION_TOKENS.EASE_BOUNCE,
      useNativeDriver: true,
    }).start();
  };

  return {
    reduceMotion,

    /** Pressable에 그대로 전달 */
    onPressIn: () => animateTo(MOTION_TOKENS.PRESSED_SCALE),
    onPressOut: () => animateTo(1),

    /**
     * Haptic 발화. onPress 핸들러 안에서 호출.
     * disabled / 'none' / global toggle off 시 noop (D-024).
     */
    haptic: () => {
      if (disabled || hapticStyle === "none") return;
      void hapticImpact(hapticStyle as ImpactStyle);
    },

    /** Animated.View style — transform scale (Rule 1 정합) */
    animatedStyle: {
      transform: [{ scale }] as const,
    },

    /**
     * Pressable의 style 콜백에서 pressed 상태별 그림자 보정에 사용 (Q-MOTION-1 [b]).
     * style={[card, ({ pressed }) => motion.shadowAdjust(pressed)]}
     */
    shadowAdjust: (pressed: boolean) =>
      pressed && !reduceMotion
        ? { shadowOpacity: 0.06, elevation: 1 } // 기본 0.1 × 0.6
        : null,
  };
}
