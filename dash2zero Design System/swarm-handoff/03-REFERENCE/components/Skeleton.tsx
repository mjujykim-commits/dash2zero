/**
 * Skeleton — shimmer loading placeholder
 *
 * Source: dash2zero Design System / swarm-handoff work order §6 (P0-4)
 * Target path: apps/mobile/src/components/d022/Skeleton.tsx
 *
 * docs/design/STATE_PATTERNS.md가 Home / Lesson loading 상태를 skeleton으로
 * 지시. 현재 ActivityIndicator 사용 중인 두 화면을 교체한다.
 *
 * useDelayedLoading(150ms): 짧은 fetch에서 skeleton이 깜빡이는 문제 회피.
 *
 * Reduce-motion: shimmer 비활성, 정적 muted 박스로 표시.
 */

import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, type ViewStyle } from "react-native";
import { lightColors } from "@dash2zero/design-tokens";

export function Skeleton({
  width = "100%",
  height = 16,
  radius = 8,
  style,
}: {
  width?: number | "100%";
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const [reduce, setReduce] = useState(false);
  const t = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let m = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => m && setReduce(v));
    return () => { m = false; };
  }, []);

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1.0, duration: 700, useNativeDriver: true }),
        Animated.timing(t, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, t]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: lightColors["surface.muted"],
          opacity: reduce ? 0.7 : t,
        },
        style,
      ]}
    />
  );
}

/**
 * 지연된 로딩 표시 훅 — 150ms 이상 로딩 중일 때만 true를 반환.
 * 짧은 fetch에서 skeleton 깜빡임 회피.
 */
export function useDelayedLoading(isLoading: boolean, delay = 150) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setShow(false);
      return;
    }
    const id = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(id);
  }, [isLoading, delay]);
  return show;
}
