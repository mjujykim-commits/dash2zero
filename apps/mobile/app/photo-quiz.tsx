/**
 * Photo Quiz — 실사진(Pexels) 보여주고 한글 4지선다.
 *
 * 카테고리 선택 → 문제 개수 입력 → 퀴즈. 사진이 준비된 단어만 출제(manifest 기준).
 * 정답 공개 시 Pexels 저작자 크레딧 표시(필수). 답변은 reviewStore에 기록(오답 복습 공유).
 */

import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { EMOJI_WORDS, type EmojiWord } from "@/src/lib/emojiWords";
import { hapticNotification } from "@/src/lib/haptics";
import { playSfx } from "@/src/lib/sound";
import { recordAnswer } from "@/src/lib/reviewStore";
import { getPhotoManifest, photoUri, type PhotoCredit } from "@/src/lib/photos";
import { GradientBackground, GlassCard, GlowOrb, NeonButton } from "@/src/components/d022";

const DEFAULT_ROUNDS = 10;

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

function buildQuestions(pool: EmojiWord[], all: EmojiWord[], rounds: number): Question[] {
  const targets = shuffle(pool).slice(0, Math.min(rounds, pool.length));
  return targets.map((target) => {
    let dpool = all.filter((w) => w.korean !== target.korean);
    const distractors = shuffle(dpool).slice(0, 3);
    return { target, options: shuffle([target, ...distractors]) };
  });
}

export default function PhotoQuiz() {
  // 사진이 준비된 단어만 사용
  const [ready, setReady] = useState<EmojiWord[] | null>(null); // null=로딩
  const creditsRef = useRef<Record<string, PhotoCredit>>({});

  const [category, setCategory] = useState<CatKey | null>(null);
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [seed, setSeed] = useState(0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const lockRef = useRef(false);

  useEffect(() => {
    (async () => {
      const manifest = await getPhotoManifest();
      creditsRef.current = manifest;
      const keys = new Set(Object.keys(manifest));
      setReady(EMOJI_WORDS.filter((w) => keys.has(w.korean)));
    })();
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: ready?.length ?? 0 };
    (ready ?? []).forEach((w) => (c[w.category] = (c[w.category] || 0) + 1));
    return c;
  }, [ready]);

  const poolFor = (cat: CatKey): EmojiWord[] =>
    cat === "all" ? ready ?? [] : (ready ?? []).filter((w) => w.category === cat);

  const questions = useMemo(() => {
    if (!category || !ready) return [];
    return buildQuestions(poolFor(category), ready, rounds);
  }, [seed, category, rounds, ready]);

  const total = questions.length;
  const q = questions[round];

  const resetRun = () => {
    setRound(0);
    setScore(0);
    setPicked(null);
    setDone(false);
    lockRef.current = false;
    setSeed((s) => s + 1);
  };

  function start(cat: CatKey, r: number) {
    setCategory(cat);
    setRounds(r);
    resetRun();
  }

  function promptRounds(cat: CatKey) {
    const max = counts[cat] ?? 0;
    Alert.prompt(
      "How many questions?",
      `Enter 1 – ${max}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: (value) => {
            let n = parseInt((value ?? "").trim(), 10);
            if (!Number.isFinite(n) || n < 1) n = Math.min(DEFAULT_ROUNDS, max);
            n = Math.min(Math.max(1, n), max);
            start(cat, n);
          },
        },
      ],
      "plain-text",
      String(Math.min(DEFAULT_ROUNDS, max)),
      "number-pad",
    );
  }

  function choose(opt: EmojiWord) {
    if (lockRef.current || !q) return;
    lockRef.current = true;
    setPicked(opt.korean);
    const correct = opt.korean === q.target.korean;
    void recordAnswer(q.target.korean, correct);
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
    }, 1300);
  }

  // ── 로딩 ──
  if (ready === null) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator color={lightColors["neon.cyan"]} />
          <Text style={[styles.sub, { marginTop: spacing["space.3"] }]}>Loading photos…</Text>
        </View>
      </GradientBackground>
    );
  }

  // ── 사진 아직 없음 ──
  if (ready.length === 0) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={styles.resultEmoji}>📷</Text>
          <Text style={styles.bigTitle}>Photos are on the way</Text>
          <Text style={styles.sub}>Real photos are still being prepared. Please try again soon.</Text>
          <View style={{ height: spacing["space.8"] }} />
          <View style={{ width: "100%" }}>
            <NeonButton label="Back" onPress={() => router.back()} />
          </View>
        </View>
      </GradientBackground>
    );
  }

  // ── 카테고리 선택 ──
  if (!category) {
    const cats = CATEGORIES.filter((c) => (counts[c.key] ?? 0) > 0);
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <GlowOrb color="neon.cyan" size={260} opacity={0.3} style={{ top: -60, right: -60 }} />
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginBottom: spacing["space.2"] }}>
            <Text style={styles.link}>‹ Quizzes</Text>
          </Pressable>
          <Text style={styles.bigTitle}>Photo Quiz</Text>
          <Text style={styles.sub}>Real photos. Pick a topic.</Text>
          <ScrollView style={{ flex: 1, marginTop: spacing["space.5"] }} showsVerticalScrollIndicator={false}>
            <View style={styles.catGrid}>
              {cats.map((c) => (
                <Pressable key={c.key} onPress={() => promptRounds(c.key)} style={styles.catCellWrap}>
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

  // ── 결과 ──
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
            <NeonButton label="Play again" onPress={() => category && start(category, rounds)} />
          </View>
          <Pressable onPress={() => setCategory(null)} hitSlop={10} style={{ marginTop: spacing["space.4"] }}>
            <Text style={styles.link}>Change topic</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  // ── 퀴즈 ──
  const credit = q ? creditsRef.current[q.target.korean] : undefined;
  const revealed = picked !== null;
  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
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

        <View style={styles.photoWrap}>
          {q && (
            <Image
              source={{ uri: photoUri(q.target.korean) }}
              style={styles.photo}
              resizeMode="cover"
            />
          )}
          {revealed && credit && (
            <Pressable onPress={() => Linking.openURL(credit.pexels_url)} style={styles.creditPill}>
              <Text style={styles.creditText}>📷 {credit.photographer} · Pexels</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.grid}>
          {q?.options.map((opt) => {
            const isPicked = picked === opt.korean;
            const isCorrect = opt.korean === q.target.korean;
            const showState = revealed && (isPicked || isCorrect);
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
  sub: { color: lightColors["text.secondary"], fontSize: typeScale["text.body"].fontSize, marginTop: spacing["space.1"], textAlign: "center" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  catCellWrap: { width: "31%", marginBottom: spacing["space.3"] },
  catCell: { alignItems: "center", justifyContent: "center", paddingVertical: spacing["space.4"] },
  catEmoji: { fontSize: 36 },
  catLabel: { color: lightColors["text.primary"], fontSize: 13, fontWeight: "800", marginTop: spacing["space.1"] },
  catCount: { color: lightColors["text.muted"], fontSize: 11, marginTop: 2 },
  prompt: { color: lightColors["text.secondary"], fontSize: typeScale["text.body"].fontSize, marginTop: spacing["space.6"], textAlign: "center" },
  photoWrap: {
    marginTop: spacing["space.3"],
    marginBottom: spacing["space.6"],
    borderRadius: 20,
    overflow: "hidden",
    alignSelf: "center",
    width: "100%",
    aspectRatio: 1,
    maxHeight: 300,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  photo: { width: "100%", height: "100%" },
  creditPill: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creditText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  optionCard: { height: 96, alignItems: "center", justifyContent: "center", padding: spacing["space.3"] },
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
