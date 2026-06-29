# Orchestrator Context — M3 W15 Cycle A 통합 점검 (ID 충돌 2건 해소)

> Agent: orchestrator
> 일시: 2026-05-12 12:00 KST
> Branch: chore/m3-w15-cycle-a-integration
> Short SHA: (pending commit)

---

## 1. 작업 요약

dispatch v2 직후 12명 시니어가 T+0 시점(2026-05-11 23:00)에 1차 산출물을 동시 제출. orchestrator는 T+~13시간 시점(2026-05-12 12:00)에 사이클 A 통합 점검 호출(원래 dispatch plan §8에서는 T+3일 예정이었으나 산출물이 이미 도착했으므로 즉시 진입).

읽은 SSOT:
- `context/rollups/20260511-M3-W15-dispatch-plan-v2.md` (v2 dispatch)
- 12명 시니어 context 기록 전부 (`context/agents/{role}/20260511-2200~2300-*.md`)
- `fixtures/adversarial/rls/` 전체 yaml + README
- `fixtures/golden/srs/SRS-051~060.yaml` + README
- `docs/DECISION_LOG.md` (D-010~D-013 + ADR 인덱스)

생성/갱신한 산출물:
- `docs/DECISION_LOG.md` — D-014 (RLS ID 충돌) + D-015 (SRS ID 충돌) 봉인 + D-013 검증 표기 + ADR-0006 Accepted 등재 + §5 변경 이력
- `fixtures/adversarial/rls/RLS-ADV-{006~009}-*.yaml` → `RLS-ADV-{010~013}-*.yaml` rename + `id:` 필드 4건 갱신
- `fixtures/adversarial/rls/README.md` — 분포표 9 → 13 + D-014 정책
- `fixtures/golden/srs/SRS-{051~055}.yaml` → `SRS-{056~060}-*-slug.yaml` rename + `id:` 필드 5건 갱신
- `fixtures/golden/srs/README.md` — 분포표 52 → 57 + Cycle A 절 신설 + evaluator enum 확장 5종
- `context/rollups/20260512-M3-W15-cycle-a-integration.md` — Cycle A 통합 점검 rollup
- `SWARM_LEDGER.md` Cycle A entry (다음 단계 동일 commit)
- 본 context 기록

---

## 2. 핵심 결정 (D-014 + D-015 봉인 사유)

### D-014: RLS adversarial ID 충돌

- security가 W15 진입 시 RLS-ADV-005를 점유한 후 ADV-006~009도 STRIDE 매트릭스 cover로 연속 작성. backend는 readiness §10에서 005=service_role positive로 인지했지만 W15 진입 후 security가 점유한 사실 확인 → backend 자율 재배치로 006~009에 evaluator 분기 cover 시나리오 4건 추가
- 디스크에 두 트랙이 다른 파일명으로 공존 (RLS-ADV-006-expired-entitlement vs RLS-ADV-006-service-role) → logical ID 충돌
- 해소: security 5건(STRIDE cover) 우선, backend 4건(evaluator 분기 cover) 010~013으로 rename. 두 트랙 모두 보존
- 정책: 다음 신규 시나리오는 014부터 사용

### D-015: SRS golden ID 충돌

- analytics는 dispatch plan v2 §2에서 SRS golden lead 명시. SRS-051~053을 stage_correct/mastered_protection enum으로 흡수해 slug 형식 파일로 작성
- learning은 호출자(orchestrator) 직접 지시로 "SRS-051~055 = learning 슬롯"으로 인지하고 단순 ID 파일로 작성 (interruption-resume/dormant-14d/audio-mismatch/same-session-repeat/weak-clear 5건)
- 의미는 모두 다르지만 logical ID 동일 → 충돌
- 해소: analytics 점유 우선(dispatch §2 lead 명시), learning 5건을 SRS-056~060으로 rename + 5개 신규 evaluator category enum 활성화는 W16 D1 backend 작업 큐

### 두 충돌의 공통 root cause

dispatch plan v2 §2 "12명 작업 트랙" 표가 큰 영역(예: SRS golden 28건)을 lead/협업 페어로만 명시하고 **개별 ID 슬롯을 사전 분배하지 않았음**. 12명 병렬 착수 시 cross-track 충돌은 예상된 리스크(R-26)였고 두 ID 영역에서 실제 발현. 다음 dispatch(W16/M4)부터는 ID 슬롯 사전 분배 권고.

---

## 3. ADR-0006 Accepted 판정 근거

architect가 작성한 ADR-0006(`docs/adr/ADR-0006-shared-srs-module.md`)을 검토. orchestrator 승인 기준 4건 모두 충족:

| 기준 | 검토 결과 |
|---|---|
| 경계 명확 (packages/srs-core 또는 _shared/srs.ts) | ✅ `packages/srs-core` workspace 패키지, tsup ESM/CJS dual |
| Reversal Trigger 명시 | ✅ Option B (코드 생성) / Option C (parity-check) 거부 사유 명시, Phase 1/2/3 분리 |
| R-12 SoT drift 패턴 SRS 구현 정합 | ✅ Phase 3 M4 W17에서 sibling 제거 시 R-12 closed 명시 |
| 운영 부담 평가 | ✅ 신규 SaaS 0 / 신규 운영 컴포넌트 0 / CI 시간 +2~3초 / 운영 컴포넌트 5개 그대로 |

ADR 상태 = **Accepted** 봉인. DECISION_LOG §4 ADR 인덱스 갱신.

---

## 4. D-013 PRD threshold 승인 근거

planner가 `docs/product/PRD.md §8.2`에 4 KPI band commit. 본 사이클에서 검증:

| KPI | Target | Minimum | 출처 |
|---|---:|---:|---|
| D-3 retention | 35% | 25% | Sensor Tower 2024 학습앱 median |
| Day-1 streak 유지율 | 60% | 45% | Duolingo 1년차 70% 보정 −10%p |
| lesson_complete_rate | 75% | 60% | learning agent LESSON_COMPLETE_RATE_THRESHOLDS.md |
| paywall_view_to_purchase | 4% | 2% | B2C SaaS subscription median 3–5% |

D-013 §승인 기준 충족: 출처 1줄 이상 / 측정 윈도우 명시 (W16 14d 수집) / green/yellow/red band 3-tier 정의 / relative 전환 조건(mean−1.5σ) 명시. **승인.**

---

## 5. SSOT 갱신 결과 (이번 사이클)

- `docs/DECISION_LOG.md` ✅ D-014 / D-015 / D-013 검증 / ADR-0006 Accepted / §5 이력
- `fixtures/adversarial/rls/RLS-ADV-{010,011,012,013}-*.yaml` ✅ rename + id 필드
- `fixtures/adversarial/rls/README.md` ✅ 13건 분포 + 정책
- `fixtures/golden/srs/SRS-{056,057,058,059,060}-*.yaml` ✅ rename + id 필드
- `fixtures/golden/srs/README.md` ✅ 57건 분포 + Cycle A 절 + enum 7종
- `context/rollups/20260512-M3-W15-cycle-a-integration.md` ✅ 신규
- `docs/PROJECT_MAP.md` — 다음 사이클에서 packages/srs-core 디렉토리 추가 (W16 backend Phase 2 commit 시점)
- `docs/HANDOFF.md` — Cycle A 진척 한 줄 (다음 동일 commit)

---

## 6. Skill 사용 점검 (이번 작업)

orchestrator Cycle A 본 사이클: 코드 0 / 문서 작성 6 + rename 9 파일 + ID 필드 9건 갱신.
- humanizer: 미사용 (내부 운영 문서)
- changelog-generator: 미사용 (외부 가시 변경 없음 — 모두 SSOT 내부)
- 12명 agent skill 사용 점검: 모든 agent context에 "사용한 Skill" 항목 명시 확인 ✅

---

## 7. Risks / Open Questions

| 항목 | 내용 | 해소 시점 |
|---|---|---|
| Q-W15-1 (해소) | synthetic seed 결정성 | devops가 결정적 PRNG로 해소 (`scripts/seed/synthetic-baseline.ts`) |
| Q-W15-2 (해소) | dogfood vs synthetic 라벨링 | devops `is_dogfood` boolean 컬럼 M5 추가 권고 (Q-OPS-W15-007) |
| Q-W15-3 (해소) | ADR-0006 경계 | architect Option A packages/srs-core 봉인 |
| R-26 (해소) | 12명 cross-track 충돌 | D-014 / D-015 봉인. 다음 dispatch부터 ID 슬롯 사전 분배 |
| R-29 신규 (architect) | Phase 2 backend의 SRS module 본 구현 이전 작업 | W16 W17 backend 작업 큐. mobile + golden runner 양측 green 게이트 |
| R-30 신규 (security) | paper 모드 dedup 테이블 무한 누적 | M5 직전 cron 등록 또는 수동 TRUNCATE |
| R-31 신규 (backend) | SRS-056~060 evaluator enum 미활성 | W16 D1 backend 작업 큐. 본 사이클에서는 fixture만 봉인 |
| R-32 신규 (legal) | privacy evaluator union 3종(family_share / minor_refund / ccpa_no_sale) backend 미반영 | W15 후반 backend 작업 큐 |

---

## 8. 다음 사이클 권고 (Cycle B 트리거 조건)

| 시점 | 트리거 | 통합 승인 대상 |
|---|---|---|
| **B (T+5~7일)** | W15-01 머지 + W15-05 머지 + stub 동작 + cron green | RLS nightly 1회 green / baseline Day-0~Day-1 snapshot / audit_log alert stub dev 검증 / R-24 closed |
| **C (T+7일, 2026-05-18)** | W15 sprint 종료 rollup | 12명 작업 통합 승인 / W15 rollup / W16 게이트 검증 sprint 진입 |
| **D (T+14일, 2026-05-25)** | M3 게이트 검증 | §6.4.1 10개 조건 모두 검증 / M3 completed 서명 / M4 진입 |

본 Cycle A는 **ID 충돌 해소 + ADR-0006 봉인 + threshold 승인** 만, 다음 Cycle B는 evaluator nightly 첫 green 후.

---

## 9. Definition of Done — 본 사이클 (Cycle A)

- [x] 12명 시니어 1차 산출물 모두 점검
- [x] ID 충돌 2건 발견 (RLS-ADV-006~009, SRS-051~055)
- [x] D-014 봉인 + RLS rename 4건 + README 갱신
- [x] D-015 봉인 + SRS rename 5건 + README 갱신
- [x] ADR-0006 Accepted 봉인 + DECISION_LOG 인덱스 갱신
- [x] D-013 PRD threshold 승인 검증
- [x] Cycle A 통합 rollup 작성
- [x] 본 context 기록
- [x] DECISION_LOG §5 변경 이력
- [ ] SWARM_LEDGER Cycle A entry (다음 commit 동일 묶음)
- [ ] (Cycle B에서) RLS nightly 1회 green / baseline 수집 파이프 동작 검증 / stub 동작 확인
