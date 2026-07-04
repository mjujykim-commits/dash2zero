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
  dailyGoal: number; // 오늘 목표(정답 수)
  dailyDate: string; // 오늘 날짜(YYYY-MM-DD)
  dailyCount: number; // 오늘 정답 수
  unlocked: string[]; // 획득한 업적 id
}

const DEFAULT: ProgressState = {
  xp: 0, mastered: [], streakDays: 0, lastActiveISO: "", sessions: 0,
  dailyGoal: 20, dailyDate: "", dailyCount: 0, unlocked: [],
};

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

// ── 레벨 타이틀 ──
export interface LevelTitle { ko: string; en: string }
export function levelTitle(level: number): LevelTitle {
  if (level >= 50) return { ko: "원어민급", en: "Fluent" };
  if (level >= 30) return { ko: "언어 마스터", en: "Language Master" };
  if (level >= 20) return { ko: "한국어 능력자", en: "Proficient" };
  if (level >= 15) return { ko: "회화 도전자", en: "Conversationalist" };
  if (level >= 10) return { ko: "문장 탐험가", en: "Sentence Explorer" };
  if (level >= 7) return { ko: "단어 수집가", en: "Word Collector" };
  if (level >= 5) return { ko: "한글 초보", en: "Hangul Novice" };
  if (level >= 3) return { ko: "입문자", en: "Beginner" };
  return { ko: "새싹", en: "Sprout" };
}

// ── 업적/배지 ──
export interface Achievement {
  id: string; icon: string; title: string; desc: string;
  test: (e: AchievementEval) => boolean;
}
export interface AchievementEval {
  xp: number; level: number; mastered: number; streak: number; sessions: number;
  perfectSession: boolean; dailyReached: boolean;
}
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_session", icon: "🌱", title: "First Step", desc: "Finish your first session", test: (e) => e.sessions >= 1 },
  { id: "words_100", icon: "🧩", title: "100 Words", desc: "Learn 100 words", test: (e) => e.mastered >= 100 },
  { id: "words_500", icon: "📚", title: "500 Words", desc: "Learn 500 words", test: (e) => e.mastered >= 500 },
  { id: "words_1000", icon: "🎓", title: "1,000 Words", desc: "Learn 1,000 words", test: (e) => e.mastered >= 1000 },
  { id: "words_3000", icon: "🏆", title: "3,000 Words", desc: "Learn 3,000 words", test: (e) => e.mastered >= 3000 },
  { id: "streak_3", icon: "🔥", title: "3-Day Streak", desc: "Study 3 days in a row", test: (e) => e.streak >= 3 },
  { id: "streak_7", icon: "🔥", title: "7-Day Streak", desc: "Study 7 days in a row", test: (e) => e.streak >= 7 },
  { id: "streak_30", icon: "🌋", title: "30-Day Streak", desc: "Study 30 days in a row", test: (e) => e.streak >= 30 },
  { id: "level_5", icon: "⭐", title: "Level 5", desc: "Reach level 5", test: (e) => e.level >= 5 },
  { id: "level_10", icon: "🌟", title: "Level 10", desc: "Reach level 10", test: (e) => e.level >= 10 },
  { id: "level_25", icon: "💫", title: "Level 25", desc: "Reach level 25", test: (e) => e.level >= 25 },
  { id: "flawless", icon: "🎯", title: "Flawless", desc: "Perfect round (5+ questions)", test: (e) => e.perfectSession },
  { id: "goal_getter", icon: "✅", title: "Goal Getter", desc: "Hit your daily goal", test: (e) => e.dailyReached },
];

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
  titleAfter: LevelTitle; titleUp: boolean;
  masteredBefore: number; masteredAfter: number; newWords: number;
  bandBefore: VocabBand; bandAfter: VocabBand; bandUp: boolean;
  streakDays: number;
  dailyCount: number; dailyGoal: number; dailyReached: boolean;
  newAchievements: Achievement[];
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

  const today = todayISO();

  // 연속 학습
  if (s.lastActiveISO !== today) {
    s.streakDays = isYesterday(s.lastActiveISO, today) ? s.streakDays + 1 : 1;
    s.lastActiveISO = today;
  } else if (s.streakDays === 0) {
    s.streakDays = 1;
  }

  // 일일 목표 (날짜 바뀌면 리셋)
  const dailyBefore = s.dailyDate === today ? s.dailyCount : 0;
  s.dailyDate = today;
  s.dailyCount = dailyBefore + correct;
  const goal = s.dailyGoal || 20;
  const dailyReached = dailyBefore < goal && s.dailyCount >= goal;

  s.sessions += 1;

  const levelAfter = levelForXp(s.xp);
  const masteredAfter = s.mastered.length;
  const perfectSession = results.length >= 5 && correct === results.length;

  // 업적 평가 (신규 획득분)
  const evalState: AchievementEval = {
    xp: s.xp, level: levelAfter, mastered: masteredAfter, streak: s.streakDays,
    sessions: s.sessions, perfectSession, dailyReached,
  };
  const already = new Set(s.unlocked);
  const newAchievements = ACHIEVEMENTS.filter((a) => !already.has(a.id) && a.test(evalState));
  if (newAchievements.length) s.unlocked = [...s.unlocked, ...newAchievements.map((a) => a.id)];

  await persist(s);

  const bandBefore = vocabBand(masteredBefore);
  const bandAfter = vocabBand(masteredAfter);
  const titleAfter = levelTitle(levelAfter);
  return {
    correct, total: results.length,
    xpGained, xpBefore, xpAfter: s.xp,
    levelBefore, levelAfter, leveledUp: levelAfter > levelBefore,
    titleAfter, titleUp: levelTitle(levelBefore).en !== titleAfter.en,
    masteredBefore, masteredAfter, newWords: masteredAfter - masteredBefore,
    bandBefore, bandAfter, bandUp: bandAfter.key !== bandBefore.key,
    streakDays: s.streakDays,
    dailyCount: s.dailyCount, dailyGoal: goal, dailyReached,
    newAchievements,
  };
}

/** 현재 진행 상황 요약(메뉴 위젯용). */
export async function getProgress() {
  const s = await load();
  const lp = levelProgress(s.xp);
  const goal = s.dailyGoal || 20;
  const dailyCount = s.dailyDate === todayISO() ? s.dailyCount : 0;
  return {
    xp: s.xp,
    level: lp.level,
    title: levelTitle(lp.level),
    ratio: lp.ratio,
    toNext: lp.toNext,
    mastered: s.mastered.length,
    band: vocabBand(s.mastered.length),
    streak: s.streakDays,
    sessions: s.sessions,
    dailyCount,
    dailyGoal: goal,
    dailyRatio: Math.min(1, dailyCount / goal),
    unlockedCount: s.unlocked.length,
  };
}

/** 마스터한(한 번이라도 맞힌) 단어 집합 — 레벨별 진도 계산용. */
export async function getMasteredKoreans(): Promise<Set<string>> {
  const s = await load();
  return new Set(s.mastered);
}

/** 일일 목표 변경(10/20/30/50 등). */
export async function setDailyGoal(n: number): Promise<void> {
  const s = await load();
  s.dailyGoal = Math.max(5, Math.min(200, Math.round(n)));
  await persist(s);
}

/** 전체 업적 + 획득 여부. */
export async function getAchievements(): Promise<Array<Achievement & { unlocked: boolean }>> {
  const s = await load();
  const set = new Set(s.unlocked);
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: set.has(a.id) }));
}
