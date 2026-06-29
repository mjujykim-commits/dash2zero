# dash2zero — Harness Maturity Roadmap

> 작성: planner agent (2026-05-07, M0 보강)
> 책임: 측정 철학 + 단계별 성숙도 정의 + 어느 시점에 어떤 하네스가 필요한지
> 협업: pm (HARNESS_EXECUTION_BOARD), architect (HARNESS_LAYERED_ARCHITECTURE), analytics (EVALUATION_SCENARIOS)
> Skill 사용: humanizer (built-in 다듬기) · theme-factory (구조화) · frontend-design (표 가독성) · taste-skill (의사결정 톤)

---

## 1. 측정 철학

### 1.1 한 줄 정의

> **하네스는 "이게 정말 동작하는가"를 사람이 매번 클릭하지 않아도 자동으로 답하게 만드는 시스템이다.**

dash2zero에서 "동작"은 다음을 의미한다:

- 영어권 초보자가 첫 학습 세션을 3분 안에 끝낸다
- 단어를 학습한 사용자는 정해진 간격에 정확한 단어를 다시 만난다
- 결제한 사용자는 즉시 Premium을 사용할 수 있고, 환불받은 사용자는 즉시 Free로 돌아간다
- 13세 미만 사용자는 분석/학습/결제 어디에도 데이터를 남기지 않는다
- 단어 콘텐츠가 바뀌어도 사용자의 학습 진도는 깨지지 않는다

각 항목은 사람이 매번 검증할 수 없다. 따라서 측정 자동화는 옵션이 아니라 필수다.

### 1.2 "멋진 데모" vs "신뢰 가능한 제품"

| 기준 | 멋진 데모 | 신뢰 가능한 제품 |
|---|---|---|
| 1회 플로우 | 통과 | 통과 |
| 100회 반복 | 검증 안 됨 | regression 0 |
| 시간 경과 | 알 수 없음 | day-N 학습 상태 검증 |
| 결제 환불 | 미지원 | 환불 후 entitlement 회수 + 학습 보존 |
| 다른 디바이스 | 무관심 | 머지 충돌 없이 동기화 |
| 공격적 입력 | 깨짐 | 거부 + audit_log + alert |
| 13세 미만 | 통과 가능 | 차단 + 데이터 미수집 |
| EU 사용자 | 무관심 | territory 차단 또는 GDPR 준수 |

**dash2zero의 baseline은 "신뢰 가능한 제품"이지 "멋진 데모"가 아니다**. 멋진 데모만 만들면 출시 후 환불/리뷰/규제 리스크가 폭증한다.

### 1.3 1인 개발자 제약

20주 일정(CC2-14)과 주 20시간 가용(A-101)을 고려해 하네스도 단계적으로 도입한다. 한 번에 모든 트레이스/평가를 켜면 작업이 멈춘다. 따라서:

- **각 단계에 명확한 도입 항목**을 둔다
- **이전 단계가 닫히지 않으면 다음 단계로 넘어가지 않는다**
- **도구 선택은 가벼운 옵션부터 → 트래픽/요구가 도달하면 교체**

---

## 2. 5단계 성숙도 (Bootstrap → Enterprise)

### 2.1 단계 정의

| 단계 | 마일스톤 | 측정 목표 | 특징 |
|---|---|---|---|
| **bootstrap** | M0 | "팀이 일관되게 일하고 있는가" | 도구 없음, 사람 기반 추적 |
| **alpha** | M2 | "1개 시나리오가 실제로 동작하는가" | 최소 trace + 크래시 리포트 |
| **beta** | M3 | "100회 돌렸을 때 회귀가 없는가" | golden case + evaluation runner + (선택) Langfuse |
| **production** | M5 | "출시 후 사용자 행동을 관찰 가능한가" | dashboard + alerting + 결제 funnel |
| **enterprise** | post-MVP | "감사/B2B 요구를 만족하는가" | self-host trace + audit retention 강화 + 데이터 거주자 분리 |

### 2.2 단계별 도입 항목

#### Bootstrap (M0 — 현재)

도구 없음. 다음만으로 충분:

- `context/agents/{role}/` — 모든 작업 12항목 기록
- `context/SWARM_LEDGER.md` — 일일 활동
- `context/rollups/` — 사이클 종료 요약
- `docs/DECISION_LOG.md` — 결정 누적
- 페어 사이클 리뷰 (orchestrator)

**도입하지 않는 것**: trace 도구, evaluation runner, dashboard, alerting

**졸업 조건 (→ alpha)**: M2 진입 = thin vertical slice 시작

#### Alpha (M2 — Thin Vertical Slice)

```
도입:
  - structured logging (console.log → JSON line)
  - Crashlytics (CC-12 결정대로)
  - 5개 핵심 trace point (lesson_started, lesson_completed, paywall_viewed, purchase_succeeded, age_gate_completed)
  - Firebase Analytics opt-in 흐름 (CC2-18)
  - 단위 테스트 (SRS, daily_usage, RC webhook 매핑)

도입하지 않는 것:
  - golden case runner (M3에서)
  - dashboard (M5에서)
  - PII redaction hook (M4에서)
```

**졸업 조건 (→ beta)**: 핵심 시나리오 1개가 trace로 추적 가능 + 단위 테스트 80% 이상 통과

#### Beta (M3 — Harness Hardening)

```
도입:
  - golden case 87개 (EVALUATION_SCENARIOS.md): SRS 50 + 결제 15 + privacy 11 + content 11
  - evaluation runner: scripts/eval/runner.ts
  - regression CI (모든 PR마다 87 case 실행, 100% 통과 필수)
  - structured output validation (manifest schema, RC webhook payload, API response)
  - (선택 1) Langfuse cloud free tier 연동
  - (선택 2) baseline metrics 기록: SRS 정확률, 결제 funnel 전환, 첫 학습 완료율
  - PII redaction hook (security와 협업)

도입하지 않는 것:
  - real-user dashboard (M5)
  - SLO alerting (M5)
```

**졸업 조건 (→ production)**: 87 golden case 100% 통과 + baseline metric 14일 안정 + structured output 위반 0건

#### Production (M5 — Beta Handoff)

```
도입:
  - SLO 기반 alerting (crash-free 99.5%, ANR 0.5%, paywall 전환율 ±20%, 결제 실패율 5% 등)
  - Phased Rollout halt trigger (CC3-08 결정대로)
  - 운영 dashboard (Crashlytics + Firebase + 자체 메트릭)
  - on-call SLA (CC3-02: 영업시간 즉시, 야간/주말 자동응답)
  - 결제 funnel 일별 리뷰
  - 콘텐츠 검수 evaluation 자동화 (CC3-07)

도입하지 않는 것:
  - SOC 2 형식 audit log (post-MVP)
  - private VPC tracing (post-MVP)
```

**졸업 조건 (→ enterprise)**: B2B 또는 EU 출시 요구 발생 시

#### Enterprise (post-MVP)

```
도입:
  - self-host Langfuse (또는 동등) — 데이터 거주자 분리
  - audit log retention 강화 (5년 등)
  - SAML/SSO 트레이싱
  - private networking (VPC peering)
  - SOC 2 / ISO 27001 evidence 자동 수집

도입하지 않는 것:
  - (현 단계에서 정의 안 함)
```

---

## 3. 도구 선택 진화 경로

본 로드맵은 **도구를 영구 고정하지 않는다**. 단계별로 가벼운 옵션 → 무거운 옵션으로 교체.

| 단계 | Trace | Eval | Crash | Analytics | Alert |
|---|---|---|---|---|---|
| bootstrap | (없음) | (없음) | (없음) | (없음) | 사람 |
| alpha | console JSON | 단위 테스트 | Crashlytics | Firebase Analytics | 이메일 |
| beta | + (선택) Langfuse cloud | + custom runner | Crashlytics | Firebase + 자체 메트릭 | + GitHub issue |
| production | Langfuse cloud | runner + 자동 baseline | Crashlytics | Firebase + 자체 dashboard | + Pushover/SMS |
| enterprise | Langfuse self-host | + experiments | Crashlytics + 자체 | + datadog/honeycomb | + PagerDuty |

각 교체 시점은 `docs/architecture/STACK_EVOLUTION_PLAN.md`의 마이그레이션 트리거와 동기화 (M1 작성).

---

## 4. 단계별 졸업 게이트 (Orchestrator 서명)

| 졸업 | 게이트 | 검증 방법 |
|---|---|---|
| bootstrap → alpha | M2 진입 직전 | M2 산출물 8개 (apps/mobile, apps/api, packages/contracts, infra/supabase, 핵심 5 trace, 단위 테스트, contract validation, golden 1개 시연) |
| alpha → beta | M3 진입 직전 | M2 game-day 통과 + golden 87 case 정의 완료 + evaluation runner 골격 |
| beta → production | M5 진입 직전 | 87 case 100% 14일 안정 + structured output 위반 0건 + baseline 확립 |
| production → enterprise | B2B/EU 출시 결정 | 별도 ADR로 게이트 정의 |

각 게이트는 orchestrator가 `docs/HANDOFF.md`에 서명한다.

---

## 5. 측정 안 하는 것 (의도적 보류)

1인 개발자 제약상 **다음은 MVP에서 측정하지 않는다** (CC2-14, A-101):

| 항목 | 사유 | 도입 시점 |
|---|---|---|
| 사용자별 학습 시간 정밀 측정 | privacy + 1인 운영 부담 | post-MVP |
| 단어별 망각 곡선 개인화 | LLM/통계 모델 필요 | Phase 4 (CC2-09 결정대로 60/120일 재노출도 미루었음) |
| A/B 가격 실험 | RC product ID 고정 제약 (Q-DA-NEW-012) | post-MVP |
| 실시간 SOC 알람 | 1인 야간 운영 불가 (CC3-02) | enterprise |
| BigQuery export | 비용 (CC2-23) | DAU 1k 또는 분석 질문 명확 시 |

각 항목은 `docs/product/ASSUMPTIONS.md`의 가정과 함께 추적된다.

---

## 6. 다음 작성 책임

본 로드맵은 **무엇을 측정할지의 큰 그림**만 정의한다. 다음 두 문서가 세부를 담당:

| 문서 | 담당 | 내용 |
|---|---|---|
| `HARNESS_EXECUTION_BOARD.md` | pm | regression / observability / structured output 3 workstream의 milestone + baseline + readiness |
| `HARNESS_LAYERED_ARCHITECTURE.md` | architect | 5층 구조 + 각 레이어의 책임/인터페이스/실패 모드/소유자/테스트/교체 가능성 |
| `EVALUATION_SCENARIOS.md` | analytics | 87 golden + adversarial 시나리오 (이미 D-006으로 작성됨) |

---

## 7. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M0 보강. 5단계 성숙도(bootstrap → alpha → beta → production → enterprise) + 측정 철학 + 도구 진화 경로 + 의도적 보류 항목 | planner |
