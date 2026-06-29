/**
 * TraceCollector — Tracing 추상화 (ADR-0002)
 *
 * 현재 구현 (M2): structured console JSON
 * 교체 가능 (M3 후반): Langfuse SDK (ADR-0003에서 결정)
 */

export interface Span {
  setAttribute(key: string, value: unknown): void;
  recordException(error: Error): void;
  end(): void;
}

export interface TraceCollector {
  startSpan(name: string, attrs?: Record<string, unknown>): Span;
  recordEvent(name: string, attrs?: Record<string, unknown>): void;
  flush(): Promise<void>;
}
