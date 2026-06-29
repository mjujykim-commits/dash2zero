/**
 * AudioButton — playing pulse + ring expansion
 *
 * Source: dash2zero Design System / swarm-handoff work order §7 (P0-5)
 * Target path: apps/mobile/src/components/d022/AudioButton.tsx
 *
 * state: idle / loading / playing / error
 *   - playing: shadowRadius 펄스 + 외곽 ring 1→1.5 scale + opacity 0.8→0
 *   - loading: 0.9s linear rotation spinner (ActivityIndicator 대체)
 *
 * 현재 apps/mobile/app/lesson/[wordId].tsx 의 인라인 LinearGradient + ▶ 텍스트를
 * 본 컴포넌트로 교체.
 *
 * Reduce-motion: 모든 무한 anim 비활성, 정적 border-color로 강조.
 */

import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { lightColors, rnEasing } from "@dash2zero/design-tokens";

type AudioState = "idle" | "loading" | "playing" | "error";

export function AudioButton({
  state,
  onPress,
  accessibilityLabel,
}: {
  state: AudioState;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const [reduce, setReduce] = useState(false);
  const ringScale   = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const shadowPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let m = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => m && setReduce(v));
    return () => { m = false; };
  }, []);

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
          Animated.timing(ringScale,   { toValue: 1.5, duration: 1400, easing: rnEasing.out, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0,   duration: 1400, easing: rnEasing.out, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale,   { toValue: 1,   duration: 0, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(shadowPulse, { toValue: 1, duration: 700, easing: rnEasing.inOut, useNativeDriver: false }),
        Animated.timing(shadowPulse, { toValue: 0, duration: 700, easing: rnEasing.inOut, useNativeDriver: false }),
      ])
    );
    ring.start();
    pulse.start();
    return () => {
      ring.stop();
      pulse.stop();
    };
  }, [state, reduce, ringScale, ringOpacity, shadowPulse]);

  const shadowRadius = shadowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 34],
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
        // reduce-motion일 때 정적 강조
        borderWidth: reduce && state === "playing" ? 2 : 0,
        borderColor: lightColors["neon.pink"],
      }}
    >
      {state === "playing" && !reduce && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: -2, top: -2, right: -2, bottom: -2,
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
        disabled={state === "loading"}
      >
        <LinearGradient
          colors={["#06B6D4", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 56, height: 56, borderRadius: 28,
            alignItems: "center", justifyContent: "center",
          }}
        >
          {state === "loading" ? (
            <LoadingSpinner />
          ) : state === "error" ? (
            <Text style={{ color: "#fff", fontSize: 18 }}>!</Text>
          ) : state === "playing" ? (
            <Text style={{ color: "#fff", fontSize: 18 }}>❚❚</Text>
          ) : (
            <Text style={{ color: "#fff", fontSize: 22 }}>▶</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function LoadingSpinner() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rot, { toValue: 1, duration: 900, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [rot]);
  return (
    <Animated.View
      style={{
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2.5,
        borderColor: "#fff",
        borderTopColor: "transparent",
        transform: [{
          rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }),
        }],
      }}
    />
  );
}
