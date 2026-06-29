# M3 W15 — PRD §8 baseline 임계값 + M4 entry 갱신

- **Agent**: planner
- **Date**: 2026-05-11 23:00
- **Cycle**: M3 W15
- **Branch / Worktree**: planner
- **Commit SHA**: pending

---

## 1. 작업 목표

1. PRD §8 baseline 4지표 (D-3 retention / Day-1 streak 유지율 / lesson_complete_rate / paywall_view_to_purchase) 임계값 자율 결정
2. M4 entry 진입 전 PRD/USER_JOURNEYS 갱신 — J-007 RC alias 삭제 흐름, paywall source enum, Privacy Manifest 정합성 체크리스트, J-004 W15-W16 추가 검증 표기
3. M5 베타 모집 funnel outline은 deferred — 1줄 stub만 작성

## 2. 왜 필요한 변경이었는가

- W15 baseline 14d 수집 시작 직전. 임계값이 PRD에 없으면 W16 게이트 시점에 pass/fail 판정 불가 (R-25 회피)
- F-010 (계정 삭제) 구현이 M4 W15에 시작 → J-007 흐름이 RC alias 삭제까지 명시되어야 backend가 구현 가능
- Privacy Manifest는 iOS submission 차단 항목 → M4 종료 = M5 진입 게이트
- paywall_view_to_purchase 측정은 source enum 고정이 선결조건

## 3. 변경된 파일

- `docs/product/PRD.md` — §8.1 KPI 카탈로그 확장(D-3, Day-1 streak, lesson_complete_rate, paywall_view_to_purchase 추가) / §8.2 baseline 4지표 임계값 + relative 전환 조건 / §8.3 paywall source enum + step funnel / §8.4 Privacy Manifest 정합성 체크리스트 / 변경 이력
- `docs/product/USER_JOURNEYS.md` — J-007 RC alias 삭제 7단계 + 분기표 / J-004 W14 evaluator 미포함 → W15-W16 analytics+backend 채널 추가 검증 표기 / 변경 이력
- `docs/product/M5_BETA_OUTLINE.md` — 1줄 stub (deferred)
- `context/agents/planner/20260511-2300-feat-m3-w15-prd-thresholds.md` (본 파일)

## 4. 실행 명령어

N/A (문서 작업)

## 5. 테스트 결과

N/A (검토/명세 산출물). 다음 검증 채널:
- analytics: §8.2 임계값을 baseline aggregation queries에 SLO 기준으로 반영
- learning: `LESSON_COMPLETE_RATE_THRESHOLDS.md`와 75/60% 기준 cross-check
- privacy/security: §8.4 Privacy Manifest 체크리스트를 M4 W15 진입 시 evaluator로 사용

## 6. 사용한 Skill

- humanizer (built-in) — 자연스러움
- theme-factory — 임계값 표/funnel 구조화
- root-cause-tracing — 임계값 결정 시 industry benchmark 추적

## 7. 내린 결정

### 7.1 baseline 4지표 임계값 (자율 결정)

| Metric | Target | Minimum | 근거 |
|---|---|---|---|
| D-3 retention | 35% | 25% | Sensor Tower 2024 학습앱 median |
| Day-1 streak 유지율 | 60% | 45% | Duolingo 1년차 70% 기준 첫 출시 보정 −10%p |
| lesson_complete_rate | 75% | 60% | learning agent LESSON_COMPLETE_RATE_THRESHOLDS.md |
| paywall_view_to_purchase | 4% | 2% | B2C SaaS subscription median 3–5% |

- Pass / Conditional Pass / Fail 3단계 정의
- W16 14d 수집 (N≥200 event 또는 N≥50 user) 후 relative (mean−1.5σ) 전환 가능, ADR 등록 필요

### 7.2 paywall source enum 고정

- `organic` / `onboarding` / `limit_hit` 3종
- step funnel 5단계: paywall_viewed → signin_required → signin_completed → iap_sheet_opened → purchase_succeeded
- 향후 `limit_hit`은 `free_limit_reached` `premium_pack_locked`로 분리 가능 (analytics 합의 시)

### 7.3 J-007 RC alias 삭제 흐름

- 7단계 명세 (DSR export → RC alias unbind → RC subscriber DELETE → Supabase soft-delete → user_word_states hard-delete → 30d cron → audit_log)
- RC API 분기 3종 (not found / 5xx / 활성 구독)
- 30d SLA exception 시 on-call alert + 사용자 메일

### 7.4 Privacy Manifest 정합성 체크리스트

- 5개 점검 항목 (CollectedDataTypes / AccessedAPITypes / Tracking / TrackingDomains / 3rd-party SDK manifests)
- 미통과 시 iOS submission 차단 → M5 진입 보류

### 7.5 J-004 W15-W16 추가 검증 채널

- W14 evaluator 4종 미포함 → analytics(`guest_merge_*` 이벤트) + backend(`audit_log.action='guest_merge'`) 두 채널로 추적
- 머지 evaluator 신설 여부는 M4 진입 ADR로 결정

### 7.6 M5 베타 outline (deferred)

- 사용자 결정으로 deferred. `M5_BETA_OUTLINE.md` 1줄 stub만 생성

## 8. 리스크 / 후속 작업

- R-25 (임계값 부재) 해소
- 후속:
  - analytics agent — §8.2 임계값을 baseline aggregation queries SLO에 반영
  - learning agent — LESSON_COMPLETE_RATE_THRESHOLDS.md cross-check 후 PRD 인용 핀 confirm
  - W16 baseline 회수 후 relative 전환 ADR (planner + analytics + pm)
  - M4 W15 진입 시 Privacy Manifest 체크리스트 1회 evaluator 실행 (security agent)

## 9. 의존성 / blocker

- analytics 의존: baseline aggregation queries 작성 진행 중. 임계값은 본 commit으로 unblock
- learning 의존: LESSON_COMPLETE_RATE_THRESHOLDS.md 작성 중. 75/60% 기준은 본 commit이 SoT
- security 의존 (M4): Privacy Manifest 체크리스트 evaluator 구현 (W15 후반)

## 10. 다음 추천 액션

1. analytics: §8.2 임계값을 SLO 기준으로 dashboard에 반영
2. backend: J-007 RC alias 삭제 7단계를 F-010 acceptance criteria에 매핑
3. security: §8.4 체크리스트를 M4 W15 evaluator로 구현
4. planner: W16 baseline 회수 후 relative 전환 ADR 기안

## 11. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-11 | M3 W15 PRD §8 baseline 임계값 + M4 entry 갱신 (J-007/paywall enum/Privacy Manifest/J-004 추가검증) + M5 stub | planner |
