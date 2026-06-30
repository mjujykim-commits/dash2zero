/**
 * Home — Today's words + Streak + Mastered (USER_JOURNEYS J-002, PRD §4)
 * 톤: D-022 K-pop Bold (mockup: docs/screens/v2-stunning/05-home.html)
 *
 * 단일 화면 단일 CTA. DESIGN_DIRECTION §6 (Bold/Neon/Honest/Confident/Focused).
 * 04:00 로컬 리셋 후 fresh count (CC-17).
 *
 * 실 데이터:
 *   - useTodaySummary: get_today_summary RPC (인증 사용자) / 게스트는 stub
 *   - useEntryWord: content-manifest에서 free pack 첫 단어 (M4에 SRS scheduler로 교체)
 */

import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { getIncorrectWordIds } from "@/src/lib/guestStore";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { useTodaySummary } from "@/src/hooks/useTodaySummary";
import { useEntryWord } from "@/src/hooks/useEntryWord";
import { useDelayedLoading } from "@/src/hooks/useDelayedLoading";
import { getLearningMotivation, getMotivationDisplay, type MotivationDisplay } from "@/src/lib/profile";
import { useState } from "react";

import { GradientBackground, GlassCard, GlowOrb, NeonButton, Shimmer, StreakBadge } from "@/src/components/d022";

export default function Home() {
  const summary = useTodaySummary();
  // P1.3 StreakBadge justIncremented 감지 (사이클 KK, 2026-06-05)
  //   streak_days가 증가한 시점에 1회 pop entry trigger. 600ms 후 reset.
  const prevStreakRef = useRef<number | null>(null);
  const [streakJustIncremented, setStreakJustIncremented] = useState(false);
  const entry = useEntryWord();
  const [motivation, setMotivation] = useState<MotivationDisplay>(getMotivationDisplay(null));

  // lesson complete 후 돌아오면 stats refetch (router.replace remount 외에 router.back 흐름 보강)
  useFocusEffect(
    useCallback(() => {
      summary.refetch();
      void getLearningMotivation().then((m) => setMotivation(getMotivationDisplay(m)));
    }, [summary.refetch])
  );

  const today = summary.data;

  // streak_days 변경 감지 — 증가 시 1회 pop trigger (StreakBadge justIncremented prop)
  useEffect(() => {
    const curr = today?.streak_days ?? 0;
    if (prevStreakRef.current !== null && curr > prevStreakRef.current) {
      setStreakJustIncremented(true);
      const t = setTimeout(() => setStreakJustIncremented(false), 600);
      prevStreakRef.current = curr;
      return () => clearTimeout(t);
    }
    prevStreakRef.current = curr;
  }, [today?.streak_days]);
  const total = (today?.new_words_remaining ?? 0) + (today?.reviews_due ?? 0);
  const canStart = total > 0 && !!entry.wordId && !entry.isLoading;

  function handleStart() {
    if (!canStart || !entry.wordId) return;
    // PRD §4: chain length = remaining new + due reviews, max 15 (premium) / 10 (free).
    // 무료 사용자도 기본 3은 보장 (학습 첫 진입 동기).
    const isPremium = today?.is_premium ?? false;
    const maxChain = isPremium ? 15 : 10;
    const requested = Math.max(3, (today?.new_words_remaining ?? 0) + (today?.reviews_due ?? 0));
    const chainLength = Math.min(requested, maxChain);
    router.push(`/lesson/${entry.wordId}?chain=${chainLength}`);
  }

  // 오답 복습 — 틀린 단어들만 모아 lesson chain 시작
  async function handleReview() {
    const ids = await getIncorrectWordIds(15);
    if (ids.length === 0) {
      Alert.alert("No mistakes yet", "Words you get wrong will show up here to review.");
      return;
    }
    router.push(`/lesson/${ids[0]}?words=${ids.join(",")}`);
  }

  // 로딩 상태 — Work Order P0-4 (D-028) 정합
  //   useDelayedLoading(150) — 150ms 미만 fetch는 Skeleton 미표시 (깜빡임 회피)
  const showSkeleton = useDelayedLoading(summary.isLoading);
  if (summary.isLoading && showSkeleton) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <GlowOrb color="neon.purple" size={280} opacity={0.3} style={{ top: -60, right: -60 }} />
        <View style={styles.content}>
          <Shimmer width={48} height={12} borderRadius={6} />
          <Shimmer width="80%" height={16} borderRadius={6} style={{ marginTop: spacing["space.2"], marginBottom: spacing["space.3"] }} />
          <Shimmer width={120} height={10} borderRadius={5} style={{ marginBottom: spacing["space.3"] }} />
          {/* Session card placeholder */}
          <Shimmer height={140} borderRadius={24} style={{ marginTop: spacing["space.3"] }} />
          {/* Stats row placeholder */}
          <View style={{ flexDirection: "row", gap: spacing["space.3"], marginTop: spacing["space.5"] }}>
            <Shimmer height={90} borderRadius={18} style={{ flex: 1 }} />
            <Shimmer height={90} borderRadius={18} style={{ flex: 1 }} />
          </View>
          <View style={{ flex: 1 }} />
          {/* CTA placeholder */}
          <Shimmer height={56} borderRadius={14} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.purple" size={280} opacity={0.3} style={{ top: -60, right: -60 }} />

      <View style={styles.content}>
        <Text style={styles.greeting}>Today</Text>
        <Text style={styles.motivationLine}>
          {motivation.emoji} {motivation.greeting}
        </Text>

        {/* Streak — P1.3 StreakBadge (D-033 dispatch, 2026-06-04)
           * StreakBadge: pop entry(streak 갱신 시) + 무한 flame flicker. 0일은 미렌더.
           * 7 dot row: retention 시각화 유지 (StreakBadge는 텍스트 강조, dot은 진척 시각화 — 보완) */}
        {(today?.streak_days ?? 0) >= 1 && (
          <View style={{ marginBottom: spacing["space.3"] }}>
            <StreakBadge
              days={today?.streak_days ?? 0}
              justIncremented={streakJustIncremented}
            />
          </View>
        )}
        <View style={styles.streakRow}>
          {Array.from({ length: 7 }).map((_, i) => {
            const active = (today?.streak_days ?? 0) > i;
            return (
              <View
                key={i}
                style={[
                  styles.streakDot,
                  active && {
                    backgroundColor: lightColors["neon.lime"],
                    shadowColor: lightColors["neon.lime"],
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                    elevation: 4,
                  },
                ]}
              />
            );
          })}
          {(today?.streak_days ?? 0) > 7 && (
            <Text style={styles.streakMore}>+{(today?.streak_days ?? 0) - 7} more</Text>
          )}
        </View>

        <LinearGradient
          colors={["#9333EA", "#EC4899", "#F97316"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sessionCard}
        >
          <Text style={styles.sessionLabel}>Your session</Text>
          <Text style={styles.sessionCount}>
            {today?.new_words_remaining ?? 0} new · {today?.reviews_due ?? 0} reviews
          </Text>
          <Text style={styles.sessionEta}>≈ 3 minutes</Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={[styles.statValue, { color: lightColors["neon.lime"] }]}>
              🔥 {today?.streak_days ?? 0}
            </Text>
            <Text style={styles.statUnit}>{(today?.streak_days ?? 0) === 1 ? "day" : "days"}</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statLabel}>Mastered</Text>
            <Text style={[styles.statValue, { color: lightColors["neon.cyan"] }]}>
              {today?.mastered_count ?? 0}
            </Text>
            <Text style={styles.statUnit}>words</Text>
          </GlassCard>
        </View>

        <Text style={styles.resetNote}>Resets at 4:00 AM local time.</Text>

        {summary.error && (
          <Text style={styles.errorNote}>
            Couldn't refresh today's summary. Showing last known state.
          </Text>
        )}

        <View style={{ flex: 1 }} />

        <NeonButton
          label={
            entry.isLoading
              ? "Loading…"
              : total > 0
                ? "Start →"
                : "All caught up"
          }
          onPress={handleStart}
          disabled={!canStart}
        />

        <View style={styles.secondaryRow}>
          <Pressable onPress={() => router.push("/categories")} hitSlop={8}>
            <Text style={styles.secondaryLink}>📚 Categories</Text>
          </Pressable>
          <Pressable onPress={handleReview} hitSlop={8}>
            <Text style={styles.secondaryLink}>🔁 Review mistakes</Text>
          </Pressable>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing["space.5"],
    paddingTop: spacing["space.12"],
    paddingBottom: spacing["space.6"],
  },
  greeting: {
    fontSize: 11,
    fontWeight: "700",
    color: lightColors["neon.cyan"],
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  motivationLine: {
    fontSize: typeScale["text.body"].fontSize,
    color: lightColors["text.secondary"],
    marginTop: spacing["space.1"],
    marginBottom: spacing["space.3"],
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing["space.2"],
    marginBottom: spacing["space.3"],
  },
  streakDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    shadowOffset: { width: 0, height: 0 },
  },
  streakMore: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["neon.lime"],
    fontWeight: "700",
    marginLeft: spacing["space.2"],
  },
  sessionCard: {
    marginTop: spacing["space.3"],
    padding: spacing["space.6"],
    borderRadius: 24,
    shadowColor: lightColors["neon.purple"],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
  sessionLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  sessionCount: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: spacing["space.2"],
  },
  sessionEta: {
    fontSize: typeScale["text.caption"].fontSize,
    color: "rgba(255,255,255,0.8)",
    marginTop: spacing["space.2"],
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing["space.3"],
    marginTop: spacing["space.5"],
  },
  statCard: {
    flex: 1,
    alignItems: "flex-start",
    padding: spacing["space.4"],
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
  resetNote: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.muted"],
    marginTop: spacing["space.5"],
  },
  errorNote: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["semantic.warning"],
    marginTop: spacing["space.3"],
  },
  secondaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing["space.4"],
  },
  secondaryLink: {
    fontSize: 14,
    fontWeight: "700",
    color: lightColors["neon.cyan"],
  },
});
