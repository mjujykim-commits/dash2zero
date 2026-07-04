/**
 * SessionReward — 세션 종료 리워드. 게임식 성장 연출.
 *
 * XP 카운트업 → 레벨바 채워짐(레벨업 시 롤오버 + "LEVEL UP" 버스트 + 햅틱/사운드)
 * → 아는 단어 카운트업 + 실력 등급(상승 시 강조) → 연속학습.
 * 마운트 시 recordSession()으로 1회 기록.
 */

import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { recordSession, type RewardPayload, type SessionResult } from "@/src/lib/progress";
import { hapticImpact, hapticNotification } from "@/src/lib/haptics";
import { playSfx } from "@/src/lib/sound";
import { GradientBackground, GlassCard, GlowOrb, NeonButton, NumberCounter } from "@/src/components/d022";

interface Props {
  results: SessionResult[];
  onReplay: () => void;
  onExit: () => void;
  replayLabel?: string;
  exitLabel?: string;
}

export function SessionReward({ results, onReplay, onExit, replayLabel = "Play again", exitLabel = "Continue" }: Props) {
  const [p, setP] = useState<RewardPayload | null>(null);
  const recorded = useRef(false);

  // 진입 애니메이션
  const enter = useRef(new Animated.Value(0)).current;
  const barW = useRef(new Animated.Value(0)).current;
  const luScale = useRef(new Animated.Value(0)).current; // LEVEL UP 배지
  const [showLU, setShowLU] = useState(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordSession(results).then(setP).catch(() => setP(null));
  }, [results]);

  useEffect(() => {
    if (!p) return;
    void hapticNotification(p.correct >= p.total - 1 ? "success" : "warning");

    Animated.timing(enter, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();

    const ratioBefore = ratioWithin(p.xpBefore, p.levelBefore);
    const ratioAfter = ratioWithin(p.xpAfter, p.levelAfter);

    if (p.leveledUp) {
      barW.setValue(ratioBefore);
      Animated.timing(barW, { toValue: 1, duration: 650, delay: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(() => {
        setShowLU(true);
        void hapticNotification("success");
        void playSfx("complete");
        Animated.spring(luScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
        barW.setValue(0);
        Animated.timing(barW, { toValue: ratioAfter, duration: 700, delay: 120, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
      });
    } else {
      barW.setValue(ratioBefore);
      Animated.timing(barW, { toValue: ratioAfter, duration: 800, delay: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    }

    // 일일 목표 달성/신규 업적 — 지연된 축하 햅틱+사운드
    if (p.dailyReached || p.newAchievements.length > 0) {
      const t = setTimeout(() => { void hapticImpact("medium"); void playSfx("complete"); }, 1500);
      return () => clearTimeout(t);
    }
  }, [p, enter, barW, luScale]);

  if (!p) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={styles.sub}>…</Text>
        </View>
      </GradientBackground>
    );
  }

  const perfect = p.correct >= p.total - 1;
  const barWidth = barW.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const entryStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color={p.leveledUp ? "neon.lime" : "neon.purple"} size={320} opacity={0.4} style={{ top: -80, right: -60 }} />
      <View style={styles.content}>
        <Animated.View style={[{ alignItems: "center" }, entryStyle]}>
          <Text style={styles.resultEmoji}>{perfect ? "🎉" : "💪"}</Text>
          <Text style={styles.score}>{p.correct} / {p.total}</Text>
          <Text style={styles.sub}>correct</Text>

          {/* XP */}
          <View style={{ height: spacing["space.6"] }} />
          <NumberCounter value={p.xpGained} prefix="+" suffix=" XP" style={styles.xp} />

          {/* 레벨 바 */}
          <GlassCard style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardLabel}>Level</Text>
              <Text style={styles.levelNum}>Lv {p.levelAfter} · {p.titleAfter.ko}</Text>
            </View>
            <View style={styles.track}>
              <Animated.View style={[styles.fill, { width: barWidth }]} />
            </View>
            {showLU && (
              <Animated.View style={[styles.luBadge, { transform: [{ scale: luScale }] }]}>
                <Text style={styles.luText}>▲ LEVEL UP</Text>
              </Animated.View>
            )}
            {p.titleUp && <Text style={styles.titleUpMsg}>🏷️ New title: {p.titleAfter.ko} · {p.titleAfter.en}</Text>}
          </GlassCard>

          {/* 일일 목표 */}
          <GlassCard style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardLabel}>Daily goal</Text>
              <Text style={styles.dailyNum}>{p.dailyCount} / {p.dailyGoal}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, {
                width: `${Math.min(100, (p.dailyCount / p.dailyGoal) * 100)}%`,
                backgroundColor: p.dailyReached ? lightColors["neon.lime"] : lightColors["neon.cyan"],
              }]} />
            </View>
            {p.dailyReached && <Text style={styles.goalMsg}>🎯 Daily goal complete!</Text>}
          </GlassCard>

          {/* 아는 단어 + 등급 */}
          <GlassCard style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardLabel}>Words you know</Text>
              <View style={[styles.bandChip, p.bandUp && styles.bandChipUp]}>
                <Text style={[styles.bandText, p.bandUp && styles.bandTextUp]}>{p.bandAfter.ko} · {p.bandAfter.en}</Text>
              </View>
            </View>
            <View style={styles.rowBaseline}>
              <NumberCounter value={p.masteredAfter} from={p.masteredBefore} style={styles.known} />
              {p.newWords > 0 && <Text style={styles.newWords}>+{p.newWords} new</Text>}
            </View>
            {p.bandUp && <Text style={styles.bandUpMsg}>🚀 Level up! Your Korean reached {p.bandAfter.ko}.</Text>}
          </GlassCard>

          {/* 신규 업적 */}
          {p.newAchievements.length > 0 && (
            <GlassCard style={styles.card}>
              <Text style={styles.cardLabel}>🏅 Achievement{p.newAchievements.length > 1 ? "s" : ""} unlocked</Text>
              <View style={styles.achRow}>
                {p.newAchievements.map((a) => (
                  <View key={a.id} style={styles.achPill}>
                    <Text style={styles.achIcon}>{a.icon}</Text>
                    <Text style={styles.achTitle}>{a.title}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          )}

          {p.streakDays >= 2 && (
            <View style={styles.streak}>
              <Text style={styles.streakText}>🔥 {p.streakDays}-day streak</Text>
            </View>
          )}
        </Animated.View>

        <View style={{ flex: 1 }} />
        <NeonButton label={replayLabel} onPress={onReplay} />
        <Text style={styles.exitLink} onPress={onExit}>{exitLabel}</Text>
      </View>
    </GradientBackground>
  );
}

// 특정 xp가 주어진 레벨 안에서의 0..1 비율
function ratioWithin(xp: number, level: number): number {
  const cur = 25 * level * (level - 1);
  const next = 25 * (level + 1) * level;
  const span = next - cur;
  return span > 0 ? Math.max(0, Math.min(1, (xp - cur) / span)) : 0;
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing["space.5"], paddingTop: spacing["space.16"], paddingBottom: spacing["space.6"] },
  resultEmoji: { fontSize: 64 },
  score: { color: lightColors["text.primary"], fontSize: 56, fontWeight: "900", marginTop: spacing["space.2"] },
  sub: { color: lightColors["text.secondary"], fontSize: typeScale["text.body"].fontSize, marginTop: 2 },
  xp: { color: lightColors["neon.lime"], fontSize: 34, fontWeight: "900", marginBottom: spacing["space.5"] },
  card: { width: "100%", padding: spacing["space.4"], marginBottom: spacing["space.4"] },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing["space.3"] },
  rowBaseline: { flexDirection: "row", alignItems: "flex-end" },
  cardLabel: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  levelNum: { color: lightColors["neon.cyan"], fontSize: 20, fontWeight: "900" },
  track: { height: 14, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 8, backgroundColor: lightColors["neon.cyan"] },
  luBadge: {
    alignSelf: "center", marginTop: spacing["space.3"],
    backgroundColor: lightColors["neon.lime"], borderRadius: 999,
    paddingHorizontal: spacing["space.4"], paddingVertical: spacing["space.1"],
  },
  luText: { color: "#0B0B0F", fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  bandChip: { borderRadius: 999, paddingHorizontal: spacing["space.3"], paddingVertical: 4, backgroundColor: "rgba(255,255,255,0.08)" },
  bandChipUp: { backgroundColor: lightColors["neon.lime"] },
  bandText: { color: lightColors["text.secondary"], fontSize: 13, fontWeight: "800" },
  bandTextUp: { color: "#0B0B0F" },
  known: { color: lightColors["text.primary"], fontSize: 40, fontWeight: "900" },
  newWords: { color: lightColors["neon.lime"], fontSize: 15, fontWeight: "800", marginLeft: spacing["space.3"], marginBottom: 6 },
  bandUpMsg: { color: lightColors["neon.lime"], fontSize: 14, fontWeight: "700", marginTop: spacing["space.3"] },
  titleUpMsg: { color: lightColors["neon.cyan"], fontSize: 13, fontWeight: "800", marginTop: spacing["space.3"] },
  dailyNum: { color: lightColors["text.primary"], fontSize: 18, fontWeight: "900" },
  goalMsg: { color: lightColors["neon.lime"], fontSize: 14, fontWeight: "800", marginTop: spacing["space.3"] },
  achRow: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing["space.1"] },
  achPill: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(147,51,234,0.18)", borderWidth: 1, borderColor: lightColors["neon.purple"],
    borderRadius: 999, paddingHorizontal: spacing["space.3"], paddingVertical: 6,
    marginRight: spacing["space.2"], marginTop: spacing["space.2"],
  },
  achIcon: { fontSize: 18, marginRight: 6 },
  achTitle: { color: lightColors["text.primary"], fontSize: 13, fontWeight: "800" },
  streak: { alignSelf: "center", marginTop: spacing["space.1"] },
  streakText: { color: "#F59E0B", fontSize: 16, fontWeight: "800" },
  exitLink: { color: lightColors["text.muted"], fontSize: 15, fontWeight: "700", textAlign: "center", marginTop: spacing["space.4"] },
});
