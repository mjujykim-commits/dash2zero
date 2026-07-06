/**
 * Achievements — 배지/업적 그리드. 획득(밝게) / 미획득(흐리게).
 */

import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { getAchievements, getProgress, setDailyGoal } from "@/src/lib/progress";
import { GradientBackground, GlassCard, GlowOrb } from "@/src/components/d022";
import { TabBar } from "@/src/components/TabBar";

type Ach = Awaited<ReturnType<typeof getAchievements>>[number];
const GOAL_OPTIONS = [10, 20, 30, 50];

export default function Achievements() {
  const [list, setList] = useState<Ach[] | null>(null);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getProgress>> | null>(null);

  const reload = useCallback(async () => {
    const [a, s] = await Promise.all([getAchievements(), getProgress()]);
    setList(a);
    setSummary(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void reload();
      return () => { alive = false; };
    }, [reload]),
  );

  async function changeGoal(n: number) {
    await setDailyGoal(n);
    await reload();
  }

  const unlocked = list?.filter((a) => a.unlocked).length ?? 0;

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.purple" size={280} opacity={0.35} style={{ top: -80, right: -60 }} />
      <View style={styles.content}>
        <Text style={styles.heading}>Growth</Text>
        <Text style={styles.sub}>
          {unlocked} / {list?.length ?? 0} unlocked
          {summary ? `  ·  Lv ${summary.level} ${summary.title.ko}  ·  ${summary.mastered} words` : ""}
        </Text>

        {/* 일일 목표 설정 */}
        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>Daily goal</Text>
          {GOAL_OPTIONS.map((n) => {
            const active = summary?.dailyGoal === n;
            return (
              <Pressable key={n} onPress={() => void changeGoal(n)} style={[styles.goalChip, active && styles.goalChipActive]}>
                <Text style={[styles.goalChipText, active && styles.goalChipTextActive]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView style={{ marginTop: spacing["space.4"] }} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {(list ?? []).map((a) => (
              <View key={a.id} style={styles.cellWrap}>
                <GlassCard style={[styles.cell, !a.unlocked && styles.cellLocked]}>
                  <Text style={[styles.icon, !a.unlocked && styles.iconLocked]}>{a.unlocked ? a.icon : "🔒"}</Text>
                  <Text style={[styles.title, !a.unlocked && styles.dim]} numberOfLines={1}>{a.title}</Text>
                  <Text style={[styles.desc, !a.unlocked && styles.dim]} numberOfLines={2}>{a.desc}</Text>
                </GlassCard>
              </View>
            ))}
          </View>
          <View style={{ height: spacing["space.8"] }} />
        </ScrollView>
      </View>
      <TabBar active="profile" />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing["space.5"], paddingTop: spacing["space.12"], paddingBottom: spacing["space.4"] },
  link: { color: lightColors["neon.cyan"], fontSize: 16, fontWeight: "700" },
  heading: { color: lightColors["text.primary"], fontSize: 30, fontWeight: "900", marginTop: spacing["space.2"] },
  sub: { color: lightColors["text.secondary"], fontSize: typeScale["text.caption"].fontSize, marginTop: spacing["space.1"] },
  goalRow: { flexDirection: "row", alignItems: "center", marginTop: spacing["space.4"] },
  goalLabel: { color: lightColors["text.muted"], fontSize: 13, fontWeight: "800", marginRight: spacing["space.3"] },
  goalChip: {
    paddingHorizontal: spacing["space.4"], paddingVertical: spacing["space.2"], borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)", marginRight: spacing["space.2"],
  },
  goalChipActive: { backgroundColor: lightColors["neon.cyan"] },
  goalChipText: { color: lightColors["text.secondary"], fontSize: 14, fontWeight: "800" },
  goalChipTextActive: { color: "#0B0B0F" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  cellWrap: { width: "48%", marginBottom: spacing["space.3"] },
  cell: { alignItems: "center", paddingVertical: spacing["space.5"], paddingHorizontal: spacing["space.3"], minHeight: 140, justifyContent: "center" },
  cellLocked: { opacity: 0.55 },
  icon: { fontSize: 40 },
  iconLocked: { fontSize: 32 },
  title: { color: lightColors["text.primary"], fontSize: 15, fontWeight: "900", marginTop: spacing["space.2"], textAlign: "center" },
  desc: { color: lightColors["text.muted"], fontSize: 12, marginTop: 4, textAlign: "center" },
  dim: { color: lightColors["text.muted"] },
});
