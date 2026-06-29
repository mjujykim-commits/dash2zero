# ADR-0002 — Domain Model 추상화 범위 (Boundaries to Abstract)

- **상태**: **Accepted**
- **결정일**: 2026-05-08
- **작성**: architect agent
- **승인**: orchestrator
- **마일스톤**: M2-S1 (W5)
- **관련 문서**: ADR-0001 / DOMAIN_MODEL.md / STACK_EVOLUTION_PLAN.md

---

## Context

ADR-0001에서 후보 A (Lean / Managed) 봉인. 사용자 지시 §2 "교체 가능성 큰 경계면은 반드시 추상화" + §9-4 "갈아끼울 부분은 미리 분리". 그러나 추상화 비용이 크므로 **무엇을 추상화하고 무엇을 직접 사용할지** 명시적 결정 필요.

DOMAIN_MODEL §7에서 9개 경계면(Auth/DB/Storage/Queue/Model Provider/Observability/Billing/Search/Notification)을 식별. 본 ADR은 그 중 **5개를 추상화**하고 **4개는 직접 사용**으로 봉인.

---

## Decision

### A. 추상화할 5개 (Contract Layer 인터페이스로 분리)

| 경계면 | 인터페이스 위치 | 사유 | 교체 시점 (예상) |
|---|---|---|---|
| **Storage URL** | `packages/contracts/storage/storageProvider.ts` | Storage egress 비용 발생 시 Cloudflare R2/CDN 도입 가능성 (Phase 2) | DAU 1k+ 또는 월 egress 100GB+ |
| **TTS Provider** | `packages/contracts/audio/audioGenerator.ts` | 단가/품질 변경 시 Google ↔ Azure ↔ Naver Clova ↔ ElevenLabs 교체 (M2-S2 ADR-0005) | M2-S2 진입 시 즉시 |
| **Trace Collector** | `packages/contracts/observability/traceCollector.ts` | M3 후반 Langfuse 도입 시 console JSON ↔ Langfuse SDK 어댑터 | M3 후반 (ADR-0003) |
| **Auth Client** | `packages/contracts/auth/authClient.ts` | Phase 4 Auth0/Cognito 전환 가능성 (post-MVP) | post-MVP 또는 enterprise 진입 |
| **Webhook Handler** | `packages/contracts/billing/webhookHandler.ts` | post-MVP Stripe 추가 시 RC + Stripe 어댑터 패턴 | post-MVP B2B |

### B. 추상화하지 않을 4개 (직접 SDK 사용)

| 경계면 | 직접 사용 도구 | 사유 |
|---|---|---|
| **Database** | `@supabase/supabase-js` | Postgres SQL은 표준, vendor 변경 시 Postgres 그대로. 추상화 비용 > 효용 |
| **Queue / Background Job** | Supabase Edge Functions + pg_cron | M2까지 단순 cron만 필요. Phase 3 진입 시 Inngest 도입 시점에 추상화 |
| **Search / Vector** | (현재 미사용) | post-MVP에서 필요 시점에 추상화 결정 |
| **Notification** | `expo-notifications` | Expo 생태계 의존이라 추상화 의미 적음. post-MVP Phase 2에서 OneSignal 추가 시 추상화 |

---

## Rationale

### 추상화 vs 직접 사용 결정 원칙

1. **이미 표준 형식이 있는 것**: Postgres SQL, JSON Schema 등은 추상화 불필요
2. **교체 가능성이 12개월 내 발생**: 추상화 (TTS, Trace, Storage URL)
3. **추상화 비용 < 교체 비용**: 추상화 (Auth, Webhook)
4. **추상화 비용 ≥ 교체 비용**: 직접 사용 (Database, Queue, Search, Notification)

### 5개 추상화 인터페이스 설계 원칙

각 인터페이스는 다음을 만족:

- **단일 함수 시그니처** — 어댑터가 쉽게 교체 가능
- **No leaky abstraction** — Supabase/RC 내부 타입을 노출하지 않음
- **테스트 가능** — mock 어댑터로 단위 테스트
- **버전 관리** — `packages/contracts/` semver

### 인터페이스 미리보기 (M2-S2에서 구현)

```typescript
// storageProvider.ts
export interface StorageProvider {
  getPublicUrl(path: string): string;
  getSignedUrl(path: string, ttlSec: number): Promise<string>;
  upload(path: string, data: Blob | Buffer): Promise<{ path: string; hash: string }>;
}

// audioGenerator.ts
export interface AudioGenerator {
  generate(text: string, voiceId: string, lang: 'ko'): Promise<{ audioBuffer: Buffer; durationMs: number }>;
  listVoices(lang: 'ko'): Promise<Voice[]>;
}

// traceCollector.ts
export interface TraceCollector {
  startSpan(name: string, attrs?: Record<string, unknown>): Span;
  recordEvent(name: string, attrs?: Record<string, unknown>): void;
  flush(): Promise<void>;
}

// authClient.ts
export interface AuthClient {
  signInWithApple(idToken: string): Promise<Session>;
  signInWithGoogle(idToken: string): Promise<Session>;
  sendMagicLink(email: string): Promise<void>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
}

// webhookHandler.ts
export interface WebhookHandler<TEvent> {
  verifySignature(headers: Record<string, string>, body: string): boolean;
  parse(body: string): TEvent;
  handle(event: TEvent, ctx: HandlerContext): Promise<void>;
}
```

---

## Consequences

### Positive

- 5개 경계면 교체 시 어댑터만 작성하면 됨 (로직 변경 0)
- 단위 테스트가 mock 어댑터로 격리 가능
- post-MVP 진화 비용 감소

### Negative

- 5개 인터페이스 작성 비용 (~1 sprint day)
- 어댑터 패턴 추가 코드 (overhead 5-10%)
- "왜 추상화 vs 직접 사용"을 본 ADR로 매번 참조 필요

### Neutral

- 4개 미추상화 영역은 추후 필요 시 추상화 가능 — 본 ADR이 최종 결정 아님

---

## Alternatives Considered

### 9개 모두 추상화

- 거부: 추상화 비용 매우 높음, MVP 일정 위반
- Database / Queue 추상화는 효용 매우 낮음 (Postgres는 표준)

### 9개 모두 직접 사용 (추상화 0)

- 거부: vendor 교체 시 모든 코드 변경 필요, lock-in 위험 매우 큼

### 3개만 추상화 (TTS / Trace / Storage URL)

- 거부: Auth 변경 가능성 무시, post-MVP Stripe 추가 시 webhook handler 큰 비용 발생

---

## Validation

| 시점 | 검증 |
|---|---|
| M2-S2 (W6) | 5개 인터페이스 + 1차 어댑터 (Supabase / Google TTS / console / RC) 구현 |
| M3 후반 | Trace 어댑터 교체 (console → Langfuse) — ADR-0003에서 확정 |
| post-MVP | Storage URL 어댑터 추가 (Supabase + R2 라우팅) |

---

## Reversal Triggers

- 추상화 인터페이스의 사용 빈도 < 어댑터 1개 → 추상화 제거 검토 (1년 후)
- 어댑터 작성이 직접 사용보다 명백히 비효율 → 직접 사용으로 환원
- vendor 교체 발생 시 추상화 적합성 재검증

---

## References

- DOMAIN_MODEL.md §7 — 9 경계면 정의
- STACK_EVOLUTION_PLAN.md §4 — 9 경계면별 진화 경로
- ADR-0001 — 본 ADR의 stack decision 입력

---

## Change Log

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-08 | M2-S1 v1.0 — 5 추상화 + 4 직접 사용 봉인 | architect (orchestrator 승인) |
