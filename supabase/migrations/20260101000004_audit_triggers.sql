-- ============================================================================
-- dash2zero — 0004_audit_triggers.sql
-- ============================================================================
-- audit_log AFTER INSERT trigger → pg_net.http_post(webhook URL)
--
-- Author: security agent (M3 W15)
-- Date:   2026-05-11
-- Source: docs/security/AUDIT_ALERT_RUNBOOK.md
--
-- 설계 원칙:
--   1. webhook URL은 vault.secrets에서 읽음 (현재 NULL placeholder, M5에 실 URL 등록)
--   2. URL이 NULL이면 trigger no-op (paper 모드) — production 안전
--   3. severity 분류:  P0 / P1 / P2  (runbook 우선순위 정렬과 1:1)
--   4. dedup 5분 윈도 (actor_hash, table_name, action) — 동일 패턴 1건만 발송
--   5. PII 평문 금지 — actor_user_id는 sha256 8자 prefix만 (usr_a1b2c3d4)
--   6. pg_net.http_post 실패해도 audit_log INSERT 자체는 성공 (try/catch)
--   7. trigger 무한 재귀 방지 — alert 자체는 audit_log에 기록 안 함
-- ============================================================================

-- ============================================================================
-- Extensions (설치 가정 — local에서는 supabase/cli가 자동 설치)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- digest() for sha256

-- ============================================================================
-- vault.secrets — webhook URL placeholder
-- ============================================================================
-- NOTE: Supabase Vault 사용 (Postgres 17 + pgsodium).
--       M5에 실 URL 등록:
--           SELECT vault.create_secret('SLACK_SECURITY_WEBHOOK', 'https://hooks.slack.com/...');
--       W15 시점은 NULL — alert 발송 trigger no-op.
--
-- 조회: SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SLACK_SECURITY_WEBHOOK';
-- ============================================================================

-- ============================================================================
-- audit_alert_dedup — in-memory 5분 윈도 dedup 테이블 (RLS off, service_role only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_alert_dedup (
  dedup_key       TEXT PRIMARY KEY,           -- sha256(actor_hash || table_name || action)
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hit_count       INTEGER     NOT NULL DEFAULT 1,
  severity        TEXT        NOT NULL,        -- P0 / P1 / P2
  alert_sent_at   TIMESTAMPTZ                  -- NULL = 아직 발송 전
);

-- 인덱스: 5분 이전 row cleanup
CREATE INDEX IF NOT EXISTS audit_alert_dedup_last_seen_idx
  ON audit_alert_dedup(last_seen_at);

-- RLS off — service_role / trigger 내부에서만 접근
ALTER TABLE audit_alert_dedup DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helpers
-- ============================================================================

-- actor 식별자 → sha256 8자 prefix (PII 평문 금지)
CREATE OR REPLACE FUNCTION audit_actor_hash(p_actor TEXT)
RETURNS TEXT
LANGUAGE SQL IMMUTABLE
AS $$
  SELECT 'usr_' || substring(encode(extensions.digest(COALESCE(p_actor, 'unknown'), 'sha256'), 'hex'), 1, 8)
$$;

-- severity 분류 (runbook §2 P0/P1/P2 매핑)
CREATE OR REPLACE FUNCTION audit_classify_severity(
  p_table  TEXT,
  p_action TEXT
) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  -- P0: 결제 우회 (subscription_entitlements 직접 write)
  IF p_table = 'subscription_entitlements' AND p_action IN ('insert', 'update', 'delete', 'rls_violation_attempt') THEN
    RETURN 'P0';
  END IF;

  -- P0: audit chain 위변조 (audit_log 자체에 write 시도)
  IF p_table = 'audit_log' AND p_action IN ('insert', 'update', 'delete', 'rls_violation_attempt') THEN
    RETURN 'P0';
  END IF;

  -- P1: cross-user PII read 시도 (RLS-ADV-001/008 류 — audit_log에 'rls_violation_attempt'로 기록됨)
  IF p_action = 'rls_violation_attempt' AND p_table IN (
    'profiles', 'user_word_states', 'learning_attempts', 'learning_sessions',
    'daily_usage', 'content_reports'
  ) THEN
    RETURN 'P1';
  END IF;

  -- P1: anon write 시도
  IF p_action = 'anon_write_attempt' THEN
    RETURN 'P1';
  END IF;

  -- 그 외: P2 (일배치 요약)
  RETURN 'P2';
END;
$$;

-- ============================================================================
-- Trigger function: audit_log AFTER INSERT → pg_net.http_post (alert)
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_log_alert_dispatch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_severity     TEXT;
  v_actor_hash   TEXT;
  v_dedup_key    TEXT;
  v_webhook_url  TEXT;
  v_payload      JSONB;
  v_window       INTERVAL := INTERVAL '5 minutes';
  v_existing     audit_alert_dedup%ROWTYPE;
BEGIN
  -- 1. severity 분류
  v_severity := audit_classify_severity(NEW.target_table, NEW.action);

  -- P2는 dispatch skip (일배치 요약은 별도 nightly job이 audit_log scan)
  IF v_severity = 'P2' THEN
    RETURN NEW;
  END IF;

  -- 2. actor hash + dedup key
  v_actor_hash := audit_actor_hash(NEW.actor);
  v_dedup_key := encode(
    extensions.digest(v_actor_hash || ':' || COALESCE(NEW.target_table, '') || ':' || COALESCE(NEW.action, ''), 'sha256'),
    'hex'
  );

  -- 3. 5분 윈도 dedup
  SELECT * INTO v_existing FROM audit_alert_dedup
   WHERE dedup_key = v_dedup_key
     AND last_seen_at > NOW() - v_window
   FOR UPDATE;

  IF FOUND THEN
    -- 기존 윈도 내 — counter만 증가, alert 미발송
    UPDATE audit_alert_dedup
       SET last_seen_at = NOW(),
           hit_count    = v_existing.hit_count + 1
     WHERE dedup_key = v_dedup_key;
    RETURN NEW;
  END IF;

  -- 4. 신규 또는 윈도 만료 — dedup row insert + alert 발송 후보
  INSERT INTO audit_alert_dedup (dedup_key, severity, first_seen_at, last_seen_at, hit_count)
  VALUES (v_dedup_key, v_severity, NOW(), NOW(), 1)
  ON CONFLICT (dedup_key) DO UPDATE SET
    first_seen_at = NOW(),
    last_seen_at  = NOW(),
    hit_count     = 1,
    alert_sent_at = NULL;

  -- 5. webhook URL 조회 (vault.secrets) — NULL이면 paper 모드 (W15 현재)
  BEGIN
    SELECT decrypted_secret INTO v_webhook_url
      FROM vault.decrypted_secrets
     WHERE name = 'SLACK_SECURITY_WEBHOOK'
     LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_webhook_url := NULL;  -- vault 미설정 시 안전
  END;

  IF v_webhook_url IS NULL OR v_webhook_url = '' THEN
    -- paper 모드: alert 발송 skip, dedup row만 유지 (audit chain은 정상)
    RETURN NEW;
  END IF;

  -- 6. 페이로드 빌드 — PII 평문 금지
  v_payload := jsonb_build_object(
    'severity',         v_severity,
    'pattern_id',       COALESCE(NEW.pattern_id, NEW.action),
    'actor',            v_actor_hash,                   -- usr_a1b2c3d4
    'table',            NEW.target_table,
    'attempted_action', NEW.action,
    'blocked_by',       COALESCE(NEW.policy_name, 'default-deny'),
    'timestamp_utc',    to_char(NEW.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'timestamp_kst',    to_char(NEW.created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI'),
    'runbook_url',      'https://github.com/<org>/dash2zero/blob/main/docs/security/AUDIT_ALERT_RUNBOOK.md#' || v_severity
  );

  -- 7. pg_net.http_post — async, 실패해도 INSERT 자체는 성공
  BEGIN
    PERFORM net.http_post(
      url     := v_webhook_url,
      body    := v_payload,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      timeout_milliseconds := 3000
    );

    UPDATE audit_alert_dedup
       SET alert_sent_at = NOW()
     WHERE dedup_key = v_dedup_key;
  EXCEPTION WHEN OTHERS THEN
    -- alert 발송 실패 — audit_log INSERT 자체는 성공시켜야 함 (chain 무결성 우선)
    -- 실패 자체를 별도 로깅하면 무한 재귀 위험 → noop
    NULL;
  END;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION audit_log_alert_dispatch FROM PUBLIC;
GRANT EXECUTE ON FUNCTION audit_log_alert_dispatch TO service_role;

-- ============================================================================
-- Trigger 부착
-- ============================================================================

DROP TRIGGER IF EXISTS audit_log_alert_trigger ON audit_log;

CREATE TRIGGER audit_log_alert_trigger
  AFTER INSERT ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_alert_dispatch();

-- ============================================================================
-- Cleanup job — 1시간 이전 dedup row 삭제 (cron 별도 등록)
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_alert_dedup_cleanup()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM audit_alert_dedup
   WHERE last_seen_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION audit_alert_dedup_cleanup FROM PUBLIC;
GRANT EXECUTE ON FUNCTION audit_alert_dedup_cleanup TO service_role;

-- pg_cron 등록은 supabase 환경변수 의존 — M5에 enable
-- SELECT cron.schedule('audit-alert-dedup-cleanup', '0 * * * *', 'SELECT audit_alert_dedup_cleanup();');

-- ============================================================================
-- DONE
-- ============================================================================
-- 검증 (W15 paper 모드):
--   1. INSERT INTO audit_log VALUES (..., target_table='subscription_entitlements', action='rls_violation_attempt');
--   2. SELECT * FROM audit_alert_dedup;  -- row 1건, severity='P0', alert_sent_at IS NULL
--   3. M5에 vault.create_secret(...) 등록 후 동일 INSERT → alert_sent_at NOT NULL
-- ============================================================================
