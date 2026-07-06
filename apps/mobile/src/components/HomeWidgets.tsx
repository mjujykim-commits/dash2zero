/**
 * HomeWidgets — 홈 대시보드 게이미피케이션 위젯.
 *   StatTile  : 아이콘 + 카운트업 수치 + 라벨 (아는 단어/복습/금주/연속).
 *   WeekChart : 월~일 학습량 막대 그래프. 오늘 강조, 학습한 날 네온.
 */

import { StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";
import { GlassCard, NumberCounter } from "@/src/components/d022";
import type { WeeklyStudy } from "@/src/lib/progress";

export function StatTile({
  icon,
  value,
  label,
  color,
  suffix,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
  suffix?: string;
}) {
  return (
    <GlassCard style={styles.tile}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <NumberCounter value={value} suffix={suffix} style={StyleSheet.flatten([styles.tileValue, { color }])} />
      <Text style={styles.tileLabel}>{label}</Text>
    </GlassCard>
  );
}

export function WeekChart({ week }: { week: WeeklyStudy }) {
  const max = Math.max(week.bestDay, 1);
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>This week</Text>
        <Text style={styles.total}>
          {week.weekTotal} <Text style={styles.totalUnit}>learned</Text>
        </Text>
      </View>
      <View style={styles.barsRow}>
        {week.days.map((d, i) => {
          const h = 8 + Math.round((d.count / max) * 52); // 8..60px
          const barColor = d.active
            ? d.isToday
              ? lightColors["neon.cyan"]
              : lightColors["neon.lime"]
            : "rgba(255,255,255,0.10)";
          return (
            <View key={i} style={styles.col}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: h,
                      backgroundColor: barColor,
                      ...(d.active
                        ? { shadowColor: barColor, shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 3 }
                        : null),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, d.isToday && styles.dayLabelToday]}>{d.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.sub}>
        {week.activeDays}/7 days active · keep it going
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  // StatTile
  tile: { flex: 1, alignItems: "flex-start", paddingVertical: spacing["space.3"], paddingHorizontal: spacing["space.3"] },
  tileIcon: { fontSize: 20 },
  tileValue: { fontSize: 24, fontWeight: "900", marginTop: spacing["space.1"] },
  tileLabel: { fontSize: 11, fontWeight: "700", color: lightColors["text.muted"], marginTop: 1 },

  // WeekChart
  card: { padding: spacing["space.4"] },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  title: { color: lightColors["text.secondary"], fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },
  total: { color: lightColors["text.primary"], fontSize: 20, fontWeight: "900" },
  totalUnit: { color: lightColors["text.muted"], fontSize: 12, fontWeight: "700" },
  barsRow: { flexDirection: "row", alignItems: "flex-end", marginTop: spacing["space.3"], height: 76 },
  col: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  barTrack: { height: 60, justifyContent: "flex-end" },
  bar: { width: 14, borderRadius: 7 },
  dayLabel: { color: lightColors["text.muted"], fontSize: 11, fontWeight: "700", marginTop: 6 },
  dayLabelToday: { color: lightColors["neon.cyan"], fontWeight: "900" },
  sub: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, marginTop: spacing["space.3"] },
});
