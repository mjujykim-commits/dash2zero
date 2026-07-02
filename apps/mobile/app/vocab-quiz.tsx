/**
 * Vocab Quiz — 846 어휘로 이미지 없는 퀴즈. mode로 분기:
 *   meaning: 뜻↔한글 4지선다 (방향 랜덤)
 *   audio:   발음 듣고 "영어 뜻" 고르기 (🔊) — 의미 학습이 목적이므로 보기는 영문.
 *
 * 흐름: 카테고리(팩) 선택 → 문제 개수 입력(RoundsModal) → 퀴즈.
 * 데이터: content-manifest(getVocabPacks). 발음: public 버킷 word/{id}.mp3 (expo-av).
 */

import { Audio } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { getVocabPacks, vocabAudioUri, type VocabPack, type VocabWord } from "@/src/lib/vocab";
import { hapticNotification } from "@/src/lib/haptics";
import { playSfx } from "@/src/lib/sound";
import { RoundsModal } from "@/src/components/RoundsModal";
import { GradientBackground, GlassCard, GlowOrb, NeonButton } from "@/src/components/d022";

const DEFAULT_ROUNDS = 10;

// 팩 표시용 이모지/짧은 라벨 (pack_id 기준, 미매핑은 name 앞부분 사용)
const PACK_META: Record<string, { emoji: string; label: string }> = {
  "starter-001": { emoji: "🌱", label: "Survival" },
  "core-kpop-001": { emoji: "🎤", label: "K-pop" },
  "core-kdrama-001": { emoji: "🎬", label: "K-drama" },
  "core-travel-001": { emoji: "✈️", label: "Travel" },
  "premium-pack-001": { emoji: "📚", label: "Daily 300" },
  "theme-verbs-001": { emoji: "🏃", label: "Verbs" },
  "theme-adjectives-001": { emoji: "📏", label: "Adjectives" },
  "theme-body-001": { emoji: "✋", label: "Body" },
  "theme-calendar-001": { emoji: "📅", label: "Calendar" },
  "theme-colors-001": { emoji: "🎨", label: "Colors" },
  "theme-days-001": { emoji: "⏰", label: "Days & Time" },
  "theme-emotions-001": { emoji: "😊", label: "Emotions" },
  "theme-family-001": { emoji: "👪", label: "Family" },
  "theme-home-001": { emoji: "🏠", label: "Home" },
  "theme-jobs-001": { emoji: "👔", label: "Jobs" },
  "theme-numbers-001": { emoji: "🔢", label: "Numbers" },
  "theme-seasons-001": { emoji: "🌤️", label: "Seasons" },
  "monthly-2026-06": { emoji: "🗓️", label: "Monthly" },
};

type PromptType = "gloss" | "korean" | "audio";

interface Question {
  target: VocabWord;
  options: VocabWord[];
  prompt: PromptType;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// distractor는 전체에서 뽑아 항상 4지선다 유지(작은 팩 대비)
function buildQuestions(pool: VocabWord[], all: VocabWord[], rounds: number, mode: "meaning" | "audio"): Question[] {
  const targets = shuffle(pool).slice(0, Math.min(rounds, pool.length));
  return targets.map((target) => {
    let dp = pool.filter((w) => w.word_id !== target.word_id);
    if (dp.length < 3) dp = all.filter((w) => w.word_id !== target.word_id);
    const distractors = shuffle(dp).slice(0, 3);
    const prompt: PromptType = mode === "audio" ? "audio" : Math.random() < 0.5 ? "gloss" : "korean";
    return { target, options: shuffle([target, ...distractors]), prompt };
  });
}

export default function VocabQuiz() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: "meaning" | "audio" = params.mode === "audio" ? "audio" : "meaning";
  const title = mode === "audio" ? "Audio Quiz" : "Meaning Quiz";

  const [packs, setPacks] = useState<VocabPack[] | null>(null); // null=로딩
  const allWords = useMemo(() => (packs ? packs.flatMap((p) => p.words) : []), [packs]);

  const [pool, setPool] = useState<VocabWord[] | null>(null); // 선택된 카테고리 단어(null=카테고리 화면)
  const [poolLabel, setPoolLabel] = useState("");
  const [modalMax, setModalMax] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  const [started, setStarted] = useState(false);
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [seed, setSeed] = useState(0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const lockRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVocabPacks().then((p) => !cancelled && setPacks(p)).catch(() => !cancelled && setPacks([]));
    return () => {
      cancelled = true;
      if (soundRef.current) void soundRef.current.unloadAsync().catch(() => undefined);
    };
  }, []);

  const questions = useMemo(
    () => (started && pool ? buildQuestions(pool, allWords, rounds, mode) : []),
    [seed, started, pool, rounds, mode, allWords],
  );
  const total = questions.length;
  const q = questions[round];

  async function playAudio(wordId: string) {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => undefined);
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: vocabAudioUri(wordId) }, { shouldPlay: true, volume: 1 });
      soundRef.current = sound;
    } catch {
      // 음원 없거나 실패 — 무시
    }
  }

  useEffect(() => {
    if (started && !done && mode === "audio" && q) void playAudio(q.target.word_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, started, done, mode, seed]);

  function resetRun() {
    setRound(0);
    setScore(0);
    setPicked(null);
    setDone(false);
    lockRef.current = false;
    setSeed((s) => s + 1);
  }

  function pickCategory(words: VocabWord[], label: string) {
    setPool(words);
    setPoolLabel(label);
    setModalMax(words.length);
    setModalVisible(true);
  }

  function startWith(n: number) {
    setModalVisible(false);
    setRounds(n);
    setStarted(true);
    resetRun();
  }

  function choose(opt: VocabWord) {
    if (lockRef.current || !q) return;
    lockRef.current = true;
    setPicked(opt.word_id);
    const correct = opt.word_id === q.target.word_id;
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
    }, 1200);
  }

  // ── 로딩 ──
  if (packs === null) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={styles.sub}>Loading words…</Text>
        </View>
      </GradientBackground>
    );
  }

  // ── 카테고리 선택 ──
  if (!started) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <GlowOrb color="neon.purple" size={260} opacity={0.3} style={{ top: -60, right: -60 }} />
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginBottom: spacing["space.2"] }}>
            <Text style={styles.link}>‹ Quizzes</Text>
          </Pressable>
          <Text style={styles.bigTitle}>
            {mode === "audio" ? "🔊 " : "💬 "}
            {title}
          </Text>
          <Text style={styles.sub}>
            {mode === "audio" ? "Hear Korean, pick the meaning." : "Match Korean words and meanings."} Pick a topic.
          </Text>
          <ScrollView style={{ flex: 1, marginTop: spacing["space.5"] }} showsVerticalScrollIndicator={false}>
            <View style={styles.catGrid}>
              {/* All */}
              <Pressable onPress={() => pickCategory(allWords, "All topics")} style={styles.catCellWrap}>
                <GlassCard style={styles.catCell}>
                  <Text style={styles.catEmoji}>🎲</Text>
                  <Text style={styles.catLabel}>All</Text>
                  <Text style={styles.catCount}>{allWords.length}</Text>
                </GlassCard>
              </Pressable>
              {packs.map((p) => {
                const meta = PACK_META[p.pack_id] ?? { emoji: "📦", label: p.name.replace(/^.*—\s*/, "") };
                return (
                  <Pressable key={p.pack_id} onPress={() => pickCategory(p.words, meta.label)} style={styles.catCellWrap}>
                    <GlassCard style={styles.catCell}>
                      <Text style={styles.catEmoji}>{meta.emoji}</Text>
                      <Text style={styles.catLabel} numberOfLines={1}>{meta.label}</Text>
                      <Text style={styles.catCount}>{p.words.length}</Text>
                    </GlassCard>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ height: spacing["space.8"] }} />
          </ScrollView>
        </View>

        <RoundsModal
          visible={modalVisible}
          max={modalMax}
          subtitle={`${poolLabel} · ${modalMax} words`}
          defaultValue={Math.min(DEFAULT_ROUNDS, modalMax)}
          onStart={startWith}
          onCancel={() => setModalVisible(false)}
        />
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
            <NeonButton label="Play again" onPress={resetRun} />
          </View>
          <Pressable onPress={() => setStarted(false)} hitSlop={10} style={{ marginTop: spacing["space.4"] }}>
            <Text style={styles.link}>Change topic</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  // ── 퀴즈 ──
  // 보기 언어: audio·korean 프롬프트 → 영어 뜻 / gloss 프롬프트 → 한글
  const optionsAreGloss = q?.prompt === "korean" || q?.prompt === "audio";
  const revealed = picked !== null;
  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.purple" size={240} opacity={0.3} style={{ top: -60, left: -60 }} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable onPress={() => setStarted(false)} hitSlop={12}>
            <Text style={styles.link}>‹ Topics</Text>
          </Pressable>
          <Text style={styles.progress}>
            {round + 1} / {total} · score {score}
          </Text>
        </View>

        {q?.prompt === "audio" && (
          <View style={{ alignItems: "center" }}>
            <Text style={styles.prompt}>What does this word mean?</Text>
            <Pressable onPress={() => q && playAudio(q.target.word_id)} style={styles.playBtn}>
              <Text style={styles.playEmoji}>🔊</Text>
            </Pressable>
            {revealed ? (
              <Text style={styles.answerReveal}>
                {q?.target.korean} · {q?.target.romanization}
              </Text>
            ) : (
              <Text style={styles.replayHint}>Tap to replay</Text>
            )}
          </View>
        )}
        {q?.prompt === "gloss" && (
          <>
            <Text style={styles.prompt}>Which word means this?</Text>
            <Text style={styles.promptGloss}>{q?.target.gloss}</Text>
          </>
        )}
        {q?.prompt === "korean" && (
          <>
            <Text style={styles.prompt}>What does this mean?</Text>
            <Text style={styles.promptKorean}>{q?.target.korean}</Text>
            <Text style={styles.rr}>{q?.target.romanization}</Text>
          </>
        )}

        <View style={styles.grid}>
          {q?.options.map((opt) => {
            const isPicked = picked === opt.word_id;
            const isCorrect = opt.word_id === q.target.word_id;
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
                key={opt.word_id}
                onPress={() => choose(opt)}
                style={{ width: "48%", marginBottom: spacing["space.3"] }}
              >
                <GlassCard style={[styles.optionCard, { borderColor, borderWidth: showState ? 2 : 0 }]}>
                  <Text style={optionsAreGloss ? styles.optionGlossText : styles.optionKorean} numberOfLines={2}>
                    {optionsAreGloss ? opt.gloss : opt.korean}
                  </Text>
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
  bigTitle: { color: lightColors["text.primary"], fontSize: 30, fontWeight: "900", marginTop: spacing["space.2"] },
  sub: { color: lightColors["text.secondary"], fontSize: typeScale["text.body"].fontSize, marginTop: spacing["space.1"], textAlign: "center" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  catCellWrap: { width: "31%", marginBottom: spacing["space.3"] },
  catCell: { alignItems: "center", justifyContent: "center", paddingVertical: spacing["space.4"] },
  catEmoji: { fontSize: 34 },
  catLabel: { color: lightColors["text.primary"], fontSize: 13, fontWeight: "800", marginTop: spacing["space.1"] },
  catCount: { color: lightColors["text.muted"], fontSize: 11, marginTop: 2 },
  prompt: { color: lightColors["text.secondary"], fontSize: typeScale["text.body"].fontSize, marginTop: spacing["space.8"], textAlign: "center" },
  promptGloss: { color: lightColors["text.primary"], fontSize: 40, fontWeight: "900", textAlign: "center", marginTop: spacing["space.3"], marginBottom: spacing["space.8"] },
  promptKorean: { color: lightColors["korean.glyph"], fontSize: 56, fontWeight: "900", textAlign: "center", marginTop: spacing["space.3"] },
  rr: { color: lightColors["text.muted"], fontSize: 16, textAlign: "center", marginBottom: spacing["space.8"] },
  playBtn: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(147,51,234,0.2)",
    borderWidth: 2, borderColor: lightColors["neon.purple"],
    alignItems: "center", justifyContent: "center",
    marginTop: spacing["space.4"],
  },
  playEmoji: { fontSize: 56 },
  replayHint: { color: lightColors["text.muted"], fontSize: 13, marginTop: spacing["space.3"], marginBottom: spacing["space.6"] },
  answerReveal: { color: lightColors["korean.glyph"], fontSize: 22, fontWeight: "800", marginTop: spacing["space.3"], marginBottom: spacing["space.4"], textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: spacing["space.2"] },
  optionCard: { minHeight: 88, alignItems: "center", justifyContent: "center", padding: spacing["space.3"] },
  optionKorean: { color: lightColors["korean.glyph"], fontSize: 24, fontWeight: "800", textAlign: "center" },
  optionGlossText: { color: lightColors["text.primary"], fontSize: 17, fontWeight: "700", textAlign: "center" },
  resultEmoji: { fontSize: 72 },
  resultScore: { color: lightColors["text.primary"], fontSize: 64, fontWeight: "900", marginTop: spacing["space.3"] },
});
