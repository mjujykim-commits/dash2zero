/**
 * @dash2zero/contracts — Core Zod Schemas (M2-S2 W6)
 *
 * 이 파일은 13 테이블의 핵심 zod schema를 단일 파일에 모았다.
 * M3 진입 전에 entity별 파일로 분리 (현재 응집을 우선).
 *
 * Source: docs/architecture/DOMAIN_MODEL.md §2 + infra/supabase/migrations/0001_init.sql
 */

import { z } from "zod";
import { EntitlementStatusEnum } from "./billing/status.enum";

// ============================================================================
// 1. User / Profile
// ============================================================================

export const AuthProviderSchema = z.enum(["apple", "google", "email_magic_link"]);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

export const LearningMotivationSchema = z.enum(["kpop", "kdrama", "travel", "other"]);
export type LearningMotivation = z.infer<typeof LearningMotivationSchema>;

export const ProfileSchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string().max(50).nullable(),
  learning_motivation: LearningMotivationSchema.nullable(),
  email_hash: z.string().nullable(),
  locale: z.string().default("en-US"),
  timezone: z.string(), // IANA zone
  age_attestation_at: z.coerce.date(),
  srs_started_at: z.coerce.date().nullable(),
  merged_at: z.coerce.date().nullable(),
  soft_deleted_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const GuestSessionSchema = z.object({
  device_install_id: z.string().uuid(),
  created_at: z.coerce.date(),
  merged_to_user_id: z.string().uuid().nullable(),
  merged_at: z.coerce.date().nullable(),
  last_seen_at: z.coerce.date(),
});
export type GuestSession = z.infer<typeof GuestSessionSchema>;

// ============================================================================
// 2. Content
// ============================================================================

export const WordSchema = z.object({
  word_id: z.string().min(1).max(64),
  korean: z.string().min(1).max(100),
  romanization: z.string().min(1).max(100), // RR (CC-18)
  content_version: z.number().int().min(1),
  retired_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Word = z.infer<typeof WordSchema>;

export const WordTranslationSchema = z.object({
  word_id: z.string(),
  locale: z.string(), // 'en-US' for MVP
  gloss: z.string().min(1).max(200),
  gloss_short: z.string().min(1).max(50), // 1-5 단어 (CC2-11)
  example_ko: z.string().max(200).nullable(),
  example_en: z.string().max(200).nullable(),
  content_version: z.number().int().min(1),
});
export type WordTranslation = z.infer<typeof WordTranslationSchema>;

export const DistractorSchema = z.object({
  word_id: z.string(),
  distractor_word_id: z.string(),
  distance_score: z.number().min(0).max(1), // cosine
  content_version: z.number().int().min(1),
});
export type Distractor = z.infer<typeof DistractorSchema>;

export const PackTierSchema = z.enum(["starter", "premium"]);
export const WordPackSchema = z.object({
  pack_id: z.string(),
  name: z.string(),
  tier: PackTierSchema,
  monthly_release_at: z.coerce.date().nullable(),
  version: z.number().int().min(1),
  created_at: z.coerce.date(),
});
export type WordPack = z.infer<typeof WordPackSchema>;

export const ContentManifestSchema = z.object({
  manifest_version: z.number().int().min(1),
  pack_id: z.string(),
  pack_version: z.number().int().min(1),
  content_hash: z.string(), // SHA256
  words_diff: z.record(z.unknown()), // jsonb
  released_at: z.coerce.date(),
  rolled_back_at: z.coerce.date().nullable(),
});
export type ContentManifest = z.infer<typeof ContentManifestSchema>;

export const AudioTierSchema = z.enum(["free", "premium"]);
export const AudioAssetSchema = z.object({
  audio_id: z.string(),
  word_id: z.string(),
  kind: z.enum(["word", "example"]),
  provider: z.string().default("google_neural2"), // ADR-0005
  voice_id: z.string().default("ko-KR-Neural2-A"),
  audio_url: z.string(),
  audio_hash: z.string(), // SHA256
  tier: AudioTierSchema,
  license: z.string().default("google_tos"),
  created_at: z.coerce.date(),
  retired_at: z.coerce.date().nullable(),
});
export type AudioAsset = z.infer<typeof AudioAssetSchema>;

// ============================================================================
// 3. Learning State
// ============================================================================

export const UserWordStateSchema = z.object({
  user_id: z.string().uuid(),
  word_id: z.string(),
  stage: z.number().int().min(1).max(5), // CC-08 Leitner 5단계
  weak: z.boolean(),
  correct_count: z.number().int().min(0),
  incorrect_count: z.number().int().min(0),
  last_attempt_at: z.coerce.date().nullable(),
  last_attempt_correct: z.boolean().nullable(),
  next_due_at: z.coerce.date(),
  mastered_at: z.coerce.date().nullable(),
  last_seen_content_version: z.number().int().min(1),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type UserWordState = z.infer<typeof UserWordStateSchema>;

export const LearningAttemptSchema = z.object({
  attempt_id: z.string().uuid(),
  user_id: z.string().uuid(),
  word_id: z.string(),
  client_attempt_id: z.string().uuid(), // idempotency
  correct: z.boolean(),
  question_template_id: z.string().nullable(),
  content_version_at_attempt: z.number().int().min(1),
  occurred_at: z.coerce.date(),
  server_recv_at: z.coerce.date(),
  device_install_id: z.string().uuid().nullable(),
});
export type LearningAttempt = z.infer<typeof LearningAttemptSchema>;

export const SubmitAttemptRequestSchema = z.object({
  client_attempt_id: z.string().uuid(),
  word_id: z.string(),
  correct: z.boolean(),
  question_template_id: z.string().optional(),
  content_version_at_attempt: z.number().int().min(1),
  occurred_at: z.coerce.date(),
  device_install_id: z.string().uuid().optional(),
});
export type SubmitAttemptRequest = z.infer<typeof SubmitAttemptRequestSchema>;

export const DailyUsageSchema = z.object({
  user_id: z.string().uuid(),
  local_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO date
  timezone: z.string(),
  new_words_started_count: z.number().int().min(0),
  reviews_completed_count: z.number().int().min(0),
  lesson_completed_count: z.number().int().min(0),
  paywall_view_count: z.number().int().min(0),
});
export type DailyUsage = z.infer<typeof DailyUsageSchema>;

// ============================================================================
// 4. Billing / Subscription
// ============================================================================

export const SubscriptionEntitlementSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  rc_app_user_id: z.string(),
  rc_original_app_user_id: z.string().nullable(),
  rc_customer_id: z.string(),
  entitlement_id: z.string(), // 'premium_monthly' | 'premium_annual'
  product_id: z.string(),
  store: z.enum(["app_store", "play_store"]),
  environment: z.enum(["sandbox", "production"]),
  status: EntitlementStatusEnum,
  period_started_at: z.coerce.date().nullable(),
  period_ends_at: z.coerce.date().nullable(),
  grace_period_ends_at: z.coerce.date().nullable(), // CC3-05
  auto_renew_status: z.boolean().nullable(),
  ownership_type: z.string().nullable(),
  last_rc_event_id: z.string(),
  last_synced_at: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type SubscriptionEntitlement = z.infer<typeof SubscriptionEntitlementSchema>;

// ============================================================================
// 5. RevenueCat Webhook Payload (CC2-08)
// ============================================================================

export const RevenueCatEventTypeSchema = z.enum([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "BILLING_ISSUE",
  "EXPIRATION",
  "CANCELLATION",
  "REFUND",
  "REVOKE",
  "TRANSFER",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "TEST",
]);

export const RevenueCatWebhookPayloadSchema = z.object({
  event: z.object({
    id: z.string(),
    type: RevenueCatEventTypeSchema,
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
    cancel_reason: z.string().nullable().optional(),
  }),
  api_version: z.string().optional(),
});
export type RevenueCatWebhookPayload = z.infer<typeof RevenueCatWebhookPayloadSchema>;

// ============================================================================
// 6. Ops / Audit
// ============================================================================

export const ContentReportCategorySchema = z.enum(["typo", "translation", "audio", "level", "other"]);
export const ContentReportSchema = z.object({
  report_id: z.string().uuid(),
  word_id: z.string(),
  reporter_user_id: z.string().uuid().nullable(),
  reporter_device_id: z.string().uuid().nullable(),
  category: ContentReportCategorySchema,
  description: z.string().max(500).nullable(),
  status: z.enum(["pending", "resolved", "rejected"]),
  reported_at: z.coerce.date(),
  resolved_at: z.coerce.date().nullable(),
  resolved_by: z.string().uuid().nullable(),
  action: z.enum(["retire", "edit", "no_action"]).nullable(),
});
export type ContentReport = z.infer<typeof ContentReportSchema>;

export const SubmitContentReportRequestSchema = z.object({
  word_id: z.string(),
  category: ContentReportCategorySchema,
  description: z.string().max(500).optional(),
  reporter_device_id: z.string().uuid().optional(), // anon만
});
export type SubmitContentReportRequest = z.infer<typeof SubmitContentReportRequestSchema>;

export const AccountDeletionRequestSchema = z.object({
  request_id: z.string().uuid(),
  user_id: z.string().uuid(),
  requested_at: z.coerce.date(),
  scheduled_hard_delete_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable(),
  exported_at: z.coerce.date().nullable(),
  export_format: z.string().default("json"),
});
export type AccountDeletionRequest = z.infer<typeof AccountDeletionRequestSchema>;

export const AuditLogSchema = z.object({
  log_id: z.string().uuid(),
  actor: z.string(), // 'user:<uuid>' | 'system' | 'service_role' | 'support:<uuid>'
  action: z.string(),
  target_table: z.string(),
  target_id: z.string(),
  before_jsonb: z.unknown().nullable(),
  after_jsonb: z.unknown().nullable(),
  occurred_at: z.coerce.date(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

// ============================================================================
// 7. Analytics Events (CC2-22, CC2-24 — snake_case object_action)
// ============================================================================

export const AnalyticsEventNameSchema = z.enum([
  // First-run / Onboarding
  "app_open",
  "age_gate_completed",
  "privacy_choices_completed",
  "onboarding_completed",
  // Lesson core
  "lesson_started",
  "lesson_completed",
  "lesson_abandoned",
  "word_viewed",
  "word_answered",
  "audio_played",
  "audio_play_failed",
  // Paywall + 결제 (CC2-22)
  "paywall_viewed",
  "paywall_signin_required", // M3 W15 R-28 (designer): guest가 Subscribe → /auth/sign-in redirect 직전 funnel 분해
  "plan_selected",
  "checkout_started",
  "checkout_cancelled",
  "subscription_purchase_succeeded",
  "subscription_purchase_failed",
  "subscription_restore_started",
  "subscription_restore_succeeded",
  "subscription_restore_failed",
  "subscription_status_changed",
  "subscription_renewed",
  "subscription_expired",
  "refund_detected",
  // Notification
  "notification_permission_granted",
  "notification_permission_denied",
  "notification_sent",
  "notification_opened",
  // Account
  "account_signed_up",
  "account_logged_in",
  "guest_merge_succeeded",
  "guest_merge_failed",
  "account_deletion_requested",
  // Content
  "content_reported",
  // SRS measurement (Q-DA-DOC-007, M3 W15)
  "srs_mastered_reached",
  "srs_mastered_lost",
  "srs_weak_flagged",
  // Baseline metrics (M3 W15-02) — daily aggregate marker
  "metrics_baseline_day",
]);
export type AnalyticsEventName = z.infer<typeof AnalyticsEventNameSchema>;

export const AnalyticsEventSchema = z.object({
  name: AnalyticsEventNameSchema,
  ts: z.coerce.date(),
  user_id: z.string().uuid().optional(),
  device_install_id: z.string().uuid().optional(),
  session_id: z.string().uuid().optional(),
  attrs: z.record(z.unknown()).optional(),
});
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
