# M3 W15 Analytics Readiness — 자가 진단

> 작성: analytics agent
> 작성일: 2026-05-11 22:00 KST
> 컨텍스트: M3 W14 종료 (rollup `context/rollups/20260511-M3-W14-evaluators-and-ci.md`)
> 사이클: M3 W15 진입 직전
> 상태: 차단 항목 1건 (수집 환경 미확정), 그 외 즉시 시작 가능

---

## 1. W15 analytics readiness 12항목 자가 진단

| # | 항목 | 상태 | 메모 |
|---:|---|---|---|
| 1 | `docs/12_event_taxonomy.md` SSOT 35 이벤트 freeze | OK | v0.3, lesson_started/word_answered/lesson_completed/paywall_viewed 등 baseline 4지표 도출에 필요한 이벤트 모두 포함 |
| 2 | `apps/mobile/src/lib/analytics.ts` logEvent 동작 | OK | applyConsent + setAnalyticsCollectionEnabled 정상, ESSENTIAL_EVENTS 분리 |
| 3 | Firebase project + DebugView | **확인 필요** | dogfood / closed beta용 별도 project (예: `dash2zero-dogfood`)인지, prod와 분리되었는지 devops에 확인 |
| 4 | opt-in flow (age gate -> privacy choices) | OK (가정) | privacy-choices.tsx 존재 가정, frontend agent에 final QA 요청 |
| 5 | 4 evaluator (SRS/Payment/Privacy/Content) CI 강제 | OK | `eval-on-pr.yml` strict 4 job |
| 6 | `fixtures/golden/srs/` 카운트 | **drift 있음** | 실제 파일 29개, README는 22로 표기. W15 1차에서 README 동기화 + 21건 추가 작성 |
| 7 | RLS evaluator | NOT YET (W15 작업) | security+backend 책임, analytics는 dispatch 라우팅 1줄만 추가 |
| 8 | Mastered/Weak event emit (Q-DA-DOC-007) | NOT YET | §4 스키마 초안 — frontend 협업 필요 |
| 9 | baseline metrics 14d 수집 환경 결정 | **차단** | §2.1 결정 필요 (internal vs dogfood vs closed beta) |
| 10 | 4 baseline 지표 측정 방법 | 초안 OK | §2.2 — Firebase Funnel + Supabase 보조 집계 |
| 11 | A/B 인프라 (Statsig/GrowthBook) | 없음 | M3 범위 외, baseline 안정화 후 M5 검토 |
| 12 | Attribution (AppsFlyer/Adjust/SKAN) | 없음 | ASO만, M5 광고 도입 시 재검토 |

**즉시 차단 1건 (#9)** — 그 외는 W15 sprint 내 완료 가능.

---

## 2. baseline metrics 14-day 수집 설계

### 2.1 수집 환경 (orchestrator 결정 필요)

3개 옵션 중 분석팀 권고:

| 옵션 | 사용자 수 가설 | 장점 | 단점 |
|---|---:|---|---|
| A. internal only | 5-10 | 즉시 시작, 동의/PII 부담 거의 없음 | 표본 너무 작아 retention/conversion 신호 무의미 |
| B. dogfood (지인+초대) | 30-80 | 표본 충분, EU 외 모집 가능 | 초대 흐름 + Firebase opt-in 동의 QA 필요 (1-2일) |
| C. closed beta (TestFlight/Play closed) | 100-300 | 외부 표본, attribution 자연스러움 | 스토어 심사 + 응답률 보장 어려움, 5/25 마감 빠듯 |

**권고**: **옵션 B (dogfood)** + 부분적으로 internal seed.
- 이유: M3 게이트가 5/25 종료, baseline은 "지표 산출 가능성 검증"이 목적이지 "통계적 유의" 검증이 아님. 14일에 절대값 신호가 부족해도 "측정 파이프라인 정상" + "지표 분포 1차 추정"이면 M4 진입 OK.
- closed beta는 M4 W17 이후 권고.

### 2.2 4 지표 측정 방법

| 지표 | 정의 (확정안) | 측정 채널 | 일일 dashboard |
|---|---|---|---|
| Day-3 retention | Day 0 `lesson_started` 사용자 중 Day 3 (local 04:00 reset 기준)에 `lesson_started` 또는 `review_completed` 1회+ | Firebase Audience + 코호트 (Funnel 부족 시 BigQuery export 임시 활성화 검토 — §2.4) | Firebase 기본 |
| Day-1 streak 유지율 | Day 0 `lesson_completed` 사용자 중 Day 1 `lesson_completed` 발생 비율 | Firebase 코호트 | Firebase |
| lesson_complete_rate | `lesson_started` -> `lesson_completed` 동일 user_id+local_day funnel | Firebase Funnel | Firebase |
| paywall_view_to_purchase | `paywall_viewed` -> `subscription_purchase_succeeded` (서버 검증 후) 7d window funnel | Firebase Funnel + Supabase `subscription_entitlements` cross-check | Firebase + 주간 SQL |

**서버 검증 우선 원칙** (taxonomy §2.3, §7): purchase는 RC webhook 후 `subscription_entitlements` 활성을 SoT로 보고, Firebase의 client `subscription_purchase_succeeded`는 funnel 시각화용으로만 사용. 주간 reconciliation SQL을 W15 내 작성 예정.

### 2.3 14일 일정 (5/11 ~ 5/25)

| 일정 | 작업 | 책임 |
|---|---|---|
| 5/11 (오늘) | 본 readiness 문서 commit, orchestrator에 환경 결정 ask | analytics |
| 5/12 | 환경 확정 -> Firebase project / opt-in flow 최종 QA, dogfood 초대 시작 | analytics + frontend + devops |
| 5/12-5/13 | dogfood 사용자 5-10명 1차 install (seed) | analytics |
| 5/13-5/14 | DebugView로 4 지표 funnel 발화 검증 (smoke) | analytics |
| 5/14 ~ 5/24 | 11일 raw collection | (passive) |
| 5/25 | 14d 종료 -> M3 W16 게이트 rollup 작성 | analytics + orchestrator |

D-3 retention은 마지막 코호트 기준 5/22 install -> 5/25 측정이 마지노선. 5/14 이후 install이어야 D-3까지 확보됨. 따라서 dogfood 초대는 **5/14까지 완료**가 hard deadline.

### 2.4 BigQuery export

- taxonomy §10에 따라 MVP 기본 비활성화이지만, 4 funnel 중 Day-3 retention은 Firebase 기본 dashboard에서 user-level cohort 추출이 제한적.
- W15에 한정적으로 활성화 검토 (DAU 1000 미만이지만 "정의된 분석 질문 존재" 조건 충족).
- 활성화 시 비용 상한 가설 + billing alert 사전 설정 필요 — devops 협업.
- 비활성 유지로 갈 경우 Day-3 retention은 Supabase 측 `lesson_attempts` 테이블 기반 SQL 집계로 대체 (정의: distinct user 중 Day 0 attempt 보유 + Day 3 attempt 보유).

---

## 3. SRS 28건 갭 분석 매트릭스

### 3.1 현황 (실제 파일 29건 기준, README drift 별도 수정)

| 카테고리 | 목표 | 작성 | 갭 | 작성된 ID |
|---|---:|---:|---:|---|
| stage 전이 (정답) | 10 | 6 | 4 | 001/002/003/004/005/006 |
| stage 전이 (오답) | 10 | 5 | 5 | 009/012/013/014/018 |
| same-cycle 2연속 오답 | 5 | 3 | 2 | 021/022/024 |
| Mastered 보호 | 3 | 2 | 1 | 026/027 |
| 04:00 경계 | 5 | 2 | 3 | 029/033 |
| 타임존 변경 | 3 | 2 | 1 | 031/032 |
| 멀티 디바이스 | 4 | 1 | 3 | 040 |
| 게스트 -> 가입 머지 | 3 | 3 | 0 | 035/036/038 |
| 콘텐츠 retire | 3 | 1 | 2 | 042 |
| 일일 한도 | 4 | 4 | 0 | 047/048/049/050 |
| **합계** | **50** | **29** | **21** | |

### 3.2 갭 Top 5 (W15 작성 우선순위)

| 순위 | 카테고리 | 갭 | 이유 |
|---:|---|---:|---|
| 1 | stage 전이 (오답) | 5 | 가장 큰 갭, 핵심 SRS 로직, stage 2/3/5 incorrect + same-cycle 1차 오답 + weak 진입 boundary 누락 |
| 2 | 멀티 디바이스 | 3 | 동시 attempt / late event / clock skew / offline replay 시나리오 — R-12 drift 회귀 방지에 직결 |
| 3 | 04:00 경계 | 3 | DST 전환 / 자정 경계 / Asia 타임존 boundary cell 미작성 (CC3-05 직접 영향) |
| 4 | stage 전이 (정답) | 4 | stage 2/3/4 correct + first-correct-after-reset 등 정상 path coverage 보강 |
| 5 | 콘텐츠 retire | 2 | retire-during-attempt / retire-then-restore — content evaluator와 cross-domain |

나머지 8건 (same-cycle 2 + Mastered 보호 1 + 타임존 1 + 다른 잔여): W15 후반 또는 W16 spillover 허용.

### 3.3 README drift 해결

- `fixtures/golden/srs/README.md` "W14 1차 22" 표기 -> 실제 29 (오늘 commit 시 함께 갱신).
- W15 1차에 "W15 1차" 행 추가하여 누적 ID 정확히 반영 (작성 시점에 PR로 갱신).

---

## 4. Mastered / Weak event emit 스키마 제안 (Q-DA-DOC-007)

### 4.1 이벤트 이름

taxonomy §3에 이미 등재되어 있음 (v0.2 시점):
- `word_mastered` — stage 5 최초 도달
- `word_weakened` — weak=true 전환

W15 작업은 "정의 추가"가 아니라 "실제 emit 로직 frontend 구현 + 속성 표준화 + golden 1건 단언". 이름은 그대로 사용 (taxonomy SSOT 준수, drift 금지).

### 4.2 properties 초안

#### word_mastered

| key | type | source | 비고 |
|---|---|---|---|
| word_id | string | client | low cardinality OK (taxonomy §9) |
| pack_id | string enum | client | dashboard primary dimension |
| attempts_count | int | client | mastered까지 누적 시도 수 (correct + incorrect) |
| correct_count | int | client | 누적 정답 수 |
| days_since_first_seen | int | client (compute) | first_attempt_at -> mastered_at의 local-day 차이 |
| triggered_by | enum | client | `lesson` \| `review` (어느 모드에서 mastered 도달) |
| local_day | string (YYYY-MM-DD) | client | 04:00 reset 기준 |

#### word_weakened

| key | type | source | 비고 |
|---|---|---|---|
| word_id | string | client | |
| pack_id | string enum | client | |
| stage_before | int (1-5) | client | weak 진입 직전 stage |
| reason | enum | client | `same_cycle_double_wrong` \| `mastered_double_wrong` \| `other` (CC3-05) |
| triggered_by | enum | client | `lesson` \| `review` |
| local_day | string | client | |

### 4.3 emit 위치

- SRS 상태 전이는 `_shared/srs.ts`의 순수 함수 (R-12 SoT). 발화는 호출 측 (mobile UI thunk)에서 transition 결과를 보고 emit.
- 권고: `apps/mobile/src/features/lesson/onAttemptResolved.ts` (또는 동등 위치)에서 transition diff 기반 emit:
  - `prev.mastered_at == null && next.mastered_at != null` -> `word_mastered`
  - `prev.weak == false && next.weak == true` -> `word_weakened`
- 서버 미발화 (서버 집계는 `srs_states` 테이블 직조회로 충분). 클라이언트 emit만으로 product analytics 충족.

### 4.4 검증

- W15에 `word_mastered` 발화 단언 SRS golden 1건 추가 (SRS-005를 확장하거나 신규 SRS-007 — stage4_correct_to_mastered_emits_event).
- evaluator는 transition 단언만, emit 자체는 frontend vitest로 mocked logEvent 호출 단언 (별도 테스트).

---

## 5. 차단 항목 / 의존성

| ID | 항목 | 책임 | 마감 |
|---|---|---|---|
| BLOCK-1 | baseline 수집 환경 결정 (§2.1 A/B/C) | orchestrator | 5/12 EOD |
| DEP-1 | dogfood Firebase project 생성 + DebugView 권한 | devops | 5/12 |
| DEP-2 | opt-in flow E2E QA (privacy-choices.tsx) | frontend + qa | 5/13 |
| DEP-3 | dogfood 초대 사용자 풀 5-10명 확보 | orchestrator + (마케팅 없음, 내부 인맥) | 5/14 (hard) |
| DEP-4 | BigQuery export 활성화 결정 (필요 시) + billing alert | devops + analytics | 5/13 |
| DEP-5 | Mastered/Weak emit 위치 frontend 협의 | frontend | 5/14 |
| DEP-6 | RLS evaluator dispatch 라우팅 (analytics 영향 1줄) | security + backend | W15 |

차단 1건 (BLOCK-1)이 풀리면 나머지는 W15 sprint 내 모두 완료 가능.

---

## 6. 자가 평가 요약

- **즉시 시작 가능 (오늘)**: SRS 갭 21건 작성 착수 + Mastered/Weak emit 스키마 frontend에 핸드오프 + README drift 수정.
- **5/12 차단 해소 후 시작**: baseline 14d 수집 (환경 확정 의존).
- **W15 sprint 끝(5/18 가정) 산출물 예측**: SRS golden 50/50 (or 47/50 + W16 3건 spillover), Mastered/Weak emit + golden 1건, baseline 5일치 raw, BigQuery 결정문서.
