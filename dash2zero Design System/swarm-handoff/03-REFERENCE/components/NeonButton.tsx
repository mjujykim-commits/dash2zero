/**
 * NeonButton — D-022 primary CTA with ripple + lift + glow brightening
 *
 * Source: dash2zero Design System / swarm-handoff work order §5 (P0-3)
 * Target path: apps/mobile/src/components/d022/NeonButton.tsx (existing — diff against current)
 *
 * 추가 사항:
 *   - Ripple sub-component: 터치 좌표에서 4× scale로 600ms 확장 + fade-out
 *   - 다중 ripple 동시 가능 (cleanup 보장)
 *   - Pressed 상태에서 glow 1.4× 강화
 *
 * Focus ring은 본 sprint에서 토큰만 정의, 구현은 P1 a11y 라운드 (M5 W19)에서.
 *
 * Reduce-motion: ripple 비활성, glow brighten 즉시 적용 (no animation).
 *
 * 본 파일은 NeonButton 전체가 아닌 **추가/교체되는 핵심 부분만** 발췌.
 * 기존 코드와의 통합은 frontend agent가 수행.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { duration, lightColors, rnEasing, spacing, typeScale } from "@dash2zero/design-tokens";

// ─────────────────────────────────────────────────────────────
// Ripple sub-component — 터치 좌표에서 출발한 확장 원
// ─────────────────────────────────────────────────────────────
function Ripple({
  x, y, size, onDone,
}: {
  x: number;
  y: number;
  size: number;
  onDone: () => void;
}) {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: duration["motion.progress"],
        easing: rnEasing.out,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: duration["motion.progress"],
        easing: rnEasing.out,
        useNativeDriver: true,
      }),
    ]).start(onDone);
  }, [scale, opacity, onDone]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "rgba(255,255,255,0.55)",
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// NeonButton (이 부분만 기존 NeonButton.tsx와 통합)
// ─────────────────────────────────────────────────────────────
type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  accessibilityLabel?: string;
};

export function NeonButton({ label, onPress, disabled, variant = "primary", accessibilityLabel }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const rippleId = useRef(0);
  const buttonRef = useRef<View>(null);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => mounted && setReduceMotion(enabled));
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      setReduceMotion(enabled);
    });
    return () => { mounted = false; sub.remove(); };
  }, []);

  const animateTo = useCallback((value: number) => {
    if (reduceMotion) return;
    Animated.timing(scale, {
      toValue: value,
      duration: duration["motion.fast"],
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, scale]);

  const handlePressIn = useCallback((e: GestureResponderEvent) => {
    animateTo(0.96);
    if (reduceMotion) return;
    const { locationX, locationY } = e.nativeEvent;
    buttonRef.current?.measure?.((_x, _y, w, h) => {
      const size = Math.max(w, h) * 2;
      const id = rippleId.current++;
      setRipples((r) => [...r, { id, x: locationX, y: locationY, size }]);
    });
  }, [animateTo, reduceMotion]);

  const removeRipple = useCallback((id: number) => {
    setRipples((r) => r.filter((x) => x.id !== id));
  }, []);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPressIn={handlePressIn}
      onPressOut={() => animateTo(1)}
      style={({ pressed }) => [
        styles.shadow,
        // pressed 상태에서 glow 1.4× 강화
        pressed && !reduceMotion && {
          shadowOpacity: 0.78,
          shadowRadius: 34,
        },
        disabled && styles.disabled,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View
          ref={buttonRef}
          collapsable={false}
          style={{ overflow: "hidden", borderRadius: 14 }}
        >
          <LinearGradient
            colors={["#06B6D4", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primary}
          >
            <Text style={styles.label}>{label}</Text>
          </LinearGradient>
          {ripples.map((r) => (
            <Ripple key={r.id} x={r.x} y={r.y} size={r.size} onDone={() => removeRipple(r.id)} />
          ))}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 14,
    shadowColor: lightColors["neon.pink"],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 12,
  },
  primary: {
    height: 56,
    paddingHorizontal: spacing["space.5"],
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#FFFFFF",
    fontSize: typeScale["text.button"].fontSize,
    lineHeight: typeScale["text.button"].lineHeight,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.4,
  },
});
