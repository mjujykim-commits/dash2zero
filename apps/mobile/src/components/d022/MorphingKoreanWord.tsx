/**
 * MorphingKoreanWord — 단계에 따라 한글 hero 글자 크기·위치 변화 (Work Order §3 P0-1, D-029)
 *
 * Source of Truth:
 *   - dash2zero Design System / swarm-handoff/01-WORK-ORDER.md §3 + 03-REFERENCE/components/MorphingKoreanWord.tsx
 *
 * 단계별 tier:
 *   - Notice / Hear: tier="hero" → scale 1, translateY 0 (예: 64px hero)
 *   - Meaning / Retrieve: tier="tier-1-5" → scale 0.875 (≈56px 시각), translateY -16
 *
 * 주의 (Work Order §3.5 위험):
 *   - fontSize는 layout 속성 → native driver animate 불가
 *   - 대안: transform: scale 으로 시각 보간 (useNativeDriver:true)
 *   - 실측 rendering 차이 발생 시 base fontSize를 72로 올리고 scale 0.78로 보정
 *
 * SE 검증 게이트 (D-030 디자이너 사전 승인):
 *   - iPhone SE 320pt: useResponsiveScale이 이미 word size를 축소 후 ×0.875 추가 적용
 *   - Meaning 단계 실측 한글이 <44px이면 tier-1-5 SCALE_TIER_1_5를 0.875 → 0.90으로 상향
 *     (≈58px, translateY -16 → -14로 미세 조정). 별도 재승인 불요 — 사전 승인됨.
 *   - 디자이너 sign-off §2 A-2 (2026-06-01)
 *
 * 4-rule Merge Gate:
 *   - Rule 1: transform scale + translateY only, useNativeDriver: true
 *   - Rule 2: tier 변경 시 Animated.parallel 새 시작 — in-flight 누적 회피
 *   - Rule 3: duration["motion.stage"] + rnEasing.out
 *   - Rule 4: skeleton 아님 (N/A)
 *
 * a11y: accessibilityLanguage="ko" 보존 — VoiceOver/TalkBack 한국어 발화
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
  const ty = useRef(new Animated.Value(0)).current;

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
