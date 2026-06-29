# Dispatch — M4 Security+QA Entry Preview (W17~W18, 2026-05-26 ~ 2026-06-08)

> 작성: orchestrator (사전 양식, 2026-05-12)
> 실 발행 시점: M3 completed 직후 (2026-05-26)
> 사이클: M4 entry preview — W15 Cycle B 통합 직후 미리 작성
> 선행: `context/rollups/20260512-M3-W16-gate-sprint-plan.md` + `context/rollups/M3-completed-template.md`
> 다음 사이클: M4-W17 진입 (M3 게이트 PASS 시 즉시)

---

## 0. M4 한 줄 목표

**M3 evaluator 5종 + adversarial 13건이 검증한 산출물을 보안/QA 관점에서 **hybrid 실측 검증** + **secret 회전 정책 봉인** + **회귀 14d 안정** → M5 entry(베타) ready 조건 충족**

---

## 1. M4 진입 전제 조건 (M3 게이트 통과 후 검증)

W16-03 M3 게이트 판정 결과 다음이 충족되어야 M4 진입 가능:

- ✅ M3 게이트 10조건 PASS (또는 9/10 + 1 CONDITIONAL with documented exception)
- ✅ ADR-0007 (baseline 저장소) Accepted
- ✅ M3 completed rollup commit (`context/rollups/20260526-M3-completed.md`)
- ✅ `docs/HANDOFF.md` §1 M3 completed 표기
- ✅ SWARM_LEDGER §M3 종료 entry

미충족 시: W17 진입 1~2일 슬립 + W15 Cycle B 잔여 처리.

---

## 2. M4-W17 작업 큐 (8건 — Security 트랙 6 + QA 트랙 2)

### Security 트랙 (6건)

#### W17-S1 — ADR-0008 (Secret 회전 정책) Accepted

- **책임**: security (lead) + devops (자동화) + architect (ADR 작성)
- **선행**: M3 게이트 통과 + W15-06b alert stub dev 검증
- **산출물**:
  - `docs/adr/ADR-0008-secret-rotation-policy.md`
  - Secret 인벤토리 4종: Slack webhook URL (M5 활성화 시) / EAS keys / Supabase service role / RevenueCat secret
  - 회전 주기 명시 (Slack: 분기 / EAS: 6개월 / Supabase: 분기 / RC: 6개월)
  - 회전 절차 자동화 후보 (GitHub Actions schedule + 1Password Vault rotation API)
  - 회전 트리거 (정기 / 누출 의심 / 인원 변경)
- **DoD**: ADR Accepted + 회전 calendar entry + DECISION_LOG ADR 인덱스 갱신
- **시작**: W17 D-1 (2026-05-26 화)

#### W17-S2 — RLS hybrid (pg_test_role) 도입

- **책임**: security (lead) + backend (Postgres EXISTS 실측) + devops (Supabase ephemeral DB)
- **선행**: ADR-0007 (baseline 저장소) 패턴 적용 + RLS_EVALUATOR_HYBRID_PLAN (security W15)
- **산출물**:
  - `scripts/eval/rls-hybrid.ts` — pg_test_role + `SET LOCAL ROLE` + `SET request.jwt.claims` 실측 driver
  - `fixtures/seed/rls-eval/` 시드 — adversarial 13건 검증용 row
  - RLS-ADV-005 (EXISTS) / RLS-ADV-006 (status enum + period_ends_at) / RLS-ADV-009 (completed_at 컬럼 GRANT) 실측 검증
  - `_shared/rls.ts` 또는 `packages/shared-rls/` 정책 SoT (architect ADR-0006 패턴 RLS 확장)
- **DoD**: hybrid driver green + 13/13 실측 violation 분류 + R-25 / R-28 closed
- **시작**: W17 D-1

#### W17-S3 — Privacy Manifest evaluator + Play 데이터 안전성 양식 활성화

- **책임**: security (lead) + legal (수동 검토) + devops (Play Console 양식)
- **선행**: planner D-013 Privacy Manifest 정합성 체크리스트 (W15 §8.4) + iOS submission 차단 항목 확인 + Pre-mortem Sx-04 (Play 데이터 안전성 미완 → 출시 차단 GA 차단 후보)
- **산출물**:
  - `scripts/eval/privacy-manifest.ts` — 5개 점검 항목 (CollectedDataTypes / AccessedAPITypes / Tracking / TrackingDomains / 3rd-party SDK manifests)
  - `apps/mobile/ios/PrivacyInfo.xcprivacy` 검증 (iOS)
  - **Play Console 데이터 안전성 양식** — Privacy Manifest 5 항목과 cross-check, Pre-mortem Sx-04 mitigation
  - 3rd-party SDK Privacy Manifest 적용 확인 (Expo + RN + Firebase + RevenueCat)
- **DoD**: 5개 항목 모두 PASS + 1회 nightly green + 미통과 항목 fail-loud + Play 양식 commit
- **시작**: W17 D-3 (5/28)

#### W17-S4 — audit_log alert 실 webhook 활성화 사전 준비

- **책임**: security (lead) + devops
- **선행**: W15-06b stub 검증 + R-W15-02 (stub 회귀 catch 누락 risk)
- **산출물**:
  - Vault secret schema 정의 (`vault.secrets`에 `slack_security_webhook_url` 슬롯 사전 등록)
  - on-call 회전 정책 draft (M5 활성화 시 사용)
  - dry-run 테스트 시나리오 5건 (W15-06b dev 검증 확장)
- **DoD**: vault schema commit + dry-run 시나리오 commit (실 URL 등록은 M5 entry 시점)
- **시작**: W17 D-2

#### W17-S5 — RLS-ADV-010 (support role audit_log cross-user) 신규

- **책임**: security
- **선행**: W15 security context §2.1 W16 추가 후보 — 본 사이클 처리
- **산출물**:
  - `fixtures/adversarial/rls/RLS-ADV-014-support-role-audit-cross-user.yaml`
  - hybrid driver로 support role + cross-user audit_log SELECT 검증
- **DoD**: 14/14 violation 분류 nightly green
- **시작**: W17 D-4

#### W17-S6 — Privacy/DSR 모듈 신규 + PRV-016 cancel-window contract

- **책임**: backend (lead, legal Q-LG-W15-07 후속) + security (DSR contract review)
- **선행**: legal PRV-016 fixture + Q-LG-W15-07 (DSR 모듈 owner 결정)
- **산출물**:
  - `apps/api/edge-functions/_shared/dsr.ts` (DSR 모듈 — soft_deleted_at write timing + cancel 명시적 API)
  - PRV-016 evaluator green (cancel-window 재로그인 시 soft_deleted_at 보존)
  - `scripts/eval/privacy.ts` `dsr_delete` 분기 확장
- **DoD**: PRV-016 strict pass + dsr.ts unit test green
- **시작**: W17 D-3

### QA 트랙 (2건)

#### W17-Q1 — E2E suite Phase 0 (Maestro+Detox 환경 셋업)

- **책임**: qa (lead) + devops (CI 통합)
- **선행**: `docs/qa/M4_E2E_SUITE_PLAN.md` (W15 qa 작성)
- **산출물**:
  - Maestro Cloud 또는 self-hosted Mac M1 mini farm 결정 (Q-DEV-01 W17 D-3 결정)
  - Detox + StoreKit Configuration 설정
  - BrowserStack vs FTL 분배 결정 (Q-DEV-02)
  - EAS Update 채널 `qa-staging` 셋업 (Q-DEV-03)
  - P0 e2e 12건 중 첫 3건 (lesson_chain / paywall_purchase / signin) 작성
- **DoD**: 첫 3 e2e local green + CI 통합 1회 green
- **시작**: W17 D-1

#### W17-Q2 — Crashlytics + Sentry 알람 임계값 설정

- **책임**: qa (lead) + devops (Firebase + Sentry 설정)
- **선행**: Q-DEV-05 (W15 qa)
- **산출물**:
  - Crashlytics 알람 임계 (crash-free users < 99.5% / version別 다른 임계)
  - Sentry 알람 임계 (error rate > 1% / new issue 즉시)
  - `docs/qa/CRASH_ERROR_ALERT_THRESHOLDS.md` 신규
- **DoD**: 임계값 commit + 1회 dry-run alert + on-call 회전 정책 (M5 활성화 시점)
- **시작**: W17 D-5

---

## 3. M4-W18 작업 큐 (5건 — 회귀 안정 + EAS staging + M4 게이트)

### W18-01 — 회귀 14d 안정 검증

- **책임**: qa (lead) + analytics + backend
- **산출물**:
  - 매일 nightly cron green 확인 (M4 14d 누적)
  - PR open 시 5 evaluator 모두 strict green
  - flake 발생 시 즉시 분석 + 재발 방지
- **DoD**: M4 14d 모두 green + flake 0 또는 5건 보강

### W18-02 — EAS staging 환경 점검

- **책임**: devops (lead) + frontend
- **산출물**:
  - EAS Build staging 채널 1회 build green
  - TestFlight Internal 배포 1회
  - Play Console Internal Testing 1회
- **DoD**: 양쪽 스토어 internal 배포 + Owner 1인 dogfood 동작 확인

### W18-03 — M4 게이트 검증

- **책임**: orchestrator (lead) + security + qa
- **산출물**:
  - M4 게이트 통과 판정 양식 (M3_GATE_V2_DASHBOARD 패턴 따라 M4_GATE_DASHBOARD 작성)
  - 14건 검증 (ADR-0008 / RLS hybrid green / Privacy Manifest green / DSR PRV-016 green / e2e Phase 0 + Crashlytics + 회귀 14d + EAS staging + ...)
- **DoD**: M4 게이트 PASS 또는 CONDITIONAL + orchestrator 서명

### W18-04 — M4 종료 rollup 작성

- **책임**: orchestrator (lead)
- **산출물**:
  - `context/rollups/20260608-M4-completed.md`
  - M3 → M4 누적 결정 / risk / ADR 인덱스
  - M5 진입 신호 + R-M5-01 사용자 reconfirm 3건 명시 (PM 권고)

### W18-05 — M5 entry preview dispatch v1

- **책임**: orchestrator (lead) + pm
- **선행**: PM R-M5-01 사용자 reconfirm 알림 (2026-06-02 화 송출)
- **산출물**:
  - `context/rollups/20260608-M5-entry-preview-dispatch.md`
  - M5 entry (베타) sprint plan: 약관/RC payout/Slack URL/실 베타 모집/실 사용자 baseline 14d 시작
  - 사용자 reconfirm 3건 처리 결과에 따른 GA 일자 (6/15 vs 6/22) 분기

---

## 4. M4 의존성 그래프

```
W17 (5/26~6/1) — 8 작업
  [T+0 즉시 병렬]
    ├─ W17-S1  (ADR-0008 secret rotation)         security + devops + architect
    ├─ W17-S2  (RLS hybrid pg_test_role)          security + backend + devops
    ├─ W17-Q1  (E2E Phase 0 환경 셋업)             qa + devops
  [T+2~3일]
    ├─ W17-S3  (Privacy Manifest evaluator)       security + legal
    ├─ W17-S4  (audit alert vault schema 사전)     security + devops
    ├─ W17-S6  (DSR 모듈 + PRV-016)               backend + security
  [T+4~5일]
    ├─ W17-S5  (RLS-ADV-014 support audit)        security
    └─ W17-Q2  (Crashlytics + Sentry 임계)        qa + devops

W18 (6/2~6/8) — 5 작업
  [T+0~6일 매일]
    └─ W18-01  (회귀 14d 안정)                    qa + analytics + backend
  [T+0~3일]
    └─ W18-02  (EAS staging)                      devops + frontend
  [T+5일]
    └─ W18-03  (M4 게이트 검증)                   orchestrator + security + qa
  [T+6~7일]
    ├─ W18-04  (M4 종료 rollup)                   orchestrator
    └─ W18-05  (M5 entry preview)                 orchestrator + pm
```

---

## 5. M4 게이트 조건 (사전 정의, 13조건)

| # | 조건 | 책임 |
|---:|---|---|
| 1 | ADR-0008 (Secret 회전) Accepted | security + devops |
| 2 | RLS hybrid pg_test_role green (실측 13/13 violation) | security + backend |
| 3 | R-25 / R-28 closed (RLS static 한계 해소) | security |
| 4 | Privacy Manifest evaluator 5/5 green | security + legal |
| 5 | DSR 모듈 + PRV-016 strict pass | backend + legal |
| 6 | RLS-ADV-014 violation 분류 (14/14 nightly green) | security |
| 7 | E2E Phase 0 (P0 첫 3건) local + CI green | qa + devops |
| 8 | Crashlytics + Sentry 임계값 commit + dry-run | qa + devops |
| 9 | 회귀 nightly cron M4 14d 모두 green | devops |
| 10 | EAS Build staging TestFlight + Play Internal 배포 | devops + frontend |
| 11 | M3 게이트 통과 결과 회귀 0 (M3 산출물 영향 없음) | orchestrator |
| 12 | M4 종료 rollup commit | orchestrator |
| 13 | M5 entry preview dispatch v1 발행 | orchestrator + pm |

---

## 6. M4 자율 결정 위임 (orchestrator)

| 결정 영역 | 권한 위임 받는 agent | 비고 |
|---|---|---|
| Maestro Cloud vs self-hosted 비용/안정성 | qa + devops | 1인 운영 비용 우선 — devops 견적 후 결정 |
| RLS hybrid driver 구현 언어 (TypeScript vs SQL fixture) | security + backend | TypeScript 권고 (기존 evaluator와 일관) |
| ADR-0008 회전 주기 결정 | security | 권고: Slack/Supabase 분기, EAS/RC 6개월 |
| Privacy Manifest 검증 strict 모드 활성화 시점 | security + legal | W17-S3 commit 직후 strict 권고 |
| M4 종료 후 M5 entry 일자 (6/9 vs 6/16) | pm | 사용자 reconfirm 3건 결과 + R-M5-01 |

---

## 7. M4 Risks

| ID | 항목 | 강도 | mitigation |
|---|---|---|---|
| R-M4-01 (신규) | RLS hybrid pg_test_role flake (Supabase ephemeral DB 시작 시간) | medium | devops 6단계 게이트 (M3 패턴) + W17 D-3까지 안정화 |
| R-M4-02 (신규) | Privacy Manifest 3rd-party SDK manifest 누락 | high | Expo + RN + Firebase + RC 각 SDK 버전 cross-check |
| R-M4-03 (신규) | E2E Phase 0 CI 통합 시 Detox build 시간 | medium | Maestro 메인 + Detox sub로 분리 (qa 권고) |
| R-M5-01 (잔존) | 사용자 reconfirm 3건 미해소 | high | W18-05 / PM 2026-06-02 알림 |

---

## 8. 통합 승인 호출 시점 (M4 사이클)

| 사이클 | 시점 | 트리거 |
|---|---|---|
| **W17 mid-sprint** | 2026-05-28 목 | W17-S1/S2/Q1 진행률 + ADR-0008 draft |
| **W17 종료** | 2026-06-01 일 | 8 작업 통합 승인 + W18 진입 |
| **W18 mid-sprint** | 2026-06-04 목 | 회귀 14d 8d 시점 + EAS staging 확인 |
| **W18 종료 = M4 게이트** | **2026-06-08 일** | M4 게이트 검증 + M4 completed rollup + M5 entry preview |

---

## 9. M4 ~ M5 ~ GA 일정 sensitivity

기준 일정 (PM W15 §3.1):
- M4-W17: 5/26~6/1
- M4-W18: 6/2~6/8
- M5-W19: 6/9~6/15 (사용자 reconfirm 3건 critical path)
- GA-W20: 6/15 월 또는 6/22 일

M4 슬립 1~3일 → M5 진입 6/12~ → GA 6/19~ 또는 6/22 (W20 buffer 흡수)
M4 슬립 4~7일 → M5 W19 압축 또는 6/16~ 진입 → GA 6/22 (W20 buffer 완전 흡수)
M4 슬립 > 7일 → GA 6/29~ 슬립

---

## 10. Definition of Done — M4

- [ ] W17 8 작업 통합 commit
- [ ] W18 5 작업 통합 commit
- [ ] ADR-0008 Accepted
- [ ] M4 게이트 13조건 검증 + 판정
- [ ] M4 completed rollup
- [ ] HANDOFF §1 M4 completed 표기
- [ ] DECISION_LOG ADR-0008 인덱스 갱신
- [ ] SWARM_LEDGER §M4 종료 entry
- [ ] M5 entry preview dispatch v1 발행
- [ ] R-25 / R-28 closed
- [ ] R-M5-01 처리 결과 (사용자 reconfirm 3건) 명시

---

## 11. 서명

- M4 entry preview dispatch v0 (사전 양식) 작성: 2026-05-12 orchestrator
- v1 발행 (실 dispatch): 2026-05-26 [TBD: M3 completed 직후]
- 실행 착수: M3 게이트 PASS 시 즉시 = 2026-05-26 화
- 차단 항목 (v0 시점): 없음
- 다음 orchestrator 호출: M3 W16 mid-sprint A (2026-05-20 화) — W16 sprint plan 추적
