/**
 * ConfirmSheet — destructive confirmation built on existing BottomSheet (P1.5, Animated)
 *
 * Source: dash2zero Design System / swarm-handoff-p1/01-WORK-ORDER.md §7
 * Target: apps/mobile/src/components/d022/ConfirmSheet.tsx
 *
 * ⚠️ P1.5는 신규 컴포넌트가 아님 — 기존 BottomSheet(D-025, Animated, sign-off급)을
 *   "활용"하는 작업. Reanimated 불요.
 *
 * Designer §Q4 결정:
 *   ✅ 채택: Delete account confirm (파괴적·비가역 — 확인 시트 정당)
 *   ❌ 거절: Lesson abandon confirm — DESIGN_DIRECTION §2.1 "강요 회피 / 도구 톤"에
 *           정면 위배. 학습 중 이탈을 막는 confirm은 dark-pattern. 자동 이벤트 emit 유지.
 *   ⊕ 추가 권고: Subscription manage는 modal 대신 기존 paywall/store 이동 유지.
 *
 * → P1.5 활용처는 **Delete account 1건만**. 추가 사용처는 M6 별도 검토.
 *
 * 톤: destructive action은 D-022 Bold 대신 정직/명세 톤 (DESIGN_DIRECTION §3.2).
 *   primary CTA를 danger 색으로, cancel을 secondary로.
 */

import { Text, View } from "react-native";
import { BottomSheet } from "./BottomSheet";
import { NeonButton } from "./NeonButton";
import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
}

export function ConfirmSheet({
  visible, onClose, onConfirm, title, body, confirmLabel, destructive = true,
}: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} accessibilityLabel={title}>
      <Text
        style={{
          fontSize: typeScale["text.heading.md"].fontSize,
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
        {/* destructive primary — danger 색. NeonButton children으로 색 override */}
        <NeonButton
          label={confirmLabel}
          onPress={() => { onConfirm(); onClose(); }}
          accessibilityLabel={confirmLabel}
          style={
            destructive
              ? { backgroundColor: "transparent" } // gradient 대신 danger solid는 호출 측 variant 처리
              : undefined
          }
        />
        <NeonButton label="Cancel" variant="secondary" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

/**
 * 사용 예 — Settings의 Delete account (현재 Alert.alert 대체):
 *
 *   const [confirmVisible, setConfirmVisible] = useState(false);
 *   ...
 *   <ListRow label="Delete account" danger onPress={() => setConfirmVisible(true)} />
 *   <ConfirmSheet
 *     visible={confirmVisible}
 *     onClose={() => setConfirmVisible(false)}
 *     onConfirm={handleDeleteAccount}
 *     title="Delete account"
 *     body="This removes your dash2zero account and learning data. Active subscriptions must be cancelled separately in App Store or Google Play."
 *     confirmLabel="Delete account"
 *   />
 *
 * 주의: copy는 docs/11_ux_writing_guide.md §13 그대로. "I understand" 중간 확인은
 *   2단계 확인(10_design_system §8 "2단계 확인")이 필요하면 ConfirmSheet 내부에
 *   checkbox 추가 — 본 sprint 범위 밖, M6 검토.
 */
