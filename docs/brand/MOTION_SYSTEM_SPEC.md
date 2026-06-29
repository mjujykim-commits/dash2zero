# dash2zero Premium Motion & Micro-Interaction System Spec (v1.1)
## — React Native & Expo Native App Specification (W16 D-3)

This document stands as the **Single Source of Truth (SSOT)** for all animations, transitions, and micro-interactions within the `dash2zero` native mobile product line (React Native + Expo SDK 51).

Its primary purpose is to define core physics-based curves, React Native `Animated` / `expo-haptics` bindings, and execution semantics to guarantee an ultra-premium, tactile **"haptic feel"** (0.18s ~ 0.3s response times, hardware-accelerated 60fps/120fps rendering).

---

## 1. Timing & Easing Philosophy: The Physics Engine

All interface transitions utilize customized easing constants that simulate gravity, elasticity, and momentum. Since React Native does not support CSS custom properties, these constants must be declared in our styles or constants repository (`constants/Motion.ts`).

### Core Timing Tokens

```typescript
import { Easing } from 'react-native';

export const MOTION_TOKENS = {
  // Easing Curves
  EASE_BOUNCE: Easing.bezier(0.34, 1.56, 0.64, 1),      // Tactile spring rebound
  EASE_DECELERATE: Easing.bezier(0.22, 1, 0.36, 1),  // Soft high-end braking
  EASE_EXIT: Easing.bezier(0.32, 0, 0.67, 0),        // Swift dismissal

  // Durations
  DURATION_QUICK: 180,   // Haptic reactions, switch toggles (ms)
  DURATION_NORMAL: 300,  // Modals, progress bar updates, error deflections (ms)
  DURATION_SLOW: 450,    // Multi-stage animations (ms)
};
```

---

## 2. Platform Decisions & Optimization (Q-MOTION Response)

To ensure fluid 60fps/120fps performance on native devices while retaining the high-end K-pop design language, we enforce these architectural decisions:

1. **Q-MOTION-1: Shadow Press [Option B]**
   * *Implementation*: We scale down the button (`1.0` to `0.96`) and simultaneously transition the `opacity` of a custom `<Shadow>` or drop-shadow overlay down to `0.6x` using native driver. This prevents frame drops caused by JS-thread shadow-radius recalculations while preserving visual depth.
2. **Q-MOTION-2: Skeleton Shimmer [Option A]**
   * *Implementation*: Standard `expo-linear-gradient` inside an `Animated.View` moving `translateX` from `-100%` to `100%` over a `1.6s` loop, bound directly to `useNativeDriver: true`. This avoids bloated Skia engine requirements and preserves quick startup times.
3. **Q-MOTION-3: Page Transition [Option A]**
   * *Implementation*: Leverage Expo Router's native Stack navigation with the built-in `animation: "slide_from_right"`. This is highly optimized, reliable, and uses native iOS/Android system transitions.
4. **Q-MOTION-4: Haptic Feedback [Option B]**
   * *Implementation*: Fully integrate physical haptics using `expo-haptics`.
     * **Correct Choice / Completed Task**: Trigger `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`.
     * **Incorrect Choice / Failure**: Trigger `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)`.
     * **Standard Button Press / Toggle**: Trigger `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`.
5. **Q-MOTION-5: iOS Reduce Motion Compatibility [Option A]**
   * *Implementation*: If iOS/Android `AccessibilityInfo.isReduceMotionEnabled()` is active, fall back to a simple `150ms opacity fade` for all micro-interactions instead of spring scale-downs or shakes.

---

## 3. High-Fidelity Specs by Interaction Categories

### Category A: Feedback & Haptics
* **Button Presses**: Elevate elements marginally on hover (Android: `elevation: 2`, iOS: shadow), but on press, immediately shrink to `scale(0.96)` and lower shadow opacity to 60%, firing a light haptic tap.
* **The Shake Deflection**: For incorrect selections, trigger a fast horizontal spring displacement of `±6px` utilizing `useNativeDriver: true` over `300ms`.
* **Pulse Ripple**: Upon selecting a correct card, overlay an expanding, scaling circle (`scale: 0` to `scale: 2.2`, `opacity: 0.4` to `opacity: 0`) centered on the hit-test coordinate.

### Category B: Layout & Transitions
* **Modal Sheets**: Translate from `translateY(24px) scale(0.96) opacity(0)` to `translateY(0) scale(1) opacity(1)` on entrance using `EASE_DECELERATE` (`300ms`).
* **Skeletal Shimmering**: Styled placeholders must loop continuously using the native translation engine, overlaying a diagonal metallic sheen.

---

## 4. 🔴 SWARM COOPERATION SYSTEM PROMPT (For Frontend Agent)

```markdown
================================================================================
SYSTEM INSTRUCTION FOR FRONTEND AGENT: REACT NATIVE PREMIUM MOTION SPEC (v1.1)
================================================================================
You are the Senior Frontend UI/UX Engineer in the dash2zero Swarm Coding team.
Your absolute priority is to take the React Native/TypeScript structures in apps/mobile/
and inject ultra-premium, tactile physical micro-interactions, strictly complying
with our Native Motion Engine.

You must follow these strict technical rules:

1. FORCE NATIVE DRIVER FOR 60FPS
   - For all Animated APIs, you MUST set `useNativeDriver: true`.
   - Never animate layout properties like 'width', 'height', 'top', 'left', 'margin'.
   - Animatable properties are strictly locked to 'transform' (scale, translate) and 'opacity'.

2. PHYSICAL HAPTICS AND TRIGGERS (expo-haptics)
   - Wrap interactive buttons with <Pressable> and trigger a light haptic impact:
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
   - Retrieval Card Correct Feedback (08-lesson-retrieve.html):
     - Trigger: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
   - Retrieval Card Incorrect Feedback:
     - Trigger: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
     - Perform a dynamic 300ms horizontal shake of ±6px.

3. SKELETON SHIMMER PLACEHOLDERS
   - While loading cards or stats, use expo-linear-gradient inside an Animated.View.
   - Interpolate a translateX value from -100% to 100% in a loop.

4. IOS REDUCE MOTION ACCESS-FRIENDLY FALLBACK
   - Proactively detect if Reduce Motion is active.
   - If active, replace spring scales and shakes with a smooth 150ms opacity transition.

================================================================================
PRODUCTION-GRADE TSX COMPONENT TEMPLATE (Lesson Retrieval Choice Card)
================================================================================
Implement this exact high-fidelity pattern inside 'apps/mobile/components/ChoiceCard.tsx':

import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, Pressable, Animated, AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MOTION_TOKENS } from '../constants/Motion';

interface Props {
  text: string;
  isCorrect: boolean;
  onNext: () => void;
}

export const ChoiceCard: React.FC<Props> = ({ text, isCorrect, onNext }) => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [reduceMotion, setReduceMotion] = useState(false);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const handlePressIn = () => {
    if (reduceMotion) return;
    Animated.timing(scaleAnim, {
      toValue: 0.96,
      duration: MOTION_TOKENS.DURATION_QUICK,
      easing: MOTION_TOKENS.EASE_BOUNCE,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    Animated.timing(scaleAnim, {
      toValue: 1.0,
      duration: MOTION_TOKENS.DURATION_QUICK,
      easing: MOTION_TOKENS.EASE_BOUNCE,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isCorrect) {
      setStatus('success');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Smooth fade transition if reduce motion is active
      if (reduceMotion) {
        Animated.timing(opacityAnim, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }).start(() => onNext());
      } else {
        setTimeout(() => onNext(), 700);
      }
    } else {
      setStatus('error');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      if (reduceMotion) {
        // Fallback fade blink for error
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 0.3, duration: 80, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1.0, duration: 120, useNativeDriver: true })
        ]).start(() => setStatus('idle'));
      } else {
        // Standard high-end spring horizontal shake
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start(() => setStatus('idle'));
      }
    }
  };

  const animatedStyle = {
    opacity: opacityAnim,
    transform: [
      { scale: scaleAnim },
      { translateX: shakeAnim }
    ]
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        status === 'success' && styles.correct,
        status === 'error' && styles.error,
        pressed && styles.pressedShadow
      ]}
    >
      <Animated.View style={[styles.innerContent, animatedStyle]}>
        <Text style={styles.text}>{text}</Text>
        {status === 'success' && <Text style={styles.check}>✓</Text>}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#1A1B2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  pressedShadow: {
    shadowOpacity: 0.04,
    elevation: 1,
  },
  correct: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  error: {
    borderColor: '#F87171',
    borderWidth: 2,
  },
  innerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    color: '#FAFAF9',
    fontWeight: '700',
  },
  check: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '900',
  }
});
================================================================================
```
