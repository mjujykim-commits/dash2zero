/**
 * Exam prep — TOPIK/KIIP 시험대비. 트랙 선택 → 레벨 선택 → 모드(Meaning/Audio) → 퀴즈.
 *
 * 데이터: getTrack (Storage 호스팅). 사진 없이 뜻·발음·음성으로 학습.
 */

import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { getTrack, getTrackPhotos, getTrackCloze, type TrackData, type TrackId } from "@/src/lib/tracks";
import { examWrongCount } from "@/src/lib/examReviewStore";
import { getMasteredKoreans } from "@/src/lib/progress";
import { GradientBackground, GlassCard, GlowOrb } from "@/src/components/d022";
import { TabBar } from "@/src/components/TabBar";

const TRACKS: { id: TrackId; emoji: string; name: string; sub: string }[] = [
  { id: "topik", emoji: "📕", name: "TOPIK", sub: "한국어능력시험 · Proficiency test" },
  { id: "kiip", emoji: "🏛️", name: "KIIP", sub: "사회통합프로그램 · Immigration program" },
];

export default function Exam() {
  const [track, setTrack] = useState<TrackId | null>(null);
  const [data, setData] = useState<TrackData | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoSet, setPhotoSet] = useState<Set<string>>(new Set());
  const [clozeSet, setClozeSet] = useState<Set<string>>(new Set());
  const [mastered, setMastered] = useState<Set<string>>(new Set());
  const [wrongN, setWrongN] = useState(0);

  useEffect(() => {
    // Photo 퀴즈 노출 판단은 "퀴즈안전(구체어)" 사진만 카운트 (추상어 제외)
    getTrackPhotos()
      .then((m) => setPhotoSet(new Set(Object.entries(m).filter(([, v]) => v.quiz).map(([k]) => k))))
      .catch(() => undefined);
    getTrackCloze().then((c) => setClozeSet(new Set(Object.keys(c)))).catch(() => undefined);
  }, []);

  // 진도/오답수는 화면 포커스 시 갱신(퀴즈 후 즉시 반영)
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([getMasteredKoreans(), examWrongCount()]).then(([m, n]) => {
        if (!alive) return;
        setMastered(m); setWrongN(n);
      }).catch(() => undefined);
      return () => { alive = false; };
    }, []),
  );

  useEffect(() => {
    if (!track) { setData(null); setLevel(null); return; }
    setLoading(true);
    getTrack(track)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [track]);

  // ── 트랙 선택 ──
  if (!track) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <GlowOrb color="neon.purple" size={280} opacity={0.35} style={{ top: -80, right: -60 }} />
        <View style={styles.content}>
          <Text style={styles.heading}>Exam prep</Text>
          <Text style={styles.sub}>Which test are you preparing for?</Text>
          <View style={{ marginTop: spacing["space.6"] }}>
            {TRACKS.map((t) => (
              <Pressable key={t.id} onPress={() => setTrack(t.id)}>
                <GlassCard style={styles.trackCard}>
                  <Text style={styles.trackEmoji}>{t.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackName}>{t.name}</Text>
                    <Text style={styles.trackSub}>{t.sub}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </GlassCard>
              </Pressable>
            ))}
          </View>

          <View style={{ flex: 1 }} />
          {/* 오답 복습 (TOPIK/KIIP 공통) */}
          <Pressable
            onPress={() => wrongN > 0 && router.push("/exam-quiz?review=1&mode=meaning")}
            style={[styles.reviewBtn, wrongN === 0 && styles.reviewBtnEmpty]}
          >
            <Text style={[styles.reviewText, wrongN === 0 && styles.reviewTextEmpty]}>
              🔁  Review wrong words{wrongN > 0 ? `  ·  ${wrongN}` : ""}
            </Text>
          </Pressable>
        </View>
        <TabBar active="exam" />
      </GradientBackground>
    );
  }

  // ── 레벨 선택 ──
  if (!level) {
    return (
      <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
        <GlowOrb color="neon.cyan" size={260} opacity={0.3} style={{ top: -60, left: -60 }} />
        <View style={styles.content}>
          <Pressable onPress={() => setTrack(null)} hitSlop={12} style={{ marginBottom: spacing["space.2"] }}>
            <Text style={styles.link}>‹ Tests</Text>
          </Pressable>
          <Text style={styles.heading}>{data?.name ?? track.toUpperCase()}</Text>
          <Text style={styles.sub}>Pick a level.</Text>
          {loading || !data ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator color={lightColors["neon.cyan"]} />
            </View>
          ) : (
            <ScrollView style={{ marginTop: spacing["space.5"] }} showsVerticalScrollIndicator={false}>
              {data.levels.map((lv) => {
                const learned = lv.words.reduce((n, w) => n + (mastered.has(w.k) ? 1 : 0), 0);
                const ratio = lv.words.length ? learned / lv.words.length : 0;
                return (
                  <Pressable key={lv.key} onPress={() => setLevel(lv.key)}>
                    <GlassCard style={styles.levelCard}>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeText}>{lv.badge ?? lv.key}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.levelTop}>
                          <Text style={styles.levelLabel}>{lv.label}</Text>
                          {lv.range ? (
                            <View style={styles.rangeChip}><Text style={styles.rangeText}>{lv.range}</Text></View>
                          ) : null}
                        </View>
                        <View style={styles.progTrack}>
                          <View style={[styles.progFill, { width: `${Math.round(ratio * 100)}%` }]} />
                        </View>
                        <Text style={styles.progText}>{learned} learned</Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </GlassCard>
                  </Pressable>
                );
              })}
              <View style={{ height: spacing["space.8"] }} />
            </ScrollView>
          )}
        </View>
        <TabBar active="exam" />
      </GradientBackground>
    );
  }

  // ── 모드 선택 ──
  const lvObj = data?.levels.find((l) => l.key === level);
  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.pink" size={260} opacity={0.3} style={{ top: -60, right: -60 }} />
      <View style={styles.content}>
        <Pressable onPress={() => setLevel(null)} hitSlop={12} style={{ marginBottom: spacing["space.2"] }}>
          <Text style={styles.link}>‹ Levels</Text>
        </Pressable>
        <Text style={styles.heading}>{data?.name} · {lvObj?.badge ?? level}</Text>
        <Text style={styles.sub}>{lvObj?.label}{lvObj?.range ? ` · ${lvObj.range}` : ""}</Text>

        <View style={{ marginTop: spacing["space.6"] }}>
          {/* 학습(넘겨보기) — 퀴즈와 구분 */}
          <Pressable onPress={() => router.push(`/exam-study?track=${track}&level=${level}`)}>
            <GlassCard style={[styles.modeCard, styles.studyCard]}>
              <Text style={styles.modeEmoji}>📖</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.modeTitle}>Study</Text>
                <Text style={styles.modeSub}>Browse words · hear & memorize</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </GlassCard>
          </Pressable>

          {/* 문맥 예문 (빈칸 채우기) */}
          {(lvObj?.words.filter((w) => clozeSet.has(w.k)).length ?? 0) >= 4 ? (
            <Pressable onPress={() => router.push(`/exam-cloze?track=${track}&level=${level}`)}>
              <GlassCard style={[styles.modeCard, styles.clozeCard]}>
                <Text style={styles.modeEmoji}>📝</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeTitle}>Sentences</Text>
                  <Text style={styles.modeSub}>Fill the blank in real sentences</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </GlassCard>
            </Pressable>
          ) : null}

          {[
            { mode: "meaning", emoji: "💬", title: "Meaning Quiz", sub: "Match Korean words and meanings" },
            { mode: "audio", emoji: "🔊", title: "Audio Quiz", sub: "Hear a word, pick the meaning" },
            ...((lvObj?.words.filter((w) => photoSet.has(w.k)).length ?? 0) >= 4
              ? [{ mode: "photo", emoji: "📸", title: "Photo Quiz", sub: "See a photo, pick the word" }]
              : []),
          ].map((m) => (
            <Pressable
              key={m.mode}
              onPress={() => router.push(`/exam-quiz?track=${track}&level=${level}&mode=${m.mode}`)}
            >
              <GlassCard style={styles.modeCard}>
                <Text style={styles.modeEmoji}>{m.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeTitle}>{m.title}</Text>
                  <Text style={styles.modeSub}>{m.sub}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>
      </View>
      <TabBar active="exam" />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing["space.5"], paddingTop: spacing["space.12"], paddingBottom: spacing["space.6"] },
  link: { color: lightColors["neon.cyan"], fontSize: 16, fontWeight: "700" },
  heading: { color: lightColors["text.primary"], fontSize: 30, fontWeight: "900", marginTop: spacing["space.2"] },
  sub: { color: lightColors["text.secondary"], fontSize: typeScale["text.body"].fontSize, marginTop: spacing["space.1"] },
  trackCard: { flexDirection: "row", alignItems: "center", padding: spacing["space.5"], marginBottom: spacing["space.4"] },
  trackEmoji: { fontSize: 44, marginRight: spacing["space.4"] },
  trackName: { color: lightColors["text.primary"], fontSize: 24, fontWeight: "900" },
  trackSub: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, marginTop: 2 },
  levelCard: { flexDirection: "row", alignItems: "center", padding: spacing["space.4"], marginBottom: spacing["space.3"] },
  levelBadge: {
    minWidth: 56, height: 40, borderRadius: 12, paddingHorizontal: spacing["space.3"],
    backgroundColor: "rgba(6,182,212,0.15)",
    borderWidth: 1.5, borderColor: lightColors["neon.cyan"],
    alignItems: "center", justifyContent: "center", marginRight: spacing["space.4"],
  },
  levelBadgeText: { color: lightColors["neon.cyan"], fontSize: 14, fontWeight: "900" },
  levelTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  levelLabel: { color: lightColors["text.primary"], fontSize: 17, fontWeight: "800", flexShrink: 1 },
  rangeChip: { backgroundColor: "rgba(6,182,212,0.15)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginLeft: spacing["space.2"] },
  rangeText: { color: lightColors["neon.cyan"], fontSize: 11, fontWeight: "900" },
  progTrack: { height: 6, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden", marginTop: 6 },
  progFill: { height: "100%", borderRadius: 4, backgroundColor: lightColors["neon.lime"] },
  progText: { color: lightColors["text.muted"], fontSize: 11, fontWeight: "700", marginTop: 3 },
  reviewBtn: {
    borderRadius: 14, borderWidth: 1.5, borderColor: lightColors["neon.cyan"],
    paddingVertical: spacing["space.4"], alignItems: "center",
  },
  reviewBtnEmpty: { borderColor: lightColors["glass.border"], opacity: 0.5 },
  reviewText: { color: lightColors["neon.cyan"], fontSize: 16, fontWeight: "800" },
  reviewTextEmpty: { color: lightColors["text.muted"] },
  levelCount: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, marginTop: 2 },
  modeCard: { flexDirection: "row", alignItems: "center", padding: spacing["space.5"], marginBottom: spacing["space.4"] },
  studyCard: { borderWidth: 1, borderColor: lightColors["neon.cyan"] },
  clozeCard: { borderWidth: 1, borderColor: lightColors["neon.purple"] },
  modeEmoji: { fontSize: 40, marginRight: spacing["space.4"] },
  modeTitle: { color: lightColors["text.primary"], fontSize: 20, fontWeight: "800" },
  modeSub: { color: lightColors["text.muted"], fontSize: typeScale["text.caption"].fontSize, marginTop: 2 },
  chevron: { color: lightColors["text.muted"], fontSize: 28, marginLeft: spacing["space.2"] },
});
