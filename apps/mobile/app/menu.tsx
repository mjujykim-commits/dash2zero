/**
 * Menu — 앱 랜딩. 사전(Study) / 그림 퀴즈(Picture Quiz) 선택.
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

        <Pressable onPress={() => router.push("/study")}>
          <GlassCard style={styles.card}>
            <Text style={styles.cardEmoji}>📖</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Study</Text>
              <Text style={styles.cardSub}>Browse words and hear pronunciation</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </GlassCard>
        </Pressable>

        <Pressable onPress={() => router.push("/picture-quiz")}>
          <GlassCard style={styles.card}>
            <Text style={styles.cardEmoji}>🖼️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Picture Quiz</Text>
              <Text style={styles.cardSub}>Match pictures and words</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </GlassCard>
        </Pressable>

        <View style={{ flex: 1 }} />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing["space.5"], paddingTop: spacing["space.16"], paddingBottom: spacing["space.6"] },
  hero: { marginBottom: spacing["space.8"] },
  title: { color: lightColors["text.primary"], fontSize: 40, fontWeight: "900" },
  sub: { color: lightColors["text.secondary"], fontSize: typeScale["text.body"].fontSize, marginTop: spacing["space.1"] },
  card: { flexDirection: "row", alignItems: "center", padding: spacing["space.5"], marginBottom: spacing["space.4"] },
  cardEmoji: { fontSize: 40, marginRight: spacing["space.4"] },
  cardTitle: { color: lightColors["text.primary"], fontSize: 20, fontWeight: "800" },
  cardSub: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, marginTop: 2 },
  chevron: { color: lightColors["text.muted"], fontSize: 28, marginLeft: spacing["space.2"] },
});
