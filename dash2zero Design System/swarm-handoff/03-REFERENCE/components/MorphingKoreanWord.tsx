/**
 * MorphingKoreanWord — 단계에 따라 글자 크기/위치를 변화시키는 한글 hero 컨테이너
 *
 * Source: dash2zero Design System / swarm-handoff work order §3 (P0-1)
 * Target path: apps/mobile/src/components/d022/MorphingKoreanWord.tsx
 *
 * Notice/Hear 단계 (tier="hero"): 원본 크기 (예: 64px).
 * Meaning/Retrieve 단계 (tier="tier-1-5"): 0.875× scale, translateY -16.
 *
 * 주의: fontSize는 layout 속성이라 native driver로 animate 불가.
 *       transform: scale 으로 시각 보간 후 native driver 사용.
 *
 * 사용 예:
 *   <MorphingKoreanWord
 *     tier={stage === "notice" || stage === "hear" ? "hero" : "tier-1-5"}
 *     style={{ fontSize: 64, fontWeight: "900", color: "#FFF" }}
 *   >
 *     {word.korean}
 *   </MorphingKoreanWord>
 */

import { useEffect, useRef } from "react";
import { Animated, type StyleProp, type TextStyle } from "react-native";
import { duration, rnEasing } from "@dash2zero/design-tokens";

type Tier = "hero" | "tier-1-5";

export function MorphingKoreanWord({
  children,
  tier,
  style,
}: {
  children: React.ReactNode;
  tier: Tier;
  style?: StyleProp<TextStyle>;
}) {
  const scale = useRef(new Animated.Value(tier === "hero" ? 1 : 0.875)).current;
  const ty    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: tier === "hero" ? 1 : 0.875,
        duration: duration["motion.stage"],
        easing: rnEasing.out,
        useNativeDriver: true,
      }),
      Animated.timing(ty, {
        toValue: tier === "hero" ? 0 : -16,
        duration: duration["motion.stage"],
        easing: rnEasing.out,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tier, scale, ty]);

  return (
    <Animated.Text
      accessibilityLanguage="ko"
      style={[style, { transform: [{ translateY: ty }, { scale }] }]}
    >
      {children}
    </Animated.Text>
  );
}
