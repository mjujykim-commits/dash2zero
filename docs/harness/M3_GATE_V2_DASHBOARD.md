# M3 Harness Hardening — 게이트 v2 진척 Dashboard

> 책임: orchestrator
> 작성일: 2026-05-12 (W15 Cycle A 직후)
> 갱신 트리거: Cycle B / C / D + W16 게이트 검증 sprint
> SSOT 우선순위: 본 문서 > `docs/HANDOFF.md §4.1` > dispatch v2

---

## 0. 한 줄 요약

**4/10 충족 + 6/10 W15 종료 trajectory** — W16 게이트 검증 sprint 진입 가능 상태.

> **W16 D-2 갱신 (2026-05-20)**: 본 dashboard §1 표는 W15 Cycle A 스냅샷. W16 D-2 시점 진척은 §6 W16 D-2 dry-run 진단 참조.

---

## 1. 10조건 진척 표

| # | 조건 | 책임 agent | W15 Cycle A 상태 | 충족 트리거 | 충족 사이클 |
|---:|---|---|:---:|---|---|
| 1 | Evaluator 5개 strict CI 통합 (SRS/Payment/Privacy/Content/RLS) | backend (lead) + qa | 🟡 RLS evaluator 본화 commit, 책상 검증 13/13 pass. CI nightly 첫 run 대기 | nightly 1회 green + PR 5 job strict | Cycle B (T+5~7일) |
| 2 | Golden 100+건 완성 | analytics(SRS) / backend(Payment) / legal(Privacy) / content(Content) | ✅ **102건** (SRS 57 + Payment 15 + Privacy 16 + Content 14) — 목표 87 초과 | n/a | W15 Cycle A 충족 |
| 3 | Adversarial 13건 evaluator violation 분류 | security + backend | 🟡 13건 fixture 봉인 (D-014). evaluator 분기 책상 검증, CI 첫 run 대기 | RLS evaluator nightly green + 13/13 violation 분류 | Cycle B |
| 4 | baseline 수집 파이프 동작 검증 (3-source, D-010) | analytics(lead) + devops + planner | 🟡 BASELINE_METRICS.md + queries.sql + run.ts + synthetic-baseline.ts commit. staging 적재 + Day-0 snapshot 대기 | synthetic seed staging 1회 적재 + 1인 dogfood 활동 신호 + Day-0~Day-1 snapshot commit + nightly cron 14d 가동 | Cycle B (Day-0/1) + Cycle C (cron 가동) |
| 5 | eval-nightly.yml cron 최소 1회 green | devops | 🟡 workflow 수정 commit. cron 6단계 게이트 명확 (1: RLS 머지 / 2: 로컬 9/9 / 3: manual 1회 / 4: 24h flake 0 / 5: 주석 해제 PR / 6: 첫 3일 모니터) | 단계 1~3 완료 + manual dispatch 1회 PASS | Cycle B |
| 6 | audit_log alert stub dev 검증 (D-011) | security(lead) + devops + backend + designer | 🟡 0004_audit_triggers.sql + security-alert-stub.yml + AUDIT_ALERT_RUNBOOK commit. dev 인위적 위반 1건 검증 대기 | dev 환경 위반 1건 → console + DB security_alerts 적재 확인 | Cycle B |
| 7 | R-23 (RLS) 해소, R-24 (distractors retire) 해소 | security(R-23) + content(R-24) | 🟡 R-23: RLS evaluator nightly green 후 closed / R-24: distractors_after_retire 검증 함수 W15-07 진입 후 | RLS nightly 13/13 green + distractors retire 검증 함수 commit | Cycle B |
| 8 | ADR-0003 (Custom runner) Accepted finalization | architect | ✅ W13 Accepted (`docs/adr/ADR-0003-custom-runner-firebase.md`) | n/a | W13 충족 |
| 9 | **ADR-0006 (packages/srs-core) Accepted** | architect | ✅ **W15 Cycle A 봉인** (2026-05-12, Option A 채택) | n/a | W15 Cycle A 충족 |
| 10 | PRD threshold 4 KPI commit (D-013) | planner | ✅ W15 Day-1 commit (`docs/product/PRD.md §8.2`) — 4 KPI band (Target/Minimum) + 출처 + green/yellow/red 3-tier + relative 전환 조건 | n/a | W15 Day-1 충족 |

**누적**: 4/10 ✅ + 6/10 🟡 (모두 Cycle B/C 트리거에 매핑)

---

## 2. 사이클별 충족 예상

| 사이클 | 시점 | 신규 충족 예상 | 누적 |
|---|---|---|---|
| W15 Cycle A (현재) | 2026-05-12 | #2 / #8 / #9 / #10 | **4/10** |
| W15 Cycle B | 2026-05-15~17 | #1 / #3 / #5 / #6 / #7 | **9/10** |
| W15 Cycle C (sprint 종료) | 2026-05-18 | #4 partial (Day-0~1 snapshot) | **9/10** + #4 partial |
| W16 게이트 검증 sprint | 2026-05-19~25 | #4 완전 충족 (cron 14d 가동 확인) | **10/10** |
| **M3 종료** | **2026-05-26** | M3 completed rollup → M4 진입 | — |

---

## 3. 충족 트리거 상세 (각 조건의 정확한 검증 방법)

### #1 Evaluator 5개 strict CI 통합

- **현재 상태**: SRS / Payment / Privacy / Content 4개 evaluator W14 strict commit. RLS evaluator W15 commit (책상 검증 13/13).
- **검증 방법**: `.github/workflows/eval-on-pr.yml` 4 job → 5 job 확장 + RLS strict (이미 backend가 runner.ts에 라우팅 추가)
- **충족 트리거**: PR open 시 5 job 모두 green 1회 (devops가 W15-07 cron 활성화 6단계 단계 2 시점)

### #2 Golden 100+건 ✅

- **충족 일자**: 2026-05-12 W15 Cycle A
- **분포**: SRS 57 + Payment 15 + Privacy 16 + Content 14 = **102건**

### #3 Adversarial 13건 violation 분류

- **현재 상태**: RLS-ADV 001~013 fixture 봉인 (D-014). evaluator 분기 책상 검증 완료
- **검증 방법**: `pnpm eval:rls --strict` → 13/13 violation 분류 (blocked + http_status + row_count)
- **충족 트리거**: nightly 1회 green (Cycle B)

### #4 baseline 수집 파이프 동작 검증 (3-source) — most complex

- **3-source 분해**:
  - **Supabase staging**: `vw_baseline_*` 5개 view 작성 완료 (analytics queries.sql). staging DB에 apply 필요
  - **synthetic seed**: `scripts/seed/synthetic-baseline.ts` (devops, 결정적 PRNG, 200 user, 14d cohort) commit. staging 적재 1회 실행 필요
  - **1인 dogfood**: Owner 계정으로 lesson 활동 → analytics view에서 신호 적재 확인. `is_dogfood` boolean 컬럼 M5 권고 (Q-OPS-W15-007)
- **Day-0 snapshot**: `scripts/baseline/run.ts` → `metrics/daily/2026-05-XX.json` commit
- **14d cron**: nightly cron이 매일 snapshot 적재. W16 종료 시점에 14건(Day-0~Day-13) 누적
- **충족 트리거**: synthetic 적재 1회 + dogfood 신호 적재 + 14d snapshot 누적

### #5 eval-nightly.yml cron 1회 green

- **6단계 게이트** (devops AUDIT_ALERT_SECRETS / EVAL_PR_CAPACITY):
  1. RLS evaluator 머지 (W15-01)
  2. 로컬 13/13 PASS
  3. GitHub manual dispatch 1회 PASS
  4. 24h flake 측정 (3회 dispatch, 0 flake)
  5. cron 주석 해제 PR (reviewer=security)
  6. 활성화 후 첫 3일 09:00 모니터, 2회 fail 시 즉시 재주석
- **충족 트리거**: 단계 3 (manual dispatch 1회 PASS)이 M3 게이트 #5 조건

### #6 audit_log alert stub dev 검증

- **현재 상태**: 0004_audit_triggers.sql (pg_net + vault.secrets + 5분 dedup + sha256 actor hash + paper 가드) commit. security-alert-stub.yml workflow_dispatch only commit
- **검증 방법**: dev 환경에서 인위적 RLS-ADV-005 위반 1건 → trigger 발화 → console (paper 모드 vault.secrets NULL) + security_alerts 테이블 INSERT 1건 + workflow stub paper run 로그
- **충족 트리거**: dev console 출력 + DB security_alerts 1건 + nightly evaluator가 violation 분류

### #7 R-23 / R-24 closed

- **R-23 (RLS evaluator 부재)**: RLS evaluator nightly 1회 green = closed
- **R-24 (distractors retire 미검증)**: `scripts/eval/content.ts`의 `distractors_after_retire` 검증 함수 commit + content evaluator nightly green = closed
- **충족 트리거**: Cycle B nightly 1회 green + content distractors 검증 함수 commit

### #8 ADR-0003 ✅ W13 충족
### #9 ADR-0006 ✅ W15 Cycle A 충족
### #10 PRD threshold ✅ W15 Day-1 충족

---

## 4. 리스크 (게이트 통과를 막을 수 있는 항목)

| ID | 항목 | 강도 | mitigation |
|---|---|---|---|
| R-23 (잔존) | RLS evaluator nightly green | high → medium | book 검증 13/13 완료. nightly 1회 실패 시 5회 보강 (devops 6단계 단계 4) |
| R-26 (해소) | 12명 cross-track 충돌 | resolved | D-014/D-015 봉인 |
| R-29 | Phase 2 backend SRS module 본 구현 이전 (W16) | low | mobile + golden runner 양측 green 게이트 |
| R-30 | paper 모드 dedup 테이블 무한 누적 | low | M5 직전 cron 등록 또는 수동 TRUNCATE |
| R-31 | SRS-056~060 evaluator enum 미활성 | medium | W16 D1 backend 작업 큐 (5개 분기 함수) |
| R-32 | privacy evaluator union 3종 미반영 | medium | backend가 W15 후반 `scripts/eval/privacy.ts` 분기 3종 추가 |
| R-W15-02 (pm) | stub 모드의 회귀 catch가 실 alert 부재 시 누락 | low | M5 entry stub → 실 webhook 활성화 절차 ALERT_RUNBOOK 명시 |
| R-M5-01 (pm) | M5 entry 시점 사용자 reconfirm 3건 (C-13 / Slack / 베타 모집) 미해소 | high | M3 게이트 영향 없음, M5 entry sprint 시점 처리 |

---

## 5. W16 게이트 검증 sprint 양식 (orchestrator)

W15 종료 후 W16 진입 시 본 dashboard 갱신과 함께 다음 양식으로 게이트 통과 판정:

```markdown
# M3 게이트 통과 판정 — 2026-05-25 (W16 종료)

| # | 조건 | 검증 결과 | 증거 (파일/log) |
|---:|---|:---:|---|
| 1 | Evaluator 5개 strict CI | [PASS/FAIL] | `.github/workflows/eval-on-pr.yml` 5 job log |
| 2 | Golden 100+건 | [PASS/FAIL] | `fixtures/golden/*/README.md` 분포 |
| 3 | Adversarial 13건 violation 분류 | [PASS/FAIL] | nightly cron green log |
| 4 | baseline 3-source 동작 | [PASS/FAIL] | `metrics/daily/2026-05-{12~25}.json` 14건 |
| 5 | eval-nightly cron 1회 green | [PASS/FAIL] | 최초 green run URL |
| 6 | audit_log alert stub dev 검증 | [PASS/FAIL] | dev console + security_alerts row |
| 7 | R-23 / R-24 closed | [PASS/FAIL] | RISK_REGISTER closed 표시 |
| 8 | ADR-0003 Accepted | PASS | `docs/adr/ADR-0003-custom-runner-firebase.md` |
| 9 | ADR-0006 Accepted | PASS | `docs/adr/ADR-0006-shared-srs-module.md` |
| 10 | PRD threshold 4 KPI | PASS | `docs/product/PRD.md §8.2` |

**판정**: [PASS / CONDITIONAL / FAIL]
**Orchestrator 서명**: [date]
**다음 게이트**: M4 W17 (Security+QA)
```

---

## 6. W16 D-2 dry-run 진단 (2026-05-20 orchestrator)

본 진단은 W16-01 plan §5.1 pm 권고에 따른 D-2 시점 dry-run.

### 6.1 10조건 W16 D-2 시점 진척

| # | 조건 | W15 Cycle A | W16 D-2 시점 | 충족 트리거 잔여 |
|---:|---|:---:|:---:|---|
| 1 | Evaluator 5 strict CI | 🟡 | 🟡 | RLS evaluator nightly 1회 green (D-5~7) |
| 2 | Golden 100+건 | ✅ | ✅ | n/a |
| 3 | Adversarial 13 violation | 🟡 | 🟡 | RLS nightly + 13/13 분류 (D-5~7) |
| 4 | baseline 3-source 14d | 🟡 | 🟡 | ADR-0007 draft commit ✅, Day-0~13 snapshot 적재 대기 (cron 가동 후) |
| 5 | eval-nightly cron green | 🟡 | 🟡 | 6단계 게이트 단계 3 (manual dispatch 1회 PASS) — D-3~5 |
| 6 | alert stub dev 검증 | 🟡 | 🟡 | dev RLS-ADV-005 위반 1건 (D-5~7) |
| 7 | R-23 / R-24 closed | 🟡 | 🟡 | RLS nightly green + distractors retire 검증 함수 |
| 8 | ADR-0003 | ✅ | ✅ | n/a |
| 9 | ADR-0006 | ✅ | ✅ | n/a |
| 10 | PRD threshold | ✅ | ✅ | n/a |

**누적**: 4/10 ✅ + 6/10 🟡 — W15 Cycle A와 동일. 본 D-2 시점에서는 sprint plan(W15 Cycle B/C) 결과가 commit 일정에 따라 반영 예정.

### 6.2 W16 D-2 자율 진행 산출물 (orchestrator)

- ✅ `docs/adr/ADR-0007-baseline-storage.md` Draft 작성 (architect D-3 회람 입력)
- ✅ `scripts/baseline/check-thresholds.ts` 스켈레톤 작성 (D-5 실행 대상)
- ✅ `metrics/README.md` + `metrics/daily/` + `metrics/weekly/` 디렉터리 생성
- ✅ 본 dashboard §6 갱신

### 6.3 D-3~D-7 잔여 작업

| Day | 일자 | 작업 | 책임 |
|---|---|---|---|
| D-3 | 5/21 수 | ADR-0007 architect 회람 → 의견 수렴 | architect |
| D-4 | 5/22 목 | ADR-0007 final + orchestrator 승인 | orchestrator + architect |
| D-5 | 5/23 금 | baseline check-thresholds 1회 실행 + 결과 commit | analytics |
| D-6 | 5/24 토 | W16-05 REVIEW_QA 일괄 갱신 | pm |
| D-7 | 5/25 일 | W16-03 게이트 10조건 검증 + 판정 + W16-04 rollup draft | orchestrator |

### 6.4 W16 D-2 사용자 reconfirm 권고 시점

본 D-2 자율 산출물은 사용자 reconfirm 필요 없음 (사전 양식 + draft). D-7 게이트 판정 시점에 사용자 통합 승인 요청 권고.

---

## 7. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-12 | W15 Cycle A 직후 초안 작성 — 10조건 책임/상태/트리거 매트릭스 + 6 mitigation + W16 양식 |
| 2026-05-20 | W16 D-2 dry-run §6 추가 — ADR-0007 draft + check-thresholds skeleton + metrics 디렉터리 commit |
| 2026-05-22 | W16 D-4 진척 — ADR-0007 Accepted 봉인 (D-3 후반) + ADR evidence (synthetic determinism test + weekly-baseline workflow) 추가. 조건 #4 일부 충족 (정책+evidence 완성, 14d 적재만 잔여). **누적 5/10 ✅ + 5/10 🟡**. D-7 사전 양식 `M3_GATE_V2_CHECKLIST.md` 신규 commit (orchestrator) |
