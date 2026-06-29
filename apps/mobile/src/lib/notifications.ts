/**
 * Push / Local notifications — expo-notifications
 *
 * 결정 (CC2-18 + CC3-04 + Q-FE-NEW-008):
 *   - first-run에서 권한 요청 안 함 (privacy choices 우선)
 *   - 첫 lesson 완료 후 권한 요청 (학습 가치 경험 후)
 *   - 거부 사용자 fallback: in-app banner + Settings에서 재요청 가능
 *   - 학습 리마인더: 매일 사용자 로컬 09:00 (사용자가 변경 가능 — Settings)
 *   - UK 13-17세는 마케팅 push 차단 (CC2-05) — MVP에서는 학습 리마인더만이라 적용 단순
 */

import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const PROMPTED_KEY = "notification_permission_prompted";
const REMINDER_ENABLED_KEY = "notification_reminder_enabled";
const REMINDER_HOUR_KEY = "notification_reminder_hour";
const REMINDER_MINUTE_KEY = "notification_reminder_minute";

export const DEFAULT_REMINDER_HOUR = 9;
export const DEFAULT_REMINDER_MINUTE = 0;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false, // CC2-25 차분한 톤
    shouldSetBadge: false,
  }),
});

export type NotificationPermission = "granted" | "denied" | "undetermined";

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return "granted";

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: false,
      provisional: false,
    },
  });
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

/**
 * 매일 학습 리마인더 schedule.
 *
 * @param hour — 0-23
 * @param minute — 0-59
 */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time for Korean.",
      body: "3 words today. 3 minutes.",
      data: { type: "daily_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getNotificationStatus(): Promise<NotificationPermission> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

// ============================================================================
// First-prompt 정책 (Q-FE-NEW-008): 첫 lesson 완료 후 1회 요청
// ============================================================================

export async function hasBeenPromptedOnce(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(PROMPTED_KEY);
  return v === "1";
}

export async function markPromptedOnce(): Promise<void> {
  await SecureStore.setItemAsync(PROMPTED_KEY, "1");
}

export interface ReminderPreference {
  enabled: boolean;
  hour: number;
  minute: number;
}

export async function getReminderPreference(): Promise<ReminderPreference> {
  const enabled = (await SecureStore.getItemAsync(REMINDER_ENABLED_KEY)) === "1";
  const hourRaw = await SecureStore.getItemAsync(REMINDER_HOUR_KEY);
  const minuteRaw = await SecureStore.getItemAsync(REMINDER_MINUTE_KEY);
  const hour = hourRaw != null ? Number(hourRaw) : DEFAULT_REMINDER_HOUR;
  const minute = minuteRaw != null ? Number(minuteRaw) : DEFAULT_REMINDER_MINUTE;
  return {
    enabled,
    hour: Number.isFinite(hour) && hour >= 0 && hour <= 23 ? hour : DEFAULT_REMINDER_HOUR,
    minute: Number.isFinite(minute) && minute >= 0 && minute <= 59 ? minute : DEFAULT_REMINDER_MINUTE,
  };
}

export async function setReminderPreference(pref: ReminderPreference): Promise<void> {
  await SecureStore.setItemAsync(REMINDER_ENABLED_KEY, pref.enabled ? "1" : "0");
  await SecureStore.setItemAsync(REMINDER_HOUR_KEY, String(pref.hour));
  await SecureStore.setItemAsync(REMINDER_MINUTE_KEY, String(pref.minute));

  if (pref.enabled) {
    await scheduleDailyReminder(pref.hour, pref.minute);
  } else {
    await cancelAllReminders();
  }
}

/**
 * 첫 lesson 완료 시점에 1회 호출 (Q-FE-NEW-008).
 * 권한 부여 시 default 09:00 daily reminder schedule.
 *
 * @returns 권한 결과 + reminder schedule 여부
 */
export async function maybePromptAfterFirstLesson(): Promise<{
  status: NotificationPermission;
  reminderScheduled: boolean;
}> {
  if (await hasBeenPromptedOnce()) {
    // 이미 요청한 적 있음 — silent return
    return { status: await getNotificationStatus(), reminderScheduled: false };
  }
  await markPromptedOnce();

  const status = await requestNotificationPermission();
  if (status === "granted") {
    await setReminderPreference({
      enabled: true,
      hour: DEFAULT_REMINDER_HOUR,
      minute: DEFAULT_REMINDER_MINUTE,
    });
    return { status, reminderScheduled: true };
  }
  return { status, reminderScheduled: false };
}

// Platform import 사용 (향후 Android-specific channel 등 — 보존)
void Platform;
