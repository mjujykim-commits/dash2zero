# M3 W15 — Planner Readiness 자가진단 (12항목)

- **Agent**: planner (시니어 서비스/제품 기획자)
- **Date**: 2026-05-11
- **Cycle**: M3 W15 진입 직전 (W14 게이트 통과)
- **Branch / Worktree**: planner (single-tree, M2부터 worktree 분기 예정)
- **Commit SHA**: pending — context 기록 only

---

## 1. 작업 목표

M3 W15 진입 전 planner 자가진단:
1. baseline 4개 지표(D-3 retention / D-1 streak 유지율 / lesson_complete_rate / paywall_view_to_purchase)의 PRD §8 Success Criteria 정합성 평가 — 임계값(target / minimum acceptable) 정의 갭 탐지
2. M5(Beta Handoff, W17–W18) 사전 준비 항목 중 W15–W16 동안 시작 가능한 것 top 3
3. M4(Security+QA) 진입 전 PRD/USER_JOURNEYS 갱신 후보 식별

## 2. 왜 필요한 변경이었는가

- W15에 baseline metrics 14d 수집이 시작된다. 임계값이 PRD에 없으면 W16 게이트 검증 시점에 "이 숫자가 통과인지" 판정 불가능
- M5 베타 모집은 R-07(베타 30명 모집 실패)의 lead time을 가진다. W17 시작 후 모집을 시작하면 채워지기 전에 베타 종료
- M4 진입 시 보안/QA 산출물(adversarial / RLS / 계정 삭제 / Privacy Manifest)이 PRD §12 보류 항목과 USER_JOURNEYS J-007 흐름을 갱신해야 함

## 3. 변경된 파일

- `context/agents/planner/20260511-2200-chore-m3-w15-readiness.md` (본 파일)
- `docs/REVIEW_QA.md` 기획자 섹션에 P0/P1 질문 등록 예정 (다음 commit)

## 4. 실행 명령어

N/A (문서 검토)

## 5. 테스트 결과

N/A (검토 산출물)

## 6. 사용한 Skill

- humanizer (built-in 다듬기) — 자연스러움
- theme-factory — 표/우선순위 구조화
- root-cause-tracing — Success Criteria 갭이 어디서 발생했는지 추적

## 7. 내린 결정 (자가진단 12항목 — 핵심)

### 7.1 baseline 4개 지표 PRD 정합성 (4지표 × 정합성 매트릭스)

| Metric | PRD §8 KPI에 명시 | Target 정의 | Minimum acceptable | Source 정의 | 갭 |
|---|---|---|---|---|---|
| D-3 retention | 부분 (D1/D7만 명시, D3 없음) | 없음 | 없음 | BASELINE_METRICS.md만 정의 | **P0 갭** |
| Day-1 streak 유지율 | 7/14/30일 streak retention만 명시 | 없음 | 없음 | BASELINE_METRICS.md만 정의 | **P0 갭** |
| lesson_complete_rate | First lesson completion rate만 명시 (전체 lesson rate ≠ first lesson) | first lesson 60% (USER_JOURNEYS §2.2) | 없음 | PRD §8 + USER_JOURNEYS | **P1 갭** (정의 분리 필요) |
| paywall_view_to_purchase | "Free → Paid conversion" + "Paywall view → purchase 전환율 (source별)"로 존재 | 없음 | 없음 | PRD §8 | **P0 갭** |

**핵심 발견**: 4개 지표 모두 "측정한다"는 명시는 있으나 **숫자 임계값이 PRD에 없다**. W16 게이트는 baseline 평균 + std 기록만 가능하고 pass/fail 판정 불가.

### 7.2 M5 사전 준비 — W15–W16 동안 시작 가능한 항목 top 3

1. **베타 모집 funnel 사전 설계** (W15 — planner + designer + legal)
   - Reddit r/Korean / Discord K-pop 학습 community / 지인 채널 3종 카피 작성
   - 모집 페이지(랜딩 또는 Notion) 시안 + privacy 고지 + 베타 약관 1차 draft
   - 30명 채우기 lead time(R-07): 평균 4–6주 → W15 시작이 W18 모집 마감의 마지노선
2. **TestFlight / Internal Testing 등록 흐름 dry-run** (W16 — devops + planner)
   - Apple Sign In 키, Bundle ID, Internal Testing 그룹 30 slot 사전 확보
   - Internal vs External tester 경로 결정 (External은 Apple 심사 필요 — 추가 lead time)
3. **베타 onboarding/runbook 5종의 outline** (W16 — planner + qa + security)
   - 장애 / 환불 / 콘텐츠 신고 / 계정 삭제 / 심사 대응 — outline만 W16, body는 W17

### 7.3 M4 진입 전 PRD/USER_JOURNEYS 갱신 후보

| 후보 | 위치 | 사유 |
|---|---|---|
| Success Criteria 임계값 4개 추가 | PRD §8 | baseline 14d 회수 시점에 pass/fail 기준 필요 |
| J-007 (계정 삭제) 흐름에 RC alias 삭제 + soft-delete + 30d hard-delete cron 단계 명시 | USER_JOURNEYS §7.2 | M4 W15에 F-010 구현. 흐름 빈틈 없이 닫혀야 함 |
| F-010 acceptance criteria에 audit_log 필드 + 30d SLA exception 시나리오 추가 | PRD §5 (또는 06_feature_spec) | DSR-EXPORT 30d SLA가 privacy evaluator로 검증되나 사용자에게 노출되는 메시지 미정의 |
| Privacy Manifest 항목과 PRD §12 보류 항목 정합 (iOS submission 차단 항목) | PRD §12 | M4 종료 = M5 진입 게이트 |
| paywall source 분류 enum 명시 (free_limit_reached / premium_pack_locked / settings_upgrade) | USER_JOURNEYS §4.2 | paywall_view_to_purchase를 source 단위로 비교하려면 enum 고정 |

## 8. 리스크 / 후속 작업

- **R-25 신규 후보**: 임계값 정의 없이 baseline 수집 시작 → W16에 "데이터 있는데 판정 불가" 상황 발생 가능. W15 1주차에 임계값을 PRD §8에 박아야 함.
- **R-07 격상 검토**: 베타 모집 lead time 4–6주 가정 시 W15 시작이 사실상 마지노선. 1주 늦어지면 W18 베타 30명 채우기 실패 확률 증가.
- 후속: REVIEW_QA.md 기획자 섹션에 P0 4건 / P1 3건 등록

## 9. 의존성 / blocker

- **PM 의존**: Success Criteria 임계값 결정 — pm + analytics + planner 합의 필요. analytics는 baseline 측정 입력자, pm은 게이트 판정자, planner는 PRD SoT.
- **Designer 의존**: 베타 모집 랜딩 시안. W15 안에 designer agent 활성화 트리거 필요.
- **Legal 의존**: 베타 약관 / Privacy Manifest 일정. legal은 W14(D-42) 활성화 트리거 — 이미 활성.
- **Architect 비의존**: M4 RLS 정책 ADR-0004는 architect 산출물이지만 PRD 갱신과 독립.

## 10. 다음 추천 액션

1. **planner**: REVIEW_QA.md에 P0 4건(Success Criteria 임계값 4개) + P1 3건(M5 사전 준비 항목) 등록
2. **pm + analytics**: W15 1주차 Success Criteria 임계값 결정 회의 — baseline target / minimum acceptable
3. **planner + designer**: 베타 모집 랜딩/카피 outline (W15–W16)
4. **planner**: M4 진입 commit과 함께 PRD §8 / USER_JOURNEYS J-007 / paywall source enum 갱신

## 11. 12항목 자가진단 체크 (W15 readiness)

| # | 항목 | 상태 |
|---|---|---|
| 1 | M3 W14 산출물(28파일) 모두 검토했는가 | ✅ rollup 정독 완료 |
| 2 | baseline 4지표가 PRD §8 Success Criteria와 1:1 매핑되는가 | ❌ D-3 / streak 유지율 / paywall_view_to_purchase 임계값 없음 |
| 3 | baseline 임계값 결정 책임자(answerer)가 명확한가 | ⚠️ pm + analytics + planner 합의 필요 — 미할당 |
| 4 | M4 진입 전 갱신해야 할 PRD/USER_JOURNEYS 후보가 식별되었는가 | ✅ 5개 후보 식별 |
| 5 | M5 사전 준비 가능 항목 top 3가 식별되었는가 | ✅ 베타 모집 / TestFlight dry-run / runbook outline |
| 6 | 베타 모집 lead time 리스크(R-07)가 갱신되었는가 | ⚠️ 격상 권고 — W15 시작이 마지노선 |
| 7 | C-13 사업자 D-42 데드라인 상태 확인했는가 | ⚠️ W14 종료 = D-42. 본 진단 시점 별도 확인 필요 (legal에 의존) |
| 8 | RLS evaluator 도입(W15)이 J-005/J-007 흐름 검증과 정합한가 | ✅ J-007 계정 삭제 + audit_log 흐름 검증 가능 |
| 9 | content evaluator(W14) 갱신이 J-006 콘텐츠 신고 흐름을 cover하는가 | ✅ retire 2 case + report 1 case |
| 10 | 게스트→가입 머지(J-004)는 W14 evaluator에 포함되었는가 | ❌ Payment/Privacy/Content/SRS 4종에는 머지 evaluator 없음 — W15-W16 추가 검토 |
| 11 | M3 종료 게이트 항목(MVP_SCOPE §7.2)을 본 진단이 갱신하는가 | ⚠️ "regression 0" 항목은 임계값 정의 후 가능 — pending |
| 12 | 본 진단을 REVIEW_QA + DECISION_LOG로 propagate할 계획이 있는가 | ✅ 다음 commit에 propagate |

## 12. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-11 | M3 W15 readiness 자가진단 12항목 작성 | planner |
