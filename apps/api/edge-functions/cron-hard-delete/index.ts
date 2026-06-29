/**
 * Edge Function: cron-hard-delete
 *
 * 호출: Supabase pg_cron 매일 04:00 UTC (또는 manual via supabase functions invoke)
 *
 * 책임 (C-11 / Q-BE-DOC-010):
 *   - account_deletion_requests 중 scheduled_hard_delete_at <= NOW() AND completed_at IS NULL
 *   - 각 user에 대해:
 *     1. learning_attempts / user_word_states / learning_sessions / daily_usage / content_reports
 *        / subscription_entitlements 모두 삭제 (CASCADE 정의로 자동)
 *     2. profiles 삭제 (CASCADE)
 *     3. auth.users 삭제 (admin.auth.admin.deleteUser)
 *     4. account_deletion_requests.completed_at = NOW()
 *     5. audit_log (action='hard_delete_completed', actor='system')
 *   - 결제 보존 의무 데이터: subscription_entitlements는 sha256(user_id + salt)로 비식별화 보존
 *     (세무상 결제 이력 보관, GDPR/PIPA 익명화)
 *
 * Supabase pg_cron 등록 (별도 SQL):
 *   SELECT cron.schedule('hard-delete-daily', '0 4 * * *',
 *     $$ SELECT net.http_post(
 *       'https://<project>.supabase.co/functions/v1/cron-hard-delete',
 *       headers => '{"Authorization":"Bearer <CRON_SECRET>"}'::jsonb
 *     ); $$);
 */

// @ts-nocheck — Deno runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const HASH_SALT = Deno.env.get("USER_ID_HASH_SALT")!;

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  // 인증: pg_cron 호출은 CRON_SECRET 필수
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 1. 만료된 삭제 요청 조회
  const { data: pending, error: queryErr } = await admin
    .from("account_deletion_requests")
    .select("request_id, user_id, scheduled_hard_delete_at")
    .lte("scheduled_hard_delete_at", new Date().toISOString())
    .is("completed_at", null);

  if (queryErr) {
    return new Response(JSON.stringify({ error: "query_failed", detail: queryErr.message }), { status: 500 });
  }

  const results: Array<{ user_id: string; status: string; error?: string }> = [];

  for (const req of pending ?? []) {
    try {
      // 2.a 결제 데이터 비식별화 — 세무 보존 (CC2-11)
      const userIdHash = await sha256Hex(req.user_id + HASH_SALT);

      // 결제 이력은 보존하되 user_id를 hash로 치환
      // ON DELETE CASCADE로 자동 삭제되기 전에 백업
      const { data: ents } = await admin
        .from("subscription_entitlements")
        .select("*")
        .eq("user_id", req.user_id);

      if (ents && ents.length > 0) {
        // 별도 결제_보존 테이블에 hash 채로 INSERT (M3에서 payment_archive 테이블 추가 예정)
        // 현재는 audit_log에 jsonb로 보존
        await admin.from("audit_log").insert({
          actor: "system",
          action: "payment_archive_anonymized",
          target_table: "subscription_entitlements",
          target_id: userIdHash,
          before_jsonb: { user_id_hash: userIdHash, count: ents.length },
          after_jsonb: ents.map((e) => ({
            ...e,
            user_id: userIdHash,
            rc_app_user_id: "ANONYMIZED",
            rc_original_app_user_id: null,
          })),
        });
      }

      // 2.b auth.users 삭제 (CASCADE로 profiles + 모든 학습 데이터 삭제됨)
      const { error: deleteErr } = await admin.auth.admin.deleteUser(req.user_id);
      if (deleteErr) {
        throw new Error(`auth_delete_failed: ${deleteErr.message}`);
      }

      // 3. account_deletion_requests.completed_at 갱신
      await admin
        .from("account_deletion_requests")
        .update({ completed_at: new Date().toISOString() })
        .eq("request_id", req.request_id);

      // 4. audit_log
      await admin.from("audit_log").insert({
        actor: "system",
        action: "hard_delete_completed",
        target_table: "auth.users",
        target_id: userIdHash, // PII 제거
        before_jsonb: { request_id: req.request_id, scheduled_at: req.scheduled_hard_delete_at },
        after_jsonb: { completed_at: new Date().toISOString() },
      });

      results.push({ user_id: userIdHash, status: "deleted" });
    } catch (err) {
      results.push({
        user_id: req.user_id,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
      // 실패 audit_log
      await admin.from("audit_log").insert({
        actor: "system",
        action: "hard_delete_failed",
        target_table: "account_deletion_requests",
        target_id: req.request_id,
        before_jsonb: null,
        after_jsonb: { error: err instanceof Error ? err.message : String(err) },
      });
    }
  }

  return new Response(
    JSON.stringify({
      processed: results.length,
      succeeded: results.filter((r) => r.status === "deleted").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
});
