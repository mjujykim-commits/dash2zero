/**
 * RoundsModal — "문제 몇 개?" 입력용 커스텀 모달 (iOS 기본 Alert.prompt 대체).
 *
 * 몰입 유지: 어두운 backdrop + 글래스 카드 + 네온 CTA. 빠른 선택 칩(5/10/20/All) +
 * 직접 입력(± 스텝퍼 & 숫자 키패드). Start 시 1..max 로 클램프해 onStart(n) 호출.
 */

import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { NeonButton } from "./d022";

interface Props {
  visible: boolean;
  max: number;
  title?: string;
  subtitle?: string;
  defaultValue?: number;
  /** true면 보유 단어 수를 노출하지 않음(카테고리 진입 전 설정용). "Max"=가능한 최대. */
  openEnded?: boolean;
  onStart: (n: number) => void;
  onCancel: () => void;
}

export function RoundsModal({
  visible,
  max,
  title = "How many questions?",
  subtitle,
  defaultValue = 10,
  openEnded = false,
  onStart,
  onCancel,
}: Props) {
  const init = Math.min(Math.max(1, defaultValue), Math.max(1, max));
  const [text, setText] = useState(String(init));

  // 열릴 때/최댓값 변할 때 기본값으로 리셋
  useEffect(() => {
    if (visible) setText(String(Math.min(Math.max(1, defaultValue), Math.max(1, max))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, max]);

  const parsed = parseInt(text, 10);
  const value = Number.isFinite(parsed) ? parsed : 0;
  const clamped = Math.min(Math.max(1, value || 1), Math.max(1, max));
  const valid = value >= 1 && value <= max;

  const quick = (openEnded ? [10, 20, 30, 50] : [5, 10, 20, 30]).filter((n) => n < max);
  const chips: { label: string; n: number }[] = [
    ...quick.map((n) => ({ label: String(n), n })),
    { label: openEnded ? "Max" : `All ${max}`, n: max },
  ];

  const step = (d: number) => setText(String(Math.min(Math.max(1, clamped + d), max)));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.center}
        >
          {/* 카드 자체 탭은 닫히지 않도록 stopPropagation */}
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

            {/* 빠른 선택 칩 */}
            <View style={styles.chipRow}>
              {chips.map((c) => {
                const active = clamped === c.n;
                return (
                  <Pressable
                    key={c.label}
                    onPress={() => setText(String(c.n))}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 직접 입력 + 스텝퍼 */}
            <View style={styles.stepperRow}>
              <Pressable onPress={() => step(-1)} style={styles.stepBtn} hitSlop={8}>
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <TextInput
                value={text}
                onChangeText={(t) => setText(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                style={styles.input}
                maxLength={4}
                selectTextOnFocus
                textAlign="center"
              />
              <Pressable onPress={() => step(1)} style={styles.stepBtn} hitSlop={8}>
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>
              {openEnded
                ? "Words per round · we’ll use the max if a topic has fewer"
                : valid ? `1 – ${max} questions` : `Enter 1 – ${max}`}
            </Text>

            <View style={{ height: spacing["space.4"] }} />
            <NeonButton
              label={openEnded && clamped >= max ? "Start · Max" : `Start · ${clamped}`}
              onPress={() => onStart(clamped)}
            />
            <Pressable onPress={onCancel} hitSlop={8} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(6,6,12,0.72)" },
  center: { flex: 1, justifyContent: "center", paddingHorizontal: spacing["space.6"] },
  card: {
    borderRadius: 24,
    padding: spacing["space.6"],
    backgroundColor: "rgba(22,22,34,0.98)",
    borderWidth: 1,
    borderColor: lightColors["glass.border"],
    shadowColor: lightColors["neon.purple"],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 16,
  },
  title: { color: lightColors["text.primary"], fontSize: 22, fontWeight: "900", textAlign: "center" },
  subtitle: {
    color: lightColors["text.secondary"],
    fontSize: typeScale["text.caption"].fontSize,
    textAlign: "center",
    marginTop: spacing["space.1"],
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: spacing["space.5"],
  },
  chip: {
    paddingHorizontal: spacing["space.4"],
    paddingVertical: spacing["space.2"],
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    margin: spacing["space.1"],
  },
  chipActive: { backgroundColor: lightColors["neon.cyan"] },
  chipText: { color: lightColors["text.secondary"], fontSize: 14, fontWeight: "800" },
  chipTextActive: { color: "#0B0B0F" },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing["space.5"],
  },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: { color: lightColors["text.primary"], fontSize: 30, fontWeight: "800", marginTop: -2 },
  input: {
    width: 120,
    height: 64,
    marginHorizontal: spacing["space.4"],
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1.5,
    borderColor: lightColors["neon.purple"],
    color: lightColors["text.primary"],
    fontSize: 34,
    fontWeight: "900",
  },
  hint: {
    color: lightColors["text.muted"],
    fontSize: typeScale["text.caption"].fontSize,
    textAlign: "center",
    marginTop: spacing["space.3"],
  },
  cancel: { alignItems: "center", marginTop: spacing["space.4"] },
  cancelText: { color: lightColors["text.muted"], fontSize: 15, fontWeight: "700" },
});
