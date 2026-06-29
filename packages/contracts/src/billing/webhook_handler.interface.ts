/**
 * WebhookHandler — Webhook 추상화 (ADR-0002)
 *
 * 현재 구현 (M2): RevenueCat webhook → Supabase Edge Function
 * 교체 가능 (post-MVP): + Stripe webhook (B2B subscription 추가 시)
 */

export interface HandlerContext {
  supabase: unknown; // Supabase client (service_role)
  audit: (action: string, target: { table: string; id: string }, before?: unknown, after?: unknown) => Promise<void>;
  trace: { recordEvent: (name: string, attrs?: Record<string, unknown>) => void };
}

export interface WebhookHandler<TEvent = unknown> {
  /** 시그니처 검증 (위변조 거부) */
  verifySignature(headers: Record<string, string>, body: string): boolean;

  /** Body 파싱 (zod 검증 포함) */
  parse(body: string): TEvent;

  /** 처리 (멱등 — last_rc_event_id로 dedup) */
  handle(event: TEvent, ctx: HandlerContext): Promise<void>;

  /** Provider 식별자 */
  readonly providerId: string;
}
