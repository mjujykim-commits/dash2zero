/**
 * Color Tokens — Source: docs/brand/THEME_DECISIONS.md §1 (D-022 K-pop Bold)
 * D-022 봉인 (2026-05-18): Quiet/Steady 폐기 → K-pop Bold (그라데이션 + neon + glow)
 * 사용자 명시 결정: "디자인이 stunning 하지 않다" → 사용자 승인 "완전 대 만족"
 */

export const lightColors = {
  // Surface (dark-first, light는 보조)
  "surface.bg":        "#0F0F1A",
  "surface.card":      "#1A1B2E",
  "surface.elevated":  "#252640",
  "surface.muted":     "#252640",
  // Text
  "text.primary":      "#FAFAF9",
  "text.secondary":    "#B4B4C0",
  "text.muted":        "#6B7280",
  "text.inverse":      "#0F0F1A",
  // Brand — K-pop Bold neon palette
  "brand.primary":         "#EC4899",   // electric pink (CTA)
  "brand.primary.pressed": "#DB2777",
  // Semantic
  "semantic.success":  "#10B981",
  "semantic.warning":  "#FACC15",
  "semantic.danger":   "#F87171",
  "semantic.info":     "#06B6D4",       // neon cyan
  // Neon accents (D-022 신규)
  "neon.cyan":         "#06B6D4",
  "neon.pink":         "#EC4899",
  "neon.purple":       "#9333EA",
  "neon.orange":       "#F97316",
  "neon.lime":         "#84CC16",
  "neon.yellow":       "#FACC15",
  // Korean glyph
  "korean.glyph":      "#FFFFFF",
  "korean.glyph.secondary": "#F4F4F2",
  // Borders
  "border.subtle":     "rgba(255, 255, 255, 0.08)",
  "border.strong":     "rgba(255, 255, 255, 0.2)",
  "border.neon":       "rgba(236, 72, 153, 0.4)",
  // Glass morphism
  "glass.surface":     "rgba(255, 255, 255, 0.06)",
  "glass.border":      "rgba(255, 255, 255, 0.1)",
} as const;

export const darkColors = {
  // D-022는 dark-first 디자인이므로 light/dark가 거의 동일 (lesson 화면 학습 카드만 분리)
  "surface.bg":        "#0A0A0F",
  "surface.card":      "#15162A",
  "surface.elevated":  "#1F2138",
  "surface.muted":     "#1F2138",
  "text.primary":      "#FAFAF9",
  "text.secondary":    "#A1A1AA",
  "text.muted":        "#71717A",
  "text.inverse":      "#0A0A0F",
  "brand.primary":         "#EC4899",
  "brand.primary.pressed": "#DB2777",
  "semantic.success":  "#34D399",
  "semantic.warning":  "#FBBF24",
  "semantic.danger":   "#F87171",
  "semantic.info":     "#06B6D4",
  "neon.cyan":         "#06B6D4",
  "neon.pink":         "#EC4899",
  "neon.purple":       "#9333EA",
  "neon.orange":       "#F97316",
  "neon.lime":         "#84CC16",
  "neon.yellow":       "#FACC15",
  "korean.glyph":      "#FFFFFF",
  "korean.glyph.secondary": "#F4F4F2",
  "border.subtle":     "rgba(255, 255, 255, 0.08)",
  "border.strong":     "rgba(255, 255, 255, 0.2)",
  "border.neon":       "rgba(236, 72, 153, 0.4)",
  "glass.surface":     "rgba(255, 255, 255, 0.06)",
  "glass.border":      "rgba(255, 255, 255, 0.1)",
} as const;

/**
 * Gradient tokens (D-022 신규)
 * 사용처: hero text, CTA buttons, card borders, backgrounds
 */
export const gradients = {
  hero:    "linear-gradient(135deg, #9333EA 0%, #EC4899 50%, #F97316 100%)",   // purple → pink → orange
  cta:     "linear-gradient(135deg, #06B6D4 0%, #EC4899 100%)",                   // cyan → pink
  card:    "linear-gradient(160deg, rgba(147,51,234,0.08) 0%, rgba(236,72,153,0.04) 100%)",
  paywall: "linear-gradient(135deg, #1E1B4B 0%, #4C1D95 50%, #831843 100%)",     // deep indigo → violet → burgundy
  success: "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
  dark:    "linear-gradient(180deg, #0F0F1A 0%, #1A0B2E 50%, #2D1B47 100%)",
} as const;

/**
 * Glow / shadow tokens (D-022 신규)
 */
export const glows = {
  cyan:   "0 0 24px rgba(6, 182, 212, 0.5), 0 0 48px rgba(6, 182, 212, 0.25)",
  pink:   "0 0 24px rgba(236, 72, 153, 0.55), 0 0 48px rgba(236, 72, 153, 0.3)",
  purple: "0 0 32px rgba(147, 51, 234, 0.5), 0 0 64px rgba(147, 51, 234, 0.25)",
  lime:   "0 0 24px rgba(132, 204, 22, 0.5), 0 0 48px rgba(132, 204, 22, 0.25)",
  success: "0 0 24px rgba(16, 185, 129, 0.5), 0 0 48px rgba(6, 182, 212, 0.3)",
  soft:   "0 12px 32px rgba(147, 51, 234, 0.3)",
  card:   "0 8px 24px rgba(0, 0, 0, 0.4)",
} as const;

export type ColorToken = keyof typeof lightColors;
export type ColorScheme = "light" | "dark";
export type GradientToken = keyof typeof gradients;
export type GlowToken = keyof typeof glows;

export function getColor(token: ColorToken, scheme: ColorScheme = "light"): string {
  return scheme === "light" ? lightColors[token] : darkColors[token];
}

export function getGradient(token: GradientToken): string {
  return gradients[token];
}

export function getGlow(token: GlowToken): string {
  return glows[token];
}
