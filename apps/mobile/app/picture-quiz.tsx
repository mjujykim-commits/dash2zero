/**
 * Picture Quiz — 한글 제시 → 4개 이모지(그림) 중 정답 선택 (개인 빌드 기능, 2026-06-30)
 *
 * 자체 완결형: src/lib/emojiWords.ts의 구체 명사 한글↔이모지 사용 (백엔드 무관).
 * 한 라운드: 한글 단어 1개 + 이모지 보기 4개(정답 + 같은 카테고리 distractor 3). 10라운드.
 */

import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { EMOJI_WORDS, type EmojiWord } from "@/src/lib/emojiWords";
import { hapticNotification } from "@/src/lib/haptics";
import { playSfx } from "@/src/lib/sound";
import { GradientBackground, GlassCard, GlowOrb, NeonButton } from "@/src/components/d022";

const ROUNDS = 10;

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
  options: EmojiWord[]; // 4개, shuffle됨
}

function buildQuestions(): Question[] {
  const targets = shuffle(EMOJI_WORDS).slice(0, ROUNDS);
  return targets.map((target) => {
    // distractor: 같은 카테고리 우선, 부족하면 전체에서
    const sameCat = EMOJI_WORDS.filter((w) => w.category === target.category && w.korean !== target.korean);
    const others = EMOJI_WORDS.filter((w) => w.korean !== target.korean);
    const pool = sameCat.length >= 3 ? sameCat : others;
    const distractors = shuffle(pool).slice(0, 3);
    return { target, options: shuffle([target, ...distractors]) };
  });
}

export default function PictureQuiz() {
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => buildQuestions(), [seed]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null); // 선택된 korean
  const [done, setDone] = useState(false);
  const lockRef = useRef(false);

  const q = questions[round];

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
      if (round + 1 >= ROUNDS) {
        setDone(true);
        void playSfx("complete");
      } else {
        setRound((r) => r + 1);
      }
    }, 1100);
  }

  function restart() {
    setSeed((s) => s + 1);
    setRound(0);
    setScore(0);
    setPicked(null);
    setDone(false);
    lockRef.current = false;
  }

  if (done) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <GlowOrb color="neon.lime" size={280} opacity={0.35} style={{ top: -60, right: -60 }} />
        <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={styles.resultEmoji}>{score >= ROUNDS - 2 ? "🎉" : "👍"}</Text>
          <Text style={styles.resultScore}>
            {score} / {ROUNDS}
          </Text>
          <Text style={styles.resultLabel}>correct</Text>
          <View style={{ height: spacing["space.8"] }} />
          <View style={{ width: "100%" }}>
            <NeonButton label="Play again" onPress={restart} />
          </View>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.pink" size={240} opacity={0.3} style={{ top: -60, left: -60 }} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Picture Quiz</Text>
          <Text style={styles.progress}>
            {round + 1} / {ROUNDS} · score {score}
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
  title: { color: lightColors["text.primary"], fontSize: 20, fontWeight: "900" },
  link: { color: lightColors["neon.cyan"], fontSize: 16, fontWeight: "700" },
  progress: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, fontWeight: "700" },
  prompt: {
    color: lightColors["text.secondary"],
    fontSize: typeScale["text.body"].fontSize,
    marginTop: spacing["space.8"],
    textAlign: "center",
  },
  promptEmoji: {
    fontSize: 110,
    textAlign: "center",
    marginTop: spacing["space.3"],
    marginBottom: spacing["space.8"],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  optionCard: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing["space.3"],
  },
  optionKorean: {
    color: lightColors["korean.glyph"],
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  optionGloss: {
    color: lightColors["semantic.success"],
    fontSize: typeScale["text.caption"].fontSize,
    fontWeight: "700",
    marginTop: spacing["space.1"],
  },
  resultEmoji: { fontSize: 72 },
  resultScore: { color: lightColors["text.primary"], fontSize: 64, fontWeight: "900", marginTop: spacing["space.3"] },
  resultLabel: { color: lightColors["text.secondary"], fontSize: typeScale["text.body"].fontSize },
});
