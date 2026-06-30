/**
 * Picture Quiz — 이모지(그림) 제시 → 한글 4지선다. Picture Quiz 전용 앱.
 *
 * 흐름: 카테고리 선택 → 퀴즈(최대 10라운드) → 결과 → Play again / Change category.
 * 카테고리 선택 시 그 주제 단어만 출제(distractor도 같은 주제 → 적정 난이도).
 */

import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { EMOJI_WORDS, type EmojiWord } from "@/src/lib/emojiWords";
import { hapticNotification } from "@/src/lib/haptics";
import { playSfx } from "@/src/lib/sound";
import { GradientBackground, GlassCard, GlowOrb, NeonButton } from "@/src/components/d022";

const MAX_ROUNDS = 10;

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

interface Question {
  target: EmojiWord;
  options: EmojiWord[];
}

function buildQuestions(cat: CatKey): Question[] {
  const pool = cat === "all" ? EMOJI_WORDS : EMOJI_WORDS.filter((w) => w.category === cat);
  const targets = shuffle(pool).slice(0, Math.min(MAX_ROUNDS, pool.length));
  return targets.map((target) => {
    const distractors = shuffle(pool.filter((w) => w.korean !== target.korean)).slice(0, 3);
    return { target, options: shuffle([target, ...distractors]) };
  });
}

export default function PictureQuiz() {
  const [category, setCategory] = useState<CatKey | null>(null);
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => (category ? buildQuestions(category) : []), [seed, category]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const lockRef = useRef(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: EMOJI_WORDS.length };
    EMOJI_WORDS.forEach((w) => (c[w.category] = (c[w.category] || 0) + 1));
    return c;
  }, []);

  const total = questions.length;
  const q = questions[round];

  function start(cat: CatKey) {
    setCategory(cat);
    setSeed((s) => s + 1);
    setRound(0);
    setScore(0);
    setPicked(null);
    setDone(false);
    lockRef.current = false;
  }

  function choose(opt: EmojiWord) {
    if (lockRef.current || !q) return;
    lockRef.current = true;
    setPicked(opt.korean);
    const correct = opt.korean === q.target.korean;
    if (correct) {
      setScore((s) => s + 1);
      void hapticNotification("success");
      void playSfx("correct");
    } else {
      void hapticNotification("warning");
      void playSfx("incorrect");
    }
    setTimeout(() => {
      lockRef.current = false;
      setPicked(null);
      if (round + 1 >= total) {
        setDone(true);
        void playSfx("complete");
      } else {
        setRound((r) => r + 1);
      }
    }, 1100);
  }

  // 1) 카테고리 선택 화면
  if (!category) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <GlowOrb color="neon.pink" size={260} opacity={0.3} style={{ top: -60, right: -60 }} />
        <View style={styles.content}>
          <Text style={styles.bigTitle}>Picture Quiz</Text>
          <Text style={styles.sub}>Pick a topic.</Text>
          <ScrollView style={{ flex: 1, marginTop: spacing["space.5"] }} showsVerticalScrollIndicator={false}>
            <View style={styles.catGrid}>
              {CATEGORIES.map((c) => (
                <Pressable key={c.key} onPress={() => start(c.key)} style={styles.catCellWrap}>
                  <GlassCard style={styles.catCell}>
                    <Text style={styles.catEmoji}>{c.emoji}</Text>
                    <Text style={styles.catLabel}>{c.label}</Text>
                    <Text style={styles.catCount}>{counts[c.key] ?? 0}</Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
            <View style={{ height: spacing["space.8"] }} />
          </ScrollView>
        </View>
      </GradientBackground>
    );
  }

  // 2) 결과 화면
  if (done) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <GlowOrb color="neon.lime" size={280} opacity={0.35} style={{ top: -60, right: -60 }} />
        <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={styles.resultEmoji}>{score >= total - 1 ? "🎉" : "👍"}</Text>
          <Text style={styles.resultScore}>
            {score} / {total}
          </Text>
          <Text style={styles.sub}>correct</Text>
          <View style={{ height: spacing["space.8"] }} />
          <View style={{ width: "100%" }}>
            <NeonButton label="Play again" onPress={() => start(category)} />
          </View>
          <Pressable onPress={() => setCategory(null)} hitSlop={10} style={{ marginTop: spacing["space.4"] }}>
            <Text style={styles.link}>Change topic</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  // 3) 퀴즈 화면
  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.pink" size={240} opacity={0.3} style={{ top: -60, left: -60 }} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable onPress={() => setCategory(null)} hitSlop={12}>
            <Text style={styles.link}>‹ Topics</Text>
          </Pressable>
          <Text style={styles.progress}>
            {round + 1} / {total} · score {score}
          </Text>
        </View>

        <Text style={styles.prompt}>Which word is this?</Text>
        <Text style={styles.promptEmoji}>{q?.target.emoji}</Text>

        <View style={styles.grid}>
          {q?.options.map((opt) => {
            const isPicked = picked === opt.korean;
            const isCorrect = opt.korean === q.target.korean;
            const showState = picked !== null && (isPicked || isCorrect);
            const borderColor = showState
              ? isCorrect
                ? lightColors["semantic.success"]
                : isPicked
                  ? lightColors["semantic.danger"]
                  : "transparent"
              : "transparent";
            return (
              <Pressable
                key={opt.korean}
                onPress={() => choose(opt)}
                style={{ width: "48%", marginBottom: spacing["space.3"] }}
              >
                <GlassCard style={[styles.optionCard, { borderColor, borderWidth: showState ? 2 : 0 }]}>
                  <Text style={styles.optionKorean}>{opt.korean}</Text>
                  {showState && isCorrect && <Text style={styles.optionGloss}>{opt.gloss}</Text>}
                </GlassCard>
              </Pressable>
            );
          })}
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing["space.5"],
    paddingTop: spacing["space.12"],
    paddingBottom: spacing["space.6"],
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { color: lightColors["neon.cyan"], fontSize: 16, fontWeight: "700" },
  progress: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, fontWeight: "700" },
  bigTitle: { color: lightColors["text.primary"], fontSize: 32, fontWeight: "900" },
  sub: { color: lightColors["text.secondary"], fontSize: typeScale["text.body"].fontSize, marginTop: spacing["space.1"] },
  catGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  catCellWrap: { width: "31%", marginBottom: spacing["space.3"] },
  catCell: { alignItems: "center", justifyContent: "center", paddingVertical: spacing["space.4"] },
  catEmoji: { fontSize: 36 },
  catLabel: { color: lightColors["text.primary"], fontSize: 13, fontWeight: "800", marginTop: spacing["space.1"] },
  catCount: { color: lightColors["text.muted"], fontSize: 11, marginTop: 2 },
  prompt: {
    color: lightColors["text.secondary"],
    fontSize: typeScale["text.body"].fontSize,
    marginTop: spacing["space.8"],
    textAlign: "center",
  },
  promptEmoji: { fontSize: 110, textAlign: "center", marginTop: spacing["space.3"], marginBottom: spacing["space.8"] },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  optionCard: { height: 120, alignItems: "center", justifyContent: "center", padding: spacing["space.3"] },
  optionKorean: { color: lightColors["korean.glyph"], fontSize: 26, fontWeight: "800", textAlign: "center" },
  optionGloss: {
    color: lightColors["semantic.success"],
    fontSize: typeScale["text.caption"].fontSize,
    fontWeight: "700",
    marginTop: spacing["space.1"],
  },
  resultEmoji: { fontSize: 72 },
  resultScore: { color: lightColors["text.primary"], fontSize: 64, fontWeight: "900", marginTop: spacing["space.3"] },
});
