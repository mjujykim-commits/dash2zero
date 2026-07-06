/**
 * TabBar — 하단 고정 푸터 내비게이션. 주요 허브(홈/퀴즈/시험/성장) 간 이동.
 *
 * Stack 라우터 유지하며 router.replace로 탭 전환(스택 누적 방지). 활성 탭 강조.
 * 시험 탭은 premium 게이트(isPremium)로 /exam 또는 /paywall 분기.
 */

import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { lightColors } from "@dash2zero/design-tokens";
import { isPremium } from "@/src/lib/premium";

export type TabKey = "home" | "quiz" | "exam" | "profile";

const TABS: { key: TabKey; icon: string; label: string; href: string }[] = [
  { key: "home", icon: "🏠", label: "Home", href: "/menu" },
  { key: "quiz", icon: "🎯", label: "Quiz", href: "/quizzes" },
  { key: "exam", icon: "🎓", label: "Exam", href: "/exam" },
  { key: "profile", icon: "🏆", label: "Growth", href: "/achievements" },
];

export function TabBar({ active }: { active: TabKey }) {
  const insets = useSafeAreaInsets();

  const go = (t: (typeof TABS)[number]) => {
    if (t.key === active) return;
    const href = t.key === "exam" ? (isPremium() ? "/exam" : "/paywall") : t.href;
    router.replace(href);
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <Pressable key={t.key} style={styles.tab} onPress={() => go(t)} hitSlop={4}>
            <Text style={[styles.icon, on ? styles.iconOn : styles.iconOff]}>{t.icon}</Text>
            <Text style={[styles.label, on && styles.labelOn]}>{t.label}</Text>
            <View style={[styles.dot, on && styles.dotOn]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    paddingTop: 10,
    backgroundColor: "rgba(11,11,15,0.92)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  icon: { fontSize: 22 },
  iconOn: { opacity: 1 },
  iconOff: { opacity: 0.5 },
  label: { fontSize: 10, fontWeight: "800", color: lightColors["text.muted"], letterSpacing: 0.2 },
  labelOn: { color: lightColors["neon.cyan"] },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "transparent", marginTop: 1 },
  dotOn: { backgroundColor: lightColors["neon.cyan"] },
});
