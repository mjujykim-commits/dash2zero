# Baseline Metrics Runbook (M3 W15-02)

> 목적: M3 종료 전 14일 baseline 데이터 수집 → M4/M5 alpha 출시 후 회귀 감지 기준선 확보.
> 책임: analytics (수집) + devops (Firebase/BigQuery 셋업) + product (해석)
> 시작 시점: 2026-05-11 — 종료: 2026-05-25 (W16 게이트 검증 직전)

---

## 1. 5 metrics 정의

| Metric | 정의 | 측정 이벤트 | 집계 주기 |
|---|---|---|---|
| **D1 retention** | install N일 후 다음날 `app_open` emit한 user 비율 | app_open + first_open audience | 매일 |
| **D3 retention** | 3일 후 `app_open` emit한 user 비율 | 동일 | 매일 |
| **Streak 유지율** | streak ≥ 7 도달 user 중 streak break 없는 비율 (CC-17 local 04:00 기준) | `lesson_completed` daily 집계 + streak compute_streak() RPC | 매일 |
| **lesson_complete_rate** | `lesson_started` 대비 `lesson_completed` 비율 (3분 단일 lesson) | 두 이벤트 ratio | 매일 |
| **paywall_view_to_purchase** | `paywall_viewed` 대비 `subscription_purchase_succeeded` 24h 내 변환률 | 24h funnel attribution | 매일 |

추가 보조 지표 (W15 baseline에 포함, alert 임계는 W16 결정):
- `srs_mastered_reached` 누적
- `srs_weak_flagged` 누적
- `srs_mastered_lost` 누적 — 회귀 신호 (정책 변경 시 spike)
- crashlytics crash-free user %

---

## 2. Firebase Analytics 구성

### 2.1 Audience 정의 (Firebase Console)
1. `audience_d1_retained` — 어제 first_open + 오늘 app_open
2. `audience_d3_retained` — 3일 전 first_open + 오늘 app_open
3. `audience_streak_7plus` — userProperty `streak_days` >= 7

### 2.2 BigQuery export 활성화
1. Firebase Console → Project Settings → Integrations → BigQuery → Enable
2. Streaming export ON (분 단위)
3. Dataset 권한: data-team@dash2zero 읽기 전용

### 2.3 BigQuery saved query
`infra/bigquery/baseline_metrics.sql` — 5 metric 일일 집계 → dashboard view (M3 W16).

---

## 3. Mobile 측 metrics_baseline_day emit

매일 첫 app_open 시점 (local 04:00 기준 cycle 시작) `metrics_baseline_day` 이벤트 1회 발화.
attrs:
- `day_key`: localDay04 (YYYY-MM-DD)
- `cohort_install_week`: install_at의 주 (YYYY-WW)
- `streak_days`: current streak
- `entitlement_status`: free | active | grace_period | ...

본 이벤트는 BigQuery에서 daily aggregate 기준점.

---

## 4. 수집 일정 & 회수 게이트

| 시점 | 작업 |
|---|---|
| 2026-05-11 | metrics_baseline_day emit 코드 머지 + Firebase audience 3개 활성 |
| 2026-05-12 ~ 25 | 14일 데이터 누적. Day-7, Day-10에 중간 dashboard 점검 (anomaly 조기 발견) |
| 2026-05-25 (M3 W16) | 14일 baseline 회수 → docs/metrics/BASELINE_M3.md 작성 (D1/D3/streak/lesson_complete/paywall_conv 평균 + std) |
| M4 / M5 | 동일 metric을 weekly로 모니터, 임계값 -20% 초과 시 release 차단 게이트 발동 |

---

## 5. 데이터 보관 / 삭제 정책

- Firebase Analytics 기본 14개월 보관 (M5 출시 후 12개월로 조정 검토 — CC2-11 / privacy 정책 연계)
- BigQuery export raw: 90일 후 cold storage 이동 (DSR delete 시 user_pseudo_id 기준 30일 SLA — CC-11 정합)
- soft-delete 사용자 데이터는 sha256 hashed user_id로 익명화 후 baseline 분모에 유지 (D1/D3 분모 안정성)
