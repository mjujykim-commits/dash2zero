/**
 * QuizOption — D-022 정답·오답 리액션 (Work Order §4 P0-2, D-029) + L-M5-001 정답 미하이라이트 (D-032, W18 D-2)
 *
 * Source of Truth:
 *   - dash2zero Design System / swarm-handoff/01-WORK-ORDER.md §4
 *   - DESIGN_DIRECTION §9.2 "정답/오답은 색 변경 + glow만, scale 불가(흐름 차단)"
 *   - docs/backlog/L-M5-001-correct-answer-highlight-decomposition.md (D-032 봉인)
 *   - Karpicke & Roediger 2008 / Pyc & Rawson 2009 / Hattie & Timperley 2007 (인출 학습 표준)
 *
 * State union (5 — D-032 확장):
 *   - "default"         : 일반
 *   - "selected"        : 선택 (submit 전), pink glow
 *   - "correct"         : 사용자가 직접 고른 정답 — ✓ spring scale + glow + Haptic Success
 *   - "correct-passive" : 정답이지만 사용자가 미선택 (오답 선택 시 노출) — glow만, ✓ icon 없음, haptic 없음 (D-032)
 *   - "incorrect"       : 사용자가 고른 오답 — ✕ spring scale + shake + glow + Haptic Warning
 *
 * 4-rule Merge Gate:
 *   - Rule 1: shakeX translateX + iconScale + iconOpacity transform/opacity only — useNativeDriver: true
 *   - Rule 2: state 변경 시 setValue 초기화 + Animated.sequence cleanup callback 자연 정리
 *   - Rule 3: duration["motion.base"]/["motion.spring"] + rnEasing.spring/shake 일관
 *   - Rule 4: skeleton 아님 (N/A)
 *
 * Reduce Motion: shake → opacity blink 200ms × 2 대체 (Q-MOTION-5 정합 강화)
 */

import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, Text } from "react-native";

import { duration, rnEasing, lightColors } from "@dash2zero/design-tokens";
import { hapticImpact, hapticNotification } from "@/src/lib/haptics";
import { playSfx } from "@/src/lib/sound";

type State = "default" | "selected" | "correct" | "correct-passive" | "incorrect";

interface Props {
  label: string;
  state: State;
  onPress: () => void;
  disabled?: boolean;
}

export function QuizOption({ label, state, onPress, disabled }: Props) {
  const [reduce, setReduce] = useState(false);
  const shakeX = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.4)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduce(v));
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => setReduce(v));
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  // state 변화 → shake (오답) + icon spring scale-in (정답/오답) + haptic
  useEffect(() => {
    if (state === "incorrect") {
      // Haptic Warning (D-024 global toggle 정합) + SFX (부드러운 하강, 비-징벌적)
      void hapticNotification("warning");
      void playSfx("incorrect");
      if (!reduce) {
        // 카드 본체 shake — Work Order §4.2 (2) 정확값: 360ms (60+80+80+80+60)
        Animated.sequence([
          Animated.timing(shakeX, { toValue: -6, duration: 60, easing: rnEasing.shake, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 6, duration: 80, easing: rnEasing.shake, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -4, duration: 80, easing: rnEasing.shake, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 4, duration: 80, easing: rnEasing.shake, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0, duration: 60, easing: rnEasing.shake, useNativeDriver: true }),
        ]).start();
      } else {
        // Reduce Motion fallback (Work Order §4.2 (4)): shake → opacity blink 200ms × 2
        Animated.sequence([
          Animated.timing(cardOpacity, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      }
    } else if (state === "correct") {
      // Haptic Success + SFX (절제된 상승 단음)
      void hapticNotification("success");
      void playSfx("correct");
    } else if (state === "correct-passive") {
      // 오답 선택 시 정답 자동 노출 (D-032): haptic 없음, 은은한 reveal SFX만
      void playSfx("reveal");
    }

    if (state === "correct" || state === "incorrect") {
      // ✓/✕ icon spring scale-in (Work Order §4.2 (1)+(2)): 140ms 지연 후 spring 320ms
      // 단 correct-passive는 icon 미표시 (D-032 정합)
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
      // 다음 카드 전환 시 / idle 복귀 / correct-passive 시 icon 초기화 (haptic 없음, scale-in 없음 — D-032)
      iconOpacity.setValue(0);
      iconScale.setValue(0.4);
    }
  }, [state, reduce, shakeX, iconOpacity, iconScale, cardOpacity]);

  const handlePress = () => {
    if (disabled) return;
    // D-024 — Light haptic on every interactive press + select SFX
    void hapticImpact("light");
    void playSfx("select");
    onPress();
  };

  const borderColor =
    state === "correct" || state === "correct-passive"
      ? lightColors["semantic.success"]
      : state === "incorrect"
        ? lightColors["semantic.danger"]
        : state === "selected"
          ? lightColors["neon.pink"]
          : lightColors["border.subtle"];

  const bg =
    state === "correct"
      ? "rgba(16,185,129,0.12)"
      : state === "correct-passive"
        ? "rgba(16,185,129,0.08)" // 본인 선택 카드보다 약하게 (시각 구분)
        : state === "incorrect"
          ? "rgba(248,113,113,0.12)"
          : state === "selected"
            ? "rgba(236,72,153,0.08)"
            : lightColors["surface.card"];

  return (
    <Animated.View
      style={{
        transform: [{ translateX: shakeX }],
        opacity: cardOpacity,
        marginBottom: 12,
      }}
    >
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ selected: state === "selected", disabled }}
        accessibilityLanguage="ko"
        accessibilityLabel={label}
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
          shadowColor:
            state === "correct" || state === "correct-passive"
              ? lightColors["semantic.success"]
              : state === "incorrect"
                ? lightColors["semantic.danger"]
                : state === "selected"
                  ? lightColors["neon.pink"]
                  : "transparent",
          // correct-passive는 본인 선택보다 약한 glow (시각 hierarchy 보존)
          shadowOpacity: state === "default" ? 0 : state === "correct-passive" ? 0.25 : 0.4,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          elevation: state === "default" ? 0 : 4,
        }}
      >
        <Text
          accessibilityLanguage="ko"
          style={{ fontSize: 20, fontWeight: "700", color: lightColors["text.primary"] }}
        >
          {label}
        </Text>
        <Animated.View
          style={{
            opacity: iconOpacity,
            transform: [{ scale: iconScale }],
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor:
              state === "correct"
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
