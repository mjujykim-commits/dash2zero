/**
 * examReviewStore — TOPIK/KIIP(Exam) 오답 단어 저장(SecureStore). 이모지 reviewStore와 분리.
 *
 * 틀린 단어를 gloss/romanization과 함께 누적(맞히면 감소, 0이면 제거).
 * Exam 복습 모드가 이 목록으로 퀴즈를 구성(트랙 데이터 없이 자체 완결).
 */

import * as SecureStore from "expo-secure-store";

const KEY = "exam_review_wrong";
const MAX = 150;

export interface ExamWrongWord { k: string; g: string; r: string; c: number }
type Store = Record<string, { g: string; r: string; c: number }>;

async function load(): Promise<Store> {
  try {
    const v = await SecureStore.getItemAsync(KEY);
    return v ? (JSON.parse(v) as Store) : {};
  } catch {
    return {};
  }
}
async function save(s: Store): Promise<void> {
  let entries = Object.entries(s).filter(([, v]) => v.c > 0);
  if (entries.length > MAX) entries = entries.sort((a, b) => b[1].c - a[1].c).slice(0, MAX);
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch { /* 저장 실패 무시 */ }
}

/** Exam 답변 기록 — 틀리면 +1(뜻/발음 저장), 맞히면 -1(0이면 제거). */
export async function recordExamAnswer(word: { k: string; g: string; r: string }, correct: boolean): Promise<void> {
  const s = await load();
  if (correct) {
    const e = s[word.k];
    if (e) { e.c -= 1; if (e.c <= 0) delete s[word.k]; }
  } else {
    const e = s[word.k] ?? { g: word.g, r: word.r, c: 0 };
    e.c += 1; e.g = word.g; e.r = word.r;
    s[word.k] = e;
  }
  await save(s);
}

/** 오답 단어(많이 틀린 순). */
export async function getExamWrong(): Promise<ExamWrongWord[]> {
  const s = await load();
  return Object.entries(s).map(([k, v]) => ({ k, g: v.g, r: v.r, c: v.c })).sort((a, b) => b.c - a.c);
}

/** 오답 단어 수. */
export async function examWrongCount(): Promise<number> {
  return Object.keys(await load()).length;
}
