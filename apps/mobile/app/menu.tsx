/**
 * Home — 게이미피케이션 대시보드.
 *   레벨/실력 등급/XP(ProficiencyCard) + 성장 수치 타일(아는 단어·복습·연속)
 *   + 금주 학습 그래프(WeekChart) + 학습 진입(Study/Quiz/Exam) + 하단 탭바.
 *
 * 데이터: 로컬 progress/known/review 집계(getHomeStats). 화면 포커스 시 갱신.
 */

import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { GradientBackground, GlassCard, GlowOrb } from "@/src/components/d022";
import { ProficiencyCard } from "@/src/components/ProficiencyCard";
import { StatTile, WeekChart } from "@/src/components/HomeWidgets";
import { TabBar } from "@/src/components/TabBar";
import { getHomeStats, type HomeStats } from "@/src/lib/homeStats";
import { isPremium } from "@/src/lib/premium";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const [stats, setStats] = useState<HomeStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getHomeStats().then((s) => alive && setStats(s)).catch(() => undefined);
      return () => { alive = false; };
    }, []),
  );

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.purple" size={320} opacity={0.4} style={{ top: -80, left: -60 }} />
      <GlowOrb color="neon.pink" size={240} opacity={0.3} style={{ bottom: 120, right: -60 }} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.title}>dash2zero</Text>
        </View>

        {/* 레벨 · 실력 등급 · XP · 일일 목표 */}
        <ProficiencyCard />

        {/* 성장 수치 타일 */}
        <View style={styles.tilesRow}>
          <StatTile icon="📚" value={stats?.learned ?? 0} label="Words known" color={lightColors["neon.cyan"]} />
          <View style={{ width: spacing["space.3"] }} />
          <StatTile icon="🔁" value={stats?.reviewDue ?? 0} label="To review" color={lightColors["neon.orange"]} />
          <View style={{ width: spacing["space.3"] }} />
          <StatTile icon="🔥" value={stats?.streak ?? 0} label="Day streak" color={lightColors["neon.lime"]} />
        </View>

        {/* 금주 학습 그래프 */}
        {stats ? (
          <View style={{ marginTop: spacing["space.4"] }}>
            <WeekChart week={stats.week} />
          </View>
        ) : null}

        {/* 학습 진입 */}
        <Text style={styles.sectionLabel}>Learn</Text>
        <View style={styles.actionsRow}>
          <Pressable style={{ flex: 1 }} onPress={() => router.push("/study")}>
            <GlassCard style={styles.actionCard}>
              <Text style={styles.actionEmoji}>📖</Text>
              <Text style={styles.actionTitle}>Study</Text>
              <Text style={styles.actionSub}>Browse & listen</Text>
            </GlassCard>
          </Pressable>
          <View style={{ width: spacing["space.3"] }} />
          <Pressable style={{ flex: 1 }} onPress={() => router.push("/quizzes")}>
            <GlassCard style={styles.actionCard}>
              <Text style={styles.actionEmoji}>🎯</Text>
              <Text style={styles.actionTitle}>Quiz</Text>
              <Text style={styles.actionSub}>Picture · Audio</Text>
            </GlassCard>
          </Pressable>
        </View>

        {/* 시험 대비 (프리미엄) */}
        <Pressable onPress={() => router.push(isPremium() ? "/exam" : "/paywall")}>
          <GlassCard style={styles.examCard}>
            <Text style={styles.examEmoji}>🎓</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.examTitleRow}>
                <Text style={styles.examTitle}>Exam prep</Text>
                <View style={styles.proChip}>
                  <Text style={styles.proText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.examSub}>TOPIK · KIIP — study & quiz by level</Text>
            </View>
            <Text style={styles.examChevron}>›</Text>
          </GlassCard>
        </Pressable>

        {/* 오답 복습 */}
        <Pressable onPress={() => router.push("/picture-quiz?review=1")} style={{ marginTop: spacing["space.4"] }}>
          <View style={styles.reviewBtn}>
            <Text style={styles.reviewText}>
              🔁  Review wrong words{stats && stats.reviewDue > 0 ? `  ·  ${stats.reviewDue}` : ""}
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      <TabBar active="home" />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing["space.5"],
    paddingTop: spacing["space.12"],
    paddingBottom: spacing["space.8"],
  },
  hero: { marginBottom: spacing["space.5"] },
  greeting: {
    fontSize: 11,
    fontWeight: "800",
    color: lightColors["neon.cyan"],
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: { color: lightColors["text.primary"], fontSize: 34, fontWeight: "900", marginTop: 2 },
  tilesRow: { flexDirection: "row", marginTop: spacing["space.1"] },
  sectionLabel: {
    color: lightColors["text.muted"],
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: spacing["space.6"],
    marginBottom: spacing["space.3"],
  },
  actionsRow: { flexDirection: "row" },
  actionCard: { alignItems: "center", paddingVertical: spacing["space.5"] },
  actionEmoji: { fontSize: 40 },
  actionTitle: { color: lightColors["text.primary"], fontSize: 20, fontWeight: "900", marginTop: spacing["space.2"] },
  actionSub: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, marginTop: 2 },
  examCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing["space.4"],
    paddingHorizontal: spacing["space.5"],
    marginTop: spacing["space.4"],
    borderWidth: 1.5,
    borderColor: "#F5C542",
  },
  examEmoji: { fontSize: 34, marginRight: spacing["space.4"] },
  examTitleRow: { flexDirection: "row", alignItems: "center" },
  examTitle: { color: lightColors["text.primary"], fontSize: 20, fontWeight: "900" },
  proChip: { marginLeft: spacing["space.2"], backgroundColor: "#F5C542", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  proText: { color: "#0B0B0F", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  examSub: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, marginTop: 2 },
  examChevron: { color: lightColors["text.muted"], fontSize: 26 },
  reviewBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: lightColors["neon.cyan"],
    paddingVertical: spacing["space.4"],
    alignItems: "center",
  },
  reviewText: { color: lightColors["neon.cyan"], fontSize: 16, fontWeight: "800" },
});
