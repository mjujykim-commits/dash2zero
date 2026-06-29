/**
 * Shared billing logic for Edge Functions + evaluators (CC2-08 + CC3-05)
 *
 * Source of truth for RevenueCat event → EntitlementStatus mapping.
 * Used by: revenuecat-webhook/index.ts, scripts/eval/payment.ts
 *
 * Deno + Node 양쪽 runtime 호환 (순수 함수).
 */

export type RcEventType =
  | "INITIAL_PURCHASE" | "RENEWAL" | "BILLING_ISSUE"
  | "EXPIRATION" | "CANCELLATION" | "REFUND"
  | "REVOKE" | "TRANSFER" | "UNCANCELLATION"
  | "PRODUCT_CHANGE" | "TEST" | "SUBSCRIBER_ALIAS";

export type EntitlementStatus =
  | "active" | "grace_period" | "billing_retry" | "expired"
  | "refunded" | "revoked" | "transferred" | "cancelled" | "unknown";

/**
 * RC 이벤트 → EntitlementStatus 매핑 (CC2-08 + CC3-05).
 *
 * 결정 표:
 *   INITIAL_PURCHASE / RENEWAL / UNCANCELLATION / PRODUCT_CHANGE → active
 *   BILLING_ISSUE + grace_period_ends → grace_period
 *   BILLING_ISSUE 단독 → billing_retry (24h 임시 유지 후 강등)
 *   EXPIRATION → expired
 *   CANCELLATION (will_renew=false, 만료 전까지 유효) → cancelled
 *   REFUND → refunded
 *   REVOKE → revoked
 *   TRANSFER → transferred
 *   TEST / SUBSCRIBER_ALIAS → ignored (no state change — caller가 별도 처리)
 *   기타 → unknown (안전 free 강등)
 */
export function mapStatus(
  eventType: RcEventType,
  gracePeriodMs?: number | null
): EntitlementStatus {
  switch (eventType) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
      return "active";
    case "BILLING_ISSUE":
      return gracePeriodMs ? "grace_period" : "billing_retry";
    case "EXPIRATION":
      return "expired";
    case "CANCELLATION":
      return "cancelled";
    case "REFUND":
      return "refunded";
    case "REVOKE":
      return "revoked";
    case "TRANSFER":
      return "transferred";
    case "TEST":
    case "SUBSCRIBER_ALIAS":
      return "active"; // ignored at caller — no state change
    default:
      return "unknown";
  }
}

/**
 * EntitlementStatus → 클라이언트 premium 활성 여부 (CC2-08).
 *
 *  - active / grace_period: premium 기능 사용 가능
 *  - billing_retry: 24h 임시 유지 (caller가 last_synced_at 기준 판단)
 *  - cancelled: period_ends_at 전까지 premium 유지
 *  - expired / refunded / revoked / transferred / unknown: free 강등
 */
export function isPremiumActive(
  status: EntitlementStatus,
  opts: {
    periodEndsAt?: Date | null;
    lastSyncedAt?: Date | null;
    now?: Date;
  } = {}
): boolean {
  const now = opts.now ?? new Date();

  switch (status) {
    case "active":
    case "grace_period":
      return true;
    case "billing_retry": {
      if (!opts.lastSyncedAt) return false;
      const ageMs = now.getTime() - opts.lastSyncedAt.getTime();
      return ageMs < 24 * 60 * 60 * 1000;
    }
    case "cancelled":
      if (!opts.periodEndsAt) return false;
      return now < opts.periodEndsAt;
    case "expired":
    case "refunded":
    case "revoked":
    case "transferred":
    case "unknown":
      return false;
  }
}
