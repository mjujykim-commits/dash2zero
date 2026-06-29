/**
 * Auth callback — Magic Link / OAuth deep link 처리 (FE-DOC-006 / R-19)
 *
 * Universal Link / App Link로 도착하는 콜백 처리.
 * URL: dash2zero://auth/callback?access_token=...&refresh_token=...&token_hash=...
 *
 * 책임 (FE-DOC-006):
 *   - magic link token 검증
 *   - 게스트 머지 트리거 (sign-in 직후 — CC2-04)
 *   - cold start handoff: 앱이 죽어있어도 동작
 *
 * iOS Universal Link AASA: apple-app-site-association (apps/mobile/public/.well-known/)
 * Android App Link assetlinks.json: (apps/mobile/public/.well-known/)
 */

import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/src/lib/supabase";
import { setUserId } from "@/src/lib/analytics";
import { initPurchases } from "@/src/lib/purchases";
import { triggerGuestMergeIfNeeded } from "@/src/hooks/useLesson";
import { clearGuestData } from "@/src/lib/guestStore";
import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";
import { GradientBackground, GlowOrb } from "@/src/components/d022";

const GUEST_DEVICE_KEY = "guest_device_install_id";
const GUEST_ATTEMPTS_KEY = "guest_attempts";

export default function AuthCallback() {
  const params = useLocalSearchParams<{
    token_hash?: string;
    type?: string;
    access_token?: string;
    refresh_token?: string;
    error?: string;
  }>();
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    void handleCallback();
  }, []);

  async function handleCallback() {
    try {
      if (params.error) {
        throw new Error(params.error);
      }

      // 1. token_hash로 magic link 검증 (Magic Link 흐름)
      if (params.token_hash && params.type === "magiclink") {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: params.token_hash,
          type: "magiclink",
        });
        if (error || !data.session) throw error ?? new Error("verify_failed");
      }
      // 2. access_token / refresh_token (OAuth implicit flow)
      else if (params.access_token && params.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (error) throw error;
      } else {
        throw new Error("invalid_callback");
      }

      // 3. 사용자 정보 + RC + analytics
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error("no_user_after_callback");

      await setUserId(userId);
      await initPurchases(userId);

      // 4. 게스트 머지 (SecureStore에서 device_install_id + attempts 읽기)
      const deviceId = await SecureStore.getItemAsync(GUEST_DEVICE_KEY);
      const attemptsRaw = await SecureStore.getItemAsync(GUEST_ATTEMPTS_KEY);
      const guestAttempts = attemptsRaw ? JSON.parse(attemptsRaw) : [];

      if (deviceId && guestAttempts.length > 0) {
        await triggerGuestMergeIfNeeded(deviceId, guestAttempts);
        // 머지 후 게스트 attempts 클리어 (SecureStore queue + SQLite guest_uws/attempts/daily_usage)
        await SecureStore.deleteItemAsync(GUEST_ATTEMPTS_KEY);
        await clearGuestData();
      }

      setStatus("ok");
      // 100ms 후 home으로 — 사용자가 "Signed in" 확인 가능
      setTimeout(() => router.replace("/home"), 400);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Sign-in failed.");
    }
  }

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.cyan" size={280} opacity={0.3} style={{ top: 80, right: -60 }} />
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing["space.5"],
        }}
      >
        {status === "working" && (
          <>
            <ActivityIndicator size="large" color={lightColors["neon.cyan"]} />
            <Text style={{ marginTop: spacing["space.4"], color: lightColors["text.secondary"] }}>
              Signing you in…
            </Text>
          </>
        )}
        {status === "ok" && (
          <Text style={{ fontSize: typeScale["text.heading.md"].fontSize, fontWeight: "800", color: lightColors["neon.lime"] }}>
            Signed in ✓
          </Text>
        )}
        {status === "error" && (
          <>
            <Text style={{ fontSize: typeScale["text.heading.md"].fontSize, fontWeight: "800", color: lightColors["semantic.danger"] }}>
              Sign-in failed
            </Text>
            {errorMsg && (
              <Text
                style={{
                  marginTop: spacing["space.2"],
                  color: lightColors["text.secondary"],
                  textAlign: "center",
                }}
              >
                {errorMsg}
              </Text>
            )}
            <Text
              style={{
                marginTop: spacing["space.6"],
                color: lightColors["neon.cyan"],
                fontSize: typeScale["text.body"].fontSize,
                fontWeight: "600",
              }}
              onPress={() => router.replace("/auth/sign-in")}
            >
              Try again
            </Text>
          </>
        )}
      </View>
    </GradientBackground>
  );
}
