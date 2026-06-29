# M3 W15 — Sprint Artifacts Inventory (12명 + Cycle A/B + 사전 양식)

> 작성: orchestrator
> 책임: W15 sprint 신규/갱신된 모든 파일 단일 인벤토리. W16 게이트 검증 입력 + Cycle C 종료 rollup의 입력 SSOT
> 작성일: 2026-05-12 (M3 W15 Cycle B dispatch + 사전 양식 작업 마감 직후)
> 갱신 trigger: Cycle B/C 작업물 머지 시점

---

## 0. 한 줄 요약

**12명 agent + orchestrator 4 사이클 + Cycle B 7건 작업 큐 + 사전 양식 6건 = 신규 ~74 파일 + 갱신 ~22 파일** (Cycle A 시점 카운트, Cycle B/C 진행 시 추가 예상)

---

## 1. 12명 시니어 1차 산출물 (Cycle A, 2026-05-11 23:00)

### architect
- `docs/adr/ADR-0006-shared-srs-module.md` (신규)
- `packages/srs-core/package.json` (신규)
- `packages/srs-core/tsconfig.json` (신규)
- `packages/srs-core/tsup.config.ts` (신규)
- `packages/srs-core/src/index.ts` (신규)
- `context/agents/architect/20260511-2230-feat-m3-w15-adr-0006.md` (신규)

### planner
- `docs/product/PRD.md` §8.1~8.4 (갱신: 4 KPI band + paywall source enum + Privacy Manifest 체크리스트)
- `docs/product/USER_JOURNEYS.md` (갱신: J-007 RC alias 삭제 7단계 + J-004 W15-W16 추가 검증)
- `docs/product/M5_BETA_OUTLINE.md` (신규 1줄 stub)
- `context/agents/planner/20260511-2300-feat-m3-w15-prd-thresholds.md` (신규)

### backend
- `scripts/eval/rls.ts` (전면 재작성)
- `scripts/eval/runner.ts` (갱신: assertAllPoliciesClassified + ASCII log)
- `fixtures/adversarial/rls/RLS-ADV-006-service-role-positive.yaml` (신규 → D-014 rename: RLS-ADV-010)
- `fixtures/adversarial/rls/RLS-ADV-007-cross-user-attempt-insert.yaml` (신규 → D-014 rename: RLS-ADV-011)
- `fixtures/adversarial/rls/RLS-ADV-008-uws-direct-update.yaml` (신규 → D-014 rename: RLS-ADV-012)
- `fixtures/adversarial/rls/RLS-ADV-009-deletion-after-completed.yaml` (신규 → D-014 rename: RLS-ADV-013)
- `fixtures/golden/payment/PAY-004~005/007/009/011/013/014/015.yaml` (신규 8건)
- `fixtures/golden/payment/README.md` (갱신: 분포 정정 7→15)
- `context/agents/backend/20260511-2300-feat-m3-w15-rls-payment.md` (신규)

### security
- `docs/security/RLS_EVALUATOR_HYBRID_PLAN.md` (신규)
- `docs/security/AUDIT_ALERT_RUNBOOK.md` (신규)
- `infra/supabase/migrations/0004_audit_triggers.sql` (신규)
- `.github/workflows/security-alert-stub.yml` (신규)
- `fixtures/adversarial/rls/RLS-ADV-001~004.yaml` (갱신: review note prepend)
- `fixtures/adversarial/rls/RLS-ADV-005-anon-non-starter-pack-read.yaml` (신규)
- `fixtures/adversarial/rls/RLS-ADV-006-expired-entitlement-premium-audio.yaml` (신규)
- `fixtures/adversarial/rls/RLS-ADV-007-attempts-update-append-only.yaml` (신규)
- `fixtures/adversarial/rls/RLS-ADV-008-cross-user-content-reports-read.yaml` (신규)
- `fixtures/adversarial/rls/RLS-ADV-009-deletion-completed-self-update.yaml` (신규)
- `context/agents/security/20260511-2300-feat-m3-w15-rls-audit-alert.md` (신규)

### analytics
- `fixtures/golden/srs/SRS-{007,008,010,011,015,016,017,019,020,023,025,028,030,034,037,039,041,043,044,051,052,053}.yaml` (신규 22건; 051/052/053은 slug 형식 유지)
- `fixtures/golden/srs/README.md` (갱신)
- `docs/12_event_taxonomy.md` §3.1~3.4 (신규: Mastered/Weak event spec)
- `scripts/baseline/queries.sql` (신규: 5 view)
- `docs/harness/BASELINE_METRICS.md` (신규)
- `scripts/baseline/run.ts` (신규)
- `context/agents/analytics/20260511-2300-feat-m3-w15-srs-emit-baseline.md` (신규)

### frontend
- `packages/contracts/src/schemas.ts` (갱신: enum 확장)
- `apps/mobile/src/lib/analytics.ts` (갱신: 3 emit helpers + session_id)
- `apps/mobile/src/lib/api.ts` (갱신: 자동 emit 제거)
- `apps/mobile/src/hooks/useLesson.ts` (갱신: chain fetch)
- `apps/mobile/app/lesson/[wordId].tsx` (갱신: chain 진행 UI + emit)
- `apps/mobile/app/paywall.tsx` (갱신: paywall_signin_required emit)
- `context/agents/frontend/20260511-2300-feat-m3-w15-emit-lesson-chain.md` (신규)

### legal
- `fixtures/golden/privacy/PRV-012.yaml` (신규: family_share)
- `fixtures/golden/privacy/PRV-013.yaml` (신규: KR minor refund)
- `fixtures/golden/privacy/PRV-014.yaml` (신규: GDPR Art.7(3))
- `fixtures/golden/privacy/PRV-015.yaml` (신규: CCPA opt-out)
- `fixtures/golden/privacy/PRV-016.yaml` (신규: DSR cancel-window)
- `fixtures/golden/privacy/README.md` (갱신: 11→16)
- `docs/13_payment_policy.md §5.1` (신규: Paywall 4-variant lock)
- `docs/16_privacy_policy.md §16` (재작성: RED → GREEN)
- `docs/legal/FAMILY_SHARE_OPS.md` (신규)
- `context/agents/legal/20260511-2300-feat-m3-w15-privacy-policy.md` (신규)

### learning
- `fixtures/golden/srs/SRS-051.yaml` (신규 → D-015 rename: SRS-056)
- `fixtures/golden/srs/SRS-052.yaml` (신규 → D-015 rename: SRS-057)
- `fixtures/golden/srs/SRS-053.yaml` (신규 → D-015 rename: SRS-058)
- `fixtures/golden/srs/SRS-054.yaml` (신규 → D-015 rename: SRS-059)
- `fixtures/golden/srs/SRS-055.yaml` (신규 → D-015 rename: SRS-060)
- `fixtures/golden/content/CTN-009.yaml` (신규: distractor 의미 거리)
- `fixtures/golden/content/CTN-010.yaml` (신규: RR 받침 spot check)
- `fixtures/golden/content/CTN-011.yaml` (신규: manifest etag)
- `fixtures/golden/content/README.md` (갱신: 8→14)
- `docs/learning/LESSON_COMPLETE_RATE_THRESHOLDS.md` (신규)
- `context/agents/learning/20260511-2300-feat-m3-w15-srs-content-thresholds.md` (신규)

### qa
- `fixtures/golden/srs/SRS-045-i18n-locale-switch-state-preserved.yaml` (신규)
- `fixtures/golden/srs/SRS-046-i18n-rr-romanization-multilang-display.yaml` (신규)
- `fixtures/golden/srs/SRS-047-i18n-tz-kst-vs-utc-04-reset.yaml` (신규)
- `fixtures/golden/srs/SRS-048-a11y-voiceover-stage-change-announce.yaml` (신규)
- `fixtures/golden/srs/SRS-049-a11y-dynamic-type-200-card-fit.yaml` (신규)
- `fixtures/golden/srs/SRS-050-a11y-color-blind-stage-distinguishable.yaml` (신규)
- `fixtures/golden/srs/SRS-061~064-daily-limit-*.yaml` (신규: rename from 047~050)
- `fixtures/golden/srs/README.md` (갱신: last writer + i18n/a11y 카테고리 신설)
- `scripts/eval/srs.ts` (갱신: category enum +2 → +7 W15-09 이후)
- `docs/qa/M4_E2E_SUITE_PLAN.md` (신규)
- `context/agents/qa/20260511-2300-feat-m3-w15-i18n-a11y-m4plan.md` (신규)

### devops
- `scripts/seed/synthetic-baseline.ts` (신규, ~360 LoC, 결정적 PRNG)
- `scripts/seed/README.md` (신규)
- `.github/workflows/eval-nightly.yml` (갱신: unskip 조건 주석 + timeout-minutes:15 + wall time 기록)
- `.github/workflows/README.md` (신규: cron 활성화 6단계 체크리스트)
- `docs/devops/AUDIT_ALERT_SECRETS.md` (신규)
- `docs/devops/EVAL_PR_CAPACITY.md` (신규)
- `context/agents/devops/20260511-2300-feat-m3-w15-baseline-seed-cron.md` (신규)

### pm
- `docs/pm/W15_SPRINT_BOARD.md` (신규)
- `docs/pm/CAPACITY_LEDGER.md` (신규)
- `docs/REVIEW_QA.md` Q-PM-W15-001~004 (갱신: status)
- `context/agents/pm/20260511-2300-feat-m3-w15-sprint-board.md` (신규)

### designer
- `docs/design/LESSON_CHAIN_PATTERN.md` (신규)
- `docs/design/DARK_MODE_ADOPTION_MATRIX.md` (신규)
- `docs/design/STATE_PATTERNS.md` (신규)
- `docs/design/RR_TYPOGRAPHY_GUIDE.md` (신규)
- `packages/design-tokens/src/states.ts` (신규)
- `packages/design-tokens/src/index.ts` (갱신: states export)
- `context/agents/designer/20260511-2300-feat-m3-w15-r28-darkmode-states.md` (신규)

**12명 합산**: 신규 ~62 파일 + 갱신 ~15 파일

---

## 2. orchestrator 사이클별 산출물 (2026-05-12)

### Cycle A 통합 (12:00)
- `context/rollups/20260512-M3-W15-cycle-a-integration.md` (신규)
- `context/agents/orchestrator/20260512-1200-chore-m3-w15-cycle-a-integration.md` (신규)
- `docs/DECISION_LOG.md` D-014 / D-015 / D-013 검증 / ADR-0006 Accepted + §5 이력 (갱신)
- `fixtures/adversarial/rls/RLS-ADV-{010,011,012,013}-*.yaml` (rename backend 4건 + id 필드 갱신)
- `fixtures/adversarial/rls/README.md` (갱신: 9→13)
- `fixtures/golden/srs/SRS-{056,057,058,059,060}-*.yaml` (rename learning 5건 + id 필드 갱신)
- `fixtures/golden/srs/README.md` (갱신: 52→57 + W15 Cycle A 절)

### Cycle B dispatch (14:00)
- `context/rollups/20260512-M3-W15-cycle-b-dispatch.md` (신규)
- `context/agents/orchestrator/20260512-1400-chore-m3-w15-cycle-b-dispatch.md` (신규)
- `docs/PROJECT_MAP.md` (갱신: 8 보강 디렉토리 + 5 예정 디렉토리)
- `docs/HANDOFF.md` (갱신: Cycle A 진척 + §4.1 게이트 조건)
- `docs/harness/M3_GATE_V2_DASHBOARD.md` (신규)

### 사전 양식 작업 (17:00)
- `context/rollups/20260512-M3-W16-gate-sprint-plan.md` (신규)
- `context/rollups/M3-completed-template.md` (신규)
- `context/rollups/20260512-M4-entry-preview-dispatch.md` (신규)
- `context/agents/orchestrator/20260512-1700-chore-w16-m4-preview-templates.md` (신규)

### RISK_REGISTER 사이클 (20:00)
- `docs/risk/RISK_REGISTER.md` (신규)
- `docs/DECISION_LOG.md` D-016 / D-017 (갱신)
- `docs/PROJECT_MAP.md` (갱신: docs/risk/)
- `context/rollups/20260512-R-M5-01-user-reconfirm-template.md` (신규)
- `context/rollups/20260512-M5-entry-preview-dispatch.md` (신규)
- `context/agents/orchestrator/20260512-2000-chore-risk-register-m5-preview.md` (신규)

### 정책/감사/CHANGELOG 사이클 (22:00)
- `AGENTS.md` (갱신: §5.3 3행 + §5.4 정책 5조 + §11 이력)
- `docs/harness/HARNESS_COMPLIANCE_AUDIT.md` (신규)
- `CHANGELOG.md` (신규)
- `docs/PROJECT_MAP.md` (갱신: HARNESS_COMPLIANCE_AUDIT 상태)
- `context/agents/orchestrator/20260512-2200-chore-policy-audit-changelog.md` (신규)

### Cross-Reference / Inventory 사이클 (현재)
- `docs/DECISION_RISK_ADR_MATRIX.md` (신규)
- 본 문서 (신규)

**orchestrator 합산**: 신규 ~17 파일 + 갱신 ~9 파일

---

## 3. Cycle B 예상 산출물 (W15 후반, 2026-05-13~17)

### W15-09 (R-31)
- `scripts/eval/srs.ts` (갱신: enum 5종 추가)
- `scripts/eval/srs.spec.ts` (갱신: 5건 unit test)
- `context/agents/backend/20260516-XXXX-feat-m3-w15-srs-enum-activation.md` (신규)

### W15-10 (R-32)
- `scripts/eval/privacy.ts` (갱신: union 3종 추가)
- `scripts/eval/privacy.spec.ts` (갱신: 3건 unit test)
- `context/agents/backend/20260516-XXXX-feat-m3-w15-privacy-union.md` (갱신 동일 context)

### W15-02b
- `metrics/daily/2026-05-{12,13,14,15,16,17}.json` (신규 6건)
- `context/agents/analytics/20260513-XXXX-feat-m3-w15-baseline-day-0.md` (신규)

### W15-04b
- `pnpm eval:srs --strict` 57/57 green log (CI run URL)
- `context/agents/qa/20260516-XXXX-feat-m3-w15-srs-nightly.md` (신규)

### W15-06b
- dev 환경 RLS 위반 1건 → security_alerts row 검증 log
- `docs/security/AUDIT_ALERT_RUNBOOK.md` (갱신: 검증 결과 절 추가)
- `context/agents/security/20260516-XXXX-feat-m3-w15-alert-stub-dev.md` (신규)

### W15-07b
- `scripts/eval/content.ts` (갱신: distractors_after_retire 검증 함수)
- nightly cron 단계 3 manual dispatch green log
- `context/agents/devops/20260517-XXXX-feat-m3-w15-cron-unblock.md` (신규)

### W15-11
- `docs/REVIEW_QA.md` (갱신: Q-PM-W15-001~004 status RESOLVED)
- `docs/pm/W15_SPRINT_BOARD.md` (갱신: 17건 작업 큐 진척)
- `docs/harness/HARNESS_EXECUTION_BOARD.md` (갱신: D-010 정합)
- `context/agents/pm/20260517-XXXX-feat-m3-w15-cross-doc-sync.md` (신규)

**Cycle B 예상 합산**: 신규 ~12 파일 + 갱신 ~7 파일

---

## 4. Cycle C 예상 산출물 (W15 sprint 종료 rollup, 2026-05-18)

- `context/rollups/20260518-M3-W15-sprint-complete.md` (신규)
- `context/agents/orchestrator/20260518-XXXX-chore-m3-w15-sprint-complete.md` (신규)
- `SWARM_LEDGER.md` (갱신: W15 종료 entry)
- `docs/HANDOFF.md` (갱신: W15 진척 + W16 진입 신호)
- `docs/risk/RISK_REGISTER.md` (갱신: R-23/R-24/R-31/R-32 closed)
- `docs/harness/HARNESS_COMPLIANCE_AUDIT.md` (갱신: Cycle B 후 완성도 갱신)
- `docs/harness/M3_GATE_V2_DASHBOARD.md` (갱신: 9/10 + #4 partial)

**Cycle C 예상**: 신규 2 파일 + 갱신 5 파일

---

## 5. W16 게이트 검증 sprint 예상 산출물 (2026-05-19~25)

W16 sprint plan §10 DoD 참조:
- W16-01: `metrics/daily/2026-05-{19~25}.json` 7건 + `scripts/baseline/check-thresholds.ts` + `metrics/weekly/2026-05-19-to-2026-05-25.md`
- W16-02: `docs/adr/ADR-0007-baseline-storage.md` Accepted + D-018 봉인
- W16-03: M3_GATE_V2_DASHBOARD §5 양식 채움 (10조건 PASS/CONDITIONAL/FAIL)
- W16-04: `context/rollups/20260526-M3-completed.md` (template fill)
- W16-05: REVIEW_QA W15 라운드 status 100% 갱신

**W16 예상 합산**: 신규 ~12 파일 + 갱신 ~6 파일

---

## 6. 전체 누적 (W15 sprint 종료 + W16 게이트 검증 + M3 종료 시점)

| 단계 | 신규 | 갱신 | 누적 신규 |
|---|---:|---:|---:|
| 12명 1차 (Cycle A 직전) | 62 | 15 | 62 |
| orchestrator Cycle A | 5 | 9 | 67 |
| orchestrator Cycle B dispatch | 3 | 4 | 70 |
| orchestrator 사전 양식 (W16/M3/M4) | 4 | 0 | 74 |
| orchestrator RISK_REGISTER + R-M5-01 + M5 | 4 | 4 | 78 |
| orchestrator 정책/감사/CHANGELOG | 3 | 3 | 81 |
| orchestrator Cross-Reference + Inventory | 2 | 0 | 83 |
| Cycle B 예상 | 12 | 7 | 95 |
| Cycle C 예상 | 2 | 5 | 97 |
| W16 예상 | 12 | 6 | **109** |
| **M3 종료 시 누적** | **~109** | **~53** | — |

---

## 7. 머지 검증용 체크리스트 (Cycle B 통합 + W15 sprint 종료 시 사용)

- [ ] 12명 시니어 1차 산출물 ~77 파일 모두 머지 (Cycle A 봉인 시점에 검증, 본 인벤토리 §1)
- [ ] orchestrator Cycle A/B/사전 양식/RISK/정책/Cross-Reference ~26 파일 모두 commit (본 인벤토리 §2)
- [ ] Cycle B 7 작업 ~19 파일 commit (본 인벤토리 §3)
- [ ] Cycle C ~7 파일 commit (본 인벤토리 §4)
- [ ] W16 ~18 파일 commit (본 인벤토리 §5)
- [ ] DoD 충족 (AGENTS.md §7) — 모든 파일 단위로 검증
- [ ] CHANGELOG.md `[M3 release tag]` 전환 (2026-05-26)

---

## 8. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-12 | M3 W15 Cycle B dispatch + 사전 양식 작업 마감 직후 신규 작성 — 12명 + orchestrator 6 사이클 + Cycle B/C/W16 예상 산출물 통합 인벤토리 |
