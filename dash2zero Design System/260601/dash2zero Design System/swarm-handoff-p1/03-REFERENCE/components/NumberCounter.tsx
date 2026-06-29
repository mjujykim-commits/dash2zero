/**
 * NumberCounter — count-up animation (P1.1, Animated legacy)
 *
 * Source: dash2zero Design System / swarm-handoff-p1/01-WORK-ORDER.md §3
 * Target: apps/mobile/src/components/d022/NumberCounter.tsx
 *
 * ADR-0009 정합: counter는 단순 1D 보간이라 Animated legacy 유지 (Reanimated 불요).
 *
 * 활용 (Designer §Q3 결정): Lesson Complete의 "{N} words nailed." 1건만 활성.
 *   Home stats / Paywall 숫자는 정적 유지 (매 진입 카운트업은 학습 흐름 방해).
 *
 * 4-rule:
 *   - Rule 1: 텍스트 내용 보간이라 transform/opacity 아님 — JS listener로 setState.
 *     (값 자체가 바뀌는 카운터는 native driver 불가, 사유 주석. 60fps 부담 낮음 — 단발 900ms)
 *   - Rule 2: unmount 시 listener remove + animation stop
 *   - Rule 3: duration["motion.count"] (900ms) + rnEasing.out
 *
 * Reduce Motion: 카운트업 생략, 최종값 즉시 표시.
 */

import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Text, type StyleProp, type TextStyle } from "react-native";
import { duration, rnEasing } from "@dash2zero/design-tokens";

interface Props {
  /** 목표 숫자 */
  value: number;
  /** 0이 아닌 시작값 (default 0) */
  from?: number;
  style?: StyleProp<TextStyle>;
  /** 접두/접미 (예: prefix="+", suffix=" words") */
  prefix?: string;
  suffix?: string;
}

export function NumberCounter({ value, from = 0, style, prefix = "", suffix = "" }: Props) {
  const [display, setDisplay] = useState(from);
  const anim = useRef(new Animated.Value(from)).current;

  useEffect(() => {
    let reduce = false;
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!mounted) return;
      reduce = v;
      if (reduce) {
        setDisplay(value);
        return;
      }
      anim.setValue(from);
      const id = anim.addListener(({ value: v2 }) => setDisplay(Math.round(v2)));
      Animated.timing(anim, {
        toValue: value,
        duration: duration["motion.count"],
        easing: rnEasing.out,
        // 값 보간이라 native driver 불가 (텍스트 content 변경) — 단발 900ms, 부담 낮음
        useNativeDriver: false,
      }).start(() => {
        anim.removeListener(id);
        setDisplay(value); // 라운딩 잔차 보정
      });
    });
    return () => {
      mounted = false;
      anim.stopAnimation();
      anim.removeAllListeners();
    };
  }, [value, from, anim]);

  return (
    <Text style={style} accessibilityLabel={`${prefix}${value}${suffix}`}>
      {prefix}{display}{suffix}
    </Text>
  );
}
