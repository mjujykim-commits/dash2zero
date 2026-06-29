/**
 * Privacy Choices — 분석 동의 흐름 (CC2-18, CC3-04)
 * 톤: D-022 K-pop Bold (mockup: docs/screens/v2-stunning/03-privacy-choices.html)
 *
 * 결정 사항:
 *   - First-run 순서: age gate → privacy-choices → onboarding (CC2-18)
 *   - Firebase Analytics + Crashlytics는 default disabled
 *   - 사용자가 동의 후 setAnalyticsCollectionEnabled(true)
 *   - 비필수 거부해도 학습 진행 가능 (CC3-04)
 *   - UK 13-17세: 비필수 분석 default OFF, geolocation 미수집, 마케팅 push 차단 (CC2-05)
 */

import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";
import { hapticImpact } from "@/src/lib/haptics";

import { GradientBackground, GlassCard, GlowOrb, NeonButton, useToast } from "../src/components/d022";

export default function PrivacyChoices() {
  const toast = useToast(); // P1.2 — Switch 변경 결과 비차단 피드백 (D-034)
  const params = useLocalSearchParams<{ age?: string }>();
  const age = Number(params.age ?? 18);

  const isUkMinor = age >= 13 && age <= 17; // stub — country=UK 조건 추가 예정
  const initialAnalytics = !isUkMinor;

  const [analyticsConsent, setAnalyticsConsent] = useState(initialAnalytics);
  const [crashConsent, setCrashConsent] = useState(true);

  function handleContinue() {
    router.push("/onboarding");
  }

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.purple" size={300} opacity={0.3} style={{ top: -100, left: -80 }} />

      <View style={styles.content}>
        <Text style={styles.stepLabel}>Step 2 of 3</Text>
        <Text style={styles.heading}>Privacy choices</Text>
        <Text style={styles.subtitle}>You can change these anytime in Settings.</Text>

        <GlassCard style={styles.toggleCard}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing["space.4"] }}>
              <Text style={styles.toggleTitle}>Analytics</Text>
              <Text style={styles.toggleDesc}>
                Help us improve dash2zero with anonymous usage data.
              </Text>
            </View>
            <Switch
              value={analyticsConsent}
              onValueChange={(v) => {
                void hapticImpact("light");
                setAnalyticsConsent(v);
                toast.show(v ? "Analytics enabled." : "Analytics disabled.", "user-action");
              }}
              trackColor={{ false: "#3F3F46", true: lightColors["neon.pink"] }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#3F3F46"
            />
          </View>
        </GlassCard>

        <GlassCard style={[styles.toggleCard, { marginTop: spacing["space.4"] }]}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing["space.4"] }}>
              <Text style={styles.toggleTitle}>Crash diagnostics</Text>
              <Text style={styles.toggleDesc}>
                Send crash reports so we can fix bugs.
              </Text>
            </View>
            <Switch
              value={crashConsent}
              onValueChange={(v) => {
                void hapticImpact("light");
                setCrashConsent(v);
                toast.show(v ? "Crash reports enabled." : "Crash reports disabled.", "user-action");
              }}
              trackColor={{ false: "#3F3F46", true: lightColors["neon.cyan"] }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#3F3F46"
            />
          </View>
        </GlassCard>

        <View style={{ flex: 1 }} />

        <Text style={styles.disclosure}>
          We do not sell or share your data. We never track you across other apps.
        </Text>

        <NeonButton label="Continue" onPress={handleContinue} />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing["space.5"],
    paddingTop: spacing["space.12"],
    paddingBottom: spacing["space.6"],
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: lightColors["neon.cyan"],
    letterSpacing: 1,
    textTransform: "uppercase",
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
    marginBottom: spacing["space.8"],
  },
  toggleCard: {
    padding: spacing["space.4"],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleTitle: {
    fontSize: typeScale["text.heading.sm"].fontSize,
    fontWeight: "700",
    color: lightColors["text.primary"],
  },
  toggleDesc: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.secondary"],
    marginTop: spacing["space.1"],
  },
  disclosure: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.muted"],
    textAlign: "center",
    marginBottom: spacing["space.4"],
  },
});
