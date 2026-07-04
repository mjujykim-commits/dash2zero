/**
 * Exam Quiz — TOPIK/KIIP 특정 트랙·레벨의 Meaning/Audio 퀴즈.
 *   meaning: 뜻↔한글 4지선다(방향 랜덤)
 *   audio:   발음 듣고 "영어 뜻" 고르기 (의미 학습 목적)
 *
 * 데이터: getTrack(track).levels[level]. 발음: trackAudioUri(korean). 정답 후 위로 스와이프 진행.
 */

import { Audio } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { getTrack, getTrackPhotos, trackAudioUri, trackPhotoUri, type TrackId, type TrackPhotoCredit, type TrackWord } from "@/src/lib/tracks";
import { getExamWrong, recordExamAnswer } from "@/src/lib/examReviewStore";
import { markUnknown } from "@/src/lib/knownStore";
import { hapticNotification } from "@/src/lib/haptics";
import { playSfx } from "@/src/lib/sound";
import { RoundsModal } from "@/src/components/RoundsModal";
import { SwipeHint } from "@/src/components/SwipeHint";
import { SessionReward } from "@/src/components/SessionReward";
import { useVerticalSwipe } from "@/src/hooks/useVerticalSwipe";
import type { SessionResult } from "@/src/lib/progress";
import { GradientBackground, GlassCard, GlowOrb } from "@/src/components/d022";

const DEFAULT_ROUNDS = 10;

type QuizMode = "meaning" | "audio" | "photo";
type PromptType = "gloss" | "korean" | "audio" | "photo";
interface Question { target: TrackWord; options: TrackWord[]; prompt: PromptType; }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

function buildQuestions(pool: TrackWord[], rounds: number, mode: QuizMode): Question[] {
  const targets = shuffle(pool).slice(0, Math.min(rounds, pool.length));
  return targets.map((target) => {
    const distractors = shuffle(pool.filter((w) => w.k !== target.k)).slice(0, 3);
    const prompt: PromptType = mode === "audio" ? "audio" : mode === "photo" ? "photo" : Math.random() < 0.5 ? "gloss" : "korean";
    return { target, options: shuffle([target, ...distractors]), prompt };
  });
}

export default function ExamQuiz() {
  const params = useLocalSearchParams<{ track?: string; level?: string; mode?: string; review?: string }>();
  const track = (params.track === "kiip" ? "kiip" : "topik") as TrackId;
  const levelKey = params.level ?? "";
  const reviewMode = params.review === "1";
  // 복습은 사진 없이 뜻/발음으로만
  const mode: QuizMode = params.mode === "audio" ? "audio" : params.mode === "photo" && !reviewMode ? "photo" : "meaning";
  const title = reviewMode ? "Review" : mode === "audio" ? "Audio Quiz" : mode === "photo" ? "Photo Quiz" : "Meaning Quiz";

  const [pool, setPool] = useState<TrackWord[] | null>(null); // null=로딩
  const [photos, setPhotos] = useState<Record<string, TrackPhotoCredit>>({});
  const [levelLabel, setLevelLabel] = useState("");
  const [levelBadge, setLevelBadge] = useState("");
  const [modalVisible, setModalVisible] = useState(true);
  const [started, setStarted] = useState(false);
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [seed, setSeed] = useState(0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [hasSwiped, setHasSwiped] = useState(false);
  const lockRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const resultsRef = useRef<SessionResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (reviewMode) {
        const wrong = await getExamWrong();
        if (cancelled) return;
        setPool(wrong.map((w) => ({ k: w.k, g: w.g, r: w.r })));
        setLevelLabel("Wrong words"); setLevelBadge("Review");
        return;
      }
      const [d, ph] = await Promise.all([
        getTrack(track),
        mode === "photo" ? getTrackPhotos() : Promise.resolve({} as Record<string, TrackPhotoCredit>),
      ]);
      if (cancelled) return;
      const lv = d.levels.find((l) => l.key === levelKey);
      let words = lv?.words ?? [];
      if (mode === "photo") words = words.filter((w) => ph[w.k]?.quiz); // 퀴즈안전(구체어) 사진만 — 추상어(육/차 등) 제외
      setPhotos(ph);
      setPool(words);
      setLevelLabel(lv?.label ?? "");
      setLevelBadge(lv?.badge ?? levelKey);
    })().catch(() => !cancelled && setPool([]));
    return () => { cancelled = true; if (soundRef.current) void soundRef.current.unloadAsync().catch(() => undefined); };
  }, [track, levelKey, mode, reviewMode]);

  const questions = useMemo(
    () => (started && pool ? buildQuestions(pool, rounds, mode) : []),
    [seed, started, pool, rounds, mode],
  );
  const total = questions.length;
  const q = questions[round];

  async function playAudio(korean: string) {
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync().catch(() => undefined); soundRef.current = null; }
      const { sound } = await Audio.Sound.createAsync({ uri: trackAudioUri(korean) }, { shouldPlay: true, volume: 1 });
      soundRef.current = sound;
    } catch { /* 음원 없음/실패 무시 */ }
  }

  useEffect(() => {
    if (started && !done && mode === "audio" && q) void playAudio(q.target.k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, started, done, mode, seed]);

  function resetRun() {
    setRound(0); setScore(0); setPicked(null); setDone(false); setHasSwiped(false);
    lockRef.current = false; resultsRef.current = []; setSeed((s) => s + 1);
  }

  function startWith(n: number) { setModalVisible(false); setRounds(n); setStarted(true); resetRun(); }

  function choose(opt: TrackWord) {
    if (lockRef.current || !q) return;
    lockRef.current = true;
    setPicked(opt.k);
    const correct = opt.k === q.target.k;
    resultsRef.current.push({ korean: q.target.k, correct });
    void recordExamAnswer({ k: q.target.k, g: q.target.g, r: q.target.r }, correct); // 오답 복습 기록/해제
    if (!correct) void markUnknown(q.target.k); // 안다고 표시했어도 틀리면 모름 복귀
    if (correct) { setScore((s) => s + 1); void hapticNotification("success"); void playSfx("correct"); }
    else { void hapticNotification("warning"); void playSfx("incorrect"); }
  }

  function next() {
    setPicked(null); lockRef.current = false;
    if (round + 1 >= total) { setDone(true); void playSfx("complete"); }
    else setRound((r) => r + 1);
  }

  const swipe = useVerticalSwipe({ enabled: picked !== null, onSwipeUp: () => { setHasSwiped(true); next(); } });

  // ── 로딩 ──
  if (pool === null) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={styles.sub}>Loading words…</Text>
        </View>
      </GradientBackground>
    );
  }

  // ── 복습인데 오답 없음 ──
  if (!started && reviewMode && pool.length === 0) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <GlowOrb color="neon.lime" size={280} opacity={0.35} style={{ top: -60, right: -60 }} />
        <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={styles.introEmoji}>🎉</Text>
          <Text style={styles.bigTitle}>No wrong words</Text>
          <Text style={styles.sub}>Words you miss in exam quizzes show up here to review.</Text>
          <View style={{ height: spacing["space.8"] }} />
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.link}>Back</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  // ── 개수 입력(모달) — 취소 시 뒤로 ──
  if (!started) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <GlowOrb color="neon.purple" size={260} opacity={0.3} style={{ top: -60, right: -60 }} />
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.link}>‹ Back</Text>
          </Pressable>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={styles.introEmoji}>{reviewMode ? "🔁" : mode === "audio" ? "🔊" : mode === "photo" ? "📸" : "💬"}</Text>
            <Text style={styles.bigTitle}>{title}</Text>
            <Text style={styles.sub}>{reviewMode ? levelLabel : `${track.toUpperCase()} · ${levelLabel}`}</Text>
          </View>
        </View>
        <RoundsModal
          visible={modalVisible}
          max={pool.length}
          title="How many words per round?"
          subtitle={reviewMode ? "Review · wrong words" : `${track.toUpperCase()} · ${levelBadge}`}
          openEnded
          defaultValue={DEFAULT_ROUNDS}
          onStart={startWith}
          onCancel={() => router.back()}
        />
      </GradientBackground>
    );
  }

  // ── 결과(성장 리워드) ──
  if (done) {
    return (
      <SessionReward
        results={resultsRef.current}
        onReplay={() => { setModalVisible(true); setStarted(false); }}
        onExit={() => router.back()}
        replayLabel="Play again"
        exitLabel="Back to levels"
      />
    );
  }

  // ── 퀴즈 ──
  const optionsAreGloss = q?.prompt === "korean" || q?.prompt === "audio";
  const revealed = picked !== null;
  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.purple" size={240} opacity={0.3} style={{ top: -60, left: -60 }} />
      <View style={styles.content} {...swipe}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.link}>‹ Exit</Text>
          </Pressable>
          <Text style={styles.progress}>{round + 1} / {total} · score {score}</Text>
        </View>

        {q?.prompt === "audio" && (
          <View style={{ alignItems: "center" }}>
            <Text style={styles.prompt}>What does this word mean?</Text>
            <Pressable onPress={() => q && playAudio(q.target.k)} style={styles.playBtn}>
              <Text style={styles.playEmoji}>🔊</Text>
            </Pressable>
            <Text style={styles.replayHint}>Tap to replay</Text>
          </View>
        )}
        {q?.prompt === "photo" && (
          <>
            <Text style={styles.prompt}>Which word is this?</Text>
            <View style={styles.photoWrap}>
              <Image source={{ uri: trackPhotoUri(q.target.k) }} style={styles.photo} resizeMode="cover" />
              {revealed && photos[q.target.k] && (
                <View style={styles.creditPill}>
                  <Text style={styles.creditText}>📷 {photos[q.target.k]?.author || "Pixabay"} · Pixabay</Text>
                </View>
              )}
            </View>
          </>
        )}
        {q?.prompt === "gloss" && (
          <>
            <Text style={styles.prompt}>Which word means this?</Text>
            <Text style={styles.promptGloss}>{q?.target.g}</Text>
          </>
        )}
        {q?.prompt === "korean" && (
          <>
            <Text style={styles.prompt}>What does this mean?</Text>
            <Text style={styles.promptKorean}>{q?.target.k}</Text>
            <Text style={styles.rr}>{q?.target.r}</Text>
          </>
        )}

        <View style={styles.grid}>
          {q?.options.map((opt) => {
            const isPicked = picked === opt.k;
            const isCorrect = opt.k === q.target.k;
            const showState = revealed && (isPicked || isCorrect);
            const borderColor = showState
              ? isCorrect ? lightColors["semantic.success"] : isPicked ? lightColors["semantic.danger"] : "transparent"
              : "transparent";
            return (
              <Pressable key={opt.k} onPress={() => choose(opt)} style={{ width: "48%", marginBottom: spacing["space.3"] }}>
                <GlassCard style={[styles.optionCard, { borderColor, borderWidth: showState ? 2 : 0 }]}>
                  <Text style={optionsAreGloss ? styles.optionGlossText : styles.optionKorean} numberOfLines={2}>
                    {optionsAreGloss ? opt.g : opt.k}
                  </Text>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        {revealed && q && (
          <>
            <View style={{ flex: 1 }} />
            <Text style={[styles.verdict, { color: picked === q.target.k ? lightColors["semantic.success"] : lightColors["semantic.danger"] }]}>
              {picked === q.target.k ? "✅ Correct!" : "❌ Not quite"}
            </Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewKorean}>{q.target.k}</Text>
              <Text style={styles.reviewRr}>{q.target.r}</Text>
              <Text style={styles.reviewGloss}>{q.target.g}</Text>
            </View>
            <SwipeHint visible={!hasSwiped} label={round + 1 >= total ? "Swipe up to finish" : "Swipe up"} />
          </>
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing["space.5"], paddingTop: spacing["space.12"], paddingBottom: spacing["space.6"] },
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
    width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(147,51,234,0.2)",
    borderWidth: 2, borderColor: lightColors["neon.purple"], alignItems: "center", justifyContent: "center", marginTop: spacing["space.4"],
  },
  playEmoji: { fontSize: 56 },
  replayHint: { color: lightColors["text.muted"], fontSize: 13, marginTop: spacing["space.3"], marginBottom: spacing["space.6"] },
  photoWrap: {
    marginTop: spacing["space.3"], marginBottom: spacing["space.6"], borderRadius: 20, overflow: "hidden",
    alignSelf: "center", width: "100%", aspectRatio: 1, maxHeight: 280, backgroundColor: "rgba(255,255,255,0.05)",
  },
  photo: { width: "100%", height: "100%" },
  creditPill: {
    position: "absolute", bottom: 8, right: 8, backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  creditText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: spacing["space.2"] },
  optionCard: { minHeight: 88, alignItems: "center", justifyContent: "center", padding: spacing["space.3"] },
  optionKorean: { color: lightColors["korean.glyph"], fontSize: 24, fontWeight: "800", textAlign: "center" },
  optionGlossText: { color: lightColors["text.primary"], fontSize: 17, fontWeight: "700", textAlign: "center" },
  verdict: { fontSize: 20, fontWeight: "900", textAlign: "center", marginBottom: spacing["space.3"] },
  reviewCard: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: spacing["space.4"], marginBottom: spacing["space.4"] },
  reviewKorean: { color: lightColors["korean.glyph"], fontSize: 30, fontWeight: "900" },
  reviewRr: { color: lightColors["text.muted"], fontSize: 15, marginTop: 2 },
  reviewGloss: { color: lightColors["text.secondary"], fontSize: 18, fontWeight: "700", marginTop: spacing["space.2"] },
  resultEmoji: { fontSize: 72 },
  resultScore: { color: lightColors["text.primary"], fontSize: 64, fontWeight: "900", marginTop: spacing["space.3"] },
});
