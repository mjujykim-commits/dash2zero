/**
 * ProficiencyCard — 메뉴 상단 실력 요약. 레벨/타이틀 + XP 바 + 아는 단어/등급 + 일일 목표 + 연속학습.
 * 탭하면 업적 화면. 화면 포커스 시 갱신(세션 후 즉시 반영).
 */

import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { getProgress } from "@/src/lib/progress";
import { GlassCard } from "@/src/components/d022";

type Summary = Awaited<ReturnType<typeof getProgress>>;

export function ProficiencyCard() {
  const [p, setP] = useState<Summary | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getProgress().then((x) => alive && setP(x)).catch(() => undefined);
      return () => { alive = false; };
    }, []),
  );

  if (!p) return null;
  const xpPct = Math.round(p.ratio * 100);
  const dailyPct = Math.round(p.dailyRatio * 100);

  return (
    <Pressable onPress={() => router.push("/achievements")}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.levelBox}>
            <Text style={styles.levelCap}>LV</Text>
            <Text style={styles.levelNum}>{p.level}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.topLine}>
              <Text style={styles.title}>{p.title.ko}</Text>
              {p.streak >= 2 && <Text style={styles.streak}>🔥 {p.streak}d</Text>}
            </View>
            <Text style={styles.known}>
              {p.mastered} <Text style={styles.knownUnit}>words · {p.band.ko}</Text>
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${xpPct}%` }]} />
            </View>
            <Text style={styles.hint}>{p.toNext} XP to Lv {p.level + 1}</Text>
          </View>
        </View>

        {/* 일일 목표 */}
        <View style={styles.dailyRow}>
          <Text style={styles.dailyLabel}>Today</Text>
          <View style={styles.dailyTrack}>
            <View style={[styles.dailyFill, { width: `${dailyPct}%`, backgroundColor: p.dailyCount >= p.dailyGoal ? lightColors["neon.lime"] : lightColors["neon.cyan"] }]} />
          </View>
          <Text style={styles.dailyNum}>{p.dailyCount}/{p.dailyGoal}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing["space.4"], marginBottom: spacing["space.5"] },
  row: { flexDirection: "row", alignItems: "center" },
  levelBox: {
    width: 56, height: 56, borderRadius: 16, marginRight: spacing["space.4"],
    backgroundColor: "rgba(6,182,212,0.15)", borderWidth: 1.5, borderColor: lightColors["neon.cyan"],
    alignItems: "center", justifyContent: "center",
  },
  levelCap: { color: lightColors["neon.cyan"], fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  levelNum: { color: lightColors["neon.cyan"], fontSize: 24, fontWeight: "900", marginTop: -2 },
  topLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: lightColors["neon.cyan"], fontSize: 15, fontWeight: "900" },
  streak: { color: "#F59E0B", fontSize: 14, fontWeight: "800" },
  known: { color: lightColors["text.primary"], fontSize: 20, fontWeight: "900", marginTop: 2, marginBottom: spacing["space.2"] },
  knownUnit: { color: lightColors["text.muted"], fontSize: 13, fontWeight: "700" },
  track: { height: 8, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 5, backgroundColor: lightColors["neon.cyan"] },
  hint: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, fontWeight: "700", marginTop: spacing["space.1"] },
  dailyRow: { flexDirection: "row", alignItems: "center", marginTop: spacing["space.3"] },
  dailyLabel: { color: lightColors["text.muted"], fontSize: 12, fontWeight: "800", width: 44 },
  dailyTrack: { flex: 1, height: 8, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden", marginHorizontal: spacing["space.2"] },
  dailyFill: { height: "100%", borderRadius: 5 },
  dailyNum: { color: lightColors["text.secondary"], fontSize: 13, fontWeight: "800", width: 48, textAlign: "right" },
});
