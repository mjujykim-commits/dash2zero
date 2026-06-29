# M3 Harness Hardening — 게이트 v2 D-7 사전 양식 (CHECKLIST)

- **책임**: orchestrator (최종 판정) + 각 조건 책임 agent (evidence 첨부)
- **목적**: M3_GATE_V2_DASHBOARD.md(상태 추적) + 본 문서(D-7 evidence 도장) — 상보적 운용
- **검증 일자**: **2026-05-25 (W16 D-7, M3 종료 전일)**
- **작성일**: 2026-05-22 (W16 D-4 사전 양식)
- **SSOT 우선순위**: 본 문서 > DASHBOARD §6 > sprint plan
- **관련**: ADR-0003 / ADR-0006 / ADR-0007 (Accepted) · D-010 · D-013 · D-014 · D-015 · D-018 · D-022 · D-023 · D-024 · D-025

---

## 0. 한 줄 요약 (D-4 시점)

10조건 중 **5/10 ✅ + 5/10 🟡** (W16 D-4 진척 — D-7까지 5건 trigger 잔여)

> D-2 dry-run 대비 1건 추가 충족: **ADR-0007 (조건 #4 baseline 정책)**가 D-3에 봉인되어 D-7 evidence 자동 양식 정합 완성. D-7까지 cron 활성화 + 적재 누적 검증만 남음.

---

## 1. 10조건 D-7 검증 양식

각 조건마다 다음 5요소를 작성:

1. **Evidence 위치** (파일/명령어/링크)
2. **검증 명령어** (1줄 — Owner가 D-7에 실행)
3. **Pass criteria** (정량 — 통과/실패 객관적 판정)
4. **Fail trigger 시 액션** (rollover 또는 mitigation)
5. **D-7 시점 PASS / FAIL 도장**

---

### 조건 #1 — Evaluator 5개 strict CI 통합

- **Evidence**: `.github/workflows/eval-on-pr.yml` + `scripts/eval/runner.ts`
- **검증 명령어**:
  ```bash
  gh run list --workflow=eval-on-pr.yml --branch main --limit 3
  ```
- **Pass criteria**:
  - 최근 3회 run 중 **2회 이상 green** (전 5 job: SRS / Payment / Privacy / Content / RLS)
  - 각 job의 strict mode = true (skip 0)
- **Fail action**: cron 활성화 단계 미충족 → DASHBOARD §6 단계 1~3 재확인 + flake 1건 시 +5회 재dispatch
- **D-7 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **devops**

---

### 조건 #2 — Golden 100+건 ✅ (W15 Cycle A 충족)

- **Evidence**: `fixtures/golden/{srs,payment,privacy,content}/*.yaml`
- **검증 명령어**:
  ```bash
  find fixtures/golden -name "*.yaml" -type f | wc -l
  ```
- **Pass criteria**: 총 ≥ 100건 (목표 87 초과 — W15 시점 102건)
- **D-7 도장**: ✅ **PASS** (W15 Cycle A 사전 충족, D-7 재검증 불필요)

---

### 조건 #3 — Adversarial 13건 violation 분류

- **Evidence**: `fixtures/adversarial/rls/RLS-ADV-001 ~ 013.yaml` + `pnpm eval:rls --strict`
- **검증 명령어**:
  ```bash
  pnpm eval:rls --strict
  ```
- **Pass criteria**:
  - 13/13 violation 분류 (`blocked: true` + `http_status: 401/403` + `row_count: 0`)
  - skip 0건
  - exit code 0
- **Fail action**: 특정 ADV case 분류 실패 시 RLS 정책 review → security agent에게 root-cause 요청
- **D-7 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **security + backend**

---

### 조건 #4 — Baseline 3-source 14d 적재

- **Evidence**:
  - `docs/adr/ADR-0007-baseline-storage.md` (Accepted ✅ 2026-05-21)
  - `metrics/daily/2026-05-12 ~ 2026-05-25.json` (14건 누적 예상)
  - `scripts/seed/__tests__/determinism.test.ts` (synthetic 결정성)
  - `.github/workflows/weekly-baseline.yml` (manual dispatch)
- **검증 명령어**:
  ```bash
  ls metrics/daily/ | wc -l            # 14 이상 기대
  pnpm test:seed                       # synthetic 결정성 (exit 0)
  pnpm baseline:check --weekly         # check-thresholds (red 없음)
  ```
- **Pass criteria** (3-source 모두 충족):
  - `metrics/daily/*.json` ≥ 14건 + 각 file의 `source` 필드 = staging_supabase / synthetic_seed_v1 / dogfood_owner 분포
  - `pnpm test:seed` exit 0 (PRNG + simulate byte-identical)
  - `pnpm baseline:check` exit 0 (green) 또는 1 (yellow, red 없음 — Q-ADR-0007-3 정합)
  - **source 우선순위 정합**: 14d KPI 비교는 `staging_supabase` 기준 (ADR-0007 §2 권고 2)
- **Fail action**:
  - 적재 누적 부족 시 → cron 활성화 시점 재확인, missing day 보강 (synthetic 재실행)
  - synthetic 결정성 fail → R1 reversal trigger 발동, seed 재조정 검토 (ADR-0007 §6 R4)
  - red 임계값 미달 → PRD §8.2 KPI band 재검토 + Owner 결정 (M3 게이트 보류 가능성)
- **D-7 도장**: `[ ] PASS  [ ] CONDITIONAL  [ ] FAIL  ` 책임: **analytics + devops**

---

### 조건 #5 — eval-nightly.yml cron 1회 green

- **Evidence**: `.github/workflows/eval-nightly.yml` cron 활성 + 최근 run history
- **검증 명령어**:
  ```bash
  gh run list --workflow=eval-nightly.yml --limit 5
  ```
- **Pass criteria**:
  - cron 활성 (라인 33-35 주석 해제 commit hash 확인)
  - 최근 5회 중 ≥ 2회 green
  - flake = 0 (24h 측정 단계 4 충족 evidence)
- **Fail action**: 활성화 6단계 게이트 미통과 → DASHBOARD §6 단계 1~6 진척 점검, 단계 4 시점에 멈췄으면 +24h 재측정
- **D-7 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **devops**

---

### 조건 #6 — Audit_log alert stub dev 검증

- **Evidence**:
  - `infra/supabase/migrations/0004_audit_triggers.sql`
  - `.github/workflows/security-alert-stub.yml`
  - `docs/qa/AUDIT_ALERT_RUNBOOK.md`
  - dev 환경에서 인위적 RLS-ADV-005 위반 1건 발화 → `security_alerts` row 적재 로그
- **검증 명령어**:
  ```bash
  # dev 환경 (staging은 절대 사용 금지)
  curl -X POST "$DEV_SUPABASE_URL/rest/v1/rpc/<adversarial-call>" -H "..."
  # 그 후 supabase dashboard에서 security_alerts row count 확인
  ```
- **Pass criteria**:
  - dev 위반 발생 후 30초 내 `security_alerts` row +1
  - console 또는 Slack stub 알림 적재 (실제 Slack은 D-021 deferred)
  - 정상 호출에는 row 적재 없음 (false positive 0)
- **Fail action**: trigger SQL review → security agent에게 root-cause 요청
- **D-7 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **security + devops**

---

### 조건 #7 — R-23 (RLS) + R-24 (distractors retire) 해소

- **Evidence**:
  - `docs/RISK_REGISTER.md` R-23 / R-24 status = "closed"
  - R-23 closed 사유: 조건 #3 nightly green + 13/13 violation 분류
  - R-24 closed 사유: `distractors_after_retire` 검증 함수 + content_retirement 시점 distractor 누락 0건
- **검증 명령어**:
  ```bash
  grep -A 2 "R-23\b\|R-24\b" docs/RISK_REGISTER.md
  ```
- **Pass criteria**: 두 risk 모두 status="closed" + closed 일자 = 2026-05-XX (W16 내)
- **Fail action**: 해소 트리거 미충족 → RISK_REGISTER 본문에 D-7 시점 잔여 사유 명시 + M4 W17 mitigation backlog 등재
- **D-7 도장**: `[ ] PASS (R-23 + R-24 둘 다 closed)  [ ] PARTIAL  [ ] FAIL  ` 책임: **security (R-23) + content (R-24)**

---

### 조건 #8 — ADR-0003 (Custom runner Firebase) ✅

- **Evidence**: `docs/adr/ADR-0003-custom-runner-firebase.md` (Accepted W13)
- **D-7 도장**: ✅ **PASS** (사전 충족, 재검증 불필요)

---

### 조건 #9 — ADR-0006 (packages/srs-core) ✅

- **Evidence**: `docs/adr/ADR-0006-srs-core-package.md` (Accepted W15 Cycle A 2026-05-12)
- **D-7 도장**: ✅ **PASS** (사전 충족, 재검증 불필요)

---

### 조건 #10 — PRD threshold 4 KPI commit ✅

- **Evidence**: `docs/product/PRD.md §8.2` (4 KPI band — Target / Minimum / Yellow / Red 3-tier + relative 전환 조건 + 출처)
- **D-7 도장**: ✅ **PASS** (사전 충족 — W15 Day-1)

---

## 2. D-5 / D-6 / D-7 일자별 체크리스트

### D-5 (2026-05-23 금) — analytics + devops 작업

- [ ] `pnpm baseline:check --weekly` 1회 실행 → `metrics/weekly/2026-05-23-weekly.md` commit (analytics)
- [ ] eval-nightly cron 활성화 6단계 게이트 단계 5 진입 — 주석 해제 PR (devops, reviewer=security)
- [ ] cron 활성화 직후 첫 manual dispatch 1회 green 확인
- [ ] R-23/R-24 closed 사전 점검 (`docs/RISK_REGISTER.md`)
- [ ] **D-7까지 잔여 작업 list 갱신** (DASHBOARD §6.3 갱신)

### D-6 (2026-05-24 토) — pm + orchestrator 작업

- [ ] W16-05 REVIEW_QA 일괄 갱신 (pm)
- [ ] Audit alert stub dev 1회 위반 발화 + security_alerts 적재 확인 (security + devops)
- [ ] 본 CHECKLIST의 각 조건에 evidence 첨부 — 도장 영역에 PASS/FAIL 임시 작성
- [ ] orchestrator 사전 판정 (D-7 final 직전 dry-run)

### D-7 (2026-05-25 일) — orchestrator 최종 판정 + 사용자 reconfirm

- [ ] 본 CHECKLIST 모든 조건의 D-7 도장 확정 (10/10)
- [ ] PASS 7~10건 시 M3 종료 판정 → M4 W17 진입 권고
- [ ] PASS 5~6건 시 CONDITIONAL → 미충족 조건 mitigation 후 24h 내 재판정
- [ ] PASS ≤ 4건 시 M3 종료 연기 → Owner 결정 필요
- [ ] W16-04 rollup draft 작성 (orchestrator)
- [ ] **사용자(Owner) reconfirm**: 본 CHECKLIST의 모든 도장 결과를 Owner가 검토 + 통합 승인

---

## 3. 판정 행렬 (PASS 누적 기반)

| PASS 수 | 판정 | 다음 액션 |
|---|---|---|
| 10/10 | **M3 종료 — 게이트 통과** | M3 release notes 작성 + M4 W17 entry |
| 9/10 | **CONDITIONAL PASS** | 미충족 1건의 mitigation을 M4 W17 첫 sprint에 우선 처리 + 사용자 통보 |
| 7~8/10 | **CONDITIONAL HOLD** | 24~48h 보강 후 재판정 (M3 종료 1~2일 지연) |
| 5~6/10 | **HOLD** | 1주 보강 후 재판정 (M3 종료 1주 지연, M4 일정 영향) |
| ≤ 4/10 | **FAIL** | Owner 결정 — M3 범위 축소 또는 일정 재설정 |

---

## 4. 사용자(Owner) reconfirm 양식

D-7 판정 결과를 Owner에게 다음 양식으로 보고:

```
M3 GATE V2 — D-7 판정 결과 (2026-05-25)

조건별 도장:
#1  Evaluator 5 strict CI:       [PASS/FAIL]  evidence: <url>
#2  Golden 100+건:               PASS         (사전 충족)
#3  Adversarial 13 violation:    [PASS/FAIL]  evidence: <url>
#4  Baseline 3-source 14d:       [PASS/CONDITIONAL/FAIL]  evidence: <url>
#5  eval-nightly cron green:     [PASS/FAIL]  evidence: <url>
#6  Audit alert stub dev 검증:    [PASS/FAIL]  evidence: <url>
#7  R-23 + R-24 closed:          [PASS/PARTIAL/FAIL]  evidence: <url>
#8  ADR-0003:                    PASS         (사전 충족)
#9  ADR-0006:                    PASS         (사전 충족)
#10 PRD threshold:               PASS         (사전 충족)

누적: N/10 PASS

orchestrator 판정: [M3 종료 / CONDITIONAL PASS / HOLD / FAIL]
사유: <1~3 sentence>

다음 단계 권고:
- (PASS 시) M4 W17 entry — backlog 1순위: <항목>
- (HOLD 시) 보강 작업 N건 — 책임 agent + 일정

Owner reconfirm 요청: [통합 승인 / 부분 수정 / 보류]
```

---

## 5. Reversal Trigger (게이트 통과 후에도 발동 가능)

다음 중 1건이라도 D-7 통과 후 ≤ 7일 내 발생 시 M3 게이트 재오픈:

- **R1** (ADR-0007 §6): baseline source 1개가 ≥ 3일 fail
- **R2** (DASHBOARD §6.3): eval-nightly cron 활성 첫 3일 중 ≥ 2회 fail
- **R3**: 조건 #6 audit alert이 prod 운영 시점 false positive ≥ 1건/day
- **R4** (Motion v1.1 후속): 4-rule Merge Gate 위반 PR ≥ 1건 머지 발생

각 trigger 발동 시 orchestrator가 즉시 본 CHECKLIST 재판정 + Owner 통보.

---

## 6. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-22 | D-4 사전 양식 작성 (orchestrator) — 10조건 evidence 양식 + D-5/D-6/D-7 일자별 체크리스트 + 판정 행렬 + Reversal Trigger |
