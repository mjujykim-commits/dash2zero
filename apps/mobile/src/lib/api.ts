/**
 * API client — Edge Functions 호출 helpers
 *
 * Supabase functions.invoke + Edge Function URL 직접 호출 양 패턴 지원.
 * 인증 사용자/게스트 모두 동작.
 *
 * 책임 agent: frontend + backend (양쪽 인터페이스 정합)
 */

import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase";
import type {
  AnalyticsEventName,
  AudioAsset,
  ContentManifest,
  SubmitAttemptRequest,
} from "@dash2zero/contracts";

// ============================================================================
// submit-attempt (M2-S3)
// ============================================================================

export interface SubmitAttemptResponse {
  state: {
    stage: number;
    weak: boolean;
    correct_count: number;
    incorrect_count: number;
    last_attempt_at: string;
    next_due_at: string;
    mastered_at: string | null;
  };
  daily_usage: {
    new_words: number;
    reviews: number;
    limit_new_words: number;
    limit_reviews: number | null;
  };
  paywall_required: boolean;
  // M3 W15-03 (Q-DA-DOC-007) — 서버가 발화 권장 이벤트 명시
  srs_events?: Array<"srs_mastered_reached" | "srs_mastered_lost" | "srs_weak_flagged">;
}

export async function submitAttempt(req: SubmitAttemptRequest): Promise<SubmitAttemptResponse> {
  const { data, error } = await supabase.functions.invoke<SubmitAttemptResponse>("submit-attempt", {
    body: {
      ...req,
      occurred_at: req.occurred_at instanceof Date ? req.occurred_at.toISOString() : req.occurred_at,
    },
  });
  if (error) throw error;
  if (!data) throw new Error("empty_response");

  // M3 W15-03: SRS milestone emit은 호출자(lesson screen)가 stage_before/weak_before
  // snapshot과 함께 emitSrsMasteredReached/Lost/WeakFlagged helpers로 직접 발화한다.
  // (api.ts는 transport-only — properties 정합 책임은 호출 측.)

  return data;
}

// ============================================================================
// content-manifest (M2-S5)
// ============================================================================

export interface ContentManifestResponse {
  current_version: number;
  packs: Array<{
    pack_id: string;
    name: string;
    tier: "starter" | "premium";
    version: number;
    monthly_release_at: string | null;
    words: Array<{
      word_id: string;
      korean: string;
      romanization: string;
      content_version: number;
      gloss: string;
      gloss_short: string;
      example_ko: string | null;
      example_en: string | null;
      is_free_sample: boolean;
    }>;
  }>;
  min_app_version: string;
}

export async function fetchContentManifest(since: number = 0): Promise<ContentManifestResponse | null> {
  // content-manifest는 GET 전용 Edge Function. supabase.functions.invoke에 method:"GET"+body를 주면
  // "Request with GET method cannot have body"로 fetch가 실패한다 → 직접 GET fetch로 호출.
  // 인증 사용자는 access_token, 게스트는 anon key로 Authorization 헤더 구성(verify_jwt=false).
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? SUPABASE_ANON_KEY;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/content-manifest?since=${since}`, {
    method: "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 304) return null;
  if (!res.ok) throw new Error(`content-manifest ${res.status}`);
  return (await res.json()) as ContentManifestResponse;
}

// ============================================================================
// audio-signed-url (M2-S5)
// ============================================================================

export interface AudioUrlsResponse {
  urls: Record<string, { url?: string; expires_at?: string; audio_hash?: string; error?: string }>;
}

export async function fetchAudioUrls(audioIds: string[]): Promise<AudioUrlsResponse> {
  const { data, error } = await supabase.functions.invoke<AudioUrlsResponse>("audio-signed-url", {
    body: { audio_ids: audioIds },
  });
  if (error) throw error;
  if (!data) throw new Error("empty_response");
  return data;
}

// ============================================================================
// merge-guest (M2-S5)
// ============================================================================

export interface MergeGuestRequest {
  device_install_id: string;
  guest_attempts: Array<{
    client_attempt_id: string;
    word_id: string;
    correct: boolean;
    question_template_id?: string | null;
    content_version_at_attempt: number;
    occurred_at: string;
  }>;
}

export interface MergeGuestResponse {
  merged_attempts: number;
  merged_words: number;
  conflicts: Array<{ word_id: string; resolved: string }>;
  idempotent?: boolean;
}

export async function mergeGuestData(req: MergeGuestRequest): Promise<MergeGuestResponse> {
  const { data, error } = await supabase.functions.invoke<MergeGuestResponse>("merge-guest", {
    body: req,
  });
  if (error) throw error;
  if (!data) throw new Error("empty_response");
  return data;
}

// ============================================================================
// get-today (RPC, M2-S4)
// ============================================================================

export interface TodaySummary {
  new_words_remaining: number;
  reviews_due: number;
  streak_days: number;
  mastered_count: number;
  is_premium: boolean;
}

export async function fetchTodaySummary(userId: string): Promise<TodaySummary> {
  const { data, error } = await supabase.rpc("get_today_summary", { p_user_id: userId });
  if (error) throw error;
  // RPC가 SETOF 반환 — 첫 row만 사용
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("no_summary");
  return row as TodaySummary;
}
