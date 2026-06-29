/**
 * Edge Function: delete-account
 *
 * POST /functions/v1/delete-account
 *
 * 책임 (C-11 + CC2-11 + Q-BE-DOC-010):
 *   1. 인증 사용자 검증
 *   2. account_deletion_requests INSERT (UNIQUE on user_id — 1회 active)
 *   3. profiles.soft_deleted_at = NOW (즉시 차단)
 *   4. RC alias 삭제 호출 (RevenueCat DELETE /subscribers/{app_user_id})
 *   5. (옵션) export_data — JSON 형식 이메일 송부
 *   6. audit_log
 *   7. 30일 후 hard-delete cron이 처리 (별도 Edge Function `cron-hard-delete`)
 *
 * 사용자 즉시 효과:
 *   - 다음 로그인 시 차단 (profiles.soft_deleted_at 검사 — M2-S7 클라이언트 추가)
 *   - 학습 데이터는 30일간 보존, 사용자 마음 바꾸면 cancel 가능 (M5 추가)
 *
 * SLA: 요청 접수 즉시 차단 + 30일 내 hard-delete (CC-11)
 */

// @ts-nocheck — Deno runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { z } from "https://esm.sh/zod@3.23.0";

const RequestSchema = z.object({
  export_data: z.boolean().optional().default(true),
});

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const RC_SECRET_API_KEY = Deno.env.get("REVENUECAT_SECRET_API_KEY")!;

const HARD_DELETE_DAYS = 30;

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

  // 2. Body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = RequestSchema.safeParse(body);
  const exportData = parsed.success ? parsed.data.export_data : true;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 3. 이미 active 삭제 요청 존재 여부
  const { data: existing } = await admin
    .from("account_deletion_requests")
    .select("request_id, requested_at, scheduled_hard_delete_at, completed_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing && !existing.completed_at) {
    return new Response(
      JSON.stringify({
        status: "already_requested",
        request_id: existing.request_id,
        requested_at: existing.requested_at,
        scheduled_hard_delete_at: existing.scheduled_hard_delete_at,
      }),
      { status: 200 }
    );
  }

  // 4. account_deletion_requests INSERT
  const now = new Date();
  const scheduledHardDelete = new Date(now.getTime() + HARD_DELETE_DAYS * 24 * 60 * 60 * 1000);

  const { data: deletionReq, error: insertErr } = await admin
    .from("account_deletion_requests")
    .insert({
      user_id: userId,
      requested_at: now.toISOString(),
      scheduled_hard_delete_at: scheduledHardDelete.toISOString(),
      export_format: "json",
    })
    .select("request_id")
    .single();

  if (insertErr) {
    return new Response(
      JSON.stringify({ error: "deletion_request_failed", detail: insertErr.message }),
      { status: 500 }
    );
  }

  // 5. profiles.soft_deleted_at = NOW (즉시 차단)
  await admin.from("profiles").update({ soft_deleted_at: now.toISOString() }).eq("user_id", userId);

  // 6. RC alias 삭제 (best-effort, 실패해도 진행)
  try {
    const rcResp = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${RC_SECRET_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!rcResp.ok && rcResp.status !== 404) {
      console.warn(`[delete-account] RC delete failed: ${rcResp.status}`);
    }
  } catch (err) {
    console.warn(`[delete-account] RC delete exception:`, err);
  }

  // 7. (옵션) export_data — 사용자에게 JSON 이메일 송부
  // M2-S7에서 background job으로 분리 (account_data_export 테이블 + cron)
  let exportRequested = false;
  if (exportData) {
    await admin
      .from("account_deletion_requests")
      .update({ exported_at: null }) // pending 상태로 표시 (실제 export는 비동기)
      .eq("request_id", deletionReq.request_id);
    exportRequested = true;
  }

  // 8. audit_log
  await admin.from("audit_log").insert({
    actor: `user:${userId}`,
    action: "account_deletion_requested",
    target_table: "account_deletion_requests",
    target_id: deletionReq.request_id,
    before_jsonb: null,
    after_jsonb: {
      requested_at: now.toISOString(),
      scheduled_hard_delete_at: scheduledHardDelete.toISOString(),
      export_data: exportRequested,
    },
  });

  // 9. 사용자 세션 무효화 (best-effort)
  try {
    await admin.auth.admin.signOut(userId);
  } catch (err) {
    console.warn(`[delete-account] signOut failed:`, err);
  }

  return new Response(
    JSON.stringify({
      status: "scheduled",
      request_id: deletionReq.request_id,
      scheduled_hard_delete_at: scheduledHardDelete.toISOString(),
      message:
        "Your account is scheduled for deletion. We will permanently delete your data within 30 days. Sign in again before then to cancel.",
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
});

/*
 * 후속 작업:
 *  - cron-hard-delete Edge Function (M2-S7 또는 M3): 매일 실행, scheduled_hard_delete_at <= NOW 조건 처리
 *  - export 데이터 JSON 생성 비동기 worker
 *  - 사용자가 30일 내 재로그인 시 cancel UI (M5)
 *  - GDPR Art.17 데이터 이동권: export 형식은 portable JSON
 */
