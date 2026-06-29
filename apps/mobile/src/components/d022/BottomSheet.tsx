/**
 * BottomSheet — Modal Sheet motion (Motion v1.1 §3 Category B)
 *
 * Source of Truth:
 *   - docs/brand/MOTION_SYSTEM_SPEC.md v1.1 §3 Category B
 *     "Modal Sheets: Animate from translateY(24px) scale(0.96) opacity(0) to translateY(0) scale(1) opacity(1)
 *      on entrance using EASE_DECELERATE (300ms)"
 *   - docs/brand/DESIGN_REVIEW_W16_MOTION.md §3 P2 (Modal Sheet 권고)
 *   - packages/design-tokens/src/motion.ts (MOTION_TOKENS)
 *
 * 현재 codebase는 modal 미사용 — 본 컴포넌트는 디자이너 의도 보존 + 후속 PR 사용 대비.
 *   사용처 후보 (M4 W17+):
 *     - Settings의 destructive confirmation (Delete account / Sign out)
 *     - Subscription tier 변경 알림
 *     - Lesson abandonment confirmation
 *
 * 4-rule Merge Gate:
 *   - Rule 1 (GPU): transform translateY + scale + opacity — useNativeDriver: true
 *   - Rule 2 (Lifecycle): visible=false → exit animation 후 Modal unmount + Animated.Value 초기화
 *   - Rule 3 (Timing): MOTION_TOKENS.DURATION_NORMAL (300ms enter) / DURATION_QUICK (180ms exit)
 *               + EASE_DECELERATE (enter) / EASE_EXIT (exit)
 *   - Rule 4: skeleton 아님 (N/A)
 *
 * Reduce Motion (Q-MOTION-5):
 *   - 활성 시 transform 차단, opacity fade만 (REDUCE_MOTION_FADE_DURATION × 2 enter + exit)
 *
 * a11y:
 *   - Modal API의 backdrop tap + Android Back 처리 (onRequestClose)
 *   - role="dialog" 패턴은 RN Modal이 내장 (accessibilityViewIsModal 자동)
 */

import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
  type StyleProp,
} from "react-native";

import { lightColors, spacing, MOTION_TOKENS } from "@dash2zero/design-tokens";

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** 시트 내부 영역 스타일 (background, padding 등). default — surface.elevated + rounded top */
  sheetStyle?: StyleProp<ViewStyle>;
  /** backdrop tap dismiss 허용. default true */
  dismissOnBackdrop?: boolean;
  accessibilityLabel?: string;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  sheetStyle,
  dismissOnBackdrop = true,
  accessibilityLabel,
}: Props) {
  // Modal mount는 visible=true 또는 exit animation 진행 중일 때만 — exit 후 unmount
  const [mounted, setMounted] = useState(visible);
  const [reduceMotion, setReduceMotion] = useState(false);

  const translateY = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Reduce Motion detection
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((e) => {
      if (alive) setReduceMotion(e);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Enter — translateY 24→0 + scale 0.96→1 + opacity 0→1 + backdrop 0→1
      // Reduce Motion 시 fade만 (Q-MOTION-5)
      if (reduceMotion) {
        // 시작점 강제 정상화 + opacity fade
        translateY.setValue(0);
        scale.setValue(1);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: MOTION_TOKENS.REDUCE_MOTION_FADE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: MOTION_TOKENS.REDUCE_MOTION_FADE_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        translateY.setValue(24);
        scale.setValue(0.96);
        opacity.setValue(0);
        backdropOpacity.setValue(0);
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: MOTION_TOKENS.DURATION_NORMAL,
            easing: MOTION_TOKENS.EASE_DECELERATE,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: MOTION_TOKENS.DURATION_NORMAL,
            easing: MOTION_TOKENS.EASE_DECELERATE,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: MOTION_TOKENS.DURATION_NORMAL,
            easing: MOTION_TOKENS.EASE_DECELERATE,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: MOTION_TOKENS.DURATION_NORMAL,
            easing: MOTION_TOKENS.EASE_DECELERATE,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else if (mounted) {
      // Exit — translateY 0→24 + opacity 1→0 + backdrop 1→0 (EASE_EXIT, 180ms)
      // Rule 2: 종료 후 mount=false → Modal unmount
      const exitDuration = reduceMotion
        ? MOTION_TOKENS.REDUCE_MOTION_FADE_DURATION
        : MOTION_TOKENS.DURATION_QUICK;
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: reduceMotion ? 0 : 24,
          duration: exitDuration,
          easing: MOTION_TOKENS.EASE_EXIT,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: exitDuration,
          easing: MOTION_TOKENS.EASE_EXIT,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: exitDuration,
          easing: MOTION_TOKENS.EASE_EXIT,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, reduceMotion, translateY, scale, opacity, backdropOpacity, mounted]);

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none" // 우리가 Animated로 제어 — Modal 기본 motion 비활성
      onRequestClose={onClose} // Android Back / iOS modal dismiss
      statusBarTranslucent
      accessibilityViewIsModal
    >
      {/* Backdrop — tap dismiss */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={dismissOnBackdrop ? onClose : undefined}
          accessibilityLabel="Close sheet"
        />
      </Animated.View>

      {/* Sheet */}
      <View style={styles.container} pointerEvents="box-none">
        <Animated.View
          accessibilityLabel={accessibilityLabel}
          style={[
            styles.sheet,
            sheetStyle,
            {
              opacity,
              transform: [{ translateY }, { scale }],
            },
          ]}
        >
          {/* Drag handle indicator (시각만) */}
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: lightColors["surface.elevated"],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing["space.5"],
    paddingTop: spacing["space.3"],
    paddingBottom: spacing["space.6"],
    borderTopWidth: 1,
    borderColor: lightColors["glass.border"],
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: lightColors["text.muted"],
    alignSelf: "center",
    marginBottom: spacing["space.4"],
    opacity: 0.5,
  },
});
