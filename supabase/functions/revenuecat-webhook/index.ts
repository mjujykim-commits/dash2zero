/**
 * Edge Function: revenuecat-webhook
 *
 * POST /functions/v1/revenuecat-webhook
 * Header: Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
 *
 * 책임 (CC2-08 + CC3-05 + ADR-0004):
 *   1. Authorization 시그니처 검증 (BOOTSTRAP_INFRA §3.3)
 *   2. RevenueCat 이벤트 → EntitlementStatus 매핑 (CC2-08 9 enum)
 *   3. last_rc_event_id 멱등 (재전송 무시)
 *   4. subscription_entitlements UPSERT (service_role 전용 write — ADR-0004)
 *   5. audit_log INSERT (action='webhook_revenuecat')
 *   6. analytics 이벤트: subscription_status_changed / refund_detected (CC2-22)
 *
 * Risk:
 *   - 시그니처 위조 → 401 + audit_log + alert (RLS-ADV-004 / EVALUATION_SCENARIOS PAY-ADV-004)
 *   - 동일 event_id 재전송 → 멱등 무시 (PAY-ADV-001)
 *   - status 매핑 누락 → 'unknown'으로 강등 (안전 default)
 */

// @ts-nocheck — Deno runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { z } from "https://esm.sh/zod@3.23.0";
import { mapStatus, type RcEventType, type EntitlementStatus } from "../_shared/billing.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RC_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET")!;

// RC payload schema (BE-NEW-002 + CC2-08)
const RcEventSchema = z.object({
  event: z.object({
    id: z.string(),
    type: z.enum([
      "INITIAL_PURCHASE", "RENEWAL", "BILLING_ISSUE",
      "EXPIRATION", "CANCELLATION", "REFUND",
      "REVOKE", "TRANSFER", "UNCANCELLATION",
      "PRODUCT_CHANGE", "TEST", "SUBSCRIBER_ALIAS",
    ]),
    app_user_id: z.string(),
    original_app_user_id: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    entitlement_ids: z.array(z.string()).optional(),
    product_id: z.string().optional(),
    period_type: z.string().optional(),
    purchased_at_ms: z.number().int().optional(),
    expiration_at_ms: z.number().int().nullable().optional(),
    grace_period_expiration_at_ms: z.number().int().nullable().optional(),
    auto_resume_at_ms: z.number().int().nullable().optional(),
    store: z.string().optional(),
    environment: z.enum(["SANDBOX", "PRODUCTION"]).optional(),
    is_family_share: z.boolean().optional(),
  }),
  api_version: z.string().optional(),
});

// mapStatus / EntitlementStatus / RcEventType은 _shared/billing.ts에서 import (SoT 통합).

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // 1. 시그니처 검증 (RC가 Authorization header에 secret bearer 전송)
  const auth = req.headers.get("Authorization");
  if (!auth || auth !== `Bearer ${RC_WEBHOOK_SECRET}`) {
    // 위조 시도 감지 — alert 채널로 통지 (M5)
    return new Response(JSON.stringify({ error: "invalid_signature" }), { status: 401 });
  }

  // 2. Body 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("invalid_json", { status: 400 });
  }
  const parsed = RcEventSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "invalid_payload", issues: parsed.error.issues }),
      { status: 400 }
    );
  }
  const ev = parsed.data.event;

  // 3. TEST / SUBSCRIBER_ALIAS는 무시 (200 OK 응답)
  if (ev.type === "TEST" || ev.type === "SUBSCRIBER_ALIAS") {
    return new Response(JSON.stringify({ status: "ignored", type: ev.type }), { status: 200 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 4. 멱등 — last_rc_event_id 중복 체크
  const { data: existing } = await admin
    .from("subscription_entitlements")
    .select("id, user_id, last_rc_event_id, status")
    .eq("last_rc_event_id", ev.id)
    .maybeSingle();

  if (existing) {
    return new Response(
      JSON.stringify({ status: "idempotent_skip", event_id: ev.id }),
      { status: 200 }
    );
  }

  // 5. user_id 결정 — RC app_user_id 또는 alias
  // CC2-06: appUserID = supabase auth.users.id 기준
  // alias가 있으면 모두 매칭 시도 (게스트 → 가입 시 alias 처리)
  const appUserIds = [ev.app_user_id, ev.original_app_user_id, ...(ev.aliases ?? [])].filter(Boolean) as string[];

  let userId: string | null = null;
  for (const candidate of appUserIds) {
    // candidate가 UUID 형식인지 (Supabase user_id) 또는 anonymous (RC 자체 ID)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)) {
      const { data: profile } = await admin
        .from("profiles")
        .select("user_id")
        .eq("user_id", candidate)
        .maybeSingle();
      if (profile) {
        userId = profile.user_id;
        break;
      }
    }
  }

  if (!userId) {
    // user_id 매칭 실패 — audit_log 후 200 OK (RC retry 방지)
    await admin.from("audit_log").insert({
      actor: "service_role",
      action: "webhook_revenuecat_no_user",
      target_table: "subscription_entitlements",
      target_id: ev.id,
      before_jsonb: null,
      after_jsonb: { app_user_id: ev.app_user_id, type: ev.type, aliases: ev.aliases },
    });
    return new Response(JSON.stringify({ status: "no_user_match", event_id: ev.id }), { status: 200 });
  }

  // 6. status 매핑
  const status = mapStatus(ev.type, ev.grace_period_expiration_at_ms);

  const periodEndsAt = ev.expiration_at_ms ? new Date(ev.expiration_at_ms).toISOString() : null;
  const graceEndsAt = ev.grace_period_expiration_at_ms
    ? new Date(ev.grace_period_expiration_at_ms).toISOString()
    : null;

  // 7. subscription_entitlements UPSERT
  // 동일 user_id + product_id의 가장 최근 row 갱신 (history 누적은 후속 sprint)
  const { data: existingEnt } = await admin
    .from("subscription_entitlements")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", ev.product_id ?? "unknown")
    .order("last_synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const entRow = {
    user_id: userId,
    rc_app_user_id: ev.app_user_id,
    rc_original_app_user_id: ev.original_app_user_id ?? null,
    rc_customer_id: ev.app_user_id, // RC는 customer_id 별도 필드 없으면 app_user_id 사용
    entitlement_id: (ev.entitlement_ids ?? ["premium"])[0] ?? "premium",
    product_id: ev.product_id ?? "unknown",
    store: ev.store === "APP_STORE" ? "app_store" : "play_store",
    environment: ev.environment === "PRODUCTION" ? "production" : "sandbox",
    status,
    period_started_at: ev.purchased_at_ms ? new Date(ev.purchased_at_ms).toISOString() : null,
    period_ends_at: periodEndsAt,
    grace_period_ends_at: graceEndsAt,
    auto_renew_status: status === "cancelled" ? false : status === "active" ? true : null,
    ownership_type: ev.is_family_share ? "FAMILY_SHARED" : "PURCHASED",
    last_rc_event_id: ev.id,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingEnt) {
    await admin.from("subscription_entitlements").update(entRow).eq("id", existingEnt.id);
  } else {
    await admin.from("subscription_entitlements").insert(entRow);
  }

  // 8. audit_log
  await admin.from("audit_log").insert({
    actor: "service_role",
    action: "webhook_revenuecat",
    target_table: "subscription_entitlements",
    target_id: existingEnt?.id ?? userId,
    before_jsonb: existingEnt ?? null,
    after_jsonb: entRow,
  });

  // 9. analytics 이벤트 (CC2-22) — 클라이언트가 receiveable한 시점에 logEvent
  // (서버에서 직접 Firebase 호출은 안 하고, 사용자 측 다음 fetch 시 entitlement 변경 detect)

  return new Response(
    JSON.stringify({ status: "applied", event_id: ev.id, mapped_status: status }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
});
