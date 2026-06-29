/**
 * RevenueCat Purchases — NO-OP 스텁 (개인 빌드, 2026-06-29)
 *
 * 배경:
 *   - 원본은 react-native-purchases(네이티브 모듈) wrapper였으나,
 *     (1) Expo Go에 해당 네이티브 모듈이 없어 import 시 크래시하고,
 *     (2) 개인 사용 빌드에서는 콘텐츠가 전부 잠금 해제(PERSONAL_UNLOCK_ALL)되어 결제가 불필요하다.
 *   - 따라서 네이티브 의존을 제거하고 공개 API 시그니처만 보존한 no-op으로 대체.
 *   - 호출부(paywall / settings / authProviders / auth callback)는 수정 없이 동작.
 *
 * 정식 출시(GA) 복원:
 *   - git 이력의 RevenueCat 버전 purchases.ts 복구 + package.json에 react-native-purchases 재추가 +
 *     RevenueCat 대시보드 product 구성 + EXPO_PUBLIC_REVENUECAT_API_KEY_IOS 설정.
 *   - 가격 D-018: $4.99/mo · $49.99/yr.
 */

import { logEvent } from "./analytics";

// 원본은 react-native-purchases의 타입이었음 — 스텁에서는 느슨한 별칭 유지(호출부 호환).
export type PurchasesPackage = any;

const DEBUG_LOG = typeof __DEV__ !== "undefined" && __DEV__;

/** RC 초기화 — no-op (수집/결제 없음). */
export async function initPurchases(_userId: string | null): Promise<void> {
  if (DEBUG_LOG) console.log("[purchases:stub] initPurchases", _userId);
}

export interface PaywallOffering {
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
  monthlyPriceString: string;
  annualPriceString: string;
}

/** 오퍼링 — 표시용 기본 가격 문자열만 반환(실 결제 패키지 없음). */
export async function fetchOfferings(): Promise<PaywallOffering> {
  return {
    monthly: null,
    annual: null,
    monthlyPriceString: "$4.99 / month",
    annualPriceString: "$49.99 / year",
  };
}

export interface PurchaseResult {
  success: boolean;
  isPremium: boolean;
  cancelled?: boolean;
  error?: string;
}

/** 구매 — 개인 빌드에서는 비활성. 콘텐츠는 이미 전부 접근 가능. */
export async function purchasePackage(_pkg: PurchasesPackage): Promise<PurchaseResult> {
  if (DEBUG_LOG) console.log("[purchases:stub] purchasePackage (disabled)");
  return { success: false, isPremium: false, error: "purchases_disabled_personal_build" };
}

/** Restore — no-op. */
export async function restorePurchases(): Promise<PurchaseResult> {
  await logEvent("subscription_restore_started");
  if (DEBUG_LOG) console.log("[purchases:stub] restorePurchases (no-op)");
  return { success: true, isPremium: false };
}

/** 현재 entitlement — 개인 빌드는 free로 취급(콘텐츠 게이팅은 서버 PERSONAL_UNLOCK_ALL이 처리). */
export async function getCurrentEntitlement(): Promise<{ isPremium: boolean; productId: string | null }> {
  return { isPremium: false, productId: null };
}
