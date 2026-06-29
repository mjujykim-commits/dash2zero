/**
 * StageReveal — Lesson stage transition signature motion
 *
 * Source: dash2zero Design System / swarm-handoff work order §3 (P0-1)
 * Target path: apps/mobile/src/components/d022/StageReveal.tsx
 *
 * Notice → Hear → Meaning → Retrieve 4단계의 stage 전환에서 RR / gloss / example /
 * quiz 옵션을 stagger fade-up으로 등장시킴.
 *
 * Reduce-motion: translateY 비활성, opacity 240ms fade만 유지.
 *
 * 사용 예:
 *   <StageReveal stageKey={`${cursor}-gloss`} delayIndex={1}>
 *     <Text>{word.gloss}</Text>
 *   </StageReveal>
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
  const ty      = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduce(v));
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (v) => setReduce(v)
    );
    return () => { mounted = false; sub.remove(); };
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
