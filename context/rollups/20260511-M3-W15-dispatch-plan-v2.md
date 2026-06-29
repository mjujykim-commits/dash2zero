# Dispatch Plan v2 — M3 W15 (자율 결정 4건 봉인 후 재발행)

> 작성: orchestrator
> 사이클: M3 W15 (Harness Hardening 3 sprint, M3 게이트 진입 직전)
> 작성일: 2026-05-11 22:30
> 상태: **dispatch v2 — 4 결정 봉인 + 운영 항목 제외 + 12명 트랙 명시 (실행 착수 신호 = 본 문서 발행 + 결정 봉인 commit 완료)**
> 대체: `context/rollups/20260511-M3-W15-dispatch-plan.md` (v1)

---

## 0. v2가 v1과 다른 점 (요약 4줄)

1. **D-010 봉인** → W15-02 baseline 수집 source = "Supabase staging + synthetic seed + 1인 dogfood" 명시. real-user 모집은 M5 이연
2. **D-011 봉인** → W15-06 alert는 stub 모드(audit_log trigger + workflow stub + console + DB 적재) 작성, 실 Slack webhook URL은 M5 이연
3. **D-012 봉인** → C-13 사업자 등록 / 운영 계약 / 결제 수령 주체 등 모든 운영 blocker는 W15 작업 큐에서 제외, M5 entry로 분류
4. **D-013 봉인** → PRD threshold 4 KPI는 planner 자율, orchestrator는 commit 승인만

---

## 1. W15 목표 (한 줄, v1 대비 갱신)

**5번째(RLS) evaluator 도입 + baseline 수집 파이프 동작 검증(synthetic seed + staging + 1인 dogfood) + 잔여 35건 golden 충원 + alert stub 회귀 catch + ADR-0006 SRS 공유 패키지 Accepted로 M3 게이트(W16) 진입 가능 상태 확보.**

---

## 2. 12명 작업 트랙 (도메인 시니어별)

| Agent | W15 Track | 작업 큐 매핑 |
|---|---|---|
| **security** | RLS evaluator + alert stub | W15-01 (lead) + W15-06 (lead) |
| **backend** | RLS 정책 SQL SoT + Payment golden 8 + audit_log trigger SQL | W15-01 (협업) + W15-05 (Payment 8) + W15-06 (trigger SQL) |
| **analytics** | baseline 정의(synthetic 포함) + Day-0 snapshot + SRS 28 golden + Mastered/Weak event schema + content distractors evaluator 보강 | W15-02 (lead) + W15-03 (lead) + W15-04 (lead) + W15-07 (협업) |
| **frontend** | Mastered/Weak event emit (mobile) | W15-03 (협업) |
| **legal** | Privacy 5 golden 충원 (DSR / consent revocation 등) | W15-05 (Privacy 5) |
| **content** | Content 3 golden + R-24 distractors 재검증 케이스 + DB seed 보강 | W15-05 (Content 3) + W15-07 (협업) |
| **qa** | SRS 50 golden 분포 검증 + 11×N 매트릭스 빈 셀 0 보장 + adversarial 9건 violation 분류 검증 | W15-04 (협업) + W15 종료 검증 |
| **devops** | EAS staging 환경 점검 + synthetic seed 스크립트 + nightly cron + alert workflow stub + secret 정책 (M4 ADR-0008로 이연된 부분 명시) | W15-02 (synthetic seed `scripts/seed/synthetic-baseline.ts`) + W15-06 (workflow stub) + W15-07 (cron) |
| **planner** | PRD threshold 4 KPI 자율 결정 + green/yellow/red band + 출처 명시 | D-013 산출물, baseline 정의와 동시 |
| **pm** | W15 sprint 운영 점검 + 12명 cross-track 의존성 모니터 + W16 게이트 rollup 사전 양식 | W15-06 / W15-07 unblock 시점 점검 + W16 rollup 양식 초안 |
| **designer** | Mastered/Weak UI 상태 디자인 토큰 (theme-decisions 갱신 — emit 이벤트 발화 시점 시각화) + RLS violation 노출되는 화면(어드민용) 모킹 | W15-03 시각화 + W15-06 admin alert 화면 |
| **architect** | **ADR-0006 SRS 공유 패키지** 작성 + W15-01 RLS evaluator 구조 가이드(R-12 SoT 패턴 RLS 확장) + ADR-0007 baseline 저장소 outline (W16 작성 예고) | ADR-0006 W15 본 사이클 Accepted 권고 |

---

## 3. 작업 큐 v2 (운영 항목 제외, 결정 반영)

### W15-01 — RLS evaluator 구현 (변경 없음, R-23 해소)

- **책임**: security (lead) + backend
- **산출물**:
  - `scripts/eval/rls.ts`
  - `runner.ts` 라우팅에 rls 등록
  - `fixtures/golden/rls/` 7+ golden case
  - W14 adversarial 4건 strict mode 검출 확인
  - **추가**: RLS 정책 SQL SoT를 `_shared/rls.ts` 또는 `packages/shared-rls`로 일원화 (architect ADR-0006 SRS 패턴 RLS로 확장)
- **DoD**: `pnpm eval:rls --strict` PR 4→5 job green / W14 RLS adversarial 4건 violation 분류 / SoT 1개소
- **시작**: T+0 (Day 1)

### W15-02 — baseline 수집 파이프 + synthetic seed + 1인 dogfood (D-010 반영, NEW-01 갱신)

- **책임**: analytics (lead) + devops (synthetic seed) + planner (threshold)
- **산출물**:
  - `docs/harness/BASELINE_METRICS.md` — 4 KPI 정의 / 측정 윈도우 / 3-source 명시 (staging + synthetic + dogfood) / Day-0 기록 / threshold green/yellow/red (D-013 planner 결정 반영)
  - `scripts/seed/synthetic-baseline.ts` (devops) — 14-day user 100명 활동 시뮬레이션, lesson_complete / paywall_view / streak / mastered / weak 분포 포함
  - `scripts/analytics/snapshot.ts` — 매일 KPI 집계 → `metrics/daily/YYYY-MM-DD.json`
  - W15 Day-1 첫 스냅샷 commit (이후 GitHub Actions nightly cron)
- **DoD**:
  - 4 KPI 모두 정의 + 출처 + 결측 처리 명시
  - synthetic seed 실행 → staging DB 적재 확인
  - 1인 dogfood 계정 (Owner) 활동 신호 적재 확인
  - Day-0 기준값 commit
  - 14일 cron 가동 확인 = M3 게이트 조건의 "수집 파이프 동작 검증"
- **변경**: real-user 14-day 수집은 M5로 이연 (D-010)
- **시작**: T+0 (Day 1)

### W15-03 — Mastered/Weak event emit (변경 없음)

- **책임**: analytics + frontend (+ designer 시각화 토큰)
- **산출물**: `apps/mobile/lib/analytics.ts` logEvent 추가 / 이벤트 스키마 갱신 / designer가 발화 시점 UI 토큰 정의
- **DoD**: dev emit log 확인 / baseline metrics에 mastered_per_user_per_week / weak_rate 라인 추가
- **시작**: T+0 (Day 1, 병렬)

### W15-04 — SRS 잔여 28건 golden 충원 (변경 없음)

- **책임**: analytics + qa
- **산출물**: ID 023-050 / README 분포 표 갱신 / 갭 분석 노트
- **DoD**: 11×N 매트릭스 cell 0 / 50건 strict 통과 / CC2-07 / CC3-04 / CC3-05 매핑
- **시작**: T+0 (Day 1)

### W15-05 — Payment/Privacy/Content 잔여 golden (변경 없음)

- **책임**: backend / legal / content (3 도메인 병렬)
- **산출물**: Payment 8 + Privacy 5 + Content 3
- **DoD**: 누적 Payment 15 / Privacy 11 / Content 11, strict 통과
- **시작**: T+0 (Day 1)

### W15-06 — audit_log violation alert **stub** (D-011 반영, NEW-03 갱신)

- **책임**: security (lead) + devops + backend (trigger SQL) + designer (admin 화면)
- **산출물**:
  - `audit_log` Postgres trigger (backend)
  - `security_alerts` 테이블 + RLS (admin only)
  - `.github/workflows/security-alert.yml` **stub** workflow (devops, webhook URL 없이 console + DB 검증)
  - `docs/security/ALERT_RUNBOOK.md` — stub 모드 명시 + M5 활성화 절차 (실 webhook URL 발급 / on-call 회전 정책)
  - 어드민 화면 모킹 (designer)
- **DoD**: dev 환경에서 인위적 위반 1건 → console 출력 + DB `security_alerts` 적재 확인 / nightly evaluator가 violation 분류
- **변경**: 실 Slack webhook 연결은 M5 이연 (D-011), W15는 stub로 회귀 catch 보장
- **의존성**: W15-01 (alert payload 스키마 정합)
- **시작**: T+3~5일 (W15-01 머지 후)

### W15-07 — `eval-nightly.yml` cron 활성화 + R-24 해소 (변경 없음)

- **책임**: devops + content + analytics
- **산출물**: cron unblock / `scripts/eval/content.ts`에 `distractors_after_retire` 검증 함수
- **DoD**: 첫 nightly green / R-24 commit
- **의존성**: W15-01 + W15-05
- **시작**: T+5~7일

### W15-08 — **ADR-0006 SRS 공유 패키지 Accepted** (신규, architect 트랙)

- **책임**: architect (lead) + backend (구현 검증) + analytics (golden 호환성 검증)
- **산출물**:
  - `docs/adr/ADR-0006-shared-srs-package.md` — `packages/shared-srs` 경계 정의, applySrsTransition SoT, evaluator/migration/mobile 모두 import
  - 결정 근거: R-12 SoT drift 방지 패턴, M3 W14 evaluator/migration 양쪽이 SRS logic 사용하면서 경계 모호 해소
  - Reversal Trigger 명시
- **DoD**: ADR Accepted 상태 / orchestrator 승인 commit / DECISION_LOG ADR 인덱스 상태 갱신
- **시작**: T+0 (architect 단독, W15 본 사이클 내)
- **연계**: ADR-0007 (baseline 저장소, D-010 반영, W16 architect 작성 예고) / ADR-0008 (secret 회전, M4 W17 이연 명시)

---

## 4. 의존성 그래프 v2

```
[T+0 즉시 병렬 — 6개 작업]
  ├─ W15-01 (RLS evaluator)              security + backend
  ├─ W15-02 (baseline 3-source)          analytics + devops + planner
  ├─ W15-03 (Mastered/Weak event)        analytics + frontend + designer
  ├─ W15-04 (SRS 28 golden)              analytics + qa
  ├─ W15-05 (Payment/Privacy/Content)    backend + legal + content
  └─ W15-08 (ADR-0006 Accepted)          architect

[T+3~5일 — W15-01 후]
  └─ W15-06 (alert stub)                 security + devops + backend + designer

[T+5~7일 — W15-01 + W15-05 후]
  └─ W15-07 (nightly cron + R-24)        devops + content + analytics

[T+1일 ~ T+14일 매일 — W15-02 시작]
  └─ baseline daily snapshot              analytics (cron 자동, synthetic + dogfood 양쪽 적재)
```

---

## 5. 운영 항목 제외 명시 (D-012 반영)

다음 항목은 **W15 작업 큐에서 제외**되며 M5 entry까지 처리하지 않음:

| 항목 | 사유 | 처리 시점 |
|---|---|---|
| 사업자 등록 / 통신판매업 신고 | C-13 / D-012 | M5 entry, legal sprint |
| RevenueCat 발행자 정보 등록 | C-13 의존 | M5 entry |
| 결제 수령 계좌 / 세무 검토 | C-13 의존 | M5 entry |
| 약관 / 개인정보처리방침 본 문서 | legal sprint | M5 entry |
| Slack #security 실 webhook URL | 운영 계정 의존 / D-011 | M5 entry |
| App Store / Play Store 계정 운영 | 출시 직전 | M5 |
| 실 사용자 모집 (외부 채용/광고) | 사용자 명시 회피 | M5 (Beta) |

W15 시점에는 위 항목 어느 것도 작업 큐 / 차단 항목 / 게이트 조건에 포함되지 않음.

---

## 6. M3 게이트 조건 v2 (W16 진입 시 검증)

W15 종료 시점에 다음이 충족되어야 W16에서 M3 게이트 통과 rollup 작성 가능:

1. ✅ Evaluator 5개 모두 strict CI 통합 (SRS/Payment/Privacy/Content/**RLS**)
2. ✅ Golden 87건 완성 (SRS 50 + Payment 15 + Privacy 11 + Content 11)
3. ✅ Adversarial 9건 모두 evaluator로 violation 분류 (W14 RLS 4건 unblock 포함)
4. ✅ **baseline 수집 파이프 동작 검증** (D-010 반영) — 3-source(staging + synthetic seed + 1인 dogfood) 적재 확인 + 14-day cron 가동 + Day-0~Day-N snapshot 누적. **real-user baseline 14-day 수집은 M5로 이연**
5. ✅ `eval-nightly.yml` cron 가동, 최소 1회 green
6. ✅ audit_log alert **stub** dev 환경 검증 (console + DB 적재) — 실 Slack webhook은 M5 이연 (D-011)
7. ✅ R-23 (RLS) 해소, R-24 (distractors retire) 해소
8. ✅ ADR-0003 (Custom runner) Accepted finalization
9. ✅ **ADR-0006 (SRS 공유 패키지) Accepted** (신규)
10. ✅ **PRD threshold 4 KPI 결정 commit** (D-013 — planner 자율 결정 산출물)

---

## 7. W15 일정 (변경 없음)

- **시작**: 2026-05-11 22:30 (본 v2 dispatch + 4 결정 봉인 commit 완료 시점)
- **종료 예상**: 2026-05-18
- **W16 (M3 게이트 검증)**: 2026-05-18 ~ 2026-05-25
- **M3 게이트 통과 rollup 예상일**: 2026-05-25

---

## 8. 통합 승인 호출 시점 (orchestrator 다음 사이클)

본 v2 dispatch는 12명 시니어가 동시 병렬 착수하므로 orchestrator는 다음 시점에 통합 승인 사이클을 호출:

| 사이클 | 트리거 | 승인 대상 |
|---|---|---|
| **사이클 A (T+3일)** | mid-sprint 중간 점검 | W15-01 진행률 / baseline Day-3 스냅샷 / W15-04~05 golden 진척 / ADR-0006 draft 검토 |
| **사이클 B (T+5~7일)** | W15-06/07 unblock 점검 | W15-01 머지 확인 / W15-05 content distractors 머지 / W15-06 stub 작동 / W15-07 cron green |
| **사이클 C (T+7일, W15 종료)** | W15 sprint 종료 rollup | 12명 작업 통합 승인 / W15 rollup 작성 / W16 게이트 검증 sprint 진입 |
| **사이클 D (W16 종료, T+14일)** | M3 게이트 통과 검증 | 위 §6 10개 조건 모두 검증 / M3 completed 서명 / M4 진입 |

---

## 9. Orchestrator 서명 (dispatch v2)

- **Dispatch plan v2 작성 완료**: 2026-05-11 22:30
- **봉인 결정 4건**: D-010 / D-011 / D-012 / D-013 (DECISION_LOG.md commit 동시)
- **차단 항목**: 없음 (W15-06/07은 내부 순차, W15-08은 architect 단독, 운영 항목은 D-012로 제외)
- **실행 착수 신호**: 본 v2 발행 + 4 결정 commit 완료 시점 = 즉시 (12명 병렬 착수 OK)
- **다음 orchestrator 호출**: 사이클 A (T+3일 mid-sprint 중간 점검)
