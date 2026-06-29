/**
 * ConfirmSheet — destructive confirmation built on existing BottomSheet (P1.5, Animated)
 *
 * Source of Truth:
 *   - swarm-handoff-p1/01-WORK-ORDER.md §7 + 03-REFERENCE/components/ConfirmSheet.tsx
 *   - D-031 (2026-06-02): Lesson abandon confirm 거절 — P1.5 활용처는 Delete account 단일화
 *   - DESIGN_DIRECTION §3.2: destructive action은 D-022 Bold 대신 정직/명세 톤
 *
 * ⚠️ P1.5는 신규 컴포넌트가 아님 — 기존 BottomSheet (D-025) wrapper. Reanimated 불요.
 *
 * Designer §Q-4 결정 (D-031 봉인):
 *   ✅ Delete account confirm (파괴적·비가역 — 확인 시트 정당)
 *   ❌ Lesson abandon confirm 거절 (dark-pattern 거리두기)
 *   ⊕ Subscription manage는 modal 대신 기존 paywall/store 이동 유지
 *
 * → 활용처는 Delete account 1건만. 추가는 M6 별도 검토.
 *
 * 톤 (DESIGN_DIRECTION §3.2):
 *   - destructive primary는 NeonButton gradient 대신 danger solid (정직/명세 톤)
 *   - cancel은 NeonButton variant="secondary" (glass)
 */

import { Pressable, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";
import { hapticImpact } from "@/src/lib/haptics";

import { BottomSheet } from "./BottomSheet";
import { NeonButton } from "./NeonButton";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  /** destructive 시 danger solid primary (default true — Delete account 등 파괴적 작업) */
  destructive?: boolean;
}

export function ConfirmSheet({
  visible,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  destructive = true,
}: Props) {
  const handleConfirm = () => {
    // D-024 — Light haptic on confirm (destructive 확정은 사용자 인지 강화)
    void hapticImpact("light");
    onConfirm();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} accessibilityLabel={title}>
      <Text
        style={{
          fontSize: typeScale["text.heading.sm"].fontSize,
          fontWeight: "800",
          color: lightColors["text.primary"],
          marginBottom: spacing["space.3"],
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: typeScale["text.body"].fontSize,
          lineHeight: typeScale["text.body"].lineHeight,
          color: lightColors["text.secondary"],
          marginBottom: spacing["space.6"],
        }}
      >
        {body}
      </Text>

      <View style={{ gap: spacing["space.3"] }}>
        {/* destructive primary — danger solid (정직/명세 톤, gradient 회피) */}
        {destructive ? (
          <Pressable
            onPress={handleConfirm}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
            style={({ pressed }) => ({
              height: 56,
              borderRadius: 14,
              backgroundColor: lightColors["semantic.danger"],
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: typeScale["text.button"].fontSize,
                fontWeight: "800",
              }}
            >
              {confirmLabel}
            </Text>
          </Pressable>
        ) : (
          // 비파괴 confirm은 NeonButton 그대로 (gradient OK)
          <NeonButton label={confirmLabel} onPress={handleConfirm} />
        )}
        {/* Cancel — secondary (glass) */}
        <NeonButton label="Cancel" variant="secondary" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}
