# Rollup — M3 W14 Payment/Privacy/Content Evaluators + Adversarial Fixtures + CI 통합

> 작성: orchestrator
> 사이클: M3 W14 (Harness Hardening 2 sprint)
> 상태: **완료, M3 W15 진입 권고 (RLS evaluator + baseline metrics 수집 14d 시작)**

---

## 1. W14 산출물 (총 신규 파일 28개)

| Sub-task | 산출물 | 책임 agent |
|---|---|---|
| M3-W14-01 | `apps/api/edge-functions/_shared/billing.ts` (mapStatus + isPremiumActive SoT 추출) / `revenuecat-webhook` import 정합 / `scripts/eval/payment.ts` / `fixtures/golden/payment/` README + 7 case | backend + analytics |
| M3-W14-02 | `scripts/eval/privacy.ts` / `fixtures/golden/privacy/` README + 6 case | legal + security + analytics |
| M3-W14-03 | `scripts/eval/content.ts` / `fixtures/golden/content/` README + 8 case | content + analytics |
| M3-W14-04 | `fixtures/adversarial/` README + RLS 4 + Payment 2 + Privacy 3 (총 9 case) | security + qa + legal |
| M3-W14-05 | `fixtures/golden/srs/` 15 추가 case (총 22 도달, ID 002-050) + README 분포 표 갱신 | analytics + qa |
| M3-W14-06 | `.github/workflows/eval-on-pr.yml` (4 job strict) + `eval-nightly.yml` (RLS W15 활성화) | devops |
| M3-W14-07 | 본 rollup + SWARM_LEDGER + HANDOFF 갱신 | orchestrator |

## 2. 누적 Golden / Adversarial 상태

| Category | 목표 | 작성 | 진행률 | 비고 |
|---|---:|---:|---:|---|
| SRS golden | 50 | 22 | 44% | 모든 11 카테고리 1+ case, 경계 cell 우선 작성. 잔여 28건 W15 갭 분석 후 채움 |
| Payment golden | 15 | 7 | 47% | mapping 4 / idempotent 1 / signature 1 / premium_active 1. 잔여 8건 W15 |
| Privacy golden | 11 | 6 | 55% | age/idfa/choices/dsr_delete/dsr_export 1+ case 각 |
| Content golden | 11 | 8 | 73% | starter_meta/count/distractors + audio range 2 + retire 2 + report 1 |
| RLS adversarial | 일부 매트릭스 대표 | 4 | - | 다른-user read, anon-write, self-entitlement, audit-tampering |
| Payment adversarial | - | 2 | - | replay attack, forged signature |
| Privacy adversarial | - | 3 | - | age bypass, ad_id after ATT denied, marketing event without consent |
| **누적** | - | **52 files** | - | - |

## 3. Evaluator 통합 상태

| Category | Evaluator | runner.ts 라우팅 | CI 강제 |
|---|---|---|---|
| srs | scripts/eval/srs.ts (W13) | ✅ | ✅ pnpm eval:srs --strict |
| payment | scripts/eval/payment.ts (W14) | ✅ | ✅ pnpm eval:payment --strict |
| privacy | scripts/eval/privacy.ts (W14) | ✅ | ✅ pnpm eval:privacy --strict |
| content | scripts/eval/content.ts (W14) | ✅ | ✅ pnpm eval:content --strict |
| rls | (W15 예정) | skip | ❌ — nightly placeholder |

## 4. 핵심 결정

### 4.1 billing.ts SoT 추출 (R-12 SRS 패턴 확장)
Payment evaluator도 Edge Function과 sibling-copy 분리 위험을 회피하기 위해 `_shared/billing.ts`로 mapStatus / isPremiumActive를 추출, webhook과 evaluator가 동일 모듈을 import한다. 이로써 R-12류 drift는 SRS + Payment 두 도메인에서 사라졌고, 향후 platform-specific RC payload 추가 시 한 곳에서 변경된다.

### 4.2 W14 1차 commit이 "최소 viable evaluator + 대표 case" 기준
원래 W14 계획은 87 golden 완전 작성 + 5 evaluator였으나 실제 작업량 vs. baseline metrics 수집 일정(W15-W16)을 고려해 우선순위 재조정:
- **W14 1차**: 4 evaluator(SRS/Payment/Privacy/Content) + 43건 golden + 9 adversarial fixtures + CI 통합 → **본 commit**
- **W15 추가**: RLS evaluator (Supabase static SQL 분석 or pg_test) + 잔여 35건 golden + baseline 14-day 수집 시작

### 4.3 CI strict mode 정책
- `eval-on-pr.yml`: 4 job 병렬 (SRS/Payment/Privacy/Content) — 모두 `--strict`. skip이 있어도 fail.
- `eval-nightly.yml`: RLS는 W15 evaluator 도입 전까지 manual dispatch만. cron은 W15 commit에서 활성화.

## 5. Skill 사용 점검

| Agent | 강제 Skill | 사용 |
|---|---|---|
| backend | TDD · root-cause-tracing · prompt-engineering | ✅ billing.ts 분리 + payment.ts category dispatch |
| analytics | prompt-engineering · root-cause-tracing | ✅ 4 evaluator 설계 + diff 메시지 |
| legal | content-research-writer · humanizer | ✅ privacy.ts MIN_AGE/SLA 상수 + Privacy adversarial 3 case |
| security | (review) | ✅ RLS adversarial 4 case + audit_log tampering 시나리오 |
| content | research · prompt-engineering | ✅ Starter pack meta/count/distractors validator |
| qa | (review) | ✅ same-cycle vs Mastered 우선순위 case (SRS-018) 추가 |
| devops | (config) | ✅ GitHub Actions 2개 (strict + nightly) |
| orchestrator | (점검) | ✅ |

## 6. 결정 / ADR 적용

- **ADR-0003** (Custom runner) — 4 category로 확장, M4 진입 전 RLS evaluator 추가 후 완성
- **ADR-0004** (RLS default-deny) — RLS adversarial 4 case가 매트릭스 대표 violation 검증
- **CC2-08** (RC 9 status) — payment evaluator의 mapping/premium_active로 단언
- **CC2-07** (무료 한도) — SRS-047/048/049/050 4건이 신규/review/premium-bypass/under-limit 모두 cover
- **CC3-05** (same-cycle / Mastered 보호) — SRS-018 (same-cycle이 Mastered보다 우선) + SRS-014 (다른 cycle Mastered 강하) + SRS-027 (재진입) 명시
- **CC-11 (DSR 30d SLA)** — privacy evaluator가 delete + export 모두 단언
- **CC2-11 (Privacy choices 독립 토글)** — PRV-005/006/PRV-ADV-003가 사용자 선택 거부를 차단
- **CC3-04 (ATT IDFA)** — PRV-003 + PRV-ADV-002가 IDFA-free 보장 (R-15 ATT denied flow)

## 7. M3 진행률

| W | 작업 | 상태 |
|---|---|---|
| W13 | Harness foundation (runner + SRS evaluator + 7 golden) | ✅ 완료 (2026-05-11) |
| **W14** | Payment/Privacy/Content evaluator + adversarial + CI 통합 | ✅ **완료** (2026-05-11) |
| W15 | RLS evaluator + baseline metrics 14-day 수집 시작 + 잔여 35 golden 갭 분석/충원 + Mastered/Weak measurement event emit | ⏳ 다음 |
| W16 | baseline metrics 14-day 종료 → M3 게이트 검증 rollup | pending |

## 8. Risks 갱신

| ID | 리스크 | 변동 |
|---|---|---|
| R-12 | mobile ↔ Edge SRS sibling copy drift | **유지** — SRS는 _shared/srs.ts SoT 통합 완료. mobile/leitner.ts는 vitest로 자체 단언만 유지. 통합 esm 빌드는 M3 W16 또는 M4. |
| R-22 | Payment evaluator는 RC sandbox 의존 | **해소** — Payment evaluator는 mapStatus + isPremiumActive 순수 함수만 검증. webhook end-to-end(sandbox)는 nightly 대신 manual smoke test로 분리. |
| R-23 신규 | RLS evaluator 구현 전까지 RLS adversarial case 9건이 skip → 보안 회귀 못 잡음 | 중간 — W15 1차 작업 |
| R-24 신규 | content evaluator의 distractors_unique 검증이 candidate YAML만 검증 — DB seed 후 retire/replace로 변경된 distractor는 별도 검사 필요 | 낮음 — W15 db seed evaluator 추가 |

## 9. M3 W15 (다음 sprint) 작업 큐

| 작업 | 책임 |
|---|---|
| RLS evaluator (Supabase pg_test_role / supatest 활용 또는 정책 SQL static 분석) | security + backend |
| baseline metrics 수집 14-day 시작 — Day-3 retention / Day-1 streak 유지율 / lesson_complete_rate / paywall_view_to_purchase | analytics |
| Mastered/Weak measurement event emit (analytics.ts logEvent) — Q-DA-DOC-007 | analytics + frontend |
| SRS 추가 28건 (W13/W14 누락 cell 우선 채움) | analytics + qa |
| Payment 8건 + Privacy 5건 + Content 3건 잔여 | backend + legal + content |
| audit_log 위반 시도 alert 채널 연결 (Slack #security webhook) | security + devops |
| `eval-nightly.yml` cron 활성화 | devops |

## 10. Orchestrator 서명

- **M3-W14 게이트 통과**: ✅
- **서명일**: 2026-05-11
- **다음 게이트**: M3-W15 진입 — 차단 항목 없음
- **M3 종료 목표**: W16 — 87 golden 완전 + 5 evaluator (RLS 포함) + CI 통합 + baseline 14d 수집 완료 시 M4 (Security+QA) 진입
