/**
 * BrandSplash — 첫 실행 애니메이션 표지(브랜드 스플래시).
 *
 * 시그니처 팔레트(퍼플/핑크/시안) 다크 배경 위에 "Dash2Zero" 워드마크를
 * 글라스 플레이트에 얹고, 왼쪽→오른쪽으로 빛(하이라이트)이 지나가는 스윕을
 * 2회 연출한 뒤 전체가 페이드아웃되며 앱으로 진입한다.
 *
 * 구현: core Animated (useNativeDriver: true) + expo-linear-gradient + expo-blur.
 * Reduce Motion: 스윕/스케일 생략, 짧은 페이드만.
 */

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Dimensions, Easing, StyleSheet, Text, View } from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");
const PLATE_W = Math.min(SCREEN_W * 0.84, 360);
const PLATE_H = 168;
const SHINE_W = 88;

export function BrandSplash({ onDone }: { onDone: () => void }) {
  const enter = useRef(new Animated.Value(0)).current; // 0→1 등장(스케일/이동/투명도)
  const shine = useRef(new Animated.Value(0)).current; // 0→1 빛 스윕(1회분)
  const fade = useRef(new Animated.Value(1)).current; // 전체 페이드아웃

  const [gone, setGone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 우리 오버레이가 그려진 다음 프레임에 네이티브 스플래시를 걷어낸다.
    // 둘 다 동일 다크 배경이라 이 교체는 눈에 띄지 않는다(빈 프레임 0).
    requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {
        /* 미지원/이미 숨김 — 무시 */
      });
    });

    const done = () => {
      if (cancelled) return;
      setGone(true);
      onDone();
    };

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;

      if (reduce) {
        // 모션 최소화: 등장만 살짝, 잠시 유지 후 페이드아웃
        Animated.sequence([
          Animated.timing(enter, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(700),
          Animated.timing(fade, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start(done);
        return;
      }

      const sweep = () =>
        Animated.timing(shine, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        });
      const resetSweep = () => Animated.timing(shine, { toValue: 0, duration: 0, useNativeDriver: true });

      Animated.sequence([
        // 1) 등장
        Animated.timing(enter, {
          toValue: 1,
          duration: 560,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.delay(180),
        // 2) 빛 스윕 ×2
        sweep(),
        Animated.delay(120),
        resetSweep(),
        sweep(),
        // 3) 잠깐 유지
        Animated.delay(360),
        // 4) 페이드아웃 → 앱 진입
        Animated.timing(fade, { toValue: 0, duration: 480, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(done);
    });

    return () => {
      cancelled = true;
    };
  }, [enter, shine, fade, onDone]);

  if (gone) return null;

  const plateStyle = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
      { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
    ],
  };
  const shineTranslate = shine.interpolate({
    inputRange: [0, 1],
    outputRange: [-PLATE_W * 0.75, PLATE_W * 0.75],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: fade }]} pointerEvents="none">
      {/* 다크 브랜드 배경 */}
      <LinearGradient
        colors={["#0A0A0F", "#160A28", "#0A0A0F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* 시그니처 글로우 */}
      <View style={[styles.orb, { backgroundColor: "#9333EA", top: -90, left: -70 }]} />
      <View style={[styles.orb, { backgroundColor: "#EC4899", bottom: -60, right: -80 }]} />
      <View style={[styles.orb, styles.orbSmall, { backgroundColor: "#06B6D4", bottom: 120, left: -50 }]} />

      {/* 글라스 플레이트 + 워드마크 */}
      <Animated.View style={[styles.plate, plateStyle]}>
        <View style={styles.plateClip}>
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.plateTint} />

          <View style={styles.content}>
            <Text style={styles.wordmark}>
              Dash<Text style={styles.two}>2</Text>Zero
            </Text>
            <LinearGradient
              colors={["#9333EA", "#EC4899", "#06B6D4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.underline}
            />
            <Text style={styles.tagline}>Learn Korean, one card at a time</Text>
          </View>

          {/* 좌→우 빛 스윕 */}
          <Animated.View
            style={[styles.shine, { transform: [{ translateX: shineTranslate }, { rotate: "18deg" }] }]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", justifyContent: "center", zIndex: 100, backgroundColor: "#0A0A0F" },
  orb: { position: "absolute", width: 260, height: 260, borderRadius: 130, opacity: 0.28 },
  orbSmall: { width: 180, height: 180, borderRadius: 90, opacity: 0.22 },
  plate: {
    width: PLATE_W,
    height: PLATE_H,
    borderRadius: 28,
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 16,
  },
  plateClip: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  plateTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.04)" },
  content: { alignItems: "center", paddingHorizontal: 20 },
  wordmark: {
    fontSize: 40,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textShadowColor: "rgba(236,72,153,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  two: { color: "#06B6D4" },
  underline: { width: 132, height: 4, borderRadius: 2, marginTop: 12 },
  tagline: { marginTop: 14, color: "rgba(255,255,255,0.62)", fontSize: 13, fontWeight: "600", letterSpacing: 0.3 },
  shine: { position: "absolute", top: -PLATE_H * 0.3, height: PLATE_H * 1.6, width: SHINE_W },
});
