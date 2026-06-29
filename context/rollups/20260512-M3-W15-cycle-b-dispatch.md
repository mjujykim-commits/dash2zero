# Dispatch — M3 W15 Cycle B (W15 후반 작업 큐 + R-31/R-32 cross-track 작업)

> 작성: orchestrator
> 작성일: 2026-05-12 (Cycle A 통합 직후)
> 사이클: M3 W15 Cycle B (T+5~7일, 2026-05-15~17)
> 선행: `context/rollups/20260512-M3-W15-cycle-a-integration.md`
> 다음 사이클: C (W15 sprint 종료 rollup, 2026-05-18)

---

## 0. Cycle B 한 줄 목표

**W15-06/07 unblock + RLS evaluator nightly 1회 green + baseline Day-0~1 snapshot 적재 + Cycle A 통합 후 발견된 cross-track 작업 큐(R-31/R-32) 처리로 M3 게이트 v2 조건 9/10 충족**

---

## 1. Cycle B 작업 큐 (7건)

### W15-06b — audit_log alert stub dev 환경 검증 (보강)

- **책임**: security (lead) + devops (workflow stub manual run) + backend (trigger SQL contract cross-check)
- **선행**: W15-06 1차 commit (0004_audit_triggers.sql + security-alert-stub.yml + AUDIT_ALERT_RUNBOOK) ✅
- **산출물**:
  - dev 환경에서 인위적 RLS 위반 1건 발생 → trigger 발화 → `security_alerts` 테이블 INSERT 1건 + console paper 로그
  - workflow stub paper mode 1회 dispatch → GitHub Actions log + dedup 검증
  - `docs/security/AUDIT_ALERT_RUNBOOK.md` 검증 결과 절 추가 (W15-D5)
- **DoD**: dev console 출력 + DB security_alerts row 1건 + nightly evaluator가 violation 분류 + paper 모드 vault NULL → trigger no-op 확인
- **트리거**: W15-01 머지 완료 (RLS evaluator)
- **시작 권고**: T+5일 (2026-05-15 금)

### W15-07b — eval-nightly.yml cron unblock 6단계 단계 1~3

- **책임**: devops (lead) + backend (RLS evaluator 머지 commit 확인) + analytics (cron 첫 run 결과 cross-check) + content (`distractors_after_retire` 검증 함수 commit)
- **선행**: W15-01 머지 + W15-05c 머지 (Content distractors)
- **산출물**:
  - 단계 1: RLS evaluator 코드 머지 (W15-01) ✅
  - 단계 2: 로컬 13/13 PASS (책상 검증 완료, 실제 `pnpm eval:rls --strict` 실행 로그 commit)
  - 단계 3: GitHub manual dispatch 1회 PASS → green run URL commit
  - `scripts/eval/content.ts`에 `distractors_after_retire` 검증 함수 추가 (R-24 closed)
  - `docs/devops/EVAL_PR_CAPACITY.md` 단계 3 wall time 측정값 commit
- **DoD**: 단계 3 manual dispatch green + 5 evaluator 모두 strict pass + R-24 commit
- **트리거**: W15-01 + W15-05c 머지
- **시작 권고**: T+5~7일 (2026-05-15~17)

### W15-09 (신규, R-31 해소) — SRS-056~060 evaluator enum 활성화

- **책임**: backend (lead) + analytics (golden 호환성 검증) + learning (의미 재검증)
- **선행**: D-015 봉인 (Cycle A 완료) ✅
- **산출물**:
  - `scripts/eval/srs.ts` SrsCase.category union에 5개 enum 추가:
    - `"interruption_resume"` (SRS-056: client_attempt_id 멱등성, 409 응답)
    - `"dormant_return"` (SRS-057: 14일 dormant + weak 우선 노출)
    - `"report_invalidates_attempt"` (SRS-058: audio_mismatch 신고 시 stage 강하 무효)
    - `"same_session_repeat"` (SRS-059: 단일 세션 중복 attempt 시 SRS 1회 갱신)
    - `"weak_clear_threshold"` (SRS-060: weak=true → 1회 정답으로 즉시 clear)
  - 5개 분기 함수 작성 (applySrs 호출 + 060은 정답 1회 시 weak=false 단언)
  - `scripts/eval/srs.spec.ts`에 5건 unit test 추가
- **DoD**: `pnpm eval:srs --strict` 57/57 pass (056~060 포함) + spec 5건 green
- **트리거**: D-015 봉인 = 즉시 시작 가능
- **시작 권고**: T+0 (병렬, Cycle B 시작 시점)

### W15-10 (신규, R-32 해소) — privacy evaluator union 3종 활성화

- **책임**: backend (lead) + legal (의미 재검증)
- **선행**: D-014/D-015와 무관, Cycle A legal commit (PRV-012~016) 후 즉시
- **산출물**:
  - `scripts/eval/privacy.ts`의 `category` union에 3종 추가:
    - `"family_share"` (PRV-012: entitlement_inherited=false 회귀 catch)
    - `"minor_refund"` (PRV-013: KR 14~18세 30d SLA)
    - `"ccpa_no_sale"` (PRV-015: CCPA opt-out no-op)
  - 3개 분기 함수 작성 (PRV-012/013/015 expected 단언)
  - `scripts/eval/privacy.spec.ts`에 3건 unit test 추가
- **DoD**: `pnpm eval:privacy --strict` 16/16 pass (012/013/015 포함) + spec 3건 green
- **트리거**: legal Cycle A commit = 즉시 시작 가능
- **시작 권고**: T+0 (병렬, Cycle B 시작 시점)

### W15-02b — baseline Day-0~1 snapshot 적재

- **책임**: analytics (lead) + devops (synthetic seed staging 실행) + frontend (1인 dogfood 활동)
- **선행**: W15-02 1차 commit (queries.sql + run.ts + BASELINE_METRICS.md) ✅
- **산출물**:
  - `scripts/seed/synthetic-baseline.ts` staging DB 1회 실행 → 200 user × 14d cohort 적재
  - `scripts/baseline/run.ts` 첫 실행 → `metrics/daily/2026-05-12.json` Day-0 commit
  - 1인 dogfood (Owner 계정) lesson_started 1회 + lesson_completed 1회 → analytics view에서 신호 적재 확인
  - 다음 날(T+1, 2026-05-13) Day-1 snapshot commit으로 cron 동작 모사
- **DoD**: Day-0 + Day-1 snapshot 2건 commit + synthetic 200 user 적재 확인 + dogfood 신호 1건 적재
- **트리거**: W15-02 1차 commit = 즉시 시작 가능
- **시작 권고**: T+0~1일 (2026-05-13~14)

### W15-04b — SRS 50 strict pass nightly 확인

- **책임**: qa (lead) + analytics
- **선행**: W15-09 (SRS-056~060 enum 활성화) 완료 후
- **산출물**:
  - `pnpm eval:srs --strict` 57/57 pass nightly 1회 green
  - 11×N 매트릭스 (15 카테고리 × N) 빈 셀 0 검증 — qa README §"category enum 확장 기록" 정합
  - daily_limit 047~050 deprecated stub 파일 git rm (W16 이연 가능, qa context §1.3 명시)
- **DoD**: nightly 57/57 green + 매트릭스 0 빈 셀
- **트리거**: W15-09 완료
- **시작 권고**: T+2~3일 (2026-05-14~15)

### W15-11 (신규) — Cycle A 결과 cross-doc 정합 점검

- **책임**: pm (lead) — 12명 트랙 cross-track 의존성 모니터 (dispatch v2 §2.11)
- **산출물**:
  - REVIEW_QA의 Q-PM-W15-001~004 status 갱신 (Q-PM-W15-001 learning agent SRS-056~060 commit 후 RESOLVED 표시 / Q-PM-W15-004 dashboard 작성 후 RESOLVED)
  - `docs/pm/W15_SPRINT_BOARD.md` Cycle A 진척률 반영 (8건 작업 큐 + 9건 Cycle B 추가 = 17건)
  - `docs/harness/HARNESS_EXECUTION_BOARD.md` §2.3 W1-M4 게이트 문구 D-010 정합 갱신 (Q-PM-W15-004 추적 해소)
- **DoD**: 3개 SSOT 갱신 + REVIEW_QA 4건 status 결과 commit
- **트리거**: Cycle A 봉인 = 즉시 시작 가능
- **시작 권고**: T+0 (병렬)

---

## 2. 의존성 그래프

```
[T+0 즉시 병렬 — 4개 작업]
  ├─ W15-09  (SRS 056~060 evaluator enum)   backend + analytics + learning
  ├─ W15-10  (privacy evaluator union 3종)   backend + legal
  ├─ W15-02b (baseline Day-0~1 snapshot)    analytics + devops + frontend
  └─ W15-11  (cross-doc 정합)                pm

[T+2~3일]
  └─ W15-04b (SRS 57 strict nightly green) qa + analytics    (W15-09 후)

[T+5~7일]
  ├─ W15-06b (alert stub dev 검증)          security + devops + backend (W15-01 머지 후)
  └─ W15-07b (cron unblock 단계 1~3)        devops + backend + analytics + content (W15-01 + W15-05c 머지 후)

[T+7일 (Cycle C, 2026-05-18)]
  └─ W15 sprint 종료 rollup                 orchestrator (12명 작업 통합 승인)
```

---

## 3. M3 게이트 v2 충족 예상 (Cycle B 종료 시점)

W15 Cycle B 종료(2026-05-17 토) 예상 충족: **9/10**

| # | 조건 | Cycle B 진척 |
|---:|---|---|
| 1 | Evaluator 5 strict CI | ✅ (W15-07b 단계 3 manual PASS) |
| 2 | Golden 100+건 | ✅ (Cycle A 충족) |
| 3 | Adversarial 13 violation 분류 | ✅ (W15-07b nightly green) |
| 4 | baseline 3-source 동작 | 🟡 (W15-02b Day-0~1 commit, 14d cron은 W16 종료까지) |
| 5 | eval-nightly cron 1회 green | ✅ (W15-07b 단계 3) |
| 6 | alert stub dev 검증 | ✅ (W15-06b) |
| 7 | R-23 / R-24 closed | ✅ (W15-07b commit) |
| 8 | ADR-0003 Accepted | ✅ (W13 완료) |
| 9 | ADR-0006 Accepted | ✅ (Cycle A 봉인) |
| 10 | PRD threshold | ✅ (Cycle A 충족) |

**9/10 + #4 partial (Day-0~1 적재 + cron 가동, 14d 누적은 W16 게이트 sprint 종료 시점 완전 충족)**

---

## 4. Cycle B 자율 결정 위임 (orchestrator)

다음 결정은 작업 agent 자율로 진행, orchestrator 사이클 C에서 일괄 승인:

| 결정 영역 | 권한 위임 받는 agent | 비고 |
|---|---|---|
| SRS-056~060 evaluator 분기 함수 시그니처 | backend | applySrs 재사용 vs 별도 분기 — backend 자율. 단 060 weak_clear는 `weak=false` 단언 명시 |
| privacy evaluator 3종 union 추가 위치 | backend + legal | category enum의 알파벳 정렬 vs 점유 순서 — backend 자율 |
| baseline Day-0 측정 윈도우 시작 일자 | analytics | 2026-05-12 (Cycle A 직후) vs 2026-05-13 (synthetic 적재 후 첫 자정) — analytics 자율 |
| 매니페스트 7개 분기 ID 명시 | qa | i18n_assertions / a11y_assertions의 e2e_followup mapping ID 자율 |
| RLS nightly cron 단계 4 (24h flake) 면제 여부 | devops + security | W15 종료 압박 시 단계 4 skip → 단계 5 진입 가능 (보안 reviewer 승인 시) |

---

## 5. 통합 승인 호출 시점 (Cycle B → C → D)

| 사이클 | 트리거 | 통합 승인 대상 |
|---|---|---|
| **B** (T+5~7일, 2026-05-15~17) | W15-06b/07b unblock 완료 | RLS nightly 1회 green / baseline Day-0~1 / stub 동작 / R-23/R-24 closed / R-31/R-32 해소 |
| **C** (T+7일, 2026-05-18) | W15 sprint 종료 rollup | 12명 + 7건 Cycle B 작업 통합 / W15 rollup / W16 게이트 검증 sprint 진입 |
| **D** (T+14일, 2026-05-25) | M3 게이트 검증 | M3_GATE_V2_DASHBOARD 10조건 모두 검증 / M3 completed 서명 / M4 진입 |

---

## 6. Risks / Blockers (Cycle B)

| ID | 항목 | 강도 | mitigation |
|---|---|---|---|
| B-1 | W15-09 evaluator enum 5종이 R-31 해소까지 W15 종료 압박 | medium | T+0 즉시 시작, backend 자율 |
| B-2 | W15-02b synthetic seed 첫 staging 적재 실패 시 Day-0 commit 지연 | medium | devops 6 단계 fail-fast (README §6 contract) — 실패 시 즉시 alert |
| B-3 | RLS nightly first run flake 발생 | high | devops 6단계 단계 4 24h flake 측정 (3회 dispatch, 0 flake). 1건 발생 시 5회 보강 |
| B-4 | analytics 4 큐 동시 부하 누적 (Cycle A에서 lead 책임 4개) | medium → low | Cycle A 1차 commit 완료, Cycle B는 검증만 — 부하 분산됨 |

---

## 7. Definition of Done — Cycle B

- [ ] W15-09 SRS evaluator enum 5종 활성화 + spec green
- [ ] W15-10 privacy evaluator union 3종 활성화 + spec green
- [ ] W15-02b baseline Day-0 + Day-1 snapshot commit
- [ ] W15-04b SRS 57/57 nightly strict green
- [ ] W15-06b audit_log alert stub dev 1건 검증
- [ ] W15-07b eval-nightly cron 단계 1~3 + R-24 closed
- [ ] W15-11 REVIEW_QA / W15_SPRINT_BOARD / HARNESS_EXECUTION_BOARD 갱신
- [ ] M3_GATE_V2_DASHBOARD 갱신 (9/10 + #4 partial 표시)
- [ ] orchestrator Cycle B context 기록
- [ ] SWARM_LEDGER Cycle B entry

---

## 8. 서명

- Cycle B dispatch 작성 완료: 2026-05-12 orchestrator
- 봉인 결정: D-014 / D-015 (Cycle A) + ADR-0006 Accepted
- 차단 항목: 없음 (W15-06b/07b는 W15-01 + W15-05c 머지 후 진입, W15-09/10/02b/11은 즉시)
- 실행 착수 신호: 본 dispatch 발행 + Cycle A 통합 commit 완료 = 즉시
- 다음 orchestrator 호출: Cycle C (T+7일, 2026-05-18, W15 sprint 종료 rollup)
