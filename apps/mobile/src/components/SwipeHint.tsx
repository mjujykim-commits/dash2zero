/**
 * SwipeHint — "위로 스와이프" 안내. 상시 고정이 아니라 화살표+글자가
 * 위아래로 살짝 움직이며 opacity가 흐려졌다↔또렷해졌다 반복(펄스).
 *
 * direction="up": 위 화살표 2개(다음으로) / "both": 위·아래 화살표(Study 앞뒤 이동).
 */
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

import { lightColors, spacing } from "@dash2zero/design-tokens";

interface Props {
  visible?: boolean;
  label?: string;
  direction?: "up" | "both";
}

export function SwipeHint({ visible = true, label = "Swipe up", direction = "up" }: Props) {
  const opacity = useRef(new Animated.Value(0.15)).current;
  const shift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
          Animated.timing(shift, { toValue: -8, duration: 750, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.12, duration: 750, useNativeDriver: true }),
          Animated.timing(shift, { toValue: 0, duration: 750, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, opacity, shift]);

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, { opacity, transform: [{ translateY: shift }] }]}>
      <Text style={styles.arrow}>⌃</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.arrowDown}>{direction === "both" ? "⌄" : "⌃"}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: spacing["space.2"] },
  arrow: { color: lightColors["neon.cyan"], fontSize: 26, fontWeight: "900", lineHeight: 22 },
  arrowDown: { color: lightColors["neon.cyan"], fontSize: 26, fontWeight: "900", lineHeight: 22 },
  label: {
    color: lightColors["neon.cyan"],
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    marginVertical: 2,
  },
});
