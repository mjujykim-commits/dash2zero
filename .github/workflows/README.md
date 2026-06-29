# GitHub Actions Workflows — dash2zero

> 책임: **devops** · 마지막 갱신: 2026-05-11 (M3 W15)

| Workflow | Trigger | 책임 | 상태 |
|---|---|---|---|
| `pr-check.yml` | PR | devops | active |
| `eval-on-pr.yml` | PR (paths) | devops + analytics | active (4 job strict) |
| `eval-nightly.yml` | manual dispatch | security + devops | **manual only** — cron pending |
| `eas-build.yml` | manual / tag | devops | active |
| `security-alert-stub.yml` | manual dispatch | security + devops | **stub** (M5 활성화) |

---

## eval-nightly.yml — Cron 활성화 6단계 체크리스트

> 본 체크리스트는 cron 스케줄을 켜기 전 **반드시** 모든 단계를 통과해야 함. orchestrator 결정으로 W15 진입 시점에는 **manual dispatch만** 허용.
>
> 활성화 순서를 어기면: nightly가 매일 빨갛게 켜져 알람 피로 → on-call 신뢰 잠식 → 1인 운영 환경에서 가장 비싼 실패.

### 단계 1 — RLS evaluator 코드 머지 (security + backend)

- [ ] `scripts/eval/rls.ts` 머지 (현재 file 존재하나 stub 가능성 — `evaluateRlsCase()` 본체 확인)
- [ ] `fixtures/adversarial/rls/RLS-ADV-001~009.yaml` 9건 모두 commit
- [ ] `scripts/eval/runner.ts`의 category dispatch 라우팅에 `rls` 포함 (확인됨)
- [ ] PR reviewer: security (자체 작성자 외 1인)

**차단**: 본 단계 미완 상태에서 cron만 켜면 매일 fail. **금지**.

### 단계 2 — 로컬 9/9 PASS 확인 (devops)

```bash
pnpm eval:rls -- --strict
# 기대: TOTAL: 9 pass / 0 fail / 0 skip / 9 total
```

- [ ] 로컬 Supabase docker가 떠 있고 0002_rls.sql 적용 완료
- [ ] anon JWT + user1/user2/support JWT 4종 fixture 발급
- [ ] 9/9 PASS, 실행 시간 기록 (단계 4 baseline 비교용)

### 단계 3 — GitHub Actions manual dispatch 1회 PASS (devops)

```
GitHub UI → Actions → Eval Nightly (RLS / Adversarial) → Run workflow
```

- [ ] 0 fail / 0 skip
- [ ] Wall time 기록 (run ID + 분 단위) → 단계 4 평균/p95 산정에 포함

### 단계 4 — 24시간 flake 측정 (devops)

> RLS는 DB 의존 → pg_test_role 환경 부팅 시간 변동 가능. flake = 동일 코드 / 동일 fixture에서 결과 비결정성.

- [ ] 24시간 동안 추가 manual dispatch **2회** 실행 (간격 6h+)
- [ ] 평균 wall time 기록 (분)
- [ ] p95 wall time 기록 (분) — 10분 초과 시 cron 활성화 보류
- [ ] flake 0/3 시 통과. 1건 발생 시: dispatch 5회 추가 → 0/5 시 통과, 1/5 이상 시 차단 + root-cause 분석 (security 협업)

| 지표 | 측정값 | 임계 |
|---|---|---|
| 평균 wall time | __ min | < 5 min |
| p95 wall time | __ min | < 10 min (timeout-minutes: 15와 정합) |
| flake rate (3회 기준) | __/3 | 0/3 (혹은 0/5 보강) |

기록 위치: `context/agents/devops/<날짜>-chore-eval-nightly-flake-window.md` (단계 4 통과 시 commit).

### 단계 5 — Cron 주석 해제 PR (devops)

`.github/workflows/eval-nightly.yml` 라인 31-32:

```yaml
  # schedule:
  #   - cron: '0 17 * * *'   # 매일 KST 02:00 / UTC 17:00
```

→

```yaml
  schedule:
    - cron: '0 17 * * *'   # 매일 KST 02:00 / UTC 17:00
```

- [ ] PR 변경은 본 라인 + skip-tolerant → strict 전환 1줄, 그 외 변경 금지
- [ ] reviewer = security
- [ ] PR description에 단계 1~4 측정값 인용

### 단계 6 — 활성화 후 첫 3일 모니터링 (devops)

- [ ] 매일 09:00 KST 결과 수동 확인 (Slack #ci-status 봇 미설정 상태 가정)
- [ ] 3일 내 0 fail = 정상 운영 진입
- [ ] **3일 내 2회 이상 fail = 즉시 cron 재주석** + R-23 재오픈 + security에 root-cause 요청
- [ ] **p95 wall time 10분 초과 = 즉시 cron 재주석** + workflow 분리 검토

---

## eval-nightly.yml 외 nightly 후보 (M5 검토)

- baseline view 일배치 SQL 실행 (analytics 합의 후)
- audit_log 위반 일배치 요약 → Slack #security-test (security-alert-stub.yml 참조)
- EAS Build 사용량 dashboard 갱신

본 W15 시점에는 **eval-nightly만**. 그 외 nightly cron 추가 금지.

---

## eval-on-pr.yml — 4 job 병렬 wall time 측정 가이드

향후 5번째 evaluator (RLS PR opt-in label 또는 별도) 추가 시 전체 PR check이 ≤ 10분 유지 가능한지 검증. 측정 절차는 `docs/devops/EVAL_PR_CAPACITY.md` 참조.

---

## security-alert-stub.yml — M5 활성화 절차

stub 상태에서는 trigger + workflow 골격만 commit. secret 등록은 `docs/devops/AUDIT_ALERT_SECRETS.md` 참조.

---

## 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-11 | 초안 — eval-nightly cron 6단계 체크리스트 + workflow 표 | devops |
