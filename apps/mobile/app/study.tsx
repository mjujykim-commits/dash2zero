/**
 * Study (사전) — 그림(이모지) + 한글 + 뜻 카드. 탭하면 발음 재생.
 *
 * 발음: Supabase Storage의 emoji/{korean}.mp3 (generate-emoji-audio.mjs 생성) → expo-av 재생.
 * 카테고리 필터로 주제별 열람.
 */

import { Audio } from "expo-av";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { EMOJI_WORDS, type EmojiWord } from "@/src/lib/emojiWords";
import { SUPABASE_URL } from "@/src/lib/supabase";
import { GradientBackground, GlowOrb } from "@/src/components/d022";

type CatKey = EmojiWord["category"] | "all";

const CATEGORIES: { key: CatKey; label: string; emoji: string }[] = [
  { key: "all", label: "All", emoji: "🎲" },
  { key: "food", label: "Food", emoji: "🍔" },
  { key: "animal", label: "Animals", emoji: "🐶" },
  { key: "object", label: "Objects", emoji: "💻" },
  { key: "nature", label: "Nature", emoji: "🌋" },
  { key: "vehicle", label: "Vehicles", emoji: "🚗" },
  { key: "place", label: "Places", emoji: "🏥" },
  { key: "activity", label: "Sports", emoji: "⚽" },
  { key: "clothing", label: "Clothing", emoji: "👗" },
  { key: "music", label: "Music", emoji: "🎸" },
  { key: "plant", label: "Plants", emoji: "🌱" },
  { key: "body", label: "Body", emoji: "✋" },
];

// Supabase 스토리지 키는 유니코드 불가 → encodeURIComponent의 %제거(UTF-8 hex). 스크립트와 동일.
function audioUri(korean: string): string {
  const key = encodeURIComponent(korean).replace(/%/g, "");
  return `${SUPABASE_URL}/storage/v1/object/public/audio/emoji/${key}.mp3`;
}

export default function Study() {
  const [cat, setCat] = useState<CatKey>("all");
  const [playing, setPlaying] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const words = useMemo(
    () => (cat === "all" ? EMOJI_WORDS : EMOJI_WORDS.filter((w) => w.category === cat)),
    [cat],
  );

  useEffect(() => {
    return () => {
      if (soundRef.current) void soundRef.current.unloadAsync().catch(() => undefined);
    };
  }, []);

  async function play(korean: string) {
    setPlaying(korean);
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => undefined);
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri(korean) }, { shouldPlay: true, volume: 1 });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) setPlaying((p) => (p === korean ? null : p));
      });
    } catch {
      setPlaying(null);
    }
  }

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.cyan" size={240} opacity={0.3} style={{ top: -60, left: -60 }} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.link}>‹ Menu</Text>
          </Pressable>
          <Text style={styles.count}>{words.length} words</Text>
        </View>
        <Text style={styles.heading}>Study</Text>
        <Text style={styles.sub}>Tap a card to hear the pronunciation.</Text>

        {/* 카테고리 필터 */}
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(c) => c.key}
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginTop: spacing["space.3"] }}
          renderItem={({ item }) => {
            const active = item.key === cat;
            return (
              <Pressable onPress={() => setCat(item.key)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {item.emoji} {item.label}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* 단어 그리드 */}
        <FlatList
          data={words}
          keyExtractor={(w) => w.korean}
          numColumns={3}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          style={{ flex: 1, marginTop: spacing["space.3"] }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isPlaying = playing === item.korean;
            return (
              <Pressable onPress={() => play(item.korean)} style={[styles.card, isPlaying && styles.cardActive]}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                <Text style={styles.cardKorean}>{item.korean}</Text>
                <Text style={styles.cardGloss} numberOfLines={1}>{item.gloss}</Text>
                <Text style={styles.speaker}>{isPlaying ? "🔊" : "🔈"}</Text>
              </Pressable>
            );
          }}
          ListFooterComponent={<View style={{ height: spacing["space.8"] }} />}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing["space.4"], paddingTop: spacing["space.12"], paddingBottom: spacing["space.2"] },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { color: lightColors["neon.cyan"], fontSize: 16, fontWeight: "700" },
  count: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, fontWeight: "700" },
  heading: { color: lightColors["text.primary"], fontSize: 28, fontWeight: "900", marginTop: spacing["space.2"] },
  sub: { color: lightColors["text.secondary"], fontSize: typeScale["text.caption"].fontSize, marginTop: 2 },
  chip: {
    paddingHorizontal: spacing["space.3"],
    paddingVertical: spacing["space.2"],
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginRight: spacing["space.2"],
  },
  chipActive: { backgroundColor: lightColors["neon.cyan"] },
  chipText: { color: lightColors["text.secondary"], fontSize: 13, fontWeight: "700" },
  chipTextActive: { color: "#0B0B0F" },
  card: {
    width: "31.5%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    paddingVertical: spacing["space.3"],
    marginBottom: spacing["space.3"],
  },
  cardActive: { borderColor: lightColors["neon.cyan"], backgroundColor: "rgba(6,182,212,0.12)" },
  cardEmoji: { fontSize: 40 },
  cardKorean: { color: lightColors["korean.glyph"], fontSize: 18, fontWeight: "800", marginTop: 4 },
  cardGloss: { color: lightColors["text.muted"], fontSize: 11, marginTop: 2, maxWidth: "100%" },
  speaker: { fontSize: 14, marginTop: 4 },
});
