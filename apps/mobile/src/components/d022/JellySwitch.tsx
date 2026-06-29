/**
 * JellySwitch — 토글 시 jelly elastic bounce (Motion v1.1 §3 Category A + v1.0 §2.6 jelly-toggle-active 정합)
 *
 * Source of Truth:
 *   - docs/brand/MOTION_SYSTEM_SPEC.md v1.1 §2 Q-MOTION-1/4/5 + Category A
 *   - docs/brand/DESIGN_REVIEW_W16_MOTION.md §3 P2 (jelly toggle 권고)
 *   - packages/design-tokens/src/motion.ts (MOTION_TOKENS.EASE_BOUNCE)
 *
 * RN의 native Switch는 OS 기본 transition만 적용 가능 — jelly bounce 구현 한계.
 * 본 컴포넌트는 Switch 대신 Pressable 기반 custom toggle을 제공.
 * 단 native Switch와 동일 a11y/UX 패턴 보존 (role=switch, state.checked).
 *
 * 4-rule Merge Gate:
 *   - Rule 1: transform scale + translateX(thumb), opacity tint — useNativeDriver:true
 *   - Rule 2: Animated cleanup은 Animated.sequence().start(callback)로 외부 trigger 후 자연 정리
 *   - Rule 3: MOTION_TOKENS.EASE_BOUNCE + DURATION_QUICK
 *   - Rule 4: skeleton 아님 (N/A)
 */

import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import { lightColors, MOTION_TOKENS } from "@dash2zero/design-tokens";
import { hapticImpact } from "@/src/lib/haptics";
import { playSfx } from "@/src/lib/sound";

interface Props {
  value: boolean;
  onValueChange: (next: boolean) => void;
  /** thumb / track 색 활성 시. default neon.lime */
  activeColor?: string;
  /** track 비활성 색. default dark gray */
  inactiveColor?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB_SIZE = 28;
const THUMB_PADDING = 2;
const THUMB_OFFSET_ON = TRACK_WIDTH - THUMB_SIZE - THUMB_PADDING * 2;

export function JellySwitch({
  value,
  onValueChange,
  activeColor = lightColors["neon.lime"],
  inactiveColor = "#3F3F46",
  accessibilityLabel,
  disabled = false,
}: Props) {
  // 두 Animated.Value:
  //   - thumbX: 0 (off) → THUMB_OFFSET_ON (on)
  //   - jellyScale: 토글 순간 1 → 1.15 → 0.95 → 1.05 → 1 (jelly bounce)
  const thumbX = useRef(new Animated.Value(value ? THUMB_OFFSET_ON : 0)).current;
  const jellyScale = useRef(new Animated.Value(1)).current;
  const trackOpacity = useRef(new Animated.Value(value ? 1 : 0)).current;

  // 외부 value prop 변화 (controlled) → thumb / track 일치
  useEffect(() => {
    Animated.parallel([
      Animated.timing(thumbX, {
        toValue: value ? THUMB_OFFSET_ON : 0,
        duration: MOTION_TOKENS.DURATION_QUICK,
        easing: MOTION_TOKENS.EASE_BOUNCE,
        useNativeDriver: true,
      }),
      Animated.timing(trackOpacity, {
        toValue: value ? 1 : 0,
        duration: MOTION_TOKENS.DURATION_QUICK,
        useNativeDriver: true,
      }),
    ]).start();
  }, [value, thumbX, trackOpacity]);

  const triggerJelly = () => {
    // 1 → 1.15 → 0.95 → 1.05 → 1 — Animated.sequence (Rule 2: start callback에 idle 복귀)
    Animated.sequence([
      Animated.timing(jellyScale, { toValue: 1.15, duration: 80, easing: MOTION_TOKENS.EASE_BOUNCE, useNativeDriver: true }),
      Animated.timing(jellyScale, { toValue: 0.95, duration: 80, easing: MOTION_TOKENS.EASE_BOUNCE, useNativeDriver: true }),
      Animated.timing(jellyScale, { toValue: 1.05, duration: 80, easing: MOTION_TOKENS.EASE_BOUNCE, useNativeDriver: true }),
      Animated.timing(jellyScale, { toValue: 1, duration: 80, easing: MOTION_TOKENS.EASE_BOUNCE, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled) return;
    triggerJelly();
    void hapticImpact("light");
    void playSfx("toggle");
    onValueChange(!value);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: inactiveColor }, disabled && { opacity: 0.4 }]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: activeColor, borderRadius: TRACK_HEIGHT / 2, opacity: trackOpacity },
        ]}
      />
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [{ translateX: thumbX }, { scale: jellyScale }],
          },
        ]}
      >
        <View style={styles.thumbInner} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: "center",
    overflow: "hidden",
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    position: "absolute",
    left: THUMB_PADDING,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbInner: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#FFFFFF",
  },
});
