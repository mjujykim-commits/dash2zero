-- ============================================================================
-- dash2zero — 0001_init.sql
-- ============================================================================
-- Migration: 13 entities + indexes + enums
-- Source: docs/architecture/DOMAIN_MODEL.md §2 (15 entities; profiles + lookup omitted from explicit table count)
-- Author:  backend agent
-- Date:    2026-05-08 (M2-S2 W6)
-- Stack:   Supabase Postgres (ADR-0001) + RLS in 0002 (ADR-0004)
--
-- 핵심 invariants (DOMAIN_MODEL §4):
--   - word_id, user_id 영구 키 (CC2-15, CC3-07)
--   - learning_attempts append-only (CC-16, ADR-0004)
--   - subscription_entitlements webhook write-only (CC2-08, ADR-0004)
--   - daily_usage server SSOT (CC2-07)
-- ============================================================================

-- ============================================================================
-- Enums
-- ============================================================================

CREATE TYPE auth_provider_enum AS ENUM ('apple', 'google', 'email_magic_link');

CREATE TYPE word_kind_enum AS ENUM ('word', 'example');

CREATE TYPE pack_tier_enum AS ENUM ('starter', 'premium');

CREATE TYPE audio_tier_enum AS ENUM ('free', 'premium');

CREATE TYPE entitlement_status_enum AS ENUM (
  'active', 'grace_period', 'billing_retry', 'expired',
  'refunded', 'revoked', 'transferred', 'cancelled', 'unknown'
);

CREATE TYPE report_category_enum AS ENUM ('typo', 'translation', 'audio', 'level', 'other');

CREATE TYPE report_status_enum AS ENUM ('pending', 'resolved', 'rejected');

CREATE TYPE report_action_enum AS ENUM ('retire', 'edit', 'no_action');

CREATE TYPE learning_motivation_enum AS ENUM ('kpop', 'kdrama', 'travel', 'other');

-- ============================================================================
-- 1. profiles  (auth.users는 Supabase가 관리)
-- ============================================================================

CREATE TABLE profiles (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name       TEXT,
  learning_motivation learning_motivation_enum,
  email_hash         TEXT,                         -- SHA256(email + salt) — DSAR 응답용
  locale             TEXT NOT NULL DEFAULT 'en-US',
  timezone           TEXT NOT NULL DEFAULT 'UTC',  -- IANA zone (예: America/Los_Angeles)
  age_attestation_at TIMESTAMPTZ NOT NULL,         -- age gate 통과 시각 (CC2-05)
  srs_started_at     TIMESTAMPTZ,
  merged_at          TIMESTAMPTZ,                  -- 게스트→가입 머지 (CC2-04)
  soft_deleted_at    TIMESTAMPTZ,                  -- 30일 hard-delete 대기 (C-11)
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_soft_deleted_at ON profiles (soft_deleted_at) WHERE soft_deleted_at IS NOT NULL;

-- ============================================================================
-- 2. guest_sessions  (게스트 모드 추적)
-- ============================================================================

CREATE TABLE guest_sessions (
  device_install_id     UUID PRIMARY KEY,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  merged_to_user_id     UUID REFERENCES auth.users(id),
  merged_at             TIMESTAMPTZ,
  last_seen_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guest_sessions_merged_to_user ON guest_sessions (merged_to_user_id) WHERE merged_to_user_id IS NOT NULL;

-- ============================================================================
-- 3. words  (영구 키 word_id, content_version과 분리)
-- ============================================================================

CREATE TABLE words (
  word_id          TEXT PRIMARY KEY,                          -- 영구 키 (예: 'w-001-사과')
  korean           TEXT NOT NULL,
  romanization     TEXT NOT NULL,                              -- RR (CC-18)
  content_version  INTEGER NOT NULL DEFAULT 1,
  retired_at       TIMESTAMPTZ,                                -- 콘텐츠 신고로 retire (CC3-07)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_words_retired_at ON words (retired_at) WHERE retired_at IS NULL;

-- ============================================================================
-- 4. word_translations  (locale별)
-- ============================================================================

CREATE TABLE word_translations (
  word_id          TEXT NOT NULL REFERENCES words(word_id) ON DELETE CASCADE,
  locale           TEXT NOT NULL,                              -- 'en-US' (MVP)
  gloss            TEXT NOT NULL,
  gloss_short      TEXT NOT NULL,                              -- 1-5 단어 (CC2-11)
  example_ko       TEXT,
  example_en       TEXT,
  content_version  INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (word_id, locale)
);

-- ============================================================================
-- 5. distractors  (객관식 4지선다 — CC2-11 정량 룰)
-- ============================================================================

CREATE TABLE distractors (
  word_id              TEXT NOT NULL REFERENCES words(word_id) ON DELETE CASCADE,
  distractor_word_id   TEXT NOT NULL REFERENCES words(word_id) ON DELETE CASCADE,
  distance_score       NUMERIC(3,2) NOT NULL,                  -- cosine 0.0-1.0
  content_version      INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (word_id, distractor_word_id),
  CHECK (word_id != distractor_word_id)
);

-- ============================================================================
-- 6. word_packs  (Starter / Premium / 매월 50)
-- ============================================================================

CREATE TABLE word_packs (
  pack_id              TEXT PRIMARY KEY,                       -- 'starter-001' / 'premium-2026-05' 등
  name                 TEXT NOT NULL,
  tier                 pack_tier_enum NOT NULL,
  monthly_release_at   DATE,                                    -- Premium 월간 pack 출시일
  version              INTEGER NOT NULL DEFAULT 1,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. word_pack_members  (pack ↔ word, free sample 표기 — CC3-01)
-- ============================================================================

CREATE TABLE word_pack_members (
  pack_id          TEXT NOT NULL REFERENCES word_packs(pack_id) ON DELETE CASCADE,
  word_id          TEXT NOT NULL REFERENCES words(word_id) ON DELETE CASCADE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_free_sample   BOOLEAN NOT NULL DEFAULT FALSE,             -- CC3-01 무료 샘플 10 / 신규 pack
  PRIMARY KEY (pack_id, word_id)
);

-- ============================================================================
-- 8. content_manifests  (CC2-15 원격 업데이트 + diff 배포)
-- ============================================================================

CREATE TABLE content_manifests (
  manifest_version  INTEGER PRIMARY KEY,
  pack_id           TEXT NOT NULL REFERENCES word_packs(pack_id),
  pack_version      INTEGER NOT NULL,
  content_hash      TEXT NOT NULL,
  words_diff        JSONB NOT NULL DEFAULT '{}'::jsonb,
  released_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rolled_back_at    TIMESTAMPTZ
);

CREATE INDEX idx_content_manifests_pack_version ON content_manifests (pack_id, pack_version);

-- ============================================================================
-- 9. audio_assets  (Google Cloud TTS — ADR-0005)
-- ============================================================================

CREATE TABLE audio_assets (
  audio_id     TEXT PRIMARY KEY,                                -- 'a-001-word-사과'
  word_id      TEXT NOT NULL REFERENCES words(word_id) ON DELETE CASCADE,
  kind         word_kind_enum NOT NULL,                          -- word | example
  provider     TEXT NOT NULL DEFAULT 'google_neural2',           -- ADR-0005
  voice_id     TEXT NOT NULL DEFAULT 'ko-KR-Neural2-A',
  audio_url    TEXT NOT NULL,                                    -- Supabase Storage path
  audio_hash   TEXT NOT NULL,                                    -- SHA256, cache invalidation
  tier         audio_tier_enum NOT NULL,                         -- free | premium
  license      TEXT NOT NULL DEFAULT 'google_tos',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retired_at   TIMESTAMPTZ
);

CREATE INDEX idx_audio_assets_word_kind ON audio_assets (word_id, kind);

-- ============================================================================
-- 10. user_word_states  (SRS 상태 — CC-08, CC2-10, CC3-05)
-- ============================================================================

CREATE TABLE user_word_states (
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id                  TEXT NOT NULL REFERENCES words(word_id) ON DELETE CASCADE,
  stage                    INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 5),
  weak                     BOOLEAN NOT NULL DEFAULT FALSE,
  correct_count            INTEGER NOT NULL DEFAULT 0,
  incorrect_count          INTEGER NOT NULL DEFAULT 0,
  last_attempt_at          TIMESTAMPTZ,
  last_attempt_correct     BOOLEAN,
  next_due_at              TIMESTAMPTZ NOT NULL,
  mastered_at              TIMESTAMPTZ,
  last_seen_content_version INTEGER NOT NULL DEFAULT 1,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, word_id)
);

CREATE INDEX idx_uws_due ON user_word_states (user_id, next_due_at) WHERE mastered_at IS NULL OR weak = TRUE;
CREATE INDEX idx_uws_mastered ON user_word_states (user_id) WHERE mastered_at IS NOT NULL;

-- ============================================================================
-- 11. learning_attempts  (append-only, idempotent)
-- ============================================================================

CREATE TABLE learning_attempts (
  attempt_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id                     TEXT NOT NULL REFERENCES words(word_id),
  client_attempt_id           UUID NOT NULL,                    -- idempotency
  correct                     BOOLEAN NOT NULL,
  question_template_id        TEXT,                              -- 'mcq-4' 등
  content_version_at_attempt  INTEGER NOT NULL,
  occurred_at                 TIMESTAMPTZ NOT NULL,              -- client clock
  server_recv_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_install_id           UUID,                              -- 멀티 디바이스 추적
  UNIQUE (user_id, client_attempt_id)                           -- 중복 방어
);

CREATE INDEX idx_attempts_user_recent ON learning_attempts (user_id, occurred_at DESC);

-- ============================================================================
-- 12. learning_sessions  (lesson 단위)
-- ============================================================================

CREATE TABLE learning_sessions (
  session_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at           TIMESTAMPTZ NOT NULL,
  completed_at         TIMESTAMPTZ,
  abandoned_at         TIMESTAMPTZ,
  new_words_count      INTEGER NOT NULL DEFAULT 0,
  reviews_count        INTEGER NOT NULL DEFAULT 0,
  duration_sec         INTEGER
);

CREATE INDEX idx_sessions_user_started ON learning_sessions (user_id, started_at DESC);

-- ============================================================================
-- 13. daily_usage  (일일 한도 SSOT — CC2-07)
-- ============================================================================

CREATE TABLE daily_usage (
  user_id                      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_day                    DATE NOT NULL,
  timezone                     TEXT NOT NULL,
  new_words_started_count      INTEGER NOT NULL DEFAULT 0,
  reviews_completed_count      INTEGER NOT NULL DEFAULT 0,
  lesson_completed_count       INTEGER NOT NULL DEFAULT 0,
  paywall_view_count           INTEGER NOT NULL DEFAULT 0,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, local_day)
);

-- ============================================================================
-- 14. subscription_entitlements  (CC2-08, RC webhook write-only)
-- ============================================================================

CREATE TABLE subscription_entitlements (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rc_app_user_id           TEXT NOT NULL,
  rc_original_app_user_id  TEXT,
  rc_customer_id           TEXT NOT NULL,
  entitlement_id           TEXT NOT NULL,                       -- 'premium_monthly' / 'premium_annual'
  product_id               TEXT NOT NULL,
  store                    TEXT NOT NULL,                       -- 'app_store' | 'play_store'
  environment              TEXT NOT NULL,                       -- 'sandbox' | 'production'
  status                   entitlement_status_enum NOT NULL,
  period_started_at        TIMESTAMPTZ,
  period_ends_at           TIMESTAMPTZ,
  grace_period_ends_at     TIMESTAMPTZ,                         -- CC3-05
  auto_renew_status        BOOLEAN,
  ownership_type           TEXT,                                 -- 'PURCHASED' | 'FAMILY_SHARED' (비활성 — CC2-09)
  last_rc_event_id         TEXT NOT NULL UNIQUE,                -- 멱등 키
  last_synced_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entitlements_user ON subscription_entitlements (user_id, status);
CREATE INDEX idx_entitlements_period ON subscription_entitlements (period_ends_at) WHERE status IN ('active', 'grace_period', 'billing_retry');

-- ============================================================================
-- 15. content_reports  (J-006)
-- ============================================================================

CREATE TABLE content_reports (
  report_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id             TEXT NOT NULL REFERENCES words(word_id) ON DELETE CASCADE,
  reporter_user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_device_id  UUID,                                      -- anon 신고 (RLS 허용)
  category            report_category_enum NOT NULL,
  description         TEXT,
  status              report_status_enum NOT NULL DEFAULT 'pending',
  reported_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ,
  resolved_by         UUID,                                      -- support / Owner user_id
  action              report_action_enum
);

CREATE INDEX idx_reports_status ON content_reports (status, reported_at DESC);
CREATE INDEX idx_reports_word ON content_reports (word_id);

-- ============================================================================
-- 16. account_deletion_requests  (C-11, 30일 SLA)
-- ============================================================================

CREATE TABLE account_deletion_requests (
  request_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_hard_delete_at  TIMESTAMPTZ NOT NULL,                -- requested_at + 30 days
  completed_at              TIMESTAMPTZ,
  exported_at               TIMESTAMPTZ,
  export_format             TEXT DEFAULT 'json',
  UNIQUE (user_id)                                               -- 사용자당 1회 active
);

CREATE INDEX idx_deletion_scheduled ON account_deletion_requests (scheduled_hard_delete_at) WHERE completed_at IS NULL;

-- ============================================================================
-- 17. audit_log  (service_role only, 운영 변경 추적)
-- ============================================================================

CREATE TABLE audit_log (
  log_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor         TEXT NOT NULL,                                   -- 'user:<uuid>' | 'system' | 'service_role' | 'support:<uuid>'
  action        TEXT NOT NULL,                                   -- 'guest_merge' | 'content_retire' | 'webhook_revenuecat' 등
  target_table  TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  before_jsonb  JSONB,
  after_jsonb   JSONB,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_target ON audit_log (target_table, target_id, occurred_at DESC);
CREATE INDEX idx_audit_actor ON audit_log (actor, occurred_at DESC);

-- ============================================================================
-- updated_at 자동 갱신 trigger (대부분 테이블)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_words_updated_at BEFORE UPDATE ON words FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_uws_updated_at BEFORE UPDATE ON user_word_states FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_daily_usage_updated_at BEFORE UPDATE ON daily_usage FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_entitlements_updated_at BEFORE UPDATE ON subscription_entitlements FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- DONE — RLS는 0002_rls.sql에서
-- ============================================================================
