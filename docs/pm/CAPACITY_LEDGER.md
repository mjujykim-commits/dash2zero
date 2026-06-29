# dash2zero — 1인 운영 Capacity Ledger

> 작성: pm agent
> 작성일: 2026-05-11 23:00 KST
> 책임: sprint별 산출량 / 캐파 envelope / 슬립 권고 / 사용자 결정 정렬 기록
> 입력: SWARM_LEDGER 통계 (M2-S1 ~ M3-W14) + W15 dispatch v2 부하 추정
> 출력 SSOT: 향후 sprint capacity envelope 가이드 — orchestrator dispatch와 PM sprint board가 본 ledger를 입력으로 사용
> Skill: humanizer (built-in) · taste-skill

---

## 1. 과거 sprint 산출량 baseline (M2-S1 ~ M3-W14)

| Sprint | 기간 | 산출 (줄, 추정) | 신규 파일 | 비고 |
|---|---|---:|---:|---|
| M2-S1 W5 | 2026-04-13 주 | ~900 | ~9 | bootstrap (Expo + Supabase + RC + DEV scaffolding) |
| M2-S2 W6 | 2026-04-20 주 | ~1,150 | ~12 | schemas + migrations + design tokens |
| M2-S3 W7 | 2026-04-27 주 | ~1,000 | ~10 | first-run + SRS + lesson card |
| M2-S4 W8 | 2026-05-04 주 | ~1,150 | ~10 | onboarding/home + audio + RPC + Starter 60 |
| M2-S5 W9 | 2026-05-04 후반 | ~1,400 | ~12 | Edge Functions 3 + Auth + Bootstrap runbook |
| M2-S6 W10-W11 | 2026-05-04~ | ~1,200 | ~10 | RC + delete + paywall + settings + report |
| M2-S7 W12 | 2026-05-11 직전 | ~1,100 | ~10 | cron + complete + auth callback + guestStore |
| M3-W13 | 2026-05-11 초 | ~800-1,000 (추정) | ~7 | harness + SRS foundation |
| **M3-W14** | 2026-05-11 후반 | ~1,200 (추정) | **28** | evaluators 4 + golden fixtures (파일 수 spike, 줄 수는 평균선) |

**평균 envelope (M2 sprint 7개 안정값)**: 1 sprint ≈ **1,000 ~ 1,400 줄 / 10 ~ 12 신규 파일**

**spike 사례**: M3-W14 = 파일 28개. 단일 파일 평균이 작은 fixture YAML 다수로 분산되어 줄 수는 평균선(~1,200). 파일 수 ≠ 노력량.

---

## 2. M3-W15 예상 부하 (dispatch v2 기준)

7 작업(W15-01 ~ W15-08) + planner D-013 분리 추정:

| 작업 | 줄 수 추정 | 신규/수정 파일 | 작업 성격 |
|---|---:|---:|---|
| W15-01 RLS evaluator + 7 golden + SoT 일원화 | ~350-450 | ~6 (rls.ts + fixtures 7 + _shared/rls.ts) | 코드 + SQL 분석 |
| W15-02 baseline 3-source + synthetic seed + snapshot script + Day-0 commit | ~400-500 | ~4 (BASELINE_METRICS.md + synthetic-baseline.ts + snapshot.ts + metrics/daily/2026-05-12.json) | 스크립트 + 문서 |
| W15-03 Mastered/Weak event emit + designer 토큰 | ~120-180 | ~3 (analytics.ts + 호출 지점 + THEME_DECISIONS.md 추가) | 작은 단위 |
| W15-04 SRS 28 golden | ~840 (28 × 30줄) | ~28 (yaml fixtures) | 단순 fixture, 케이스당 5-10분 |
| W15-05 Payment 8 + Privacy 5 + Content 3 = 16 fixtures | ~480 (16 × 30줄) | ~16 (yaml fixtures) | 단순 fixture |
| W15-06 alert stub (trigger SQL + security_alerts + workflow stub + ALERT_RUNBOOK + admin 모킹) | ~250-350 | ~6 (migration + RLS + workflow + runbook + 모킹) | 다중 도메인 |
| W15-07 nightly cron 활성화 + distractors_after_retire | ~80-120 | ~2 (workflow + content.ts 수정) | 작은 단위 |
| W15-08 ADR-0006 Accepted + ADR-0007 outline | ~250-350 | ~2 (ADR 2건) | 문서 |
| planner D-013 PRD threshold 4 KPI | ~80-120 | ~1 (PRD.md 수정) | 문서 |
| **합계** | **~2,850-3,390** | **~68 파일 (fixture 44 포함)** | — |

**비교**:

| 비교축 | M2 평균 | M3-W14 | M3-W15 예상 | 증분 |
|---|---:|---:|---:|---|
| 줄 수 | ~1,000-1,400 | ~1,200 | **~1,750** (fixture 줄 수 가중치 50% 적용 후) | **+25 ~ +75%** |
| 파일 수 | ~10-12 | ~28 | **~68** | **+140 ~ +180%** vs M2 평균 |

**fixture 가중치 보정**: SRS 28 + Payment 8 + Privacy 5 + Content 3 = 44 fixture YAML은 단위 작업 비용이 코드보다 낮음 (케이스당 5-10분 + analytics가 일관 lead). 줄 수 합계의 50%만 캐파에 부담으로 계산하면 W15 실 부담 = ~1,750줄 상당.

→ **W15는 M2 평균보다 +25~75% 부하**. 1인 운영 + 12명 트랙 동시 가정 하에서도 캐파 envelope 한계.

---

## 3. 캐파시티 권고 (사용자 결정으로 자동 정렬됨)

W15 readiness §4.3에서 PM은 다음 슬립 옵션을 제안했다:

| 옵션 | 효과 | 비용 | 사용자 결정 정렬 |
|---|---|---|---|
| A. T5(W15-05) 잔여 fixtures 16건 → W16 이연 | W15 부하 ~480줄 감소 | M3 게이트 fixture window 단축 | **부분 정렬** — content 3 fixtures + Starter 60은 그대로 유지(Q-PM-W15-001), 단 분기 발생 시 W15-05의 Payment 8 / Privacy 5 일부를 W16 첫날(5/19)로 이연 가능 (qa 검증 시점 변경 없음) |
| B. T6(W15-06) Slack alert → M5 이연 | W15 부하 ~80줄 (실 webhook 부분만) 감소, stub 모드는 W15 유지 | M5 entry에서 실 webhook URL + on-call 회전 정책 작성 | **완전 정렬** — D-011 사용자 결정으로 실 Slack URL은 M5 이연, W15는 stub만 작성 (audit_log trigger + DB 적재 + console). 회귀 catch는 stub로 충분 |
| C. T4(W15-04) SRS 28건 분담자 풀 분담 | analytics 단독 부담 감소 | 분담자 모집 비용 (외부 검수자) | **선택 안 함** — 1인 운영 신뢰성 우선, analytics 단독 진행 |
| D. baseline window 14d → 10d 단축 | M3 종료 5/22 (W16 마지막날) 가능 | 통계 신뢰도 하락 | **불필요** — D-010 사용자 결정으로 real-user baseline 14d 수집은 M5 이연, W15는 "파이프 동작 검증"만 게이트. window 단축 논점 자체가 해소됨 |

**사용자 결정으로 자동 정렬된 결과**:
- **W15-06 실 webhook 부분 이연 (D-011)** → 80줄 절감
- **D-010 baseline 파이프 동작 검증으로 게이트 변경** → 14d wall-clock 압박 해소, M3 종료 일자 자유도 회복
- **C-13 운영 항목 전면 이연 (D-012)** → legal sprint 부담 0, W15 12명 모두 코드 트랙 정렬 가능

**T5 일부 W16 이연**: 사용자 결정에 직접 영향 없음. PM 권고로 유지 — qa 11×N 매트릭스 검증이 5/14 머지 후 시작이므로 만약 5/14 EOD 시점 분담 fixture 미완성이면 Payment 8 중 3-4건을 5/19(W16 월)로 이연 자율 결정.

---

## 4. 향후 sprint capacity envelope 가이드

| Sprint | 권장 envelope | Hard cap | 비고 |
|---|---|---|---|
| **표준 sprint (M2-style)** | 1,000-1,400줄 / 10-12 파일 | 1,800줄 / 25 파일 | 컨텍스트 스위칭 +30% 가산 후 |
| **fixture-heavy sprint (M3-W14, M3-W15-style)** | 1,500-1,800줄 (가중치 보정 후) / 30-50 파일 | 2,200줄 (보정) / 70 파일 | YAML fixture는 줄당 0.5 가중치 |
| **operational sprint (M5 entry, GA week)** | 600-900줄 + 운영 작업 다수 | 1,300줄 | 운영 작업 (계정 발급 / 약관 업로드 / 심사 응답)이 코드 시간 잠식 |
| **Buffer week (W19, W20)** | 0-600줄 | 1,000줄 | hotfix 전용, 신규 기능 금지 |

**원칙**:
1. 1 sprint = 1주 = 7일. 컨텍스트 스위칭 비용 +30% 항상 가산.
2. 단일 sprint 부담이 envelope 상단 +25% 초과하면 **사전에 슬립 옵션 1개 이상 결정**한다.
3. fixture / yaml / markdown은 줄당 0.5 가중치, 코드 / SQL / config는 1.0 가중치.
4. 1인 운영이므로 "n명 트랙 동시 진행"은 12명 시니어 페르소나 동시 가동을 의미 — 단일 PM 한 명이 모든 시야를 책임진다. PM 모니터링 비용도 캐파에 포함.
5. M4 이후는 운영 sprint 비중이 증가하므로 코드 envelope을 의도적으로 낮춘다.

---

## 5. M3-M5 sprint 캐파 예측

| Sprint | 기간 | 예상 부하 (줄) | 권장 envelope 위치 | 비고 |
|---|---|---:|---|---|
| M3-W15 | 2026-05-12 ~ 05-18 | ~1,750 (보정) | fixture-heavy 상단 | 본 sprint, 캐파 한계 영역 |
| M3-W16 | 2026-05-19 ~ 05-25 | ~600-900 | 표준 하단 | M3 게이트 검증 sprint, baseline trend 모니터 + W16 rollup + ADR-0007 baseline 저장소 |
| M4-W17 | 2026-05-26 ~ 06-01 | ~1,200-1,400 | 표준 중상단 | Security+QA 압축, ADR-0008 secret 회전 정책 |
| M4-W18 | 2026-06-02 ~ 06-08 | ~1,000-1,200 | 표준 중단 | QA test cases 강화, 회귀 14-day 안정 검증 |
| M5-W19 | 2026-06-09 ~ 06-15 | ~700-1,000 코드 + 운영 다수 | operational | 베타 entry, C-13 reconfirm + Slack URL + 베타 모집 활성화 |
| GA-W20 | 2026-06-16 ~ 06-22 | ~500-800 코드 + 출시 운영 | Buffer 상단 | GA 출시 또는 슬립 흡수 |

---

## 6. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-11 23:00 | 초기 작성. M2-S1 ~ M3-W14 sprint별 산출량 baseline 정리, M3-W15 예상 부하 ~1,750줄 (보정) 산정, 사용자 결정(D-010/011/012) 정렬 결과 기록, 향후 sprint envelope 4종 가이드 발행 | pm |
