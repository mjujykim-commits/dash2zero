/**
 * GradientText — D-022 hero text-clip (THEME_DECISIONS §2.3 hero scales)
 *
 * Native에서 gradient text-clip은 직접 지원되지 않음.
 * MaskedView 라이브러리 없이 production-safe하게 처리하기 위해:
 *   - V1: solid neon color로 hero text 렌더 (가독성 + 임팩트 유지)
 *   - V2 (M4 W18 검토): @react-native-masked-view/masked-view 도입 후 진짜 gradient text-clip
 *
 * D-022 supplemental: hero text 색을 neon.pink/cyan/purple 중 prop으로 받음.
 * fallback color는 token에서 직접 가져와 token-only 정합 유지.
 */

import type { ReactNode } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";

import { lightColors, typeScale, type TypeToken } from "@dash2zero/design-tokens";

type GradientVariant = "hero" | "cta" | "success";

type Props = {
  children: ReactNode;
  scale: TypeToken;
  variant?: GradientVariant;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

const FALLBACK_COLOR: Record<GradientVariant, string> = {
  // hero gradient (purple→pink→orange) — visual emphasis는 pink가 most dominant
  hero:    lightColors["neon.pink"],
  cta:     lightColors["neon.cyan"],
  success: lightColors["semantic.success"],
};

export function GradientText({
  children,
  scale,
  variant = "hero",
  style,
  accessibilityLabel,
}: Props) {
  const t = typeScale[scale];
  return (
    <Text
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          fontWeight: t.weight as TextStyle["fontWeight"],
          color: FALLBACK_COLOR[variant],
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
