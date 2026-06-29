# M3 W15 진입 — PM Readiness 자가 진단

- **Agent**: pm
- **작성일**: 2026-05-11 22:00 KST
- **사이클**: M3 W14 종료 직후 → W15 진입 직전
- **참조 rollup**: `context/rollups/20260511-M3-W14-evaluators-and-ci.md`
- **사용한 Skill**: humanizer (built-in) · theme-factory · frontend-design · taste-skill

---

## 1. 자가 진단 12항목 (Go/Conditional/No-Go)

| # | 항목 | 판정 | 근거 / 보완 필요 |
|---|---|---|---|
| 1 | W14 게이트 통과 명시되었는가 | **Go** | rollup §10에 "M3-W14 게이트 통과 ✅ / 차단 항목 없음" 서명. 28 신규 파일, 4 evaluator strict CI 작동. |
| 2 | W15 작업 큐 7개가 단위 분해 가능한가 | **Conditional** | rollup §9 큐 7개 중 "RLS evaluator", "baseline 14d 수집", "잔여 SRS 28건"은 1태스크 ≤ 3일 원칙 준수 가능. "Mastered/Weak event emit"은 frontend↔analytics 합의 필요로 0.5d 사양 합의 선행. |
| 3 | W15 작업 의존성 그래프 작성 (§2 표) | **Go** | 본 문서 §2. critical path = baseline metrics 수집 14d. |
| 4 | M3 종료 일자 예측 가능한가 | **Go** | 본 문서 §3. baseline 14d가 critical path → 5/11 시작 시 5/24 종료, M3 게이트 W16 종료(5/25)에 fit. |
| 5 | M3 게이트 DoD 4항목 (MVP_SCOPE §7.2)이 W16에 충족 가능한가 | **Conditional** | 87 golden 100% 14d 연속, adversarial 10 case 100%, CI 통합, baseline 14d 안정 — 잔여 35 golden 작성 + RLS evaluator + 14d wall-clock이 모두 W15-W16 안에 동시 진행되어야. Risk medium. |
| 6 | 1인 운영 캐파시티 평가 (§4) | **Conditional** | 과거 sprint 산출량 평균 ~1,000-1,400줄/sprint. W15 예상 부하 ~1,000-1,200줄 (RLS evaluator + 잔여 fixtures + event emit) — 캐파 한계. P1 슬립 후보 사전 분류 필요. |
| 7 | 출시 차단 리스크 식별 | **Go** | R-23 (RLS evaluator 미구현 동안 보안 회귀 누락)은 W15 1차 작업으로 해소 예정. R-24 (DB seed 후 distractor drift)는 medium-low. |
| 8 | 운영/장애 대응 흐름 — audit_log alert 채널 | **Conditional** | W15 큐에 "audit_log 위반 시도 alert → Slack #security webhook" 포함. 단, Slack workspace 존재/owner 모바일 전송 SLA(CC3-02) 정합 검증 필요. |
| 9 | 콘텐츠 batch와 일정 정합 | **Go** | MVP_SCOPE §3.2 기준 W14-W15 = B-5 Premium #4 (50단어). content evaluator는 candidate yaml만 검증 — 실제 import는 별도 트랙으로 코드 sprint 차단 없음. |
| 10 | 콘텐츠 batch 실제 진행 상태 확인 | **No-Go (질문 필요)** | SWARM_LEDGER 최근 entries에 B-2~B-5 batch 실 진행률 기록 없음. external 검수자 SLA 응답 시간 미기록. → REVIEW_QA.md PM Q1 |
| 11 | C-13 D-42 게이트 카운트다운 | **No-Go (질문 필요)** | MVP_SCOPE §3.1에서 W14가 D-42 (legal Specialist 활성 트리거). 사업자 등록 진행 상황 미보고. paid release 차단 위험 직결. → REVIEW_QA.md PM Q2 |
| 12 | M4 진입 일정 제안 가능한가 | **Go** | M3 W16 종료(5/25) → M4 W17 진입(5/25-26 주) 제안. 단 M4는 MVP_SCOPE §3에서 W15-W16에 배치된 것과 충돌. 본 문서 §3에서 일정 재정렬 제안. |

판정 통계: Go 7 / Conditional 3 / No-Go 2 (모두 외부 정보 미지급 사유, blocker는 아님 → 질문 등록).

---

## 2. W15 작업 큐 7개 — 의존성 + 시작 가능 시점

원천: rollup §9. 시작일 가정 = 2026-05-12(월).

| # | 작업 | 책임 agent | 추정 인일 | 선행 의존 | 시작 가능 시점 | 종료 예상 | 비고 |
|---|---|---|---:|---|---|---|---|
| T1 | RLS evaluator (Supabase pg_test_role / supatest 또는 정책 SQL static 분석) | security + backend | 2.5d | 없음 (RLS adversarial 4 case는 W14에 작성 완료) | **5/12 (월) 즉시** | 5/14 (수) | critical sub-path. R-23 해소. eval-nightly cron 활성화 선행. |
| T2 | baseline metrics 14d 수집 시작 (D3 retention / D1 streak / lesson_complete / paywall→purchase) | analytics | 0.5d 셋업 + 14d wall-clock | T6 (event emit) 일부 의존, 단 lesson_complete/paywall_view는 W12에 emit 됨 | **5/12 (월)** 셋업, 본격 수집 5/12 시작 | **5/25 (일) 14d 종료** | **CRITICAL PATH**. M3 게이트의 wall-clock 종속 항목. |
| T3 | Mastered/Weak measurement event emit (analytics.ts logEvent — Q-DA-DOC-007) | analytics + frontend | 1d | 사양 합의 0.5d 선행 | **5/12 (월) 사양 → 5/13 (화) 구현** | 5/14 (수) | T2 baseline의 일부 metric (Mastered 진입율)이 이 event에 의존. 5/14 안에 emit 시작해야 14d 수집에 포함. |
| T4 | SRS 추가 28건 (W13/W14 누락 cell 우선 채움, ID 051-078) | analytics + qa | 2d | 갭 분석 0.5d 선행 (W14 분포 표 기반) | 5/12 (월) | 5/14 (수) | SRS 50/50 도달. T1과 병렬. |
| T5 | Payment 8건 + Privacy 5건 + Content 3건 잔여 (총 16건) | backend + legal + content | 1.5d | 없음 | 5/13 (화) | 5/14 (수) | 87 golden 완전 도달. T4와 병렬, 단 1인 운영 시 컨텍스트 스위칭 비용 +30% 가산. |
| T6 | audit_log 위반 시도 alert → Slack #security webhook | security + devops | 1d | Slack workspace 존재 확인 (PM Q3) | 미정 — 전제 미확정 | 5/15 (목) 가정 | T1이 RLS violation을 audit_log에 기록한 직후 검증. |
| T7 | `eval-nightly.yml` cron 활성화 | devops | 0.5d | T1 완료 (RLS evaluator merge) | 5/14 (수) 또는 5/15 (목) | 5/15 (목) | T1의 마지막 step. |

### 2.1 W15 critical path

```
T1 (RLS eval, 2.5d) ─┐
T3 (Mastered emit, 1.5d) ─┼─→ T2 baseline 수집 시작 (5/12-13) ──── 14d wall-clock ──→ 5/25 종료
T4 (SRS 28건, 2d) ───┘
T5 (16 fixtures, 1.5d) ──┘ (87 golden 완전)
                           │
                           └─→ T6/T7 (alert + nightly cron, 5/14-15)
```

**Critical path = T2 baseline 14d (5/12 시작 → 5/25 종료, 13d wall-clock).**
다른 모든 task는 5/12-5/15 사이 완료되면 critical path를 막지 않는다.

### 2.2 W15 코드 작업 부하 (T2 wall-clock 제외)

T1 + T3 + T4 + T5 + T6 + T7 = 2.5 + 1 + 2 + 1.5 + 1 + 0.5 = **8.5d** (다중 agent, 병렬 가능 시)
1인 운영 환산 (병렬 불가, 컨텍스트 스위칭 +30%): **약 11d 주말 포함 작업** → W15 (5/12-5/18, 7일) 안에 fit하려면 **하루 1.5d 분량 / 일 8시간 이상 가용** 필요. 캐파 risk 영역 (§4).

---

## 3. M3 종료 일정 예측 + M4 진입 제안

### 3.1 critical path 분석

| 가정 | 일자 |
|---|---|
| W15 시작 (월요일) | 2026-05-12 |
| baseline 14d 수집 시작 | 2026-05-12 (T2 셋업 완료 후) |
| baseline 14d 종료 | **2026-05-25 (월)** |
| M3 게이트 검증 rollup 작성 (orchestrator) | 2026-05-25 ~ 5/26 |
| **M3 종료 예상 일자** | **2026-05-26 (화)** |
| M4 진입 가능 | **2026-05-26 (화)** |

### 3.2 W16 종료 가능 여부

- **결론: W16(5/18-5/24) 종료는 불가능**. baseline 14d는 5/12 시작 시 5/25 종료 — W17 첫 영업일에 닿는다.
- W16에 끝내려면 baseline window를 14d → 12d로 축소하거나 W14 종료(5/11)에 baseline 수집을 사전 시작했어야. → 사전 시작은 W14 evaluator 미완성 상태에서 무의미 (event emit 불완전).
- **현실적 M3 종료 = 2026-05-26 (W17 시작일)**. MVP_SCOPE §3.1의 "W13-W14 M3" 일정은 1주 슬립.

### 3.3 M4 일정 영향

- MVP_SCOPE §3.1: M4 (Security+QA) 원래 W15-W16. 현재 M3가 W13-W16 4주로 확장 → M4는 W17부터.
- M4 원래 2주 → 압축 운영 시 W17-W18, M5 베타 W19-W20, **GA buffer 0주**. R-06 (1인 가용시간 위반) 폭로 시 즉시 GA 슬립.
- **권고**: M4 W17 진입, M5 W19 진입, GA 목표 W20 종료. Buffer 흡수.

---

## 4. 1인 운영 캐파시티 risk

### 4.1 과거 sprint 산출량 (SWARM_LEDGER 통계)

| Sprint | 산출 (줄) | 신규 파일 |
|---|---:|---:|
| M2-S2 W6 | ~1,150 (schemas + migrations + tokens) | ~12 |
| M2-S3 W7 | ~1,000 (first-run + SRS + lesson card) | ~10 |
| M2-S4 W8 | ~1,150 (onboarding/home + audio + RPC + Starter 60) | ~10 |
| M2-S5 W9 | ~1,400 (Edge Functions 3 + Auth + Bootstrap runbook) | ~12 |
| M2-S6 W10-W11 | ~1,200 (RC + delete + paywall + settings + report) | ~10 |
| M2-S7 W12 | ~1,100 (cron + complete + auth callback + guestStore) | ~10 |
| M3-W13 | (rollup 미참조, 추정 ~800-1,000) | ~7 |
| M3-W14 | (28 신규 파일 + 4 evaluator + fixtures) | **28** |

**평균: 1 sprint ≈ 1,000-1,400 줄 / 10-12 신규 파일**. M3-W14는 evaluator + fixture 다수로 파일 수 spike (28).

### 4.2 W15 예상 부하

- T1 RLS evaluator: ~250-350줄 (정책 SQL static 분석 또는 supatest pg client wrapper)
- T3 event emit: ~80-120줄 (analytics.ts logEvent + frontend 호출 지점 2-3곳)
- T4 SRS 28건: ~28 yaml × 평균 30줄 = ~840줄 (단순 fixture, 작성 비용 case당 5-10분)
- T5 16 fixtures: ~16 yaml × 30줄 = ~480줄
- T6 alert: ~80줄 (webhook + audit_log subscription)
- T7 cron: ~10줄 (yml 수정)
- **합계: 약 1,750-1,900줄 + 28+16=44 yaml fixture 신규 파일**

→ **W15 부하는 과거 평균보다 +40% 높음**. 1인 운영 + 병렬 agent 가정을 고려해도 캐파 한계.

### 4.3 캐파 risk 완화안

| 옵션 | 효과 | 비용 |
|---|---|---|
| A. T5 잔여 fixtures (16건)을 M3-W16으로 이연 | W15 부하 ~480줄 감소 | M3 게이트 DoD "87 golden 100% 14d" 14d window 단축 → 12d window로 평가 |
| B. T6 alert 채널을 M4로 이연 | W15 부하 ~80줄 감소 | R-23 부분 잔존, 단 audit_log 기록 자체는 W14에 작동 |
| C. T4 SRS 28건을 W13/W14 작성자 풀에서 분담 | 분담자 가용성 의존 | 외부 검수자 모집과 별개 |
| D. baseline window를 14d → 10d로 단축 | M3 종료 5/22 (W16 마지막날) 가능 | metric 통계 신뢰도 하락. CC2-22 baseline ±20% 검증의 표본 부족. |

**권고**: A + B 조합. M3 종료 일자 5/26 유지하되 W15 부하를 ~1,400줄로 정렬. M3 DoD "14d window"는 5/12-5/25 그대로 유지하되 fixture 100% 도달 시점은 5/20 (W16 중반)로 연기.

---

## 5. 차단 / 외부 의존

| ID | 항목 | 차단 영향 | 해소 |
|---|---|---|---|
| BLK-W15-01 | Slack workspace + #security webhook 존재 여부 미확인 | T6 시작 불가 | PM Q3 (REVIEW_QA.md) |
| BLK-W15-02 | external 검수자(R-01) B-5 batch 응답 SLA 미보고 | 콘텐츠 batch 트랙 불투명 (코드 sprint 직접 차단 X) | PM Q1 |
| BLK-W15-03 | C-13 사업자 D-42 (W14 도래 완료 시점) 등록 진행 미보고 | paid release 직접 차단, M5 베타 게이트 영향 | PM Q2 |

차단 강도: 모두 W15 코드 sprint **직접** 차단 아님. T6는 alert 미구현으로 W16에 이연 가능. C-13은 M5 게이트까지 deadline.

---

## 6. 다음 추천 액션

1. **orchestrator**: W15 dispatch plan 작성 시 본 문서 §2 의존성 표를 입력으로 사용. critical path = T2 baseline.
2. **PM (본인)**: REVIEW_QA.md PM 섹션에 Q1/Q2/Q3 등록 (다음 단계).
3. **PM**: W16 중반 (5/20)에 M3 게이트 dry-run 진단. 14d baseline은 5/25까지 안 끝나므로 metric trend만 사전 확인.
4. **analytics**: T2 baseline 셋업을 5/12 영업일 첫 작업으로 (critical path).
5. **security + backend**: T1 RLS evaluator는 5/12-5/14 안에 closure. R-23 해소.

---

## 7. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-11 22:00 | M3 W15 readiness 12항목 자가 진단 + 의존성 표 + M3 종료 예측 + 캐파 risk + 차단 | pm |
