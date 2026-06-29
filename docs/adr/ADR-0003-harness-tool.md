# ADR-0003 — Harness Tool Selection

- **상태**: **Accepted**
- **결정일**: 2026-05-08
- **작성**: architect agent + analytics agent
- **승인**: orchestrator
- **마일스톤**: M3 (W13)
- **관련 문서**: HARNESS_MATURITY_ROADMAP.md / HARNESS_EXECUTION_BOARD.md / HARNESS_LAYERED_ARCHITECTURE.md / EVALUATION_SCENARIOS.md

---

## Context

HARNESS_MATURITY_ROADMAP §3에서 4 phase 도구 진화 정의. M3 진입 시점에 다음 결정 필요:

1. **Evaluation runner**: 자체 (`scripts/eval/runner.ts`) vs 외부 (Langfuse experiments)
2. **Trace collector**: 현재 `firebaseTraceCollector` 어댑터 유지 vs Langfuse 도입
3. **Baseline metrics + dashboard**: Firebase Analytics만 vs Langfuse 추가

ADR-0001 후보 A (Lean) 채택 + 1인 운영 + 월 $25 이하 + Vendor lock-in 완화 원칙.

---

## Decision

**M3 단계는 자체 evaluation runner + Crashlytics + Firebase Analytics만 사용한다. Langfuse 도입은 보류.**

### 채택 구성

| 영역 | 도구 |
|---|---|
| Evaluation runner | **자체 — `scripts/eval/runner.ts`** |
| Golden case 형식 | **YAML** (`fixtures/golden/{srs,payment,privacy,content}/`) |
| Adversarial 형식 | **YAML** (`fixtures/adversarial/{rls,payment,privacy}/`) |
| Trace collector | **firebaseTraceCollector** (TraceCollector 인터페이스 어댑터, ADR-0002) — **변경 없음** |
| Baseline metrics | **자체 메트릭 표** (`docs/harness/BASELINE_METRICS.md`) + Firebase Analytics |
| Crash | **Crashlytics** (ADR-0001 그대로) |
| CI | **GitHub Actions** PR check에 evaluation runner 통합 |

### Langfuse 도입 트리거 (미래)

다음 중 하나 발생 시 ADR-0003-update 작성하여 도입:

1. M5 베타 출시 후 학습/결제 trace 분석에서 자체 메트릭으로 부족함 명확
2. DAU 1,000 도달 + 무료 cloud tier 한도 내 비용 확인
3. ADR-0001 Reversal Trigger 도달 시 stack 재검토와 함께
4. LLM 기능 도입 (현재 미사용 — TTS는 사전 생성)

---

## Rationale

### 자체 runner 채택 이유

| 평가 축 | 자체 runner | Langfuse cloud free | Phoenix |
|---|---|---|---|
| 도입 비용 | 0 (이미 Node/TS 환경) | ~1 sprint day | ~2 sprint day |
| 월 비용 | $0 | $0 (free tier ≤ 50k traces/mo) → $50+ 도달 시 | self-host 시 0, 인프라 부담 |
| 학습 곡선 | 0 (TS만) | 중간 (대시보드 + SDK) | 중간 |
| 사용 비도 | 매 PR | 사용자 trace 분석 (M5 이후) | LLM 평가 위주 (dash2zero 부적합) |
| Vendor lock-in | 0 | 중간 (cloud) | 낮음 (OSS) |
| 1인 운영 부담 | 매우 낮음 | 낮음 | 중간 |

**점수**:
- 자체 runner: 9.5/10 (M3 단계)
- Langfuse cloud: 7/10 (M3 — 과한 도구)
- Phoenix: 5/10 (LLM 위주, 부적합)

### Trace collector 유지 이유

- `firebaseTraceCollector`는 이미 ADR-0002 인터페이스 어댑터 — 교체 가능
- M3 단계 trace는 핵심 5 이벤트 + 35 enum으로 충분 (CC2-22)
- Firebase Analytics 무료 한도 안 (CC2-23)
- 추후 Langfuse 도입 시 TraceCollector 인터페이스만 교체

### 87 golden case 도구 선택

- YAML이 사람 읽기 쉽고 검수자(learning agent)도 직접 편집 가능
- TypeScript runner가 yaml 읽어서 evaluator 4개 호출
- Langfuse experiments는 LLM 평가 위주 — dash2zero의 결정론적 SRS/결제 검증에는 과함

---

## Consequences

### Positive

- 추가 vendor 0 (Lean 원칙 준수)
- M3 단계 cost ~$0 추가
- 자체 runner는 코드 직접 수정 가능 — 1인 개발자 친화
- TraceCollector 인터페이스가 추상화되어 있어 미래 교체 비용 낮음

### Negative

- **Trace 시각화 부재**: 사용자별 학습 흐름 시각화는 BigQuery export + 자체 SQL로 (CC2-23 도달 시)
- **A/B 실험 인프라 부재**: post-MVP에 별도 도입 (Q-DA-DOC-014)
- **Self-host audit log retention**: enterprise 단계까지 보류

### Neutral

- 87 golden case + adversarial는 도구 무관 — 자체 runner든 외부든 동일 yaml 사용

---

## Alternatives Considered

### Langfuse cloud free tier 도입

- 거부: M3 단계에 trace 시각화 효용 < 도입 비용. M5 베타 출시 후 사용자 데이터 누적 시 재검토.

### Phoenix (Arize)

- 거부: LLM evaluation 위주. dash2zero는 결정론적 SRS/결제 검증이라 부적합.

### Self-host Langfuse

- 거부: 1인 운영 부담 매우 높음. Phase 4 Enterprise에서 검토.

### Datadog APM

- 거부: 월 $15-30/host. M5 production에서 SLO alerting 필요 시 검토.

---

## Validation

| 시점 | 검증 |
|---|---|
| M3 W13 종료 | runner + srs evaluator 동작 |
| M3 W14 종료 | 87 golden case 100% 통과 + adversarial 10 case 거부 + CI 통합 |
| M5 베타 출시 후 | trace 시각화 부족 인지 시 ADR-0003-update |
| DAU 1k 도달 | Langfuse free tier 비용 시뮬 + 도입 검토 |

---

## Reversal Triggers

다음 발생 시 ADR-0003 갱신:

1. M3 W14 종료 시점에 evaluation runner 유지 보수 비용 > 추정 (분기당 1 sprint day 초과)
2. Trace 시각화 부재로 운영 의사결정 지연
3. M5 이후 사용자 학습 흐름 분석에서 BigQuery + Looker만으로 부족
4. ADR-0001 Reversal Trigger 5개 중 일부 도달 시 stack 재검토와 함께

---

## References

- ADR-0001 — Stack Decision (Lean / Managed)
- ADR-0002 — Domain Model 추상화 (TraceCollector 인터페이스)
- HARNESS_MATURITY_ROADMAP §3 — 도구 진화 경로
- HARNESS_EXECUTION_BOARD §2.4 — W2-M4 (선택) Langfuse 통합
- EVALUATION_SCENARIOS — 87 golden case 정의
- CC2-23 — BigQuery export 비활성

---

## Change Log

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-08 | M3 W13 v1.0 — 자체 runner + Firebase Analytics 유지, Langfuse 보류 | architect + analytics |
