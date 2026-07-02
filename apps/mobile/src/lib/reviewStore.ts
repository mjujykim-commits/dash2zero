/**
 * reviewStore — Picture Quiz 오답 단어 저장 (SecureStore).
 *
 * 퀴즈에서 틀린 단어(korean)를 카운트로 누적, 맞히면 감소(0이면 제거).
 * 복습 모드(picture-quiz?review=1)가 이 목록을 불러와 출제.
 * 저장 폭주 방지 위해 상위 MAX개만 유지.
 */

import * as SecureStore from "expo-secure-store";

const KEY = "picture_quiz_wrong";
const MAX = 80;

async function load(): Promise<Record<string, number>> {
  try {
    const v = await SecureStore.getItemAsync(KEY);
    return v ? (JSON.parse(v) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

async function save(map: Record<string, number>): Promise<void> {
  let entries = Object.entries(map).filter(([, n]) => n > 0);
  if (entries.length > MAX) {
    entries = entries.sort((a, b) => b[1] - a[1]).slice(0, MAX);
  }
  const obj = Object.fromEntries(entries);
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(obj));
  } catch {
    // 저장 실패는 무시(복습은 부가 기능)
  }
}

/** 퀴즈 답변 기록 — 틀리면 +1, 맞히면 -1(0이면 제거). */
export async function recordAnswer(korean: string, correct: boolean): Promise<void> {
  const m = await load();
  if (correct) {
    if (m[korean]) {
      m[korean] -= 1;
      if (m[korean] <= 0) delete m[korean];
    }
  } else {
    m[korean] = (m[korean] || 0) + 1;
  }
  await save(m);
}

/** 오답 단어 목록 (많이 틀린 순). */
export async function getWrongKoreans(): Promise<string[]> {
  const m = await load();
  return Object.keys(m).sort((a, b) => (m[b] ?? 0) - (m[a] ?? 0));
}

/** 오답 단어 수. */
export async function wrongCount(): Promise<number> {
  return Object.keys(await load()).length;
}
