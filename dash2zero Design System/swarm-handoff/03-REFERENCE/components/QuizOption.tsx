/**
 * QuizOption — D-022 정답·오답 리액션 강화
 *
 * Source: dash2zero Design System / swarm-handoff work order §4 (P0-2)
 * Target path: apps/mobile/src/components/d022/QuizOption.tsx
 *
 * 정답 시: success glow + ✓ icon spring scale-in (140ms 지연)
 * 오답 시: 360ms shake + danger border, ✕ icon fade-in
 *
 * 카드 본체에는 모션 적용 안 함 — DESIGN_DIRECTION §9.2 "정답/오답은 색 변경 + glow만" 보존.
 * 단 ✓/✕ icon에는 spring scale 한정 적용으로 D-022 톤 반영.
 */

import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, Text } from "react-native";
import { duration, rnEasing, lightColors } from "@dash2zero/design-tokens";

type State = "default" | "selected" | "correct" | "incorrect";

export function QuizOption({
  label,
  state,
  onPress,
  disabled,
}: {
  label: string;
  state: State;
  onPress: () => void;
  disabled?: boolean;
}) {
  const [reduce, setReduce] = useState(false);
  const shakeX      = useRef(new Animated.Value(0)).current;
  const iconScale   = useRef(new Animated.Value(0.4)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let m = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => m && setReduce(v));
    return () => { m = false; };
  }, []);

  useEffect(() => {
    if (state === "incorrect" && !reduce) {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -6, duration: 60, easing: rnEasing.shake, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  6, duration: 80, easing: rnEasing.shake, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -4, duration: 80, easing: rnEasing.shake, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  4, duration: 80, easing: rnEasing.shake, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  0, duration: 60, easing: rnEasing.shake, useNativeDriver: true }),
      ]).start();
    }
    if (state === "correct" || state === "incorrect") {
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: duration["motion.base"],
          delay: 140,
          easing: rnEasing.out,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: duration["motion.spring"],
          delay: 140,
          easing: rnEasing.spring,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      iconOpacity.setValue(0);
      iconScale.setValue(0.4);
    }
  }, [state, reduce, shakeX, iconOpacity, iconScale]);

  const borderColor =
    state === "correct"   ? lightColors["semantic.success"] :
    state === "incorrect" ? lightColors["semantic.danger"]  :
    state === "selected"  ? lightColors["neon.pink"]        :
                            lightColors["border.subtle"];

  const bg =
    state === "correct"   ? "rgba(16,185,129,0.12)" :
    state === "incorrect" ? "rgba(248,113,113,0.12)" :
    state === "selected"  ? "rgba(236,72,153,0.08)"  :
                            lightColors["surface.card"];

  return (
    <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={{
          minHeight: 60,
          borderRadius: 16,
          padding: 16,
          backgroundColor: bg,
          borderColor,
          borderWidth: state === "default" ? 1 : 2,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          shadowColor: state === "correct"  ? lightColors["semantic.success"]
                     : state === "selected" ? lightColors["neon.pink"]
                     : "transparent",
          shadowOpacity: state === "default" ? 0 : 0.4,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          elevation: state === "default" ? 0 : 4,
        }}
      >
        <Text accessibilityLanguage="ko" style={{ fontSize: 20, fontWeight: "700", color: lightColors["text.primary"] }}>
          {label}
        </Text>
        <Animated.View
          style={{
            opacity: iconOpacity,
            transform: [{ scale: iconScale }],
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: state === "correct"
              ? lightColors["semantic.success"]
              : lightColors["semantic.danger"],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13 }}>
            {state === "correct" ? "✓" : "✕"}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
