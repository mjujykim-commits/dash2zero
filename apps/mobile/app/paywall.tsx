/**
 * Paywall — Premium 구독 화면 (PRD §6, USER_JOURNEYS J-003, DESIGN_DIRECTION §6 D-022)
 * 톤: D-022 K-pop Bold (mockup: docs/screens/v2-stunning/10-paywall.html)
 *
 * 결정 사항 명시:
 *   - CC-09 / CC3-05: 무료 체험 없음 / Restore 필수 / 가족공유 비활성 사전 고지 (Q-PL-NEW-005)
 *   - CC2-06: 게스트 → 구매 시 sign-in 강제
 *   - D-018 (2026-05-13 봉인): $4.99/mo, $49.99/yr (16% off, premium positioning)
 *   - D-022 (2026-05-18): paywall gradient bg + display heading + gradient price 60px
 */

import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";
import { fetchOfferings, purchasePackage, restorePurchases, type PaywallOffering } from "@/src/lib/purchases";
import { logEvent } from "@/src/lib/analytics";
import { supabase } from "@/src/lib/supabase";

import {
  GradientBackground,
  GradientText,
  GlassCard,
  GlowOrb,
  NeonButton,
} from "@/src/components/d022";
import { useResponsiveScale } from "@/src/hooks/useResponsiveScale";
import { useMotionPress } from "@/src/hooks/useMotionPress";

type Plan = "monthly" | "annual";

// Motion v1.1 적용 — plan card는 각자 scale state가 필요하므로 sub-component 추출
function PlanCard({
  plan,
  isSel,
  price,
  perMonth,
  scaleDisplay,
  onSelect,
}: {
  plan: Plan;
  isSel: boolean;
  price: string;
  perMonth: string | null;
  scaleDisplay: number;
  onSelect: () => void;
}) {
  const motion = useMotionPress({ hapticStyle: "light" });
  const labelTop = plan === "monthly" ? "Monthly" : "Annual";

  return (
    <Pressable
      onPress={() => {
        motion.haptic();
        onSelect();
      }}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSel }}
      style={({ pressed }) => [
        styles.planCard,
        isSel && styles.planCardSelected,
        motion.shadowAdjust(pressed),
      ]}
    >
      <Animated.View style={motion.animatedStyle}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={[styles.planLabel, isSel && { color: lightColors["neon.pink"] }]}>{labelTop}</Text>
          {plan === "annual" && (
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE 16%</Text>
            </View>
          )}
        </View>
        {plan === "annual" ? (
          <GradientText
            scale="text.display"
            variant="hero"
            style={{
              marginTop: spacing["space.2"],
              fontSize: scaleDisplay + 8,
              lineHeight: scaleDisplay + 12,
            }}
          >
            {price}
          </GradientText>
        ) : (
          <Text style={styles.planPrice}>{price} / month</Text>
        )}
        {perMonth && <Text style={styles.planPerMonth}>{perMonth}</Text>}
      </Animated.View>
    </Pressable>
  );
}

export default function Paywall() {
  const params = useLocalSearchParams<{ return_to?: string }>();
  const [offering, setOffering] = useState<PaywallOffering | null>(null);
  const [selected, setSelected] = useState<Plan>("annual");
  const [busy, setBusy] = useState(false);
  const scale = useResponsiveScale();

  function navigateAfterSuccess() {
    // return_to가 있으면 그곳으로, 없으면 home 복귀 (학습 흐름 연속성 — D-022 conversion 정합)
    if (params.return_to) {
      router.replace(params.return_to as never);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  }

  useEffect(() => {
    void logEvent("paywall_viewed");
    void fetchOfferings().then(setOffering);
  }, []);

  async function ensureSignedIn(intent: "purchase" | "restore"): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      await logEvent("paywall_signin_required", {
        intent,
        plan: selected,
      });
      router.push("/auth/sign-in?return_to=/paywall");
      return false;
    }
    return true;
  }

  async function handlePurchase() {
    if (!offering) return;
    if (!(await ensureSignedIn("purchase"))) return;

    const pkg = selected === "monthly" ? offering.monthly : offering.annual;
    if (!pkg) {
      Alert.alert("Pricing not available", "Please try again later.");
      return;
    }

    await logEvent("plan_selected", { plan: selected });
    await logEvent("purchase_started", { plan: selected });
    setBusy(true);
    const result = await purchasePackage(pkg);
    setBusy(false);

    if (result.cancelled) {
      await logEvent("purchase_cancelled", { plan: selected });
      return;
    }
    if (!result.success) {
      await logEvent("purchase_failed", { plan: selected, error: result.error ?? "unknown" });
      Alert.alert("Purchase failed", result.error ?? "Please try again.");
      return;
    }
    if (result.isPremium) {
      await logEvent("purchase_completed", { plan: selected });
      navigateAfterSuccess();
    }
  }

  async function handleRestore() {
    if (!(await ensureSignedIn("restore"))) return;
    setBusy(true);
    const result = await restorePurchases();
    setBusy(false);

    if (result.success && result.isPremium) {
      Alert.alert("Restored", "Your Premium subscription is now active.");
      navigateAfterSuccess();
    } else if (result.success) {
      Alert.alert("No purchases to restore", "We couldn't find a previous Premium purchase on this account.");
    } else {
      Alert.alert("Restore failed", result.error ?? "Please try again.");
    }
  }

  const annualPrice = offering?.annualPriceString ?? "$49.99";
  const monthlyPrice = offering?.monthlyPriceString ?? "$4.99";

  return (
    <GradientBackground variant="paywall" direction="diagonal" style={{ flex: 1 }}>
      <GlowOrb color="neon.pink" size={320} opacity={0.4} style={{ top: -100, right: -80 }} />
      <GlowOrb color="neon.purple" size={280} opacity={0.35} style={{ bottom: 200, left: -80 }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <View style={{ marginTop: spacing["space.5"] }}>
          <Text style={styles.eyebrow}>Premium</Text>
          <GradientText
            scale="text.display"
            variant="hero"
            style={[styles.headline, { fontSize: scale.display + 6, lineHeight: scale.display + 10 }]}
          >
            Master Korean{"\n"}faster.
          </GradientText>
          <Text style={styles.subtitle}>No free trial. No surprises.</Text>
        </View>

        {/* Plan selection */}
        <View style={{ marginTop: spacing["space.6"] }}>
          {(["annual", "monthly"] as const).map((plan) => (
            <PlanCard
              key={plan}
              plan={plan}
              isSel={selected === plan}
              price={plan === "monthly" ? monthlyPrice : annualPrice}
              perMonth={plan === "annual" ? "≈ $4.16 / month · billed yearly" : null}
              scaleDisplay={scale.display}
              onSelect={() => setSelected(plan)}
            />
          ))}
        </View>

        {/* What you get */}
        <GlassCard style={styles.featuresCard}>
          <Text style={styles.featuresHeading}>What you get</Text>
          {[
            "15 new words per day",
            "Unlimited reviews",
            "Premium pack — 300+ words",
            "Monthly 50 new words",
            "Premium audio",
          ].map((item) => (
            <View key={item} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Honest disclosures (CC-09 / CC3-05 / Q-PL-NEW-005) */}
        <View style={styles.disclosure}>
          <Text style={styles.disclosureText}>
            • No free trial.{"\n"}
            • Family Sharing is not supported.{"\n"}
            • Subscription auto-renews until canceled. Manage or cancel in your App Store / Google Play settings at least 24 hours before renewal.{"\n"}
            • Refunds follow App Store / Google Play policies.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <NeonButton
          label={busy ? "Processing…" : "Subscribe"}
          onPress={handlePurchase}
          disabled={busy || !offering}
        />
        <Pressable onPress={handleRestore} disabled={busy} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </Pressable>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
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
  },
  headline: {
    marginTop: spacing["space.2"],
    fontSize: 42,
    lineHeight: 46,
  },
  subtitle: {
    fontSize: typeScale["text.body"].fontSize,
    color: lightColors["text.secondary"],
    marginTop: spacing["space.2"],
  },
  planCard: {
    marginBottom: spacing["space.3"],
    padding: spacing["space.5"],
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: lightColors["glass.border"],
  },
  planCardSelected: {
    borderColor: lightColors["neon.pink"],
    borderWidth: 2,
    shadowColor: lightColors["neon.pink"],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
  },
  planLabel: {
    fontSize: typeScale["text.heading.sm"].fontSize,
    fontWeight: "800",
    color: lightColors["text.primary"],
  },
  planPrice: {
    fontSize: typeScale["text.body"].fontSize,
    color: lightColors["text.secondary"],
    marginTop: spacing["space.2"],
  },
  planPerMonth: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.muted"],
    marginTop: spacing["space.1"],
  },
  saveBadge: {
    backgroundColor: lightColors["neon.lime"],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  saveBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0F0F1A",
    letterSpacing: 0.5,
  },
  featuresCard: {
    marginTop: spacing["space.6"],
    padding: spacing["space.5"],
  },
  featuresHeading: {
    fontSize: typeScale["text.heading.sm"].fontSize,
    fontWeight: "800",
    color: lightColors["text.primary"],
    marginBottom: spacing["space.3"],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing["space.2"],
  },
  featureCheck: {
    fontSize: 16,
    color: lightColors["neon.lime"],
    fontWeight: "900",
    width: 22,
  },
  featureText: {
    fontSize: typeScale["text.body"].fontSize,
    color: lightColors["text.primary"],
    flex: 1,
  },
  disclosure: {
    marginTop: spacing["space.6"],
    padding: spacing["space.4"],
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: lightColors["glass.border"],
  },
  disclosureText: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.secondary"],
    lineHeight: 18,
  },
  ctaBar: {
    paddingHorizontal: spacing["space.5"],
    paddingBottom: spacing["space.6"],
    paddingTop: spacing["space.4"],
    borderTopWidth: 1,
    borderTopColor: lightColors["glass.border"],
    backgroundColor: "rgba(15,15,26,0.6)",
  },
  restoreBtn: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing["space.2"],
  },
  restoreText: {
    color: lightColors["neon.cyan"],
    fontSize: typeScale["text.body"].fontSize,
    fontWeight: "600",
  },
});
