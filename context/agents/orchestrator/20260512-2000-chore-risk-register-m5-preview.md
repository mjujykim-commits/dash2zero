# Orchestrator Context — RISK_REGISTER 통합 + R-28/R-29 충돌 해소(D-016/D-017) + M5 entry preview + R-M5-01 양식

> Agent: orchestrator
> 일시: 2026-05-12 20:00 KST
> Branch: chore/risk-register-m5-preview
> Short SHA: (pending commit)

---

## 1. 작업 요약

W16/M4 사전 양식 작업 후속. **RISK_REGISTER 통합 SoT가 없다**는 사실 발견 → 신규 작성하며 **R-28/R-29 ID 충돌 2건 추가 발견** → D-016/D-017 봉인 + R-33/R-34로 reroute. M5 entry preview + R-M5-01 사용자 reconfirm 양식 사전 작성.

읽은 SSOT:
- `docs/risk/` (미존재 확인 → 신규 디렉토리 생성)
- 15개 docs 파일 grep R-\d{2} (M0~M3 누적 risk 인벤토리)
- `docs/design/LESSON_CHAIN_PATTERN.md` (designer R-28 lesson chain)
- `docs/security/RLS_EVALUATOR_HYBRID_PLAN.md` §132~135 (security R-25/R-28/R-29 신규 등록)
- `docs/harness/M3_GATE_V2_DASHBOARD.md` §4 (orchestrator R-29 Phase 2 등록)
- `docs/product/MVP_SCOPE.md` §위험 (M1 R-01~08)

생성/갱신한 산출물:
- `docs/risk/RISK_REGISTER.md` (신규 SoT) — 34개 R-NN + 8개 sprint risk + R-28/R-29 충돌 해소 + risk→ADR 매핑 + 일자별 추적 trigger
- `docs/DECISION_LOG.md` — D-016 / D-017 봉인 + §5 변경 이력
- `docs/PROJECT_MAP.md` — `docs/risk/` 디렉토리 등재
- `context/rollups/20260512-R-M5-01-user-reconfirm-template.md` — PM 2026-06-02 송출 양식 (C-13 / Slack / 베타 모집 3건 + GA 일자 매트릭스 + 응답 기록 자리)
- `context/rollups/20260512-M5-entry-preview-dispatch.md` (신규) — M5-W19 12건 + W20 3건 + 10 게이트 + GA sensitivity
- `SWARM_LEDGER.md` entry 추가
- 본 context 기록

---

## 2. 핵심 결정 (D-016 + D-017 봉인 사유)

### D-016 R-28 충돌

- designer가 M2-S6 lesson chain 구현 시점에 **R-28(lesson chain STUB → 실 N-카드 fetch)** 등록. Cycle A에서 frontend가 R-28 해소 (closed candidacy)
- security가 W15 RLS_EVALUATOR_HYBRID_PLAN §134에서 **R-28(시드 데이터 신뢰성)**을 신규 등록 의도로 작성. 같은 ID 사용
- **해소**: designer R-28(lesson chain) ID 유지(먼저 등록 + closed candidacy), security가 작성한 "시드 데이터 신뢰성" risk를 **R-33**으로 reroute

### D-017 R-29 충돌

- orchestrator Cycle A Dashboard §4에서 **R-29(Phase 2 backend SRS module 본 구현 이전 M4 W17)** 등록
- security가 W15 RLS_EVALUATOR_HYBRID_PLAN §135에서 **R-29(pg_test_role JWT 만료 5분 short-lived)**를 신규 등록 의도로 작성. 같은 ID 사용
- **해소**: orchestrator R-29 ID 유지(먼저 등록 + M4 W17 closed 예정), security가 작성한 "pg_test_role JWT 만료"를 **R-34**로 reroute

### Root cause (D-014/D-015와 동일)

12명 agent 병렬 신규 R-NN 등록 시 **ID 슬롯 사전 분배 미실시** → 같은 번호 충돌. 본 사이클에서 RISK_REGISTER §6 "단일 SoT 원칙" + "ID 충돌 사전 차단" 정책 명시로 향후 차단.

---

## 3. RISK_REGISTER 작성 사유 및 영향 평가

| 평가 영역 | 결과 |
|---|---|
| 작성 전 상태 | 15개 SSOT에 R-NN 분산. agent별 risk 등록 시 충돌 가능성 인지 불가 |
| 작성 후 상태 | 단일 SoT. ID 충돌 즉시 감지 가능. risk→ADR 매핑 명시 |
| 발견된 충돌 | R-28(2개 의미) / R-29(2개 의미). 봉인 D-016/D-017 |
| sprint risk 분리 | R-W15-NN / R-W16-NN / R-M4-NN / R-M5-NN — 글로벌 R-NN과 분리해 namespace clean |
| 일자별 자동 갱신 trigger | 7건 (2026-05-13 ~ GA 일자) — orchestrator 다음 사이클 사용 |
| 비용 (orchestrator) | 1 사이클 (~2시간 작업), 누적 risk 인벤토리 + 충돌 해소 + sprint namespace 정리 |

---

## 4. M5 entry preview dispatch v0 작성 사유

M4 entry preview는 이전 사이클에서 작성. 동일 패턴으로 M5 entry preview를 미리 작성 → R-M5-01 응답 결과 반영만으로 v1 dispatch 발행 가능.

### v0 → v1 전환 trigger

- M4 게이트 PASS (2026-06-08)
- R-M5-01 사용자 응답 수신 (2026-06-06 deadline)
- GA 일자 확정 (6/15 vs 6/22)

### M5 작업 큐 15건 (W19 12 + W20 3)

- **운영 활성화 6** (C-13/Slack/약관/스토어/runbook/결제)
- **베타 모집 3** (모집 글/onboarding/CS)
- **실 baseline 14d 수집 3** (Day-0 시작/Mastered emit/첫 1주 피드백)
- **GA 출시 3** (심사/모니터링/handoff rollup)

### 10 게이트 조건 사전 정의

C-13 활성화 / Slack live / 약관 정식본 / 스토어 metadata / runbook 5종 / 결제 dry-run / 베타 30명 / CS active / 실 baseline 14d / 베타 KPI dashboard

---

## 5. R-M5-01 사용자 reconfirm 양식 작성 사유

PM W15 sprint board §2.4에서 M5 entry sprint(W19) 진입 직전 사용자 reconfirm 필수 3건이 정의됨. 양식이 없으면 PM이 즉석에서 작성해야 하므로 사전 양식 작성.

### 양식 구조

- §1 C-13 (5 sub-항목 + lead time 분석 + 응답 양식 + GA 영향)
- §2 Slack (5 sub-항목 + lead time + 응답 양식 + GA 영향)
- §3 베타 모집 (9 sub-항목 + lead time + 응답 양식 + GA 영향)
- §4 종합 GA 일자 매트릭스 (3건 응답 조합별 GA 권고)
- §5 PM 송출 후 응답 기록 자리
- §6 후속 작업 (응답 수신 후 4건)

### 사용자가 즉시 응답 가능한 형태

응답 양식이 [완료 / 진행 중 / 미시작] 같은 명확한 분기 또는 [일자 ____] 빈 자리만 채우면 valid. PM은 응답 결과만 §5에 기록.

---

## 6. SSOT 갱신 결과 (이번 사이클)

- `docs/risk/RISK_REGISTER.md` ✅ 신규 SoT (R-NN 34건 + sprint risk 8건)
- `docs/DECISION_LOG.md` ✅ D-016 / D-017 봉인 + §5 변경 이력
- `docs/PROJECT_MAP.md` ✅ docs/risk/ 디렉토리 등재
- `context/rollups/20260512-R-M5-01-user-reconfirm-template.md` ✅ 신규
- `context/rollups/20260512-M5-entry-preview-dispatch.md` ✅ 신규
- `SWARM_LEDGER.md` ✅ entry 추가
- 본 context 기록

HANDOFF / M3_GATE_V2_DASHBOARD는 본 사이클에서 갱신 없음 (RISK_REGISTER 신규 작성은 M3 게이트 조건과 무관, sprint 운영 도구).

---

## 7. Skill 사용 점검

orchestrator 본 사이클: 코드 0 / 문서 작성 5 (RISK_REGISTER + DECISION_LOG 갱신 + PROJECT_MAP + R-M5-01 양식 + M5 preview + context).
- humanizer: 미사용 (내부 운영 + 정책 문서)
- changelog-generator: 미사용 (외부 가시 변경 없음)
- 다른 agent skill 점검: 본 사이클은 단일 agent 작업

---

## 8. Risks / Open Questions

| 항목 | 내용 | 해소 시점 |
|---|---|---|
| Q-RR-1 | RISK_REGISTER 갱신 책임을 orchestrator가 단독으로? | 단일 SoT 원칙 (§6) — 단독 책임 |
| Q-RR-2 | sprint risk(R-W15/W16/M4/M5)가 sprint 종료 시 글로벌 promotion 정책 | RISK_REGISTER §6 정책 4 — orchestrator 매 sprint 종료 rollup에서 판정 |
| Q-RR-3 | agent가 신규 risk 등록 시 본 SoT 동시 등록 강제 방법 | AGENTS.md §5.3 갱신 규칙에 "risk 등록 시 RISK_REGISTER 동시 갱신" 1줄 추가 권고 (다음 사이클) |

---

## 9. 다음 사이클 권고

| 사이클 | 시점 | 트리거 |
|---|---|---|
| **B 통합** | T+5~7일 (2026-05-15~17) | W15-06b/07b unblock + W15-09/10 enum 활성화 |
| **C** | T+7일 (2026-05-18) | W15 sprint 종료 rollup + W16 진입 신호 |
| **W16 mid A** | 2026-05-20 화 | baseline Day-7~8 + ADR-0007 draft |
| **W16 mid B** | 2026-05-23 금 | ADR-0007 Accepted |
| **W16 종료 = M3 게이트** | 2026-05-25 일 | 10조건 검증 |
| **M3 completed** | 2026-05-26 화 | M4 dispatch v1 발행 |
| **M4 W17~W18** | 5/26~6/8 | 13 작업 + M4 게이트 |
| **R-M5-01 PM 알림** | 2026-06-02 화 | 본 양식 사용 |
| **M4 게이트 + M5 dispatch v1** | 6/8 일 | M5 dispatch v1 발행 |
| **M5 W19** | 6/9~6/15 | 15 작업 |
| **GA W20** | 6/15 또는 6/22 | 사용자 결정 |

---

## 10. 본 사이클 영향 평가

| 영향 영역 | 평가 |
|---|---|
| risk 추적성 | 양수 — 15개 SSOT 분산 → 단일 SoT, ID 충돌 사전 차단 정책 |
| 결정 봉인 | 양수 — D-016/D-017 발견 즉시 봉인 (cross-track 충돌 R-26 패턴 재발 차단) |
| M5 진입 lag | 양수 — preview dispatch + 사용자 양식 사전 준비로 M4 게이트 PASS 후 즉시 진입 가능 |
| 일정 sensitivity | 양수 — GA 일자 매트릭스로 사용자 결정 + lead time 가시화 |
| 비용 | orchestrator 1 사이클, 다른 agent 영향 없음 |

---

## 11. Definition of Done — 본 사이클

- [x] RISK_REGISTER 신규 SoT 작성 (R-NN 34 + sprint 8 + 충돌 해소)
- [x] D-016 / D-017 봉인 (R-28 / R-29 충돌 해소, security R-33/R-34 reroute)
- [x] PROJECT_MAP docs/risk/ 디렉토리 등재
- [x] M5 entry preview dispatch v0 사전 작성 (15 작업 + 10 게이트)
- [x] R-M5-01 사용자 reconfirm 양식 사전 작성 (3 영역 + GA 매트릭스)
- [x] SWARM_LEDGER entry
- [x] 본 context 기록
- [ ] (Cycle B 통합 시) 12명 + 7건 작업 통합 승인 + RISK_REGISTER 갱신
- [ ] (W18-05 시) M5 entry preview v1 전환
- [ ] (2026-06-02) PM이 R-M5-01 양식 사용자에게 송출
