/**
 * Menu — 앱 랜딩. Study / Quiz 큰 버튼 2개 + 아래 오답 복습 버튼.
 */

import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { GradientBackground, GlassCard, GlowOrb } from "@/src/components/d022";
import { ProficiencyCard } from "@/src/components/ProficiencyCard";
import { isPremium } from "@/src/lib/premium";

export default function Menu() {
  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.purple" size={320} opacity={0.4} style={{ top: -80, left: -60 }} />
      <GlowOrb color="neon.pink" size={240} opacity={0.35} style={{ bottom: 100, right: -60 }} />

      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>dash2zero</Text>
          <Text style={styles.sub}>Learn Korean with pictures.</Text>
        </View>

        <ProficiencyCard />

        {/* 큰 버튼 2개 */}
        <Pressable onPress={() => router.push("/study")}>
          <GlassCard style={styles.bigCard}>
            <Text style={styles.bigEmoji}>📖</Text>
            <Text style={styles.bigTitle}>Study</Text>
            <Text style={styles.bigSub}>Browse words & hear pronunciation</Text>
          </GlassCard>
        </Pressable>

        <Pressable onPress={() => router.push("/quizzes")}>
          <GlassCard style={styles.bigCard}>
            <Text style={styles.bigEmoji}>🎯</Text>
            <Text style={styles.bigTitle}>Quiz</Text>
            <Text style={styles.bigSub}>Picture · Meaning · Audio</Text>
          </GlassCard>
        </Pressable>

        {/* 유료(예정) 진입점 — 게이트 한 곳(isPremium)에서 분기 */}
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

        <View style={{ flex: 1 }} />

        {/* 오답 복습 버튼 */}
        <Pressable onPress={() => router.push("/picture-quiz?review=1")}>
          <View style={styles.reviewBtn}>
            <Text style={styles.reviewText}>🔁  Review wrong words</Text>
          </View>
        </Pressable>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing["space.5"], paddingTop: spacing["space.16"], paddingBottom: spacing["space.8"] },
  hero: { marginBottom: spacing["space.6"] },
  title: { color: lightColors["text.primary"], fontSize: 40, fontWeight: "900" },
  sub: { color: lightColors["text.secondary"], fontSize: typeScale["text.body"].fontSize, marginTop: spacing["space.1"] },
  bigCard: {
    alignItems: "center",
    paddingVertical: spacing["space.8"],
    marginBottom: spacing["space.4"],
  },
  bigEmoji: { fontSize: 52 },
  bigTitle: { color: lightColors["text.primary"], fontSize: 26, fontWeight: "900", marginTop: spacing["space.2"] },
  bigSub: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, marginTop: spacing["space.1"] },
  examCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing["space.4"],
    paddingHorizontal: spacing["space.5"],
    marginBottom: spacing["space.4"],
    borderWidth: 1.5,
    borderColor: "#F5C542", // 프리미엄 골드 액센트
  },
  examEmoji: { fontSize: 34, marginRight: spacing["space.4"] },
  examTitleRow: { flexDirection: "row", alignItems: "center" },
  examTitle: { color: lightColors["text.primary"], fontSize: 20, fontWeight: "900" },
  proChip: {
    marginLeft: spacing["space.2"], backgroundColor: "#F5C542",
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1,
  },
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
