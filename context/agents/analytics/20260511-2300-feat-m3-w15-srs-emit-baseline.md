# M3 W15 — SRS 22건 + Mastered/Weak emit spec + baseline metrics

> 작성: analytics agent
> 작성일: 2026-05-11 23:00 KST
> 사이클: M3 W15 실작업 (orchestrator 결정 "Supabase staging + synthetic seed + 1인 dogfood, real-user M5 이연")
> 선행: `context/agents/analytics/20260511-2200-chore-m3-w15-readiness.md`

---

## 1. 작업 산출물 요약

| 작업 | 산출물 | 상태 |
|---|---|---|
| 1. SRS golden 22건 | `fixtures/golden/srs/SRS-{007,008,010,011,015,016,017,019,020,023,025,028,030,034,037,039,041,043,044,051,052,053}.yaml` (22건) | 완료 |
| 1b. README drift 정정 | `fixtures/golden/srs/README.md` (qa가 후속 패치로 i18n/a11y/daily_limit rename 추가) | 완료 (qa 추가 변경 인지) |
| 2. Mastered/Weak event spec | `docs/12_event_taxonomy.md` §3.1~3.4 신설 (3 이벤트 12 properties + reason enum + emit 위치 + deprecated 마이그레이션) | 완료 |
| 3a. baseline SQL view | `scripts/baseline/queries.sql` (vw_baseline_user_cohort + 4 지표 view + summary view) | 완료 |
| 3b. BASELINE_METRICS.md | `docs/harness/BASELINE_METRICS.md` 측정 방법론 신설 | 완료 |
| 3c. baseline runner | `scripts/baseline/run.ts` (4 view 실행 + JSON 출력 + apply-views opt) | 완료 |

---

## 2. SRS 22건 자율 결정 분배

orchestrator 분배안 vs evaluator enum 매핑:

| orchestrator 분류 | 건수 | evaluator enum 매핑 | 작성 ID |
|---|---:|---|---|
| stage 전이 오답 | 5 | stage_incorrect (4) + mastered_protection (1, SRS-017이 stage5 cross-cycle 강하라 보호 카테고리로 더 정확) | 015, 016, 017, 019, 020 |
| multi-device | 3 | multi_device | 037, 039, 041 |
| 04:00 경계 | 3 | cycle_boundary | 028 (DST), 030 (KST), 034 (Sydney) |
| stage 전이 정답 | 4 | stage_correct (3) + mastered_reached (1, SRS-010이 mastered 동시 도달이라 mastered_reached로 더 정확) | 007, 008, 010, 011 |
| retire | 2 | content_retire | 043, 044 |
| interruption | 1 | stage_correct (enum 흡수, 의미는 lesson_abandoned resume) | 051 |
| dormant | 1 | stage_correct (enum 흡수, 의미는 90일 무활동 재진입) | 052 |
| weak clear | 1 | mastered_reached (SRS-023이 weak clear와 mastered 동시 — emit assertion 통합) | 023 |
| mastered 보호 | 2 | mastered_protection | 025, 053 |
| **합** | **22** | | |

**ID 충돌 인지** — README가 qa agent에 의해 업데이트되며 learning agent가 별도 SRS-051~055를 작성한 사실이 표기됨. analytics 점유 (051/052/053)와 충돌. 해소는 orchestrator escalate (README §"W15 보강 3차" 행 참조). analytics는 점유 그대로 유지 — 본 fixture는 evaluator enum 정합 + 22건 분포 이미 확정.

**SRS-023 emit 단언 통합** — orchestrator 지시 "SRS-045_emit.yaml은 qa 영역, 너는 1건 단언 fixture를 SRS-027에 통합 가능"을 SRS-023으로 변경 (027은 mastered_reached 단일 케이스로 이미 점유, 23이 weak clear + mastered_reached 동시라 emit assertion 통합 더 자연). 027은 그대로 유지, 023이 emit spec ground truth 역할.

---

## 3. Mastered/Weak event spec 표준화 (taxonomy §3.1)

3 이벤트 (`srs_mastered_reached` / `srs_mastered_lost` / `srs_weak_flagged`) 동일 12 property 슈퍼셋:

```
word_id (high card) / pack_id (low card, primary dim) / triggered_by (lesson|review|merge)
local_day / stage_before / stage_after / weak_before / weak_after / same_cycle
attempts_count / days_since_first_seen / reason (conditional, weak_flagged + mastered_lost만)
```

reason enum 5종: `same_cycle_double_wrong` / `single_wrong_cross_cycle` / `mastered_double_wrong` / `manual_reset` / `other`.

deprecated `word_mastered` / `word_weakened`는 v0.3에서 alias 발화 + M3 W16 제거. 동시 emit으로 dashboard cutover 기간 보호.

emit 위치는 R-12 SoT 정합 — `_shared/srs.ts` 호출 측 (mobile lesson thunk + Edge Function submit-attempt 응답)에서 transition diff. 멱등성 dedupe key: (word_id, occurred_at, transition_kind).

frontend 협업 — `apps/mobile/src/lib/analytics.ts`에 emit 헬퍼 추가 시 본 spec 12 property 슈퍼셋 사용 권고. 검증은 vitest mock으로 logEvent spy.

---

## 4. baseline SQL view 설계 결정

### 4.1 view 5종

1. `vw_baseline_user_cohort` (보조) — Day 0 cohort = 첫 lesson_started의 local_day, 그 시점 entitlement.
2. `vw_baseline_d3_retention` — cohort_local_day × entitlement_band 분해.
3. `vw_baseline_d1_streak` — D0 lesson_completed 기준 D1 lesson_completed 비율.
4. `vw_baseline_lesson_complete_rate` — attempt_band(first/returning) × entitlement × outcome (completed/free_limit_abandon/other_abandon) 3차원 분해.
5. `vw_baseline_paywall_funnel` — view_day × source 분해, signin_required 중간 단계 자동 분해(source enum 추가).
6. `vw_baseline_summary` — 4 지표 14d 가중 평균 1행 출력 (run.ts JSON용).

### 4.2 결정 근거

- **04:00 reset**: clientside computed `learning_attempts.local_day` 컬럼 직접 사용. R-12 SoT 정합. server validation은 RLS evaluator 책임.
- **entitlement Day 단위 검사**: 같은 사용자가 free → premium 전환 시 정확히 cover. `subscription_entitlements`의 starts_at/expires_at + status='active' 조건.
- **Day-3 retention 정의**: lesson 또는 review 정답 1회+ (read-only review는 retention 인정 안 함, 학습 활동만).
- **D1 streak 정의**: lesson_completed 2일 연속 (lesson_started만으로는 push click 즉시 이탈도 retention으로 잡혀 KPI 오염, B-04).
- **lesson_complete_rate outcome 분리**: free 한도 도달 abandon은 paywall funnel의 잠재 분모. 다른 abandon과 분리해 product/pricing 의사결정 정확화.
- **paywall_signin_required 분해**: source enum 추가만으로 자동 반영 — 스키마 변경 없이 frontend emit으로 funnel 분해.

### 4.3 알려진 한계 (BASELINE_METRICS.md §5와 동일)

LIM-1~6 — 분포 가설 추측치, Firebase 14d 미수집, signin_required emit 의존, guest 미측정, session-level 미포함, 7d window 무료 체험 미반영.

---

## 5. 의존성 / 동기화 상태

| 의존 | 상대 agent | 상태 |
|---|---|---|
| frontend emit (analytics.ts) | frontend | 진행 중 — 본 spec 12 property 슈퍼셋 hand-off 완료 (taxonomy §3.1) |
| synthetic seed (synthetic-baseline.ts) | devops | 완료 — 본 view 4개의 데이터 표면 보장 (테이블 스키마 정합 확인됨) |
| qa SRS-045~050 i18n+a11y | qa | 완료 — README §evaluator enum 확장 기록 (i18n/a11y enum 추가 PR 권고) |
| daily_limit rename (047→061~064) | qa | 완료 — analytics view는 영향 없음 (daily_limit은 SRS evaluator only, baseline view는 daily_usage 테이블 직접 참조) |
| learning SRS-051~055 ID 충돌 | learning | **충돌** — orchestrator escalate 필요 |
| RLS evaluator dispatch | security + backend | 미진행 (W15 후반) — analytics 영향 1줄 |
| BigQuery export 결정 | devops | **활성화 안 함** 결정 (BASELINE_METRICS §1) |

---

## 6. 자가 평가

**완료** — 작업 1 (22건), 작업 2 (3 이벤트 spec + 4 sub-section), 작업 3 (queries.sql + run.ts + BASELINE_METRICS.md).

**검증 필요**:
- evaluator runner (`pnpm tsx scripts/eval/runner.ts`)에서 22건 신규 fixture 모두 pass 확인 (W15 commit 시 CI green 확인).
- frontend가 analytics.ts에 emit 추가 후 SRS-023/025/041/053의 emit assertion이 vitest mock으로 cover되는지 확인.
- `apply-views` 옵션으로 `queries.sql`을 staging에 적용 후 `vw_baseline_summary`가 정상 1행 반환하는지 확인 (devops seed 실행 후).

**미해결** — learning agent의 SRS-051~055 ID 충돌. analytics는 점유 그대로 유지, 충돌 해소는 orchestrator. 협상 안: learning이 056~060로 rename (analytics 점유 보호) 또는 learning 시나리오 의미와 analytics 시나리오 의미가 충돌하지 않는다면 fixture 둘 다 보존 + ID 재배치.

---

## 7. 다음 사이클 (W16 예측)

1. nightly CI에 `scripts/baseline/run.ts` 후크 추가 (devops 협업).
2. PRD §8 임계값과 비교하는 `scripts/baseline/check-thresholds.ts` 작성 (planner의 §8 확정 후).
3. word_mastered / word_weakened deprecated 이벤트 emit 제거 (taxonomy §3.4).
4. 1인 dogfood Firebase DebugView 검증 + opt-in flow QA (frontend + qa).
5. M5 real-user 수집 준비 — closed beta 인프라 (TestFlight/Play closed track) 사전 작업.
