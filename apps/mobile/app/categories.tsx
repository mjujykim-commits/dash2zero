/**
 * Categories — 테마/팩 선택 학습 (개인 빌드 기능, 2026-06-30)
 *
 * content-manifest의 모든 pack을 나열하고, 선택 시 해당 pack 첫 단어로 lesson chain 시작.
 * PERSONAL_UNLOCK_ALL로 전체 pack 접근 가능.
 */

import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { fetchContentManifest, type ContentManifestResponse } from "@/src/lib/api";
import { GradientBackground, GlassCard, GlowOrb } from "@/src/components/d022";

type Pack = ContentManifestResponse["packs"][number];

// pack_id 접두어 → 이모지/표시명 보조
const PACK_META: Record<string, { emoji: string }> = {
  starter: { emoji: "🌱" },
  "core-kpop": { emoji: "🎤" },
  "core-kdrama": { emoji: "🎬" },
  "core-travel": { emoji: "✈️" },
  "premium-pack": { emoji: "💬" },
  monthly: { emoji: "🗓️" },
  "theme-numbers": { emoji: "🔢" },
  "theme-seasons": { emoji: "🍂" },
  "theme-days": { emoji: "📅" },
  "theme-calendar": { emoji: "📆" },
};

function emojiFor(packId: string): string {
  for (const key of Object.keys(PACK_META)) {
    if (packId.startsWith(key)) return PACK_META[key].emoji;
  }
  return "📚";
}

export default function Categories() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const manifest = await fetchContentManifest(0);
        if (!cancelled) {
          // theme 팩을 위로, 그다음 starter, 나머지 순
          const ordered = [...(manifest?.packs ?? [])].sort((a, b) => {
            const score = (p: Pack) =>
              p.pack_id.startsWith("theme-") ? 0 : p.pack_id.startsWith("starter") ? 1 : 2;
            return score(a) - score(b);
          });
          setPacks(ordered);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function startPack(pack: Pack) {
    const first = pack.words[0];
    if (!first) return;
    const chain = Math.min(10, pack.words.length);
    router.push(`/lesson/${first.word_id}?chain=${chain}`);
  }

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.cyan" size={240} opacity={0.3} style={{ top: -60, left: -60 }} />

      <View style={styles.content}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.heading}>Categories</Text>
        <Text style={styles.subtitle}>Pick a theme to study.</Text>

        {loading && <Text style={styles.note}>Loading…</Text>}
        {error && <Text style={[styles.note, { color: lightColors["semantic.warning"] }]}>Couldn't load categories.</Text>}

        <ScrollView style={{ flex: 1, marginTop: spacing["space.4"] }} showsVerticalScrollIndicator={false}>
          {packs.map((pack) => (
            <Pressable key={pack.pack_id} onPress={() => startPack(pack)} style={{ marginBottom: spacing["space.3"] }}>
              <GlassCard style={styles.row}>
                <Text style={styles.emoji}>{emojiFor(pack.pack_id)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.packName}>{pack.name}</Text>
                  <Text style={styles.packCount}>{pack.words.length} words</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </GlassCard>
            </Pressable>
          ))}
          <View style={{ height: spacing["space.8"] }} />
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing["space.5"],
    paddingTop: spacing["space.12"],
    paddingBottom: spacing["space.4"],
  },
  back: { color: lightColors["neon.cyan"], fontSize: 16, fontWeight: "700", marginBottom: spacing["space.2"] },
  heading: {
    fontSize: typeScale["text.heading.lg"].fontSize,
    fontWeight: "900",
    color: lightColors["text.primary"],
  },
  subtitle: {
    fontSize: typeScale["text.body"].fontSize,
    color: lightColors["text.secondary"],
    marginTop: spacing["space.1"],
  },
  note: { color: lightColors["text.muted"], marginTop: spacing["space.4"] },
  row: { flexDirection: "row", alignItems: "center", padding: spacing["space.4"] },
  emoji: { fontSize: 28, marginRight: spacing["space.3"] },
  packName: { fontSize: 16, fontWeight: "800", color: lightColors["text.primary"] },
  packCount: { fontSize: typeScale["text.caption"].fontSize, color: lightColors["text.muted"], marginTop: 2 },
  chevron: { fontSize: 24, color: lightColors["text.muted"], marginLeft: spacing["space.2"] },
});
