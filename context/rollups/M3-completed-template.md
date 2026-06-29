# M3 Completed — Harness Hardening 게이트 통과 (Template)

> 작성: orchestrator (사전 양식, 2026-05-12)
> 실 commit 일자: 2026-05-26 (W16 종료 직후)
> Sprint 통합: W13 + W14 + W15 + W16
> 게이트 판정 SSOT: `docs/harness/M3_GATE_V2_DASHBOARD.md`

> **사용 방법**: W16-04 작업 시 본 template을 `context/rollups/20260526-M3-completed.md`로 복사 후 [TBD] / [VAL] 자리에 실측치 / 결정 결과 / commit SHA 채움

---

## 0. M3 한 줄 결산

dash2zero swarm coding M3 Harness Hardening — **[TBD: 4 sprint × N개 산출물 = ~N,NNN줄] 산출**, M3 게이트 v2 10조건 **[TBD: PASS / CONDITIONAL / FAIL] 판정**, R-12 SoT drift / R-23 RLS / R-24 distractors retire 등 **[TBD: N건] risk 해소**, **[TBD: D-NNN N건 / ADR-NNNN N건] 봉인**, **M4 진입 신호 발사**.

---

## 1. Sprint별 산출 인덱스

### W13 — Harness Foundation (2026-05-11 1차)

- Rollup: `context/rollups/20260511-M3-W13-harness-srs-foundation.md`
- 산출물:
  - ADR-0003 Accepted (Custom runner + Firebase)
  - `scripts/eval/runner.ts` + `scripts/eval/srs.ts` + `srs.spec.ts`
  - `fixtures/golden/srs/` 7 대표 case
  - `package.json` eval scripts
- 결정 적용: ADR-0003 / CC2-07 / CC3-05 / CC-17 / R-12 partial

### W14 — Evaluators + Adversarial + CI (2026-05-11 2차)

- Rollup: `context/rollups/20260511-M3-W14-evaluators-and-ci.md`
- 산출물 28파일:
  - `apps/api/edge-functions/_shared/billing.ts` (Payment SoT)
  - `scripts/eval/{payment,privacy,content}.ts` + runner 라우팅
  - Golden: payment 7 + privacy 6 + content 8 + srs +15
  - Adversarial: rls 4 + payment 2 + privacy 3
  - `.github/workflows/eval-on-pr.yml` (4 job strict) + `eval-nightly.yml`
- 결정 적용: R-12 패턴 확장 / CC2-08 / CC2-07 / CC3-05 / CC-11 / CC2-11 / CC3-04 / ADR-0004

### W15 — Hardening + ID 충돌 해소 (2026-05-11~18)

- Dispatch v2: `context/rollups/20260511-M3-W15-dispatch-plan-v2.md`
- Cycle A 통합: `context/rollups/20260512-M3-W15-cycle-a-integration.md`
- Cycle B dispatch: `context/rollups/20260512-M3-W15-cycle-b-dispatch.md`
- Cycle C 종료 rollup: `context/rollups/[TBD]20260518-M3-W15-sprint-complete.md`
- 산출물 [TBD]:
  - architect: ADR-0006 Accepted (packages/srs-core) + Phase 1 스켈레톤
  - planner: PRD §8 4 KPI band (D-013 충족) + J-007 RC alias 삭제 + Privacy Manifest 체크리스트
  - backend: scripts/eval/rls.ts 본화 + Payment 8 golden + SRS-056~060 evaluator enum 5종 (W15-09) + privacy union 3종 (W15-10)
  - security: RLS_EVALUATOR_HYBRID_PLAN + adversarial 5건 (STRIDE) + audit_triggers SQL + workflow stub + ALERT_RUNBOOK + dev 검증
  - analytics: BASELINE_METRICS + queries.sql + run.ts + SRS 22 + Mastered/Weak event spec + Day-0~6 snapshot
  - frontend: 3 emit helpers + lesson chain + paywall_signin_required + session_id
  - legal: Privacy 5 golden + Paywall 4-variant lock + 정책 변경 동의 vs 통지 + FAMILY_SHARE_OPS
  - learning/content: SRS 5 + Content 3 + LESSON_COMPLETE_RATE_THRESHOLDS
  - qa: i18n/a11y 6 golden + daily_limit rename + M4_E2E_SUITE_PLAN
  - devops: synthetic-baseline.ts + eval-nightly + AUDIT_ALERT_SECRETS + EVAL_PR_CAPACITY + cron 단계 1~5
  - pm: W15_SPRINT_BOARD + CAPACITY_LEDGER + REVIEW_QA 통합
  - designer: LESSON_CHAIN_PATTERN + DARK_MODE_ADOPTION_MATRIX + STATE_PATTERNS + RR_TYPOGRAPHY_GUIDE + states.ts
- 결정 적용: D-010~D-015 + ADR-0006 + R-26 해소 + R-31/R-32 해소

### W16 — 게이트 검증 (2026-05-19~25)

- Sprint plan: `context/rollups/20260512-M3-W16-gate-sprint-plan.md`
- 종료 rollup: 본 문서
- 산출물:
  - W16-01: baseline Day-7~13 7건 + threshold check + weekly summary
  - W16-02: ADR-0007 Accepted (baseline 저장소 3-source)
  - W16-03: M3 게이트 10조건 검증 + 판정
  - W16-05: REVIEW_QA W15 라운드 status 100%

---

## 2. M3 게이트 v2 판정 (W16-03 결과)

| # | 조건 | 판정 | 증거 |
|---:|---|:---:|---|
| 1 | Evaluator 5 strict CI | [VAL: PASS / FAIL] | `.github/workflows/eval-on-pr.yml` 5 job [TBD: 14d 모두 green] |
| 2 | Golden 100+건 | [VAL: PASS / FAIL] | Cycle A 102 + Cycle B 검증 [TBD: 최종 분포] |
| 3 | Adversarial 13 violation 분류 | [VAL: PASS / FAIL] | nightly cron log [TBD: green run URL] |
| 4 | baseline 3-source 14d | [VAL: PASS / CONDITIONAL / FAIL] | `metrics/daily/2026-05-12~25.json` 14건 + 적재 확인 |
| 5 | eval-nightly cron 1+ green | [VAL: PASS / FAIL] | 최초 green run [TBD: URL + 일자] |
| 6 | alert stub dev 검증 | [VAL: PASS / FAIL] | dev console log + security_alerts row [TBD: commit SHA] |
| 7 | R-23 / R-24 closed | [VAL: PASS / FAIL] | RISK_REGISTER closed 표시 [TBD: 일자] |
| 8 | ADR-0003 Accepted | PASS ✅ | `docs/adr/ADR-0003-custom-runner-firebase.md` (W13) |
| 9 | ADR-0006 Accepted | PASS ✅ | `docs/adr/ADR-0006-shared-srs-module.md` (W15 Cycle A) |
| 10 | PRD threshold 4 KPI | PASS ✅ | `docs/product/PRD.md §8.2` (W15 Day-1) |

**최종 판정**: [VAL: PASS / CONDITIONAL PASS / FAIL]

CONDITIONAL 사유 (해당 시): [TBD]

---

## 3. 누적 결정 (M0 ~ M3)

### D-NNN swarm coding 결정

| ID | 결정 | M | 일자 |
|---|---|---|---|
| D-001 | Swarm coding 9 agent 팀 + archive 4명 옵션 채용 정책 | M0 | 2026-05-07 |
| D-002 | (TBD) | - | - |
| D-003 | (TBD) | - | - |
| D-004 | 기획 검토 SSOT 보존 정책 (read-only) | M0 | 2026-05-07 |
| D-005 | Specialist 4명 사전 채용 (Core 9 + Specialist 4 = 13명) | M0 | 2026-05-07 |
| D-006 | analytics 정식 활동 시작 (M3 사전) | M0 | 2026-05-07 |
| D-007 | ADR-0001 Accepted (후보 A Lean) | M1 | 2026-05-07 |
| D-008 | learning Specialist 정식 활성화 (M2-S1) | M2 | 2026-05-08 |
| D-009 | devops Specialist 정식 활성화 (M2-S1) | M2 | 2026-05-08 |
| D-010 | Baseline metrics 수집 환경 (staging + synthetic + dogfood) | M3 W15 | 2026-05-11 |
| D-011 | Slack alert webhook stub만 W15, 실 URL M5 | M3 W15 | 2026-05-11 |
| D-012 | C-13 사업자/결제 수령 주체 M5 entry 이연 | M3 W15 | 2026-05-11 |
| D-013 | PRD thresholds planner 자율 결정 | M3 W15 | 2026-05-11 |
| D-014 | RLS adversarial ID 충돌 해소 (security 005~009 / backend 010~013) | M3 W15 | 2026-05-12 |
| D-015 | SRS golden ID 충돌 해소 (analytics 051~053 / learning 056~060) | M3 W15 | 2026-05-12 |

### ADR-NNNN 되돌리기 어려운 결정

| ID | 제목 | 상태 | 일자 |
|---|---|---|---|
| ADR-0001 | Stack Decision (Lean / Managed) | Accepted | 2026-05-07 |
| ADR-0002 | Domain Model 경계면 추상화 (5+4) | Accepted | 2026-05-08 |
| ADR-0003 | Custom runner + Firebase | Accepted | 2026-05-11 |
| ADR-0004 | RLS 정책 매트릭스 (13×5×4) | Accepted | 2026-05-08 |
| ADR-0005 | TTS Google Cloud Neural2 | Accepted | 2026-05-08 |
| ADR-0006 | packages/srs-core (shared SRS module) | Accepted | 2026-05-11 |
| ADR-0007 | Baseline 저장소 (3-source) | [VAL: Accepted] | [TBD: 2026-05-22] |
| ADR-0008 | Secret 회전 (Slack webhook + EAS / Supabase keys) | pending (M4 W17) | - |

---

## 4. 누적 Risk 정리

### Closed (해소)

| ID | 항목 | 해소 일자 | 해소 방법 |
|---|---|---|---|
| R-12 (partial) | SRS sibling copy drift | M3 W15 | ADR-0006 Phase 1 (W17 Phase 2~3에서 완전 closed) |
| R-23 | RLS evaluator 부재 | [TBD: M3 W16] | RLS evaluator nightly green |
| R-24 | distractors retire 미검증 | [TBD: M3 W15-07b] | `distractors_after_retire` 검증 함수 |
| R-26 | 12명 cross-track 충돌 | M3 W15 Cycle A | D-014 / D-015 봉인 |
| R-27 | D-013 threshold late commit | M3 W15 D-1 | planner W15 Day-1 commit |
| R-31 | SRS-056~060 enum 미활성 | [TBD: M3 W15 Cycle B] | W15-09 backend |
| R-32 | privacy evaluator union 3종 | [TBD: M3 W15 Cycle B] | W15-10 backend |

### Open (잔존)

| ID | 항목 | 강도 | 처리 시점 |
|---|---|---|---|
| R-25 | RLS static EXISTS 의미 simplification | medium | M4 W17 ADR-0007 hybrid |
| R-28 | service_role bypass 가정 단순화 | low | M4 W17 sanity check |
| R-29 | Phase 2 backend SRS module 본 구현 이전 | low | M4 W17 |
| R-30 | paper 모드 dedup 테이블 무한 누적 | low | M5 entry |
| R-W15-02 | stub 모드 회귀 catch 누락 | low | M5 entry stub→실 webhook |
| R-W16-01 | baseline 14d cron 중간 누락 | [VAL: low/resolved] | [TBD: W16 검증] |
| R-W16-02 | ADR-0007 일정 압박 | [VAL: low/resolved] | [TBD: W16 D-4 검증] |
| R-M5-01 | M5 entry 사용자 reconfirm 3건 (C-13 / Slack / 베타) | high | M5 W19 진입 1주 전 (2026-06-02) |

---

## 5. M4 진입 신호

다음이 충족되어 즉시 M4-W17 (Security+QA, 2026-05-26~6/1) 진입 가능:

- [VAL] M3 게이트 10조건 PASS 또는 9/10 + 1 CONDITIONAL
- [VAL] ADR-0007 Accepted
- [VAL] 본 M3 completed rollup commit
- [VAL] `docs/HANDOFF.md` §1 M3 completed 표기 갱신
- [VAL] SWARM_LEDGER §M3 종료 entry
- [VAL] M4 entry preview dispatch v1 발행 (`context/rollups/20260512-M4-entry-preview-dispatch.md`)

차단 항목 [VAL]: 없음 / 있음 — [TBD]

---

## 6. 다음 게이트

**M4 Security+QA** (2026-05-26 ~ 2026-06-08, W17~W18, 2 sprint)
- W17 (5/26~6/1): RLS hybrid pg_test_role + secret 회전 ADR-0008 + Privacy Manifest evaluator 활성화 + QA test cases 강화
- W18 (6/2~6/8): 회귀 14d 안정 검증 + EAS staging 점검 + M4 게이트 검증

상세: `context/rollups/20260512-M4-entry-preview-dispatch.md`

---

## 7. Skill 사용 누적 (M3 4 sprint)

[TBD: W13~W16 4 sprint에서 12명 agent가 사용한 skill 인벤토리. 각 skill 사용 회수 + 미사용 발견 0건 확인 — orchestrator 보장]

---

## 8. 서명

- **Orchestrator 서명: [VAL: ✅ PASS / ⚠ CONDITIONAL / ❌ FAIL]**
- 서명 일자: 2026-05-26 [TBD]
- Rollup commit SHA: [TBD]
- M3 sprint 완료 lead time: 약 16일 (W13 5/11 ~ M3 종료 5/26)
- 다음 게이트: M4 W17 (Security+QA) — ready 상태, 진입 차단 항목 [VAL: 0 / N건]

---

## 9. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-12 | orchestrator 사전 양식 작성 (실 commit 일자 2026-05-26 예정) |
| [TBD] 2026-05-26 | M3 completed 실제 commit |
