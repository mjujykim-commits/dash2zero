/**
 * Age Gate — 13세 미만 차단 (CC2-05, CC2-14)
 * 톤: D-022 K-pop Bold (mockup: docs/screens/v2-stunning/02-age-gate.html)
 *
 * 결정 사항:
 *   - "I am 13 or older" 단일 체크는 회피 — 생년월일 입력으로 무결성 강화
 *   - under-13 응답 시 24h device lockout (CC2-14)
 *   - UK Children's Code 13-17세는 privacy-choices에서 별도 처리 (CC2-05)
 *
 * 측정 (EVALUATION_SCENARIOS §4):
 *   - PRIV-001: age gate가 분석 동의보다 먼저 표시
 *   - AGE-001: under-13 → 차단
 *   - AGE-003: 디바이스 lockout
 */

import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";

import { GradientBackground, GlassCard, GlowOrb, NeonButton } from "../src/components/d022";

const MIN_AGE = 13;

function calcAge(year: number, month: number, day: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
}

export default function AgeGate() {
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [day, setDay] = useState<string>("");

  const monthRef = useRef<TextInput>(null);
  const dayRef = useRef<TextInput>(null);

  const onlyDigits = (t: string, max: number) => t.replace(/[^0-9]/g, "").slice(0, max);

  const validInput = year.length === 4 && month.length >= 1 && day.length >= 1;

  function handleContinue() {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);

    const validRange =
      Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d) &&
      y >= 1900 && y <= new Date().getFullYear() &&
      m >= 1 && m <= 12 && d >= 1 && d <= 31;

    if (!validRange) {
      Alert.alert("Please enter a valid date.");
      return;
    }

    const age = calcAge(y, m, d);

    if (age < MIN_AGE) {
      router.replace("/age-blocked");
      return;
    }

    router.push({ pathname: "/privacy-choices", params: { age: String(age) } });
  }

  return (
    <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
      <GlowOrb color="neon.cyan" size={260} opacity={0.35} style={{ top: -80, right: -60 }} />

      <View style={styles.content}>
        <Text style={styles.stepLabel}>Step 1 of 3</Text>
        <Text style={styles.heading}>Your birthday</Text>
        <Text style={styles.subtitle}>dash2zero is for users 13 and older.</Text>

        <GlassCard style={styles.input}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.field, styles.yearField]}
              value={year}
              onChangeText={(t) => {
                const v = onlyDigits(t, 4);
                setYear(v);
                if (v.length === 4) monthRef.current?.focus();
              }}
              placeholder="YYYY"
              placeholderTextColor={lightColors["text.muted"]}
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="next"
              accessibilityLabel="Birth year, four digits"
            />
            <Text style={styles.sep}>·</Text>
            <TextInput
              ref={monthRef}
              style={[styles.field, styles.smallField]}
              value={month}
              onChangeText={(t) => {
                const v = onlyDigits(t, 2);
                setMonth(v);
                if (v.length === 2) dayRef.current?.focus();
              }}
              placeholder="MM"
              placeholderTextColor={lightColors["text.muted"]}
              keyboardType="number-pad"
              maxLength={2}
              returnKeyType="next"
              accessibilityLabel="Birth month"
            />
            <Text style={styles.sep}>·</Text>
            <TextInput
              ref={dayRef}
              style={[styles.field, styles.smallField]}
              value={day}
              onChangeText={(t) => setDay(onlyDigits(t, 2))}
              placeholder="DD"
              placeholderTextColor={lightColors["text.muted"]}
              keyboardType="number-pad"
              maxLength={2}
              returnKeyType="done"
              onSubmitEditing={() => validInput && handleContinue()}
              accessibilityLabel="Birth day"
            />
          </View>
        </GlassCard>

        <View style={{ flex: 1 }} />

        <NeonButton
          label="Continue"
          accessibilityLabel="Continue to privacy choices"
          onPress={handleContinue}
          disabled={!validInput}
        />
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
  stepLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: lightColors["neon.cyan"],
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heading: {
    fontSize: typeScale["text.heading.lg"].fontSize,
    lineHeight: typeScale["text.heading.lg"].lineHeight,
    fontWeight: "900",
    color: lightColors["text.primary"],
    marginTop: spacing["space.2"],
  },
  subtitle: {
    fontSize: typeScale["text.body"].fontSize,
    color: lightColors["text.secondary"],
    marginTop: spacing["space.2"],
  },
  input: {
    marginTop: spacing["space.8"],
    padding: spacing["space.5"],
    minHeight: 96,
    justifyContent: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    fontSize: 28,
    fontWeight: "800",
    color: lightColors["text.primary"],
    textAlign: "center",
    paddingVertical: spacing["space.2"],
  },
  yearField: {
    minWidth: 96,
  },
  smallField: {
    minWidth: 56,
  },
  sep: {
    fontSize: 28,
    fontWeight: "800",
    color: lightColors["text.muted"],
    marginHorizontal: spacing["space.2"],
  },
});
