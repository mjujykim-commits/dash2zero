/**
 * Your progress — Mastered + Weak words list (USER_JOURNEYS J-006 보강)
 *
 * 진입처: Settings → "Your progress"
 * 데이터: useWordProgress (게스트 SQLite / 인증 RPC)
 * 톤: D-022 K-pop Bold — mastered=neon.lime, weak=neon.pink
 */

import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { useWordProgress, type WordProgressItem } from "@/src/hooks/useWordProgress";

import { GradientBackground, GlassCard, GlowOrb } from "@/src/components/d022";

const STAGE_LABEL: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Stage 1",
  2: "Stage 2",
  3: "Stage 3",
  4: "Stage 4",
  5: "Mastered",
};

type Section = "mastered" | "weak";

function WordRow({ item, section }: { item: WordProgressItem; section: Section }) {
  const accent = section === "mastered" ? lightColors["neon.lime"] : lightColors["neon.pink"];
  return (
    <GlassCard style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text accessibilityLanguage="ko" style={styles.korean}>
          {item.korean}
        </Text>
        <Text style={styles.gloss}>
          {item.romanization} · {item.gloss}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[styles.stageBadge, { color: accent, borderColor: accent }]}>
          {STAGE_LABEL[item.stage]}
        </Text>
      </View>
    </GlassCard>
  );
}

export default function Progress() {
  const { mastered, weak, isLoading, error, refetch } = useWordProgress();

  // 화면 진입마다 refresh (lesson 후 돌아오면 갱신)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.purple" size={260} opacity={0.3} style={{ top: -80, right: -60 }} />

      <View style={styles.content}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>YOUR JOURNEY</Text>
        <Text style={styles.heading}>Progress</Text>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={lightColors["neon.cyan"]} />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>Couldn't load progress. {error.message}</Text>
        ) : (
          <FlatList
            ListHeaderComponent={
              <>
                <View style={styles.statsRow}>
                  <View style={styles.statBlock}>
                    <Text style={[styles.statCount, { color: lightColors["neon.lime"] }]}>
                      {mastered.length}
                    </Text>
                    <Text style={styles.statLabel}>Mastered</Text>
                  </View>
                  <View style={styles.statBlock}>
                    <Text style={[styles.statCount, { color: lightColors["neon.pink"] }]}>
                      {weak.length}
                    </Text>
                    <Text style={styles.statLabel}>Needs review</Text>
                  </View>
                </View>

                <Text style={[styles.sectionLabel, { color: lightColors["neon.lime"] }]}>
                  MASTERED
                </Text>
                {mastered.length === 0 && (
                  <Text style={styles.empty}>
                    Reach Stage 5 on any word to see it here.
                  </Text>
                )}
              </>
            }
            data={mastered}
            keyExtractor={(item) => `m-${item.word_id}`}
            renderItem={({ item }) => <WordRow item={item} section="mastered" />}
            ListFooterComponent={
              <>
                <Text style={[styles.sectionLabel, { color: lightColors["neon.pink"] }]}>
                  NEEDS REVIEW
                </Text>
                {weak.length === 0 ? (
                  <Text style={styles.empty}>No weak words right now. 🎉</Text>
                ) : (
                  weak.map((item) => (
                    <WordRow key={`w-${item.word_id}`} item={item} section="weak" />
                  ))
                )}
                <View style={{ height: spacing["space.12"] }} />
              </>
            }
            contentContainerStyle={{ paddingBottom: spacing["space.10"] }}
          />
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing["space.5"],
    paddingTop: spacing["space.12"],
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing["space.16"],
  },
  back: {
    color: lightColors["neon.cyan"],
    fontSize: typeScale["text.body"].fontSize,
    fontWeight: "600",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: lightColors["neon.cyan"],
    letterSpacing: 1,
    marginTop: spacing["space.6"],
  },
  heading: {
    fontSize: typeScale["text.heading.lg"].fontSize,
    lineHeight: typeScale["text.heading.lg"].lineHeight,
    fontWeight: "900",
    color: lightColors["text.primary"],
    marginTop: spacing["space.2"],
    marginBottom: spacing["space.5"],
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing["space.5"],
    marginBottom: spacing["space.6"],
  },
  statBlock: {
    flex: 1,
  },
  statCount: {
    fontSize: 44,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.muted"],
    fontWeight: "600",
    marginTop: spacing["space.1"],
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: spacing["space.5"],
    marginBottom: spacing["space.3"],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing["space.4"],
    marginBottom: spacing["space.2"],
  },
  korean: {
    fontSize: 22,
    fontWeight: "800",
    color: lightColors["text.primary"],
  },
  gloss: {
    fontSize: typeScale["text.caption"].fontSize,
    color: lightColors["text.secondary"],
    marginTop: 2,
  },
  stageBadge: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
  },
  empty: {
    fontSize: typeScale["text.body"].fontSize,
    color: lightColors["text.muted"],
    marginBottom: spacing["space.3"],
    paddingHorizontal: spacing["space.2"],
  },
  errorText: {
    fontSize: typeScale["text.body"].fontSize,
    color: lightColors["semantic.warning"],
    marginTop: spacing["space.5"],
  },
});
