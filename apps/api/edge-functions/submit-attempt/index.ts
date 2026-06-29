/**
 * Edge Function: submit-attempt
 *
 * POST /functions/v1/submit-attempt
 *
 * 책임 (CC-04 server SSOT):
 *   1. 인증 사용자만 (RLS 우회 위해 service_role로 동작)
 *   2. SubmitAttemptRequest 검증 (zod)
 *   3. learning_attempts INSERT (idempotent by client_attempt_id — UNIQUE)
 *   4. user_word_states 재계산 (applySrsTransition)
 *   5. daily_usage atomic increment (CC2-07 일일 한도 SSOT)
 *   6. 응답: { state, daily_usage, paywall_required }
 *
 * RLS bypass:
 *   - 본 함수는 service_role JWT로 동작 → RLS 무시
 *   - user_id는 요청 헤더의 사용자 JWT에서 추출 (Supabase Auth verify)
 *
 * Deno runtime (Supabase Edge Functions).
 */

// @ts-nocheck — Deno runtime types
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { z } from "https://esm.sh/zod@3.23.0";

// Inline schema (Edge Functions에서 monorepo import 제약 — M3에서 별도 esm 빌드)
const SubmitAttemptRequestSchema = z.object({
  client_attempt_id: z.string().uuid(),
  word_id: z.string(),
  correct: z.boolean(),
  question_template_id: z.string().optional(),
  content_version_at_attempt: z.number().int().min(1),
  occurred_at: z.string(), // ISO date string
  device_install_id: z.string().uuid().optional(),
});

// applySrsTransition는 별도 _shared/srs.ts로 추출 예정 (M2-S4)
// 현재는 mobile/src/srs/leitner.ts와 동일 로직 inline
const STAGE_INTERVAL_DAYS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };

function localDay04(date: Date, timezone: string): string {
  const shifted = new Date(date.getTime() - 4 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(shifted);
}

function computeNextDue(stage: 1 | 2 | 3 | 4 | 5, occurredAt: Date, timezone: string): Date {
  const days = STAGE_INTERVAL_DAYS[stage];
  const baseDayKey = localDay04(occurredAt, timezone);
  const baseDate = new Date(baseDayKey + "T00:00:00Z");
  baseDate.setUTCDate(baseDate.getUTCDate() + days);
  return new Date(baseDate.getTime() + 4 * 60 * 60 * 1000);
}

function isSameCycle(a: Date | null, b: Date, tz: string): boolean {
  if (!a) return false;
  return localDay04(a, tz) === localDay04(b, tz);
}

function applySrs(state: any, attempt: { correct: boolean; occurred_at: Date; timezone: string }) {
  if (attempt.correct) {
    const nextStage = Math.min(5, state.stage + 1);
    return {
      stage: nextStage,
      weak: false,
      correct_count: state.correct_count + 1,
      incorrect_count: state.incorrect_count,
      last_attempt_at: attempt.occurred_at,
      last_attempt_correct: true,
      next_due_at: computeNextDue(nextStage, attempt.occurred_at, attempt.timezone),
      mastered_at: nextStage === 5 && state.stage < 5 ? attempt.occurred_at : state.mastered_at,
    };
  }
  const sameCycle = isSameCycle(state.last_attempt_at, attempt.occurred_at, attempt.timezone);
  const sameCycleWrong = sameCycle && state.last_attempt_correct === false;
  let nextStage: number; let weak: boolean;
  if (sameCycleWrong) { nextStage = 1; weak = true; }
  else if (state.stage === 5) { nextStage = 4; weak = false; }
  else { nextStage = Math.max(1, state.stage - 1); weak = state.weak; }
  return {
    stage: nextStage,
    weak,
    correct_count: state.correct_count,
    incorrect_count: state.incorrect_count + 1,
    last_attempt_at: attempt.occurred_at,
    last_attempt_correct: false,
    next_due_at: computeNextDue(nextStage as any, attempt.occurred_at, attempt.timezone),
    mastered_at: nextStage === 5 ? state.mastered_at : null,
  };
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // 1. 사용자 JWT 검증
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }
  const userJwt = authHeader.slice(7);

  // 사용자 식별 client (anon JWT — auth.getUser 호출만)
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "invalid_token" }), { status: 401 });
  }
  const userId = userData.user.id;

  // 2. Body 검증
  let body: unknown;
  try { body = await req.json(); } catch { return new Response("invalid_json", { status: 400 }); }
  const parsed = SubmitAttemptRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "invalid_payload", issues: parsed.error.issues }), { status: 400 });
  }
  const attempt = parsed.data;

  // 3. service_role 클라이언트 (RLS bypass)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 4. profile.timezone 조회
  const { data: profile } = await admin
    .from("profiles")
    .select("timezone")
    .eq("user_id", userId)
    .single();
  const timezone = profile?.timezone ?? "UTC";

  // 5. 일일 한도 검사 (CC2-07)
  const occurredAt = new Date(attempt.occurred_at);
  const localDayKey = localDay04(occurredAt, timezone);

  // entitlement 확인
  const { data: ent } = await admin
    .from("subscription_entitlements")
    .select("status, period_ends_at, grace_period_ends_at")
    .eq("user_id", userId)
    .order("last_synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const isPremium =
    ent && ["active", "grace_period", "billing_retry", "cancelled"].includes(ent.status) &&
    (!ent.period_ends_at || new Date(ent.period_ends_at) > occurredAt);

  const newWordLimit = isPremium ? 15 : 3;
  const reviewLimit = isPremium ? Infinity : 20;

  // user_word_states 조회 (신규/복습 분기)
  const { data: existing } = await admin
    .from("user_word_states")
    .select("*")
    .eq("user_id", userId)
    .eq("word_id", attempt.word_id)
    .maybeSingle();

  const isNewWord = !existing;

  // daily_usage 조회 / upsert
  const { data: usage } = await admin
    .from("daily_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("local_day", localDayKey)
    .maybeSingle();

  if (isNewWord && (usage?.new_words_started_count ?? 0) >= newWordLimit) {
    return new Response(JSON.stringify({ error: "daily_limit_reached", paywall_required: !isPremium, limit: "new_word" }), { status: 429 });
  }
  if (!isNewWord && (usage?.reviews_completed_count ?? 0) >= reviewLimit && reviewLimit !== Infinity) {
    return new Response(JSON.stringify({ error: "daily_limit_reached", paywall_required: !isPremium, limit: "review" }), { status: 429 });
  }

  // 6. learning_attempts INSERT (idempotent — UNIQUE constraint on client_attempt_id)
  const { error: insertErr } = await admin.from("learning_attempts").insert({
    user_id: userId,
    word_id: attempt.word_id,
    client_attempt_id: attempt.client_attempt_id,
    correct: attempt.correct,
    question_template_id: attempt.question_template_id ?? null,
    content_version_at_attempt: attempt.content_version_at_attempt,
    occurred_at: attempt.occurred_at,
    device_install_id: attempt.device_install_id ?? null,
  });
  if (insertErr && !insertErr.message.includes("duplicate")) {
    return new Response(JSON.stringify({ error: "insert_failed", detail: insertErr.message }), { status: 500 });
  }

  // 7. user_word_states 재계산 (applySrsTransition)
  const baseState = existing ?? {
    stage: 1, weak: false, correct_count: 0, incorrect_count: 0,
    last_attempt_at: null, last_attempt_correct: null, mastered_at: null,
  };
  const next = applySrs(baseState, { correct: attempt.correct, occurred_at: occurredAt, timezone });

  await admin.from("user_word_states").upsert({
    user_id: userId,
    word_id: attempt.word_id,
    stage: next.stage,
    weak: next.weak,
    correct_count: next.correct_count,
    incorrect_count: next.incorrect_count,
    last_attempt_at: next.last_attempt_at.toISOString(),
    last_attempt_correct: next.last_attempt_correct,
    next_due_at: next.next_due_at.toISOString(),
    mastered_at: next.mastered_at ? new Date(next.mastered_at).toISOString() : null,
    last_seen_content_version: attempt.content_version_at_attempt,
  });

  // 8. daily_usage atomic increment
  await admin.rpc("increment_daily_usage", {
    p_user_id: userId,
    p_local_day: localDayKey,
    p_timezone: timezone,
    p_new_word: isNewWord ? 1 : 0,
    p_review: isNewWord ? 0 : 1,
  });

  // 9. SRS measurement events (Q-DA-DOC-007, M3 W15-03)
  // 서버가 상태 전이를 결정하므로 client가 정확한 이벤트를 발화하도록 server가 명시.
  const srsEvents: string[] = [];
  const prevStage = baseState.stage;
  const prevWeak = baseState.weak;
  const prevMastered = !!baseState.mastered_at;
  if (next.stage === 5 && prevStage !== 5) {
    srsEvents.push("srs_mastered_reached");
  }
  if (prevMastered && !next.mastered_at) {
    srsEvents.push("srs_mastered_lost");
  }
  if (!prevWeak && next.weak) {
    srsEvents.push("srs_weak_flagged");
  }

  return new Response(JSON.stringify({
    state: next,
    daily_usage: {
      new_words: (usage?.new_words_started_count ?? 0) + (isNewWord ? 1 : 0),
      reviews: (usage?.reviews_completed_count ?? 0) + (isNewWord ? 0 : 1),
      limit_new_words: newWordLimit,
      limit_reviews: reviewLimit === Infinity ? null : reviewLimit,
    },
    paywall_required: false,
    srs_events: srsEvents,
  }), { status: 200, headers: { "content-type": "application/json" } });
});

/*
 * RPC `increment_daily_usage` 정의는 0003_rpc.sql에 추가 (M2-S4):
 *
 * CREATE OR REPLACE FUNCTION increment_daily_usage(
 *   p_user_id UUID, p_local_day DATE, p_timezone TEXT,
 *   p_new_word INT, p_review INT
 * ) RETURNS VOID AS $$
 *   INSERT INTO daily_usage (user_id, local_day, timezone, new_words_started_count, reviews_completed_count)
 *   VALUES (p_user_id, p_local_day, p_timezone, p_new_word, p_review)
 *   ON CONFLICT (user_id, local_day) DO UPDATE SET
 *     new_words_started_count = daily_usage.new_words_started_count + p_new_word,
 *     reviews_completed_count = daily_usage.reviews_completed_count + p_review,
 *     updated_at = NOW();
 * $$ LANGUAGE SQL;
 */
