# Orchestrator Context — M3 W15 Dispatch Plan 작성

> Agent: orchestrator
> 일시: 2026-05-11 22:00
> Branch: chore/m3-w15-dispatch-plan
> Short SHA: (pending commit)

---

## 1. 작업 요약

W14 종료 직후 사용자 요청으로 12 시니어 깨움 사이클 진입. orchestrator는 본 사이클에서 W15 dispatch plan만 작성 (12 readiness 자가보고는 다음 사이클).

읽은 SSOT:
- `context/rollups/20260511-M3-W14-evaluators-and-ci.md` — W14 종료 rollup, §9 W15 작업 큐 7항목
- `docs/HANDOFF.md` — 마일스톤 상태판 (M3 in_progress, W14 완료까지 반영됨)

생성한 산출물:
- `context/rollups/20260511-M3-W15-dispatch-plan.md` (10 섹션, ~250줄)
- 본 context 기록

## 2. 핵심 결정

### 2.1 W15 작업 큐 7항목으로 정규화
W14 rollup §9의 7항목을 그대로 W15-01 ~ W15-07로 매핑하되 carry-over(CO-01~03) vs 신규(NEW-01~04) 분리. carry-over는 W14 1차 commit이 "최소 viable evaluator + 대표 case" 기준이었기 때문 — 명시적 인지.

### 2.2 5개 작업 즉시 병렬 시작 가능
W15-01(RLS), W15-02(baseline), W15-03(event), W15-04(SRS golden), W15-05(잔여 golden)는 의존성 없이 T+0 시작 가능. W15-06(alert)은 W15-01 머지 후, W15-07(nightly cron + R-24)은 W15-01 + W15-05 후 — 내부 순차로 분류, 외부 차단 0건.

### 2.3 baseline metrics 14-day 윈도우와 sprint 길이 mismatch 명시
W15(7일) + W16(7일) = 14일에 빠듯하게 맞춰짐. baseline 수집은 W15 Day-1 시작 → W16 Day-14 = 자정 직전 종료. 만약 W15가 늦게 시작하면 M3 게이트는 "수집 진행 중 + 7-day 중간 스냅샷 분석 완료" 기준으로 통과 가능 — 게이트 유연성 사전 합의.

### 2.4 R-23 / R-24 W15 내 해소 명시
R-23(RLS evaluator 미구현)은 W15-01로 해소, R-24(distractors retire 후 재검증)는 W15-07로 해소. 둘 다 W15 종료 조건에 포함.

### 2.5 SSOT 패턴 RLS로 확장
W15-01 산출물 정의에 "정책 SQL SoT가 evaluator와 마이그레이션 양쪽이 import하는 구조" 명시. R-12 패턴(_shared/srs.ts, _shared/billing.ts)을 RLS로 확장 — drift 방지 일관성.

## 3. SSOT 갱신 필요 항목 (이번 사이클은 plan만, 갱신은 다음 사이클)

- `docs/HANDOFF.md` §1 마일스톤 상태판 — W15 진입 표기는 12 readiness 통합 승인 후
- `docs/DECISION_LOG.md` — W15 dispatch는 sprint 운영 사항, 별도 D-NNN 신규 없음 (RLS evaluator 도입 결정은 W14 rollup §4.2에 이미 기록됨)
- `docs/PROJECT_MAP.md` — W15-01 `scripts/eval/rls.ts` + `fixtures/golden/rls/` 신규 디렉토리 추가는 머지 시점에

## 4. Skill 사용 점검 (이번 작업)

orchestrator는 본 사이클에서 코드 작성 0, 문서 작성 1(dispatch plan) + context 1.
- humanizer: 미사용 (내부 운영 문서, 자연어 다듬기 불필요)
- 다른 skill: 미사용 (점검/조정 작업)

## 5. Risks / Open Questions

| 항목 | 내용 | 해소 시점 |
|---|---|---|
| Q-1 | W15-01 RLS evaluator 구현 방식: pg_test_role vs supatest vs static SQL 분석 — 어느 것? | security agent 자가보고에서 결정 |
| Q-2 | baseline metrics 4 KPI 측정 공식 — paywall_view_to_purchase의 분모(노출/세션/유저)? | analytics agent 자가보고에서 결정 |
| Q-3 | Slack #security webhook 채널 실재 여부 — 없으면 dev에 dummy webhook 사용? | devops agent 자가보고 |
| R-25 신규 | W15 sprint 길이가 7일 가정 — 실제 진행 속도 W14처럼 빠르면 W16 합쳐서 5월 18일 M3 게이트 가능. 늦으면 baseline 14-day가 W17까지 밀림 | W15 mid-sprint 중간 점검 |

## 6. 다음 사이클 권고

1. 12 시니어 readiness 자가보고 수신 → orchestrator 통합 승인
2. 통합 승인 시 `docs/HANDOFF.md` §1에 W15 in_progress 행 추가, dispatch plan 링크
3. 5개 병렬 작업 (W15-01 ~ W15-05) 동시 착수 신호 발송
4. T+3일 mid-sprint 중간 점검 사이클 (W15-01 진행률 + baseline Day-3 스냅샷 검증)
5. T+5~7일 W15-06, W15-07 unblock 점검
6. W15 종료 rollup 작성 + W16 (M3 게이트 검증) 진입

## 7. Definition of Done — 본 사이클

- [x] `context/rollups/20260511-M3-W14-evaluators-and-ci.md` 정독
- [x] `docs/HANDOFF.md` 정독
- [x] `context/rollups/20260511-M3-W15-dispatch-plan.md` 작성 (10 섹션, 7 작업 큐, 의존성 그래프, 차단표, M3 진입 조건, W16 예상)
- [x] 본 context 기록 작성
- [x] 12 시니어 readiness 자가보고 요청 dispatch plan §8에 명시
- [ ] (다음 사이클) 12 readiness 통합 승인
- [ ] (다음 사이클) HANDOFF W15 in_progress 갱신
