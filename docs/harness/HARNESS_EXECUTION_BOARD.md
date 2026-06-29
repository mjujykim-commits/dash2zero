# dash2zero — Harness Execution Board

> 작성: pm agent (2026-05-07, M0 보강)
> 책임: regression / observability / structured output 3 workstream의 마일스톤 + 성공 기준 + baseline + release readiness
> 입력 SSOT: HARNESS_MATURITY_ROADMAP.md (planner) / EVALUATION_SCENARIOS.md (analytics)
> 출력 SSOT: 본 문서가 하네스 실행의 SSOT
> Skill 사용: humanizer (built-in) · theme-factory · frontend-design · taste-skill

---

## 1. 3개 Workstream 정의

| Workstream | 한 줄 정의 | 주 책임 | 도구 |
|---|---|---|---|
| **W1. Regression** | "어제 통과한 것이 오늘도 통과하는가" | qa + analytics + backend | golden case runner, CI 차단 |
| **W2. Observability** | "프로덕션에서 무엇이 일어나는지 알 수 있는가" | analytics + devops + backend | Crashlytics, Firebase, structured log, (선택) Langfuse |
| **W3. Structured Output** | "API/Webhook/Manifest의 형식이 깨지지 않는가" | architect + backend | JSON Schema, runtime validator (zod) |

각 workstream은 독립 진행되지만 산출물은 통합 dashboard로 연결.

---

## 2. W1. Regression Workstream

### 2.1 Milestone

| Milestone | 시점 | 산출물 | 게이트 |
|---|---|---|---|
| W1-M1 단위 테스트 골격 | M2 | SRS / daily_usage / RC mapping 단위 테스트 | 80% 통과 + Crashlytics 0 fatal |
| W1-M2 Golden case 정의 | M3 진입 | EVALUATION_SCENARIOS 87개 → fixtures/golden/ YAML 변환 | 87/87 case 파일 존재 |
| W1-M3 Evaluation runner 구현 | M3 중반 | scripts/eval/runner.ts + 영역별 evaluator 4개 | runner가 전체 87 case 실행 가능 |
| W1-M4 CI 통합 | M3 후반 | PR 시 자동 실행, 1건 실패도 머지 차단 | 14일 연속 100% 통과 |
| W1-M5 Adversarial case | M4 | fixtures/adversarial/payment + privacy = 6 + 4 case | 모두 거부 + audit_log + alert 트리거 확인 |

### 2.2 Baseline Metrics (M3 진입 시 측정 시작)

| Metric | Target | Halt |
|---|---|---|
| Golden 통과율 | 100% (87/87) | < 100% |
| 단위 테스트 통과율 | ≥ 95% | < 90% |
| 회귀 실행 시간 | < 60초 | > 180초 (PR 차단) |
| Adversarial 거부율 | 100% | < 100% |

### 2.3 Release Readiness (M5 진입 게이트)

- [ ] 87 golden case 14일 연속 100% 통과
- [ ] Adversarial 10 case 100% 거부
- [ ] 단위 테스트 커버리지 ≥ 80% (SRS, daily_usage, entitlement, content manifest)
- [ ] CI 회귀 자동화 (PR / nightly)
- [ ] 회귀 실패 시 alert 채널 검증 (이메일 + GitHub issue)

---

## 3. W2. Observability Workstream

### 3.1 Milestone

| Milestone | 시점 | 산출물 | 게이트 |
|---|---|---|---|
| W2-M1 Crash + 핵심 trace 5개 | M2 | Crashlytics 통합 + lesson_started/completed/paywall_viewed/purchase_succeeded/age_gate_completed | 5 이벤트 Firebase에서 확인 |
| W2-M2 Structured log | M2 후반 | Edge Functions / RC webhook handler에 JSON line log | log aggregator(Firebase + 로컬 file)에서 조회 가능 |
| W2-M3 Event taxonomy 검증 | M3 | EVALUATION_SCENARIOS와 12_event_taxonomy 정합성 | 모든 이벤트 trigger/속성/카디널리티 명세 확인 |
| W2-M4 (선택) Langfuse 연동 | M3 후반 | LLM-heavy 가 아니라 SRS 알고리즘 추적용 | trace 1주 누적 + dashboard 제공 |
| W2-M5 SLO Dashboard | M5 | Crash-free / ANR / 결제 funnel / 첫 학습 완료율 | Owner 모바일 알림 연동 |
| W2-M6 Phased rollout halt | M5 | CC3-08 트리거 자동화 | 모의 halt 시뮬레이션 통과 |

### 3.2 Baseline Metrics

| Metric | Target | Halt | Source |
|---|---|---|---|
| Crash-free users | ≥ 99.5% | < 99% | Crashlytics |
| Android ANR | < 0.47% | > 0.5% | Crashlytics |
| 첫 학습 완료율 | ≥ 60% | < 50% | Firebase Analytics (lesson_completed / lesson_started) |
| 결제 시도 → 성공률 | ≥ 95% | < 90% | RC webhook + Analytics |
| Paywall → 구매 전환율 | baseline 측정 후 ±20% | ±30% 이탈 | Firebase Analytics |
| Age gate → onboarding 완료율 | ≥ 70% | < 50% | Firebase Analytics |

### 3.3 Release Readiness

- [ ] Crash + 핵심 5 trace 작동 14일 안정
- [ ] Event taxonomy 위반 0건
- [ ] SLO dashboard 운영자 접근 가능
- [ ] Owner 모바일 알림 SLA 검증 (CC3-02)
- [ ] (선택) Langfuse 통합 결정 — `docs/adr/ADR-0003-harness-tool.md` (M3에 작성)

---

## 4. W3. Structured Output Workstream

### 4.1 Milestone

| Milestone | 시점 | 산출물 | 게이트 |
|---|---|---|---|
| W3-M1 Contract 패키지 | M1 후반 | packages/contracts/ + JSON Schema (RC webhook, manifest, API responses) | architect 작성 + ADR-0002 |
| W3-M2 Runtime validator | M2 | Edge Functions가 RC webhook payload를 zod/pydantic으로 검증 | 위반 시 4xx + audit_log |
| W3-M3 Manifest schema | M2 후반 | content manifest JSON Schema + audio_hash 검증 | 위반 manifest 거부 |
| W3-M4 API response 검증 | M3 | 모바일 클라이언트가 API 응답을 검증, 위반 시 graceful degrade | regression suite에 포함 |
| W3-M5 Versioning 정책 | M3 후반 | contract version + breaking change 추적 | contract 변경 시 자동 changelog |

### 4.2 Baseline Metrics

| Metric | Target | Halt |
|---|---|---|
| RC webhook 검증 통과율 | 100% | < 100% (1건이라도 — 위변조 시도 가능성) |
| Manifest schema 위반 | 0 | ≥ 1 |
| API response schema 위반 (server side) | 0 | ≥ 1 |
| Client deserialize 실패율 | < 0.1% | > 1% (서비스 영향) |

### 4.3 Release Readiness

- [ ] packages/contracts/ 발행 + 모든 API/Webhook이 의존
- [ ] RC webhook 14일간 schema 위반 0건
- [ ] Manifest hash 검증이 회귀에 포함
- [ ] Contract breaking change 정책 (DECISION_LOG에 기록)

---

## 5. 통합 Dashboard 구성 (M5)

3개 workstream의 baseline metric을 단일 dashboard에서 본다. 1인 개발자용으로 모바일 친화 + 야간 알림.

```
┌─────────────────────────────────────────────────────┐
│  dash2zero — Operations Board                      │
├─────────────────────────────────────────────────────┤
│ W1 Regression                                       │
│   Golden 87/87 ✅   (last run: 12m ago)            │
│   Adversarial 10/10 ✅                              │
│   Unit cov: 84% ✅                                  │
├─────────────────────────────────────────────────────┤
│ W2 Observability                                    │
│   Crash-free 99.7% ✅   ANR 0.31% ✅               │
│   First lesson complete: 64% ✅                     │
│   Paywall→Purchase: 8.2% (baseline ±5%)            │
│   Age gate→Onboarding: 78% ✅                      │
├─────────────────────────────────────────────────────┤
│ W3 Structured Output                                │
│   RC webhook violations: 0 ✅                       │
│   Manifest schema violations: 0 ✅                  │
│   Client deserialize fail: 0.04% ✅                 │
├─────────────────────────────────────────────────────┤
│ Active Alerts: 0                                    │
│ Last halt: never                                    │
└─────────────────────────────────────────────────────┘
```

도구는 M3에서 결정 (ADR-0003). 가능 후보: Firebase + Crashlytics + 자체 web dashboard, 또는 + Langfuse, 또는 + Datadog.

---

## 6. Workstream 간 의존성

| W1 → W2 | regression이 baseline을 만들어주면 W2가 dashboard에 표시 |
| W2 → W3 | observability가 schema 위반을 감지해 W3에 피드백 |
| W3 → W1 | contract가 변경되면 regression suite도 갱신 |

3개 workstream은 매주 orchestrator rollup에서 함께 보고된다.

---

## 7. 타 workstream과의 인터페이스

본 boards는 swarm coding의 다른 영역과 정합한다.

| 영역 | 인터페이스 |
|---|---|
| `apps/mobile/` (frontend) | structured log + 핵심 trace 5개 발화 + offline event queue |
| `apps/api/` (backend) | webhook validator + audit_log + RC sync |
| `packages/contracts/` (architect) | W3의 source of truth |
| `fixtures/golden/` (qa + analytics) | W1의 입력 |
| `docs/runbooks/SECURITY_REVIEW.md` (security) | adversarial case 정의 |

---

## 8. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M0 보강. 3 workstream(regression / observability / structured output) + milestone + baseline + readiness 정의 | pm |
