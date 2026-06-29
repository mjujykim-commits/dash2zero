/**
 * Edge Function: content-manifest
 *
 * GET /functions/v1/content-manifest?since=<manifest_version>
 *
 * 책임 (CC-15 + CC2-15 + BE-NEW-005):
 *   1. 익명 접근 가능 (Starter Pack은 anon에게 제공)
 *   2. 인증 사용자: tier 정보 추가 (entitlement에 따라 Premium pack 포함)
 *   3. since 쿼리: 그 이후 변경된 manifest_version만 반환 (diff fetch)
 *   4. 응답: { current_version, packs: [{ pack_id, version, words: [...] }], min_app_version }
 *
 * 캐시: ETag 헤더로 304 Not Modified 지원 (FE-DOC-010 / Q-FE-NEW-010)
 */

// @ts-nocheck — Deno runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
// 해시는 Web Crypto(crypto.subtle.digest)를 직접 사용 — 별도 import 불필요.
// (구 std/hash/mod.ts는 deno std에서 제거되어 번들 실패를 유발했음)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// 단순 ETag 생성 (in-memory 캐시 없이)
async function makeEtag(payload: unknown): Promise<string> {
  const enc = new TextEncoder().encode(JSON.stringify(payload));
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

serve(async (req: Request) => {
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405 });

  const url = new URL(req.url);
  const since = Number(url.searchParams.get("since") ?? "0");

  // Auth (옵션 — anon 허용)
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

  // 1. 현재 published manifest_version (rolled_back_at IS NULL의 max)
  const { data: latestManifest } = await admin
    .from("content_manifests")
    .select("manifest_version, pack_id, pack_version, content_hash, words_diff, released_at")
    .is("rolled_back_at", null)
    .order("manifest_version", { ascending: false })
    .limit(50);

  if (!latestManifest || latestManifest.length === 0) {
    return new Response(JSON.stringify({ current_version: 0, packs: [], min_app_version: "0.1.0" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const currentVersion = latestManifest[0].manifest_version;

  // 304 단축: client가 since=current 제출 시
  if (since > 0 && since >= currentVersion) {
    return new Response(null, { status: 304 });
  }

  // 2. 사용자별 pack 필터
  // - anon: starter only
  // - authenticated free: starter + Premium pack의 free_sample 10 (CC3-01 preview pool)
  // - authenticated premium: 모든 pack
  const { data: allPacks } = await admin
    .from("word_packs")
    .select("pack_id, name, tier, version, monthly_release_at")
    .order("monthly_release_at", { ascending: false });

  // 개인 빌드 오버라이드: PERSONAL_UNLOCK_ALL=true면 게스트/무료도 전체 pack 접근.
  // 기본(미설정)은 정상 tier 게이팅 → GA 시 secret만 제거하면 원복.
  const unlockAll = Deno.env.get("PERSONAL_UNLOCK_ALL") === "true";
  const accessiblePacks = (allPacks ?? []).filter((p) => {
    if (unlockAll) return true;
    if (p.tier === "starter") return true;
    if (isPremium) return true;
    // free user: premium pack의 free_sample만 별도 처리
    return false;
  });

  // 3. 각 pack의 words 조회
  const packsPayload = await Promise.all(
    accessiblePacks.map(async (pack) => {
      // word_translations는 word_pack_members와 직접 FK가 없으므로 words 아래에 중첩 임베드해야 함.
      const { data: members } = await admin
        .from("word_pack_members")
        .select("word_id, sort_order, is_free_sample, words!inner(word_id, korean, romanization, content_version, retired_at, word_translations!inner(gloss, gloss_short, example_ko, example_en))")
        .eq("pack_id", pack.pack_id)
        .eq("words.word_translations.locale", "en-US")
        .order("sort_order");

      const words = (members ?? [])
        .filter((m: any) => m.words && !m.words.retired_at)
        .map((m: any) => {
          // 중첩 to-many: word_translations는 배열로 반환 → en-US 1건
          const tr = Array.isArray(m.words.word_translations) ? m.words.word_translations[0] : m.words.word_translations;
          return {
            word_id: m.word_id,
            korean: m.words.korean,
            romanization: m.words.romanization,
            content_version: m.words.content_version,
            gloss: tr?.gloss,
            gloss_short: tr?.gloss_short,
            example_ko: tr?.example_ko,
            example_en: tr?.example_en,
            is_free_sample: m.is_free_sample,
          };
        });

      return {
        pack_id: pack.pack_id,
        name: pack.name,
        tier: pack.tier,
        version: pack.version,
        monthly_release_at: pack.monthly_release_at,
        words,
      };
    })
  );

  // 4. 무료 사용자에게 Premium pack의 free_sample 10단어 추가 (CC3-01)
  if (userId && !isPremium) {
    const { data: previewMembers } = await admin
      .from("word_pack_members")
      .select("pack_id, word_id, sort_order, words!inner(korean, romanization, content_version, retired_at, word_translations!inner(gloss, gloss_short, example_ko, example_en)), word_packs!inner(pack_id, name, tier, version)")
      .eq("is_free_sample", true)
      .eq("words.word_translations.locale", "en-US")
      .eq("word_packs.tier", "premium");

    // pack 별로 묶어서 packsPayload에 추가 (preview pool은 별도 표기)
    const previewByPack = new Map<string, any[]>();
    for (const m of previewMembers ?? []) {
      const pid = (m as any).pack_id;
      const w = (m as any).words;
      const tr = Array.isArray(w?.word_translations) ? w.word_translations[0] : w?.word_translations;
      const list = previewByPack.get(pid) ?? [];
      list.push({
        word_id: m.word_id,
        korean: w?.korean,
        romanization: w?.romanization,
        content_version: w?.content_version,
        gloss: tr?.gloss,
        gloss_short: tr?.gloss_short,
        example_ko: tr?.example_ko,
        example_en: tr?.example_en,
        is_free_sample: true,
      });
      previewByPack.set(pid, list);
    }
    for (const [pid, words] of previewByPack) {
      const pack = (allPacks ?? []).find((p) => p.pack_id === pid);
      if (pack) {
        packsPayload.push({
          pack_id: pack.pack_id,
          name: `${pack.name} (Preview)`,
          tier: pack.tier,
          version: pack.version,
          monthly_release_at: pack.monthly_release_at,
          words,
        });
      }
    }
  }

  const responseBody = {
    current_version: currentVersion,
    packs: packsPayload,
    min_app_version: "0.1.0", // M5 진입 시 강제 업데이트 게이트 활용
  };

  const etag = await makeEtag(responseBody);

  // If-None-Match 처리
  const ifNoneMatch = req.headers.get("If-None-Match");
  if (ifNoneMatch === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: {
      "content-type": "application/json",
      ETag: etag,
      "Cache-Control": "private, max-age=300", // 5분 캐시
    },
  });
});
