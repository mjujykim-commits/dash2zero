/**
 * Onboarding — 학습 동기 4 카테고리 (PRD §3.1, USER_JOURNEYS J-001)
 * 톤: D-022 K-pop Bold (mockup: docs/screens/v2-stunning/04-onboarding.html)
 *
 * 사용자가 K-pop / K-drama / Travel / Other 중 하나 선택.
 * onboarding_completed 이벤트 발화 (CC2-22 analytics).
 * 게스트 모드 진입 — 가입 강제하지 않음 (CC-04).
 */

import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";
import { useMotionPress } from "@/src/hooks/useMotionPress";
import type { LearningMotivation } from "@dash2zero/contracts";

import { setLearningMotivation } from "@/src/lib/profile";
import { logEvent } from "@/src/lib/analytics";

import { GradientBackground, GlowOrb, NeonButton } from "../src/components/d022";

type Option = { id: LearningMotivation; label: string; sub: string; emoji: string };

const OPTIONS: Option[] = [
  { id: "kpop",   label: "K-pop",   sub: "Songs, idols, lyrics", emoji: "🎤" },
  { id: "kdrama", label: "K-drama", sub: "Shows, films",         emoji: "🎬" },
  { id: "travel", label: "Travel",  sub: "Visiting Korea",       emoji: "✈️" },
  { id: "other",  label: "Other",   sub: "Just curious",         emoji: "💫" },
];

// Motion v1.1 적용 — 옵션별 scale state 분리 필요로 sub-component
function MotivationOption({
  opt,
  isSel,
  onSelect,
}: {
  opt: Option;
  isSel: boolean;
  onSelect: () => void;
}) {
  const motion = useMotionPress({ hapticStyle: "light" });
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
        styles.optionCard,
        isSel && styles.optionCardSelected,
        motion.shadowAdjust(pressed),
      ]}
    >
      <Animated.View style={[styles.optionInner, motion.animatedStyle]}>
        <Text style={styles.emoji}>{opt.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.optionLabel, isSel && { color: lightColors["neon.pink"] }]}>
            {opt.label}
          </Text>
          <Text style={styles.optionSub}>{opt.sub}</Text>
        </View>
        {isSel && <View style={styles.checkDot} />}
      </Animated.View>
    </Pressable>
  );
}

export default function Onboarding() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const isUpdate = params.mode === "update";
  const [selected, setSelected] = useState<LearningMotivation | null>(null);

  async function handleContinue() {
    if (!selected) return;
    await setLearningMotivation(selected);
    if (!isUpdate) {
      void logEvent("onboarding_completed", { motivation: selected });
    } else {
      void logEvent("learning_motivation_changed", { motivation: selected });
    }
    if (isUpdate && router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  }

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.pink" size={300} opacity={0.3} style={{ top: -80, right: -60 }} />

      <View style={styles.content}>
        <Text style={styles.stepLabel}>Step 3 of 3</Text>
        <Text style={styles.heading}>Why are you learning Korean?</Text>
        <Text style={styles.subtitle}>We'll tailor your first words to your interest.</Text>

        <View style={{ marginTop: spacing["space.8"] }}>
          {OPTIONS.map((opt) => (
            <MotivationOption
              key={opt.id}
              opt={opt}
              isSel={selected === opt.id}
              onSelect={() => setSelected(opt.id)}
            />
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <NeonButton label="Continue" onPress={handleContinue} disabled={!selected} />
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
  },
  optionCard: {
    marginBottom: spacing["space.3"],
    padding: spacing["space.4"],
    borderRadius: 16,
    backgroundColor: lightColors["surface.card"],
    borderWidth: 1,
    borderColor: lightColors["border.subtle"],
  },
  optionInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionCardSelected: {
    borderColor: lightColors["neon.pink"],
    borderWidth: 2,
    shadowColor: lightColors["neon.pink"],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 6,
  },
  emoji: {
    fontSize: 28,
    marginRight: spacing["space.4"],
  },
  optionLabel: {
    fontSize: typeScale["text.heading.sm"].fontSize,
    fontWeight: "800",
    color: lightColors["text.primary"],
  },
  optionSub: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.secondary"],
    marginTop: 2,
  },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: lightColors["neon.pink"],
  },
});
