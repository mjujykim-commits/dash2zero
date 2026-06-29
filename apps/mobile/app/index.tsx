/**
 * Welcome — First-run 진입점 (J-001 시작)
 *
 * 톤: DESIGN_DIRECTION §6 (D-022 K-pop Bold — Bold/Neon/Honest/Confident/Focused)
 * Mockup: docs/screens/v2-stunning/01-welcome.html
 */

import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { useResponsiveScale } from "@/src/hooks/useResponsiveScale";

import {
  GradientBackground,
  GradientText,
  GlowOrb,
  NeonButton,
} from "../src/components/d022";

export default function Welcome() {
  const scale = useResponsiveScale();
  return (
    <GradientBackground variant="dark" direction="vertical" style={styles.root}>
      <GlowOrb color="neon.purple" size={320} opacity={0.45} style={{ top: -80, left: -60 }} />
      <GlowOrb color="neon.pink" size={260} opacity={0.4} style={{ bottom: 120, right: -60 }} />

      <View style={styles.content}>
        <View style={styles.heroBlock}>
          <GradientText
            scale="text.hero.ko"
            variant="hero"
            accessibilityLabel="Korean greeting: annyeonghaseyo"
            style={[styles.hero, { fontSize: scale.hero, lineHeight: Math.round(scale.hero * 0.95) }]}
          >
            안녕하세요
          </GradientText>
          <Text style={styles.subtitle}>Korean words. Down to zero friction.</Text>
        </View>

        <NeonButton
          label="Get started"
          accessibilityLabel="Get started"
          onPress={() => router.push("/age-gate")}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing["space.5"],
    paddingTop: spacing["space.16"],
    paddingBottom: spacing["space.6"],
    justifyContent: "space-between",
  },
  heroBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    textAlign: "center",
  },
  subtitle: {
    fontSize: typeScale["text.body"].fontSize,
    lineHeight: typeScale["text.body"].lineHeight,
    color: lightColors["text.secondary"],
    marginTop: spacing["space.5"],
    textAlign: "center",
  },
});
