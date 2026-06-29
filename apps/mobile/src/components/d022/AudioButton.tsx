/**
 * AudioButton — playing pulse + ring expansion + loading spinner
 *
 * Source of Truth:
 *   - swarm-handoff/01-WORK-ORDER.md §7 (P0-5)
 *   - packages/design-tokens/src/motion.ts (rnEasing / duration)
 *
 * 4-rule Merge Gate:
 *   - Rule 1 (GPU): ringScale/ringOpacity/spinnerRot transform/opacity only — useNativeDriver:true
 *                   shadowPulse는 layout 속성이라 useNativeDriver:false 사유 명시
 *   - Rule 2 (Lifecycle): state !== "playing"일 때 ring/pulse loop.stop() + setValue 초기화
 *   - Rule 3 (Timing): duration/rnEasing 일관, 1400ms ring · 700ms pulse half · 900ms spinner
 *   - Rule 4: skeleton 아님 (N/A)
 *
 * Reduce Motion (Q-MOTION-5):
 *   - 무한 anim 비활성 → border-color neon-pink 2px 정적 강조
 */

import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { duration, rnEasing, lightColors, MOTION_TOKENS } from "@dash2zero/design-tokens";

export type AudioState = "idle" | "loading" | "playing" | "error";

interface Props {
  state: AudioState;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

export function AudioButton({ state, onPress, accessibilityLabel, disabled }: Props) {
  const [reduce, setReduce] = useState(false);
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const shadowPulse = useRef(new Animated.Value(0)).current;
  const spinnerRot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduce(v);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => setReduce(v));
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  // Playing ring expansion + shadow pulse (Work Order §7.2 (1)(2))
  useEffect(() => {
    if (state !== "playing" || reduce) {
      ringScale.setValue(1);
      ringOpacity.setValue(0);
      shadowPulse.setValue(0);
      return;
    }
    const ring = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1.5,
            duration: MOTION_TOKENS.AUDIO_RING_DURATION,
            easing: rnEasing.out,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: MOTION_TOKENS.AUDIO_RING_DURATION,
            easing: rnEasing.out,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    const pulse = Animated.loop(
      Animated.sequence([
        // shadow는 layout 속성 — Animated native driver 미지원, 사유 주석 (Rule 1 단서)
        Animated.timing(shadowPulse, { toValue: 1, duration: MOTION_TOKENS.AUDIO_PULSE_HALF, easing: rnEasing.inOut, useNativeDriver: false }),
        Animated.timing(shadowPulse, { toValue: 0, duration: MOTION_TOKENS.AUDIO_PULSE_HALF, easing: rnEasing.inOut, useNativeDriver: false }),
      ]),
    );
    ring.start();
    pulse.start();
    return () => {
      ring.stop();
      pulse.stop();
    };
  }, [state, reduce, ringScale, ringOpacity, shadowPulse]);

  // Loading spinner rotation (Work Order §7.2 (3))
  useEffect(() => {
    if (state !== "loading" || reduce) {
      spinnerRot.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spinnerRot, {
        toValue: 1,
        duration: MOTION_TOKENS.AUDIO_SPINNER_DURATION,
        easing: rnEasing.inOut,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [state, reduce, spinnerRot]);

  const shadowRadius = shadowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 34],
  });

  const spinnerTransform = spinnerRot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        shadowColor: lightColors["neon.pink"],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius,
        elevation: 12,
        borderRadius: 28,
        alignSelf: "center",
        // reduce-motion 정적 강조 (Work Order §7.2 (4))
        borderWidth: reduce && state === "playing" ? 2 : 0,
        borderColor: lightColors["neon.pink"],
      }}
    >
      {/* Expanding ring (playing 시점만, reduce-motion 시 미렌더) */}
      {state === "playing" && !reduce && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: -2,
            top: -2,
            right: -2,
            bottom: -2,
            borderRadius: 30,
            borderWidth: 2,
            borderColor: lightColors["neon.pink"],
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          }}
        />
      )}
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        disabled={disabled || state === "loading"}
      >
        <LinearGradient
          colors={["#06B6D4", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" }}
        >
          {state === "loading" ? (
            <Animated.View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2.5,
                borderColor: "#FFFFFF",
                borderTopColor: "transparent",
                transform: [{ rotate: spinnerTransform }],
              }}
            />
          ) : state === "error" ? (
            <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "900" }}>!</Text>
          ) : state === "playing" ? (
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }}>❚❚</Text>
          ) : (
            <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "900" }}>▶</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
