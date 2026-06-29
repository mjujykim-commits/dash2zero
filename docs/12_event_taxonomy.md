# 이벤트 택소노미

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-18 | age gate -> privacy choices -> onboarding, 분석/진단 기본 disabled |
| CC2-22 | §3 핵심 이벤트 표를 SSOT로 하고 결제 퍼널 이벤트명 통일 |
| CC2-23 | MVP BigQuery export 기본 비활성화, DAU 1,000 이상 또는 분석 질문 명확화 후 검토 |
| CC2-24 | GA4/Firebase 예약 이벤트명 충돌 회피, subscription_ prefix 사용 |
| B-07 | 광고 추적/개인정보 판매/공유 없음 |

## 1. 원칙

- 도구: Firebase Analytics + Crashlytics.
- 기본값: 첫 실행 시 Analytics와 Crashlytics 모두 disabled.
- 활성화 조건: age gate 통과 후 privacy choices에서 사용자가 opt-in.
- 이벤트명: snake_case, 제품 도메인 중심, GA4 예약/자동 이벤트명 재정의 금지.
- 결제 상태 변경의 신뢰 원천은 RevenueCat webhook과 subscription_entitlements다.
- MVP 핵심 이벤트는 25개 이하로 유지한다.
- 광고 ID, IDFA, cross-context behavioral advertising, 개인정보 판매/공유는 사용하지 않는다.

## 2. 동의 및 사용자 식별

### 2.1 첫 실행 순서

1. age gate
2. privacy choices
3. onboarding
4. home

### 2.2 수집 상태

| 상태 | Analytics | Crashlytics | 비고 |
|---|---|---|---|
| age gate 전 | off | off | 원격 분석 없음 |
| 13세 미만 | off | off | 학습/계정/결제 차단 |
| 13~17세 opt-out | off | off | high privacy default |
| 13~17세 opt-in | on | opt-in 기준 | 마케팅 push 금지 |
| 18세 이상 opt-out | off | off | 필수 서버 상태만 처리 |
| 18세 이상 opt-in | on | opt-in 기준 | 기본 분석 가능 |

### 2.3 식별자

| 상태 | 식별자 | 원칙 |
|---|---|---|
| 게스트 opt-out | local device_install_id | 원격 전송 금지 |
| 게스트 opt-in | device_install_id 기반 익명 ID | 개인정보와 결합 금지 |
| 가입 후 opt-in | Supabase user_id hash 또는 Firebase app instance id | 이메일 전송 금지 |
| 결제 이벤트 | RevenueCat/Supabase 서버 상태 | 클라이언트 구매 이벤트는 참고용 |

게스트가 가입하면 analytics alias/identify는 opt-in 사용자에게만 수행한다. opt-out 사용자는 서버 학습 데이터는 병합하지만 Firebase 식별 연결은 수행하지 않는다.

## 3. 핵심 이벤트 SSOT

| 이벤트 | 트리거 | 주요 속성 | 수집 조건 |
|---|---|---|---|
| app_opened | 앱 foreground | app_version, build_number, platform | opt-in |
| age_gate_completed | age gate 완료 | age_band | 로컬 저장 우선, 원격은 opt-in 후 가능 |
| privacy_choices_saved | privacy 선택 저장 | analytics_opt_in, diagnostics_opt_in, consent_version | 로컬 저장 우선 |
| onboarding_completed | 온보딩 완료 | level, interests_count | opt-in |
| lesson_started | 신규 학습 시작 | mode, local_day, source | opt-in |
| word_viewed | 단어 단계 노출 | word_id, pack_id, step | opt-in |
| audio_played | 오디오 재생 성공 | word_id, kind, cached | opt-in |
| audio_failed | 오디오 재생 실패 | word_id, kind, error_code | opt-in + diagnostics |
| word_answered | Retrieve 답변 | word_id, is_correct, stage_before, stage_after | opt-in |
| word_mastered | stage 5 최초 도달 (deprecated alias of srs_mastered_reached, M3 W16에 제거 예정) | word_id, attempts_count | opt-in |
| word_weakened | weak=true 전환 (deprecated alias of srs_weak_flagged, M3 W16에 제거 예정) | word_id, stage_before | opt-in |
| srs_mastered_reached | stage 5 도달 (최초 + 재진입 모두) | §3.1 표준 properties | opt-in |
| srs_mastered_lost | stage 5에서 stage <5 강하 (mastered_at 해제) | §3.1 표준 properties | opt-in |
| srs_weak_flagged | weak=false → weak=true 전환 | §3.1 표준 properties | opt-in |
| lesson_completed | 신규 lesson 완료 | duration_sec, words_count, local_day | opt-in |
| lesson_abandoned | lesson 중단 | duration_sec, step | opt-in |
| review_started | 복습 시작 | due_count, local_day | opt-in |
| review_completed | 복습 완료 | reviewed_count, correct_count, duration_sec | opt-in |
| limit_reached | 무료 한도 도달 | limit_type, count, source | opt-in |
| premium_gate_viewed | 잠긴 기능 진입 | source, pack_id | opt-in |
| paywall_viewed | paywall 노출 | source, entitlement_status | opt-in |
| plan_selected | 구독 상품 선택 | product_id, billing_period | opt-in |
| checkout_started | 스토어 checkout 시작 | product_id, store | opt-in |
| checkout_cancelled | 사용자가 checkout 취소 | product_id, store | opt-in |
| subscription_purchase_succeeded | 구매 성공 | product_id, store, period | opt-in, 서버 검증 후 |
| subscription_purchase_failed | 구매 실패 | product_id, store, error_code | opt-in |
| subscription_restore_started | Restore 시작 | source | opt-in |
| subscription_restore_succeeded | Restore 성공 | entitlement_id, store | opt-in, 서버 검증 후 |
| subscription_restore_failed | Restore 실패 | error_code, store | opt-in |
| subscription_status_changed | 서버 entitlement 상태 변경 | status_before, status_after, store | 서버 집계용 |
| account_delete_requested | 계정 삭제 요청 | user_status | opt-in |
| content_report_submitted | 콘텐츠 신고 | target_type, report_type | opt-in |

### 3.1 srs_mastered_reached / srs_mastered_lost / srs_weak_flagged 표준 properties (W15 — analytics + frontend 협업)

3 이벤트 모두 동일한 12개 property 슈퍼셋을 공유한다 (frontend `apps/mobile/src/lib/analytics.ts` emit 시 동일 헬퍼 사용 권고).

| key | type | cardinality | required | source | 비고 |
|---|---|---|---|---|---|
| word_id | string | high (수만) | yes | client | dashboard 분해는 pack_id 사용, word_id는 product analytics용 |
| pack_id | string enum | low (수십) | yes | client | dashboard primary dimension |
| triggered_by | enum | very low (3) | yes | client | `lesson` \| `review` \| `merge` (guest_merge로 이벤트 재발화 시) |
| local_day | string YYYY-MM-DD | low (1/일) | yes | client | 04:00 reset 기준, dashboard daily cohort 키 |
| stage_before | int 1-5 | very low (5) | yes | client | transition 직전 stage |
| stage_after | int 1-5 | very low (5) | yes | client | transition 직후 stage |
| weak_before | bool | very low (2) | yes | client | transition 직전 weak |
| weak_after | bool | very low (2) | yes | client | transition 직후 weak |
| same_cycle | bool | very low (2) | yes | client | `isSameDueCycle(state.last_attempt_at, attempt.occurred_at, tz)` 결과 |
| attempts_count | int | medium | yes | client | 누적 (correct_count + incorrect_count) — 전이 적용 후 값 |
| days_since_first_seen | int | medium | yes | client | 첫 attempt(또는 word_introduced)부터 transition까지 local_day diff |
| reason | enum | very low (5) | conditional | client | 아래 §3.2 — srs_weak_flagged / srs_mastered_lost에 필수, srs_mastered_reached에는 미발화 |

### 3.2 reason enum (srs_weak_flagged / srs_mastered_lost 한정)

| reason | 발생 조건 | 적용 이벤트 |
|---|---|---|
| `same_cycle_double_wrong` | sameCycle && state.last_attempt_correct === false (CC3-05) | srs_weak_flagged, srs_mastered_lost |
| `single_wrong_cross_cycle` | state.stage === 5 && !sameCycle && attempt.correct === false (Mastered 보호 강하) | srs_mastered_lost |
| `mastered_double_wrong` | state.stage === 5 && sameCycle && state.last_attempt_correct === false (보호 무효화) | srs_weak_flagged |
| `manual_reset` | 사용자가 단어 reset 액션 사용 (Phase 2) | srs_weak_flagged, srs_mastered_lost |
| `other` | 위 어디에도 해당하지 않음 (방어용) | srs_weak_flagged, srs_mastered_lost |

### 3.3 emit 위치와 멱등성 (R-12 SoT)

- emit는 `_shared/srs.ts` 호출 측 (mobile lesson thunk + Edge Function `submit-attempt` 응답 핸들러)에서 transition diff 기반:
  - `prev.stage < 5 && next.stage === 5` → `srs_mastered_reached`
  - `prev.stage === 5 && next.stage < 5` → `srs_mastered_lost`
  - `prev.weak === false && next.weak === true` → `srs_weak_flagged`
- 서버 측 미발화 (서버 집계는 `user_word_states` 테이블 직조회로 충분, Firebase 중복 발화 회피).
- 멱등성: 같은 (word_id, attempt.occurred_at, transition_kind) 조합은 1회만 emit. retry/replay 시 client-side dedupe key 사용.
- 검증: `fixtures/golden/srs/SRS-023.yaml` (mastered_reached + weak clear), SRS-025 (mastered_lost cross-cycle), SRS-041 (weak_flagged same-cycle), SRS-053 (mastered_reached 재진입). frontend vitest에서 logEvent spy로 properties shape 단언.

### 3.4 deprecated word_mastered / word_weakened 마이그레이션

- v0.3에서는 신규 srs_* 와 기존 word_* 둘 다 발화 (분석 dashboard cutover 기간 보호).
- M3 W16에 word_mastered / word_weakened emit 제거. dashboard funnel/audience 모두 srs_* 로 전환.
- BigQuery export 활성화 시(§10) 두 이벤트 모두 보존되므로 cutover 시점 rollup 가능.

## 4. 금지 이벤트명과 네이밍 룰

### 4.1 금지/회피 이름

다음 GA4/Firebase 자동/예약/권장 이름은 커스텀 이벤트명으로 사용하지 않는다.

| 이름 | 대체 |
|---|---|
| session_start | app_opened 또는 lesson_started |
| first_open | Firebase 자동 수집에 맡김 |
| app_update | Firebase 자동 수집에 맡김 |
| purchase | subscription_purchase_succeeded |
| in_app_purchase | subscription_purchase_succeeded |
| refund | subscription_status_changed with status_after=refunded |
| login | sign_in_succeeded가 필요하면 Phase 2에서 추가 |

### 4.2 구독 이벤트 prefix

- 구독/결제 이벤트는 subscription_ 또는 checkout_ prefix를 사용한다.
- paywall UI 이벤트는 paywall_ prefix를 사용한다.
- RevenueCat webhook 상태 변경은 서버 이벤트로만 최종 판단한다.

## 5. KPI 정의

| KPI | 정의 | 기준일 |
|---|---|---|
| First lesson completion | onboarding_completed 사용자 중 24시간 내 lesson_completed 발생 비율 | 사용자 local_day |
| D1 retention | Day 0 lesson_started 사용자 중 다음 local_day에 lesson_started 또는 review_completed 발생 | 04:00 reset |
| D7 retention | Day 0 lesson_started 사용자 중 Day 7까지 1회 이상 재방문 | 04:00 reset |
| Lesson completion rate | lesson_started 대비 lesson_completed 비율 | local_day |
| Review completion rate | review_started 대비 review_completed 비율 | local_day |
| Word accuracy | word_answered 중 is_correct=true 비율 | event time |
| Free to paid | free 사용자 중 subscription_purchase_succeeded 발생 비율 | 서버 entitlement 기준 |
| Crash-free users | Crashlytics 기준 crash-free users | opt-in diagnostics 기준 |

## 6. 학습 품질 지표

| 지표 | 정의 |
|---|---|
| learned_words | stage 1 이상 단어 수 |
| mastered_words | stage 5 도달 단어 수 |
| weak_words | weak=true 단어 수 |
| due_reviews | next_review_at <= now 단어 수 |
| overdue_reviews | next_review_at이 7일 이상 지난 단어 수 |
| average_stage | active learned word의 평균 stage |

Mastered는 stage 5 도달로 정의한다. v0.1의 정답률 80% + 최소 4회 정답 조건은 MVP 지표 정의에서 제거하고, 분석용 보조 속성으로만 유지한다.

## 7. 결제 퍼널

결제 퍼널의 공식 순서는 아래다.

1. paywall_viewed
2. plan_selected
3. checkout_started
4. checkout_cancelled 또는 subscription_purchase_succeeded 또는 subscription_purchase_failed
5. subscription_status_changed
6. subscription_restore_started
7. subscription_restore_succeeded 또는 subscription_restore_failed

서버 webhook 이벤트와 클라이언트 이벤트가 충돌하면 서버 subscription_entitlements 상태를 우선한다.

## 8. 사용자 속성

| 속성 | 값 | 사용 조건 |
|---|---|---|
| user_status | guest/free/premium/pending_delete | opt-in |
| age_band | 13_17/18_plus | opt-in, under_13 원격 전송 금지 |
| locale | en-US | opt-in |
| platform | ios/android | opt-in |
| subscription_status | free/active/grace_period/billing_retry/expired | opt-in |
| learning_level | A0/A1/A1_plus | opt-in |

이메일, 원문 문의 내용, 결제 영수증, precise birthdate는 analytics 속성에 넣지 않는다.

## 9. 카디널리티와 파라미터 제한

- word_id는 product analytics에서 필요하므로 원본 이벤트에는 포함 가능하다.
- dashboard 기본 분석은 pack_id, category, level 중심으로 본다.
- error_message는 원문 저장을 피하고 error_code enum만 보낸다.
- source는 enum으로 제한한다: home, lesson, review, settings, paywall, locked_pack, limit_reached, restore.
- product_id는 스토어 상품 ID 그대로 허용한다.

## 10. BigQuery/Firebase 비용 정책

MVP에서는 BigQuery export를 기본 비활성화한다.

활성화 조건:

- DAU 1,000 이상, 또는
- Firebase 기본 대시보드로 답할 수 없는 명확한 분석 질문 존재, 또는
- 결제/리텐션 분석을 SQL 수준으로 검증해야 하는 시점

활성화 전 필수 작업:

- 월 비용 상한 가설 작성
- Google Cloud billing alert 설정
- 이벤트 보존/샘플링 정책 결정
- 개인정보 처리방침의 분석 처리 범위 재확인

## 11. QA 기준

- opt-out 상태에서 Firebase DebugView에 제품 이벤트가 찍히지 않는다.
- opt-in 후 app_opened, onboarding_completed, lesson_completed가 수집된다.
- 구매 성공 이벤트는 서버 entitlement 활성화 후에만 subscription_purchase_succeeded로 본다.
- GA4 예약/자동 이벤트명과 custom event name이 충돌하지 않는다.
- under-13 차단 사용자는 원격 분석 이벤트가 없다.
