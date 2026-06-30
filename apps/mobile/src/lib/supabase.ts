/**
 * Supabase client + AuthClient 어댑터 (ADR-0002)
 *
 * 환경별 URL/anon key는 Expo extra config에서 읽음 (eas.json env에서 주입).
 * AuthClient 인터페이스 구현 — Phase 4 Auth0/Cognito 전환 시 본 파일만 교체.
 */

import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import type { AuthClient, Session as ContractSession, User as ContractUser } from "@dash2zero/contracts";

export const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // M2-S5: dev/staging/prod 별 EAS Secrets 주입 후 제거 (D-009)
  console.warn("[supabase] URL or ANON_KEY missing — set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

// SecureStore 어댑터 (RN 안전 저장)
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // RN은 deep link로 직접 처리
  },
});

/**
 * AuthClient 어댑터 (ADR-0002 인터페이스 구현)
 */
function toContractUser(supabaseUser: any): ContractUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? undefined,
    authProvider: detectProvider(supabaseUser),
    createdAt: new Date(supabaseUser.created_at),
  };
}

function detectProvider(u: any): ContractUser["authProvider"] {
  const provider = u.app_metadata?.provider ?? u.identities?.[0]?.provider;
  if (provider === "apple") return "apple";
  if (provider === "google") return "google";
  return "email_magic_link";
}

function toContractSession(s: any): ContractSession {
  return {
    user: toContractUser(s.user),
    accessToken: s.access_token,
    refreshToken: s.refresh_token,
    expiresAt: new Date((s.expires_at ?? Date.now() / 1000 + 3600) * 1000),
  };
}

export const supabaseAuthClient: AuthClient = {
  async signInWithApple(idToken: string, nonce?: string) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: idToken,
      nonce,
    });
    if (error || !data.session) throw error ?? new Error("apple_signin_failed");
    return toContractSession(data.session);
  },

  async signInWithGoogle(idToken: string) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });
    if (error || !data.session) throw error ?? new Error("google_signin_failed");
    return toContractSession(data.session);
  },

  async sendMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Universal Link / App Link (FE-DOC-006) — M2-S6에 정확한 deep link 설정
        emailRedirectTo: "dash2zero://auth/callback",
        shouldCreateUser: true,
      },
    });
    if (error) throw error;
  },

  async verifyMagicLink(token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "magiclink",
    });
    if (error || !data.session) throw error ?? new Error("magic_link_verify_failed");
    return toContractSession(data.session);
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  getCurrentUser() {
    const session = supabase.auth.getSession();
    // getSession()은 Promise이므로 sync는 stub. 실제 사용 시 useAuth hook으로.
    void session;
    return null;
  },

  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) throw error ?? new Error("refresh_failed");
    return toContractSession(data.session);
  },
};
