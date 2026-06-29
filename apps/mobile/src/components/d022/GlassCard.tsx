/**
 * GlassCard — D-022 glass morphism (THEME_DECISIONS §5.2 comp.card.glass)
 *
 * iOS: expo-blur BlurView (tint=dark, intensity 30)
 * Android: blur 미지원 → translucent surface + border + elevation
 */

import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { lightColors, spacing } from "@dash2zero/design-tokens";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  radius?: number;
};

export function GlassCard({ children, style, intensity = 30, radius = 18 }: Props) {
  if (Platform.OS === "ios") {
    return (
      <BlurView
        tint="dark"
        intensity={intensity}
        style={[
          styles.base,
          {
            borderRadius: radius,
            borderColor: lightColors["glass.border"],
          },
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  // Android fallback: blur 없이 translucent surface + border
  return (
    <View
      style={[
        styles.base,
        styles.androidFallback,
        {
          borderRadius: radius,
          borderColor: lightColors["glass.border"],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: "hidden",
    padding: spacing["space.4"],
  },
  androidFallback: {
    backgroundColor: lightColors["glass.surface"],
    elevation: 4,
  },
});
