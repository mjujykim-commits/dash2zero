# ADR-0001 — Stack Decision (Lean / Managed / Serverless-first)

- **상태**: **Accepted**
- **결정일**: 2026-05-07
- **작성**: architect agent
- **승인**: orchestrator (D-007)
- **마일스톤**: M1
- **관련 문서**: STACK_OPTIONS_MATRIX.md / STACK_DECISION.md / STACK_EVOLUTION_PLAN.md / DOMAIN_MODEL.md

---

## Context

dash2zero는 영어권 한국어 초보자 대상 모바일 학습 앱이다. 1차 출시 5개국 (US/CA/UK/AU/NZ), 1인 개발자, 20주 baseline 일정 (CC2-14), 월 인프라 비용 ~$25 이하 (A-202).

사용자 지시 §9는 "고정 스택 금지 — 분석 → 옵션 → 선택 → 문서화 → 진화 계획"을 요구한다. STACK_OPTIONS_MATRIX에서 3 후보 (Lean / Balanced / Scale)를 15축 가중 평가했다.

기획 단계 잠정 결정 (REVIEW_QA C-01/02/09/12)은 본 ADR로 봉인 또는 갱신된다.

---

## Decision

**dash2zero MVP는 후보 A — Lean / Managed / Serverless-first 스택을 채택한다.**

| 영역 | 도구 | 결정 근거 |
|---|---|---|
| Mobile | React Native + Expo + TypeScript + Expo Router | C-01 잠정 결정 재검증 통과 |
| Build | EAS Build / Submit / Update | Expo 생태계 통합, 무료 30 builds/mo |
| Backend | **Supabase** (Postgres / Auth / Storage / Edge Functions / RLS) | C-02 재검증 통과 |
| 결제 | RevenueCat + Apple/Google IAP | C-09 재검증 통과 |
| 분석 | Firebase Analytics + Crashlytics | C-12 재검증 통과 |
| TTS | M2-S2 (W6) 결정 — Google / Azure / Naver Clova / ElevenLabs 후보 | provider 추상화로 교체 가능 |
| Tracing | (선택) Langfuse cloud free tier — M3 후반 도입 검토 | ADR-0003 |

전체 영역별 도구는 STACK_DECISION.md §2 참조.

---

## Rationale

### 정량 (15축 가중 평가)

| 후보 | 가중점수 |
|---|---:|
| **A. Lean** | **78.2%** ← 채택 |
| B. Balanced | 68.0% |
| C. Scale | 52.9% |

### 정성 (5가지 우선순위)

후보 A는 dash2zero MVP의 5가지 우선순위(20주 출시 / 월 ~$25 / 1인 운영 / 5국 글로벌 / UK GDPR+COPPA+한국 사업자 대응)를 모두 충족. 후보 B는 운영 컴포넌트 ≥7개로 1인 운영 위반. 후보 C는 월 $200+ 비용으로 부적합.

### Vendor Lock-in 수용

가장 큰 위험인 Supabase + Firebase 동시 lock-in은 다음 4가지로 완화하여 **수용 가능한 위험**으로 판단:

1. Domain Model Contract Layer 9개 경계면 추상화 (DOMAIN_MODEL §7)
2. STACK_EVOLUTION_PLAN의 정량 마이그레이션 트리거
3. 데이터 portability (PG dump 표준)
4. Firebase는 분석/Crash 한정 — SDK 격리 가능

---

## Consequences

### Positive

- 20주 일정 안에 5개국 출시 가능
- 월 $25 이하 인프라 비용으로 베타 단계 진입
- 1인 개발자가 운영해야 할 컴포넌트 5개 (Mobile / Supabase / RC / Firebase / EAS) — Orchestrator §1 권고 충족
- 글로벌 규제 (UK GDPR / COPPA / 한국 사업자) 모두 단일 플랫폼에서 대응 가능

### Negative

- Supabase + Firebase 두 vendor에 깊이 의존
- DAU 10k+ 도달 시 비용 곡선 재검토 필요 (STACK_EVOLUTION_PLAN §3)
- 자체 백엔드 / 자체 인증 등의 학습 기회 부재 (M1-M5 단계에서는 의도적 trade-off)

### Neutral

- Phase 1 → Phase 2 전환 비용은 매우 낮음 (Supabase Pro 전환 + Langfuse 추가)
- Phase 1 → Phase 3 전환 비용은 누적되므로 마이그레이션 트리거 도달 전 사전 작업 필요

---

## Alternatives Considered

### 후보 B — Balanced / Growth / Managed Platform

- 자체 Node.js 백엔드 + Render/Fly + Neon Postgres + Sentry + PostHog
- **거부 이유**: 운영 컴포넌트 7개 이상으로 1인 운영 부담, 출시 일정 6-8주 슬립 가능성

### 후보 C — Scale / Regulated / Enterprise-Ready

- AWS ECS + RDS + ElastiCache + Datadog + Cognito
- **거부 이유**: 월 $200+ 고정비, 1인 환경에서 IaC/관제 운영 불가능, MVP 단계 과도

### 자체 백엔드 (Custom Node.js / Go)

- **거부 이유**: 추상화 비용 > 효용. Supabase Edge Functions로 충분.

### Stripe 직접 결제

- **거부 이유**: Apple/Google 외부 결제 가이드라인 위반 가능. RC + IAP 채택.

---

## Validation

본 결정은 다음 시점에 검증된다 (STACK_DECISION §6.2 그대로):

| 시점 | 검증 | 합격 기준 |
|---|---|---|
| M2 종료 (W12) | thin vertical slice E2E 동작 | J-001 시연 + 5 trace |
| M3 종료 (W14) | golden 87 case 회귀 통과 | 14일 100% |
| M5 종료 (W18) | 5개국 베타 30명 + 결제 sandbox | beta GA-ready |
| 출시 +30일 | 인프라 실제 비용 | 월 $25 이하 |
| 출시 +90일 | DAU 100/1k 시 비용 곡선 | A-202 검증 |

---

## Reversal Triggers

다음 중 하나 발생 시 본 ADR을 갱신하거나 ADR-NNNN으로 stack 재결정:

- Supabase 가격 인상 ≥ 50% / 서비스 종료
- DAU 10k+ 도달 + 비용 곡선 후보 B 대비 ≥ 30% 이상 비효율
- EU/EEA 출시 결정 + 데이터 거주자 요구
- B2B/Enterprise 고객 발생 + private networking 요구
- 1인 → 팀 확장 시 layer 분리 필요

---

## References

- `docs/architecture/STACK_OPTIONS_MATRIX.md` — 3 후보 정량/정성 평가
- `docs/architecture/STACK_DECISION.md` — 봉인 결정문
- `docs/architecture/STACK_EVOLUTION_PLAN.md` — 진화 트리거 + 마이그레이션 비용
- `docs/architecture/DOMAIN_MODEL.md` — 9개 경계면 추상화
- `docs/REVIEW_QA.md §5` — 잠정 결정 (C-01 ~ C-20)
- `docs/SERVICE_REVIEW_QA.md §8` — CC2/CC3 결정 로그
- `docs/product/ASSUMPTIONS.md A-201~A-206` — 기술 가정

---

## Change Log

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M1-11 v1.0 — 후보 A Accepted, orchestrator 승인 D-007 | architect |
