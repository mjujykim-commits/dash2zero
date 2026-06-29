/**
 * Expo Router Root Layout
 *
 * First-run 흐름 제어 (CC2-18 + USER_JOURNEYS J-001):
 *   index → age-gate → privacy-choices → onboarding → home
 *
 * 분석/Crashlytics는 default disabled (CC3-04 / EVALUATION_SCENARIOS PRIV-002)
 * privacy-choices 화면에서 사용자 동의 후 setAnalyticsCollectionEnabled(true)
 */

import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppState } from "react-native";
import { StatusBar } from "expo-status-bar";

import { lightColors } from "@dash2zero/design-tokens";

import { ToastProvider } from "@/src/components/d022";
import { initAudio, stopAudio } from "@/src/lib/audio";
import { initGuestDb } from "@/src/lib/guestStore";
import { flushRetryQueue } from "@/src/lib/attemptQueue";
import { onTransitionOnline } from "@/src/lib/connectivity";
import { initHaptics } from "@/src/lib/haptics";
import { initSound } from "@/src/lib/sound";
import { supabase } from "@/src/lib/supabase";

export default function RootLayout() {
  useEffect(() => {
    // CC3-04: Analytics/Crashlytics는 동의 전 disabled
    // M2-S4에서 privacy-choices 화면이 동의 처리 후 활성화

    // Audio session 초기화 — iOS playsInSilentModeIOS=true (Q-FE-NEW-003)
    void initAudio();

    // 게스트 모드 SQLite + SecureStore 초기화 (CC-04)
    void initGuestDb();

    // Haptic Feedback 사용자 설정 적재 (D-024 Apple HIG 정합)
    void initHaptics();

    // SFX(UI 효과음) 사용자 설정 적재 + 등록 음원 preload (음원 미수급 시 no-op)
    void initSound();

    // 첫 mount 시 retry queue flush (인증 사용자만)
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await flushRetryQueue().catch((err) => console.warn("[layout] initial flush failed:", err));
      }
    })();

    // AppState 전이 처리:
    //   active   → retry queue flush
    //   background/inactive → 현재 재생 중 audio 중단 (CC2-25 — 무음 모드 우회는 학습 발음 한정)
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void (async () => {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            await flushRetryQueue().catch((err) => console.warn("[layout] focus flush failed:", err));
          }
        })();
      } else if (state === "background" || state === "inactive") {
        void stopAudio().catch(() => undefined);
      }
    });

    // 네트워크 offline → online 전이 시 즉시 retry flush (background-foreground 사이클 없이도 회복)
    const netSub = onTransitionOnline(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await flushRetryQueue().catch((err) => console.warn("[layout] online flush failed:", err));
      }
    });

    return () => {
      sub.remove();
      netSub();
    };
  }, []);

  return (
    <ToastProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: lightColors["surface.bg"] },
          // Motion v1.1 Q-MOTION-3 [a] — Expo Router 내장 slide_from_right (네이티브 OS 최적)
          animation: "slide_from_right",
          animationDuration: 300,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="age-gate" />
        <Stack.Screen name="privacy-choices" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="home" />
        <Stack.Screen name="lesson/[wordId]" />
        <Stack.Screen name="progress" />
      </Stack>
    </ToastProvider>
  );
}
