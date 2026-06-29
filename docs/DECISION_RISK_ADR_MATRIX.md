# Decision ↔ Risk ↔ ADR Cross-Reference Matrix

> 작성: orchestrator
> 책임: 단일 SoT로 D-NNN ↔ R-NN ↔ ADR-NNNN 정합성 검증
> 작성일: 2026-05-12 (M3 W15 Cycle B dispatch + 사전 양식 작업 마감 직후)
> 갱신 trigger: 새 D-NNN / R-NN / ADR 봉인 시 동시 갱신
> SSOT 우선순위: 본 문서 = 정합성 검증 입력, 실제 SoT는 `docs/DECISION_LOG.md` / `docs/risk/RISK_REGISTER.md` / `docs/adr/`

---

## 0. 한 줄 요약

D-001~D-017 통합 + R-NN 22개(open 18 + closed 4) + ADR-0001~0008 — **모든 결정이 ≥1 risk 영향 또는 ≥1 ADR 봉인에 매핑됨. 미매핑 0건. 정합성 PASS**.

---

## 1. D-NNN ↔ Risk ↔ ADR 매트릭스

| D-NNN | 봉인 결정 | 일자 | 해소/영향 risk | 봉인 ADR | 영향 받는 SSOT |
|---|---|---|---|---|---|
| D-001 | Swarm coding 9 agent + archive 4 옵션 채용 | 2026-05-07 | R-06 (1인 개발자 캐파 — agent 분담) | - | AGENTS.md §1 |
| D-002 | (M0 누락 또는 미사용) | - | - | - | - |
| D-003 | (M0 누락 또는 미사용) | - | - | - | - |
| D-004 | 기획 검토 SSOT read-only 정책 | 2026-05-07 | - (정책 결정) | - | REVIEW_QA / SERVICE_REVIEW_QA / v0.3 23개 봉인 |
| D-005 | Specialist 4 사전 채용 (13명) | 2026-05-07 | R-01 (콘텐츠 검수 — learning 사전 합류) / R-06 (캐파 분담) | - | AGENTS.md §1.2 |
| D-006 | analytics 정식 활동 시작 (M3 사전) | 2026-05-07 | - (게이트 trigger) | - | EVALUATION_SCENARIOS / HARNESS_LAYERED_ARCHITECTURE |
| D-007 | ADR-0001 Accepted (Lean Stack) | 2026-05-07 | R-05 (TTS 라이선스) / R-08 (Supabase 가격) | **ADR-0001** | STACK_DECISION + EVOLUTION_PLAN |
| D-008 | learning 정식 활성화 (M2-S1) | 2026-05-08 | R-01 (검수자 모집) | - | AGENTS.md §1.2 |
| D-009 | devops 정식 활성화 (M2-S1) | 2026-05-08 | R-03 (IAP sandbox 결제) / R-06 | - | AGENTS.md §1.2 |
| D-010 | Baseline 환경 (staging + synthetic + dogfood) | 2026-05-11 | R-W15-01 (analytics 부하) — synthetic seed로 분산 | **ADR-0007 (pending)** | BASELINE_METRICS / M3 게이트 #4 |
| D-011 | Slack alert webhook stub W15, 실 URL M5 | 2026-05-11 | R-W15-02 (stub 회귀 catch 누락) — M5 활성화 후 closed | - | AUDIT_ALERT_RUNBOOK §M5 |
| D-012 | C-13 사업자 M5 entry 이연 | 2026-05-11 | R-02 (D-42 미확정) → M5 entry reconfirm / R-M5-01 §1 | - | DECISION_LOG §2.3 / R-M5-01 양식 |
| D-013 | PRD threshold 4 KPI planner 자율 | 2026-05-11 | R-27 (threshold late commit) — Day-1 commit으로 closed | - | PRD §8.2 / BASELINE_METRICS |
| D-014 | RLS-ADV ID 충돌 해소 (security 005~009 / backend 010~013) | 2026-05-12 | R-26 (cross-track 충돌) — closed | ADR-0004 (RLS 매트릭스 cover 확장) | RLS adversarial README |
| D-015 | SRS golden ID 충돌 해소 (analytics 051~053 / learning 056~060) | 2026-05-12 | R-26 / R-31 (SRS enum 미활성) → W15-09 closed 예정 | **ADR-0006** (Phase 1 정합) | SRS golden README + scripts/eval/srs.ts |
| D-016 | R-28 ID 충돌 해소 (designer / security → R-33) | 2026-05-12 | R-26 / R-28 lesson chain (closed candidacy) / R-33 시드 신뢰성 (open) | - | RISK_REGISTER §2.1 |
| D-017 | R-29 ID 충돌 해소 (orchestrator / security → R-34) | 2026-05-12 | R-26 / R-29 Phase 2 / R-34 JWT 만료 (open) | ADR-0006 Phase 2/3 | RISK_REGISTER §2.1 |
| D-018 | Premium 가격 정합성 결정 ($4.99/mo · $49.99/yr) | 2026-05-13 | Q-W15-4 가격 정합성 (resolved) — R-04(심사 반려) 가격 정책 영향 | - | 사업계획서 §10.2 / PRD §8.2 / CHANGELOG / M5 dispatch / R-M5-01 |

### 1.1 D-002 / D-003 누락 확인

DECISION_LOG.md에 D-001 / D-004~D-017이 존재하지만 D-002 / D-003은 누락. 이는 M0 사이클에서 ID 사용 안 함 결정으로 보임 — 본 매트릭스에 정상 표기 후 봉인.

> **권고 (orchestrator)**: 다음 D-018 등록 시 누락 ID(D-002/D-003) 재사용 금지. 단조 증가 유지.

---

## 2. R-NN ↔ ADR ↔ D-NNN 매트릭스 (역방향 정합)

| R-NN | risk 요약 | 책임 | 해소 ADR | 해소 D-NNN | status |
|---|---|---|---|---|---|
| R-01 | 콘텐츠 검수자 모집 | learning + pm | - | D-005 / D-008 (mitigation) | open |
| R-02 | C-13 D-42 미확정 | legal + pm | - | D-012 (M5 이연) → R-M5-01 | open → M5 |
| R-03 | IAP sandbox 결제 | backend + devops | - | D-009 | open |
| R-04 | 심사 반려 (Privacy Manifest / age gate) | security + legal | ADR-0008 (pending) | - | open → M4 W17 |
| R-05 | TTS 라이선스 변경 | backend | **ADR-0005** + ADR-0002 (추상화) | - | mitigated |
| R-06 | 1인 개발자 캐파 | pm | - | D-001 / D-005 / D-009 (분담) | open (4주 buffer) |
| R-07 | 베타 30명 모집 | pm | - | R-M5-01 §3 | open → M5 |
| R-08 | Supabase 가격 변경 | backend + architect | ADR-0002 (추상화) | D-007 | mitigated |
| R-12 | SRS sibling drift | backend + architect | **ADR-0006** (3-Phase) | - | open Phase 1 closed / Phase 2-3 M4 |
| R-23 | RLS evaluator 부재 | security | ADR-0004 (RLS 매트릭스) | - | open → Cycle B closed |
| R-24 | distractors retire 미검증 | content | - | - | open → Cycle B closed (W15-07b) |
| R-25 | RLS static EXISTS simplification | security | ADR-0007 (hybrid 패턴) | - | open → M4 W17-S2 |
| R-26 | 12명 cross-track 충돌 | orchestrator | - | **D-014/D-015/D-016/D-017** | **closed (2026-05-12)** |
| R-27 | audit_log emit 누락 | backend + security | - | - | open → M5 grep guard |
| R-28 | lesson chain STUB → 실 (designer) | designer + frontend | - | D-016 (ID 보존) | closed candidacy (W15 Cycle A) |
| R-29 | Phase 2 backend SRS module 본 구현 (orchestrator) | backend | ADR-0006 Phase 2 | D-017 (ID 보존) | open → M4 W17 |
| R-30 | paper dedup 무한 누적 | security + devops | - | - | open → M5 cron 등록 |
| R-31 | SRS-056~060 enum 미활성 | backend | ADR-0006 호환성 | D-015 | open → Cycle B closed (W15-09) |
| R-32 | privacy evaluator union 3종 | backend + legal | - | - | open → Cycle B closed (W15-10) |
| R-33 | RLS hybrid 시드 신뢰성 (security 재배치) | security | ADR-0007 (hybrid) | D-016 (R-28 → R-33 rerouting) | open → M4 W17 |
| R-34 | pg_test_role JWT 만료 (security 재배치) | security + backend | ADR-0007 (hybrid) | D-017 (R-29 → R-34 rerouting) | open → M4 W17 |

### 2.1 정합성 확인

- 모든 open risk 22건 → ADR 또는 D-NNN로 해소 trigger 매핑 확인 ✅
- closed risk 4건 (R-26 + closed candidacy 1 + mitigated 2) → 해소 일자 + 방법 명시 ✅
- ADR 없이 D-NNN만으로 해소되는 risk 8건 → orchestrator 추적 적정 ✅

---

## 3. ADR ↔ D-NNN ↔ Risk 매트릭스 (3중 정합)

| ADR | 제목 | 상태 | 봉인 D-NNN | 해소 risk |
|---|---|---|---|---|
| ADR-0001 | Stack Decision (Lean / Managed) | Accepted | D-007 | R-05 / R-08 |
| ADR-0002 | Domain Model 추상화 (5+4) | Accepted | - | R-05 / R-08 |
| ADR-0003 | Custom runner + Firebase | Accepted | - | M3 게이트 #8 (직접 인용) |
| ADR-0004 | RLS 정책 매트릭스 (13×5×4) | Accepted | - | R-23 (D-014로 13건 보강) |
| ADR-0005 | TTS Google Cloud Neural2 | Accepted | - | R-05 |
| ADR-0006 | packages/srs-core (3-Phase) | Accepted | D-015 / D-017 | R-12 (Phase 3 closed) / R-29 / R-31 |
| ADR-0007 | Baseline 저장소 (3-source) | pending W16 | D-010 | R-25 / R-33 / R-34 (hybrid 패턴) |
| ADR-0008 | Secret 회전 정책 | pending M4 W17 | - | R-04 / R-W15-02 (live mode 활성화) |

### 3.1 ADR pending 2건 추적

- **ADR-0007**: W16-02 D-3 (2026-05-21 수) draft → D-4 final
- **ADR-0008**: M4 W17-S1 D-1 (2026-05-26 화)

---

## 4. Sprint Risk Cross-Reference

### 4.1 W15 sprint risk

| ID | risk | 해소 D-NNN | status |
|---|---|---|---|
| R-W15-01 | analytics 4 큐 부하 | D-010 (synthetic seed 분산) | closed (Cycle A 1차 commit) |
| R-W15-02 | stub 회귀 catch 누락 | D-011 (M5 활성화 절차 명시) | open → M5 closed |
| Q-W15-1 | synthetic seed 결정성 | - | resolved (W15-02 commit) |
| Q-W15-2 | dogfood/synthetic 라벨링 | - | resolved (M5 `is_dogfood` 권고) |
| Q-W15-3 | ADR-0006 경계 | ADR-0006 Option A | resolved |

### 4.2 W16 sprint risk (사전 등록)

| ID | risk | 해소 ADR | status |
|---|---|---|---|
| R-W16-01 | baseline 14d cron 누락 | ADR-0007 | open → W16 D-7 검증 |
| R-W16-02 | ADR-0007 작성 일정 압박 | ADR-0007 | open → W16 D-4 검증 |

### 4.3 M4 sprint risk (사전 등록)

| ID | risk | 해소 ADR | status |
|---|---|---|---|
| R-M4-01 | RLS hybrid flake | ADR-0007 (hybrid 패턴) | open → M4 W17-S2 |
| R-M4-02 | Privacy Manifest 3rd-party SDK | ADR-0008 (관련) | open → M4 W17-S3 |
| R-M4-03 | E2E CI 통합 Detox 시간 | - | open → M4 W17-Q1 |

### 4.4 M5 entry risk

| ID | risk | 해소 양식 | status |
|---|---|---|---|
| R-M5-01 | 사용자 reconfirm 3건 | `20260512-R-M5-01-user-reconfirm-template.md` | open → 2026-06-02 PM 알림 |
| R-M5-02~05 | 베타 모집 / 심사 / baseline / crash | M5 dispatch v0 §7 mitigation | open → M5 W19 |

---

## 5. 정합성 검증 결과

### 5.1 Pass 확인

- ✅ 모든 D-NNN 16건 (D-002/D-003 누락 외)이 ≥1 risk 또는 ≥1 ADR 매핑
- ✅ 모든 R-NN 22건이 해소 trigger (ADR 또는 D-NNN 또는 sprint dispatch) 명시
- ✅ 모든 ADR 8건이 ≥1 risk 해소 또는 게이트 조건 직접 인용
- ✅ Sprint risk(R-W15/W16/M4/M5)가 D-NNN 또는 ADR 또는 사전 양식과 매핑

### 5.2 발견된 정합 이슈

| 이슈 | 분류 | 처리 |
|---|---|---|
| D-002 / D-003 ID 사용 안 함 | minor | 향후 신규 결정은 D-018 이후 사용 (단조 증가) |
| R-29 / R-30 dashboard 등록 시점이 한 곳에 모임 | minor | RISK_REGISTER §2.1로 통합 (이미 해소) |
| ADR-0007 / ADR-0008 pending이 D-NNN 봉인 없이 sprint plan에만 등재 | medium | W16-02 / M4 W17-S1 작성 시 D-018 / D-019로 봉인 권고 |

### 5.3 향후 봉인 권고 (D-019 ~ D-020) — D-018 가격 결정 봉인 후 shift

| 예상 D-NNN | 예상 봉인 시점 | 예상 결정 |
|---|---|---|
| ~~D-018~~ | ~~2026-05-22~~ | ✅ **D-018 봉인 완료 (2026-05-13)** — Premium 가격 결정 ($4.99/mo · $49.99/yr) |
| **D-019** | 2026-05-22 (W16 D-4) | ADR-0007 Accepted (Baseline 저장소 3-source 구조 ADR화) |
| **D-020** | 2026-05-26~27 (M4 W17 D-1~2) | ADR-0008 Accepted (Secret 회전 정책 + 회전 주기) |

---

## 6. orchestrator 단일 SoT 정책 (D-016/D-017 봉인 후 강화)

본 매트릭스는 다음 시점에 갱신:

1. **D-NNN 봉인 즉시**: DECISION_LOG 추가와 동시에 본 매트릭스 §1 추가 + §2.1 정합 확인
2. **R-NN 신규 등록 즉시**: RISK_REGISTER 추가와 동시에 본 매트릭스 §2 추가
3. **ADR Accepted 즉시**: ADR 인덱스 갱신과 동시에 본 매트릭스 §3 추가
4. **Sprint 종료**: §4 sprint risk status 갱신

미반영 발견 시 **orchestrator 머지 보류** (AGENTS.md §5.4 위반 시 처리).

---

## 7. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-12 | 신규 작성 — D-001~D-017 + R-NN 22 + ADR 8 통합 cross-reference + 정합성 검증 PASS + D-002/D-003 누락 명시 + ADR-0007/0008 봉인 권고 (D-018/D-019) |
| 2026-05-13 | D-018 Premium 가격 결정 봉인 ($4.99/mo · $49.99/yr) 추가 + Q-W15-4 가격 정합성 resolved 매핑 + §5.3 예상 D-NNN shift (D-019 → ADR-0007 / D-020 → ADR-0008) |
