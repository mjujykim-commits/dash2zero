/**
 * Attempt Retry Queue — 인증 사용자 offline-safe submit
 *
 * 책임 (R-19 + USER_JOURNEYS J-002):
 *   - submitAttempt 실패 시 SecureStore queue에 적재
 *   - AppState active 또는 명시 flush 호출 시 자동 retry
 *   - client_attempt_id가 stable → server `submit-attempt`가 idempotent로 처리 (CC2-04 정합)
 *   - 게스트는 guestStore.recordGuestAttempt가 처리 (본 queue는 인증 사용자 전용)
 *
 * 한계 (M4 W17 보강):
 *   - 본 MVP는 SecureStore 단순 JSON queue. SQLite 기반 attempts queue + last_synced_at 컬럼은 M4
 *   - retry 실패 cap 없음 — 영구 실패 시 사용자에게 알림 미구현 (M4)
 *   - NetInfo 기반 online 감지 미통합 — AppState active 시점에만 flush (보수적)
 *
 * 책임 agent: frontend + backend (Edge Function idempotency 검증)
 */

import * as SecureStore from "expo-secure-store";
import type { SubmitAttemptRequest } from "@dash2zero/contracts";

import { submitAttempt, type SubmitAttemptResponse } from "./api";

const QUEUE_KEY = "auth_attempt_retry_queue";
const MAX_QUEUE_LENGTH = 1000; // 인증 사용자 retry queue 상한 (게스트 5000과 다름)

type QueueItem = Omit<SubmitAttemptRequest, "occurred_at"> & { occurred_at: string };

async function readQueue(): Promise<QueueItem[]> {
  const raw = await SecureStore.getItemAsync(QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueueItem[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: QueueItem[]): Promise<void> {
  await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(items.slice(-MAX_QUEUE_LENGTH)));
}

export async function enqueueRetryAttempt(req: SubmitAttemptRequest): Promise<void> {
  const queue = await readQueue();
  queue.push({
    ...req,
    occurred_at: req.occurred_at instanceof Date ? req.occurred_at.toISOString() : req.occurred_at,
  });
  await writeQueue(queue);
}

export interface FlushResult {
  attempted: number;
  succeeded: number;
  failed: number;
  responses: SubmitAttemptResponse[];
}

/**
 * Queue 전체 retry. 성공한 항목은 제거, 실패한 항목은 queue에 유지.
 * client_attempt_id가 stable이므로 server idempotency가 중복 처리 방지.
 *
 * 호출 시점:
 *   - AppState active 전이 (background → active)
 *   - 사용자 명시 retry (Settings의 "Sync now" — M4 추가)
 *   - 다음 lesson 진입 시 (선택)
 */
export async function flushRetryQueue(): Promise<FlushResult> {
  const queue = await readQueue();
  if (queue.length === 0) {
    return { attempted: 0, succeeded: 0, failed: 0, responses: [] };
  }

  const remaining: QueueItem[] = [];
  const responses: SubmitAttemptResponse[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const res = await submitAttempt({
        ...item,
        occurred_at: new Date(item.occurred_at),
      });
      responses.push(res);
      succeeded++;
    } catch {
      // 실패 항목은 queue에 유지 (다음 flush 시 재시도)
      remaining.push(item);
      failed++;
    }
  }

  await writeQueue(remaining);
  return { attempted: queue.length, succeeded, failed, responses };
}

export async function getQueueLength(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}

export async function clearRetryQueue(): Promise<void> {
  await SecureStore.deleteItemAsync(QUEUE_KEY);
}
