/**
 * Global Haptic wrapper — Apple HIG accessibility 정합 (Motion v1.1 후속, D-024)
 *
 * Source of Truth:
 *   - docs/brand/MOTION_SYSTEM_SPEC.md v1.1 §2 Q-MOTION-4 [b] (expo-haptics 사용)
 *   - docs/security/MOTION_SECURITY_REVIEW.md S-MOTION-4 (Apple HIG: Haptic toggle 의무)
 *   - docs/brand/DESIGN_REVIEW_W16_MOTION.md §3 P1 (Settings Haptic toggle 권고)
 *
 * 역할:
 *   - expo-haptics 호출 진입점 단일화. 직접 `import * as Haptics from "expo-haptics"` 사용 금지 (P1 이후).
 *   - 사용자가 Settings에서 끄면 모든 호출 noop. SecureStore 영구 저장.
 *   - 모듈 단위 in-memory cache로 호출 시점마다 SecureStore 읽기 회피 (60fps 정합).
 *
 * 사용:
 *   import { hapticImpact, hapticNotification, initHaptics, setHapticEnabledGlobal } from "@/src/lib/haptics";
 *   await initHaptics();                                       // _layout launch 시점 1회
 *   void hapticImpact("light");                                 // Press 시점
 *   void hapticNotification("success");                         // 정답 시점
 *   await setHapticEnabledGlobal(false);                        // Settings toggle off 시점
 */

import * as Haptics from "expo-haptics";
import { getHapticEnabled, setHapticEnabled } from "@/src/lib/profile";

// In-memory cache — initHaptics() 호출 후 정확. 호출 전에는 true (default 활성).
let enabled = true;
let initialized = false;

/** App launch 시 호출. SecureStore에서 사용자 설정을 읽어 in-memory에 적재. */
export async function initHaptics(): Promise<void> {
  try {
    enabled = await getHapticEnabled();
  } catch {
    // SecureStore 실패 시 default 활성 (Motion v1.1 정합)
    enabled = true;
  } finally {
    initialized = true;
  }
}

/** 현재 in-memory 활성 여부. UI 표시용. SecureStore 비동기 호출 회피. */
export function isHapticEnabled(): boolean {
  return enabled;
}

/** Settings toggle 변경 시 호출. SecureStore 저장 + in-memory 동기. */
export async function setHapticEnabledGlobal(next: boolean): Promise<void> {
  enabled = next;
  await setHapticEnabled(next);
}

// ============================================================================
// Wrapper APIs — 모든 호출처는 이 wrapper만 사용
// ============================================================================

export type ImpactStyle = "light" | "medium" | "heavy";
export type NotificationType = "success" | "warning" | "error";

const IMPACT_MAP = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
} as const;

const NOTIFICATION_MAP = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
} as const;

/**
 * Light/Medium/Heavy impact. enabled=false 시 즉시 resolve (no fire).
 * Promise 반환 (호출자가 await 가능, 보통 void 사용).
 */
export function hapticImpact(style: ImpactStyle = "light"): Promise<void> {
  if (!enabled) return Promise.resolve();
  return Haptics.impactAsync(IMPACT_MAP[style]).catch(() => undefined);
}

/**
 * Success/Warning/Error notification. enabled=false 시 즉시 resolve.
 */
export function hapticNotification(type: NotificationType): Promise<void> {
  if (!enabled) return Promise.resolve();
  return Haptics.notificationAsync(NOTIFICATION_MAP[type]).catch(() => undefined);
}
