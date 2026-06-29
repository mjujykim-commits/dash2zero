-- ============================================================================
-- 0003_rpc.sql — RPC functions
-- ============================================================================
-- Migration: increment_daily_usage, compute_streak
-- Author:  backend agent
-- Date:    2026-05-08 (M2-S4 W8)
-- Source:  apps/api/edge-functions/submit-attempt 의존성
--
-- 모든 RPC는 SECURITY DEFINER (service_role 권한으로 RLS bypass).
-- ============================================================================

-- ============================================================================
-- increment_daily_usage  (CC2-07 server SSOT, atomic)
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_daily_usage(
  p_user_id   UUID,
  p_local_day DATE,
  p_timezone  TEXT,
  p_new_word  INTEGER,
  p_review    INTEGER
)
RETURNS daily_usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result daily_usage;
BEGIN
  INSERT INTO daily_usage (
    user_id, local_day, timezone,
    new_words_started_count, reviews_completed_count, lesson_completed_count,
    paywall_view_count
  )
  VALUES (
    p_user_id, p_local_day, p_timezone,
    p_new_word, p_review, 0, 0
  )
  ON CONFLICT (user_id, local_day) DO UPDATE SET
    new_words_started_count = daily_usage.new_words_started_count + p_new_word,
    reviews_completed_count = daily_usage.reviews_completed_count + p_review,
    timezone = EXCLUDED.timezone,  -- 사용자 timezone 변경 시 갱신
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION increment_daily_usage FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_daily_usage TO service_role;

-- ============================================================================
-- compute_streak  (CC-17 04:00 로컬 자정 기준)
-- ============================================================================
-- 정의:
--   사용자가 lesson_completed가 발생한 calendar day가 연속이면 streak.
--   "오늘"은 사용자 로컬 04:00 기준 calendar day.
--   오늘 또는 어제 lesson_completed가 있으면 streak 유효, 그 외는 끊김.
-- ============================================================================

CREATE OR REPLACE FUNCTION compute_streak(
  p_user_id UUID,
  p_now     TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_timezone   TEXT;
  v_today      DATE;
  v_streak     INTEGER := 0;
  v_check_day  DATE;
  v_has_lesson BOOLEAN;
BEGIN
  -- 사용자 timezone 조회
  SELECT timezone INTO v_timezone FROM profiles WHERE user_id = p_user_id;
  IF v_timezone IS NULL THEN v_timezone := 'UTC'; END IF;

  -- 오늘 (사용자 로컬 04:00 기준)
  v_today := (p_now AT TIME ZONE v_timezone - INTERVAL '4 hours')::DATE;

  -- 오늘 또는 어제 lesson 존재해야 streak 유효
  SELECT EXISTS (
    SELECT 1 FROM daily_usage
    WHERE user_id = p_user_id
      AND local_day IN (v_today, v_today - 1)
      AND lesson_completed_count > 0
  ) INTO v_has_lesson;

  IF NOT v_has_lesson THEN RETURN 0; END IF;

  -- 거꾸로 day-by-day 카운트
  v_check_day := v_today;

  -- 오늘 lesson 없으면 어제부터 시작
  IF NOT EXISTS (
    SELECT 1 FROM daily_usage
    WHERE user_id = p_user_id AND local_day = v_today AND lesson_completed_count > 0
  ) THEN
    v_check_day := v_today - 1;
  END IF;

  WHILE EXISTS (
    SELECT 1 FROM daily_usage
    WHERE user_id = p_user_id AND local_day = v_check_day AND lesson_completed_count > 0
  ) LOOP
    v_streak := v_streak + 1;
    v_check_day := v_check_day - 1;
    -- 안전장치: 1년 초과 시 중단
    IF v_streak > 365 THEN EXIT; END IF;
  END LOOP;

  RETURN v_streak;
END;
$$;

REVOKE ALL ON FUNCTION compute_streak FROM PUBLIC;
GRANT EXECUTE ON FUNCTION compute_streak TO service_role, authenticated;

-- ============================================================================
-- get_today_summary  (Home 화면 단일 호출 — J-002)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_today_summary(
  p_user_id UUID,
  p_now     TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  new_words_remaining INTEGER,
  reviews_due         INTEGER,
  streak_days         INTEGER,
  mastered_count      INTEGER,
  is_premium          BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_timezone        TEXT;
  v_today           DATE;
  v_is_premium      BOOLEAN;
  v_new_word_limit  INTEGER;
  v_used_new        INTEGER;
  v_due_count       INTEGER;
  v_mastered        INTEGER;
  v_streak          INTEGER;
BEGIN
  SELECT timezone INTO v_timezone FROM profiles WHERE user_id = p_user_id;
  IF v_timezone IS NULL THEN v_timezone := 'UTC'; END IF;
  v_today := (p_now AT TIME ZONE v_timezone - INTERVAL '4 hours')::DATE;

  -- entitlement
  SELECT EXISTS (
    SELECT 1 FROM subscription_entitlements
    WHERE user_id = p_user_id
      AND status IN ('active', 'grace_period', 'billing_retry', 'cancelled')
      AND (period_ends_at IS NULL OR period_ends_at > p_now)
  ) INTO v_is_premium;

  v_new_word_limit := CASE WHEN v_is_premium THEN 15 ELSE 3 END;

  -- daily_usage
  SELECT COALESCE(new_words_started_count, 0) INTO v_used_new
  FROM daily_usage WHERE user_id = p_user_id AND local_day = v_today;
  IF v_used_new IS NULL THEN v_used_new := 0; END IF;

  -- due reviews
  SELECT COUNT(*) INTO v_due_count
  FROM user_word_states
  WHERE user_id = p_user_id
    AND next_due_at <= p_now
    AND (mastered_at IS NULL OR weak = TRUE OR (mastered_at IS NOT NULL AND next_due_at <= p_now));

  -- mastered count
  SELECT COUNT(*) INTO v_mastered
  FROM user_word_states
  WHERE user_id = p_user_id AND mastered_at IS NOT NULL;

  -- streak
  v_streak := compute_streak(p_user_id, p_now);

  RETURN QUERY SELECT
    GREATEST(0, v_new_word_limit - v_used_new)::INTEGER,
    v_due_count::INTEGER,
    v_streak,
    v_mastered::INTEGER,
    v_is_premium;
END;
$$;

REVOKE ALL ON FUNCTION get_today_summary FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_today_summary TO service_role, authenticated;

-- ============================================================================
-- DONE
-- ============================================================================
