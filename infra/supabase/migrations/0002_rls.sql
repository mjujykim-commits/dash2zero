-- ============================================================================
-- dash2zero — 0002_rls.sql
-- ============================================================================
-- ADR-0004 RLS Policy Matrix (13 tables × 5 roles × 4 CRUD)
-- Source: docs/adr/ADR-0004-rls-policies.md
-- Author: backend + security
-- Date:   2026-05-08 (M2-S2 W6)
--
-- 핵심 원칙 (default deny + selective grant):
--   1. RLS enabled on ALL tables
--   2. learning_attempts: append-only (INSERT만, UPDATE/DELETE 거부)
--   3. subscription_entitlements: client read-only (service_role만 write)
--   4. audit_log: service_role only INSERT
--   5. anon: free pack 외 접근 거부
-- ============================================================================

-- ============================================================================
-- ENABLE RLS — 17 tables
-- ============================================================================

ALTER TABLE profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE words                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_translations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE distractors               ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_packs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_pack_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_manifests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_assets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_states          ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_attempts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage               ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                 ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper: support role check (M5+ JWT custom claim)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_support()
RETURNS BOOLEAN AS $$
  SELECT (auth.jwt() ->> 'role') = 'support'
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- profiles: owner-only RU, support R, service_role RUD
-- ============================================================================

CREATE POLICY profile_owner_select ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY profile_owner_update ON profiles FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY profile_owner_insert ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY profile_support_select ON profiles FOR SELECT USING (is_support());

-- ============================================================================
-- guest_sessions: anon CR (device_install_id 자기 row), authenticated R own
-- ============================================================================

CREATE POLICY guest_anon_insert ON guest_sessions FOR INSERT TO anon
  WITH CHECK (TRUE);  -- device_install_id는 클라이언트가 생성, throttle은 Edge Function

CREATE POLICY guest_owner_select ON guest_sessions FOR SELECT
  USING (auth.uid() = merged_to_user_id);

CREATE POLICY guest_support_select ON guest_sessions FOR SELECT USING (is_support());

-- ============================================================================
-- words: anon R (free pack only via word_pack_members), authenticated R all
-- ============================================================================

CREATE POLICY words_anon_select ON words FOR SELECT TO anon
  USING (
    retired_at IS NULL
    AND EXISTS (
      SELECT 1 FROM word_pack_members wpm
      JOIN word_packs wp ON wp.pack_id = wpm.pack_id
      WHERE wpm.word_id = words.word_id AND wp.tier = 'starter'
    )
  );

CREATE POLICY words_authenticated_select ON words FOR SELECT TO authenticated
  USING (retired_at IS NULL);

CREATE POLICY words_support_select ON words FOR SELECT USING (is_support());

-- ============================================================================
-- word_translations / distractors: words 정책 따라감 (free pack only for anon)
-- ============================================================================

CREATE POLICY wt_anon_select ON word_translations FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM word_pack_members wpm
    JOIN word_packs wp ON wp.pack_id = wpm.pack_id
    WHERE wpm.word_id = word_translations.word_id AND wp.tier = 'starter'
  ));

CREATE POLICY wt_authenticated_select ON word_translations FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY wt_support_select ON word_translations FOR SELECT USING (is_support());

CREATE POLICY distractors_anon_select ON distractors FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM word_pack_members wpm
    JOIN word_packs wp ON wp.pack_id = wpm.pack_id
    WHERE wpm.word_id = distractors.word_id AND wp.tier = 'starter'
  ));

CREATE POLICY distractors_authenticated_select ON distractors FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY distractors_support_select ON distractors FOR SELECT USING (is_support());

-- ============================================================================
-- word_packs / word_pack_members / content_manifests: tier 구분
-- ============================================================================

CREATE POLICY packs_anon_select ON word_packs FOR SELECT TO anon
  USING (tier = 'starter');

CREATE POLICY packs_authenticated_select ON word_packs FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY packs_support_select ON word_packs FOR SELECT USING (is_support());

CREATE POLICY pack_members_anon_select ON word_pack_members FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM word_packs wp WHERE wp.pack_id = word_pack_members.pack_id AND wp.tier = 'starter'));

CREATE POLICY pack_members_authenticated_select ON word_pack_members FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY pack_members_support_select ON word_pack_members FOR SELECT USING (is_support());

CREATE POLICY manifests_select_all ON content_manifests FOR SELECT
  USING (rolled_back_at IS NULL);

-- ============================================================================
-- audio_assets: tier 구분 — Premium은 서명 URL via Edge Function (CC3-04)
-- ============================================================================

CREATE POLICY audio_anon_select ON audio_assets FOR SELECT TO anon
  USING (tier = 'free' AND retired_at IS NULL);

CREATE POLICY audio_authenticated_select ON audio_assets FOR SELECT TO authenticated
  USING (
    retired_at IS NULL
    AND (
      tier = 'free'
      OR EXISTS (
        SELECT 1 FROM subscription_entitlements e
        WHERE e.user_id = auth.uid()
          AND e.status IN ('active', 'grace_period', 'billing_retry', 'cancelled')
          AND (e.period_ends_at IS NULL OR e.period_ends_at > NOW())
      )
    )
  );

CREATE POLICY audio_support_select ON audio_assets FOR SELECT USING (is_support());

-- ============================================================================
-- user_word_states: owner-only, server SSOT
-- ============================================================================

CREATE POLICY uws_owner_select ON user_word_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY uws_owner_insert ON user_word_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 클라이언트 직접 update 금지 — Edge Function의 service_role만 허용
-- (no CREATE POLICY for UPDATE/DELETE)

CREATE POLICY uws_support_select ON user_word_states FOR SELECT USING (is_support());

-- ============================================================================
-- learning_attempts: APPEND-ONLY (INSERT만, UPDATE/DELETE 거부)
-- ============================================================================

CREATE POLICY attempt_owner_insert ON learning_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY attempt_owner_select ON learning_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- UPDATE / DELETE policy 의도적으로 없음 → append-only (CC-16)

CREATE POLICY attempt_support_select ON learning_attempts FOR SELECT USING (is_support());

-- ============================================================================
-- learning_sessions: owner-only CR
-- ============================================================================

CREATE POLICY session_owner_insert ON learning_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY session_owner_select ON learning_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY session_owner_update ON learning_sessions FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY session_support_select ON learning_sessions FOR SELECT USING (is_support());

-- ============================================================================
-- daily_usage: owner R only (server SSOT, service_role write)
-- ============================================================================

CREATE POLICY usage_owner_select ON daily_usage FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE 금지 → service_role (Edge Function)이 atomic increment

CREATE POLICY usage_support_select ON daily_usage FOR SELECT USING (is_support());

-- ============================================================================
-- subscription_entitlements: client READ-ONLY, RC webhook write-only
-- ============================================================================

CREATE POLICY entitlement_owner_select ON subscription_entitlements FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE policy 의도적으로 없음 → service_role만 가능
-- (RC webhook handler에서 멱등 upsert)

CREATE POLICY entitlement_support_select ON subscription_entitlements FOR SELECT USING (is_support());

-- ============================================================================
-- content_reports: anon insert 허용, owner read own, support all
-- ============================================================================

CREATE POLICY report_anon_insert ON content_reports FOR INSERT TO anon
  WITH CHECK (
    reporter_device_id IS NOT NULL  -- anon은 device_id 필수
    AND reporter_user_id IS NULL
  );

CREATE POLICY report_authenticated_insert ON content_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY report_owner_select ON content_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_user_id);

CREATE POLICY report_support_all ON content_reports
  USING (is_support()) WITH CHECK (is_support());

-- ============================================================================
-- account_deletion_requests: owner CRU, support R
-- ============================================================================

CREATE POLICY deletion_owner_insert ON account_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY deletion_owner_select ON account_deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY deletion_owner_update ON account_deletion_requests FOR UPDATE
  USING (auth.uid() = user_id AND completed_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- DELETE 금지 — 30일 hard-delete cron만 처리

CREATE POLICY deletion_support_select ON account_deletion_requests FOR SELECT USING (is_support());

-- ============================================================================
-- audit_log: service_role INSERT only, support SELECT only
-- ============================================================================

-- INSERT는 service_role만 (Supabase 기본 — policy 없음)
-- SELECT는 support 또는 본인 actor만

CREATE POLICY audit_support_select ON audit_log FOR SELECT USING (is_support());

CREATE POLICY audit_self_select ON audit_log FOR SELECT TO authenticated
  USING (actor = 'user:' || auth.uid()::TEXT);

-- ============================================================================
-- DONE — RLS 정책 적용 완료
-- 검증: M2-S3에서 RLS-ADV-001~007 단위 테스트 (ADR-0004 §4)
-- ============================================================================
