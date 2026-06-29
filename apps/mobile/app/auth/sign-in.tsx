/**
 * Sign-in 화면 (CC-03 + CC3-03)
 * 톤: D-022 K-pop Bold (mockup: docs/screens/v2-stunning/11-sign-in.html)
 *
 * 결정 사항:
 *   - Apple Sign In (iOS 필수, Android web flow 보조 — CC3-03)
 *   - Google Sign In
 *   - Email magic link (deep link 콜백 — FE-DOC-006)
 *   - 비밀번호 미사용
 *
 * 게스트 사용자 머지 트리거: 로그인 직후 device_install_id를 merge-guest Edge Function에 전송 (CC2-04)
 */

import { router } from "expo-router";
import { useState } from "react";
import { Alert, Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMotionPress } from "@/src/hooks/useMotionPress";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";
import { supabaseAuthClient } from "@/src/lib/supabase";
import { logEvent } from "@/src/lib/analytics";

import {
  GradientBackground,
  GlassCard,
  GlowOrb,
  NeonButton,
} from "@/src/components/d022";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleApple() {
    Alert.alert("Apple Sign In", "M2-S6 expo-apple-authentication 통합 예정");
  }

  async function handleGoogle() {
    Alert.alert("Google Sign In", "M2-S6 expo-auth-session 통합 예정");
  }

  async function handleMagicLink() {
    if (!email || !email.includes("@")) {
      Alert.alert("Please enter a valid email.");
      return;
    }
    try {
      await supabaseAuthClient.sendMagicLink(email);
      await logEvent("account_signed_up", { method: "email_magic_link", phase: "link_sent" });
      setMagicLinkSent(true);
    } catch (err) {
      Alert.alert("Failed to send magic link", err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.pink" size={280} opacity={0.3} style={{ top: -80, left: -60 }} />
      <GlowOrb color="neon.cyan" size={240} opacity={0.25} style={{ bottom: 80, right: -60 }} />

      <View style={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>Welcome</Text>
        <Text style={styles.heading}>Sign in</Text>
        <Text style={styles.subtitle}>Save your progress and unlock Premium.</Text>

        <View style={{ marginTop: spacing["space.8"] }}>
          {/* Apple — solid dark per Apple HIG */}
          <AppleSignInButton onPress={handleApple} />

          {/* Google — glass card */}
          <GoogleSignInButton onPress={handleGoogle} />

          {/* Magic link */}
          {magicLinkSent ? (
            <GlassCard style={styles.sentCard}>
              <Text style={styles.sentTitle}>Check your email ✉️</Text>
              <Text style={styles.sentDesc}>
                We sent a sign-in link to {email}. The link works for 60 minutes.
              </Text>
            </GlassCard>
          ) : (
            <>
              <Text style={styles.divider}>or with email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={lightColors["text.muted"]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
              />
              <NeonButton
                label="Email me a sign-in link"
                onPress={handleMagicLink}
                disabled={!email}
              />
            </>
          )}
        </View>

        <View style={{ flex: 1 }} />

        <Text style={styles.terms}>
          By signing in you agree to our Terms and Privacy Policy.
        </Text>
      </View>
    </GradientBackground>
  );
}

// Motion v1.1 sub-components — 각 버튼 별도 scale state
function AppleSignInButton({ onPress }: { onPress: () => void }) {
  const motion = useMotionPress({ hapticStyle: "light" });
  return (
    <Pressable
      onPress={() => {
        motion.haptic();
        onPress();
      }}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      accessibilityLabel="Continue with Apple"
      style={({ pressed }) => [
        styles.appleBtn,
        pressed && { opacity: motion.reduceMotion ? 0.85 : 1 },
      ]}
    >
      <Animated.View style={[styles.appleInner, motion.animatedStyle]}>
        <Text style={styles.appleText}> Continue with Apple</Text>
      </Animated.View>
    </Pressable>
  );
}

function GoogleSignInButton({ onPress }: { onPress: () => void }) {
  const motion = useMotionPress({ hapticStyle: "light" });
  return (
    <Pressable
      onPress={() => {
        motion.haptic();
        onPress();
      }}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      accessibilityLabel="Continue with Google"
      style={{ marginBottom: spacing["space.6"] }}
    >
      <Animated.View style={motion.animatedStyle}>
        <GlassCard style={styles.googleCard}>
          <Text style={styles.googleText}>Continue with Google</Text>
        </GlassCard>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing["space.5"],
    paddingTop: spacing["space.12"],
    paddingBottom: spacing["space.6"],
  },
  back: {
    color: lightColors["neon.cyan"],
    fontSize: typeScale["text.body"].fontSize,
    fontWeight: "600",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: lightColors["neon.pink"],
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: spacing["space.6"],
  },
  heading: {
    fontSize: typeScale["text.heading.lg"].fontSize,
    lineHeight: typeScale["text.heading.lg"].lineHeight,
    fontWeight: "900",
    color: lightColors["text.primary"],
    marginTop: spacing["space.2"],
  },
  subtitle: {
    fontSize: typeScale["text.body"].fontSize,
    color: lightColors["text.secondary"],
    marginTop: spacing["space.2"],
  },
  appleBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: "#000000",
    marginBottom: spacing["space.3"],
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  appleInner: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  appleText: {
    color: "#FFFFFF",
    fontSize: typeScale["text.button"].fontSize,
    fontWeight: "700",
  },
  googleCard: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  googleText: {
    color: lightColors["text.primary"],
    fontSize: typeScale["text.button"].fontSize,
    fontWeight: "700",
  },
  divider: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.muted"],
    textAlign: "center",
    marginBottom: spacing["space.3"],
  },
  input: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: lightColors["glass.border"],
    paddingHorizontal: spacing["space.4"],
    fontSize: typeScale["text.body"].fontSize,
    marginBottom: spacing["space.3"],
    backgroundColor: lightColors["glass.surface"],
    color: lightColors["text.primary"],
  },
  sentCard: {
    padding: spacing["space.5"],
  },
  sentTitle: {
    fontSize: typeScale["text.heading.sm"].fontSize,
    fontWeight: "800",
    color: lightColors["text.primary"],
  },
  sentDesc: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.secondary"],
    marginTop: spacing["space.1"],
  },
  terms: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.muted"],
    textAlign: "center",
  },
});
