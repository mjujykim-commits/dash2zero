/**
 * Guest mode local store — expo-sqlite
 *
 * 책임 (CC-04 + CC-16 + Q-AR-DOC-009):
 *   - 게스트 사용자의 학습 상태(user_word_states) + attempts를 로컬에 저장
 *   - sign-in 시 SecureStore에서 device_install_id + attempts 읽어 머지 트리거
 *   - 오프라인 학습 가능 (attempts queue → 온라인 시 server SSOT로 동기화)
 *
 * Schema migration: schema_version 컬럼으로 추적 (Q-AR-DOC-009).
 * MVP는 schema v1만 (M3에서 마이그레이션 도구 추가).
 */

import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import type { SrsStage } from "@/src/srs/leitner";

const DB_NAME = "dash2zero-guest.db";
const SCHEMA_VERSION = 1;
const DEVICE_INSTALL_ID_KEY = "guest_device_install_id";
const ATTEMPTS_QUEUE_KEY = "guest_attempts";

let db: SQLite.SQLiteDatabase | null = null;

export async function initGuestDb(): Promise<void> {
  if (db) return;
  db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS guest_uws (
      word_id TEXT PRIMARY KEY,
      stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 5),
      weak INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      incorrect_count INTEGER NOT NULL DEFAULT 0,
      last_attempt_at TEXT,
      last_attempt_correct INTEGER,
      next_due_at TEXT NOT NULL,
      mastered_at TEXT,
      last_seen_content_version INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS guest_attempts (
      attempt_id TEXT PRIMARY KEY,
      client_attempt_id TEXT NOT NULL UNIQUE,
      word_id TEXT NOT NULL,
      correct INTEGER NOT NULL,
      question_template_id TEXT,
      content_version_at_attempt INTEGER NOT NULL,
      occurred_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS guest_daily_usage (
      local_day TEXT PRIMARY KEY,
      timezone TEXT NOT NULL,
      new_words_started INTEGER NOT NULL DEFAULT 0,
      reviews_completed INTEGER NOT NULL DEFAULT 0,
      lesson_completed INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_guest_attempts_unsynced ON guest_attempts (synced) WHERE synced = 0;
    CREATE INDEX IF NOT EXISTS idx_guest_uws_due ON guest_uws (next_due_at);
  `);

  await db.runAsync(
    `INSERT OR IGNORE INTO schema_meta (key, value) VALUES ('schema_version', ?)`,
    [String(SCHEMA_VERSION)]
  );

  // device_install_id 발급 (1회)
  const existing = await SecureStore.getItemAsync(DEVICE_INSTALL_ID_KEY);
  if (!existing) {
    const newId = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_INSTALL_ID_KEY, newId);
  }
}

export async function getDeviceInstallId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_INSTALL_ID_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_INSTALL_ID_KEY, id);
  }
  return id;
}

export interface GuestAttemptRecord {
  attempt_id: string;
  client_attempt_id: string;
  word_id: string;
  correct: boolean;
  question_template_id: string | null;
  content_version_at_attempt: number;
  occurred_at: string;
  synced: boolean;
}

export async function recordGuestAttempt(
  wordId: string,
  correct: boolean,
  contentVersion: number,
  questionTemplateId?: string
): Promise<GuestAttemptRecord> {
  if (!db) await initGuestDb();
  const attemptId = Crypto.randomUUID();
  const clientAttemptId = Crypto.randomUUID();
  const occurredAt = new Date().toISOString();

  await db!.runAsync(
    `INSERT INTO guest_attempts (attempt_id, client_attempt_id, word_id, correct, question_template_id, content_version_at_attempt, occurred_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [attemptId, clientAttemptId, wordId, correct ? 1 : 0, questionTemplateId ?? null, contentVersion, occurredAt]
  );

  // SecureStore의 attempts queue에도 누적 (sign-in 시 머지 트리거가 읽음)
  const queueRaw = await SecureStore.getItemAsync(ATTEMPTS_QUEUE_KEY);
  const queue: any[] = queueRaw ? JSON.parse(queueRaw) : [];
  queue.push({
    client_attempt_id: clientAttemptId,
    word_id: wordId,
    correct,
    question_template_id: questionTemplateId ?? null,
    content_version_at_attempt: contentVersion,
    occurred_at: occurredAt,
  });
  // 5000 cap (merge-guest의 max와 동일)
  await SecureStore.setItemAsync(ATTEMPTS_QUEUE_KEY, JSON.stringify(queue.slice(-5000)));

  return {
    attempt_id: attemptId,
    client_attempt_id: clientAttemptId,
    word_id: wordId,
    correct,
    question_template_id: questionTemplateId ?? null,
    content_version_at_attempt: contentVersion,
    occurred_at: occurredAt,
    synced: false,
  };
}

export async function applyGuestSrs(
  wordId: string,
  nextStage: SrsStage,
  weak: boolean,
  correct: boolean,
  occurredAt: string,
  nextDueAt: string,
  contentVersion: number
): Promise<void> {
  if (!db) await initGuestDb();
  const existing = await db!.getFirstAsync<{ correct_count: number; incorrect_count: number }>(
    `SELECT correct_count, incorrect_count FROM guest_uws WHERE word_id = ?`,
    [wordId]
  );

  const newCorrect = (existing?.correct_count ?? 0) + (correct ? 1 : 0);
  const newIncorrect = (existing?.incorrect_count ?? 0) + (correct ? 0 : 1);
  const masteredAt = nextStage === 5 && correct ? occurredAt : null;

  await db!.runAsync(
    `INSERT OR REPLACE INTO guest_uws
     (word_id, stage, weak, correct_count, incorrect_count, last_attempt_at, last_attempt_correct, next_due_at, mastered_at, last_seen_content_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      wordId,
      nextStage,
      weak ? 1 : 0,
      newCorrect,
      newIncorrect,
      occurredAt,
      correct ? 1 : 0,
      nextDueAt,
      masteredAt,
      contentVersion,
    ]
  );
}

// ============================================================================
// Home summary 계산 — 게스트 모드 SQLite 집계 (Task #83)
// ============================================================================

export interface GuestTodaySummary {
  new_words_remaining: number;
  reviews_due: number;
  streak_days: number;
  mastered_count: number;
}

/**
 * 게스트 home summary 계산.
 *   - new_words_remaining: 게스트 일일 무료 한도 - 오늘 학습 신규 단어 수 (CC-09 / D-018)
 *   - reviews_due: next_due_at <= now (CC-17 04:00 로컬 자정 기준은 다음 due 계산에 이미 반영)
 *   - streak_days: localDay04 기준 연속 학습일 — last_attempt_at 분포로 계산
 *   - mastered_count: stage = 5
 */
export async function computeGuestTodaySummary(
  timezone: string,
  guestFreeLimit: number,
): Promise<GuestTodaySummary> {
  if (!db) await initGuestDb();

  // mastered_count
  const masteredRow = await db!.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) AS c FROM guest_uws WHERE stage = 5`,
  );

  // reviews_due — current time 이전 due (mastered/Maintenance 포함)
  const nowIso = new Date().toISOString();
  const dueRow = await db!.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) AS c FROM guest_uws WHERE next_due_at <= ?`,
    [nowIso],
  );

  // 오늘 (localDay04) 시작된 신규 단어 수 — local_day04는 lazy import (circular 방지)
  const { localDay04 } = await import("@/src/srs/leitner");
  const todayKey = localDay04(new Date(), timezone);
  const todayRow = await db!.getFirstAsync<{ c: number }>(
    `SELECT new_words_started AS c FROM guest_daily_usage WHERE local_day = ?`,
    [todayKey],
  );
  const startedToday = todayRow?.c ?? 0;
  const new_words_remaining = Math.max(0, guestFreeLimit - startedToday);

  // streak — last_attempt_at 분포에서 연속 day 카운트
  const days = await db!.getAllAsync<{ day: string }>(
    `SELECT DISTINCT date(datetime(last_attempt_at, '-4 hours')) AS day
     FROM guest_uws
     WHERE last_attempt_at IS NOT NULL
     ORDER BY day DESC`,
  );
  const streak_days = computeStreakFromDays(days.map((d) => d.day), todayKey);

  return {
    new_words_remaining,
    reviews_due: dueRow?.c ?? 0,
    streak_days,
    mastered_count: masteredRow?.c ?? 0,
  };
}

/**
 * 오답 복습용 — 한 번 이상 틀렸고 아직 마스터(stage 5)하지 않은 단어들.
 * 많이 틀린 순 + 최근 시도 순. 게스트 로컬 SQLite 기준.
 */
export async function getIncorrectWordIds(limit = 30): Promise<string[]> {
  if (!db) await initGuestDb();
  const rows = await db!.getAllAsync<{ word_id: string }>(
    `SELECT word_id FROM guest_uws
     WHERE incorrect_count > 0 AND (stage IS NULL OR stage < 5)
     ORDER BY incorrect_count DESC, last_attempt_at DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map((r) => r.word_id);
}

/**
 * localDay04 정렬된 day 배열에서 연속 streak 계산.
 * - 오늘이 포함되어 있으면 오늘부터, 아니면 어제부터 끊김 여부 확인 (오늘 학습 안 했어도 어제까지 streak 유지).
 * - 단순 시간차 비교가 아니라 calendar day step 비교 (DST 영향 회피).
 */
function computeStreakFromDays(days: string[], todayKey: string): number {
  if (!days.length) return 0;
  const set = new Set(days);
  // streak 시작점: 오늘이 있으면 오늘, 아니면 어제 (오늘 학습 안 한 경우도 어제까지 streak 유지)
  let cursorKey = set.has(todayKey) ? todayKey : prevDayKey(todayKey);
  if (!set.has(cursorKey)) return 0;
  let count = 0;
  while (set.has(cursorKey)) {
    count += 1;
    cursorKey = prevDayKey(cursorKey);
  }
  return count;
}

function prevDayKey(dayKey: string): string {
  const d = new Date(dayKey + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * 게스트 일일 사용량 카운터 — lesson 신규 단어 시작 시 호출 (recordGuestAttempt 1번째 attempt 기준).
 * lesson_completed 카운트는 lesson chain 완료 시점 호출.
 */
export async function bumpGuestDailyUsage(
  kind: "new_word_started" | "review_completed" | "lesson_completed",
  timezone: string,
): Promise<void> {
  if (!db) await initGuestDb();
  const { localDay04 } = await import("@/src/srs/leitner");
  const dayKey = localDay04(new Date(), timezone);

  await db!.runAsync(
    `INSERT INTO guest_daily_usage (local_day, timezone, new_words_started, reviews_completed, lesson_completed)
     VALUES (?, ?, 0, 0, 0)
     ON CONFLICT(local_day) DO NOTHING`,
    [dayKey, timezone],
  );

  const column =
    kind === "new_word_started" ? "new_words_started"
    : kind === "review_completed" ? "reviews_completed"
    : "lesson_completed";

  await db!.runAsync(
    `UPDATE guest_daily_usage SET ${column} = ${column} + 1 WHERE local_day = ?`,
    [dayKey],
  );
}

export async function clearGuestData(): Promise<void> {
  if (!db) return;
  await db.execAsync(`
    DELETE FROM guest_attempts;
    DELETE FROM guest_uws;
    DELETE FROM guest_daily_usage;
  `);
  await SecureStore.deleteItemAsync(ATTEMPTS_QUEUE_KEY);
}
