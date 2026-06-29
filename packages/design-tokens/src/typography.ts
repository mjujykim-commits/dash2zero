/**
 * Typography Tokens — Source: docs/brand/THEME_DECISIONS.md §2
 *
 * 한영 광학 매칭 비율: 한글 1.0 : 영문 0.92 (UX-NEW-002)
 * Font: Noto Sans KR (한글) + Inter (영문) — SIL OFL 1.1
 */

export const fontFamilies = {
  korean: "Noto Sans KR",
  latin: "Inter",
  mono: "JetBrains Mono", // M2 미사용
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

/** Type Scale — px, line-height (THEME_DECISIONS §2.3, D-022 갱신) */
export const typeScale = {
  // D-022 K-pop Bold hero scale (한글 hero element)
  "text.hero.ko":      { fontSize: 88, lineHeight: 84, weight: "900",                family: fontFamilies.korean }, // welcome / paywall hero
  "text.word":         { fontSize: 64, lineHeight: 64, weight: "900",                family: fontFamilies.korean }, // lesson 카드 한글 (D-022 강화)
  "text.display":      { fontSize: 36, lineHeight: 40, weight: "900",                family: fontFamilies.latin },  // English display hero (D-022 신규)
  "text.heading.lg":   { fontSize: 28, lineHeight: 36, weight: fontWeights.semibold, family: fontFamilies.latin },
  "text.heading.md":   { fontSize: 22, lineHeight: 30, weight: fontWeights.semibold, family: fontFamilies.latin },
  "text.heading.sm":   { fontSize: 18, lineHeight: 26, weight: fontWeights.semibold, family: fontFamilies.latin },
  "text.gloss":        { fontSize: 18, lineHeight: 26, weight: fontWeights.regular,  family: fontFamilies.latin },
  "text.body":         { fontSize: 16, lineHeight: 24, weight: fontWeights.regular,  family: fontFamilies.latin },
  "text.example":      { fontSize: 16, lineHeight: 24, weight: fontWeights.regular,  family: fontFamilies.latin, italic: true },
  "text.example.ko":   { fontSize: 18, lineHeight: 26, weight: fontWeights.regular,  family: fontFamilies.korean },
  "text.body.ko":      { fontSize: 17, lineHeight: 24, weight: fontWeights.regular,  family: fontFamilies.korean },
  "text.romanization": { fontSize: 14, lineHeight: 20, weight: fontWeights.regular,  family: fontFamilies.latin },
  "text.caption":      { fontSize: 13, lineHeight: 18, weight: fontWeights.regular,  family: fontFamilies.latin },
  "text.button":       { fontSize: 16, lineHeight: 20, weight: fontWeights.semibold, family: fontFamilies.latin },
  "text.tab":          { fontSize: 14, lineHeight: 18, weight: fontWeights.medium,   family: fontFamilies.latin },
} as const;

export type TypeToken = keyof typeof typeScale;

/** 한영 광학 매칭 비율 (UX-NEW-002) */
export const opticalRatio = {
  korean: 1.0,
  latin: 0.92,
} as const;
