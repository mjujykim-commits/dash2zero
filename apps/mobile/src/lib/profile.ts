/**
 * Local profile preferences — SecureStore 기반
 *
 * 결정 (CC-04 + USER_JOURNEYS J-001):
 *   - 게스트도 motivation 저장 (sign-in 시 server profile.learning_motivation upsert로 머지)
 *   - locale은 MVP en-US 고정 (M5 i18n 진입 시 사용자 선택 가능)
 *
 * 책임 agent: frontend
 */

import * as SecureStore from "expo-secure-store";
import type { LearningMotivation } from "@dash2zero/contracts";

const MOTIVATION_KEY = "profile_learning_motivation";
const LAST_COMPLETED_WORD_KEY = "profile_last_completed_word_id";
const HAPTIC_ENABLED_KEY = "profile_haptic_enabled";
const SFX_ENABLED_KEY = "profile_sfx_enabled";

export async function getLearningMotivation(): Promise<LearningMotivation | null> {
  const v = await SecureStore.getItemAsync(MOTIVATION_KEY);
  if (v === "kpop" || v === "kdrama" || v === "travel" || v === "other") return v;
  return null;
}

export async function setLearningMotivation(motivation: LearningMotivation): Promise<void> {
  await SecureStore.setItemAsync(MOTIVATION_KEY, motivation);
}

export async function clearLearningMotivation(): Promise<void> {
  await SecureStore.deleteItemAsync(MOTIVATION_KEY);
}

// ============================================================================
// Last completed word — useEntryWord에서 다음 학습 시작점 결정에 사용 (Task #82-c)
// ============================================================================

export async function getLastCompletedWordId(): Promise<string | null> {
  return SecureStore.getItemAsync(LAST_COMPLETED_WORD_KEY);
}

export async function setLastCompletedWordId(wordId: string): Promise<void> {
  await SecureStore.setItemAsync(LAST_COMPLETED_WORD_KEY, wordId);
}

export async function clearLastCompletedWordId(): Promise<void> {
  await SecureStore.deleteItemAsync(LAST_COMPLETED_WORD_KEY);
}

// ============================================================================
// Haptic Feedback toggle — Apple HIG 정합 (D-024, Motion v1.1 후속)
// AsyncStorage 디자이너 권고 → SecureStore로 일관성 유지 (sensitive 아니지만
// dash2zero codebase는 SecureStore 단일 표준). 동등 persistence 보장.
// ============================================================================

export async function getHapticEnabled(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(HAPTIC_ENABLED_KEY);
  // default true — 사용자가 명시적으로 끄지 않은 한 활성 (Motion v1.1 §2 Q-MOTION-4 정합)
  return v === null ? true : v === "true";
}

export async function setHapticEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(HAPTIC_ENABLED_KEY, enabled ? "true" : "false");
}

// ============================================================================
// Sound Effects (SFX) toggle — "톡톡 튀는" UI 사운드. 발음 음원과 별개.
// Settings "SOUND & HAPTICS" 섹션에서 토글 (haptic과 동일 패턴).
// ============================================================================

export async function getSfxEnabled(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(SFX_ENABLED_KEY);
  // default true — 첫 실행부터 사운드 경험 (사용자가 끄지 않은 한 활성)
  return v === null ? true : v === "true";
}

export async function setSfxEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(SFX_ENABLED_KEY, enabled ? "true" : "false");
}

// ============================================================================
// Display helpers
// ============================================================================

export interface MotivationDisplay {
  label: string;
  emoji: string;
  /** Home 화면 인사. 학습 동기에 따른 차별화된 카피 */
  greeting: string;
}

const DISPLAY: Record<LearningMotivation, MotivationDisplay> = {
  kpop:   { label: "K-pop fan",     emoji: "🎤", greeting: "Pick up where your favorite idols left off." },
  kdrama: { label: "K-drama lover", emoji: "🎬", greeting: "One scene closer to understanding the dialogue." },
  travel: { label: "Traveler",      emoji: "✈️", greeting: "Pack one more phrase for your trip." },
  other:  { label: "Learner",       emoji: "💫", greeting: "Korean words. Down to zero friction." },
};

export function getMotivationDisplay(motivation: LearningMotivation | null): MotivationDisplay {
  return DISPLAY[motivation ?? "other"];
}
