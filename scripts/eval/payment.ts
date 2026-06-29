/**
 * Payment Evaluator — dash2zero harness (ADR-0003)
 *
 * 입력: golden YAML 1건 (PaymentCase)
 * 처리: _shared/billing.ts의 mapStatus / isPremiumActive 호출
 *       + idempotency 시뮬레이션 (last_rc_event_id 중복 여부)
 *       + signature 검증 시뮬레이션
 * 출력: pass / diff[]
 *
 * 정합성: apps/api/edge-functions/_shared/billing.ts SoT 직접 import
 * 책임 agent: backend + analytics
 */

import {
  mapStatus,
  isPremiumActive,
  type RcEventType,
  type EntitlementStatus,
} from "../../apps/api/edge-functions/_shared/billing";

export interface PaymentCase {
  id: string;
  description: string;
  category:
    | "mapping"
    | "idempotent"
    | "signature"
    | "premium_active"
    | "grace_period"
    | "billing_retry_window"
    | "cancellation_until_period_end";
  input: {
    event_type?: RcEventType;
    grace_period_expiration_at_ms?: number | null;
    last_rc_event_id?: string;
    db_last_rc_event_id?: string | null;
    authorization?: string;
    expected_authorization?: string;
    status?: EntitlementStatus;
    period_ends_at?: string | null;
    last_synced_at?: string | null;
    now?: string;
  };
  expected: {
    status?: EntitlementStatus;
    is_premium?: boolean;
    http_status?: number;
    outcome?: "applied" | "idempotent_skip" | "invalid_signature";
  };
}

export interface EvalResult {
  pass: boolean;
  diff: string[];
}

function check(field: string, actual: unknown, expected: unknown, diff: string[]): void {
  if (expected === undefined) return;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    diff.push(`${field}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
  }
}

export function evaluatePaymentCase(c: PaymentCase): EvalResult {
  const diff: string[] = [];
  const i = c.input;

  switch (c.category) {
    case "mapping": {
      if (!i.event_type) {
        diff.push("event_type required for mapping category");
        break;
      }
      const status = mapStatus(i.event_type, i.grace_period_expiration_at_ms);
      check("status", status, c.expected.status, diff);
      break;
    }

    case "idempotent": {
      const isDup = i.last_rc_event_id && i.last_rc_event_id === i.db_last_rc_event_id;
      const outcome = isDup ? "idempotent_skip" : "applied";
      const httpStatus = 200;
      check("outcome", outcome, c.expected.outcome, diff);
      check("http_status", httpStatus, c.expected.http_status, diff);
      break;
    }

    case "signature": {
      const valid = i.authorization && i.authorization === i.expected_authorization;
      const httpStatus = valid ? 200 : 401;
      const outcome = valid ? "applied" : "invalid_signature";
      check("http_status", httpStatus, c.expected.http_status, diff);
      check("outcome", outcome, c.expected.outcome, diff);
      break;
    }

    case "premium_active":
    case "grace_period":
    case "billing_retry_window":
    case "cancellation_until_period_end": {
      if (!i.status) {
        diff.push("status required for premium_active category");
        break;
      }
      const isPremium = isPremiumActive(i.status, {
        periodEndsAt: i.period_ends_at ? new Date(i.period_ends_at) : null,
        lastSyncedAt: i.last_synced_at ? new Date(i.last_synced_at) : null,
        now: i.now ? new Date(i.now) : undefined,
      });
      check("is_premium", isPremium, c.expected.is_premium, diff);
      break;
    }
  }

  return { pass: diff.length === 0, diff };
}
