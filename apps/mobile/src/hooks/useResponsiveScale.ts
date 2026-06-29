/**
 * useResponsiveScale — viewport 기반 typography scale
 *
 * D-022 hero scales (text.hero.ko 88 / text.word 64 / text.display 36)는 ≥412 width 기준 설계.
 * 360 미만 device(SE 1st gen, 일부 Android mini)에서 한 줄 overflow 가능.
 *
 * Tier:
 *   - small  (< 360): SE 1st gen, Android mini
 *   - medium (360-412): SE 2/3, iPhone 8/12
 *   - large  (≥ 412): iPhone 12 Pro+ / 대부분 Android
 *
 * 책임 agent: frontend (designer hand-off context 외 자율 결정 영역)
 */

import { useWindowDimensions } from "react-native";

export type SizeTier = "small" | "medium" | "large";

export interface ResponsiveScale {
  tier: SizeTier;
  hero: number;       // 88 → 80 → 64
  word: number;       // 64 → 56 → 48
  display: number;    // 36 → 32 → 28
  heroSuccess: number; // 120 → 100 → 80 (lesson complete check)
}

export function useResponsiveScale(): ResponsiveScale {
  const { width } = useWindowDimensions();
  if (width < 360) {
    return { tier: "small", hero: 64, word: 48, display: 28, heroSuccess: 80 };
  }
  if (width < 412) {
    return { tier: "medium", hero: 80, word: 56, display: 32, heroSuccess: 100 };
  }
  return { tier: "large", hero: 88, word: 64, display: 36, heroSuccess: 120 };
}
