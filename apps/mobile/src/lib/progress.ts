/**
 * progress — 학습 성장 에코시스템(로컬, SecureStore).
 *
 * 두 축: XP/레벨(게임 진행) + 아는 단어 수/실력 등급(실제 한국어 수준) + 연속학습(streak).
 * 세션 종료 시 recordSession()으로 기록 → RewardPayload 반환(리워드 애니메이션 입력).
 */

import * as SecureStore from "expo-secure-store";

const KEY = "d2z_progress_v1";
export const XP_PER_CORRECT = 10;

export interface ProgressState {
  xp: number;
  mastered: string[]; // 한 번이라도 맞힌 고유 단어(korean)
  streakDays: number;
  lastActiveISO: string; // YYYY-MM-DD
  sessions: number;
}

const DEFAULT: ProgressState = { xp: 0, mastered: [], streakDays: 0, lastActiveISO: "", sessions: 0 };

let cache: ProgressState | null = null;

async function load(): Promise<ProgressState> {
  if (cache) return cache;
  try {
    const v = await SecureStore.getItemAsync(KEY);
    cache = v ? { ...DEFAULT, ...(JSON.parse(v) as Partial<ProgressState>) } : { ...DEFAULT };
  } catch {
    cache = { ...DEFAULT };
  }
  return cache;
}

async function persist(s: ProgressState): Promise<void> {
  cache = s;
  try { await SecureStore.setItemAsync(KEY, JSON.stringify(s)); } catch { /* 저장 실패 무시 */ }
}

// ── 레벨 수학 ──
// 레벨 L 도달 누적 XP = 25*L*(L-1) (L→L+1 필요치 = 50*L)
export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor((25 + Math.sqrt(625 + 100 * Math.max(0, xp))) / 50));
}
export function xpToReachLevel(L: number): number {
  return 25 * L * (L - 1);
}
export interface LevelProgress {
  level: number;
  into: number; // 현재 레벨에서 쌓은 XP
  span: number; // 이번 레벨 총 필요 XP
  ratio: number; // 0..1
  toNext: number; // 다음 레벨까지 남은 XP
}
export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  const cur = xpToReachLevel(level);
  const next = xpToReachLevel(level + 1);
  const span = next - cur;
  const into = xp - cur;
  return { level, into, span, ratio: span > 0 ? into / span : 0, toNext: next - xp };
}

// ── 실력 등급(아는 단어 수 기준) ──
export interface VocabBand { key: string; ko: string; en: string; min: number; next: number | null }
export function vocabBand(mastered: number): VocabBand {
  if (mastered < 100) return { key: "novice", ko: "입문", en: "Novice", min: 0, next: 100 };
  if (mastered < 500) return { key: "beginner", ko: "초급", en: "Beginner", min: 100, next: 500 };
  if (mastered < 1500) return { key: "intermediate", ko: "중급", en: "Intermediate", min: 500, next: 1500 };
  if (mastered < 3000) return { key: "upper", ko: "중상급", en: "Upper-Int", min: 1500, next: 3000 };
  return { key: "advanced", ko: "고급", en: "Advanced", min: 3000, next: null };
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isYesterday(prev: string, today: string): boolean {
  if (!prev) return false;
  const t = new Date(today + "T00:00:00");
  t.setDate(t.getDate() - 1);
  const y = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  return prev === y;
}

export interface SessionResult { korean: string; correct: boolean }
export interface RewardPayload {
  correct: number; total: number;
  xpGained: number; xpBefore: number; xpAfter: number;
  levelBefore: number; levelAfter: number; leveledUp: boolean;
  masteredBefore: number; masteredAfter: number; newWords: number;
  bandBefore: VocabBand; bandAfter: VocabBand; bandUp: boolean;
  streakDays: number;
}

/** 세션 결과 기록 + 리워드 페이로드 반환. */
export async function recordSession(results: SessionResult[]): Promise<RewardPayload> {
  const s = await load();
  const xpBefore = s.xp;
  const levelBefore = levelForXp(s.xp);
  const masteredBefore = s.mastered.length;

  const set = new Set(s.mastered);
  let correct = 0;
  for (const r of results) {
    if (r.correct) { correct++; set.add(r.korean); }
  }
  const xpGained = correct * XP_PER_CORRECT;
  s.xp += xpGained;
  s.mastered = [...set];

  // 연속 학습
  const today = todayISO();
  if (s.lastActiveISO !== today) {
    s.streakDays = isYesterday(s.lastActiveISO, today) ? s.streakDays + 1 : 1;
    s.lastActiveISO = today;
  } else if (s.streakDays === 0) {
    s.streakDays = 1;
  }
  s.sessions += 1;
  await persist(s);

  const levelAfter = levelForXp(s.xp);
  const masteredAfter = s.mastered.length;
  const bandBefore = vocabBand(masteredBefore);
  const bandAfter = vocabBand(masteredAfter);
  return {
    correct, total: results.length,
    xpGained, xpBefore, xpAfter: s.xp,
    levelBefore, levelAfter, leveledUp: levelAfter > levelBefore,
    masteredBefore, masteredAfter, newWords: masteredAfter - masteredBefore,
    bandBefore, bandAfter, bandUp: bandAfter.key !== bandBefore.key,
    streakDays: s.streakDays,
  };
}

/** 현재 진행 상황 요약(메뉴 위젯용). */
export async function getProgress() {
  const s = await load();
  const lp = levelProgress(s.xp);
  return {
    xp: s.xp,
    level: lp.level,
    ratio: lp.ratio,
    toNext: lp.toNext,
    mastered: s.mastered.length,
    band: vocabBand(s.mastered.length),
    streak: s.streakDays,
    sessions: s.sessions,
  };
}
