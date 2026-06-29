# SRS Golden Cases — 57+ cases (analytics 22 + qa 6 + learning 5 + daily_limit rename + W14 잔여)

> Source: `docs/harness/EVALUATION_SCENARIOS.md §2.2`
> Target: 100% 통과율 (1건이라도 실패 시 evaluation runner halt)
> Runner: `scripts/eval/runner.ts` + `scripts/eval/srs.ts`
> Last sync: 2026-05-12 KST (M3 W15 Cycle A — orchestrator D-015 봉인: learning SRS-051~055를 056~060으로 rename)
> Last writer: orchestrator (Cycle A 통합 — ID 충돌 해소)

## 분포 (M3 W15 Cycle A 통합, 15 카테고리)

evaluator category enum (`scripts/eval/srs.ts`) 기준 실제 분포. D-015 봉인 후: analytics 점유분 SRS-051~053은 그대로 stage_correct/mastered_protection 유지, learning 작성분은 SRS-056~060으로 rename + interruption_resume / dormant_return / report_invalidates_attempt / same_session_repeat / weak_clear_threshold 5개 신규 카테고리 활성.

| 카테고리 (evaluator enum) | 개수 | ID 범위 | 의미 분류 |
|---|---:|---|---|
| stage_correct | 9 | 001, 002, 003, 006, 007, 008, 011, 051, 052 | stage 전이 정답 + lesson resume(051) + dormant 보존(052) |
| stage_incorrect | 6 | 009, 013, 015, 016, 019, 020 | stage 전이 오답 |
| same_cycle_double_wrong | 4 | 018, 021, 022, 024 | same-cycle 2연속 오답 (CC3-05) |
| mastered_reached | 4 | 005, 010, 023, 027 | stage 5 도달 + weak clear 동시(023) |
| mastered_protection | 5 | 014, 017, 025, 026, 053 | Mastered 단일 오답 보호 + mastered-loss-then-correct(053) |
| cycle_boundary | 5 | 028, 029, 030, 033, 034 | 04:00 경계 + DST + KST/Sydney |
| timezone | 2 | 031, 032 | 타임존 일반 (cycle_boundary 외) |
| multi_device | 4 | 037, 039, 040, 041 | clock skew / LWW / race |
| guest_merge | 3 | 035, 036, 038 | 게스트 → 가입 머지 |
| content_retire | 3 | 042, 043, 044 | retire / retire-mid-attempt / restore |
| i18n (W15 qa) | 3 | 045, 046, 047 | locale switch / RR 다국어 / KST vs UTC 04:00 |
| a11y (W15 qa) | 3 | 048, 049, 050 | VoiceOver/TalkBack announce / Dynamic Type 200% / 색약 |
| **interruption_resume (W15 learning)** | **1** | **056** | client_attempt_id 멱등성(409 응답) |
| **dormant_return (W15 learning)** | **1** | **057** | 14일 dormant 복귀 + weak 우선 노출 |
| **report_invalidates_attempt (W15 learning)** | **1** | **058** | audio_mismatch 신고 시 stage 강하 무효화 |
| **same_session_repeat (W15 learning)** | **1** | **059** | 단일 세션 동일 word 중복 노출 시 SRS 1회 갱신 |
| **weak_clear_threshold (W15 learning)** | **1** | **060** | weak=true → 1회 정답으로 즉시 clear 봉인 |
| daily_limit | 4 | 061, 062, 063, 064 (W15 rename: 047~050 → 061~064) | 무료 한도 |
| **합계** | **57** (analytics 22 + qa 6 + learning 5 + daily_limit 4 + W14 잔여 20) | | |

## W15 자율 결정 변경 사항 (qa agent, 2026-05-11 23:00 KST)

1. **i18n + a11y 카테고리 2개 신설** (`scripts/eval/srs.ts` SrsCase.category union 확장):
   - `"i18n"` — locale switch / RR 표기 / 사용자 로컬 04:00 reset
   - `"a11y"` — VoiceOver/TalkBack announce / Dynamic Type / 색약
2. **SRS-045~050 슬롯에 i18n 3건 + a11y 3건 박음** (호출자 직접 지시).
3. **기존 daily_limit SRS-047~050 → SRS-061~064로 rename**:
   - 신규 active fixtures: `SRS-061-daily-limit-free.yaml` / `SRS-062-daily-limit-review.yaml` / `SRS-063-daily-limit-premium-bypass.yaml` / `SRS-064-daily-limit-not-reached.yaml`
   - 기존 `SRS-047-daily-limit-free.yaml` 등 4개는 **deprecated stub**(id=`SRS-DEPRECATED-04X`, expected={})으로 변환. W16 commit에서 git rm 예정.
4. **analytics가 이미 박은 SRS-051/052/053은 stage_correct/mastered_protection 카테고리로 유지** (충돌 없음). learning readiness §4에서 권고된 `interruption-resume` / `dormant-14day-return` / `weak-clear-threshold` 의미가 analytics가 enum 흡수로 동일하게 반영됨.

## W15 Cycle A 통합 결정 (orchestrator, 2026-05-12 D-015 봉인)

- learning이 호출자 직접 지시로 작성한 SRS-051~055(단순 ID 파일)은 analytics가 점유한 SRS-051/052/053 (slug 형식 파일)과 logical ID 충돌. 두 시나리오 모두 **다른 의미** 보유 — analytics는 stage progression/dormant stage 보존/mastered-loss-then-correct, learning은 client_attempt_id 멱등성/14일 weak 우선/audio_mismatch 무효화.
- **D-015 결정**: analytics 점유 우선(dispatch plan v2 §2에서 SRS golden lead 책임). learning 작성분을 SRS-056~060으로 rename + 5개 신규 evaluator 카테고리(`interruption_resume`/`dormant_return`/`report_invalidates_attempt`/`same_session_repeat`/`weak_clear_threshold`) 활성화 필요.
- **다음 sprint 작업 큐**: backend가 `scripts/eval/srs.ts` SrsCase.category union에 5개 enum 추가 + 분기 함수(applySrs 호출 + 060 weak_clear는 정답 1회 시 weak=false 단언). W16 D1까지.

## i18n / a11y 카테고리 정책 (W15 신설)

- **Sentinel**: evaluator는 SRS state(stage/weak/count/due) 정확성만 단언. i18n string locale, a11y screen-reader 발화, color contrast 같은 시각/인터랙션 회귀는 별도 e2e (M4 entry P0 12 + P1 6 — `docs/qa/M4_E2E_SUITE_PLAN.md`) 책임.
- **이유**: golden runner는 순수 함수(`applySrs`)를 호출하므로 UI/locale-dependent 검증 불가. i18n/a11y는 디바이스 매트릭스 + 실측이 필요.
- **메타데이터 보존**: 각 fixture에 `i18n_assertions` / `a11y_assertions` 메타를 박아 M4 e2e 작성자가 fixture만 보고 e2e 시나리오를 도출 가능. `e2e_followup` 필드로 매핑 ID 명시.

## YAML 형식

```yaml
id: SRS-XXX
description: 한 줄 설명
category: <evaluator enum 13종 중 하나>
input:
  user_id: u-test-XXX (또는 device_install_id for guest)
  word_id: w-XXX
  current_state:
    stage: 1-5
    weak: bool
    correct_count: int
    incorrect_count: int
    last_attempt_at: ISO date or null
    last_attempt_correct: bool or null
    next_due_at: ISO date
    mastered_at: ISO date or null
  attempt:
    correct: bool
    occurred_at: ISO date
    timezone: IANA tz
expected:
  stage: 1-5
  weak: bool
  correct_count: int
  incorrect_count: int
  last_attempt_correct: bool
  mastered_at: ISO date or null (또는 "preserved")
  next_due_at_after_days: int (occurred_at 기준 + N day)

# i18n / a11y 카테고리 한정 메타 (sentinel — runner는 SRS state 단언만)
i18n_assertions: [...]    # i18n category
a11y_assertions: {...}    # a11y category
e2e_followup: M4 E2E-...
```

daily_limit category는 별도 스키마 (`scripts/eval/srs.ts` SrsCase 참조 — daily_usage_before / entitlement / http_status / paywall_required 등).

## 진행 현황

| Sprint | 누적 | 신규 ID |
|---|---:|---|
| W13 1차 | 7 | SRS-001/005/013/022/026/029/047(daily_limit, 후 rename → 061) |
| W14 1차 | 22 | + SRS-002/003/004/009/012/014/018/024/027/031/032/035/036/038/040/042/048-050(daily_limit, 후 rename → 062-064) |
| W15 보강 1차 | 25 | + SRS-006/021/033 |
| W15 보강 2차 (analytics) | 47 | + SRS-007/008/010/011/015/016/017/019/020/023/025/028/030/034/037/039/041/043/044/051/052/053 (22건) |
| **W15 보강 2차 (qa, i18n+a11y)** | **52** | + SRS-045/046/047 (i18n 3) + SRS-048/049/050 (a11y 3) + SRS-061/062/063/064 (daily_limit rename, +0 net but ID 슬롯 변경) |
| **W15 보강 3차 (learning, 056~060)** | **57** | learning 작성분을 SRS-056~060으로 rename(D-015). SRS-056 interruption-client-attempt-idempotent / SRS-057 dormant-14d-weak-priority / SRS-058 audio-mismatch-invalidate / SRS-059 same-session-repeat / SRS-060 weak-clear-one-correct. evaluator enum 5종 W16 D1까지 backend 활성화 작업 큐. |

W15 analytics 22건 분배 사유는 위 분포 표 비고 참조. qa 분담분(SRS-045~050)의 i18n+a11y 카테고리는 evaluator enum에 추가됨 (`scripts/eval/srs.ts` line 33-34).

## 이벤트 emit 단언 통합 (W15)

다음 케이스는 SRS transition 단언 외에 `docs/12_event_taxonomy.md` Mastered/Weak emit spec 준수도 함께 검증:

| ID | emit 단언 |
|---|---|
| SRS-023 | srs_mastered_reached (weak=true → false + stage 4→5 동시) |
| SRS-025 | srs_mastered_lost (stage 5 → 4 cross-cycle 강하) |
| SRS-041 | srs_weak_flagged (same-cycle 2연속 오답, reason=same_cycle_double_wrong) |
| SRS-053 | srs_mastered_reached (재진입; analytics mastered-loss-then-correct) |
| SRS-060 | srs_weak_cleared (weak=true → false, 1회 정답; W16 backend enum 활성화 후) |

emit 단언 자체는 evaluator가 아닌 frontend vitest mock 측에서 수행 (logEvent spy + properties shape 검증). evaluator는 transition만 검증.

## evaluator enum 확장 기록 (W15)

`scripts/eval/srs.ts` SrsCase.category union에 다음 7개 추가:
- `"i18n"` — locale switch / RR 표기 / 사용자 로컬 04:00 (W15 qa 완료)
- `"a11y"` — VoiceOver/TalkBack announce / Dynamic Type / 색약 (W15 qa 완료)
- `"interruption_resume"` — lesson_abandoned + client_attempt_id 멱등성 (W16 backend 활성화 큐)
- `"dormant_return"` — N일 무활동 후 복귀 + weak 우선 노출 (W16 backend 활성화 큐)
- `"report_invalidates_attempt"` — content_report 시 SRS 강하 무효화 (W16 backend 활성화 큐)
- `"same_session_repeat"` — 단일 세션 동일 word 중복 attempt 시 SRS 1회 갱신 (W16 backend 활성화 큐)
- `"weak_clear_threshold"` — weak=true → 1회 정답으로 즉시 clear (W16 backend 활성화 큐)

i18n/a11y는 evaluator 분기 일반 `applySrs` 사용. 056~060 5개 카테고리는 W16 D1까지 backend가 분기 함수 작성 (현재는 fixture만 봉인, evaluator strict는 W16 후).
