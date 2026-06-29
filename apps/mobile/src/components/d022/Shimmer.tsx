/**
 * Shimmer — Skeleton loading placeholder (Motion v1.1 §3 Category B)
 *
 * Source of Truth:
 *   - docs/brand/MOTION_SYSTEM_SPEC.md v1.1 §2 Q-MOTION-2 [a] (expo-linear-gradient 표준)
 *   - docs/brand/MOTION_SYSTEM_SPEC.md v1.1 §3 Category B (좌→우 1.6s 무한 metallic wave)
 *   - packages/design-tokens/src/motion.ts (MOTION_TOKENS.SHIMMER_LOOP_DURATION)
 *   - docs/security/MOTION_SECURITY_REVIEW.md S-MOTION-5 (loop cleanup pattern)
 *
 * 4-rule Merge Gate:
 *   - Rule 1 (GPU): translateX (transform) + opacity only — useNativeDriver: true
 *   - Rule 2 (Lifecycle): unmount 시 loop.stop() 명시 호출 (S-MOTION-5 권고 정합)
 *   - Rule 3 (Timing): MOTION_TOKENS.SHIMMER_LOOP_DURATION 일관 사용
 *   - Rule 4 (Skeleton): 본 컴포넌트 자체가 Rule 4 evidence
 *
 * 사용 패턴:
 *   <Shimmer width={120} height={20} />                  — 정해진 크기
 *   <Shimmer style={{ flex: 1, height: 80 }} />          — flex 영역
 *   <Shimmer borderRadius={12} width={80} height={80} /> — 카드 / 아이콘 자리
 *
 * Reduce Motion 시: 정적 회색 placeholder (모션 차단, 시각 보존)
 */

import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { lightColors, MOTION_TOKENS } from "@dash2zero/design-tokens";

interface Props {
  width?: number | `${number}%` | "auto";
  height?: number;
  borderRadius?: number;
  /** 추가 스타일 (margin, flex 등) */
  style?: StyleProp<ViewStyle>;
}

export function Shimmer({ width = "100%", height = 16, borderRadius = 8, style }: Props) {
  // translateX -100% → 100% loop (Motion v1.1 §3 Category B)
  const translateX = useRef(new Animated.Value(-1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Reduce Motion detection
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

  // Shimmer loop — Rule 2 (Lifecycle): unmount 시 loop.stop() 강제 (S-MOTION-5)
  useEffect(() => {
    if (reduceMotion) {
      loopRef.current?.stop();
      loopRef.current = null;
      return;
    }

    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: MOTION_TOKENS.SHIMMER_LOOP_DURATION,
        useNativeDriver: true,
      }),
    );
    loop.start();
    loopRef.current = loop;

    return () => {
      loop.stop();
      // 다음 mount/restart 위해 초기값으로 재설정 (-1 = -100% 시작점)
      translateX.setValue(-1);
      loopRef.current = null;
    };
  }, [reduceMotion, translateX]);

  // translateX -1 ~ 1 → 실 pixel offset = containerWidth × (-1 ~ 1)
  // 즉 -containerWidth (오른쪽 영역 밖) → +containerWidth (왼쪽 영역 밖)
  const offsetX = translateX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-Math.max(containerWidth, 100), Math.max(containerWidth, 100)],
  });

  return (
    <View
      style={[
        styles.container,
        { width, height, borderRadius },
        style,
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessible
    >
      {!reduceMotion && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [{ translateX: offsetX }],
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={SHIMMER_GRADIENT}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}
    </View>
  );
}

// Metallic sheen — 좌 transparent → 중앙 highlight → 우 transparent (Motion v1.1 §3 Category B)
const SHIMMER_GRADIENT: readonly [string, string, string, string] = [
  "rgba(255,255,255,0)",
  "rgba(255,255,255,0.08)",
  "rgba(255,255,255,0.04)",
  "rgba(255,255,255,0)",
] as const;

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightColors["surface.elevated"],
    overflow: "hidden",
  },
});
