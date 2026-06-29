# Harness Compliance Audit — 5층 구조 컴플라이언스 검증

> 작성: orchestrator
> 책임: AGENTS.md §9 — orchestrator 책임 SSOT
> 작성일: 2026-05-12 (M3 W15 Cycle B dispatch + W16 게이트 검증 sprint 직전)
> 갱신 트리거: 매 마일스톤 종료 + W16 게이트 검증 입력 SSOT
> 상위 SSOT: `docs/architecture/HARNESS_LAYERED_ARCHITECTURE.md` (5층 정의) / `docs/harness/M3_GATE_V2_DASHBOARD.md` (10조건 게이트)

---

## 0. 한 줄 요약

**M3 W15 시점 5층 컴플라이언스 상태**: Contract(L1) 95% / Policy(L2) 90% / Retrieval(L3) 80% / Evaluation(L4) 90% / Observability(L5) 70% — Layer 4가 W14~W15 핵심 보강 완료, Layer 5는 M5 실 사용자 데이터 시점 활성화.

---

## 1. Layer 1 — Contract Layer 컴플라이언스

| 인터페이스 | M1 상태 | M2 상태 | M3 W15 상태 | 평가 |
|---|---|---|---|---|
| `packages/contracts/api/*.ts` | 정의 완료 | zod parse 적용 | enum 확장 (paywall_signin_required, srs_mastered_* 3종) | ✅ 100% |
| RevenueCat webhook | zod schema | strict parse | `_shared/billing.ts` SoT 통합 (W14) | ✅ 100% |
| Content manifest | zod schema | etag + cache invalidation | CTN-011 검증 fixture (W15) | ✅ 100% |
| Supabase DB rows | supabase-js types | strict types | RLS 정책 SoT(W15 backend SoT 통합 후보, ADR-0006 패턴) | 🟡 90% (W16-S2 RLS hybrid 시 SoT 일원화) |
| Analytics 이벤트 스키마 | snake_case 명시 | type 확장 | Mastered/Weak 3 events + 12 properties 슈퍼셋 (W15 analytics taxonomy §3.1) | ✅ 100% |

**Layer 1 완성도: 95%** — RLS SoT 일원화만 W16에서 보강.

---

## 2. Layer 2 — Policy Layer 컴플라이언스

| 정책 | M2 상태 | M3 W15 상태 | 평가 |
|---|---|---|---|
| RLS 정책 매트릭스 (13×5×4) | ADR-0004 Accepted | RLS evaluator 본화 13/13 strict pass (W15 backend) + adversarial 13건 (D-014 통합) | ✅ 100% (static), 🟡 W16 hybrid 도입 시 실측 추가 |
| Daily limit (무료 한도) | starter pack 3 단어 / 30 review | daily_limit golden 4건 (SRS-061~064 rename, W15 qa) | ✅ 100% |
| Age gate (만 13세 미만) | PRV-001 fixture | KR 14~18 minor refund PRV-013 추가 (W15 legal) | ✅ 100% |
| OTA scope (Expo Update) | M2 정의 | M4 W17 secret 회전 정책 (ADR-0008 pending) | 🟡 80% (M4) |
| Privacy choices / DSR | PRV-005~008 fixture | PRV-014/016 추가 + DSR 모듈 W17 backend 작업 큐 | 🟡 80% (M4 W17-S6) |
| Subscription state machine | mapStatus SoT (W14) | isPremiumActive 통합 + Payment 15 strict | ✅ 100% |
| 04:00 reset (local_day) | client-side 계산 | CC-17 / R-12 SoT 명시, R-12 ADR-0006 3-Phase 분리 | ✅ 95% (Phase 3 M4 W17 closed) |

**Layer 2 완성도: 90%** — Privacy/DSR + OTA scope만 M4 W17 처리 잔존.

---

## 3. Layer 3 — Retrieval Layer 컴플라이언스

| 인터페이스 | M2 상태 | M3 W15 상태 | 평가 |
|---|---|---|---|
| Content manifest (etag + version) | M2 구현 | CTN-011 cache invalidation + manifest etag (W15 learning) | ✅ 100% |
| SRS scheduler (Leitner 5-stage) | `_shared/srs.ts` SoT (W13) | applySrs 호출 + 057건 golden cover (W15) + R-12 ADR-0006 Phase 1 분리 | ✅ 95% (Phase 2+3 M4) |
| Signed URL (audio_assets) | M2 구현 | entitlement-subquery RLS 정책 + RLS-ADV-006 만료 entitlement 차단 (W15) | ✅ 100% |
| Content version (retire) | M2 구현 | distractors_after_retire 검증 함수 (W15-07b Cycle B 작업 큐) | 🟡 90% (R-24 Cycle B closed 예정) |
| Word frequency / pack tier | starter 60 단어 | RR 받침 6 단어 spot check (CTN-010, W15 learning) | ✅ 100% |
| User word state (UWS) | M2 구현 | append-only RLS + Mastered/Weak emit spec (W15 analytics) | ✅ 100% |
| Lesson chain (R-28) | M2 STUB | 실 N-카드 chain fetch + paywall_signin_required emit (W15 frontend + designer) | ✅ 100% (R-28 closed candidacy) |

**Layer 3 완성도: 80% → Cycle B 후 95%** — R-24 / R-12 Phase 2+3 잔존.

---

## 4. Layer 4 — Evaluation Layer 컴플라이언스

| Evaluator | W13 상태 | W14 상태 | W15 Cycle A 상태 | Cycle B 예상 | 평가 |
|---|---|---|---|---|---|
| SRS evaluator | runner.ts + srs.ts (W13) | category enum 11 + 22건 golden | qa i18n/a11y 6 + learning 5 (rename 056~060) = **57건** | enum 7개 확장 + 057/057 strict | ✅ 100% (W15-09 enum 활성 후) |
| Payment evaluator | - | mapStatus SoT + 7 golden | backend 8건 추가 = 15건 | strict 15/15 | ✅ 100% |
| Privacy evaluator | - | 6 golden | legal 5 추가 (PRV-012~016) = **16건** | union 3종 활성 (W15-10) + 16/16 strict | ✅ 100% (W15-10 후) |
| Content evaluator | - | 8 golden | learning 3 추가 (CTN-009~011) = **14건** | distractors_after_retire 함수 + 14/14 strict | ✅ 100% (W15-07b 후) |
| RLS evaluator | - | adversarial 4건 (W14) | rls.ts 본화 + adversarial 13건 (D-014 통합, security 5 + backend 4) | strict 13/13 nightly green | ✅ 100% (Cycle B nightly 후) |
| Privacy Manifest evaluator | - | - | M4 W17-S3 pending | M4 W17 활성 | 🟡 M4 |
| RLS hybrid (pg_test_role) | - | - | RLS_EVALUATOR_HYBRID_PLAN 작성 | M4 W17-S2 활성 | 🟡 M4 |

**Layer 4 완성도: 90% → Cycle B 후 100%** — M4에서 Privacy Manifest + RLS hybrid 추가.

---

## 5. Layer 5 — Observability Layer 컴플라이언스

| 인터페이스 | M2 상태 | M3 W15 상태 | 평가 |
|---|---|---|---|
| Firebase Analytics (이벤트 발화) | M2 setup | emit helpers (W15 frontend) + session_id 자동 주입 + 12 properties 슈퍼셋 | ✅ 100% |
| Firebase DebugView (dev) | M2 setup | M5 dogfood 활성화 (실 적재 확인은 M5) | 🟡 50% (실 적재 M5) |
| Crashlytics | M2 setup | M4 W17-Q2 임계값 설정 + Sentry 통합 | 🟡 60% (M4) |
| audit_log (Postgres) | M2 정의 | trigger SQL 작성 (W15 security 0004_audit_triggers) + pg_net + dedup 5min | ✅ 100% |
| audit_log alert (Slack) | - | stub mode commit (W15) + dev 검증 Cycle B + 실 webhook M5 | 🟡 70% (Cycle B 후 90%, M5 100%) |
| baseline metrics (3-source) | - | BASELINE_METRICS + queries.sql + run.ts + synthetic-baseline.ts (W15) + Day-0~13 W16 누적 | 🟡 80% (W16 후 95%, M5 real-user 100%) |
| nightly cron | - | eval-nightly.yml workflow (W15) + 단계 1~5 W15 Cycle B | 🟡 70% (Cycle B 후 95%) |
| Privacy Manifest (iOS submission) | - | M4 W17-S3 evaluator + 3rd-party SDK manifest cross-check | 🟡 50% (M4) |

**Layer 5 완성도: 70% → Cycle B 후 80%, M4 후 95%, M5 후 100%** — 실 사용자 데이터 적재 시점에 최종 활성.

---

## 6. 종합 완성도 (M3 W15 Cycle A 시점)

| Layer | 완성도 | Cycle B 후 | M4 후 | M5 후 (GA) |
|---|---:|---:|---:|---:|
| L1 Contract | 95% | 95% | 100% | 100% |
| L2 Policy | 90% | 95% | 100% | 100% |
| L3 Retrieval | 80% | 95% | 100% | 100% |
| L4 Evaluation | 90% | 100% | 100% | 100% |
| L5 Observability | 70% | 80% | 95% | 100% |
| **평균** | **85%** | **93%** | **99%** | **100%** |

---

## 7. M3 게이트 v2 10조건과 5층 매핑

각 게이트 조건이 어느 layer를 검증하는지 명시:

| 게이트 # | 조건 | 검증 Layer |
|---:|---|---|
| 1 | Evaluator 5 strict CI | L4 (Evaluation) |
| 2 | Golden 100+건 | L4 (Evaluation) |
| 3 | Adversarial 13 violation 분류 | L2 (Policy) + L4 (Evaluation) |
| 4 | baseline 3-source 14d | L5 (Observability) + L3 (Retrieval) |
| 5 | eval-nightly cron 1+ green | L4 + L5 |
| 6 | alert stub dev 검증 | L5 (Observability) + L2 (Policy audit) |
| 7 | R-23 / R-24 closed | L2 (RLS) + L3 (content retire) |
| 8 | ADR-0003 Accepted | 5층 무관 (도구 선택) |
| 9 | ADR-0006 Accepted | L3 (SRS scheduler 패키지) |
| 10 | PRD threshold 4 KPI | L5 (Observability — threshold check) |

**5층 cover 분포**: L2 3 / L3 3 / L4 5 / L5 4 / 무관 1 = balanced.

---

## 8. M3 통과 후 보강 작업 (M4~M5)

### M4 W17 (Layer 4+5 강화)

- L4: Privacy Manifest evaluator 활성 + RLS hybrid 실측 추가
- L5: Crashlytics + Sentry 임계값 + on-call 회전

### M4 W18 (회귀 안정)

- L4 5 evaluator 14d nightly green
- L5 EAS Build staging + TestFlight Internal + Play Internal

### M5 W19 (Layer 5 완전 활성)

- L5 실 webhook URL (Slack alert live mode)
- L5 실 사용자 baseline 14d
- L5 Privacy Manifest 본 제출 (iOS submission)

---

## 9. 컴플라이언스 위반 / Gap (open)

| Gap ID | Layer | 항목 | 책임 | 해소 시점 |
|---|---|---|---|---|
| G-01 | L1 | RLS 정책 SoT 일원화 (`_shared/rls.ts` 또는 `packages/shared-rls`) | backend + architect | W16 ADR-0007 패턴 또는 M4 W17-S2 |
| G-02 | L2 | OTA scope 자동화 (Expo Update channel + secret 회전) | devops + security | M4 W17-S1 (ADR-0008) |
| G-03 | L3 | R-12 Phase 2+3 (SRS sibling 제거) | backend | M4 W17 |
| G-04 | L3 | distractors_after_retire 검증 함수 | content | W15-07b Cycle B |
| G-05 | L4 | SRS-056~060 evaluator enum 5종 | backend | W15-09 Cycle B |
| G-06 | L4 | privacy evaluator union 3종 | backend + legal | W15-10 Cycle B |
| G-07 | L5 | audit alert 실 webhook URL | security + devops + 사용자 | M5 W19-O2 |
| G-08 | L5 | Crashlytics/Sentry 임계값 + on-call | qa + devops | M4 W17-Q2 |
| G-09 | L5 | 실 사용자 baseline 14d 수집 | analytics | M5 W19-D1 |
| G-10 | L5 | Privacy Manifest 본 제출 | security + legal | M5 W20-01 (GA 심사) |

---

## 10. 갱신 trigger 일정

| 일자 | trigger | 갱신할 layer |
|---|---|---|
| 2026-05-15~17 | Cycle B 통합 | L3 G-04 / L4 G-05+G-06 closed |
| 2026-05-18 | W15 sprint 종료 | 전체 sprint risk 정리 |
| 2026-05-25 | M3 게이트 검증 | 전체 layer M3 시점 final score |
| 2026-05-26 | M3 completed | 본 문서 §6 종합 완성도 갱신 |
| 2026-06-08 | M4 게이트 | L4 G-08 / L2 G-02 / L1 G-01 closed |
| 2026-06-15 또는 6/22 | GA | L5 G-07+G-09+G-10 closed → 100% 달성 |

---

## 11. orchestrator 책임 (AGENTS.md §9)

본 audit는 orchestrator의 단독 책임 SSOT. 작성/갱신 주기:

- **매 sprint 종료**: 해당 sprint의 layer 영향 평가 + Gap 갱신
- **매 마일스톤 종료**: 종합 완성도 % 재계산 + 다음 마일스톤 trigger 정의
- **위반 발견 시**: orchestrator 머지 보류 + Gap 신규 등재

본 문서는 W16 게이트 검증 sprint(2026-05-19~25)에서 W16-03 작업의 입력 SSOT로 사용.

---

## 12. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-12 | M3 W15 Cycle A 직후 신규 작성 — 5층 컴플라이언스 매트릭스 + M3 게이트 매핑 + 10 Gap 등재 + M4~M5 trigger 일정 |
