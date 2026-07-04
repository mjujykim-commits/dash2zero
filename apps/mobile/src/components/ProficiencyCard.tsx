/**
 * ProficiencyCard — 메뉴 상단 실력 요약. 레벨 + XP 바 + 아는 단어/등급 + 연속학습.
 * 화면 포커스 시 갱신(세션 후 즉시 반영).
 */

import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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
  const pct = Math.round(p.ratio * 100);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.levelBox}>
          <Text style={styles.levelCap}>LV</Text>
          <Text style={styles.levelNum}>{p.level}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.topLine}>
            <Text style={styles.known}>
              {p.mastered} <Text style={styles.knownUnit}>words</Text>
            </Text>
            <View style={styles.bandChip}>
              <Text style={styles.bandText}>{p.band.ko} · {p.band.en}</Text>
            </View>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.bottomLine}>
            <Text style={styles.hint}>{p.toNext} XP to Lv {p.level + 1}</Text>
            {p.streak >= 2 && <Text style={styles.streak}>🔥 {p.streak}d</Text>}
          </View>
        </View>
      </View>
    </GlassCard>
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
  topLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing["space.2"] },
  known: { color: lightColors["text.primary"], fontSize: 22, fontWeight: "900" },
  knownUnit: { color: lightColors["text.muted"], fontSize: 13, fontWeight: "700" },
  bandChip: { borderRadius: 999, paddingHorizontal: spacing["space.3"], paddingVertical: 3, backgroundColor: "rgba(255,255,255,0.08)" },
  bandText: { color: lightColors["text.secondary"], fontSize: 12, fontWeight: "800" },
  track: { height: 10, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 6, backgroundColor: lightColors["neon.cyan"] },
  bottomLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing["space.2"] },
  hint: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, fontWeight: "700" },
  streak: { color: "#F59E0B", fontSize: 14, fontWeight: "800" },
});
