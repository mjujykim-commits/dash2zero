# dash2zero — Harness Layered Architecture (5 Layers)

> 작성: architect agent (2026-05-07, M0 보강)
> 책임: 5층 구조 + 각 레이어의 책임/인터페이스/실패 모드/소유자/테스트/교체 가능성
> 상위 SSOT: HARNESS_MATURITY_ROADMAP (planner) / HARNESS_EXECUTION_BOARD (pm) / EVALUATION_SCENARIOS (analytics)
> Skill 사용: software-architecture (가이드 문서) · prompt-engineering (LLM) · mcp-builder (확장 시 검토)

---

## 1. 설계 철학

### 1.1 5층으로 나누는 이유

하네스를 단일 도구(예: Langfuse 통합 솔루션)에 묶으면 도구 변경 시 모든 코드를 다시 짜야 한다. dash2zero는:

- 1인 개발자 환경 → **운영 부담 최소화**
- 20주 일정 → **빠른 도입 가능**
- 단계별 진화 (MAU 0 → 1k → 10k+) → **도구 교체 가능성**

따라서 5개 레이어로 나누어 각 레이어를 **교체 가능한 인터페이스**로 추상화한다 (사용자 지시 §2 "교체 가능성 큰 경계면 추상화").

### 1.2 5층 개요 (위 → 아래)

```
┌─────────────────────────────────────────────┐
│ 5. Observability Layer                      │  ← 운영 가시성
│    (Crashlytics, Firebase, Langfuse, log)   │
├─────────────────────────────────────────────┤
│ 4. Evaluation Layer                         │  ← 품질 평가
│    (golden runner, adversarial, baseline)   │
├─────────────────────────────────────────────┤
│ 3. Retrieval Layer                          │  ← 데이터 조회 정확성
│    (manifest, SRS, signed URL, content ver) │
├─────────────────────────────────────────────┤
│ 2. Policy Layer                             │  ← 비즈니스 규칙 / 권한
│    (RLS, daily limit, age gate, OTA scope)  │
├─────────────────────────────────────────────┤
│ 1. Contract Layer                           │  ← 입출력 형식 무결성
│    (JSON Schema, TS types, zod validators)  │
└─────────────────────────────────────────────┘
```

위 레이어는 아래 레이어가 정확하다고 가정한다. 따라서 아래에서 위로 구축한다 (1→2→3→4→5).

---

## 2. Layer 1 — Contract Layer

### 2.1 책임

입출력 형식의 정합성을 보장한다. 모든 레이어는 본 레이어가 정의한 타입/스키마만을 신뢰한다.

### 2.2 인터페이스

| 인터페이스 | 위치 (M1 이후) | 형식 |
|---|---|---|
| API request/response 스키마 | `packages/contracts/api/*.ts` | TypeScript types + zod schema |
| RevenueCat webhook payload | `packages/contracts/revenuecat/webhook.ts` | zod schema (status enum, period_ends_at, grace_period_ends_at 등 — CC2-08) |
| Content manifest | `packages/contracts/content/manifest.ts` | zod schema (audio_hash, content_version, words[]) |
| Supabase DB rows | `packages/contracts/db/*.ts` | Postgres → TypeScript 자동 생성 (supabase-js types) |
| Analytics 이벤트 스키마 | `packages/contracts/analytics/events.ts` | snake_case object_action + 속성 타입 |

### 2.3 실패 모드

| 실패 | 감지 방법 | 처리 |
|---|---|---|
| API 응답이 schema 위반 | client zod parse 실패 | graceful degrade + Crashlytics + 다음 시도 |
| Webhook payload schema 위반 | server zod parse 실패 | 4xx + audit_log + alert (위변조 가능성) |
| Manifest hash 불일치 | client SHA 검증 실패 | 캐시 폐기 + manifest 재요청 |
| Analytics 이벤트 schema 위반 | TypeScript 빌드 실패 | 머지 차단 |

### 2.4 소유자

architect (스키마 정의) + backend (서버 구현) + frontend (클라이언트 검증)

### 2.5 테스트 방법

- 단위: zod parse 통과/실패 케이스 (M2)
- 통합: 실제 RC webhook payload sample로 검증 (M3)
- 회귀: schema 변경 시 contract version bump + breaking change 추적 (M3 후반)

### 2.6 교체 가능성

- zod → io-ts / yup / valibot 등으로 교체 가능 (`packages/contracts/`만 수정)
- TypeScript types는 표준이라 도구 무관
- 클라이언트가 zod 직접 import하지 않고 `@dash2zero/contracts`로 import → 도구 변경이 코드에 미치는 영향 최소

---

## 3. Layer 2 — Policy Layer

### 3.1 책임

비즈니스 규칙, 권한, 한도를 검증한다. Contract Layer가 통과한 데이터에 대해 "이 사용자가 이 작업을 할 수 있는가"를 결정한다.

### 3.2 인터페이스

| 정책 | 구현 | 트리거 |
|---|---|---|
| RLS 매트릭스 | Supabase 정책 SQL (CC2-03 결정대로 default deny) | DB 접근 모든 시점 |
| 일일 한도 (무료 3, Premium 15) | `daily_usage` 테이블 + Edge Function check (CC2-07) | 학습 시작 시 |
| Age gate → privacy → onboarding 순서 | Edge Function pre-condition + 클라이언트 가드 (CC2-18) | first-run |
| 13세 미만 차단 | age gate 응답 → device_install lockout (CC2-05) | first-run, 재가입 시도 |
| OTA 적용 범위 | EAS Update channel + native 변경 자동 차단 (CC2-17) | release 시점 |
| 결제 권한 (인증 사용자만) | RevenueCat appUserID = auth.users.id 강제 (CC2-06) | IAP 시도 시 |
| Grace period 정책 | webhook handler가 status 매핑 (CC3-05) | RC webhook 수신 시 |

### 3.3 실패 모드

| 실패 | 감지 | 처리 |
|---|---|---|
| RLS 우회 시도 | Supabase 거부 | 403 + audit_log + alert |
| 일일 한도 초과 | Edge Function check fail | paywall 트리거 |
| 잘못된 first-run 순서 | 클라이언트 state machine 검증 | 강제 흐름 복원 |
| 13세 미만 우회 시도 | DOB 변경 감지 | device lockout 24h |
| OTA로 native 변경 시도 | EAS plugin 검사 | 빌드 거부 + Slack 알림 |

### 3.4 소유자

backend (RLS, Edge Functions) + security (정책 정의) + frontend (클라이언트 가드)

### 3.5 테스트 방법

- RLS: anon / authenticated / service_role 각각 CRUD 시도 (M2)
- 일일 한도: golden case (EVALUATION_SCENARIOS §2.2 일일 한도 4개)
- Age gate: privacy 11 + age 3 case (EVALUATION_SCENARIOS §4)
- Adversarial: 정책 우회 시도 5종 (M4)

### 3.6 교체 가능성

- RLS → Hasura permissions / 자체 미들웨어로 교체 가능 (Supabase 의존도 격리)
- 정책 표현은 코드(SQL/TS)와 docs/runbooks/에 이중 기록 → 도구 변경 시 정책 자체는 보존

---

## 4. Layer 3 — Retrieval Layer

### 4.1 책임

올바른 데이터를 조회/계산해서 반환한다. Contract와 Policy를 통과한 요청에 대해 정확한 결과를 만든다.

### 4.2 인터페이스

| 조회 | 구현 | 결정 트리거 |
|---|---|---|
| 다음 학습할 단어 큐 | `getNextWords(user_id, daily_limit)` Edge Function | SRS Leitner + due 시각 (CC-08) |
| SRS stage 전이 | `applySrsTransition(user_id, word_id, correct)` (CC2-10, CC3-05) | 학습 attempt 시 |
| Content manifest fetch | `getContentManifest(pack_id)` + diff 알고리즘 (CC2-15) | 앱 부팅 / pack 진입 |
| Audio signed URL | `getAudioUrl(word_id, entitlement)` TTL 6시간 (CC3-04) | 단어 학습 시 |
| Entitlement 조회 | `getEntitlement(user_id)` + grace_period_ends_at 처리 (CC3-05) | 매 화면 진입 |
| Game-day 단어 머지 | `mergeGuestData(user_id, guest_data)` (CC2-04, CC2-06) | 게스트→가입 시 |

### 4.3 실패 모드

| 실패 | 감지 | 처리 |
|---|---|---|
| 잘못된 SRS stage 전이 | golden case 회귀 (W1) | halt + 직전 commit revert |
| 만료된 signed URL 재생 | client 401 | manifest 재요청 + URL 갱신 |
| Content version mismatch | client cache hash mismatch | 캐시 폐기 + 재다운로드 |
| Entitlement 동기화 지연 | RC webhook ↔ DB 시차 | 24h grace 후 강등 (CC3-05) |
| 머지 충돌 (multi-device) | server max stage 채택 | 충돌 case audit_log |

### 4.4 소유자

backend + learning (SRS 알고리즘 검증)

### 4.5 테스트 방법

- 단위: SRS 함수 직접 테스트 (M2)
- 통합: golden case 50개 SRS + 11개 content (EVALUATION_SCENARIOS)
- E2E: 사용자 학습 1회 완료 시나리오 (M3)

### 4.6 교체 가능성

- Edge Functions → 자체 백엔드(Node/Python)로 교체 가능 (인터페이스 함수 시그니처 보존)
- Supabase Storage → S3/R2/CloudFront로 교체 가능 (`getAudioUrl`만 재구현)
- SRS 알고리즘 자체는 Leitner → FSRS / SM-2로 교체 가능 (학습 데이터 마이그레이션 필요 — ADR로 별도 결정)

---

## 5. Layer 4 — Evaluation Layer

### 5.1 책임

학습/제품 결과의 품질을 자동으로 평가한다. Retrieval Layer가 반환한 결과가 baseline에서 이탈하지 않는지 검증.

### 5.2 인터페이스

| Evaluator | 입력 | 출력 |
|---|---|---|
| `srsEvaluator` | golden case 50개 (yaml) | pass/fail + 각 case의 expected vs actual |
| `paymentEvaluator` | RC webhook 9 상태 + 6 adversarial | entitlement DB 상태 일관성 |
| `privacyEvaluator` | 11 first-run + age + UK case | 동의 흐름 정합성 |
| `contentEvaluator` | 11 manifest case | hash / version / signed URL 정합성 |
| `e2eEvaluator` | 핵심 사용자 시나리오 (lesson 1회 완료) | < 3분 약속 (CC2-25) |

### 5.3 실패 모드

| 실패 | 감지 | 처리 |
|---|---|---|
| Golden case 1건 실패 | runner halt | 머지 차단 + alert |
| Baseline 이탈 (10% 이상) | nightly run | review + 원인 식별 |
| Adversarial 통과 (방어 실패) | runner halt | 보안 alert + 즉시 패치 |
| E2E > 3분 | regression CI | UX 검토 + UI 최적화 |

### 5.4 소유자

analytics (시나리오 정의 + runner) + qa (실행 + adversarial) + learning (SRS 정확성 검증)

### 5.5 테스트 방법

- M3: scripts/eval/runner.ts가 87 case 일괄 실행
- nightly: GitHub Actions로 자동 실행 (devops 책임)
- baseline 14일 안정 → release readiness gate

### 5.6 교체 가능성

- 자체 runner → Langfuse experiments / Phoenix evaluations로 교체 가능
- YAML golden case는 도구 무관 → 자체 runner든 외부 도구든 동일 case 실행
- baseline metric은 자체 메트릭 표 + (선택) Langfuse trace에 기록

---

## 6. Layer 5 — Observability Layer

### 6.1 책임

운영 중 무엇이 일어나는지 가시화한다. 1-4 레이어가 만든 결과를 알람/대시보드/로그로 표현.

### 6.2 인터페이스

| 도구 | 책임 | 도입 단계 |
|---|---|---|
| Crashlytics | crash + ANR | M2 (alpha) |
| Firebase Analytics | 핵심 5 trace + funnel | M2 (alpha) |
| structured log | Edge Functions / RC webhook handler JSON line | M2 (alpha) |
| custom dashboard | 3 workstream baseline 통합 (W2-M5) | M5 (production) |
| (선택) Langfuse | SRS / 결제 / privacy trace 통합 | M3 후반 (beta) |
| Owner 모바일 알림 | 데이터 노출 / 결제 권한 대량 오류 / 앱 실행 불가 (CC3-02) | M5 |
| Phased rollout halt | crash-free 99%, ANR 0.5%, 결제 실패 5%, age 차단 실패 1건 등 (CC3-08) | M5 |

### 6.3 실패 모드

| 실패 | 감지 | 처리 |
|---|---|---|
| Crashlytics 송출 실패 | client 자체 retry queue | 24h 후 보고 |
| Firebase Analytics 한도 초과 (CC2-23) | console 알림 | 이벤트 정리 + BigQuery export 검토 |
| Owner 알림 미수신 | 자기 테스트 (월 1회) | 채널 다중화 |
| Halt trigger 오작동 | 모의 시뮬레이션 (월 1회) | 트리거 임계값 재조정 |

### 6.4 소유자

analytics (이벤트/메트릭 정의) + devops (운영 + 알람) + backend (서버 측 log)

### 6.5 테스트 방법

- M5: 모의 장애 시뮬레이션 (Crashlytics 송출 / Halt 트리거 / Owner 알림)
- 월 1회 game-day (실 운영 가정)

### 6.6 교체 가능성

- Crashlytics → Sentry로 교체 가능 (모바일 SDK만 변경)
- Firebase Analytics → Amplitude / Mixpanel / PostHog (이벤트 SDK만 변경, EVALUATION_SCENARIOS는 도구 무관)
- (선택) Langfuse → Phoenix / Helicone (trace SDK 추상화 필요)
- alert channel → email / GitHub issue / Pushover / SMS / PagerDuty 모두 어댑터 패턴

---

## 7. 레이어 간 의존성 + 흐름

### 7.1 의존성 (위 → 아래)

```
Observability (5)
    ↓ depends on
Evaluation (4)
    ↓ depends on
Retrieval (3)
    ↓ depends on
Policy (2)
    ↓ depends on
Contract (1)
```

### 7.2 데이터 흐름 예시 — "사용자가 단어 학습 정답 입력"

```
1. Client → API request (Contract Layer가 zod 검증)
2. Edge Function → daily_limit / RLS 검사 (Policy Layer)
3. applySrsTransition() 호출 → 다음 stage 계산 (Retrieval Layer)
4. golden case와 비교 (Evaluation Layer, nightly)
5. lesson_completed 이벤트 + structured log (Observability Layer)
```

### 7.3 실패 격리

각 레이어의 실패가 위 레이어로 전파되지 않도록:

- Layer 1 실패 (Contract) → Layer 2 진입 차단 (4xx 반환)
- Layer 2 실패 (Policy) → Layer 3 진입 차단 (403 반환)
- Layer 3 실패 (Retrieval) → Layer 4 baseline 이탈 (alert)
- Layer 4 실패 (Evaluation) → Layer 5 dashboard에 빨간 표시 (halt 트리거)
- Layer 5 실패 (Observability) → 운영자 통지 (다른 channel로 fallback)

---

## 8. ADR 연결

본 아키텍처는 다음 ADR과 연결된다 (M1~M3에 작성).

| ADR | 결정 항목 | 마일스톤 |
|---|---|---|
| ADR-0001 | 기술 스택 (RN/Supabase/RC/Firebase 또는 대안) | M1 |
| ADR-0002 | Domain Model 경계면 추상화 범위 (Contract Layer) | M1/M2 |
| ADR-0003 | Harness 도구 선택 (Langfuse vs Phoenix vs custom) | M3 |
| ADR-0004 | RLS 정책 매트릭스 (Policy Layer) | M2 |

---

## 9. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M0 보강. 5층 구조 + 각 레이어 책임/인터페이스/실패 모드/소유자/테스트/교체 가능성 정의 | architect |
