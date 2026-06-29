/**
 * GradientBackground — D-022 K-pop Bold
 *
 * Source: docs/brand/THEME_DECISIONS.md §1.3 (gradient tokens)
 * 화면 전체 또는 카드 단위 gradient 배경.
 */

import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { gradients, type GradientToken } from "@dash2zero/design-tokens";

type Direction = "diagonal" | "vertical" | "horizontal";

const DIRECTIONS: Record<Direction, { start: { x: number; y: number }; end: { x: number; y: number } }> = {
  diagonal:   { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  vertical:   { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
};

const GRADIENT_STOPS: Record<GradientToken, string[]> = {
  hero:    ["#9333EA", "#EC4899", "#F97316"],
  cta:     ["#06B6D4", "#EC4899"],
  card:    ["rgba(147,51,234,0.08)", "rgba(236,72,153,0.04)"],
  paywall: ["#1E1B4B", "#4C1D95", "#831843"],
  success: ["#10B981", "#06B6D4"],
  dark:    ["#0F0F1A", "#1A0B2E", "#2D1B47"],
};

type Props = {
  variant: GradientToken;
  direction?: Direction;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function GradientBackground({ variant, direction = "diagonal", style, children }: Props) {
  const { start, end } = DIRECTIONS[direction];
  return (
    <LinearGradient
      colors={GRADIENT_STOPS[variant]}
      start={start}
      end={end}
      style={[styles.base, style]}
    >
      {children}
    </LinearGradient>
  );
}

// Token-derived gradient stops re-exported for component-internal use (e.g., text-clip mask).
export { GRADIENT_STOPS };

const styles = StyleSheet.create({
  base: { flex: 1 },
});

// 비고: gradients import는 향후 token 검증용. raw stop 값은 token 파일과 1:1 mapping.
void gradients;
