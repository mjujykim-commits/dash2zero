/**
 * StreakBadge — pop entry + flame flicker (P1.3, Animated legacy)
 *
 * Source of Truth:
 *   - swarm-handoff-p1/01-WORK-ORDER.md §5 + 03-REFERENCE/components/StreakBadge.tsx
 *   - ADR-0009: 단순 scale/opacity keyframe — Animated legacy 유지
 *
 * 2개 모션:
 *   1. pop entry — scale 0.4 → 1.0 spring (mount 시 1회), motion.spring 320ms + opacity 0→1 motion.base 200ms
 *   2. flame flicker — 불꽃 이모지 scale 1↔1.08 + rotate ±2deg 무한 alternate (800ms × 2 = 1600ms)
 *
 * 활용: Home streak 뱃지. streak 0~6일은 flicker 유지, streak 갱신 순간 pop 1회.
 *   - streak 끊김 시에는 pop/flicker 없이 정적 (DESIGN_DIRECTION §6.2 "Streak reset 단순 표시")
 *   - 본 컴포넌트는 streak ≥ 1일 때 호출. 0일은 호출 측에서 미렌더링.
 *
 * 4-rule Merge Gate:
 *   - Rule 1: transform scale/rotate + opacity only, useNativeDriver: true
 *   - Rule 2: flicker loop unmount 시 loop.stop(), pop은 단발 — listener cleanup
 *   - Rule 3: motion.spring (pop) + motion.base (fade) + raw 800ms (flicker half, Work Order 본문 명시값)
 *   - Rule 4: skeleton 아님 (N/A)
 *
 * Reduce Motion: pop → opacity fade only (motion.fast 150ms), flicker 정지 (정적 이모지)
 */

import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Text } from "react-native";

import { duration, rnEasing, lightColors } from "@dash2zero/design-tokens";
import { playSfx } from "@/src/lib/sound";

interface Props {
  days: number;
  /** streak가 방금 갱신됐으면 true → pop 재생 */
  justIncremented?: boolean;
}

export function StreakBadge({ days, justIncremented }: Props) {
  const [reduce, setReduce] = useState(false);
  const popScale = useRef(new Animated.Value(justIncremented ? 0.4 : 1)).current;
  const popOpacity = useRef(new Animated.Value(justIncremented ? 0 : 1)).current;
  const flicker = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduce(v));
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => setReduce(v));
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  // pop entry — justIncremented 변경 시 1회
  useEffect(() => {
    if (!justIncremented) return;
    void playSfx("streak"); // 연속일 +1 보상 (절제된 상승음)
    if (reduce) {
      popScale.setValue(1);
      Animated.timing(popOpacity, {
        toValue: 1,
        duration: duration["motion.fast"],
        useNativeDriver: true,
      }).start();
      return;
    }
    popOpacity.setValue(0);
    popScale.setValue(0.4);
    Animated.parallel([
      Animated.timing(popOpacity, {
        toValue: 1,
        duration: duration["motion.base"],
        easing: rnEasing.out,
        useNativeDriver: true,
      }),
      Animated.timing(popScale, {
        toValue: 1,
        duration: duration["motion.spring"],
        easing: rnEasing.spring,
        useNativeDriver: true,
      }),
    ]).start();
  }, [justIncremented, reduce, popScale, popOpacity]);

  // flame flicker (무한) — Reduce Motion 시 정지
  useEffect(() => {
    if (reduce) {
      flicker.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, {
          toValue: 1,
          duration: 800,
          easing: rnEasing.inOut,
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0,
          duration: 800,
          easing: rnEasing.inOut,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, flicker]);

  const flameStyle = {
    transform: [
      { scale: flicker.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
      { rotate: flicker.interpolate({ inputRange: [0, 1], outputRange: ["-2deg", "2deg"] }) },
    ],
  };

  return (
    <Animated.View
      style={{
        opacity: popOpacity,
        transform: [{ scale: popScale }],
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 100,
        backgroundColor: "rgba(132,204,22,0.15)",
        borderWidth: 1,
        borderColor: "rgba(132,204,22,0.4)",
        alignSelf: "flex-start",
      }}
      accessibilityLabel={`${days} day streak`}
    >
      <Animated.Text style={[{ fontSize: 14 }, flameStyle]}>🔥</Animated.Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: lightColors["neon.lime"],
          letterSpacing: 0.4,
        }}
      >
        {days} day{days === 1 ? "" : "s"} streak
      </Text>
    </Animated.View>
  );
}
