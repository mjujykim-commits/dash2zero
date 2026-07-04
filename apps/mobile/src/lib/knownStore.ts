/**
 * knownStore — 사용자가 "이미 안다"고 표시한 단어(korean) 저장(SecureStore).
 *
 * Study 모드는 known 단어를 제외하고 출제(아는 건 안 배움).
 * Quiz 모드는 known이라도 전부 출제하며, 틀리면 markUnknown으로 자동 복귀.
 * korean 기준이라 이모지/TOPIK/KIIP 학습에서 공유.
 */

import * as SecureStore from "expo-secure-store";

const KEY = "known_words";
let cache: Set<string> | null = null;

async function load(): Promise<Set<string>> {
  if (cache) return cache;
  try {
    const v = await SecureStore.getItemAsync(KEY);
    cache = new Set(v ? (JSON.parse(v) as string[]) : []);
  } catch {
    cache = new Set();
  }
  return cache;
}
async function persist(s: Set<string>): Promise<void> {
  cache = s;
  try { await SecureStore.setItemAsync(KEY, JSON.stringify([...s])); } catch { /* 무시 */ }
}

export async function getKnownSet(): Promise<Set<string>> {
  return new Set(await load());
}

/** "안다"로 표시 (Study에서 제외됨). */
export async function markKnown(korean: string): Promise<void> {
  const s = await load();
  if (!s.has(korean)) { s.add(korean); await persist(s); }
}

/** "모름"으로 되돌림 (퀴즈 오답 시 자동 호출; known 아니면 no-op). */
export async function markUnknown(korean: string): Promise<void> {
  const s = await load();
  if (s.has(korean)) { s.delete(korean); await persist(s); }
}

export async function knownCount(): Promise<number> {
  return (await load()).size;
}
