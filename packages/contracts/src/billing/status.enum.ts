/**
 * Subscription entitlement status enum (CC2-08, CC3-05)
 *
 * RC webhook 이벤트 → 본 enum 매핑은 EVALUATION_SCENARIOS §3.1 참조.
 * status별 entitlement 권한은 ADR-0004 RLS + USER_JOURNEYS J-005 참조.
 */
import { z } from "zod";

export const EntitlementStatusEnum = z.enum([
  "active", // INITIAL_PURCHASE / RENEWAL
  "grace_period", // BILLING_ISSUE + grace_period_ends_at 존재
  "billing_retry", // BILLING_ISSUE 단독 (grace 없음, 24h만 active 유지 후 강등)
  "expired", // EXPIRATION
  "refunded", // REFUND
  "revoked", // REVOKE
  "transferred", // TRANSFER (새 user_id로 active 이전)
  "cancelled", // CANCELLATION + will_renew=false (period_ends_at까지 active)
  "unknown", // 스키마 외 — 안전 강등 (free)
]);

export type EntitlementStatus = z.infer<typeof EntitlementStatusEnum>;

/**
 * 각 status가 클라이언트 entitlement(active/free) 매핑되는 함수
 */
export function isPremiumActive(status: EntitlementStatus, periodEndsAt?: Date, gracePeriodEndsAt?: Date, now: Date = new Date()): boolean {
  switch (status) {
    case "active":
    case "transferred":
      return true;
    case "grace_period":
      return gracePeriodEndsAt ? gracePeriodEndsAt > now : false;
    case "billing_retry":
      // 24시간 임시 유지 (CC3-05)
      // TODO: M2-S2에서 last_synced_at 기준으로 24h 계산
      return true;
    case "cancelled":
      return periodEndsAt ? periodEndsAt > now : false;
    case "expired":
    case "refunded":
    case "revoked":
    case "unknown":
      return false;
  }
}
