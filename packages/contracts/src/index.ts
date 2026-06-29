/**
 * @dash2zero/contracts — Domain Contract SSOT
 *
 * 모든 API/Webhook/Manifest payload는 본 패키지의 zod schema를 통과해야 한다.
 * ADR-0001 (Stack) + ADR-0002 (Abstractions) + DOMAIN_MODEL.md 기준.
 *
 * 상태: M2-S2 W6 — 13 entity zod schema + 5 추상화 인터페이스 + status enum 완성.
 * M3 진입 전에 schemas.ts를 entity별 파일로 분리 예정 (현재는 응집 우선).
 */

// 모든 zod schema + TypeScript types
export * from "./schemas";

// Entitlement status enum (별도 파일 유지 — isPremiumActive helper)
export * from "./billing/status.enum";

// Abstractions (ADR-0002 인터페이스)
export type { StorageProvider } from "./content/storage_provider.interface";
export type { AudioGenerator, Voice, GeneratedAudio } from "./content/audio_generator.interface";
export type { TraceCollector, Span } from "./analytics/trace_collector.interface";
export type { AuthClient, User, Session } from "./user/auth_client.interface";
export type { WebhookHandler, HandlerContext } from "./billing/webhook_handler.interface";
