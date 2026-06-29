# Orchestrator Context — AGENTS.md §5.4 Risk 정책 신설 + HARNESS_COMPLIANCE_AUDIT 신규 + CHANGELOG 신규

> Agent: orchestrator
> 일시: 2026-05-12 22:00 KST
> Branch: chore/policy-audit-changelog
> Short SHA: (pending commit)

---

## 1. 작업 요약

RISK_REGISTER 작성 사이클(20260512-2000) 후속. **헌장 정책 강화 + 5층 컴플라이언스 SoT + 외부 가시 변경 SoT** 3건 신규 작성.

### 작성 동기

1. **AGENTS.md §5.4 신설**: D-014/D-015/D-016/D-017 cross-track ID 충돌 4회 발현 — 12명 병렬 작업의 ID 슬롯 사전 분배 미실시 root cause. 헌장에 정책 강제 항목 명시
2. **HARNESS_COMPLIANCE_AUDIT.md 신규**: AGENTS.md §9에서 orchestrator 책임으로 명시되어 있으나 미존재. W16-03 게이트 검증의 입력 SSOT가 될 5층 매트릭스 작성
3. **CHANGELOG.md 신규**: AGENTS.md §5.3 갱신 규칙에 "외부 가시 변경 → CHANGELOG.md"로 등재되어 있으나 파일 미존재. M0~M2 retroactive 인벤토리 + M3 [Unreleased] + M4~GA 사전 예고

읽은 SSOT:
- `docs/risk/RISK_REGISTER.md` (직전 작업)
- `docs/architecture/HARNESS_LAYERED_ARCHITECTURE.md` (5층 정의)
- `docs/harness/M3_GATE_V2_DASHBOARD.md` (10조건)
- `AGENTS.md` (§5.3 / §9 책임 명시)
- `docs/DECISION_LOG.md` D-014~D-017 (cross-track 충돌 4건)

생성/갱신한 산출물:
- `AGENTS.md` §5.3 갱신 (3행 추가: risk register / 게이트 dashboard / 5층 컴플라이언스) + §5.4 신설 (Risk 등록 강제 정책 5조) + §11 변경 이력
- `docs/harness/HARNESS_COMPLIANCE_AUDIT.md` (신규) — 5층 컴플라이언스 매트릭스 + M3 게이트 매핑 + 10 Gap + M4~M5 trigger 일정 + orchestrator 책임 명시
- `CHANGELOG.md` (신규) — Keep a Changelog 1.1.0 준수, M0~M2 retroactive + M3 [Unreleased] + M4~GA 사전 예고 + 갱신 정책 5조
- `docs/PROJECT_MAP.md` — HARNESS_COMPLIANCE_AUDIT 상태 갱신
- `SWARM_LEDGER.md` entry 추가
- 본 context 기록

---

## 2. AGENTS.md §5.4 정책 5조 (cross-track 충돌 root cause 해소)

D-014 (RLS-ADV ID 충돌, security ↔ backend) / D-015 (SRS golden, analytics ↔ learning) / D-016 (R-28, designer ↔ security) / D-017 (R-29, orchestrator ↔ security) — 4건 모두 ID 슬롯 사전 분배 미실시가 원인. 헌장 §5.4 정책 5조로 향후 차단:

1. **단일 SoT 원칙**: RISK_REGISTER가 R-NN 최종 SoT
2. **ID 충돌 사전 차단**: 마지막 ID + 1 사용, 충돌 발견 즉시 escalate
3. **status 갱신 일자 명시**: closed 시 일자 + 해소 방법 + 증거 commit
4. **sprint risk → 글로벌 promotion**: R-W{NN}-NN / R-M{N}-NN이 sprint 종료 시 잔존하면 promotion 강제
5. **위반 시 처리**: orchestrator 머지 보류

### 이 정책의 cross-domain 적용

본 정책은 risk register 외에도 같은 패턴(fixture ID, golden ID, ADR ID, D-NNN ID 등 namespace 공유 ID)에 동일하게 적용 가능. 단일 SoT + 마지막 ID + 1 + 충돌 즉시 escalate.

---

## 3. HARNESS_COMPLIANCE_AUDIT 작성 사유 및 구조

### 작성 사유

AGENTS.md §9 "도구 선택은 서비스 규모에 맞춤. dash2zero MVP 단계에서는 가벼운 옵션 우선, M3에서 결정"으로 orchestrator 책임 명시되어 있음. M3 W15 Cycle A 시점 = 작성 최적 timing (게이트 검증 sprint 직전).

### 구조 (12절)

- §1~§5: 5층 각각 컴플라이언스 매트릭스
- §6: 종합 완성도 (Cycle B / M4 / GA 단계별 trajectory)
- §7: M3 게이트 10조건 ↔ 5층 매핑 (balanced cover 확인)
- §8: M3 통과 후 보강 작업 (M4 W17 / M4 W18 / M5 W19)
- §9: 컴플라이언스 위반 / Gap 10건 (G-01~G-10)
- §10: 갱신 trigger 일정 (Cycle B / W16 종료 / M3 종료 / M4 게이트 / GA)
- §11: orchestrator 책임 명시
- §12: 변경 이력

### 종합 완성도 (M3 W15 Cycle A 시점)

| Layer | 현재 | Cycle B 후 | M4 후 | GA 후 |
|---|---:|---:|---:|---:|
| L1 Contract | 95% | 95% | 100% | 100% |
| L2 Policy | 90% | 95% | 100% | 100% |
| L3 Retrieval | 80% | 95% | 100% | 100% |
| L4 Evaluation | 90% | 100% | 100% | 100% |
| L5 Observability | 70% | 80% | 95% | 100% |
| **평균** | **85%** | **93%** | **99%** | **100%** |

---

## 4. CHANGELOG 작성 사유 및 갱신 정책

### 작성 사유

AGENTS.md §5.3에서 "외부 가시 변경 → CHANGELOG.md (changelog-generator로)"로 갱신 규칙 등재되어 있으나 파일 미존재. M3 진행 중인 시점에 retroactive 작성 + 사전 양식.

### 외부 가시 변경 vs 내부 변경 경계

내부 변경 (CI 워크플로 / 테스트 fixture / SSOT 갱신 / risk register / context 기록)은 SWARM_LEDGER + 각 agent context 책임 — CHANGELOG 대상 아님.

외부 가시 변경 (앱 사용자, 베타 테스터, 외부 인수 팀에게 영향):
- M0~M2: 결제 / SRS / 인증 / TTS / 출시 국가 등 retroactive 인벤토리
- M3 [Unreleased]: lesson chain UX / paywall sign-in / 다국어 / 접근성 / Deprecated 이벤트
- M4~GA 예고: E2E suite / RLS hybrid / DSR 모듈 / Privacy Manifest / 베타 모집 / 약관 정식본 / GA 출시

### 갱신 정책 5조 명시

1. 매 마일스톤 종료
2. 이벤트 taxonomy 변경 (Deprecated alias 발화 기간 + 제거 시점)
3. 결제 / 환불 정책 변경
4. 데이터 처리 정책 변경
5. 외부 API breaking change

---

## 5. SSOT 갱신 결과 (이번 사이클)

- `AGENTS.md` ✅ §5.3 3행 추가 + §5.4 정책 5조 + §11 이력
- `docs/harness/HARNESS_COMPLIANCE_AUDIT.md` ✅ 신규 (5층 매트릭스 + 10 Gap)
- `CHANGELOG.md` ✅ 신규 (M0~M2 retroactive + M3 [Unreleased] + M4~GA 예고)
- `docs/PROJECT_MAP.md` ✅ HARNESS_COMPLIANCE_AUDIT 상태 갱신
- `SWARM_LEDGER.md` ✅ entry 추가
- 본 context 기록

---

## 6. Skill 사용 점검

orchestrator 본 사이클: 코드 0 / 문서 작성 4 (AGENTS.md 갱신 + HARNESS_COMPLIANCE_AUDIT + CHANGELOG + context).
- humanizer: 미사용 (헌장 + 정책 문서)
- changelog-generator: 본 사이클에서 사전 양식만 작성, 실 generation은 매 마일스톤 종료 시점
- 다른 agent skill 점검: 본 사이클은 단일 agent 작업

---

## 7. Risks / Open Questions

| 항목 | 내용 | 해소 시점 |
|---|---|---|
| Q-AUD-1 | HARNESS_COMPLIANCE_AUDIT 갱신을 sprint 종료마다 강제할지, 마일스톤 종료마다만 할지 | AGENTS.md §11 "매 sprint 종료 + 매 마일스톤 종료" 권고. orchestrator 판단 |
| Q-AUD-2 | Gap G-01 (RLS SoT 일원화)가 W16 ADR-0007 패턴 vs M4 W17-S2 어느 시점에 처리될지 | architect ADR-0007 작성 시 결정 |
| Q-CHG-1 | CHANGELOG의 [Unreleased] → 마일스톤별 release tag 전환 정책 | M3 종료(2026-05-26) 시점에 첫 release tag `M3-completed-2026-05-26` 권고 |
| Q-AGT-1 | §5.4 정책이 미발효 risk(다음 cross-track 충돌 발생 시 어떻게 강제) | orchestrator가 매 사이클 시작 시 RISK_REGISTER 마지막 ID 명시로 사전 공유 |

---

## 8. 본 사이클 영향 평가

| 영향 영역 | 평가 |
|---|---|
| 헌장 강도 | 양수 — §5.4 정책으로 cross-track 충돌 향후 차단 |
| 컴플라이언스 추적성 | 양수 — 5층 매트릭스로 게이트 검증 입력 SSOT 확보 |
| 외부 가시 변경 추적 | 양수 — CHANGELOG으로 외부 인수 시 첫 읽을 문서 확보 |
| Gap 가시화 | 양수 — 10 Gap 등재로 sprint별 해소 trigger 명확화 |
| 비용 | orchestrator 1 사이클 (~1.5시간), 다른 agent 영향 없음 |

---

## 9. 다음 사이클 권고

본 사이클로 orchestrator 사전 양식 작업 마감. 다음 사이클부터는 12명 agent의 실 작업 결과 대기 + 통합 승인.

| 사이클 | 시점 | 트리거 |
|---|---|---|
| **B 통합** | 2026-05-15~17 | W15-06b/07b unblock + W15-09/10 enum 활성화 |
| **C** | 2026-05-18 | W15 sprint 종료 rollup |
| **W16 mid A** | 2026-05-20 | baseline Day-7~8 + ADR-0007 draft |
| **W16 mid B** | 2026-05-23 | ADR-0007 Accepted |
| **W16 종료 = M3 게이트** | 2026-05-25 | 10조건 검증 + HARNESS_COMPLIANCE_AUDIT 최종 |
| **M3 completed** | 2026-05-26 | M4 dispatch v1 발행 + CHANGELOG M3 release tag |

---

## 10. Definition of Done — 본 사이클

- [x] AGENTS.md §5.3 갱신 (3행 추가) + §5.4 Risk 등록 강제 정책 5조 신설 + §11 이력
- [x] HARNESS_COMPLIANCE_AUDIT.md 신규 (5층 매트릭스 + M3 게이트 매핑 + 10 Gap + trigger 일정)
- [x] CHANGELOG.md 신규 (M0~M2 retroactive + M3 [Unreleased] + M4~GA 예고)
- [x] PROJECT_MAP HARNESS_COMPLIANCE_AUDIT 상태 갱신
- [x] SWARM_LEDGER entry
- [x] 본 context 기록
- [ ] (Cycle B 통합 시) RISK_REGISTER / COMPLIANCE_AUDIT / CHANGELOG 동시 갱신
- [ ] (M3 종료 시) CHANGELOG `M3-completed` release tag + COMPLIANCE_AUDIT 최종 score
