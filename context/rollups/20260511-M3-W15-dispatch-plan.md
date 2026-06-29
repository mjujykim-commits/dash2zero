# Dispatch Plan — M3 W15 RLS evaluator + Baseline Metrics 수집 시작 + Golden 갭 충원

> 작성: orchestrator
> 사이클: M3 W15 (Harness Hardening 3 sprint, M3 게이트 진입 직전)
> 작성일: 2026-05-11 22:00
> 상태: **dispatch (12 시니어 readiness 자가보고 대기)**

---

## 0. W15 목표 (한 줄)

**5번째(RLS) evaluator 도입 + baseline metrics 14-day 수집 시작 + 잔여 35건 golden 충원으로 M3 게이트(W16) 진입 가능 상태 확보.**

---

## 1. 컨텍스트 — W14 종료 시점 스냅샷

- M3 진행률: W13 ✅ / W14 ✅ / **W15 진입 준비** / W16 (M3 게이트)
- Evaluator 통합: 4/5 (SRS/Payment/Privacy/Content strict, RLS placeholder skip)
- Golden 누적: 43건 (목표 87) → 진행률 49%
- Adversarial: 9건 (RLS 4 / Payment 2 / Privacy 3) — RLS 4건은 evaluator 없어서 현재 skip
- CI: `eval-on-pr.yml` 4 job strict 가동 중, `eval-nightly.yml` cron은 W15에서 활성화 예정
- 미해결 risk: **R-23** (RLS evaluator 미구현 → 보안 회귀 캐치 못함, 중간), **R-24** (DB seed retire/replace 후 distractors 재검증 누락, 낮음)

---

## 2. W14 미해결 / W15 신규 분리

### 2.1 W14 carry-over (반드시 W15 종료 전 해소)

| ID | 항목 | 사유 |
|---|---|---|
| CO-01 | RLS evaluator 구현 (R-23 해소) | W14에서 시간 부족으로 placeholder만 두고 미룸 |
| CO-02 | 잔여 golden 35건 (SRS 28 + Payment 8 + Privacy 5 + Content 3 = 44건. 단 일부 중복/축소 가능, 목표 골든 87건 기준 35~44건 범위) | W14 1차 commit이 "최소 viable" 기준이었음 |
| CO-03 | `eval-nightly.yml` cron 활성화 | RLS evaluator 도입 직후 활성화 |

### 2.2 W15 신규

| ID | 항목 | 사유 |
|---|---|---|
| NEW-01 | baseline metrics 14-day 수집 시작 (Day-3 retention / Day-1 streak 유지율 / lesson_complete_rate / paywall_view_to_purchase) | M3 게이트 통과 조건 — 데이터 누적이 14일 필요하므로 W15 시작 = W16 종료에 맞물림 |
| NEW-02 | Mastered/Weak measurement event emit (Q-DA-DOC-007) | analytics.ts logEvent에 이벤트 추가 — baseline 수집과 동시 |
| NEW-03 | audit_log 위반 alert 채널 (Slack #security webhook) | RLS evaluator 도입과 짝 — 위반 시 즉시 통보 |
| NEW-04 | DB seed retire/replace 후 distractors 재검증 (R-24 해소) | content evaluator 보강 |

---

## 3. 작업 큐 (7항목 + carry-over 통합 — 책임 / 산출물 / DoD / 의존성 / 시작 가능 시점)

### W15-01 — RLS evaluator 구현 (carry-over CO-01, R-23 해소)

- **책임**: security (lead) + backend (Supabase 정책 SQL 인터페이스)
- **산출물**:
  - `scripts/eval/rls.ts` — Supabase pg_test_role(or supatest) 활용 또는 정책 SQL static 분석
  - `runner.ts` 라우팅에 rls 등록
  - `fixtures/golden/rls/` 7+ golden case (positive: 자기 행 read, anon public read; negative: 다른 user read/write, anon write, self-entitlement, audit-tampering)
  - 기존 `fixtures/adversarial/rls/` 4건이 strict 모드에서 검출되는지 확인
- **DoD**:
  - `pnpm eval:rls --strict` PR 4 job → 5 job으로 확장, 모두 green
  - W14 RLS adversarial 4건 violation으로 정확히 분류
  - `_shared/` 또는 SoT가 evaluator와 마이그레이션 SQL 사이에 한 번만 존재
- **의존성**: W14 산출물 (`fixtures/adversarial/rls/`) — 이미 존재, **즉시 시작 가능**
- **시작 가능 시점**: T+0 (W15 Day 1)

### W15-02 — baseline metrics 14-day 수집 시작 (NEW-01)

- **책임**: analytics (lead) — 단독 시작 가능
- **산출물**:
  - `docs/harness/BASELINE_METRICS.md` 신규 — 4개 KPI 정의 / 측정 윈도우 / 스냅샷 절차 / Day-0 기록
  - `scripts/analytics/snapshot.ts` (또는 동급) — 매일 KPI 집계 → `metrics/daily/YYYY-MM-DD.json` 적재
  - W15 Day-1 첫 스냅샷 commit (이후 GitHub Actions cron으로 daily)
- **DoD**:
  - 4 KPI 모두 정의(공식, 출처 테이블/이벤트, 결측 처리) 명시
  - Day-0 기준값 기록
  - 14일 cron 가동 확인 (W15 Day 14 = W16 마지막 일)
- **의존성**: 없음 — **즉시 시작 가능 (single agent)**
- **시작 가능 시점**: T+0 (W15 Day 1)

### W15-03 — Mastered/Weak measurement event emit (NEW-02, Q-DA-DOC-007)

- **책임**: analytics + frontend (mobile)
- **산출물**:
  - `apps/mobile/lib/analytics.ts` `logEvent('mastered_reached'|'weak_detected', {...})` 추가
  - SRS 카드 상태 전이 시점 emit (cycle complete + interval >= MASTERED_THRESHOLD / weak heuristic)
  - 이벤트 스키마 `docs/analytics/EVENT_SCHEMA.md`에 추가
- **DoD**:
  - dev 환경에서 emit log 확인
  - baseline metrics에 `mastered_per_user_per_week` / `weak_rate` 수집 라인 추가
- **의존성**: W15-02 baseline metrics 정의가 먼저 commit → schema 변경 동시 가능 (병렬 가능, frontend는 backend의 logEvent SoT 변경 없으면 단독 진행 가능)
- **시작 가능 시점**: T+0 (W15 Day 1, baseline 정의와 병렬)

### W15-04 — SRS 잔여 28건 golden 충원 (carry-over CO-02 일부)

- **책임**: analytics + qa
- **산출물**:
  - `fixtures/golden/srs/` ID 023-050 신규 28건 (W14에서 22건 도달 → 50건 완성)
  - `fixtures/golden/srs/README.md` 분포 표 갱신 — 11 카테고리 cell 빈 셀 제로
  - 갭 분석 노트 (어떤 cell이 비어 있었는지, 어떤 시나리오로 채웠는지)
- **DoD**:
  - 11 × N 매트릭스 모든 cell ≥ 1 case
  - 50건 모두 strict mode 통과
  - CC2-07 / CC3-04 / CC3-05 추가 case 매핑
- **의존성**: 없음 — **즉시 시작 가능**
- **시작 가능 시점**: T+0 (W15 Day 1)

### W15-05 — Payment 8 + Privacy 5 + Content 3 잔여 golden (carry-over CO-02 잔여)

- **책임**: backend (payment) + legal (privacy) + content (content)
- **산출물**:
  - Payment 8 추가 (mapping 보완 / proration / refund / grace period / cross-platform conflict 등)
  - Privacy 5 추가 (DSR partial / consent revocation mid-cycle / minor age boundary / regional variant 등)
  - Content 3 추가 (audio range edge / retire after report / distractors after replace — R-24 해소 케이스 포함)
- **DoD**:
  - 각 카테고리 누적: Payment 15 / Privacy 11 / Content 11 = 37건 (목표 충족)
  - strict mode 전부 통과
- **의존성**: 없음 (각 도메인 병렬) — **즉시 시작 가능**
- **시작 가능 시점**: T+0 (W15 Day 1)

### W15-06 — audit_log 위반 alert 채널 (NEW-03)

- **책임**: security + devops
- **산출물**:
  - Slack #security webhook 시크릿 등록 (GitHub Secrets)
  - Edge Function `audit-alert` 또는 Postgres trigger → webhook 호출 (RLS violation, signature_invalid, age_bypass_attempt 등)
  - `docs/security/ALERT_RUNBOOK.md` (어떤 이벤트가 어떤 채널로 가고 누가 acknowledge)
- **DoD**:
  - dev에서 인위적 위반 1건 → Slack 도달 확인
  - runbook에 on-call 회전 명시
- **의존성**: **W15-01 RLS evaluator 완료 후** (alert payload 스키마가 evaluator violation 분류와 정합 필요)
- **시작 가능 시점**: T+3~5일 (W15-01 머지 후)

### W15-07 — `eval-nightly.yml` cron 활성화 + DB seed distractors 재검증 (CO-03 + NEW-04)

- **책임**: devops (cron) + content + analytics (DB seed evaluator 보강)
- **산출물**:
  - `.github/workflows/eval-nightly.yml` cron schedule unblock (RLS job 포함)
  - `scripts/eval/content.ts`에 `distractors_after_retire` 검증 함수 추가 — DB seed snapshot 또는 golden 시나리오로 retire/replace 적용 후 unique 재단언
- **DoD**:
  - 첫 nightly run green
  - R-24 해소 commit
- **의존성**: **W15-01 RLS evaluator 머지 + W15-05 content 잔여 golden 작성 후**
- **시작 가능 시점**: T+5~7일 (W15-01, W15-05 완료 후)

---

## 4. Cross-cutting 의존성 그래프

```
[T+0 즉시 시작 가능 — 5개 작업 병렬]
  ├─ W15-01 (RLS evaluator)              security + backend
  ├─ W15-02 (baseline metrics 정의/Day0) analytics 단독
  ├─ W15-03 (Mastered/Weak event emit)   analytics + frontend (W15-02 schema 합의 후 emit, 사실상 병렬)
  ├─ W15-04 (SRS 28건 golden)            analytics + qa
  └─ W15-05 (Payment/Privacy/Content 잔여) backend + legal + content (3 도메인 내부 병렬)

[T+3~5일 — W15-01 완료 의존]
  └─ W15-06 (audit_log alert)            security + devops

[T+5~7일 — W15-01 + W15-05 완료 의존]
  └─ W15-07 (nightly cron + R-24 해소)   devops + content + analytics

[T+1일 ~ T+14일 — 매일 — W15-02에서 시작]
  └─ baseline metrics daily snapshot     analytics (자동, GitHub Actions cron)
```

핵심 cross-cutting 포인트:
- **security ↔ backend**: W15-01 RLS evaluator는 정책 SQL SoT를 evaluator와 마이그레이션 양쪽이 import하는 구조 필요 (R-12 패턴 RLS로 확장)
- **analytics ↔ frontend**: W15-03 event schema는 analytics가 정의하고 frontend가 emit. backend는 변경 없음
- **security ↔ devops**: W15-06 alert는 webhook secret이 GitHub Secrets에 들어가야 작동 — devops가 secret rotation 정책 동시 작성

---

## 5. 차단 / 대기 표

| 작업 | 차단 여부 | 대기 사유 | 해소 트리거 |
|---|---|---|---|
| W15-01 | ✅ 시작 가능 | - | - |
| W15-02 | ✅ 시작 가능 | - | - |
| W15-03 | ✅ 시작 가능 (병렬) | event schema는 W15-02와 합의가 이상적이나 schema 자체는 frontend 단독 진행 가능 | - |
| W15-04 | ✅ 시작 가능 | - | - |
| W15-05 | ✅ 시작 가능 | - | - |
| W15-06 | ⏸ 대기 | W15-01 RLS evaluator violation 분류 스키마 필요 | W15-01 머지 |
| W15-07 | ⏸ 대기 | W15-01 RLS job + W15-05 content distractors 케이스 머지 필요 | W15-01 + W15-05 머지 |

**현재 차단 항목 0건** (W15-06, W15-07은 W15 내부 순차 의존, 외부 차단 아님).

---

## 6. M3 종료(W16 게이트) 진입 조건

W15 종료 시점에 다음이 충족되어야 W16에서 M3 게이트 통과 rollup 작성 가능:

1. ✅ Evaluator 5개 모두 strict CI 통합 (SRS/Payment/Privacy/Content/**RLS**)
2. ✅ Golden 87건 완성 (SRS 50 + Payment 15 + Privacy 11 + Content 11)
3. ✅ Adversarial 9건 모두 evaluator로 violation 분류 (W14 RLS 4건 unblock 포함)
4. ✅ baseline metrics 4 KPI 14-day 수집 진행 중 (W15 Day-1 시작 → W16 Day-14 종료)
5. ✅ `eval-nightly.yml` cron 가동, 최소 1회 green
6. ✅ audit_log alert 채널 dev 환경 검증
7. ✅ R-23 (RLS) 해소, R-24 (distractors retire) 해소
8. ✅ ADR-0003 (Custom runner) Accepted 상태로 finalization

---

## 7. W15 종료 예상 시점

- **W15 시작**: 2026-05-11 (오늘, 22:00 dispatch 직후)
- **W15 종료 예상**: 2026-05-18 (7일 sprint 가정)
- **W16 시작 = M3 게이트 검증 sprint**: 2026-05-18 ~ 2026-05-25
- **M3 게이트 통과 rollup 예상일**: 2026-05-25 (baseline 14-day 수집은 W15 Day-1 시작 → W16 Day-7 = 14일 충족)

> 단, baseline metrics 14-day 윈도우가 sprint 일수보다 길면 W16에서도 수집 진행 중일 수 있음. 그 경우 W16 게이트는 "수집 진행 중 + 중간 스냅샷 7-day 분석 완료" 기준으로 통과시키고 14-day 종료 시점에 보고서 commit으로 닫음.

---

## 8. 12 시니어 readiness 자가보고 요청

각 도메인 시니어는 다음 호출에서 본 dispatch plan을 기준으로 다음을 자가 보고:

1. 본인이 책임진 W15 작업 (위 큐 매핑)
2. 시작 차단 여부 / 대기 항목
3. 산출물 초안 outline
4. risk / open question
5. context 기록 path 약속

12명 = backend / frontend / analytics / security / legal / content / qa / devops / planner / pm / designer / architect.

orchestrator는 다음 사이클에서 12 자가보고를 통합 승인하고 W15 실행 착수 신호 발송.

---

## 9. Orchestrator 서명 (dispatch only)

- **Dispatch plan 작성 완료**: 2026-05-11 22:00
- **승인 권한**: dispatch 단계 (실행 착수는 다음 사이클 12 readiness 통합 승인 후)
- **차단 항목**: 없음 (W15-06, W15-07은 W15 내부 순차)
- **다음 사이클**: 12 시니어 readiness 자가보고 → orchestrator 통합 승인 → W15 Day-1 실행 시작
