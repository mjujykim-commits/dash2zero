/**
 * Exam Study — TOPIK/KIIP 레벨 단어를 1스크린 1단어 플래시카드로 학습(유료 진입점 내부).
 *
 * 사진(있으면) + 한글 + 발음 + 뜻. 진입 시 발음 자동 재생, 탭하면 재생.
 * 위로 스와이프=다음 / 아래로=이전. 데이터: getTrack. 발음: trackAudioUri. 사진: trackPhotoUri.
 */

import { Audio } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { getTrack, getTrackPhotos, getTrackExamples, trackAudioUri, trackPhotoUri, type TrackExample, type TrackId, type TrackWord } from "@/src/lib/tracks";
import { getKnownSet, markKnown } from "@/src/lib/knownStore";
import { hapticImpact } from "@/src/lib/haptics";
import { SwipeCard } from "@/src/components/SwipeCard";
import { SwipeHint } from "@/src/components/SwipeHint";
import { GradientBackground, GlassCard, GlowOrb } from "@/src/components/d022";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

export default function ExamStudy() {
  const params = useLocalSearchParams<{ track?: string; level?: string }>();
  const track = (params.track === "kiip" ? "kiip" : "topik") as TrackId;
  const levelKey = params.level ?? "";

  const [words, setWords] = useState<TrackWord[] | null>(null);
  const [photoSet, setPhotoSet] = useState<Set<string>>(new Set());
  const [examples, setExamples] = useState<Record<string, TrackExample>>({});
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [levelBadge, setLevelBadge] = useState("");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hasSwiped, setHasSwiped] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTrack(track), getTrackPhotos(), getKnownSet(), getTrackExamples()])
      .then(([d, ph, kn, ex]) => {
        if (cancelled) return;
        const lv = d.levels.find((l) => l.key === levelKey);
        setWords(shuffle(lv?.words ?? []));
        setLevelBadge(lv?.badge ?? levelKey);
        setPhotoSet(new Set(Object.keys(ph)));
        setKnown(kn);
        setExamples(ex);
      })
      .catch(() => !cancelled && setWords([]));
    return () => { cancelled = true; if (soundRef.current) void soundRef.current.unloadAsync().catch(() => undefined); };
  }, [track, levelKey]);

  // 아는 단어 제외한 학습 대상
  const displayed = useMemo(() => (words ?? []).filter((w) => !known.has(w.k)), [words, known]);
  const word = displayed[index];

  async function play(korean: string) {
    setPlaying(true);
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync().catch(() => undefined); soundRef.current = null; }
      const { sound } = await Audio.Sound.createAsync({ uri: trackAudioUri(korean) }, { shouldPlay: true, volume: 1 });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((s) => { if (s.isLoaded && s.didJustFinish) setPlaying(false); });
    } catch { setPlaying(false); }
  }

  // 카드 바뀔 때 자동 재생
  useEffect(() => {
    if (word) void play(word.k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.k]);

  const total = displayed.length;
  const go = (delta: number) => {
    void hapticImpact("light");
    setIndex((i) => Math.min(Math.max(0, i + delta), Math.max(0, total - 1)));
  };
  // 스와이프 미리보기: 다음/이전 단어의 간이 카드(실제 카드 위치에 맞춰 정렬)
  const previewFor = (w?: (typeof displayed)[number]) =>
    w ? (
      <View style={styles.content}>
        <View style={styles.topRow} />
        <View style={styles.cardArea}>
          <GlassCard style={styles.flashCard}>
            {photoSet.has(w.k) ? (
              <Image source={{ uri: trackPhotoUri(w.k) }} style={styles.photo} resizeMode="cover" />
            ) : (
              <Text style={styles.noPhotoGlyph}>{w.k.slice(0, 1)}</Text>
            )}
            <Text style={styles.korean}>{w.k}</Text>
            <Text style={styles.rr}>{w.r}</Text>
            <Text style={styles.gloss}>{w.g}</Text>
          </GlassCard>
        </View>
      </View>
    ) : null;

  // "안다" → known에 추가(제외됨). 제거 후 현재 index가 다음 카드를 가리키도록 클램프.
  function knowIt() {
    if (!word) return;
    void markKnown(word.k);
    void hapticImpact("light");
    setKnown((prev) => new Set(prev).add(word.k));
    setIndex((i) => Math.min(i, Math.max(0, total - 2)));
  }

  if (words === null) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator color={lightColors["neon.cyan"]} />
        </View>
      </GradientBackground>
    );
  }

  // 다 아는 경우(학습할 단어 없음)
  if (total === 0) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <GlowOrb color="neon.lime" size={280} opacity={0.35} style={{ top: -60, right: -60 }} />
        <View style={[styles.content, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>You know them all!</Text>
          <Text style={styles.doneSub}>No unknown words left in {track.toUpperCase()} · {levelBadge}. Miss one in a quiz and it comes back here.</Text>
          <View style={{ height: spacing["space.8"] }} />
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.link}>Back</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  const hasPhoto = word ? photoSet.has(word.k) : false;

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.cyan" size={260} opacity={0.3} style={{ top: -60, left: -60 }} />
      <SwipeCard
        enabled={total > 0}
        onAdvance={() => { setHasSwiped(true); go(1); }}
        onBack={index > 0 ? () => { setHasSwiped(true); go(-1); } : undefined}
        next={previewFor(displayed[index + 1])}
        prev={index > 0 ? previewFor(displayed[index - 1]) : undefined}
      >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.link}>‹ Back</Text>
          </Pressable>
          <Text style={styles.count}>{track.toUpperCase()} · {levelBadge} · {index + 1}/{total} left</Text>
        </View>

        <View style={styles.cardArea}>
          <Pressable style={{ width: "100%" }} onPress={() => word && play(word.k)}>
            <GlassCard style={styles.flashCard}>
              {hasPhoto && word ? (
                <Image source={{ uri: trackPhotoUri(word.k) }} style={styles.photo} resizeMode="cover" />
              ) : (
                <Text style={styles.noPhotoGlyph}>{word?.k?.slice(0, 1) ?? "가"}</Text>
              )}
              <Text style={styles.korean}>{word?.k}</Text>
              <Text style={styles.rr}>{word?.r}</Text>
              <Text style={styles.gloss}>{word?.g}</Text>
              <View style={styles.speakerPill}>
                <Text style={styles.speakerText}>{playing ? "🔊 Playing…" : "🔈 Tap to hear"}</Text>
              </View>
            </GlassCard>
          </Pressable>

          {/* 예시어 · 예문 (특히 추상어 학습 보조) */}
          {word && examples[word.k] && (examples[word.k]!.examples?.length || examples[word.k]!.sentence) ? (
            <View style={styles.exampleBox}>
              {examples[word.k]!.examples?.slice(0, 2).map((e, i) => (
                <Text key={i} style={styles.exLine}>
                  <Text style={styles.exKo}>{e.ko}</Text>
                  <Text style={styles.exEn}>  {e.en}</Text>
                </Text>
              ))}
              {examples[word.k]!.sentence ? (
                <View style={styles.exSentence}>
                  <Text style={styles.exSentKo}>{examples[word.k]!.sentence!.ko}</Text>
                  <Text style={styles.exSentEn}>{examples[word.k]!.sentence!.en}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
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
          <SwipeHint visible={!hasSwiped && total > 1} label="Swipe" direction="both" />
        </View>
      </View>
      </SwipeCard>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing["space.5"], paddingTop: spacing["space.12"], paddingBottom: spacing["space.6"] },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { color: lightColors["neon.cyan"], fontSize: 16, fontWeight: "700" },
  count: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, fontWeight: "800" },
  cardArea: { flex: 1, justifyContent: "center" },
  flashCard: { alignItems: "center", justifyContent: "center", paddingVertical: spacing["space.8"], paddingHorizontal: spacing["space.5"] },
  photo: { width: 180, height: 180, borderRadius: 20, marginBottom: spacing["space.4"] },
  noPhotoGlyph: { fontSize: 96, color: lightColors["korean.glyph"], opacity: 0.25, marginBottom: spacing["space.2"] },
  korean: { color: lightColors["korean.glyph"], fontSize: 48, fontWeight: "900", marginTop: spacing["space.2"] },
  rr: { color: lightColors["text.muted"], fontSize: 17, marginTop: 2 },
  gloss: { color: lightColors["text.secondary"], fontSize: 22, fontWeight: "700", marginTop: spacing["space.3"], textAlign: "center" },
  speakerPill: {
    marginTop: spacing["space.5"], paddingHorizontal: spacing["space.4"], paddingVertical: spacing["space.2"],
    borderRadius: 999, backgroundColor: "rgba(6,182,212,0.14)", borderWidth: 1, borderColor: lightColors["neon.cyan"],
  },
  speakerText: { color: lightColors["neon.cyan"], fontSize: 14, fontWeight: "800" },
  exampleBox: { marginTop: spacing["space.4"], paddingHorizontal: spacing["space.2"] },
  exLine: { marginBottom: 4 },
  exKo: { color: lightColors["korean.glyph"], fontSize: 15, fontWeight: "800" },
  exEn: { color: lightColors["text.muted"], fontSize: 13, fontWeight: "600" },
  exSentence: { marginTop: spacing["space.2"], borderLeftWidth: 2, borderLeftColor: lightColors["neon.cyan"], paddingLeft: spacing["space.3"] },
  exSentKo: { color: lightColors["text.primary"], fontSize: 15, fontWeight: "700" },
  exSentEn: { color: lightColors["text.muted"], fontSize: 13, marginTop: 2 },
  decideRow: { flexDirection: "row", justifyContent: "space-between" },
  decideBtn: { flex: 1, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginHorizontal: spacing["space.1"] },
  stillBtn: { backgroundColor: "rgba(255,255,255,0.07)" },
  stillText: { color: lightColors["text.secondary"], fontSize: 15, fontWeight: "800" },
  knowBtn: { backgroundColor: lightColors["semantic.success"] },
  knowText: { color: "#0B0B0F", fontSize: 15, fontWeight: "900" },
  hintArea: { height: 64, justifyContent: "center", alignItems: "center" },
  doneEmoji: { fontSize: 72 },
  doneTitle: { color: lightColors["text.primary"], fontSize: 26, fontWeight: "900", marginTop: spacing["space.3"] },
  doneSub: { color: lightColors["text.secondary"], fontSize: typeScale["text.body"].fontSize, marginTop: spacing["space.2"], textAlign: "center" },
});
