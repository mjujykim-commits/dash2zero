/**
 * Edge Function: audio-signed-url
 *
 * POST /functions/v1/audio-signed-url
 * Body: { audio_ids: string[] }
 *
 * 책임 (CC3-04 + BE-NEW-006):
 *   - free tier audio_assets: public URL 반환 (인증 불필요)
 *   - premium tier: entitlement 검증 후 signed URL TTL 6시간
 *   - 어뷰즈 방지: 인증 사용자만 premium 요청 가능
 *
 * 응답: { urls: { audio_id: { url, expires_at?, audio_hash } } }
 */

// @ts-nocheck — Deno runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { z } from "https://esm.sh/zod@3.23.0";

const RequestSchema = z.object({
  audio_ids: z.array(z.string()).min(1).max(60), // 한 번에 최대 60개 (Starter Pack 한 번 + 예문)
});

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const PREMIUM_SIGNED_URL_TTL = 6 * 60 * 60; // 6시간 (CC3-04)

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Auth (옵션)
  const authHeader = req.headers.get("Authorization");
  let userId: string | null = null;
  let isPremium = false;

  if (authHeader?.startsWith("Bearer ")) {
    const userJwt = authHeader.slice(7);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userJwt}` } },
    });
    const { data: userData } = await userClient.auth.getUser();
    userId = userData?.user?.id ?? null;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("invalid_json", { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "invalid_payload" }), { status: 400 });
  }
  const { audio_ids } = parsed.data;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // entitlement
  if (userId) {
    const { data: ent } = await admin
      .from("subscription_entitlements")
      .select("status, period_ends_at")
      .eq("user_id", userId)
      .order("last_synced_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    isPremium =
      !!ent &&
      ["active", "grace_period", "billing_retry", "cancelled"].includes(ent.status) &&
      (!ent.period_ends_at || new Date(ent.period_ends_at) > new Date());
  }

  // audio_assets 조회
  const { data: assets, error: assetsErr } = await admin
    .from("audio_assets")
    .select("audio_id, audio_url, audio_hash, tier, retired_at")
    .in("audio_id", audio_ids);

  if (assetsErr) {
    return new Response(JSON.stringify({ error: "fetch_failed" }), { status: 500 });
  }

  const result: Record<string, { url?: string; expires_at?: string; audio_hash?: string; error?: string }> = {};

  for (const asset of assets ?? []) {
    if (asset.retired_at) {
      result[asset.audio_id] = { error: "retired" };
      continue;
    }

    if (asset.tier === "free") {
      // Public bucket — 영구 URL
      const { data: pub } = admin.storage.from("audio").getPublicUrl(asset.audio_url);
      result[asset.audio_id] = {
        url: pub.publicUrl,
        audio_hash: asset.audio_hash,
      };
    } else {
      // Premium — entitlement 필수
      if (!userId) {
        result[asset.audio_id] = { error: "auth_required" };
        continue;
      }
      if (!isPremium) {
        result[asset.audio_id] = { error: "premium_required" };
        continue;
      }
      // signed URL 발급
      const { data: signed, error: signErr } = await admin.storage
        .from("audio")
        .createSignedUrl(asset.audio_url, PREMIUM_SIGNED_URL_TTL);

      if (signErr || !signed) {
        result[asset.audio_id] = { error: "sign_failed" };
        continue;
      }

      result[asset.audio_id] = {
        url: signed.signedUrl,
        expires_at: new Date(Date.now() + PREMIUM_SIGNED_URL_TTL * 1000).toISOString(),
        audio_hash: asset.audio_hash,
      };
    }
  }

  // 누락된 audio_id 표기
  for (const id of audio_ids) {
    if (!(id in result)) {
      result[id] = { error: "not_found" };
    }
  }

  return new Response(JSON.stringify({ urls: result }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
