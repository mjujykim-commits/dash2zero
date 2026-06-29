# M3 W15 Sprint Board — 12명 트랙 동시 진행

> 작성: pm agent
> 작성일: 2026-05-11 23:00 KST
> 사이클: M3 W15 (5/12 월 ~ 5/18 일), 7일 wall-clock
> 입력 SSOT:
> - `context/rollups/20260511-M3-W15-dispatch-plan-v2.md` (orchestrator dispatch v2)
> - `context/agents/pm/20260511-2200-chore-m3-w15-readiness.md` (PM readiness 12항목 자가 진단)
> - DECISION_LOG D-010 / D-011 / D-012 / D-013 (4 결정 봉인)
> 출력 SSOT: 본 문서 = 12명 트랙 동시 진행 상황표 (단일 PM 운영 시야)
> Skill 사용: humanizer (built-in) · taste-skill

---

## 0. 사용자 결정 반영 (2026-05-11)

사용자는 다음 운영 blocker를 자율 결정으로 정리했다. PM은 이 결정에 따라 sprint board에서 **모든 운영 트랙을 M5+ 이연**으로 표기한다.

- **C-13 사업자 등록 / 통신판매업 / 결제 수령 주체 / 약관 사업자 정보** → M5 entry 이연
- **실 베타 사용자 모집** → M5 (Beta) 이연, W15 baseline은 synthetic + 1인 dogfood로 갈음
- **Slack #security 실 webhook URL** → M5 이연, W15는 stub 모드 (audit_log trigger + DB 적재 + console)
- **W15 작업 큐는 제품/하네스 코드만으로 정렬, 12명 모두 코드 트랙으로 가동**

---

## 1. 12명 트랙 진행 상황표

각 트랙: 책임 / 산출물 / 시작일 / 마감일 / 의존성 / 상태.

| # | Agent | 트랙 (W15 작업 매핑) | 산출물 | 시작일 | 마감일 | 의존성 | 상태 |
|---|---|---|---|---|---|---|---|
| 1 | **security** | W15-01 RLS evaluator (lead) + W15-06 alert stub (lead) | `scripts/eval/rls.ts` / `fixtures/golden/rls/` 7+ / `_shared/rls.ts` SoT / `audit_log` trigger 검증 / `security_alerts` RLS / `docs/security/ALERT_RUNBOOK.md` (stub 모드 + M5 활성화 절차) | 5/12 (월) | 5/15 (목) RLS / 5/17 (토) alert stub | W15-06은 W15-01 RLS payload 머지 후 (T+3~5일) | **READY** |
| 2 | **backend** | W15-01 RLS 정책 SQL SoT 협업 + W15-05 Payment 8 golden + W15-06 audit_log trigger SQL | `_shared/rls.ts` SoT / `fixtures/golden/payment/` Payment 8건 (누적 15) / `migrations/` audit_log Postgres trigger | 5/12 (월) | 5/14 (수) Payment / 5/15 (목) RLS / 5/16 (금) trigger | W15-01 (협업), W15-05 단독 시작 가능 | **READY** |
| 3 | **analytics** | W15-02 baseline 3-source (lead) + W15-03 Mastered/Weak event (lead) + W15-04 SRS 28 golden (lead) + W15-07 distractors evaluator 보강 | `docs/harness/BASELINE_METRICS.md` (4 KPI / 윈도우 / 3-source / threshold) / `scripts/analytics/snapshot.ts` / Day-0 snapshot commit / `apps/mobile/lib/analytics.ts` event schema / `fixtures/golden/srs/` 28건 (누적 50) / `scripts/eval/content.ts` `distractors_after_retire` | 5/12 (월) | 5/13 (화) BASELINE_METRICS draft / 5/14 (수) SRS 28 / 5/14 (수) event emit / 5/17 (토) distractors evaluator | W15-03은 W15-02 KPI에 mastered 라인 의존 (역방향 가능, 사양 합의 0.5d 선행) | **HIGH LOAD** (4 큐 동시 — 캐파시티 ledger §3 권고 참조) |
| 4 | **frontend** | W15-03 Mastered/Weak event emit (모바일 측 호출 지점) | `apps/mobile/screens/` 학습 흐름 2-3곳 logEvent 추가 / dev emit log 캡처 | 5/13 (화) | 5/14 (수) | W15-03 analytics 사양 합의 (5/12 → 5/13) | **READY** |
| 5 | **legal** | W15-05 Privacy 5 golden 충원 (DSR / consent revocation 등) | `fixtures/golden/privacy/` Privacy 5건 (누적 11) | 5/12 (월) | 5/14 (수) | 없음 | **READY** |
| 6 | **content** | W15-05 Content 3 golden + W15-07 R-24 distractors 재검증 케이스 + DB seed 보강 | `fixtures/golden/content/` Content 3건 (누적 11, content 3 fixtures 이대로 유지 — Q-PM-W15-001 결정) / Starter 60 seed 그대로 / `scripts/eval/content.ts` distractors retire 시나리오 입력 | 5/12 (월) | 5/14 (수) Content 3 / 5/17 (토) distractors 재검증 | W15-05 단독 / W15-07은 W15-05 + W15-01 후 | **READY** (B-2~B-5 batch 신규 콘텐츠는 M3 W15 learning에 escalate, 본 sprint는 fixtures만) |
| 7 | **qa** | W15-04 SRS 50 golden 분포 검증 (협업) + 11×N 매트릭스 빈 셀 0 보장 + adversarial 9건 violation 분류 검증 + W15 종료 검증 게이트 | `fixtures/golden/srs/README.md` 분포 표 갱신 / 갭 분석 노트 / W15 종료 시 12 트랙 통합 검증 보고 | 5/13 (화) | 5/14 (수) SRS 분포 / 5/18 (일) W15 종료 검증 | W15-04 analytics 28 golden 머지 후 검증 | **READY** |
| 8 | **devops** | W15-02 synthetic seed 스크립트 + W15-06 alert workflow stub + W15-07 nightly cron + EAS staging 환경 점검 + secret 정책 (M4 ADR-0008 이연 부분 명시) | `scripts/seed/synthetic-baseline.ts` (14-day 100명 시뮬) / `.github/workflows/security-alert.yml` stub (webhook URL 없이 console + DB) / `.github/workflows/eval-nightly.yml` 활성화 / EAS staging 점검 보고 / `docs/runbooks/SECRET_ROTATION.md` outline (M4 이연 명시) | 5/12 (월) | 5/13 (화) synthetic seed / 5/16 (금) alert stub workflow / 5/17 (토) cron 활성화 | W15-07은 W15-01 + W15-05 머지 후 | **READY** |
| 9 | **planner** | PRD threshold 4 KPI 자율 결정 (D-013 산출물) — green/yellow/red band + 출처 명시 | `docs/product/PRD.md` threshold 섹션 갱신 / 4 KPI band commit | 5/12 (월) | 5/14 (수) | W15-02 baseline 정의와 동시 | **READY** |
| 10 | **pm** (본인) | W15 sprint 운영 점검 + 12명 cross-track 의존성 모니터 + W16 게이트 rollup 사전 양식 + 사이클 A/B/C orchestrator 호출 협업 + Q-PM-W15 4건 status 유지 | 본 sprint board (이 문서) / 캐파시티 ledger / REVIEW_QA Q-PM-W15-001~004 갱신 / W16 rollup 양식 초안 / mid-sprint 점검 노트 (T+3일) | 5/12 (월) | 5/18 (일) | 12 트랙 모두 (모니터링) | **ACTIVE** |
| 11 | **designer** | Mastered/Weak UI 상태 디자인 토큰 (theme-decisions 갱신) + RLS violation 노출 어드민 화면 모킹 (W15-06) | `docs/brand/THEME_DECISIONS.md` mastered/weak 상태 토큰 추가 / 어드민 alert 뷰 모킹 (Figma/마크다운 wireframe) | 5/13 (화) | 5/15 (목) 토큰 / 5/17 (토) 어드민 모킹 | W15-03 (이벤트 발화 시점 시각화), W15-06 (어드민 화면) | **READY** |
| 12 | **architect** | **ADR-0006 SRS 공유 패키지 Accepted** (W15-08) + W15-01 RLS evaluator 구조 가이드 (R-12 SoT 패턴 RLS 확장) + ADR-0007 baseline 저장소 outline (W16 작성 예고) | `docs/adr/ADR-0006-shared-srs-package.md` Accepted / `_shared/rls.ts` 패턴 가이드 / `docs/adr/ADR-0007-baseline-storage.md` outline | 5/12 (월) | 5/14 (수) ADR-0006 Accepted / 5/17 (토) ADR-0007 outline | 단독 (W15-01과 패턴 가이드만 협업) | **READY** |

**M5+ 이연 트랙 표기 (사용자 결정 반영, W15 작업 큐에서 제외)**:

| Agent | 이연 항목 | 사유 | 처리 시점 |
|---|---|---|---|
| legal | C-13 사업자 등록 / 통신판매업 / 약관 사업자 정보 / W-8BEN | D-012 사용자 결정 | M5 entry, legal sprint |
| backend (운영) | RC payout 발행자 정보 / 결제 수령 계좌 | C-13 의존 | M5 entry |
| devops (운영) | Slack #security 실 webhook URL / on-call 회전 | D-011 사용자 결정 | M5 entry |
| pm/learning (운영) | 실 베타 사용자 모집 (외부 채용/광고) | D-012 + 사용자 명시 회피 | M5 (Beta) |
| pm | App Store / Play Store 계정 운영 | 출시 직전 | M5 |

---

## 2. 의존성 그래프 (사용자 결정 반영, 운영 항목 제외)

```
T+0 (5/12 월) — 즉시 병렬 6개 + ADR 1개 = 7 작업 동시 착수
  ├─ W15-01  RLS evaluator                     security + backend         → 5/15 (목)
  ├─ W15-02  baseline 3-source + synthetic     analytics + devops + planner → 5/13 (화) draft, 5/12부터 daily snapshot
  ├─ W15-03  Mastered/Weak event               analytics + frontend + designer → 5/14 (수)
  ├─ W15-04  SRS 28 golden                     analytics + qa             → 5/14 (수)
  ├─ W15-05  Payment 8 / Privacy 5 / Content 3 backend + legal + content  → 5/14 (수)
  ├─ W15-08  ADR-0006 SRS 공유 패키지 Accepted architect                  → 5/14 (수)
  └─ planner D-013 PRD threshold 4 KPI         planner                    → 5/14 (수)

T+3~5일 (5/15 목 ~ 5/16 금) — W15-01 머지 후
  └─ W15-06  alert stub (audit_log trigger + workflow stub + admin 모킹)  → 5/17 (토)

T+5~7일 (5/16 금 ~ 5/17 토) — W15-01 + W15-05 머지 후
  └─ W15-07  nightly cron 활성화 + R-24 distractors_after_retire          → 5/17 (토)

T+1일 ~ T+14일 매일 (5/13 ~ 5/25)
  └─ baseline daily snapshot                   analytics (cron 자동)      → M3 게이트 W16 종료까지
```

**critical path** = baseline 수집 파이프 동작 검증 (D-010 반영, 14-day cron 가동) — 5/12 시작 → 5/25 종료. real-user 14-day 수집은 M5 이연이므로 W15 종료 게이트 조건은 "파이프 동작 검증" + "Day-0~Day-7 누적 snapshot"으로 갈음.

---

## 3. 트랙별 상태 정의

| 상태 | 의미 |
|---|---|
| **READY** | 시작 가능, blocker 없음 |
| **ACTIVE** | 진행 중 |
| **BLOCKED** | 의존성 미해소로 시작 불가 |
| **HIGH LOAD** | 캐파시티 ledger §3 권고 영역 — PM 모니터 대상 |
| **DONE** | 산출물 머지 + DoD 통과 |
| **DEFERRED-M5** | 사용자 결정으로 M5+ 이연, 본 sprint 작업 큐 제외 |

W15 시작 시점(5/12 00:00) 기준: READY 11 / ACTIVE 1 (pm) / HIGH LOAD 1 (analytics 4 큐 동시) / BLOCKED 0 / DEFERRED-M5 5건.

---

## 4. PM 모니터링 체크포인트

| 시점 | 액션 | 트리거 |
|---|---|---|
| 5/12 (월) 21:00 | Day-1 점검: 7개 동시 착수 트랙 모두 첫 commit 확인 | sprint Day-1 종료 |
| 5/14 (수) 21:00 | mid-sprint A 점검 (orchestrator 사이클 A 협업): W15-01 진행률 / baseline Day-3 snapshot / W15-04~05 golden 진척 / ADR-0006 draft | T+3일 |
| 5/15 (목) 21:00 | W15-01 머지 확인 → W15-06 unblock 신호 송출 | T+4일 |
| 5/16 (금) 21:00 | mid-sprint B 점검 (orchestrator 사이클 B 협업): W15-05 머지 → W15-07 unblock | T+5일 |
| 5/18 (일) 21:00 | W15 종료 rollup 양식 작성, 12명 통합 승인 사이클 C 협업 | T+7일 |
| 5/20 (수) 21:00 | M3 게이트 dry-run 진단 (baseline trend 확인) | W16 중반 |
| 5/25 (월) 21:00 | M3 게이트 검증 + M3 종료 rollup 작성 | T+14일 |

---

## 5. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-11 23:00 | 12명 트랙 동시 진행 sprint board 초기 작성. 사용자 결정(D-010~D-013) 반영, 운영 5건 DEFERRED-M5 표기, W15-01~08 + planner D-013 = 7 작업 5/12 동시 착수 정렬 | pm |
