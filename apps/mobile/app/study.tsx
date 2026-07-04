/**
 * Study (사전) — 1스크린 1단어 플래시카드. 틱톡/쇼츠식 세로 스와이프로 넘김.
 *
 * 큰 이모지 + 한글 + 뜻. 카드 진입 시 발음 자동 재생, 탭하면 다시 재생.
 * 위로 스와이프=다음 / 아래로=이전. 카테고리 칩으로 주제 전환. 발음: emoji/{korean}.mp3.
 */

import { Audio } from "expo-av";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { EMOJI_WORDS, type EmojiWord } from "@/src/lib/emojiWords";
import { getKnownSet, markKnown } from "@/src/lib/knownStore";
import { hapticImpact } from "@/src/lib/haptics";
import { SUPABASE_URL } from "@/src/lib/supabase";
import { useVerticalSwipe } from "@/src/hooks/useVerticalSwipe";
import { SwipeHint } from "@/src/components/SwipeHint";
import { GradientBackground, GlassCard, GlowOrb } from "@/src/components/d022";

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
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hasSwiped, setHasSwiped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => { getKnownSet().then(setKnown).catch(() => undefined); }, []);

  // 카테고리 필터 + 아는 단어 제외
  const words = useMemo(
    () => (cat === "all" ? EMOJI_WORDS : EMOJI_WORDS.filter((w) => w.category === cat)).filter((w) => !known.has(w.korean)),
    [cat, known],
  );

  const word = words[index];

  // 카테고리 바꾸면 처음으로
  useEffect(() => setIndex(0), [cat]);

  async function play(korean: string) {
    setPlaying(true);
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => undefined);
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri(korean) }, { shouldPlay: true, volume: 1 });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) setPlaying(false);
      });
    } catch {
      setPlaying(false);
    }
  }

  // 카드 바뀔 때마다 발음 자동 재생
  useEffect(() => {
    if (word) void play(word.korean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.korean]);

  useEffect(() => {
    return () => {
      if (soundRef.current) void soundRef.current.unloadAsync().catch(() => undefined);
    };
  }, []);

  const go = (delta: number) => {
    void hapticImpact("light");
    setIndex((i) => Math.min(Math.max(0, i + delta), words.length - 1));
  };

  // "안다" → known 추가(제외). index가 다음 카드를 가리키도록 클램프.
  function knowIt() {
    if (!word) return;
    void markKnown(word.korean);
    void hapticImpact("light");
    setKnown((prev) => new Set(prev).add(word.korean));
    setIndex((i) => Math.min(i, Math.max(0, words.length - 2)));
  }

  const swipe = useVerticalSwipe({
    enabled: words.length > 0,
    onSwipeUp: () => { setHasSwiped(true); go(1); },
    onSwipeDown: () => { setHasSwiped(true); go(-1); },
  });

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.cyan" size={260} opacity={0.3} style={{ top: -60, left: -60 }} />

      <View style={styles.content} {...swipe}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.link}>‹ Menu</Text>
          </Pressable>
          <Text style={styles.count}>
            {words.length ? index + 1 : 0} / {words.length}
          </Text>
        </View>

        {/* 카테고리 칩 */}
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

        {word ? (
          <>
            {/* 플래시카드 */}
            <View style={styles.cardArea}>
              <Pressable style={{ width: "100%" }} onPress={() => word && play(word.korean)}>
                <GlassCard style={styles.flashCard}>
                  <Text style={styles.emoji}>{word.emoji}</Text>
                  <Text style={styles.korean}>{word.korean}</Text>
                  <Text style={styles.gloss}>{word.gloss}</Text>
                  <View style={styles.speakerPill}>
                    <Text style={styles.speakerText}>{playing ? "🔊 Playing…" : "🔈 Tap to hear"}</Text>
                  </View>
                </GlassCard>
              </Pressable>
            </View>

            {/* 안다 / 아직 몰라 */}
            <View style={styles.decideRow}>
              <Pressable onPress={() => go(1)} style={[styles.decideBtn, styles.stillBtn]}>
                <Text style={styles.stillText}>Still learning</Text>
              </Pressable>
              <Pressable onPress={knowIt} style={[styles.decideBtn, styles.knowBtn]}>
                <Text style={styles.knowText}>✓ I know this</Text>
              </Pressable>
            </View>

            <View style={styles.hintArea}>
              <SwipeHint visible={!hasSwiped && words.length > 1} label="Swipe" direction="both" />
            </View>
          </>
        ) : (
          <View style={[styles.cardArea, { alignItems: "center", justifyContent: "center" }]}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.korean}>All learned!</Text>
            <Text style={styles.gloss}>No unknown words in this topic. Miss one in a quiz and it comes back.</Text>
          </View>
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing["space.5"], paddingTop: spacing["space.12"], paddingBottom: spacing["space.6"] },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { color: lightColors["neon.cyan"], fontSize: 16, fontWeight: "700" },
  count: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, fontWeight: "800" },
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
  cardArea: { flex: 1, justifyContent: "center" },
  flashCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["space.10"],
    paddingHorizontal: spacing["space.5"],
  },
  emoji: { fontSize: 120 },
  korean: { color: lightColors["korean.glyph"], fontSize: 52, fontWeight: "900", marginTop: spacing["space.4"] },
  gloss: { color: lightColors["text.secondary"], fontSize: 22, fontWeight: "700", marginTop: spacing["space.2"] },
  speakerPill: {
    marginTop: spacing["space.5"],
    paddingHorizontal: spacing["space.4"],
    paddingVertical: spacing["space.2"],
    borderRadius: 999,
    backgroundColor: "rgba(6,182,212,0.14)",
    borderWidth: 1,
    borderColor: lightColors["neon.cyan"],
  },
  speakerText: { color: lightColors["neon.cyan"], fontSize: 14, fontWeight: "800" },
  decideRow: { flexDirection: "row", justifyContent: "space-between" },
  decideBtn: { flex: 1, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginHorizontal: spacing["space.1"] },
  stillBtn: { backgroundColor: "rgba(255,255,255,0.07)" },
  stillText: { color: lightColors["text.secondary"], fontSize: 15, fontWeight: "800" },
  knowBtn: { backgroundColor: lightColors["semantic.success"] },
  knowText: { color: "#0B0B0F", fontSize: 15, fontWeight: "900" },
  hintArea: { height: 56, justifyContent: "center", alignItems: "center" },
});
