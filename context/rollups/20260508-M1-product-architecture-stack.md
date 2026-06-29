# Rollup — M1 Product + Architecture + Stack 종료

> 작성: orchestrator
> 사이클: M1 (5 사이클 = c1 planner + c2 architect/pm + c3 architect/orchestrator + c4 designer + c5 게이트)
> 상태: **완료, M2 진입 서명**

---

## 1. M1 산출물 체크리스트

| # | 산출물 | 위치 | 작성자 | 사이클 |
|---|---|---|---|---|
| 1 | PRD | `docs/product/PRD.md` (~210줄) | planner | c1 |
| 2 | ASSUMPTIONS 보강 | `docs/product/ASSUMPTIONS.md` (+30줄) | planner | c1 |
| 3 | User Journeys | `docs/product/USER_JOURNEYS.md` (~260줄) | planner | c1 |
| 4 | MVP Scope | `docs/product/MVP_SCOPE.md` (~240줄) | pm | c2 |
| 5 | Non-Goals | MVP_SCOPE §2.3 | pm | c2 |
| 6 | Domain Model | `docs/architecture/DOMAIN_MODEL.md` (~290줄) | architect | c2 |
| 7 | Stack Options Matrix | `docs/architecture/STACK_OPTIONS_MATRIX.md` (~280줄) | architect | c2 |
| 8 | Stack Decision | `docs/architecture/STACK_DECISION.md` (~150줄) | architect | c3 |
| 9 | Stack Evolution Plan | `docs/architecture/STACK_EVOLUTION_PLAN.md` (~210줄) | architect | c3 |
| 10 | ADR-0001 (Accepted) | `docs/adr/ADR-0001-stack-decision.md` (~120줄) | architect → orchestrator | c3 |
| 11 | Harness Maturity Roadmap | `docs/harness/HARNESS_MATURITY_ROADMAP.md` (~200줄) | planner | M0 보강 |
| 12 | Harness Execution Board | `docs/harness/HARNESS_EXECUTION_BOARD.md` (~220줄) | pm | M0 보강 |
| 13 | Harness Layered Architecture | `docs/architecture/HARNESS_LAYERED_ARCHITECTURE.md` (~280줄) | architect | M0 보강 |
| 14 | Design Direction | `docs/brand/DESIGN_DIRECTION.md` (~280줄) | designer | c4 |
| 15 | Theme Decisions | `docs/brand/THEME_DECISIONS.md` (~280줄) | designer | c4 |
| (보너스) | Evaluation Scenarios | `docs/harness/EVALUATION_SCENARIOS.md` (~280줄) | analytics | M0 보강 (D-006) |

→ **15/15 + 보너스 1 = 16개 모두 작성**.

총 약 3,470줄의 M1 산출물.

---

## 2. DoD 7항목 검증

| DoD | M1 충족 여부 |
|---|---|
| 1. 코드 / 산출물 존재 | ✅ 16 문서 |
| 2. 테스트 존재 | M1은 문서 단계, 테스트는 M2부터. ASSUMPTIONS A-501~605 검증 정의는 M3-M5 |
| 3. 문서 존재 | ✅ 모든 산출물이 문서 |
| 4. Context 기록 존재 | ✅ planner 2 + architect 2 + pm 1 + designer 1 + orchestrator 1 = 7개 |
| 5. 필요한 harness/tracing | M1은 정의 단계, 가동은 M2-M3 |
| 6. 보안 영향 검토 | ADR-0001은 secret 없음. RLS는 ADR-0004 (M2-S2 전) |
| 7. Orchestrator 승인 | ADR-0001 D-007 ✅, M1 게이트 본 rollup으로 서명 |

→ M1 단계 적합한 DoD 모두 충족.

---

## 3. Skill 사용 점검 (강제 의무 §A)

| Agent | 강제 Skill | M1 사용 |
|---|---|---|
| planner (c1) | humanizer · theme-factory · frontend-design · taste-skill | ✅ 4/4 |
| architect (c2, c3) | software-architecture · prompt-engineering · mcp-builder | ✅ 3/3 (mcp-builder 적절히 보류) |
| pm (c2) | humanizer · theme-factory · frontend-design · taste-skill | ✅ 4/4 |
| designer (c4) | theme-factory · frontend-design · canvas-design · brand-guidelines | ✅ 4/4 |
| analytics (M0 보강) | prompt-engineering · root-cause-tracing | ✅ 2/2 |
| orchestrator (점검) | (Skill 사용 점검 자체) | ✅ |

**휴머나이저 사용 정책 준수**: 모든 사용 사례에서 `humanizer (built-in)` 명시 + purpose 기재 (자연스러운 다듬기). AI 사용 은폐 / 탐지 회피 목적 사용 0건.

---

## 4. Context 기록 점검 (강제 의무 §B)

| Agent | 파일 | 12항목 |
|---|---|---|
| planner (c1) | `20260507-2200-feat-m1-prd-journeys.md` | ✅ |
| architect (c2) | `20260507-2300-feat-m1-domain-stack.md` | ✅ |
| pm (c2) | `20260507-2310-feat-m1-mvp-scope.md` | ✅ |
| architect (c3) | `20260508-0010-feat-m1-stack-decision.md` | ✅ |
| orchestrator (c3) | `20260508-0020-feat-m1-c3-approval.md` | ✅ |
| designer (c4) | `20260508-0100-feat-m1-design.md` | ✅ |
| orchestrator (c5, 본 rollup) | (rollup이 context 역할) | ✅ |

→ 7개 context 기록, 12항목 모두 충족.

---

## 5. 결정 로그 갱신 (강제 의무 §C)

M1 동안 추가된 결정:

- **D-006**: analytics agent 사전 활동 시작 (M0 보강)
- **D-007**: ADR-0001 Accepted, 후보 A 봉인 (M1 c3)

총 누적 결정: D-001 ~ D-007 (7건) + 기획 단계 CC2 25 + CC3 8 + B 12 + 사업계획서 C-01~C-20 (20).

ADR 인덱스 (M1 종료 시점):
- **ADR-0001 Accepted** (Stack Decision)
- ADR-0002 pending (M2 진입 전 — Domain Model 추상화 범위)
- ADR-0003 pending (M3 — Harness 도구)
- ADR-0004 pending (M2-S2 전 — RLS 매트릭스)
- ADR-0005 pending (M2-S2 W6 — TTS provider)

---

## 6. M1 핵심 결정 요약 (M2 entry 입력)

### 6.1 제품
- **약속 5개**: 3분 lesson / 정확한 SRS 간격 / 즉시 결제·환불 / 13세 미만 차단 / content version 보존
- **MVP 기능 P0 15개**: F-001~F-015
- **Premium 가치**: 무료 60단어 / 일일 3 / 복습 20 ↔ Premium 전체 / 일일 15 / 무제한
- **20주 일정**: M0 ✅ → M1 ✅ → M2(W5-12) → M3(W13-14) → M4(W15-16) → M5(W17-18) → buffer(W19-20)

### 6.2 기술
- **Stack**: RN+Expo+TS / Supabase / RevenueCat / Firebase / EAS (후보 A 봉인)
- **TTS**: M2-S2 W6에 결정
- **Tracing**: M3 후반에 Langfuse cloud 검토
- **Domain Model**: 15 엔티티 + 9 경계면 추상화

### 6.3 디자인
- **톤**: Quiet · Honest · Spacious · Steady · Respectful
- **신뢰감**: 개인형 도구 + 운영형 신뢰
- **시각 위계**: 한글(44px) > 영어/RR(보조) > 예문(펼침)
- **토큰 카테고리**: Color (Light + Dark) / Type (한영 1:0.92) / Spacing (8pt) / Component / Motion / Icon

### 6.4 하네스
- **5단계 성숙도**: bootstrap (M0) → alpha (M2) → beta (M3) → production (M5) → enterprise (post-MVP)
- **3 workstream**: regression / observability / structured output
- **5 layer**: Contract / Policy / Retrieval / Evaluation / Observability
- **87 golden case**: SRS 50 + 결제 15 + privacy 11 + content 11

---

## 7. 미해결 / Outstanding Gates

M1 종료 시점에도 닫히지 않은 게이트 (M2~M5 진행 중 처리).

| 게이트 | 데드라인 | 차단 범위 |
|---|---|---|
| **C-13 사업자/결제 수령 주체** | D-42 (베타 4주 전 = W14 종료) | paid release만 차단 (M2-M4 개발 무관) |
| **법무/세무 검토** | 출시 직전 (W17~) | store submission |
| **Privacy Manifest** | iOS submission 전 | iOS build upload |
| **ADR-0002 Domain Model 추상화** | M2 진입 전 (즉시) | M2-S2 packages/contracts |
| **ADR-0004 RLS 매트릭스** | M2-S2 전 | M2-S2 backend RLS |
| **ADR-0005 TTS provider** | M2-S2 W6 | 콘텐츠 첫 batch |

→ M2 진입 차단 항목 없음. ADR-0002는 M2 첫 작업으로 작성.

---

## 8. Risks (M1 종료 시점, MVP_SCOPE §6에서 갱신)

매주 sprint 회고에서 갱신.

| ID | 리스크 | 현재 상태 |
|---|---|---|
| R-01 | 콘텐츠 검수자 모집 | open — W4 안에 후보 2명 |
| R-02 | C-13 미확정 | open — W3에 신고 시작 권고 |
| R-03 | 결제 통합 지연 | open — W10에 시작 |
| R-04 | 심사 반려 | open — M4 모의 체크리스트 |
| R-05 | TTS 라이선스 | open — M2-S2 ADR-0005 |
| R-06 | 1인 가용시간 | open — buffer 4주 활용 |
| R-07 | 베타 모집 | open — W17 시작 |
| R-08 | Supabase 변경 | open — Reversal Trigger 모니터링 |

---

## 9. M2 진입 권고 (W5 시작)

### 9.1 M2 Thin Vertical Slice 목표

**1개 핵심 시나리오 (J-001 신규 사용자 첫 학습) E2E 동작.** 12 step (Welcome → Age gate → Privacy → Onboarding → Home → Lesson 4단계 × 3단어 → Lesson Complete) — 3분 안에 완주.

### 9.2 M2 Sprint 분해 (W5-W12)

```
W5  M2-S1: Project scaffold + ADR-0002/0004 + 환경 분리 + CI 골격
W6  M2-S2: First-run (age gate → privacy → onboarding) + Word/UserWordState 기본 + ADR-0005 (TTS)
W7  M2-S3: 단어 카드 4단계 + 객관식 퀴즈 + 일일 한도
W8  M2-S4: 음성 재생 + Streak/Mastered 표시
W9  M2-S5: 콘텐츠 manifest 원격 업데이트 + 게스트→가입 머지 + 가입 흐름 (1차)
W10-W11 M2-S6: RevenueCat 통합 + paywall + 콘텐츠 신고 + 운영 어드민 1차
W12 M2-S7: E2E 1개 시나리오 완주 + Push 알림 → M2 게이트
```

### 9.3 M2-S1 (W5) 첫 sprint 작업 큐

orchestrator가 M2 시작 시 즉시 부여할 작업:

| 작업 | 책임 | 산출물 |
|---|---|---|
| ADR-0002 Domain Model 추상화 범위 | architect | `docs/adr/ADR-0002-domain-model-abstractions.md` |
| ADR-0004 RLS 정책 매트릭스 | backend + security | `docs/adr/ADR-0004-rls-policies.md` |
| Worktree 13개 활성화 | orchestrator | `worktrees/{role}/` 13개 |
| `apps/mobile/` Expo scaffold | frontend | RN + Expo Router + TypeScript |
| `apps/api/` Supabase Edge Functions scaffold | backend | Edge Functions + RLS migration 0001 |
| `packages/contracts/` 패키지 골격 | architect | zod 스키마 base + DOMAIN_MODEL §6 구조 |
| `packages/design-tokens/` 패키지 | designer | THEME_DECISIONS 토큰 export |
| `infra/supabase/` migrations + seeds | backend | 0001 schema + 0002 RLS |
| `infra/eas/` eas.json + 환경 (dev/staging/prod) | devops (활성화) | 환경별 번들 ID |
| GitHub Actions CI 골격 | devops + qa | PR check + lint + type + test |

→ **devops Specialist 활성화 권고 (W5)**. learning Specialist는 W5에 콘텐츠 batch B-1 (Starter Pack 60) 작업 시작.

### 9.4 Worktree 활성화 명령 (M2 진입 시)

```bash
# (예시 — 실제 git 명령은 M2-S1에서)
for role in orchestrator planner pm designer architect frontend backend security qa learning analytics legal devops; do
  git worktree add ../worktrees/$role chore/m2-bootstrap-$role
done
```

`docs/PROJECT_MAP.md`에 M2 진입 시 갱신.

### 9.5 Specialist 활성 트리거 (재명시)

| Agent | 활성 시점 | 산출물 |
|---|---|---|
| learning | **W5 (M2-S1)** | B-1 Starter Pack 60단어 검수 + SRS 정확성 자문 |
| devops | **W5 (M2-S1)** | EAS 환경 분리 + GitHub Actions + 모니터링 alert |
| analytics | W12 (M3 진입 1주 전) | golden 87 yaml 작성 + evaluation runner 설계 |
| legal | W14 (D-42, C-13 확정 deadline) | 약관/처리방침/결제 정책 영문 final |

---

## 10. Orchestrator 서명

### 10.1 M1 게이트 결정

- **M1 게이트 통과**: ✅
- **서명일**: 2026-05-08
- **검증**: 산출물 16/16 + DoD 7/7 + Skill 6/6 agent + Context 7/7 + ADR-0001 Accepted

### 10.2 M2 진입 결정

- **M2 진입 차단 항목**: **없음**
- **즉시 진입 가능**: M2-S1 (W5)
- **Specialist 활성화**: learning, devops 즉시 활성화 권고
- **Worktree**: M2-S1 첫 작업으로 활성화

### 10.3 Handoff Note (다음 사이클 / 새 팀이 받을 때)

이 저장소를 받은 사람은 다음 순서로 진입:

1. `AGENTS.md` 헌장 ✅
2. `docs/HANDOFF.md` 마일스톤 상태 (M0 ✅ M1 ✅ M2 ready)
3. 본 rollup (`context/rollups/20260508-M1-product-architecture-stack.md`)
4. `docs/DECISION_LOG.md` D-001 ~ D-007 + ADR-0001 Accepted
5. `docs/product/PRD.md` (제품 약속)
6. `docs/architecture/STACK_DECISION.md` + ADR-0001 (기술 결정)
7. `docs/product/MVP_SCOPE.md` (20주 sprint 분해)
8. `docs/brand/DESIGN_DIRECTION.md` + `THEME_DECISIONS.md` (디자인 토큰)
9. 본인 영역 v0.3 기획서 + 본인 페르소나 (`.claude/agents/{role}.md`)
10. M2-S1 (W5) 첫 sprint 시작

---

## 11. 다음 액션 (M2 자율 진행)

본 rollup 서명 직후 M2-S1 작업 큐 (§9.3) 시작. orchestrator는 M2-S1 첫 작업으로 **ADR-0002 (Domain Model 추상화 범위)** 작성을 architect에게 부여한다. 이후 ADR-0004, scaffold, CI 순차 진행.
