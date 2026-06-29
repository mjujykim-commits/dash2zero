/**
 * Content Report — 5 카테고리 신고 화면 (CC2-15 + USER_JOURNEYS J-006)
 * 톤: D-022 K-pop Bold (mockup: docs/screens/v2-stunning/13-report.html)
 *
 * 결정:
 *   - 카테고리: typo / translation / audio / level / other
 *   - 어뷰즈 throttle: 시간당 5건 (Edge Function이 처리)
 *   - 익명 신고 허용 (anon device_install_id)
 */

import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMotionPress } from "@/src/hooks/useMotionPress";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";
import { supabase } from "@/src/lib/supabase";
import { logEvent } from "@/src/lib/analytics";
import type { ContentReportCategorySchema } from "@dash2zero/contracts";
import { z } from "zod";

import {
  GradientBackground,
  GradientText,
  GlassCard,
  GlowOrb,
  NeonButton,
} from "@/src/components/d022";

type Category = z.infer<typeof ContentReportCategorySchema>;

type Option = { id: Category; label: string; emoji: string };

const OPTIONS: Option[] = [
  { id: "typo",        label: "Typo / spelling",     emoji: "✏️" },
  { id: "translation", label: "Wrong translation",   emoji: "🔄" },
  { id: "audio",       label: "Wrong audio",         emoji: "🔊" },
  { id: "level",       label: "Too easy / too hard", emoji: "📊" },
  { id: "other",       label: "Other",               emoji: "📝" },
];

// Motion v1.1 sub-component — 옵션 카드 별도 scale state
function ReportOption({
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
        isSel && styles.optionSelected,
        motion.shadowAdjust(pressed),
      ]}
    >
      <Animated.View style={[styles.optionInner, motion.animatedStyle]}>
        <Text style={styles.emoji}>{opt.emoji}</Text>
        <Text style={[styles.optionLabel, isSel && { color: lightColors["neon.pink"] }]}>
          {opt.label}
        </Text>
        {isSel && <View style={styles.dot} />}
      </Animated.View>
    </Pressable>
  );
}

export default function Report() {
  const { wordId } = useLocalSearchParams<{ wordId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!category || !wordId) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("content_reports").insert({
        word_id: wordId,
        category,
        description: description.trim() || null,
      });
      if (error) throw error;
      await logEvent("content_reported", { word_id: wordId, category });
      Alert.alert("Thanks", "We'll review your report.");
      router.back();
    } catch (err) {
      Alert.alert("Failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.cyan" size={240} opacity={0.3} style={{ top: -80, right: -60 }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <View style={{ marginTop: spacing["space.6"] }}>
          <Text style={styles.heading}>Report</Text>
          <GradientText scale="text.display" variant="hero" style={styles.headlineGrad}>
            this word.
          </GradientText>
        </View>

        <Text style={styles.sectionLabel}>WHAT'S WRONG?</Text>

        <View>
          {OPTIONS.map((opt) => (
            <ReportOption
              key={opt.id}
              opt={opt}
              isSel={category === opt.id}
              onSelect={() => setCategory(opt.id)}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: lightColors["neon.cyan"] }]}>DESCRIPTION (OPTIONAL)</Text>

        <GlassCard style={styles.textareaCard}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add more details if helpful…"
            placeholderTextColor={lightColors["text.muted"]}
            maxLength={500}
            multiline
            style={styles.textarea}
          />
        </GlassCard>
      </ScrollView>

      <View style={styles.ctaBar}>
        <NeonButton
          label={busy ? "Submitting…" : "Submit report"}
          onPress={handleSubmit}
          disabled={!category || busy}
        />
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
  heading: {
    fontSize: 34,
    fontWeight: "900",
    color: lightColors["text.primary"],
    lineHeight: 38,
  },
  headlineGrad: {
    fontSize: 34,
    lineHeight: 38,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: lightColors["neon.pink"],
    letterSpacing: 1,
    marginTop: spacing["space.6"],
    marginBottom: spacing["space.3"],
  },
  optionCard: {
    marginBottom: spacing["space.2"],
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
  optionSelected: {
    borderColor: lightColors["neon.pink"],
    borderWidth: 2,
    shadowColor: lightColors["neon.pink"],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  emoji: {
    fontSize: 22,
    marginRight: spacing["space.3"],
  },
  optionLabel: {
    flex: 1,
    fontSize: typeScale["text.body"].fontSize,
    fontWeight: "700",
    color: lightColors["text.primary"],
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: lightColors["neon.pink"],
  },
  textareaCard: {
    minHeight: 96,
    padding: 0,
  },
  textarea: {
    padding: spacing["space.4"],
    fontSize: typeScale["text.body"].fontSize,
    color: lightColors["text.primary"],
    minHeight: 96,
    textAlignVertical: "top",
  },
  ctaBar: {
    paddingHorizontal: spacing["space.5"],
    paddingBottom: spacing["space.6"],
    paddingTop: spacing["space.4"],
    borderTopWidth: 1,
    borderTopColor: lightColors["glass.border"],
    backgroundColor: "rgba(15,15,26,0.6)",
  },
});
