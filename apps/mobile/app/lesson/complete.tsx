/**
 * Lesson Complete — J-001 마지막 화면
 * 톤: D-022 K-pop Bold (mockup: docs/screens/v2-stunning/09-lesson-complete.html)
 *
 * 결정 (DESIGN_DIRECTION §6 D-022):
 *   - 120px hero check + glow.success
 *   - "3 words nailed." gradient hero text (display 36px)
 *   - Streak / Mastered stats — glass card neon accent
 */

import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Pressable, Share, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { maybePromptAfterFirstLesson } from "@/src/lib/notifications";
import { useResponsiveScale } from "@/src/hooks/useResponsiveScale";
import { useMotionPress } from "@/src/hooks/useMotionPress";
import { logEvent } from "@/src/lib/analytics";
import { playSfx } from "@/src/lib/sound";

import {
  GradientBackground,
  GradientText,
  GlassCard,
  GlowOrb,
  NeonButton,
  useNumberCount,
} from "../../src/components/d022";

export default function LessonComplete() {
  const params = useLocalSearchParams<{
    completed?: string;
    streak?: string;
    mastered?: string;
  }>();

  const completed = Number(params.completed ?? 3);
  // P1.1 NumberCounter (D-033 + Designer Q-2 §3.3 결정): Lesson Complete의 유일한 카운트업.
  // motion.count 900ms, Reduce Motion 시 즉시 표시.
  const completedDisplay = useNumberCount(completed, 0);
  const streak = Number(params.streak ?? 1);
  const mastered = Number(params.mastered ?? 0);
  const scale = useResponsiveScale();
  const shareMotion = useMotionPress({ hapticStyle: "light" });

  const [reminderScheduled, setReminderScheduled] = useState(false);

  // Lesson 완료 보상 SFX (우아한 마무리) — 화면 진입 시 1회
  useEffect(() => {
    void playSfx("complete");
  }, []);

  // Q-FE-NEW-008: 첫 lesson 완료 후 권한 1회 요청. 부여 시 09:00 daily reminder.
  useEffect(() => {
    void (async () => {
      const result = await maybePromptAfterFirstLesson();
      if (result.reminderScheduled) setReminderScheduled(true);
    })();
  }, []);

  async function handleShare() {
    const message =
      completed === 1
        ? `I just mastered my first Korean word on dash2zero 🇰🇷 #dash2zero`
        : `I just mastered ${completed} Korean words on dash2zero 🇰🇷 #dash2zero`;
    try {
      const result = await Share.share({ message });
      if (result.action === Share.sharedAction) {
        await logEvent("lesson_shared", { completed, channel: "system_sheet" });
      }
    } catch {
      // 사용자 cancel 또는 OS share sheet 실패는 silent — UX 차단 회피
    }
  }

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.lime" size={320} opacity={0.35} style={{ top: 120, left: -80 }} />
      <GlowOrb color="neon.cyan" size={280} opacity={0.3} style={{ bottom: 120, right: -60 }} />

      <View style={styles.content}>
        <View style={styles.heroBlock}>
          <View style={styles.checkWrapper}>
            <LinearGradient
              colors={["#10B981", "#06B6D4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.checkCircle,
                {
                  width: scale.heroSuccess + 20,
                  height: scale.heroSuccess + 20,
                  borderRadius: (scale.heroSuccess + 20) / 2,
                },
              ]}
            >
              <Text style={[styles.checkText, { fontSize: scale.heroSuccess * 0.6 }]}>✓</Text>
            </LinearGradient>
          </View>

          <GradientText
            scale="text.display"
            variant="hero"
            style={[styles.headline, { fontSize: scale.display, lineHeight: scale.display + 4 }]}
          >
            {completedDisplay} {completed === 1 ? "word" : "words"} nailed.
          </GradientText>

          <Text style={styles.subtitle}>See you tomorrow.</Text>

          {reminderScheduled && (
            <Text style={styles.reminderNote}>
              🔔 Daily reminder set for 9:00 AM. Change in Settings anytime.
            </Text>
          )}

          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={[styles.statValue, { color: lightColors["neon.lime"] }]}>
                🔥 {streak}
              </Text>
              <Text style={styles.statUnit}>{streak === 1 ? "day" : "days"}</Text>
            </GlassCard>
            {mastered > 0 && (
              <GlassCard style={styles.statCard}>
                <Text style={styles.statLabel}>Mastered</Text>
                <Text style={[styles.statValue, { color: lightColors["neon.cyan"] }]}>
                  {mastered}
                </Text>
                <Text style={styles.statUnit}>words</Text>
              </GlassCard>
            )}
          </View>
        </View>

        <NeonButton label="Home" onPress={() => router.replace("/home")} />
        <Pressable
          onPress={() => {
            shareMotion.haptic();
            void handleShare();
          }}
          onPressIn={shareMotion.onPressIn}
          onPressOut={shareMotion.onPressOut}
          accessibilityLabel="Share progress"
          style={styles.shareBtn}
        >
          <Animated.View style={shareMotion.animatedStyle}>
            <Text style={styles.shareText}>Share my progress ↗</Text>
          </Animated.View>
        </Pressable>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing["space.5"],
    paddingTop: spacing["space.16"],
    paddingBottom: spacing["space.6"],
  },
  heroBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkWrapper: {
    shadowColor: lightColors["semantic.success"],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 48,
    elevation: 16,
    marginBottom: spacing["space.8"],
  },
  checkCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    fontSize: 80,
    color: "#FFFFFF",
    fontWeight: "900",
  },
  headline: {
    textAlign: "center",
    marginBottom: spacing["space.2"],
  },
  subtitle: {
    fontSize: typeScale["text.body"].fontSize,
    color: lightColors["text.secondary"],
    textAlign: "center",
    marginBottom: spacing["space.6"],
  },
  reminderNote: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["neon.lime"],
    textAlign: "center",
    marginBottom: spacing["space.6"],
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing["space.4"],
    width: "100%",
    paddingHorizontal: spacing["space.5"],
  },
  statCard: {
    flex: 1,
    padding: spacing["space.4"],
    alignItems: "flex-start",
  },
  statLabel: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.muted"],
    fontWeight: "600",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: spacing["space.1"],
  },
  statUnit: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.muted"],
  },
  shareBtn: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing["space.3"],
  },
  shareText: {
    color: lightColors["neon.cyan"],
    fontSize: typeScale["text.body"].fontSize,
    fontWeight: "600",
  },
});
