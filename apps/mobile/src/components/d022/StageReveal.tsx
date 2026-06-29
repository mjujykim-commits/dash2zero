/**
 * StageReveal — Lesson stage transition signature motion (Work Order §3 P0-1, D-029)
 *
 * Source of Truth:
 *   - dash2zero Design System / swarm-handoff/01-WORK-ORDER.md §3 + 03-REFERENCE/components/StageReveal.tsx
 *   - packages/design-tokens/src/motion.ts (duration / rnEasing)
 *
 * 사용처: lesson [wordId].tsx의 Notice → Hear → Meaning → Retrieve 4단계.
 *   RR / gloss / example / quiz option 4지선다를 stagger fade-up.
 *
 * 4-rule Merge Gate:
 *   - Rule 1 (GPU): opacity + transform translateY only — useNativeDriver: true
 *   - Rule 2 (Lifecycle): stageKey 변경 시 setValue로 초기화 후 재시작 → in-flight 안전
 *   - Rule 3 (Timing): duration["motion.stage"] 240ms + rnEasing.out, 60ms × delayIndex stagger
 *   - Rule 4: skeleton 아님 (N/A)
 *
 * Reduce Motion:
 *   - translateY 비활성 (transform: []), opacity 240ms fade만 유지 (Q-MOTION-5 정합)
 */

import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, type ViewStyle } from "react-native";

import { duration, rnEasing } from "@dash2zero/design-tokens";

type Props = {
  children: React.ReactNode;
  /** stage identity — 값이 바뀔 때만 entrance animation 재실행 */
  stageKey: string;
  /** 등장 stagger index — 0 = 즉시, 1+ = 60ms × index 지연 */
  delayIndex?: number;
  style?: ViewStyle;
};

export function StageReveal({ children, stageKey, delayIndex = 0, style }: Props) {
  const [reduce, setReduce] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduce(v));
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => setReduce(v));
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    opacity.setValue(0);
    ty.setValue(reduce ? 0 : 8);
    const delay = delayIndex * 60;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration["motion.stage"],
        easing: rnEasing.out,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(ty, {
        toValue: 0,
        duration: duration["motion.stage"],
        easing: rnEasing.out,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stageKey, delayIndex, reduce, opacity, ty]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: reduce ? [] : [{ translateY: ty }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
