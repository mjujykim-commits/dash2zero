-- ============================================================================
-- dash2zero — Baseline Metrics (M3 W15-02)
-- ============================================================================
-- BigQuery saved query: events_YYYYMMDD raw 테이블 기반 5 metric 일일 집계
-- 실행: BigQuery scheduled query (매일 KST 03:00 — local day rollover 직후)
-- 출력: `analytics_views.baseline_metrics_daily` table
-- 참조: docs/runbooks/BASELINE_METRICS.md
-- ============================================================================

WITH day_anchor AS (
  SELECT DATE_SUB(CURRENT_DATE("America/Los_Angeles"), INTERVAL 1 DAY) AS d
),

-- D1 Retention
d1 AS (
  SELECT
    (SELECT d FROM day_anchor) AS day_key,
    COUNT(DISTINCT IF(event_name = 'first_open', user_pseudo_id, NULL)) AS install_users,
    COUNT(DISTINCT
      IF(event_name = 'app_open'
         AND DATE(TIMESTAMP_MICROS(event_timestamp), "America/Los_Angeles") = (SELECT d FROM day_anchor)
         AND DATE(TIMESTAMP_MICROS(user_first_touch_timestamp), "America/Los_Angeles") = DATE_SUB((SELECT d FROM day_anchor), INTERVAL 1 DAY),
         user_pseudo_id, NULL)) AS d1_returned
  FROM `dash2zero.analytics_*.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB((SELECT d FROM day_anchor), INTERVAL 2 DAY))
                          AND FORMAT_DATE('%Y%m%d', (SELECT d FROM day_anchor))
),

-- D3 Retention
d3 AS (
  SELECT
    COUNT(DISTINCT
      IF(event_name = 'app_open'
         AND DATE(TIMESTAMP_MICROS(event_timestamp), "America/Los_Angeles") = (SELECT d FROM day_anchor)
         AND DATE(TIMESTAMP_MICROS(user_first_touch_timestamp), "America/Los_Angeles") = DATE_SUB((SELECT d FROM day_anchor), INTERVAL 3 DAY),
         user_pseudo_id, NULL)) AS d3_returned,
    COUNT(DISTINCT
      IF(event_name = 'first_open'
         AND DATE(TIMESTAMP_MICROS(event_timestamp), "America/Los_Angeles") = DATE_SUB((SELECT d FROM day_anchor), INTERVAL 3 DAY),
         user_pseudo_id, NULL)) AS d3_install_cohort
  FROM `dash2zero.analytics_*.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB((SELECT d FROM day_anchor), INTERVAL 4 DAY))
                          AND FORMAT_DATE('%Y%m%d', (SELECT d FROM day_anchor))
),

-- Lesson complete rate
lesson AS (
  SELECT
    COUNT(IF(event_name = 'lesson_started', 1, NULL)) AS lessons_started,
    COUNT(IF(event_name = 'lesson_completed', 1, NULL)) AS lessons_completed
  FROM `dash2zero.analytics_*.events_*`
  WHERE _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', (SELECT d FROM day_anchor))
),

-- Paywall conversion (24h window)
paywall AS (
  SELECT
    COUNT(DISTINCT IF(event_name = 'paywall_viewed', user_pseudo_id, NULL)) AS paywall_viewers,
    COUNT(DISTINCT IF(event_name = 'subscription_purchase_succeeded', user_pseudo_id, NULL)) AS purchasers_24h
  FROM `dash2zero.analytics_*.events_*`
  WHERE _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', (SELECT d FROM day_anchor))
),

-- SRS measurement (M3 W15-03 신규)
srs AS (
  SELECT
    COUNT(IF(event_name = 'srs_mastered_reached', 1, NULL)) AS mastered_reached_total,
    COUNT(IF(event_name = 'srs_mastered_lost',    1, NULL)) AS mastered_lost_total,
    COUNT(IF(event_name = 'srs_weak_flagged',     1, NULL)) AS weak_flagged_total
  FROM `dash2zero.analytics_*.events_*`
  WHERE _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', (SELECT d FROM day_anchor))
)

SELECT
  (SELECT d FROM day_anchor) AS day_key,
  d1.install_users,
  d1.d1_returned,
  SAFE_DIVIDE(d1.d1_returned, d1.install_users) AS d1_retention_rate,
  d3.d3_returned,
  d3.d3_install_cohort,
  SAFE_DIVIDE(d3.d3_returned, d3.d3_install_cohort) AS d3_retention_rate,
  lesson.lessons_started,
  lesson.lessons_completed,
  SAFE_DIVIDE(lesson.lessons_completed, lesson.lessons_started) AS lesson_complete_rate,
  paywall.paywall_viewers,
  paywall.purchasers_24h,
  SAFE_DIVIDE(paywall.purchasers_24h, paywall.paywall_viewers) AS paywall_conv_rate,
  srs.mastered_reached_total,
  srs.mastered_lost_total,
  srs.weak_flagged_total,
  CURRENT_TIMESTAMP() AS computed_at
FROM d1, d3, lesson, paywall, srs
