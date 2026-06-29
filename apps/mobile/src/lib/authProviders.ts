/**
 * Auth provider wrappers — Apple / Google
 *
 * 결정:
 *   - CC-03: Apple Sign In (Supabase web OAuth flow — 양 플랫폼 통일)
 *   - Google Sign In (Supabase web OAuth flow)
 *   - Email Magic Link (supabase.auth.signInWithOtp + deep link callback)
 *
 * Apple Sign In 구현 (2026-06-29 변경):
 *   - 기존 iOS 분기는 native expo-apple-authentication을 썼으나, (1) 해당 패키지가
 *     package.json 의존에 없어 빌드가 깨지고, (2) 무료 Apple 서명(Personal Team)으로는
 *     'Sign in with Apple' capability/entitlement 자체가 발급되지 않는다.
 *   - 따라서 iOS도 Android와 동일하게 Supabase web OAuth flow(expo-web-browser)로 통일.
 *     native 모듈/entitlement 불필요 → Expo Go·무료 사이드로드·정식 빌드 모두 동작.
 *   - 개인(게스트) 사용에는 로그인 자체가 선택 — 미설정 시 게스트 모드로 학습 진행.
 *   - 정식 출시(GA)에서 native Apple Sign In 복원 시: expo-apple-authentication 의존 추가 +
 *     app.json plugin + Apple Developer 'Sign in with Apple' Service ID 구성 후 iOS 분기 재도입.
 */

import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "./supabase";
import { logEvent, setUserId } from "./analytics";
import { initPurchases } from "./purchases";

WebBrowser.maybeCompleteAuthSession();

// ============================================================================
// Apple Sign In — Supabase web OAuth flow (양 플랫폼 공통, native 모듈 없음)
// ============================================================================

export async function signInWithApple(): Promise<{ success: boolean; userId?: string; error?: string }> {
  return signInWithProvider("apple");
}

// ============================================================================
// Google Sign In
// ============================================================================

export async function signInWithGoogle(): Promise<{ success: boolean; userId?: string; error?: string }> {
  return signInWithProvider("google");
}

// ============================================================================
// 공통 Supabase web OAuth flow (Apple / Google 공유)
// ============================================================================

async function signInWithProvider(
  provider: "apple" | "google"
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const redirectUri = AuthSession.makeRedirectUri({ scheme: "dash2zero", path: "auth/callback" });
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
    const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUri)}`;

    const result = await WebBrowser.openAuthSessionAsync(oauthUrl, redirectUri);
    if (result.type !== "success") {
      return { success: false, error: "user_cancelled" };
    }

    // URL fragment에서 access_token 추출 (Supabase implicit flow)
    const url = new URL(result.url);
    const params = new URLSearchParams(url.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return { success: false, error: "no_tokens_in_callback" };
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error || !data.session) throw error ?? new Error(`${provider}_signin_failed`);

    const userId = data.session.user.id;
    await setUserId(userId);
    await initPurchases(userId);
    await logEvent("account_logged_in", { provider, platform: Platform.OS });

    return { success: true, userId };
  } catch (err: any) {
    return { success: false, error: err.message ?? `${provider}_signin_failed` };
  }
}
