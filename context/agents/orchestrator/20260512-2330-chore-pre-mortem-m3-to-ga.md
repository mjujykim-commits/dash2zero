# Orchestrator Context — Pre-Mortem M3→GA 신규 (사용자 선택 — 사전 작업 최종)

> Agent: orchestrator
> 일시: 2026-05-12 23:30 KST
> Branch: chore/pre-mortem-m3-to-ga
> Short SHA: (pending commit)

---

## 1. 작업 요약

사용자 명시 선택(AskUserQuestion: "Pre-mortem M3→GA 작성 (Recommended)")에 따른 8번째 orchestrator 사이클. **사전 작업 누적 최종**.

읽은 SSOT:
- `docs/risk/RISK_REGISTER.md` (R-NN 22 + sprint risk 8)
- `context/rollups/20260512-M4-entry-preview-dispatch.md` (M4 W17 ~ W18 작업 큐)
- `context/rollups/20260512-M5-entry-preview-dispatch.md` (M5 W19 + W20 작업 큐)
- `docs/harness/M3_GATE_V2_DASHBOARD.md` (10조건 게이트)
- `docs/harness/HARNESS_COMPLIANCE_AUDIT.md` (5층 + 10 Gap)
- 12명 시니어 W15 1차 산출물 context (Cycle A 점검 결과 활용)

생성/갱신한 산출물:
- `docs/runbooks/PRE_MORTEM_M3_TO_GA.md` (신규) — 8 도메인 × 30 시나리오 + risk score 매트릭스 + 일자별 처리 일정
- `context/rollups/20260512-M4-entry-preview-dispatch.md` (갱신) — W17-S3 보강 (Play Console 데이터 안전성 양식 추가, Pre-mortem Sx-04 mitigation)
- `docs/PROJECT_MAP.md` (갱신) — PRE_MORTEM_M3_TO_GA 등재
- `SWARM_LEDGER.md` entry 추가
- 본 context 기록

---

## 2. Pre-mortem 작성 사유 및 구조

### 작성 사유

사전 양식 작업이 7 사이클 누적되어 한계점 도달. 사용자에게 AskUserQuestion으로 명시 선택을 받았고, 사용자는 "Pre-mortem M3→GA 작성"을 선택. Pre-mortem은:

- **회고적이 아닌 사전적** 분석 — "출시 후 6개월 시점에 왜 망가졌나?" 가정으로 시작
- 각 시나리오에 발화 확률 × 영향 = risk score 부여
- score ≥ 4 인 시나리오는 GA 차단 후보 (집중 mitigation)
- M5 모니터링 + post-GA 1주 review 입력 SSOT

### 구조 (8 도메인 × 30 시나리오)

| 도메인 | 시나리오 수 | score ≥ 4 |
|---|---:|---:|
| §1 보안 (security) | 4 | 2 (S-01, S-04) |
| §2 결제 (backend + legal) | 4 | 0 |
| §3 콘텐츠/학습 (content + learning) | 4 | 1 (C-01) |
| §4 Baseline / Observability (analytics + devops) | 4 | 1 (B-02) |
| §5 스토어 / 출시 (devops + frontend + legal) | 4 | 3 (Sx-01, Sx-02, Sx-04) |
| §6 운영 / 1인 개발자 (pm + 사용자) | 4 | 0 |
| §7 도구 / SaaS (backend + architect + analytics + devops) | 4 | 0 |
| 추가 | 2 | 1 (P-04 변형) |
| **합계** | **30** | **8** |

### Risk Score 계산

- 발화 확률 L=1 / M=2 / H=3, 영향 L=1 / M=2 / H=3
- score = 발화 × 영향 / 표시: LL=1, LM/ML=2, LH/HL/MM=3, MH/HM=4, HH=5
- score ≥ 4 = GA 차단 후보 (집중 mitigation 필수)

---

## 3. 신규 발견 사항: Sx-04 Play 데이터 안전성 양식 미명시

Pre-mortem 작성 중 발견:
- Apple Privacy Manifest는 M4 W17-S3에 명시 (security agent 작업)
- **Play Console 데이터 안전성 양식**은 별도 양식이며 M4 dispatch v0 W17-S3 산출물에 명시되지 않았음
- Privacy Manifest와 cross-check 필요 (양 스토어 모두 출시 차단 항목)

**조치**: M4 entry preview dispatch v0 W17-S3 산출물 보강 commit (사용자 명시 결정 없이 orchestrator 자율 — 단순 누락 보강)

---

## 4. score ≥ 4 GA 차단 후보 8건과 처리 시점 매핑

| ID | 시나리오 | 책임 | 처리 시점 |
|---|---|---|---|
| S-01 | RLS 우회 (premium audio) | security + backend | M4 W17-S2 (5/27~28) |
| S-02 | audit_log 누락 (GDPR) | security + backend | M5 W19-O5 (6/11~) |
| S-04 | Privacy Manifest 누락 | security + legal | M4 W17-S3 (5/28) |
| C-01 | lesson_complete < 60% (실 사용자) | pm + planner + analytics | M5 W19-D3 (6/13) |
| B-02 | 실 baseline KPI < Minimum | analytics + pm + planner | M5 W19-D3 (6/13) |
| Sx-01 | Apple Beta App Review 반려 | security + legal + devops | M4 W17 (5/27~28) + GA 직전 |
| Sx-02 | GA 후 crash > 1% | qa + devops | GA 후 hotfix (D-0~7) |
| Sx-04 | Play 데이터 안전성 양식 미완 | security + legal + devops | M4 W17-S3 (5/28, 신규 보강) |

**총 8건 중 M4 처리 5건 + M5 처리 2건 + GA 후 1건** — M4 sprint 압박 (5건 동시 처리) 주의.

---

## 5. SSOT 갱신 결과

- `docs/runbooks/PRE_MORTEM_M3_TO_GA.md` ✅ 신규 (8 도메인 × 30 시나리오 + score 매트릭스 + 일정)
- `context/rollups/20260512-M4-entry-preview-dispatch.md` ✅ 갱신 (W17-S3 Play 데이터 안전성 추가)
- `docs/PROJECT_MAP.md` ✅ 갱신 (PRE_MORTEM 등재)
- `SWARM_LEDGER.md` ✅ entry 추가
- 본 context 기록

DECISION_LOG / RISK_REGISTER / HARNESS_COMPLIANCE_AUDIT / DECISION_RISK_ADR_MATRIX 본 사이클에서 갱신 없음 (Pre-mortem은 새로운 SSOT 작성, 기존 결정/risk와 별도 layer).

---

## 6. Skill 사용 점검

orchestrator 본 사이클: 코드 0 / 문서 작성 2 (Pre-mortem + context) + dispatch 보강 1.
- humanizer: 미사용 (운영 문서)
- changelog-generator: 미사용
- 다른 agent skill 점검: 본 사이클은 단일 agent 작업

---

## 7. Risks / Open Questions

| 항목 | 내용 | 해소 시점 |
|---|---|---|
| Q-PM-1 | Pre-mortem이 실 발생 시 retrospective와 정합 검증 가능한가 | GA 후 6개월 review |
| Q-PM-2 | score ≥ 4 시나리오 8건의 동시 처리가 M4 sprint(2 sprint) 안에 가능한가 | M4 W17 mid-sprint 진단 |
| Q-PM-3 | Sx-04 Play 데이터 안전성 양식 추가 작업이 W17-S3 부하 증가 — 분리 가능한가 | M4 W17 D-3 진단 |

---

## 8. 사전 작업 최종 마감 선언 (8 사이클 누적, 2026-05-12)

| 사이클 | 시각 | 핵심 산출물 |
|---|---|---|
| 1 | 12:00 | Cycle A 통합 — D-014/D-015 / ADR-0006 Accepted / D-013 |
| 2 | 14:00 | Cycle B dispatch — W15 후반 7건 |
| 3 | 17:00 | W16/M3/M4 사전 양식 — 3건 |
| 4 | 20:00 | RISK_REGISTER + D-016/D-017 + R-M5-01 + M5 preview |
| 5 | 22:00 | AGENTS §5.4 + COMPLIANCE_AUDIT + CHANGELOG |
| 6 | 23:00 | Cross-Reference Matrix + Artifacts Inventory |
| 7 | (단일 timestamp) | Pre-mortem M3→GA + M4 dispatch 보강 |

**누적**: 신규 ~20 파일 + 갱신 ~17 파일

### 다음 사이클부터는 12명 agent 실 작업 결과 대기

- Cycle B 통합 (2026-05-15~17): W15-09/10/02b/04b/06b/07b/11 작업물 통합 승인
- Cycle C (2026-05-18): W15 sprint 종료 rollup
- W16 mid A/B (5/20, 5/23): baseline + ADR-0007
- W16 종료 (5/25): M3 게이트 10조건 검증
- M3 completed (5/26): M4 dispatch v1 발행

**orchestrator는 본 사이클로 사전 작업 마감. 다음 호출은 실 작업 결과 도착 시점.**

---

## 9. Definition of Done — 본 사이클

- [x] Pre-mortem M3→GA 신규 작성 (8 도메인 × 30 시나리오 + risk score)
- [x] score ≥ 4 GA 차단 후보 8건 처리 일정 매핑
- [x] Sx-04 Play 데이터 안전성 양식 신규 발견 → M4 W17-S3 dispatch 보강
- [x] PROJECT_MAP PRE_MORTEM 등재
- [x] SWARM_LEDGER entry
- [x] 본 context 기록
- [ ] (Cycle B 통합 시) Pre-mortem score ≥ 4 시나리오 8건 중 W15 sprint 영향 점검
- [ ] (M5 진입 시) Pre-mortem이 monitoring SoT로 활용 시작
- [ ] (GA 후 6개월) retrospective 작성 — pre-mortem 실 발생률 측정

---

## 10. 본 사이클 영향 평가

| 영향 영역 | 평가 |
|---|---|
| risk 가시화 | 양수 — 30 시나리오 단일 SoT, score 매트릭스로 GA 차단 후보 우선순위 명확 |
| M4 sprint 부하 | 음수 — M4 W17에 5건 동시 처리 압박 (S-01/S-04/Sx-01/Sx-04 + 기존 8건) |
| M5 monitoring 입력 | 양수 — score ≥ 4 시나리오 8건이 monitoring daily check 입력 |
| GA 후 retrospective | 양수 — 실 발생률 측정으로 다음 프로젝트에 학습 |
| 비용 | orchestrator 1 사이클 (~1시간), 다른 agent 영향 없음 |

---

## 11. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-12 23:30 | Pre-mortem M3→GA 신규 + M4 W17-S3 Play 데이터 안전성 보강 + 사전 작업 8 사이클 누적 최종 마감 |
