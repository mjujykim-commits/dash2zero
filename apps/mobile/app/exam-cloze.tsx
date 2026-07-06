/**
 * Exam Sentence (문맥 빈칸) — 말해보카식 예문 학습을 영어권 학습자용으로 뒤집음.
 *
 * 영어 문장 + 뜻 → 한국어 문장의 빈칸에 들어갈 한국어 단어를 4지선다로 선택.
 * 정답 공개 시 문장 채워짐(하이라이트) + 단어 발음 재생. 정답 후 위로 스와이프.
 * 데이터: getTrackCloze (korean → {blank, ko, en}). 성장/오답복습/known 연동.
 */

import { Audio } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { getTrack, getTrackCloze, getTrackClozeAll, trackAudioUri, type TrackCloze, type TrackId, type TrackWord } from "@/src/lib/tracks";
import { recordExamAnswer } from "@/src/lib/examReviewStore";
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

interface Option { label: string; correct: boolean }
interface Question { target: TrackWord; cloze: TrackCloze; options: Option[] }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

function buildQuestions(pool: TrackWord[], cloze: Record<string, TrackCloze>, rounds: number): Question[] {
  const targets = shuffle(pool).slice(0, Math.min(rounds, pool.length));
  return targets.map((target) => {
    const cz = cloze[target.k]!;
    // 오답: 큐레이션 있으면 사용, 없으면 풀의 다른 단어 blank에서 생성(정답과 중복 제거)
    const curated = (cz.distractors ?? []).filter((d) => d && d !== cz.blank);
    let labels = curated.slice(0, 3);
    if (labels.length < 3) {
      const fill = shuffle(pool.filter((w) => w.k !== target.k))
        .map((w) => cloze[w.k]?.blank)
        .filter((b): b is string => !!b && b !== cz.blank && !labels.includes(b));
      labels = [...labels, ...fill].slice(0, 3);
    }
    const options: Option[] = shuffle([{ label: cz.blank, correct: true }, ...labels.map((l) => ({ label: l, correct: false }))]);
    return { target, cloze: cz, options };
  });
}

export default function ExamCloze() {
  const params = useLocalSearchParams<{ track?: string; level?: string }>();
  const track = (params.track === "kiip" ? "kiip" : "topik") as TrackId;
  const levelKey = params.level ?? "";

  const [pool, setPool] = useState<TrackWord[] | null>(null); // cloze 있는 레벨 단어 (null=로딩)
  const [cloze, setCloze] = useState<Record<string, TrackCloze>>({});
  const [levelBadge, setLevelBadge] = useState("");
  const [modalVisible, setModalVisible] = useState(true);
  const [started, setStarted] = useState(false);
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [seed, setSeed] = useState(0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [hasSwiped, setHasSwiped] = useState(false);
  const [clozeAll, setClozeAll] = useState<Record<string, TrackCloze[]> | null>(null);
  const [altIdx, setAltIdx] = useState(0); // 다른 예문 인덱스
  const lockRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const resultsRef = useRef<SessionResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTrack(track), getTrackCloze()])
      .then(([d, cz]) => {
        if (cancelled) return;
        const lv = d.levels.find((l) => l.key === levelKey);
        setPool((lv?.words ?? []).filter((w) => cz[w.k])); // cloze 있는 단어만
        setCloze(cz);
        setLevelBadge(lv?.badge ?? levelKey);
      })
      .catch(() => !cancelled && setPool([]));
    return () => { cancelled = true; if (soundRef.current) void soundRef.current.unloadAsync().catch(() => undefined); };
  }, [track, levelKey]);

  const questions = useMemo(
    () => (started && pool ? buildQuestions(pool, cloze, rounds) : []),
    [seed, started, pool, rounds, cloze],
  );
  const total = questions.length;
  const q = questions[round];

  async function playAudio(korean: string) {
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync().catch(() => undefined); soundRef.current = null; }
      const { sound } = await Audio.Sound.createAsync({ uri: trackAudioUri(korean) }, { shouldPlay: true, volume: 1 });
      soundRef.current = sound;
    } catch { /* 무시 */ }
  }

  function resetRun() {
    setRound(0); setScore(0); setPickedIdx(null); setDone(false); setHasSwiped(false);
    lockRef.current = false; resultsRef.current = []; setSeed((s) => s + 1);
  }
  function startWith(n: number) { setModalVisible(false); setRounds(n); setStarted(true); resetRun(); }

  function choose(opt: Option, i: number) {
    if (lockRef.current || !q) return;
    lockRef.current = true;
    setPickedIdx(i);
    const correct = opt.correct;
    resultsRef.current.push({ korean: q.target.k, correct });
    void recordExamAnswer({ k: q.target.k, g: q.target.g, r: q.target.r }, correct);
    if (!correct) void markUnknown(q.target.k);
    if (correct) { setScore((s) => s + 1); void hapticNotification("success"); void playSfx("correct"); void playAudio(q.target.k); }
    else { void hapticNotification("warning"); void playSfx("incorrect"); }
  }
  function next() {
    setPickedIdx(null); setAltIdx(0); lockRef.current = false;
    if (round + 1 >= total) { setDone(true); void playSfx("complete"); }
    else setRound((r) => r + 1);
  }
  const swipe = useVerticalSwipe({ enabled: pickedIdx !== null, onSwipeUp: () => { setHasSwiped(true); next(); } });

  // "다른 예문" — 같은 단어의 다른 문장으로 (정답 확인 후)
  async function otherExample() {
    let all = clozeAll;
    if (!all) { all = await getTrackClozeAll(); setClozeAll(all); }
    setAltIdx((i) => i + 1);
  }

  // ── 로딩 ──
  if (pool === null) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={styles.sub}>Loading sentences…</Text>
        </View>
      </GradientBackground>
    );
  }

  // ── cloze 없음 ──
  if (!started && pool.length === 0) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={styles.introEmoji}>📝</Text>
          <Text style={styles.bigTitle}>Sentences coming soon</Text>
          <Text style={styles.sub}>Example sentences for this level are still being prepared.</Text>
          <View style={{ height: spacing["space.8"] }} />
          <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.link}>Back</Text></Pressable>
        </View>
      </GradientBackground>
    );
  }

  // ── 개수 입력 ──
  if (!started) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <GlowOrb color="neon.purple" size={260} opacity={0.3} style={{ top: -60, right: -60 }} />
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={styles.link}>‹ Back</Text></Pressable>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={styles.introEmoji}>📝</Text>
            <Text style={styles.bigTitle}>Sentence Practice</Text>
            <Text style={styles.sub}>{track.toUpperCase()} · {levelBadge} · fill the blank</Text>
          </View>
        </View>
        <RoundsModal
          visible={modalVisible}
          max={pool.length}
          title="How many sentences?"
          subtitle={`${track.toUpperCase()} · ${levelBadge}`}
          openEnded
          defaultValue={DEFAULT_ROUNDS}
          onStart={startWith}
          onCancel={() => router.back()}
        />
      </GradientBackground>
    );
  }

  // ── 결과 ──
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

  // ── 문제 ──
  const revealed = pickedIdx !== null;
  const answeredCorrect = pickedIdx !== null && !!q?.options[pickedIdx]?.correct;
  // 다른 예문 선택 시 대체 문장, 아니면 원 문항
  const variants = q && clozeAll ? clozeAll[q.target.k] : undefined;
  const cz = variants && variants.length ? variants[altIdx % variants.length]! : q?.cloze;
  const hasAlt = !!(variants && variants.length > 1) || (revealed && !clozeAll);
  const idx = cz ? cz.ko.indexOf(cz.blank) : -1;
  const before = cz && idx >= 0 ? cz.ko.slice(0, idx) : cz?.ko ?? "";
  const after = cz && idx >= 0 ? cz.ko.slice(idx + cz.blank.length) : "";

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.purple" size={240} opacity={0.3} style={{ top: -60, left: -60 }} />
      <View style={styles.content} {...swipe}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={styles.link}>‹ Exit</Text></Pressable>
          <Text style={styles.progress}>{round + 1} / {total} · score {score}</Text>
        </View>

        {/* 상황(선택) + 영어 문장(모국어) + 뜻 */}
        <GlassCard style={styles.promptCard}>
          {cz?.situation ? <Text style={styles.situation}>{cz.situation}</Text> : null}
          <Text style={styles.enSentence}>{cz?.en}</Text>
          <Text style={styles.gloss}>{q?.target.k} · {q?.target.g}</Text>
        </GlassCard>

        {/* 한국어 문장(빈칸) */}
        <View style={styles.koWrap}>
          <Text style={styles.koSentence}>
            {before}
            <Text style={revealed ? styles.blankFilled : styles.blankEmpty}>
              {revealed ? cz?.blank : "　____　"}
            </Text>
            {after}
          </Text>
        </View>

        {/* 4지선다 (한국어 단어) */}
        <View style={styles.grid}>
          {q?.options.map((opt, i) => {
            const isPicked = pickedIdx === i;
            const isCorrect = opt.correct;
            const showState = revealed && (isPicked || isCorrect);
            const borderColor = showState
              ? isCorrect ? lightColors["semantic.success"] : isPicked ? lightColors["semantic.danger"] : "transparent"
              : "transparent";
            return (
              <Pressable key={i} onPress={() => choose(opt, i)} style={{ width: "48%", marginBottom: spacing["space.3"] }}>
                <GlassCard style={[styles.optionCard, { borderColor, borderWidth: showState ? 2 : 0 }]}>
                  <Text style={styles.optionText} numberOfLines={1}>{opt.label}</Text>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        {revealed && q && (
          <>
            <View style={{ flex: 1 }} />
            <Text style={[styles.verdict, { color: answeredCorrect ? lightColors["semantic.success"] : lightColors["semantic.danger"] }]}>
              {answeredCorrect ? "✅ Correct!" : "❌ Not quite"}
            </Text>
            <View style={styles.revealRow}>
              <Pressable onPress={() => q && playAudio(q.target.k)} style={styles.replayBtn}>
                <Text style={styles.replayText}>🔊 {q.target.k} · {q.target.r}</Text>
              </Pressable>
              {hasAlt ? (
                <Pressable onPress={otherExample} style={styles.altBtn}>
                  <Text style={styles.altText}>🔄 Another example</Text>
                </Pressable>
              ) : null}
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
  promptCard: { padding: spacing["space.4"], marginTop: spacing["space.5"] },
  situation: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, fontStyle: "italic", marginBottom: spacing["space.2"] },
  enSentence: { color: lightColors["text.primary"], fontSize: 20, fontWeight: "800", lineHeight: 28 },
  gloss: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, fontWeight: "700", marginTop: spacing["space.2"] },
  koWrap: { marginTop: spacing["space.5"], marginBottom: spacing["space.4"] },
  koSentence: { color: lightColors["text.secondary"], fontSize: 22, fontWeight: "700", lineHeight: 34 },
  blankEmpty: { color: lightColors["neon.cyan"], fontWeight: "900", backgroundColor: "rgba(6,182,212,0.15)" },
  blankFilled: { color: lightColors["korean.glyph"], fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: spacing["space.2"] },
  optionCard: { minHeight: 72, alignItems: "center", justifyContent: "center", padding: spacing["space.3"] },
  optionText: { color: lightColors["korean.glyph"], fontSize: 22, fontWeight: "800", textAlign: "center" },
  verdict: { fontSize: 20, fontWeight: "900", textAlign: "center", marginBottom: spacing["space.3"] },
  revealRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", marginBottom: spacing["space.4"] },
  replayBtn: {
    marginHorizontal: spacing["space.1"], marginBottom: spacing["space.2"], paddingHorizontal: spacing["space.4"], paddingVertical: spacing["space.2"],
    borderRadius: 999, backgroundColor: "rgba(147,51,234,0.18)", borderWidth: 1, borderColor: lightColors["neon.purple"],
  },
  replayText: { color: lightColors["text.primary"], fontSize: 15, fontWeight: "800" },
  altBtn: {
    marginHorizontal: spacing["space.1"], marginBottom: spacing["space.2"], paddingHorizontal: spacing["space.4"], paddingVertical: spacing["space.2"],
    borderRadius: 999, backgroundColor: "rgba(6,182,212,0.15)", borderWidth: 1, borderColor: lightColors["neon.cyan"],
  },
  altText: { color: lightColors["neon.cyan"], fontSize: 15, fontWeight: "800" },
});
