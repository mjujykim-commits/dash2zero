/**
 * Menu — 앱 랜딩. Study / Quiz 큰 버튼 2개 + 아래 오답 복습 버튼.
 */

import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { GradientBackground, GlassCard, GlowOrb } from "@/src/components/d022";

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
  reviewBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: lightColors["neon.cyan"],
    paddingVertical: spacing["space.4"],
    alignItems: "center",
  },
  reviewText: { color: lightColors["neon.cyan"], fontSize: 16, fontWeight: "800" },
});
