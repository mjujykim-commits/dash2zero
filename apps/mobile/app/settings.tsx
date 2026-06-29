/**
 * Settings — flat list (DESIGN_DIRECTION §4.2)
 * 톤: D-022 K-pop Bold (mockup: docs/screens/v2-stunning/12-settings.html)
 *
 * 항목:
 *   - Account (sign-in 또는 user email)
 *   - Subscription (Premium / Free, manage 링크)
 *   - Privacy choices (분석/Crashlytics 토글)
 *   - About (version, terms, privacy policy)
 *   - Delete account (C-11)
 */

import { Linking, Alert, Animated, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { hapticImpact, isHapticEnabled, setHapticEnabledGlobal } from "@/src/lib/haptics";
import { isSfxEnabled, setSfxEnabledGlobal, playSfx } from "@/src/lib/sound";
import { useMotionPress } from "@/src/hooks/useMotionPress";
import { router } from "expo-router";
import { useEffect, useState } from "react";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";
import { supabase } from "@/src/lib/supabase";
import { restorePurchases } from "@/src/lib/purchases";
import {
  getReminderPreference,
  getNotificationStatus,
  requestNotificationPermission,
  setReminderPreference,
  type ReminderPreference,
  type NotificationPermission,
} from "@/src/lib/notifications";
import { flushRetryQueue, getQueueLength } from "@/src/lib/attemptQueue";
import { getLearningMotivation, getMotivationDisplay } from "@/src/lib/profile";
import type { LearningMotivation } from "@dash2zero/contracts";

import { GradientBackground, GlowOrb, JellySwitch, useToast, ConfirmSheet } from "@/src/components/d022";

const REMINDER_PRESETS: Array<{ hour: number; label: string }> = [
  { hour: 7,  label: "7 AM" },
  { hour: 9,  label: "9 AM" },
  { hour: 12, label: "Noon" },
  { hour: 19, label: "7 PM" },
];

export default function Settings() {
  const toast = useToast(); // P1.2 — Sync 완료/Reminder 결과 비차단 피드백 (D-034 정합)
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reminder, setReminder] = useState<ReminderPreference>({ enabled: false, hour: 9, minute: 0 });
  const [permStatus, setPermStatus] = useState<NotificationPermission>("undetermined");
  const [pendingSync, setPendingSync] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [motivation, setMotivation] = useState<LearningMotivation | null>(null);
  // D-024 — Haptic Feedback global toggle (Apple HIG / DESIGN_REVIEW §3 P1)
  const [hapticOn, setHapticOn] = useState<boolean>(isHapticEnabled());
  // SFX(UI 효과음) global toggle — 미니멀 고급 사운드
  const [sfxOn, setSfxOn] = useState<boolean>(isSfxEnabled());
  // D-031 / P1.5 ConfirmSheet — Delete account 단일화 (W19 D-1, 2026-06-04)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState<boolean>(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
    void getReminderPreference().then(setReminder);
    void getNotificationStatus().then(setPermStatus);
    void getQueueLength().then(setPendingSync);
    void getLearningMotivation().then(setMotivation);
    // launch 시점 initHaptics/initSound가 _layout에서 이미 호출됨 — in-memory state 반영
    setHapticOn(isHapticEnabled());
    setSfxOn(isSfxEnabled());
  }, []);

  async function handleHapticToggle(next: boolean) {
    // 마지막 한 번의 햅틱 — 사용자가 OFF로 설정하기 직전 변경을 확정 발화 (UX 정합)
    setHapticOn(next);
    await setHapticEnabledGlobal(next);
  }

  async function handleSfxToggle(next: boolean) {
    // ON으로 켜는 순간 미리듣기 한 번 (켜기 전엔 무음이라 OFF→ON 시에만 들림)
    await setSfxEnabledGlobal(next);
    setSfxOn(next);
    if (next) void playSfx("select");
  }

  async function handleSyncNow() {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await flushRetryQueue();
      setPendingSync(await getQueueLength());
      // Designer Q-3 정합 — 성공/완료는 비차단 toast (user-action 우선순위, 3s)
      toast.show(
        res.attempted === 0
          ? "Nothing to sync."
          : `${res.succeeded} synced${res.failed > 0 ? `, ${res.failed} still pending` : ""}.`,
        "user-action",
      );
    } catch (err) {
      // 차단성 에러 + 재시도 actionable — Designer Q-3 가드: Alert 유지가 아닌 persistent toast (action 있음)
      toast.show(
        err instanceof Error ? err.message : "Sync failed. Try again.",
        "error",
        { label: "Retry", onPress: () => void handleSyncNow() },
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handleReminderToggle(next: boolean) {
    if (next && permStatus !== "granted") {
      const granted = await requestNotificationPermission();
      setPermStatus(granted);
      if (granted !== "granted") {
        // 권한 거부 — 시스템 설정 안내가 필요한 차단성 상황은 Alert 유지 (Designer Q-3 가드)
        Alert.alert(
          "Notifications disabled",
          "Enable notifications in your device Settings to receive daily reminders.",
        );
        return;
      }
    }
    const updated: ReminderPreference = { ...reminder, enabled: next };
    await setReminderPreference(updated);
    setReminder(updated);
    // 토글 결과 비차단 피드백 (D-034)
    toast.show(next ? "Daily reminder on." : "Daily reminder off.", "user-action");
  }

  async function handleReminderTime(hour: number) {
    if (!reminder.enabled || permStatus !== "granted") return;
    const updated: ReminderPreference = { ...reminder, hour, minute: 0 };
    await setReminderPreference(updated);
    setReminder(updated);
    // chip 선택 결과 비차단 피드백 (D-034)
    const label = hour === 12 ? "noon" : hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
    toast.show(`Reminder time: ${label}.`, "user-action");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  async function handleRestore() {
    setBusy(true);
    const result = await restorePurchases();
    setBusy(false);
    // Designer Q-3 정합 — Premium 활성 결과는 비차단 user-action toast,
    // 실패는 actionable error (Retry persistent toast)
    if (result.success) {
      toast.show(
        result.isPremium
          ? "Premium subscription restored."
          : "No previous purchase found.",
        "user-action",
      );
    } else {
      toast.show(result.error ?? "Restore failed.", "error", {
        label: "Retry",
        onPress: () => void handleRestore(),
      });
    }
  }

  // D-031 / P1.5 (W19 D-1): Alert.alert를 ConfirmSheet로 교체 — 디자이너 §Q-4 활용처 단일화
  function handleDeleteAccountPress() {
    setDeleteConfirmVisible(true);
  }

  async function handleDeleteAccountConfirm() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: { export_data: true },
      });
      if (error) throw error;
      // 결과는 user-action toast (D-034 정합 — 비차단)
      toast.show(
        (data as { message?: string } | null)?.message ?? "Account deletion scheduled.",
        "user-action",
      );
      await supabase.auth.signOut();
      router.replace("/");
    } catch (err) {
      // 차단성 보고 — Designer Q-3 가드: 결제/계정 실패는 Alert 유지가 정합이나, 본 항목은
      //   actionable error이므로 persistent toast + Retry로 일관 처리
      toast.show(err instanceof Error ? err.message : "Failed. Try again.", "error", {
        label: "Retry",
        onPress: () => void handleDeleteAccountConfirm(),
      });
    } finally {
      setBusy(false);
    }
  }

  function row(label: string, sub: string | null, onPress?: () => void, danger = false) {
    return (
      <SettingsRow
        key={`${label}-${sub ?? ""}`}
        label={label}
        sub={sub}
        onPress={onPress}
        danger={danger}
      />
    );
  }

  function sectionLabel(text: string, accent: string) {
    return (
      <Text style={[styles.sectionLabel, { color: accent }]}>{text}</Text>
    );
  }

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.cyan" size={240} opacity={0.25} style={{ top: -60, right: -60 }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()} style={{ paddingHorizontal: spacing["space.5"], marginBottom: spacing["space.4"] }}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <Text style={styles.heading}>Settings</Text>

        {/* Account */}
        <View style={styles.section}>
          {sectionLabel("ACCOUNT", lightColors["neon.cyan"])}
          {email
            ? row(email, "Signed in · tap to sign out", handleSignOut)
            : row("Sign in", "Save your progress and unlock Premium", () => router.push("/auth/sign-in"))}
        </View>

        {/* Learning */}
        <View style={styles.section}>
          {sectionLabel("LEARNING", lightColors["neon.cyan"])}
          {row("Your progress", "Mastered + words needing review", () => router.push("/progress"))}
          {row(
            "Learning goal",
            motivation
              ? `${getMotivationDisplay(motivation).emoji} ${getMotivationDisplay(motivation).label}`
              : "Not set",
            () => router.push("/onboarding?mode=update")
          )}
        </View>

        {/* Subscription */}
        <View style={styles.section}>
          {sectionLabel("SUBSCRIPTION", lightColors["neon.pink"])}
          {row("Manage subscription", "Upgrade, change plan, or cancel", () => router.push("/paywall"))}
          {row("Restore purchases", "Use the Apple ID / Google account that purchased", busy ? undefined : handleRestore)}
        </View>

        {/* Sync (only if pending or in-progress) */}
        {(pendingSync > 0 || syncing) && email && (
          <View style={styles.section}>
            {sectionLabel("SYNC", lightColors["neon.cyan"])}
            {row(
              syncing ? "Syncing…" : `Sync ${pendingSync} pending attempt${pendingSync === 1 ? "" : "s"}`,
              "Retry uploads that failed earlier.",
              syncing ? undefined : handleSyncNow
            )}
          </View>
        )}

        {/* Sound & Haptics (D-024 — Apple HIG accessibility 정합) */}
        <View style={styles.section}>
          {sectionLabel("SOUND & HAPTICS", lightColors["neon.purple"])}
          <View style={styles.row}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Sound effects</Text>
                <Text style={styles.rowSub}>
                  {sfxOn
                    ? "Subtle sounds on taps, answers, and milestones."
                    : "All UI sound effects off."}
                </Text>
              </View>
              <JellySwitch
                value={sfxOn}
                onValueChange={handleSfxToggle}
                accessibilityLabel="Sound effects toggle"
                activeColor={lightColors["neon.purple"]}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Haptic feedback</Text>
                <Text style={styles.rowSub}>
                  {hapticOn
                    ? "Vibrations on press, correct, and wrong answers."
                    : "All in-app vibrations off."}
                </Text>
              </View>
              <JellySwitch
                value={hapticOn}
                onValueChange={handleHapticToggle}
                accessibilityLabel="Haptic feedback toggle"
                activeColor={lightColors["neon.purple"]}
              />
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          {sectionLabel("NOTIFICATIONS", lightColors["neon.lime"])}
          <View style={styles.row}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Daily reminder</Text>
                <Text style={styles.rowSub}>
                  {reminder.enabled
                    ? `Every day at ${String(reminder.hour).padStart(2, "0")}:${String(reminder.minute).padStart(2, "0")}`
                    : "Get a gentle nudge once a day"}
                </Text>
              </View>
              <Switch
                value={reminder.enabled}
                onValueChange={(v) => {
                  void hapticImpact("light");
                  void handleReminderToggle(v);
                }}
                trackColor={{ false: "#3F3F46", true: lightColors["neon.lime"] }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#3F3F46"
              />
            </View>
          </View>
          {reminder.enabled && permStatus === "granted" && (
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.rowSub}>Reminder time</Text>
              <View style={styles.chipRow}>
                {REMINDER_PRESETS.map((preset) => (
                  <ReminderChip
                    key={preset.hour}
                    label={preset.label}
                    isSel={reminder.hour === preset.hour}
                    onSelect={() => handleReminderTime(preset.hour)}
                  />
                ))}
              </View>
            </View>
          )}
          {permStatus === "denied" && (
            <Pressable onPress={() => Linking.openSettings()} style={styles.row}>
              <Text style={[styles.rowLabel, { color: lightColors["semantic.warning"] }]}>
                Notifications are blocked
              </Text>
              <Text style={styles.rowSub}>Tap to open device Settings.</Text>
            </Pressable>
          )}
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          {sectionLabel("PRIVACY", lightColors["neon.purple"])}
          {row("Privacy choices", "Manage analytics and diagnostics consent", () => router.push("/privacy-choices"))}
          {row("Privacy Policy", null, () => Linking.openURL("https://dash2zero.app/privacy"))}
          {row("Terms of Service", null, () => Linking.openURL("https://dash2zero.app/terms"))}
        </View>

        {/* About */}
        <View style={styles.section}>
          {sectionLabel("ABOUT", lightColors["neon.lime"])}
          {row("Version", "0.1.0 (M2 thin slice)", undefined)}
          {row("Language", "English (US)", undefined)}
        </View>

        {/* Danger zone */}
        {email && (
          <View style={styles.section}>
            {sectionLabel("DANGER", lightColors["semantic.danger"])}
            <View style={styles.dangerWrap}>
              {row("Delete account", "Permanently delete your data within 30 days", busy ? undefined : handleDeleteAccountPress, true)}
            </View>
          </View>
        )}
      </ScrollView>

      {/* D-031 / P1.5 (W19 D-1): Delete account ConfirmSheet — Alert.alert 대체 */}
      <ConfirmSheet
        visible={deleteConfirmVisible}
        onClose={() => setDeleteConfirmVisible(false)}
        onConfirm={handleDeleteAccountConfirm}
        title="Delete account?"
        body="Your data will be permanently deleted within 30 days. Sign in again before then to cancel. Active subscriptions must be cancelled separately in App Store or Google Play."
        confirmLabel="Delete account"
      />
    </GradientBackground>
  );
}

// Motion v1.1 sub-components — Settings row와 reminder chip은 각자 scale state 필요
function SettingsRow({
  label,
  sub,
  onPress,
  danger = false,
}: {
  label: string;
  sub: string | null;
  onPress?: () => void;
  danger?: boolean;
}) {
  const motion = useMotionPress({ hapticStyle: "light", disabled: !onPress });
  return (
    <Pressable
      onPress={
        onPress
          ? () => {
              motion.haptic();
              onPress();
            }
          : undefined
      }
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress && { backgroundColor: "rgba(255,255,255,0.06)" },
      ]}
    >
      <Animated.View style={motion.animatedStyle}>
        <Text style={[styles.rowLabel, danger && { color: lightColors["semantic.danger"] }]}>
          {label}
        </Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </Animated.View>
    </Pressable>
  );
}

function ReminderChip({
  label,
  isSel,
  onSelect,
}: {
  label: string;
  isSel: boolean;
  onSelect: () => void;
}) {
  const motion = useMotionPress({ hapticStyle: "light" });
  return (
    <Pressable
      onPress={() => {
        motion.haptic();
        onSelect();
      }}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSel }}
      style={[styles.chip, isSel && styles.chipSelected]}
    >
      <Animated.View style={motion.animatedStyle}>
        <Text style={[styles.chipText, isSel && { color: lightColors["neon.lime"], fontWeight: "800" }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing["space.12"],
    paddingBottom: spacing["space.6"],
  },
  back: {
    color: lightColors["neon.cyan"],
    fontSize: typeScale["text.body"].fontSize,
    fontWeight: "600",
  },
  heading: {
    fontSize: typeScale["text.heading.lg"].fontSize,
    lineHeight: typeScale["text.heading.lg"].lineHeight,
    fontWeight: "900",
    color: lightColors["text.primary"],
    paddingHorizontal: spacing["space.5"],
    marginBottom: spacing["space.6"],
  },
  section: {
    marginBottom: spacing["space.6"],
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    paddingHorizontal: spacing["space.5"],
    marginBottom: spacing["space.2"],
  },
  row: {
    minHeight: 56,
    paddingHorizontal: spacing["space.5"],
    paddingVertical: spacing["space.3"],
    borderBottomWidth: 1,
    borderBottomColor: lightColors["border.subtle"],
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing["space.2"],
    marginTop: spacing["space.2"],
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: spacing["space.4"],
    paddingVertical: spacing["space.2"],
    borderRadius: 999,
    borderWidth: 1,
    borderColor: lightColors["border.subtle"],
    backgroundColor: lightColors["surface.card"],
  },
  chipSelected: {
    borderColor: lightColors["neon.lime"],
    borderWidth: 2,
    backgroundColor: "rgba(132,204,22,0.08)",
  },
  chipText: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.secondary"],
    fontWeight: "600",
  },
  rowLabel: {
    fontSize: typeScale["text.body"].fontSize,
    color: lightColors["text.primary"],
    fontWeight: "600",
  },
  rowSub: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.secondary"],
    marginTop: spacing["space.1"],
  },
  dangerWrap: {
    borderLeftWidth: 3,
    borderLeftColor: lightColors["semantic.danger"],
    marginHorizontal: spacing["space.5"],
    backgroundColor: "rgba(248,113,113,0.06)",
    borderRadius: 12,
  },
});
