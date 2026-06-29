# Orchestrator Context — M3 W15 Autonomous Dispatch (4 결정 봉인 + v2 dispatch 발행)

> Agent: orchestrator
> 일시: 2026-05-11 22:30
> Branch: chore/m3-w15-autonomous-dispatch
> Short SHA: (pending commit)

---

## 1. 작업 요약

사용자 자율 결정 권한 위임 사이클. "운영 blocker(사업자 등록 등)는 무시, 완벽한 제품 개발에만 몰두, 나머지는 팀 자율 결정" 명시 수신.

- 4개 미해결 결정(D-baseline-env / D-slack-alert / D-c13-business / D-prd-thresholds)을 D-010~D-013으로 DECISION_LOG에 봉인
- W15 dispatch plan v2 발행 — v1 대비 4 결정 반영, 운영 항목 제외, 12명 작업 트랙 명시, ADR-0006 게이트 추가
- HANDOFF.md M3 W15 시작 표기 + §4.1 M3 게이트 조건 갱신 (real-user baseline → 수집 파이프 검증)
- DECISION_LOG ADR 인덱스에 ADR-0006/0007/0008 pending 등재 + 게이트 정의

읽은 SSOT:
- `context/rollups/20260511-M3-W15-dispatch-plan.md` (v1)
- `context/agents/orchestrator/20260511-2200-chore-m3-w15-dispatch-plan.md`
- `docs/DECISION_LOG.md`
- `docs/HANDOFF.md`

생성/갱신한 산출물:
- `docs/DECISION_LOG.md` — D-010, D-011, D-012, D-013 4건 추가 + §2.3 C-13 보류 표 갱신 + §4 ADR 인덱스에 0006/0007/0008 + §5 변경 이력 3줄
- `docs/HANDOFF.md` — §1 M3 W15 시작 표기 + §4.1 M3 게이트 조건 v2 신설 + §6 변경 이력
- `context/rollups/20260511-M3-W15-dispatch-plan-v2.md` — 12명 트랙 / 작업 큐 v2 / 운영 제외 / 게이트 v2 / 통합 승인 호출 시점 4단계
- 본 context 기록

---

## 2. 핵심 결정 (4건 봉인 사유 요약)

### D-010 baseline 환경
운영 사용자 모집은 사업자/약관/결제 정책 의존 = 운영 blocker. 제품 측은 수집 파이프 검증과 평가 logic 구축이 핵심. → 3-source(staging + synthetic + dogfood)로 파이프 동작 검증 = M3 게이트, real-user는 M5.

### D-011 alert stub
실 Slack webhook URL 발급은 운영 채널 정책 의존. 제품 측 회귀 catch는 console + DB 적재 + nightly evaluator로 동등 보장 가능. → stub 모드로 W15 작성, 실 URL은 M5.

### D-012 C-13 분류
사용자 명시 "운영 blocker 무시". 사업자 등록 / 통신판매업 / RevenueCat 발행자 / 약관 정식본 / 결제 수령 계좌는 모두 M5 entry로 분류. M3/M4 동안 코드 측은 sandbox/placeholder로만 진행 (M2 산출물 그대로 유지).

### D-013 PRD threshold
threshold 결정은 planner 핵심 ownership. orchestrator가 임의 값 부여 시 ownership 침범 → planner 자율 결정, orchestrator 승인 표시만. 산출물 = `docs/product/PRD.md §성공지표` 또는 `docs/harness/BASELINE_METRICS.md §threshold`.

---

## 3. ADR 게이트 정의 (architect 작성, orchestrator 승인 기준만)

| ADR | 작성 시점 | 작성자 | orchestrator 승인 기준 |
|---|---|---|---|
| ADR-0006 SRS 공유 패키지 | W15 본 사이클 | architect | 본 사이클 내 Accepted 권고. 경계(packages/shared-srs 또는 _shared/srs.ts) 명확 / Reversal Trigger 명시 / R-12 SoT drift 패턴 SRS로 구현 정합 |
| ADR-0007 baseline 저장소 | W16 (D-010 봉인 후) | architect | 3-source 구성(staging + synthetic + dogfood) ADR화 / synthetic seed 결정성 보장 방법 명시 / real-user M5 이연 트리거 명시 |
| ADR-0008 secret 회전 | M4 W17 이연 | architect / security | M4 진입 시 작성. Slack webhook URL + EAS keys + Supabase service role + RevenueCat secret 회전 주기 / 정책 / 자동화 |

---

## 4. SSOT 갱신 결과 (이번 사이클)

- `docs/DECISION_LOG.md` ✅ D-010~D-013 + §2.3 + §4 ADR 인덱스 + §5 변경 이력
- `docs/HANDOFF.md` ✅ §1 M3 W15 시작 + §4.1 M3 게이트 조건 v2 + §6 변경 이력
- `context/rollups/20260511-M3-W15-dispatch-plan-v2.md` ✅ 신규
- `docs/PROJECT_MAP.md` — W15-01 `scripts/eval/rls.ts` + `fixtures/golden/rls/` + `scripts/seed/synthetic-baseline.ts` 신규 디렉토리는 머지 시점에 갱신 (현재는 dispatch만)
- `docs/product/PRD.md`, `docs/harness/BASELINE_METRICS.md` — planner / analytics 작업 산출물에서 갱신 예정 (이번 사이클은 아님)

---

## 5. Skill 사용 점검 (이번 작업)

orchestrator 본 사이클: 코드 0 / 문서 작성 4 (DECISION_LOG 추가 + HANDOFF 갱신 + dispatch v2 + context).
- humanizer: 미사용 (내부 운영 문서, 자연어 다듬기 불필요)
- changelog-generator: 미사용 (외부 가시 변경 없음 — 결정 봉인은 SSOT 내부)
- 다른 skill: 미사용

---

## 6. Risks / Open Questions

| 항목 | 내용 | 해소 시점 |
|---|---|---|
| Q-W15-1 | synthetic seed 결정성 — random seed 고정해야 baseline 재현 가능. analytics + devops 합의 필요 | W15-02 시작 시 |
| Q-W15-2 | 1인 dogfood 신호와 synthetic 신호 분리 라벨링 필요 (metrics/daily/*.json schema) | W15-02 schema 정의 시 |
| Q-W15-3 | ADR-0006 경계 — packages/shared-srs (npm workspace) vs _shared/srs.ts (Edge Function 공유)? architect 결정 | architect ADR 작성 시 |
| R-26 신규 | 12명 병렬 착수 시 cross-track 충돌 가능성 (analytics가 W15-02/03/04 3개 lead — 인지부하 높음). pm이 모니터 | W15 mid-sprint 사이클 A |
| R-27 신규 | D-013 planner threshold 결정이 baseline 정의보다 늦으면 BASELINE_METRICS.md commit 지연 가능 | W15 Day 1-2 안에 planner commit 강제 |

---

## 7. 다음 사이클 권고 (orchestrator 호출 시점 4단계)

| 사이클 | 시점 | 트리거 | 통합 승인 대상 |
|---|---|---|---|
| **A** | T+3일 | mid-sprint 중간 점검 | W15-01 진행률 / baseline Day-3 / golden 진척 / ADR-0006 draft |
| **B** | T+5~7일 | W15-06/07 unblock | W15-01 머지 / W15-05 머지 / W15-06 stub / W15-07 cron green |
| **C** | T+7일 (W15 종료) | sprint 종료 rollup | 12명 작업 통합 승인 / W15 rollup / W16 진입 |
| **D** | T+14일 (W16 종료) | M3 게이트 검증 | §4.1 10개 조건 모두 검증 / M3 completed 서명 / M4 진입 |

본 사이클은 **결정 봉인 + 게이트 정의 + dispatch v2** 만, 통합 승인은 사이클 A부터.

---

## 8. Definition of Done — 본 사이클

- [x] 사용자 위임 사항 4개 결정 모두 봉인 (DECISION_LOG D-010~D-013)
- [x] §2.3 보류 표 C-13 갱신 (M5 entry)
- [x] ADR-0006/0007/0008 인덱스 등재 + 게이트 정의
- [x] W15 dispatch plan v2 발행 (운영 제외 / 12명 트랙 / 게이트 v2)
- [x] HANDOFF.md M3 W15 시작 + §4.1 게이트 조건 갱신
- [x] 본 context 기록
- [x] 다음 사이클 권고 (A~D 4단계 명시)
- [ ] (다음 사이클 A부터) 12명 작업 통합 승인
