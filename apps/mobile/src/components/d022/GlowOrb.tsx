/**
 * GlowOrb — D-022 화면 decoration (THEME_DECISIONS §7 motion + §1.4 glow)
 *
 * 화면 배경에 absolute-position blur circle decoration.
 * iOS: BlurView. Android: 반투명 + 큰 opacity radial fallback.
 */

import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { lightColors } from "@dash2zero/design-tokens";

type GlowColor = "neon.cyan" | "neon.pink" | "neon.purple" | "neon.orange" | "neon.lime";

type Props = {
  size?: number;
  color: GlowColor;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

export function GlowOrb({ size = 240, color, opacity = 0.5, style }: Props) {
  const hex = lightColors[color];
  if (Platform.OS === "ios") {
    return (
      <View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: hex,
            opacity,
            overflow: "hidden",
          },
          style,
        ]}
      >
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      </View>
    );
  }

  // Android: blur 미지원 → 색 그대로, opacity로 fade
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: hex,
          opacity: opacity * 0.4,
        },
        style,
      ]}
    />
  );
}
