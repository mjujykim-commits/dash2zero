# Plan — M3 W16 게이트 검증 Sprint (2026-05-19~25)

> 작성: orchestrator
> 작성일: 2026-05-12 (Cycle B dispatch 직후 사전 양식)
> 사이클: M3 W16 (Harness Hardening 마지막 sprint, M3 게이트 통과 직전)
> 선행: `context/rollups/20260512-M3-W15-cycle-b-dispatch.md`
> 다음 사이클: M3 종료 (2026-05-26) + M4 진입 (2026-05-26 화)

---

## 0. W16 한 줄 목표

**M3_GATE_V2_DASHBOARD 10조건 모두 PASS 판정 + ADR-0007 (baseline 저장소) Accepted 봉인 + M3 종료 rollup 작성 → M4 진입 신호 발사**

---

## 1. W16 진입 전제 조건 (Cycle C 종료 시점)

W15 sprint 종료(2026-05-18 일) Cycle C에서 다음이 충족되어야 W16 진입 가능:

- ✅ M3 게이트 v2 조건 9/10 (모두 + #4 partial)
- ✅ W15-09 / W15-10 enum 활성화 commit
- ✅ baseline Day-0~6 snapshot 6건 누적 (5/12~17)
- ✅ RLS evaluator nightly cron 단계 1~5 진입 (단계 6 모니터는 W16)
- ✅ alert stub dev 환경 1회 검증 commit
- ✅ REVIEW_QA / W15_SPRINT_BOARD / HARNESS_EXECUTION_BOARD 갱신 (pm W15-11)
- ✅ W15 sprint 종료 rollup 작성 (Cycle C orchestrator)

미충족 시: W16 진입 보류, Cycle C에서 잔여 작업 처리 후 5/19 진입 또는 1~2일 슬립.

---

## 2. W16 작업 큐 (5건 — 운영 + 검증 + 신규 ADR)

### W16-01 — baseline 14d 누적 검증 (D-010 #4 완전 충족)

- **책임**: analytics (lead) + devops (cron 가동 확인)
- **선행**: W15-02b Day-0~1 + Cycle C까지 Day-0~6
- **산출물**:
  - W16 Day-7~13 snapshot 7건 누적 → `metrics/daily/2026-05-{19~25}.json` 7건
  - `scripts/baseline/check-thresholds.ts` 작성 (planner의 PRD §8.2 threshold와 비교)
  - 14d 누적 후 첫 weekly summary 작성 → `metrics/weekly/2026-05-19-to-2026-05-25.md`
- **DoD**: 14건 snapshot 누적 확인 + threshold check 1회 실행 + weekly summary commit
- **시작**: W16 D-1 (2026-05-19 월)

### W16-02 — ADR-0007 (baseline 저장소) Accepted

- **책임**: architect (lead) + analytics (3-source 정합 검증) + devops (synthetic seed 결정성)
- **선행**: D-010 봉인 + W15-02 + W15-02b 결과
- **산출물**:
  - `docs/adr/ADR-0007-baseline-storage.md`
  - 3-source 구성 ADR화 (staging + synthetic seed + 1인 dogfood)
  - synthetic seed 결정성 보장 방법 명시 (Q-W15-1 해소: 결정적 PRNG seed 고정)
  - dogfood vs synthetic 라벨링 정책 (Q-W15-2 해소: M5 `is_dogfood` 컬럼 추가)
  - real-user 14d M5 이연 트리거 명시
  - Reversal Trigger (3-source 중 1개 fail → ADR-0007 갱신)
- **DoD**: ADR Accepted 상태 commit + orchestrator 승인 + DECISION_LOG §4 ADR 인덱스 갱신
- **시작**: W16 D-3 (2026-05-21 수)

### W16-03 — M3 게이트 10조건 검증

- **책임**: orchestrator (lead) + 12명 agent 협업 (각 조건 책임자)
- **선행**: 모든 W15 작업 머지 + W16-01 14d 누적 + W16-02 ADR-0007
- **산출물**:
  - `docs/harness/M3_GATE_V2_DASHBOARD.md` §5 W16 게이트 양식 채움 (PASS/CONDITIONAL/FAIL × 10건)
  - 각 조건의 증거 파일 / log URL 명시
  - 최종 판정 (PASS / CONDITIONAL / FAIL)
- **DoD**: 10조건 모두 PASS 또는 CONDITIONAL PASS (사유 명시) + orchestrator 서명 + 2026-05-25 일 commit
- **시작**: W16 D-7 (2026-05-25 일)

### W16-04 — M3 종료 rollup 작성

- **책임**: orchestrator (lead) + pm (cross-track 통합)
- **선행**: W16-03 게이트 판정
- **산출물**:
  - `context/rollups/20260526-M3-completed.md` (사전 양식 `context/rollups/M3-completed-template.md` 활용)
  - W13/W14/W15/W16 4 sprint 통합 산출물 인덱스
  - 누적 결정 (D-001~D-015 + ADR-0001~0007)
  - 누적 risk (closed: R-12 partial / R-23 / R-24 / R-26 / R-27 / open: R-25 / R-28~R-32 / R-M5-01)
  - M4 진입 신호 + 차단 항목 0 확인
- **DoD**: M3 completed rollup commit + SWARM_LEDGER §M3 종료 entry + 2026-05-26 화
- **시작**: W16 D-7~+1 (2026-05-25~26)

### W16-05 — REVIEW_QA M3 라운드 종합 정리

- **책임**: pm (lead) + 12명 agent 각자 도메인 Q-XX-W15 status 일괄 갱신
- **선행**: W15 + W16-01 + W16-02 종료
- **산출물**:
  - `docs/REVIEW_QA.md` M3 라운드 마감 — 모든 Q-XX-W15-NN status (RESOLVED / ESCALATED / DEFERRED-M5) 일괄 표시
  - M4 라운드 진입 신규 Q-XX-W17 슬롯 사전 등록 (각 agent가 M4 진입 시 사용)
- **DoD**: REVIEW_QA W15 라운드 status 100% 처리 + M4 슬롯 명시
- **시작**: W16 D-6 (2026-05-24 토)

---

## 3. W16 일정

| Day | 일자 | 작업 |
|---|---|---|
| D-1 | 5/19 월 | W16-01 baseline Day-7 첫 snapshot + cron 가동 확인 |
| D-2 | 5/20 화 | W16-01 Day-8 + pm M3 게이트 dry-run 진단 (PM 권고 §5.3) |
| D-3 | 5/21 수 | W16-02 ADR-0007 draft → architect 회람 |
| D-4 | 5/22 목 | W16-02 ADR-0007 final + orchestrator 승인 |
| D-5 | 5/23 금 | baseline check-thresholds 1회 실행 + 결과 commit |
| D-6 | 5/24 토 | W16-05 REVIEW_QA 일괄 갱신 (pm 12명 협업) |
| D-7 | 5/25 일 | W16-03 게이트 10조건 검증 + 판정 + W16-04 rollup draft |
| 종료+1 | **5/26 화** | **M3 completed rollup commit** + SWARM_LEDGER §M3 종료 + **M4 진입 신호** |

---

## 4. M3 게이트 검증 트리거 매트릭스 (10조건 × W16 검증 방법)

| # | 조건 | 검증 방법 | 책임 | W16 검증 일자 |
|---:|---|---|---|---|
| 1 | Evaluator 5 strict CI | `.github/workflows/eval-on-pr.yml` 5 job × 14d nightly 모두 green | devops | D-5~7 |
| 2 | Golden 100+ | `fixtures/golden/*/README.md` 분포 합산 ≥ 100 | qa | D-7 |
| 3 | Adversarial 13 violation 분류 | `pnpm eval:rls --strict` 13/13 violation | security | D-7 |
| 4 | baseline 3-source 14d | `metrics/daily/*.json` 14건 + synthetic + dogfood 신호 적재 확인 | analytics | D-7 |
| 5 | eval-nightly cron green | 14d 모두 green (1건 fail 시 5건 보강, 0/5 통과 못하면 CONDITIONAL) | devops | D-7 |
| 6 | alert stub dev 검증 | dev console + DB security_alerts 1건 commit log | security | D-7 |
| 7 | R-23 / R-24 closed | RISK_REGISTER status 갱신 | security + content | D-7 |
| 8 | ADR-0003 Accepted | `docs/adr/ADR-0003-custom-runner-firebase.md` Accepted | architect | D-7 (확인만) |
| 9 | ADR-0006 Accepted | `docs/adr/ADR-0006-shared-srs-module.md` Accepted | architect | D-7 (확인만) |
| 10 | PRD threshold 4 KPI | `docs/product/PRD.md §8.2` commit | planner | D-7 (확인만) |

---

## 5. W16 자율 결정 위임 (orchestrator)

| 결정 영역 | 권한 위임 받는 agent | 비고 |
|---|---|---|
| ADR-0007 baseline 저장소 구조 (별도 DB vs `metrics/daily/` git 저장) | architect | W15-02b 결과 보고 후 architect 자율 |
| Day-7~13 snapshot 누락 발생 시 보강 정책 | analytics | nightly cron 1회 누락 → 다음날 2건 적재 + W16 게이트 CONDITIONAL 표시 |
| W16-05 REVIEW_QA 갱신 시 deferred 항목 분류 (M5 vs M4) | 각 agent 도메인 ownership | pm은 통합 모니터 |
| M3 게이트 CONDITIONAL PASS 임계 (몇 건까지 허용) | orchestrator + pm | 권고: 9/10 + #4 partial까지 PASS, 그 이상 미달은 CONDITIONAL / FAIL |

---

## 6. Risks (W16 검증 sprint)

| ID | 항목 | 강도 | mitigation |
|---|---|---|---|
| R-W16-01 (신규) | baseline 14d cron 중간 1~2일 누락 | medium | 다음날 보강 commit + 게이트 CONDITIONAL 표시 |
| R-W16-02 (신규) | ADR-0007 architect 작성이 W16 D-4까지 못 끝날 위험 | medium | D-3 draft → D-4 final 강제. 미달 시 W17 이연 (M3 게이트 #4 별도 검증) |
| R-25 (잔존) | RLS static EXISTS 의미 simplification (W16 hybrid 미도입) | medium | W16 hybrid는 ADR-0007 결정 영역 외, M4 W17로 이연 가능 |
| R-31 (잔존, Cycle B 처리 예상) | SRS-056~060 evaluator enum 미활성 | medium → resolved (Cycle B) | W15-09 완료 시 해소 |
| R-32 (잔존, Cycle B 처리 예상) | privacy evaluator union 3종 미반영 | medium → resolved (Cycle B) | W15-10 완료 시 해소 |
| R-M5-01 (잔존) | M5 entry 시점 사용자 reconfirm 3건 미해소 → GA 슬립 | high | M3 종료 시점에는 M5 entry sprint(W19) 영향 없음, 본 게이트 무관 |

---

## 7. 통합 승인 호출 시점

| 사이클 | 시점 | 트리거 | 통합 승인 대상 |
|---|---|---|---|
| **W16 mid-sprint A** | 2026-05-20 화 | baseline Day-7~8 확인 | analytics 갱신 + pm dry-run + ADR-0007 draft 검토 |
| **W16 mid-sprint B** | 2026-05-23 금 | ADR-0007 Accepted | architect ADR + analytics check-thresholds 결과 |
| **W16 종료 (D)** | **2026-05-25 일** | M3 게이트 검증 | **10조건 모두 검증 + 판정 + rollup draft** |
| **M3 completed** | **2026-05-26 화** | M3 completed rollup commit | SWARM_LEDGER §M3 종료 entry + **M4 진입 신호** |

---

## 8. M4 entry 신호 (W16 종료 = M4 ready 조건)

다음 조건 충족 시 즉시 M4-W17 진입 가능:

1. M3 게이트 10조건 PASS (또는 9/10 + 1 CONDITIONAL with documented exception)
2. ADR-0007 Accepted
3. M3 completed rollup commit
4. `docs/HANDOFF.md` §1 마일스톤 상태판 M3 completed 표기
5. SWARM_LEDGER §M3 종료 entry

M4 entry preview dispatch: `context/rollups/20260512-M4-entry-preview-dispatch.md` (orchestrator 사전 작성, M3 completed 시점에 v1 발행)

---

## 9. 일정 sensitivity

PM W15 context §3.1 일정:
- W16 종료 = 5/25 일 → M3 종료 5/26 화 → M4-W17 5/26~6/1 → M4-W18 6/2~6/8 → M5-W19 6/9~6/15 → GA-W20 6/16~6/22

본 W16 sprint plan은 5/25 일 게이트 검증을 기준으로 한다. 1~2일 슬립 시:
- 5/26~27 게이트 검증 → 5/27 M3 완료 → M4 1~2일 슬립
- 누적 슬립 ≤ 5일까지 M5 W19 진입 일자 유지 가능 (W18 buffer 활용)
- 누적 슬립 > 5일이면 M5 W19 진입이 6/14~로 슬립 → GA W20 6/22로 슬립 또는 W19 1주 buffer 압축

---

## 10. Definition of Done — W16 sprint

- [ ] W16-01 baseline 14d 누적 + threshold check 1회 실행
- [ ] W16-02 ADR-0007 Accepted 봉인
- [ ] W16-03 10조건 검증 판정 + orchestrator 서명
- [ ] W16-04 M3 completed rollup commit
- [ ] W16-05 REVIEW_QA W15 라운드 status 100%
- [ ] HANDOFF.md §1 M3 completed 표기
- [ ] PROJECT_MAP.md M3 종료 디렉토리 정합
- [ ] DECISION_LOG.md §4 ADR-0007 Accepted 인덱스 갱신
- [ ] SWARM_LEDGER §M3 종료 entry
- [ ] M4 entry preview dispatch v1 발행

---

## 11. 서명

- W16 sprint plan 사전 작성 완료: 2026-05-12 orchestrator
- 실행 착수: W15 Cycle C 종료 (2026-05-18 일) 이후
- 차단 항목: 없음 (모든 작업이 W15 종료 후 정상 sequencing)
- 다음 orchestrator 호출: W16 mid-sprint A (2026-05-20 화)
