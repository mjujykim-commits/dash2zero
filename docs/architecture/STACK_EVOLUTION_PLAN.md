# dash2zero — Stack Evolution Plan

> 작성: architect agent (M1, 2026-05-07)
> 상위 SSOT: STACK_DECISION.md (후보 A 채택)
> 목적: **단계별 진화 트리거 + 마이그레이션 비용** (사용자 지시 §9-4, §9-5)
> Skill 사용: software-architecture · prompt-engineering

---

## 1. 핵심 철학 (재명시)

- **"지금은 가볍게, 갈아끼울 부분은 미리 분리"** (사용자 지시 §2)
- 영구 확정 금지 — 마이그레이션 트리거가 도달하면 재평가
- 하지만 트리거 도달 전에는 후보 A에 집중, 추상화 비용을 미리 투자하지 않음
- 추상화는 9개 경계면(DOMAIN_MODEL §7)에 한정 — 그 외는 직접 구현

---

## 2. 진화 단계 (4 phase)

| Phase | 시점 | 스택 | 특징 |
|---|---|---|---|
| **Phase 1: Lean (현재)** | M0 ~ M5+ (~DAU 1k) | 후보 A 그대로 | Supabase Free / Firebase Spark / RC 무료 |
| **Phase 2: Growth** | DAU 1k ~ 10k | 후보 A + Supabase Pro + (선택) Langfuse cloud | 월 $25-100, 일부 자체 메트릭 추가 |
| **Phase 3: Balanced** | DAU 10k+ 또는 EU 진입 또는 비용 역전 | 후보 B 또는 후보 A + 자체 백엔드 일부 | 월 $100-500, vendor 다변화 |
| **Phase 4: Enterprise** | B2B 발생 또는 private networking 요구 | 후보 C | 월 $500+, 1인 → 팀 |

---

## 3. 마이그레이션 트리거 (정량)

### 3.1 비즈니스 지표 트리거

| 트리거 | 수치 | 영향 받는 영역 | 다음 단계 |
|---|---|---|---|
| **MAU** | 1,000 | Supabase Free → Pro | Phase 2 진입 |
| **MAU** | 10,000 | Supabase Pro 한계 + 자체 백엔드 검토 | Phase 3 검토 |
| **MAU** | 50,000+ | Postgres 단일 → 분산 / 캐시 layer | Phase 3 본격 |
| **DAU/MAU 비율** | 35%+ | 부하 패턴 변화 — Edge Functions 콜드스타트 점검 | Phase 2 후반 |
| **결제 사용자** | 1,000 | RC MTR 무료 한도 도달 (~$2.5K MRR) | RC 1% 수수료 시작, 저비용 유지 |

### 3.2 운영 지표 트리거

| 트리거 | 수치 | 다음 단계 |
|---|---|---|
| **인프라 월 비용** | $100+ | 비용 곡선 검토 (후보 A vs B 재평가) |
| **인프라 월 비용** | $500+ | Phase 3 본격 검토 (자체 PG / 자체 백엔드) |
| **Supabase 응답 p95** | > 800ms (NFR baseline 위반) | Edge region 추가 또는 자체 백엔드 |
| **Storage egress** | > 100GB/mo | Cloudflare R2 또는 CDN 도입 |
| **Edge Functions 호출** | 100만/mo+ | 자체 백엔드 일부 이전 검토 |
| **Crash-free** | < 99% (baseline 위반) | 도구 재검토 (Sentry 추가 등) |
| **Webhook 처리 지연** | p95 > 5초 | 자체 큐 도입 (Inngest / SQS) |

### 3.3 규제 / 비즈니스 결정 트리거

| 트리거 | 다음 단계 |
|---|---|
| **EU/EEA 출시 결정** | 데이터 거주자 분리 → Supabase EU 리전 또는 self-host Phase 3 |
| **B2B / Enterprise 고객 발생** | private networking / SAML / SSO → Phase 4 |
| **SOC 2 / ISO 27001 요구** | self-host audit log + 보존 5년+ → Phase 4 |
| **감독기관 (ICO / FTC) 조사** | DPIA + 처리방침 강화 — Phase 무관 |
| **C-13 한국 사업자 → 해외 법인 전환** | 약관/세금 재작성, 결제 수령 주체 변경 |

### 3.4 팀 변화 트리거

| 트리거 | 다음 단계 |
|---|---|
| **개발자 1 → 2-3명** | 후보 B 진입 검토 (layer 분리 필요) |
| **개발자 → 5명+** | 후보 C 진입 (IaC / private VPC / observability 강화) |
| **외부 검수자 → 정규 콘텐츠 팀** | 운영 어드민 정식 개발 (Supabase Studio → 자체 web admin) |

---

## 4. 9개 경계면별 진화 경로 (DOMAIN_MODEL §7)

### 4.1 Auth

```
Phase 1: Supabase Auth + Apple/Google/Magic Link
  ↓ 트리거: Phase 4 (Enterprise SAML/SSO 요구)
Phase 4: Auth0 / Cognito / 자체 OAuth 서버
```

마이그레이션 비용: **중-높음**. user_id 매핑은 보존 가능, 외부 OAuth 토큰 갱신 필요.

### 4.2 Database

```
Phase 1: Supabase Postgres (managed)
  ↓ 트리거: MAU 10k+ 또는 비용 역전 또는 EU 거주자 요구
Phase 3: 자체 Postgres (Neon / RDS / Aurora) — 동일 SQL 그대로
  ↓ 트리거: MAU 100k+ 또는 분산 요구
Phase 4: Aurora cluster + read replica + RDS Proxy
```

마이그레이션 비용: **낮음**. PG dump → restore. 단 RLS 정책은 Hasura/PostgREST로 재구현 필요.

### 4.3 Storage

```
Phase 1: Supabase Storage (S3 호환)
  ↓ 트리거: Storage egress > 100GB/mo
Phase 2: + Cloudflare R2 (egress free)
  ↓ 트리거: 글로벌 레이턴시 개선 필요
Phase 3: + CloudFront / Cloudflare CDN
```

마이그레이션 비용: **낮음**. URL 형식만 변경, audio_assets.audio_url 재작성.

### 4.4 Queue / Background Job

```
Phase 1: 미사용 (Edge Functions가 대부분 처리)
  ↓ 트리거: 30일 hard-delete cron 외 새 job 발생 또는 webhook 처리 지연
Phase 2: Supabase pg_cron + Edge Functions
  ↓ 트리거: 100만 호출/mo 또는 long-running job
Phase 3: Inngest / BullMQ + Redis (Upstash)
```

마이그레이션 비용: **중간**. job 정의 표준화 필요.

### 4.5 Model Provider (TTS)

```
Phase 1 (M2 결정): Google Cloud TTS / Azure / Naver Clova / ElevenLabs 중 1개
  ↓ 트리거: 단가 변경 또는 품질 이슈
Phase 1 후반: provider 교체 (audio_assets.provider 컬럼만 변경)
```

마이그레이션 비용: **낮음** (audio 재생성만 필요, 600 파일 ~$10).

### 4.6 Observability

```
Phase 1: Crashlytics + Firebase Analytics
  ↓ 트리거: M3 진입 (W13), trace 통합 필요
Phase 2: + Langfuse cloud free tier
  ↓ 트리거: MAU 10k+ 또는 EU 거주자 요구
Phase 3: + Langfuse self-host (Supabase 같은 region)
  ↓ 트리거: Phase 4
Phase 4: Datadog + Honeycomb + OpenTelemetry
```

마이그레이션 비용: **낮음 → 중간**. SDK 추상화 시 Phase 1→2 전환 비용 매우 작음.

### 4.7 Billing

```
Phase 1: RevenueCat + Apple/Google IAP
  ↓ 트리거: B2B 발생 (post-MVP)
Phase 4: + Stripe (B2B subscription)
```

마이그레이션 비용: **중간**. RC 추상화 유지하면서 Stripe 추가.

### 4.8 Search / Vector

```
Phase 1: 미사용 (단어 검색은 Postgres FTS로 충분)
  ↓ 트리거: 단어 추천 / 의미 검색 발생 (post-MVP)
Phase 3: pgvector + embeddings
  ↓ 트리거: Phase 4
Phase 4: 전용 Vector DB (Pinecone / Weaviate)
```

마이그레이션 비용: **중간**. embeddings 재생성.

### 4.9 Notification

```
Phase 1: Expo Notifications (FCM/APNs 추상화)
  ↓ 트리거: 마케팅 push 운영 발생 (post-MVP)
Phase 2: + OneSignal (campaign 관리)
  ↓ 트리거: Phase 4
Phase 4: + Pinpoint / Braze / Customer.io
```

마이그레이션 비용: **낮음**. push token 마이그레이션 필요.

---

## 5. 마이그레이션 비용 추정 표

| 경계면 | Phase 1→2 | Phase 2→3 | Phase 3→4 |
|---|---|---|---|
| Auth | - | 낮음 | 중-높음 |
| Database | - | 낮음 (PG dump) | 중간 (분산) |
| Storage | - | 낮음 (URL 형식) | 낮음 |
| Queue | - | 중간 (job 표준화) | 낮음 |
| TTS | 낮음 (M2 결정 시) | - | - |
| Observability | 매우 낮음 (SDK 추가) | 중간 (self-host) | 중간 |
| Billing | - | - | 중간 (Stripe 추가) |
| Search | - | 중간 (pgvector) | 중간 (vector DB) |
| Notification | 낮음 | - | 낮음 |

→ **결론**: Phase 1 → Phase 2 전환 비용은 **매우 낮음** (Langfuse 추가 + Supabase Pro 전환만). Phase 3 본격 전환은 비용이 누적되므로 트리거가 도달하기 전에 사전 작업 필요.

---

## 6. 지금 하드코딩하는 것 vs 추상화하는 것 (사용자 지시 §9-4)

### 6.1 하드코딩 (M1-M5에서 직접 사용)

| 영역 | 하드코딩 사유 |
|---|---|
| `@supabase/supabase-js` SDK 직접 호출 (앱 일부) | M5까지 vendor 변경 트리거 도달 어려움 |
| `RevenueCat` SDK 직접 호출 | 추상화 비용 vs 효용 — 추상화 후 Stripe 추가 시점에 추상화 |
| `expo-notifications` 직접 호출 | Expo 의존이라 추상화 의미 적음 |
| `firebase/analytics` SDK 직접 호출 | M3 후반 Langfuse 도입 시 추상화 추가 |

### 6.2 추상화 (Contract Layer 인터페이스로 분리)

| 영역 | 추상화 인터페이스 (M1 후반 작성) |
|---|---|
| TTS provider | `audioGenerator.ts` — providerId 컬럼 + provider별 어댑터 |
| Storage URL | `storageProvider.ts` — getUrl/getSigned 어댑터 |
| Trace collector | `traceCollector.ts` — Langfuse 또는 console JSON 어댑터 |
| Auth provider | `authClient.ts` — 토큰 발급/갱신 추상화 |
| Webhook handler | `webhookHandler.ts` — RC + (post-MVP) Stripe 어댑터 |

→ **5개 추상화만 미리 한다**. 그 외는 도구 직접 사용.

---

## 7. 진화 사이클 운영

### 7.1 분기별 점검 (post-launch)

각 분기 종료 시 orchestrator가 본 문서 §3 트리거를 점검:

- **MAU / DAU / 결제 사용자 수** vs 트리거 임계값
- **인프라 월 비용** vs $100 / $500 임계값
- **NFR baseline 이탈** (응답 p95, crash-free 등)
- **규제 / B2B 결정** 변경 사항

점검 결과 트리거 도달 시 `docs/adr/ADR-NNNN-{phase-X-migration}.md` 작성.

### 7.2 ADR 연결

| ADR | 진화 단계 |
|---|---|
| ADR-0001 (현재) | Phase 1 채택 |
| ADR-0006~ (예정, post-launch) | Phase 1 → 2 전환 (DAU 1k 도달 시) |
| ADR-0007~ | Phase 2 → 3 전환 |

---

## 8. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M1-10 v1.0 — 4 phase 진화 단계 + 비즈니스/운영/규제/팀 트리거 + 9 경계면별 진화 경로 + 마이그레이션 비용 추정 | architect |
