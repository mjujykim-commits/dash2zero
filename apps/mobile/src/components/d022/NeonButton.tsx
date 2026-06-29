/**
 * NeonButton — D-022 primary CTA + Work Order P0-3 ripple/glow brighten (D-028)
 *
 * Motion 정합:
 *   - Press: scale 1 → 0.96 (PRESSED_SCALE), motion.fast (150ms), spring easing
 *   - Haptic: Light on press (D-024 global toggle 정합)
 *   - Reduce Motion: opacity fade fallback, ripple 비활성, glow brighten 즉시
 *   - Ripple: 터치 좌표 출발, 4× scale + opacity 0.5→0, motion.progress (600ms)
 *   - Glow brighten on press (shadowOpacity 0.55 → 0.85, JS driver 1줄)
 *
 * useNativeDriver: true 강제 (Rule 1)
 */

import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { hapticImpact } from "@/src/lib/haptics";
import { playSfx } from "@/src/lib/sound";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  duration,
  rnEasing,
  lightColors,
  spacing,
  typeScale,
  MOTION_TOKENS,
} from "@dash2zero/design-tokens";

import { GRADIENT_STOPS } from "./GradientBackground";

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  children?: ReactNode;
};

// Ripple sub-component (Work Order §5.3) — Animated.parallel scale + opacity
function Ripple({
  x,
  y,
  size,
  color,
  onDone,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  onDone: () => void;
}) {
  const scale = useRef(new Animated.Value(0)).current;
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
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

export function NeonButton({
  label,
  onPress,
  disabled,
  variant = "primary",
  style,
  accessibilityLabel,
  children,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current; // 0 = base, 1 = brightened
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const rippleId = useRef(0);
  const buttonRef = useRef<View>(null);

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

  // motion.fast (150ms) + spring (Work Order §2)
  const animateTo = (value: number) => {
    if (reduceMotion) return;
    Animated.timing(scale, {
      toValue: value,
      duration: duration["motion.fast"],
      easing: rnEasing.spring,
      useNativeDriver: true,
    }).start();
  };

  // Glow brighten on press (Work Order §5.2 (2))
  const animateGlow = (value: number) => {
    Animated.timing(glow, {
      toValue: value,
      duration: duration["motion.tap"],
      easing: rnEasing.out,
      // shadow는 layout 속성이라 useNativeDriver:false 사유 명시 (Rule 1 단서)
      useNativeDriver: false,
    }).start();
  };

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      animateTo(MOTION_TOKENS.PRESSED_SCALE);
      animateGlow(1);
      if (reduceMotion || variant === "secondary") return;
      const { locationX, locationY } = e.nativeEvent;
      buttonRef.current?.measure?.((_x, _y, w, h) => {
        const size = Math.max(w, h) * 2;
        const id = rippleId.current++;
        setRipples((r) => [...r, { id, x: locationX, y: locationY, size }]);
      });
    },
    [reduceMotion, variant],
  );

  const handlePressOut = useCallback(() => {
    animateTo(1);
    animateGlow(0);
  }, []);

  const removeRipple = useCallback((id: number) => {
    setRipples((r) => r.filter((x) => x.id !== id));
  }, []);

  // D-024 — Light haptic on every interactive press
  const handlePress = () => {
    if (disabled) return;
    void hapticImpact("light");
    void playSfx("tap");
    onPress?.();
  };

  const inner = children ?? <Text style={styles.label}>{label}</Text>;

  // Glow brighten — shadowOpacity 0.55 → 0.85 (1.4× ≈ Work Order §5.2 (2))
  const animatedShadowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.85],
  });

  if (variant === "secondary") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.secondary,
          pressed && { opacity: reduceMotion ? 0.7 : 1 },
          disabled && styles.disabled,
          style,
        ]}
      >
        <Animated.View style={[styles.secondaryInner, { transform: [{ scale }] }]}>{inner}</Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        pressed_dummy_style,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shadow,
          { shadowOpacity: animatedShadowOpacity },
        ]}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <View ref={buttonRef} style={{ overflow: "hidden", borderRadius: 14 }}>
            <LinearGradient
              colors={GRADIENT_STOPS.cta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primary}
            >
              {inner}
            </LinearGradient>
            {/* Ripples — Work Order §5.3 정합. 다중 ripple 가능, cleanup 보장 */}
            {ripples.map((r) => (
              <Ripple
                key={r.id}
                x={r.x}
                y={r.y}
                size={r.size}
                color="rgba(255,255,255,0.55)"
                onDone={() => removeRipple(r.id)}
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// Pressable 외곽 wrapper — 그림자는 Animated 내부에서 처리 (overflow:hidden ripple clip)
const pressed_dummy_style: ViewStyle = {};

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
  secondary: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: lightColors["glass.border"],
    backgroundColor: lightColors["glass.surface"],
  },
  secondaryInner: {
    height: 48,
    paddingHorizontal: spacing["space.4"],
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

export const neonButtonLabelStyle = StyleSheet.flatten(styles.label);
