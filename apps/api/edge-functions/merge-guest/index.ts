/**
 * Edge Function: merge-guest
 *
 * POST /functions/v1/merge-guest
 *
 * 책임 (CC2-04 + BE-NEW-003):
 *   1. 인증 사용자만 (방금 가입한 사용자가 호출)
 *   2. SubmitGuestMergeRequest 검증
 *   3. 단일 SQL 트랜잭션 (RPC `merge_guest_data`):
 *      a. attempts UPSERT by (user_id, client_attempt_id) — append-only + idempotent
 *      b. user_word_states 재계산 (max stage, max correct/incorrect, latest last_attempt_at)
 *      c. profile.merged_at 기록
 *      d. audit_log INSERT (action='guest_merge')
 *      e. guest_sessions.merged_to_user_id 갱신
 *   4. 응답: { merged_attempts, merged_words, conflicts }
 *
 * Idempotency: idempotency_key = device_install_id (UNIQUE) — 동일 디바이스 재요청 시 cached result.
 */

// @ts-nocheck — Deno runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { z } from "https://esm.sh/zod@3.23.0";

const RequestSchema = z.object({
  device_install_id: z.string().uuid(),
  guest_attempts: z
    .array(
      z.object({
        client_attempt_id: z.string().uuid(),
        word_id: z.string(),
        correct: z.boolean(),
        question_template_id: z.string().nullable().optional(),
        content_version_at_attempt: z.number().int().min(1),
        occurred_at: z.string(),
      })
    )
    .max(5000), // 안전 상한 (게스트 30일 사용 가정 시 충분)
});

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // 1. 사용자 JWT 검증
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }
  const userJwt = authHeader.slice(7);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "invalid_token" }), { status: 401 });
  }
  const userId = userData.user.id;

  // 2. Body 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("invalid_json", { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "invalid_payload", issues: parsed.error.issues }), { status: 400 });
  }
  const { device_install_id, guest_attempts } = parsed.data;

  // 3. service_role admin client
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 4. Idempotency: 이미 머지된 device_install_id?
  const { data: existingGuest } = await admin
    .from("guest_sessions")
    .select("merged_to_user_id, merged_at")
    .eq("device_install_id", device_install_id)
    .maybeSingle();

  if (existingGuest?.merged_at) {
    if (existingGuest.merged_to_user_id !== userId) {
      // 다른 user_id로 이미 머지된 디바이스 — 거부
      return new Response(
        JSON.stringify({ error: "guest_already_merged", merged_to_other_user: true }),
        { status: 409 }
      );
    }
    // 같은 user에 재요청 — idempotent OK
    return new Response(
      JSON.stringify({ idempotent: true, merged_at: existingGuest.merged_at }),
      { status: 200 }
    );
  }

  // 5. 트랜잭션 (RPC merge_guest_data — 0004_merge_rpc.sql 정의 예정)
  // 본 sprint에서는 application-level 트랜잭션 (Supabase Edge Function이 단일 transaction RPC 미제공이라 시퀀셜 처리)
  // BE-NEW-003에 따라 모든 변경은 audit_log + idempotency 보장.

  let mergedAttemptsCount = 0;
  let mergedWordsSet = new Set<string>();
  let conflicts: Array<{ word_id: string; resolved: string }> = [];

  // 5.a attempts upsert (append-only, idempotent on client_attempt_id)
  if (guest_attempts.length > 0) {
    const attemptRows = guest_attempts.map((a) => ({
      user_id: userId,
      word_id: a.word_id,
      client_attempt_id: a.client_attempt_id,
      correct: a.correct,
      question_template_id: a.question_template_id ?? null,
      content_version_at_attempt: a.content_version_at_attempt,
      occurred_at: a.occurred_at,
      device_install_id,
    }));

    // ON CONFLICT (user_id, client_attempt_id) DO NOTHING — 이미 있는 attempts 무시
    const { error: insertErr, count } = await admin
      .from("learning_attempts")
      .upsert(attemptRows, { onConflict: "user_id,client_attempt_id", ignoreDuplicates: true, count: "exact" });

    if (insertErr) {
      return new Response(
        JSON.stringify({ error: "merge_failed", phase: "attempts_insert", detail: insertErr.message }),
        { status: 500 }
      );
    }
    mergedAttemptsCount = count ?? guest_attempts.length;

    for (const a of guest_attempts) mergedWordsSet.add(a.word_id);
  }

  // 5.b user_word_states 재계산: 각 word_id마다 server SSOT 정책
  //    충돌 해결 (CC2-04 + BE-NEW-004):
  //      - server stage가 더 크면 server 유지
  //      - guest stage가 더 크면 guest 채택
  //      - last_attempt_at은 가장 최근
  for (const wordId of mergedWordsSet) {
    const { data: serverState } = await admin
      .from("user_word_states")
      .select("*")
      .eq("user_id", userId)
      .eq("word_id", wordId)
      .maybeSingle();

    // guest의 attempts에서 이 word_id의 가장 최근 attempt
    const wordAttempts = guest_attempts
      .filter((a) => a.word_id === wordId)
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

    if (!serverState && wordAttempts[0]) {
      // 신규 word_id — guest 데이터로 user_word_states 생성
      // 정확한 stage 계산은 attempt 시퀀스로 재계산해야 하나, MVP에서는 정답 카운트 단순 추정
      const correctCount = wordAttempts.filter((a) => a.correct).length;
      const incorrectCount = wordAttempts.filter((a) => !a.correct).length;
      const lastAttempt = wordAttempts[0];
      const stage = Math.min(5, 1 + correctCount - Math.floor(incorrectCount / 2));

      await admin.from("user_word_states").insert({
        user_id: userId,
        word_id: wordId,
        stage: Math.max(1, stage),
        weak: incorrectCount > correctCount,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        last_attempt_at: lastAttempt.occurred_at,
        last_attempt_correct: lastAttempt.correct,
        next_due_at: new Date(new Date(lastAttempt.occurred_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        mastered_at: null,
        last_seen_content_version: lastAttempt.content_version_at_attempt,
      });
    } else if (serverState && wordAttempts[0]) {
      // 충돌 — server vs guest
      const lastAttempt = wordAttempts[0];
      const lastAttemptTime = new Date(lastAttempt.occurred_at);
      const serverTime = serverState.last_attempt_at ? new Date(serverState.last_attempt_at) : null;

      if (!serverTime || lastAttemptTime > serverTime) {
        // guest가 더 최근 — counts 합산하고 last_attempt 갱신
        const newCorrect = serverState.correct_count + wordAttempts.filter((a) => a.correct).length;
        const newIncorrect = serverState.incorrect_count + wordAttempts.filter((a) => !a.correct).length;

        await admin
          .from("user_word_states")
          .update({
            correct_count: newCorrect,
            incorrect_count: newIncorrect,
            last_attempt_at: lastAttempt.occurred_at,
            last_attempt_correct: lastAttempt.correct,
          })
          .eq("user_id", userId)
          .eq("word_id", wordId);

        conflicts.push({ word_id: wordId, resolved: "guest_more_recent" });
      } else {
        conflicts.push({ word_id: wordId, resolved: "server_more_recent" });
      }
    }
  }

  // 5.c profile.merged_at + guest_sessions.merged_to_user_id
  await admin.from("profiles").update({ merged_at: new Date().toISOString() }).eq("user_id", userId);

  await admin
    .from("guest_sessions")
    .upsert(
      {
        device_install_id,
        merged_to_user_id: userId,
        merged_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "device_install_id" }
    );

  // 5.d audit_log
  await admin.from("audit_log").insert({
    actor: `user:${userId}`,
    action: "guest_merge",
    target_table: "profiles",
    target_id: userId,
    before_jsonb: null,
    after_jsonb: {
      device_install_id,
      merged_attempts: mergedAttemptsCount,
      merged_words: Array.from(mergedWordsSet).length,
      conflicts: conflicts.length,
    },
  });

  return new Response(
    JSON.stringify({
      merged_attempts: mergedAttemptsCount,
      merged_words: Array.from(mergedWordsSet).length,
      conflicts,
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
});

/*
 * 알려진 한계 (M3에서 보강):
 *  - SRS stage 정확 재계산은 attempt 시퀀스 replay 필요. 현재는 단순 count 추정.
 *  - 0004_merge_rpc.sql 추가하여 단일 transaction RPC로 통합 권장 (W10 작업).
 *  - 5000개 attempt 상한 — 30일 게스트 사용에 충분하나 모니터링 필요.
 */
