# dash2zero — Stack Decision (봉인)

> 작성: architect agent (M1, 2026-05-07)
> 승인: orchestrator (D-007)
> 입력 SSOT: STACK_OPTIONS_MATRIX.md (3 후보 가중 평가)
> 봉인: ADR-0001-stack-decision.md
> Skill 사용: software-architecture · prompt-engineering

---

## 1. 결정 (한 줄)

> **dash2zero MVP는 후보 A — Lean / Managed / Serverless-first 스택을 채택한다.**

가중 평가 결과 78.2% (B 68.0% / C 52.9%)로 압도적 1위. 1인 개발자 + 20주 + 월 $25 이하 비용 제약에 가장 적합.

---

## 2. 채택된 스택

### 2.1 영역별 도구

| 영역 | 도구 | 이유 (1줄) | 결정 의존도 |
|---|---|---|---|
| **Mobile App** | React Native + Expo + TypeScript + Expo Router | iOS/Android 동시 개발, JS 생태계, OTA 가능 | 영구 (M5까지 변경 비용 매우 큼) |
| **Build / Submit / OTA** | EAS Build + EAS Submit + EAS Update | Expo 생태계 통합, 무료 30 builds/mo | 영구 |
| **Backend / Auth / DB / Storage / Edge** | **Supabase** (Postgres / Auth / Storage / Edge Functions / RLS) | 1인 운영 single platform, RLS 강력 | M3 후 재검증 (DAU 1k 시) |
| **결제** | RevenueCat + Apple/Google IAP | 영수증 검증 위임, MTR $2.5K 무료 | M5 후 재검증 |
| **분석** | Firebase Analytics | 무료, Crashlytics와 통합 | M3 후 BigQuery export 재검증 |
| **Crash Reporting** | Firebase Crashlytics | 무료, 모바일 표준 | 영구 |
| **TTS** | (M2 첫 batch에서 결정 — 후보: Google Cloud TTS / Azure Speech / Naver Clova / ElevenLabs) | 사전 생성 후 Storage | provider 추상화 — 교체 가능 |
| **Push Notification** | Expo Notifications (FCM/APNs 추상화) | Expo 생태계 통합 | 영구 |
| **CI/CD** | GitHub Actions (무료) + EAS | 무료 티어 충분 | M3 후 재검증 |
| **Tracing (선택)** | Langfuse cloud free tier (M3 후반 도입 예정) | OSS, GDPR self-host 옵션 | M3 ADR-0003 |
| **IaC (선택)** | M5까지 도입 안 함 — Supabase + EAS dashboard로 충분 | 1인 운영 부담 절감 | M5+ |

### 2.2 명시적으로 채택하지 않은 것

| 도구 | 사유 |
|---|---|
| 자체 백엔드 (Node/Python) | 1인 운영 부담 + 출시 일정 6-8주 슬립 가능성 |
| AWS / GCP / Azure | $200+/mo 고정비, 1인 환경에서 운영 불가 |
| Kubernetes / ECS | 동일 |
| 자체 OAuth / 인증 서버 | Supabase Auth로 충분, 보안 위험 자체 부담 회피 |
| Stripe (자체 결제) | App Store/Google 외부 결제 가이드라인 위반 가능 |
| Datadog / Honeycomb | $50+/host, MVP 단계 과한 도구 |
| Cloudflare / Fastly | M5까지 Supabase Storage egress로 충분 |

---

## 3. 결정 사유

### 3.1 정량 (STACK_OPTIONS_MATRIX §5 그대로)

| 평가 | 후보 A | 후보 B | 후보 C |
|---|---:|---:|---:|
| 가중 합계 | **78.2%** | 68.0% | 52.9% |
| 핵심 강점 | 속도 + 비용 + 1인 운영 | vendor 다변화, layer 분리 | enterprise 적합 |
| 핵심 약점 | vendor lock-in (Supabase + Firebase) | 운영 컴포넌트 ≥7 | 월 $200+, 1인 불가 |

### 3.2 정성

**dash2zero의 우선순위 5가지**:

1. **20주 안에 출시** (CC2-14) — 후보 A 외 다른 옵션은 일정 슬립 위험
2. **월 ~$25 이하 인프라 비용** (A-202) — 후보 B/C는 ≥$50
3. **1인 개발자 운영 부담 최소** — 컴포넌트 ≤5개 원칙 충족
4. **5개국 글로벌 출시 가능** — Supabase + Firebase 모두 글로벌 가용
5. **법무/규제 (UK GDPR, COPPA, 한국 사업자) 대응** — Supabase EU/US 리전 선택 가능

후보 A는 5가지 모두 충족. 후보 B/C는 1번 또는 2번 또는 3번을 위반.

### 3.3 정성적 risk acceptance

후보 A 채택의 가장 큰 위험은 **vendor lock-in (Supabase + Firebase)**이다. 이를 다음 4가지 완화책으로 수용한다:

1. **Domain Model의 Contract Layer 추상화** — 9개 경계면(auth/storage/queue/model provider/observability/billing/search/vector/notification)을 인터페이스로 분리 (DOMAIN_MODEL §7)
2. **마이그레이션 트리거 사전 정의** — STACK_EVOLUTION_PLAN.md에 정량 트리거 명시
3. **데이터 portability** — Supabase Postgres는 표준 PG dump → 자체 PG 인스턴스로 마이그레이션 가능
4. **Firebase는 분석/Crash 한정** — 분석 vendor 교체는 SDK 수준으로 격리 가능

→ Lock-in을 완전히 없애는 것은 1인 운영의 본질과 배치. **수용 가능한 위험**으로 판단.

---

## 4. 영향 (다른 결정 / 문서)

### 4.1 직접 영향 받는 문서

| 문서 | 갱신 필요 |
|---|---|
| `docs/PROJECT_MAP.md` | 예정 디렉토리 (`infra/supabase-deploy/`, `infra/eas/` 등) 확정 |
| `docs/00_development_handoff.md` | 이미 잠정 결정 반영됨, M1 후 v1.0 갱신 |
| `docs/SERVICE_REVIEW_QA.md §8` | 기획 단계 잠정 결정과 정합 — 변경 없음 |
| `packages/contracts/` (M1 후반) | Supabase types 자동 생성 통합 |
| `apps/mobile/` (M2 W5) | Expo 프로젝트 scaffold |
| `apps/api/` (M2 W6) | Supabase Edge Functions 프로젝트 scaffold |
| `infra/supabase/` (M2 W6) | migration / RLS policies / seed |
| `infra/eas/` (M2 W6) | eas.json + 환경 설정 |

### 4.2 결정에 의존하는 후속 ADR

| ADR | 영향 |
|---|---|
| ADR-0002 Domain Model 추상화 범위 | 본 결정의 9개 경계면이 입력 |
| ADR-0003 Harness 도구 선택 | Langfuse cloud free tier (후보 A의 일부) → M3에서 봉인 |
| ADR-0004 RLS 정책 매트릭스 | Supabase RLS 채택이 입력, M2-S2 전 작성 |
| ADR-0005 (예정) TTS provider 선택 | M2 첫 콘텐츠 batch에서 선택 |

---

## 5. 보류된 후속 결정

| 항목 | 결정 시점 |
|---|---|
| TTS provider (Google / Azure / Naver Clova / ElevenLabs) | M2-S2 (W6) 콘텐츠 첫 batch 시작 시 |
| Langfuse 도입 여부 + ADR-0003 | M3 진입 시 (W13) |
| Supabase 리전 선택 (us-east / eu-west / ap-northeast) | M2-S1 (W5) project 생성 시 — UK GDPR 영향 검토 |
| BigQuery export 활성화 시점 | DAU 1k 도달 또는 분석 질문 명확 시 (CC2-23) |

---

## 6. 측정 / 검증 (이 결정이 옳은지 어떻게 알 것인가)

### 6.1 결정의 baseline (M1 종료 시점)

- 인프라 월 비용: $0 (Supabase Free / Firebase Spark / RevenueCat 무료) + TTS 1회 ~$10
- 1인 개발자 부담: 컴포넌트 5개 (Mobile / Supabase / RC / Firebase / EAS)
- 출시 일정 가정: 20주

### 6.2 결정의 검증 시점

| 시점 | 검증 항목 | 합격 기준 |
|---|---|---|
| M2 종료 (W12) | 첫 thin vertical slice E2E 동작 | J-001 시연 + 핵심 5 trace |
| M3 종료 (W14) | 87 golden case 회귀 통과 | 14일 100% |
| M5 종료 (W18) | 5개국 베타 30명 모집 + 결제 sandbox 통과 | beta GA-ready |
| 출시 +30일 | 인프라 실제 비용 측정 | 월 $25 이하 (Supabase Pro 도달 직전) |
| 출시 +90일 | DAU 100 / 1k 시 비용 곡선 | A-202 가정 검증 |

### 6.3 결정 번복 트리거

다음 중 하나 발생 시 ADR-0001 갱신 또는 ADR-NNNN으로 stack 재결정:

- Supabase 가격 인상 ≥ 50% (서비스 종료 시 즉시)
- DAU 10k 도달 + 비용 곡선 후보 B 대비 ≥ 30% 이상 비효율
- EU/EEA 출시 결정 + 데이터 거주자 요구
- B2B/Enterprise 고객 발생 + private networking 요구
- 1인 개발자 → 팀 확장 시 layer 분리 필요

---

## 7. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M1-9 v1.0 — 후보 A 봉인. ADR-0001로 발효 | architect (orchestrator 승인 D-007) |
