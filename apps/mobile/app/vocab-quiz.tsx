/**
 * Vocab Quiz — 670 어휘로 이미지 없는 퀴즈. mode로 분기:
 *   meaning: 뜻↔한글 4지선다 (방향 랜덤)
 *   audio:   발음 듣고 한글 고르기 (🔊)
 *
 * 데이터: content-manifest(getVocab). 발음: public 버킷 word/{id}.mp3 (expo-av).
 */

import { Audio } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { getVocab, vocabAudioUri, type VocabWord } from "@/src/lib/vocab";
import { hapticNotification } from "@/src/lib/haptics";
import { playSfx } from "@/src/lib/sound";
import { GradientBackground, GlassCard, GlowOrb, NeonButton } from "@/src/components/d022";

const DEFAULT_ROUNDS = 10;

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

function buildQuestions(vocab: VocabWord[], rounds: number, mode: "meaning" | "audio"): Question[] {
  const targets = shuffle(vocab).slice(0, Math.min(rounds, vocab.length));
  return targets.map((target) => {
    const distractors = shuffle(vocab.filter((w) => w.word_id !== target.word_id)).slice(0, 3);
    const prompt: PromptType = mode === "audio" ? "audio" : Math.random() < 0.5 ? "gloss" : "korean";
    return { target, options: shuffle([target, ...distractors]), prompt };
  });
}

export default function VocabQuiz() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: "meaning" | "audio" = params.mode === "audio" ? "audio" : "meaning";
  const title = mode === "audio" ? "Audio Quiz" : "Meaning Quiz";

  const [vocab, setVocab] = useState<VocabWord[] | null>(null);
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
    getVocab().then((v) => !cancelled && setVocab(v)).catch(() => !cancelled && setVocab([]));
    return () => {
      cancelled = true;
      if (soundRef.current) void soundRef.current.unloadAsync().catch(() => undefined);
    };
  }, []);

  const questions = useMemo(
    () => (started && vocab ? buildQuestions(vocab, rounds, mode) : []),
    [seed, started, vocab, rounds, mode],
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

  // audio 모드: 새 문제마다 자동 재생
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

  function beginPrompt() {
    const max = vocab?.length ?? 0;
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
            setRounds(Math.min(Math.max(1, n), max));
            setStarted(true);
            resetRun();
          },
        },
      ],
      "plain-text",
      String(Math.min(DEFAULT_ROUNDS, max)),
      "number-pad",
    );
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
    }, 1100);
  }

  // ── 로딩 ──
  if (vocab === null) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={styles.sub}>Loading words…</Text>
        </View>
      </GradientBackground>
    );
  }

  // ── 인트로 ──
  if (!started) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <GlowOrb color="neon.purple" size={260} opacity={0.3} style={{ top: -60, right: -60 }} />
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginBottom: spacing["space.2"] }}>
            <Text style={styles.link}>‹ Menu</Text>
          </Pressable>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={styles.introEmoji}>{mode === "audio" ? "🔊" : "💬"}</Text>
            <Text style={styles.bigTitle}>{title}</Text>
            <Text style={styles.sub}>
              {mode === "audio" ? "Hear a word, pick the Korean." : "Match Korean words and meanings."}
            </Text>
            <Text style={styles.sub}>{vocab.length} words available.</Text>
          </View>
          <NeonButton label="Start" onPress={beginPrompt} />
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
            <NeonButton label="Play again" onPress={resetRun} />
          </View>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginTop: spacing["space.4"] }}>
            <Text style={styles.link}>Back to menu</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  // ── 퀴즈 ──
  const optionsAreGloss = q?.prompt === "korean"; // 한글 프롬프트 → 보기는 뜻
  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.purple" size={240} opacity={0.3} style={{ top: -60, left: -60 }} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable onPress={() => setStarted(false)} hitSlop={12}>
            <Text style={styles.link}>‹ Back</Text>
          </Pressable>
          <Text style={styles.progress}>
            {round + 1} / {total} · score {score}
          </Text>
        </View>

        {q?.prompt === "audio" && (
          <View style={{ alignItems: "center" }}>
            <Text style={styles.prompt}>Which word did you hear?</Text>
            <Pressable onPress={() => q && playAudio(q.target.word_id)} style={styles.playBtn}>
              <Text style={styles.playEmoji}>🔊</Text>
            </Pressable>
            <Text style={styles.replayHint}>Tap to replay</Text>
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
  introEmoji: { fontSize: 72 },
  bigTitle: { color: lightColors["text.primary"], fontSize: 30, fontWeight: "900", marginTop: spacing["space.3"] },
  sub: { color: lightColors["text.secondary"], fontSize: typeScale["text.body"].fontSize, marginTop: spacing["space.1"], textAlign: "center" },
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
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: spacing["space.2"] },
  optionCard: { minHeight: 88, alignItems: "center", justifyContent: "center", padding: spacing["space.3"] },
  optionKorean: { color: lightColors["korean.glyph"], fontSize: 24, fontWeight: "800", textAlign: "center" },
  optionGlossText: { color: lightColors["text.primary"], fontSize: 17, fontWeight: "700", textAlign: "center" },
  resultEmoji: { fontSize: 72 },
  resultScore: { color: lightColors["text.primary"], fontSize: 64, fontWeight: "900", marginTop: spacing["space.3"] },
});
