-- =============================================================================
-- dash2zero — Baseline Metrics SQL Views (M3 W15)
--
-- 목적
--   Supabase staging에서 4 baseline 지표를 SQL view로 산출하여 Firebase
--   Analytics 부재(또는 BigQuery export 비활성화 상태)에서도 측정 가능하게 함.
--
-- 4 지표 (PRD §8 / readiness §2.2)
--   1. Day-3 retention                   — vw_baseline_d3_retention
--   2. Day-1 streak retention            — vw_baseline_d1_streak
--   3. lesson_complete_rate (cohort)     — vw_baseline_lesson_complete_rate
--   4. paywall_view_to_purchase (분해)   — vw_baseline_paywall_funnel
--
-- 데이터 소스 (synthetic-baseline.ts seed 호환)
--   - profiles                  (가입 = signup_at, srs_started_at)
--   - learning_attempts         {user_id, word_id, attempted_at, correct, mode, local_day}
--   - paywall_events            {user_id, viewed_at, source, entitlement_status}  (옵셔널)
--   - subscription_entitlements {user_id, status, starts_at, expires_at}
--
-- 04:00 reset 정책 (CC-17)
--   local_day는 attempted_at - INTERVAL '4 hours'를 user timezone에 적용한 YYYY-MM-DD.
--   seed가 이미 local_day 컬럼을 채워두므로 view에서는 local_day 직접 사용.
--   user.timezone이 UTC가 아닌 경우 attempted_at::timestamptz AT TIME ZONE p.timezone
--   - INTERVAL '4 hours' 를 토대로 재계산하는 보조 expression 포함.
--
-- 멱등성 / 재실행
--   모든 view는 CREATE OR REPLACE. 테이블 스키마가 진화하면 본 파일을 단일 SoT로 업데이트.
--
-- 비고
--   - paywall_signin_required 단계 분해는 designer R-28 권고 — frontend가 신규
--     이벤트 emit 후 paywall_events.source = 'signin_required' row가 누적되면
--     vw_baseline_paywall_funnel 자동 반영 (별도 스키마 변경 불필요).
--   - paywall_events 테이블이 미존재(devops seed soft-skip)인 경우 view는
--     LEFT JOIN으로 NULL 분모 처리 (ZERO 분포 표시).
--
-- 책임 agent: analytics
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. 보조 view — cohort 정의 (Day 0 = lesson_started 첫 발생 local_day)
-- -----------------------------------------------------------------------------
-- 코호트 키: user_id + cohort_local_day (첫 lesson_started의 local_day).
-- "lesson_started" = learning_attempts.mode='lesson' 의 첫 row.
-- (가설: synthetic seed가 mode='lesson'으로 lesson_start kind를 푸시함)

CREATE OR REPLACE VIEW vw_baseline_user_cohort AS
SELECT
  la.user_id,
  MIN(la.local_day)::date AS cohort_local_day,
  MIN(la.attempted_at)    AS first_lesson_at,
  p.timezone              AS user_timezone,
  -- 무료/프리미엄 분해 키 (Day 0 시점의 entitlement)
  CASE
    WHEN se.user_id IS NOT NULL AND se.status = 'active' THEN 'premium'
    ELSE 'free'
  END AS entitlement_band
FROM learning_attempts la
JOIN profiles p ON p.user_id = la.user_id
LEFT JOIN LATERAL (
  SELECT user_id, status
  FROM subscription_entitlements x
  WHERE x.user_id = la.user_id
    AND x.starts_at <= la.attempted_at
    AND (x.expires_at IS NULL OR x.expires_at > la.attempted_at)
  ORDER BY x.starts_at DESC
  LIMIT 1
) se ON true
WHERE la.mode = 'lesson'
GROUP BY la.user_id, p.timezone, se.user_id, se.status;

COMMENT ON VIEW vw_baseline_user_cohort IS
  'Day 0 cohort: 사용자별 첫 lesson_started의 local_day 및 시점 entitlement (free|premium).';

-- -----------------------------------------------------------------------------
-- 1. Day-3 retention
--    정의: Day 0 cohort 중 Day 0 + 3 (local_day 기준)에 lesson_started 또는
--          review_completed (mode='review' && correct=true) 1회+ 발생 비율.
--    해상도: cohort_local_day별 일일 retention (14d 윈도 자동 슬라이딩).
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW vw_baseline_d3_retention AS
WITH cohort AS (
  SELECT user_id, cohort_local_day, entitlement_band
  FROM vw_baseline_user_cohort
),
day3_activity AS (
  SELECT DISTINCT
    c.user_id,
    c.cohort_local_day,
    c.entitlement_band
  FROM cohort c
  JOIN learning_attempts la ON la.user_id = c.user_id
  WHERE la.local_day::date = (c.cohort_local_day + INTERVAL '3 days')::date
    AND (la.mode = 'lesson' OR (la.mode = 'review' AND la.correct = true))
)
SELECT
  c.cohort_local_day,
  c.entitlement_band,
  COUNT(DISTINCT c.user_id)                      AS cohort_size,
  COUNT(DISTINCT d3.user_id)                     AS retained_d3,
  ROUND(
    COUNT(DISTINCT d3.user_id)::numeric
    / NULLIF(COUNT(DISTINCT c.user_id), 0) * 100,
    2
  )                                              AS d3_retention_pct
FROM cohort c
LEFT JOIN day3_activity d3
  ON d3.user_id = c.user_id
 AND d3.cohort_local_day = c.cohort_local_day
GROUP BY c.cohort_local_day, c.entitlement_band
ORDER BY c.cohort_local_day DESC, c.entitlement_band;

COMMENT ON VIEW vw_baseline_d3_retention IS
  'Day-3 retention by cohort_local_day x entitlement_band. retention 정의: lesson 또는 review 정답 1회+.';

-- -----------------------------------------------------------------------------
-- 2. Day-1 streak retention
--    정의: Day 0에 lesson_completed (mode='lesson' && correct=true) 한 사용자 중
--          Day 0 + 1 local_day에도 lesson_completed 한 비율.
--    streak는 lesson_completed의 연속 — lesson_started만으로는 streak 미인정.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW vw_baseline_d1_streak AS
WITH d0_completers AS (
  SELECT
    c.user_id,
    c.cohort_local_day,
    c.entitlement_band
  FROM vw_baseline_user_cohort c
  WHERE EXISTS (
    SELECT 1 FROM learning_attempts la
    WHERE la.user_id = c.user_id
      AND la.local_day::date = c.cohort_local_day
      AND la.mode = 'lesson'
      AND la.correct = true
  )
),
d1_completers AS (
  SELECT DISTINCT d0.user_id, d0.cohort_local_day, d0.entitlement_band
  FROM d0_completers d0
  JOIN learning_attempts la ON la.user_id = d0.user_id
  WHERE la.local_day::date = (d0.cohort_local_day + INTERVAL '1 day')::date
    AND la.mode = 'lesson'
    AND la.correct = true
)
SELECT
  d0.cohort_local_day,
  d0.entitlement_band,
  COUNT(DISTINCT d0.user_id)                     AS d0_completers,
  COUNT(DISTINCT d1.user_id)                     AS d1_streak_holders,
  ROUND(
    COUNT(DISTINCT d1.user_id)::numeric
    / NULLIF(COUNT(DISTINCT d0.user_id), 0) * 100,
    2
  )                                              AS d1_streak_pct
FROM d0_completers d0
LEFT JOIN d1_completers d1
  ON d1.user_id = d0.user_id
 AND d1.cohort_local_day = d0.cohort_local_day
GROUP BY d0.cohort_local_day, d0.entitlement_band
ORDER BY d0.cohort_local_day DESC, d0.entitlement_band;

COMMENT ON VIEW vw_baseline_d1_streak IS
  'Day-1 streak retention: D0 lesson_completed 사용자 중 D1에도 lesson_completed.';

-- -----------------------------------------------------------------------------
-- 3. lesson_complete_rate (cohort 분해)
--    정의: lesson_started 사용자 중 같은 local_day에 lesson_completed 한 비율.
--    분해 차원:
--      a) attempt_band   = 'first_lesson' | 'returning' (사용자별 lesson 회차)
--      b) entitlement    = 'free' | 'premium'
--      c) abandon_reason = 'free_limit_reached' | 'other_or_unknown'
--                          (free 사용자 중 daily_usage가 한도 도달 후 lesson 중단)
--    free_limit_reached 탐지: daily_usage 테이블의 new_words_started_count >= 3
--    또는 reviews_completed_count >= 30 (free) 도달 시.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW vw_baseline_lesson_complete_rate AS
WITH lesson_attempts_per_day AS (
  -- user x local_day 단위로 lesson started/completed 집계
  SELECT
    la.user_id,
    la.local_day::date AS day,
    BOOL_OR(la.mode = 'lesson')                                  AS started,
    BOOL_OR(la.mode = 'lesson' AND la.correct = true)            AS completed,
    -- "회차" 추정: 가입 후 N번째 lesson day
    DENSE_RANK() OVER (
      PARTITION BY la.user_id
      ORDER BY la.local_day::date
    )                                                            AS lesson_day_ordinal
  FROM learning_attempts la
  WHERE la.mode = 'lesson'
  GROUP BY la.user_id, la.local_day::date
),
day_with_meta AS (
  SELECT
    lapd.user_id,
    lapd.day,
    lapd.started,
    lapd.completed,
    CASE WHEN lapd.lesson_day_ordinal = 1 THEN 'first_lesson' ELSE 'returning' END
      AS attempt_band,
    -- entitlement at day
    CASE
      WHEN EXISTS (
        SELECT 1 FROM subscription_entitlements se
        WHERE se.user_id = lapd.user_id
          AND se.status = 'active'
          AND se.starts_at::date <= lapd.day
          AND (se.expires_at IS NULL OR se.expires_at::date >= lapd.day)
      ) THEN 'premium'
      ELSE 'free'
    END AS entitlement_band,
    -- free 한도 도달 여부 (daily_usage 테이블이 있으면 사용, 없으면 NULL)
    -- 가설 컬럼: daily_usage(user_id, local_day, new_words_started_count, reviews_completed_count)
    COALESCE(
      (
        SELECT (du.new_words_started_count >= 3 OR du.reviews_completed_count >= 30)
        FROM daily_usage du
        WHERE du.user_id = lapd.user_id
          AND du.local_day::date = lapd.day
        LIMIT 1
      ),
      false
    ) AS free_limit_reached
  FROM lesson_attempts_per_day lapd
)
SELECT
  attempt_band,
  entitlement_band,
  CASE
    WHEN entitlement_band = 'free' AND free_limit_reached AND NOT completed
      THEN 'free_limit_reached_abandon'
    WHEN NOT completed THEN 'other_abandon'
    ELSE 'completed'
  END AS outcome,
  COUNT(*) FILTER (WHERE started)                                AS started_user_days,
  COUNT(*) FILTER (WHERE completed)                              AS completed_user_days,
  ROUND(
    COUNT(*) FILTER (WHERE completed)::numeric
    / NULLIF(COUNT(*) FILTER (WHERE started), 0) * 100,
    2
  )                                                              AS completion_rate_pct
FROM day_with_meta
GROUP BY attempt_band, entitlement_band, outcome
ORDER BY attempt_band, entitlement_band, outcome;

COMMENT ON VIEW vw_baseline_lesson_complete_rate IS
  'Lesson completion rate by attempt_band(first/returning) x entitlement(free/premium) x outcome(completed/free_limit_abandon/other_abandon).';

-- -----------------------------------------------------------------------------
-- 4. paywall_view_to_purchase (designer R-28 분해)
--    funnel 단계:
--      paywall_viewed
--        -> paywall_signin_required (frontend가 emit 추가 — paywall_events.source='signin_required')
--        -> paywall_signed_in
--        -> checkout_started
--        -> subscription_purchase_succeeded (서버 entitlement 활성)
--    분해 차원: source (after_lesson_3 / locked_pack / settings / signin_required)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW vw_baseline_paywall_funnel AS
WITH viewed AS (
  SELECT
    user_id,
    DATE_TRUNC('day', viewed_at)::date AS view_day,
    source,
    viewed_at,
    -- signin_required 분해는 source = 'signin_required'로 별도 row 누적 (frontend emit)
    (source = 'signin_required')       AS is_signin_required_step
  FROM paywall_events
),
purchased AS (
  -- 서버 검증된 구매 (subscription_entitlements.status='active', 첫 활성화)
  SELECT
    user_id,
    MIN(starts_at) AS first_active_at
  FROM subscription_entitlements
  WHERE status = 'active'
  GROUP BY user_id
),
viewed_to_purchase AS (
  SELECT
    v.user_id,
    v.view_day,
    v.source,
    v.is_signin_required_step,
    p.first_active_at,
    -- 7d window (readiness §2.2)
    (p.first_active_at IS NOT NULL
     AND p.first_active_at >= v.viewed_at
     AND p.first_active_at <  v.viewed_at + INTERVAL '7 days') AS purchased_within_7d
  FROM viewed v
  LEFT JOIN purchased p ON p.user_id = v.user_id
)
SELECT
  view_day,
  source,
  COUNT(*)                                                       AS paywall_views,
  COUNT(*) FILTER (WHERE is_signin_required_step)                AS signin_required_views,
  COUNT(*) FILTER (WHERE purchased_within_7d)                    AS purchased_within_7d,
  ROUND(
    COUNT(*) FILTER (WHERE purchased_within_7d)::numeric
    / NULLIF(COUNT(*), 0) * 100,
    2
  )                                                              AS view_to_purchase_pct
FROM viewed_to_purchase
GROUP BY view_day, source
ORDER BY view_day DESC, source;

COMMENT ON VIEW vw_baseline_paywall_funnel IS
  'Paywall funnel: paywall_viewed (분해 source 포함 signin_required 중간 단계) -> 7d 구매 전환율. 서버 entitlement.status=active 기준.';

-- =============================================================================
-- 5. 통합 dashboard view — 4 지표 1행 요약 (run.ts JSON 출력용)
-- =============================================================================

CREATE OR REPLACE VIEW vw_baseline_summary AS
SELECT
  -- 14d 가중 평균 (cohort_size 기반)
  (
    SELECT ROUND(SUM(retained_d3)::numeric / NULLIF(SUM(cohort_size), 0) * 100, 2)
    FROM vw_baseline_d3_retention
    WHERE cohort_local_day >= CURRENT_DATE - INTERVAL '14 days'
  ) AS d3_retention_pct_14d,
  (
    SELECT ROUND(SUM(d1_streak_holders)::numeric / NULLIF(SUM(d0_completers), 0) * 100, 2)
    FROM vw_baseline_d1_streak
    WHERE cohort_local_day >= CURRENT_DATE - INTERVAL '14 days'
  ) AS d1_streak_pct_14d,
  (
    SELECT ROUND(SUM(completed_user_days)::numeric / NULLIF(SUM(started_user_days), 0) * 100, 2)
    FROM vw_baseline_lesson_complete_rate
  ) AS lesson_complete_rate_pct_14d,
  (
    SELECT ROUND(SUM(purchased_within_7d)::numeric / NULLIF(SUM(paywall_views), 0) * 100, 2)
    FROM vw_baseline_paywall_funnel
    WHERE view_day >= CURRENT_DATE - INTERVAL '14 days'
  ) AS paywall_view_to_purchase_pct_14d,
  CURRENT_TIMESTAMP AS computed_at;

COMMENT ON VIEW vw_baseline_summary IS
  'M3 W15 baseline 4 지표 14d 가중 평균. PRD §8 임계값과 비교 (planner 별도 작성).';
