/**
 * Quizzes — 퀴즈 종류 선택 (Picture / Meaning / Audio).
 */

import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { GradientBackground, GlassCard, GlowOrb } from "@/src/components/d022";

const ITEMS = [
  { emoji: "🖼️", title: "Picture Quiz", sub: "Match pictures and words", href: "/picture-quiz" },
  { emoji: "💬", title: "Meaning Quiz", sub: "Match Korean words and meanings", href: "/vocab-quiz?mode=meaning" },
  { emoji: "🔊", title: "Audio Quiz", sub: "Hear a word, pick the Korean", href: "/vocab-quiz?mode=audio" },
];

export default function Quizzes() {
  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.pink" size={260} opacity={0.3} style={{ top: -60, right: -60 }} />
      <View style={styles.content}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginBottom: spacing["space.2"] }}>
          <Text style={styles.link}>‹ Menu</Text>
        </Pressable>
        <Text style={styles.heading}>Quizzes</Text>
        <Text style={styles.sub}>Pick a quiz type.</Text>

        <View style={{ marginTop: spacing["space.6"] }}>
          {ITEMS.map((it) => (
            <Pressable key={it.href} onPress={() => router.push(it.href)}>
              <GlassCard style={styles.card}>
                <Text style={styles.cardEmoji}>{it.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{it.title}</Text>
                  <Text style={styles.cardSub}>{it.sub}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing["space.5"], paddingTop: spacing["space.12"], paddingBottom: spacing["space.6"] },
  link: { color: lightColors["neon.cyan"], fontSize: 16, fontWeight: "700" },
  heading: { color: lightColors["text.primary"], fontSize: 30, fontWeight: "900", marginTop: spacing["space.2"] },
  sub: { color: lightColors["text.secondary"], fontSize: typeScale["text.body"].fontSize, marginTop: spacing["space.1"] },
  card: { flexDirection: "row", alignItems: "center", padding: spacing["space.5"], marginBottom: spacing["space.4"] },
  cardEmoji: { fontSize: 40, marginRight: spacing["space.4"] },
  cardTitle: { color: lightColors["text.primary"], fontSize: 20, fontWeight: "800" },
  cardSub: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, marginTop: 2 },
  chevron: { color: lightColors["text.muted"], fontSize: 28, marginLeft: spacing["space.2"] },
});
