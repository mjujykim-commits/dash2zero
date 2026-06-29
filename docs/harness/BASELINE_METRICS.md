# Baseline Metrics — 측정 방법론 (M3 W15)

> 작성: analytics agent
> 작성일: 2026-05-11
> 사이클: M3 W15 — orchestrator 결정 "Supabase staging + synthetic seed + 1인 dogfood, real-user는 M5 이연"
> 임계값(target/floor): planner가 PRD §8에 별도 작성. 본 문서는 측정 정의만.

---

## 1. 측정 환경 (W15 결정)

| 항목 | 결정 |
|---|---|
| 1차 데이터 소스 | Supabase **staging** (analytics view 4개) |
| 보조 시뮬레이션 | `scripts/seed/synthetic-baseline.ts` (devops, 200명 14d cohort) |
| dogfood | 1인 (analytics agent 본인 device, real opt-in flow QA) |
| Firebase Analytics | DebugView 1인 dogfood 검증만, 14d 수집은 **M5 이연** |
| BigQuery export | **활성화 안 함** (DAU 기준 미달 + 비용 보호, taxonomy §10) |
| closed beta | M4 W17 이후 검토 |

이 결정의 의미: 본 baseline은 "측정 파이프라인 동작" + "지표 분포 1차 추정"을 위한 것이지, 통계적 유의가 아님. real-user 신호는 M5에서 보강.

---

## 2. 4 baseline 지표 측정 정의

### 2.1 Day-3 retention

| 항목 | 정의 |
|---|---|
| 분모 | Day 0 cohort = `learning_attempts.mode='lesson'` 첫 row의 `local_day` 단위 distinct user |
| 분자 | Day 0 + 3 (local_day 기준)에 `mode='lesson'` 또는 `(mode='review' AND correct=true)` 1회+ 발생 distinct user |
| 04:00 reset | `learning_attempts.local_day` 컬럼 (clientside computed, CC-17). 경계 케이스는 SRS-028/030/034 golden과 동일 정책 |
| 분해 | `cohort_local_day` × `entitlement_band` (free/premium) |
| view | `vw_baseline_d3_retention` |
| 14d 가중 평균 | `vw_baseline_summary.d3_retention_pct_14d` (cohort_size 기반 가중) |

**왜 D3인가** — D1은 reactivation 신호이고, D7은 표본이 너무 줄어 staging seed로 신호 추출 어려움. D3는 "3일 학습 루프"가 형성되는지 시각화에 가장 informative한 지점.

**제외 케이스**: guest user (auth 미연동)는 분모에서 제외. M4 게스트 머지 분석은 별도 funnel.

---

### 2.2 Day-1 streak retention

| 항목 | 정의 |
|---|---|
| 분모 | Day 0에 `mode='lesson' AND correct=true` (lesson_completed) 발생한 distinct user |
| 분자 | 분모 사용자 중 Day 0 + 1 local_day에도 lesson_completed 발생 |
| 차이 (vs D1 retention) | retention은 lesson_started 1회+, streak는 lesson_completed 2일 연속 |
| 분해 | `cohort_local_day` × `entitlement_band` |
| view | `vw_baseline_d1_streak` |
| 14d 가중 평균 | `vw_baseline_summary.d1_streak_pct_14d` |

**streak 정의 사유** — "하루 3분 루프" KPI는 단순 reopen이 아닌 **lesson 완료 연속**으로 정의 (B-04). lesson_started만으로는 push notification 클릭 후 즉시 이탈도 retention으로 잡혀 KPI 오염.

---

### 2.3 lesson_complete_rate (cohort 분해)

| 항목 | 정의 |
|---|---|
| 분모 | (user_id, local_day)별 `mode='lesson'` 발생한 user-day 수 (lesson_started) |
| 분자 | 같은 user-day에 `mode='lesson' AND correct=true` 발생 (lesson_completed) |
| 분해 a) | `attempt_band` = `first_lesson` (사용자별 lesson_day_ordinal=1) vs `returning` |
| 분해 b) | `entitlement_band` = `free` vs `premium` (Day 단위 active entitlement 검사) |
| 분해 c) | `outcome` = `completed` / `free_limit_reached_abandon` / `other_abandon` |
| view | `vw_baseline_lesson_complete_rate` |

**`free_limit_reached_abandon` 분리 사유** — 무료 사용자가 한도(daily 3 new words / 30 reviews) 도달로 **선택지 없이** 중단된 경우와 일반 이탈을 분리. 전자는 paywall 전환 funnel의 잠재 분모, 후자는 product UX 개선 대상.

**Day 단위 entitlement 검사** — 같은 사용자가 Day 0에 free, Day 5에 premium으로 전환된 경우 각 user-day 행마다 그 시점 active entitlement 사용. `subscription_entitlements.starts_at <= day AND (expires_at IS NULL OR expires_at >= day) AND status='active'`.

---

### 2.4 paywall_view_to_purchase (designer R-28 분해)

| 단계 | 정의 |
|---|---|
| paywall_viewed | `paywall_events` row (source enum: after_lesson_3 / locked_pack / settings / signin_required) |
| paywall_signin_required | 신규 단계 — frontend가 `paywall_events.source='signin_required'` row emit (Q-DA-DOC-008 추적) |
| purchased | `subscription_entitlements.status='active'`로 7d window 내 첫 활성화 |
| 분해 | `view_day` × `source` |
| view | `vw_baseline_paywall_funnel` |

**서버 SoT 원칙** (taxonomy §2.3, §7) — 구매 판정은 RC webhook 후 `subscription_entitlements` 활성을 SoT. 클라이언트 `subscription_purchase_succeeded`는 사용 안 함 (chargeback / refund 시 oversimplified). 7d window는 비교적 빠른 결제 사이클이지만 무료 체험 transition 케이스를 cover하기 위함.

**signin_required 분해의 의의** — designer R-28 — 비로그인 게스트가 paywall에서 가입을 강요받으면 funnel이 자연 이탈. 이를 별도 단계로 측정하면 "구매 의향 있으나 가입 friction으로 이탈" 가설을 검증 가능. frontend가 emit 추가 후 즉시 자동 반영 (스키마 변경 없음).

---

## 3. 데이터 사이클

```
[1] devops: scripts/seed/synthetic-baseline.ts --users=200 --days=14 --seed=...
    → Supabase staging의 profiles / learning_attempts / paywall_events /
      subscription_entitlements 테이블에 200명 cohort 14d 분포 삽입
[2] analytics: scripts/baseline/queries.sql 적용 (CREATE OR REPLACE VIEW × 5)
[3] analytics: scripts/baseline/run.ts → baseline-report.json
    → summary 4 지표 + breakdowns (cohort/entitlement/source 분해)
[4] (M5) real-user 데이터 += 위 view들 그대로 동작
[5] (별도) PRD §8 임계값과 비교 → M3 게이트 통과/실패 판정 (planner)
```

본 사이클은 nightly CI로 자동화 가능 (W16 작업).

---

## 4. 04:00 reset 처리 정책 (CC-17, R-12 SoT)

| 컴포넌트 | 처리 방식 |
|---|---|
| client (mobile) | `_shared/srs.ts::localDay04` — `(date - 4h)`를 user timezone에 적용한 YYYY-MM-DD |
| seed (synthetic) | `attempted_at::date` (UTC 단순화, real-user는 client local_day) |
| view (SQL) | `learning_attempts.local_day` 컬럼 직접 사용 (clientside computed) |
| timezone migration | 사용자가 timezone 변경 시 `local_day`는 attempt 시점의 timezone 기준 (SRS-031/032 정책 동일) |

**view의 local_day 신뢰성 확보** — clientside computed local_day가 아니라 server에서 재계산하는 옵션도 있으나(보안), MVP는 R-12 SoT 원칙에 따라 client 계산 신뢰. server-side validation은 M4 RLS evaluator + submit-attempt 통합 test가 cover.

---

## 5. 알려진 한계 / followup

| ID | 내용 | 처리 |
|---|---|---|
| LIM-1 | synthetic seed의 분포 가설(D3=40%, complete=65% 등)은 추측치 — real-user와 차이 가능 | M5 real-user로 calibrate |
| LIM-2 | Firebase Analytics 14d 미수집 — Firebase Funnel/Audience dashboard 미사용 | M5 dogfood/closed beta로 보강 |
| LIM-3 | paywall_signin_required 단계는 frontend emit 추가 의존 | W15 frontend 협업 (analytics.ts) |
| LIM-4 | guest user retention 미측정 | M4 게스트 머지 funnel 별도 작성 |
| LIM-5 | session-level 지표(session_duration, lessons_per_session) 미포함 | baseline 4 지표 외, M4 진입 후 보강 |
| LIM-6 | view-to-purchase 7d window는 무료 체험 모델 미반영 | 무료 체험 도입 시 14d 또는 trial_started → trial_converted 별도 view 추가 |

---

## 6. PRD §8 임계값 측정 후크 (planner 별도 작성)

본 문서는 측정 방법론만 정의. 임계값(target / floor / fail) 비교 로직은 PRD §8과 별도 wrapper에서 수행. 권고 후크:

```ts
// scripts/baseline/check-thresholds.ts (W16 작업, 본 문서 범위 외)
import report from "./baseline-report.json";
import thresholds from "./thresholds.json";  // PRD §8 미러
// summary.d3_retention_pct_14d vs thresholds.d3_retention.floor 비교
```

---

## 7. 변경 이력

| 일자 | 작성 | 변경 |
|---|---|---|
| 2026-05-11 | analytics | M3 W15 초안 — 4 view 정의 + 측정 정책 + 04:00 정책 |
