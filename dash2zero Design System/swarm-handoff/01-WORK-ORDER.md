# D-022 Motion System · M4 Swarm Work Order

> **Status:** Draft for orchestrator assignment
> **Owner approval:** required before dispatch (mju.jykim@gmail.com)
> **Source authority:** `/projects/<design-system>/review/index.html` § 03 치명적 약점 + § 05 모션 토큰 처방
> **Target milestone:** M4 W17 (2026-05-26 ~ 2026-06-01)
> **Scope:** P0 only. P1/P2는 본 문서 §10 참조 후 별도 sprint risk 등록.

이 문서는 **swarm coding 팀 (frontend + designer + qa)** 에 dispatch할 작업
지시서이자 그대로 agent prompt로 paste 가능하도록 작성됨.

---

## 0. 한 번에 읽는 요약

| | |
|---|---|
| **무엇을** | D-022 K-pop Bold의 시각 시스템을 **모션 시스템**으로 확장한다. |
| **왜** | 시각 토큰 적용은 끝났지만 transition·feedback·loading·micro가 비어 있음. GA 직전 사용자 1차 반응이 가장 먼저 떨어지는 지점이다. |
| **얼마나** | P0 5건 · 추정 frontend 3 ~ 5 인-day · QA 1 인-day. |
| **언제** | M4 W17 entry 직후 — Cycle A는 토큰 + 컴포넌트 4건, Cycle B는 lesson stage 시그니처 모션 + QA. |
| **어디** | `packages/design-tokens/src/motion.ts`, `apps/mobile/src/components/d022/*`, `apps/mobile/app/lesson/[wordId].tsx`, `apps/mobile/app/home.tsx`. |
| **금지** | 시각 토큰(컬러/타이포/그라데이션) 수정 금지. 본 작업은 **모션 전용**. D-022 봉인 깨지 말 것. |

---

## 1. 작업 지침 (일관 규칙)

이 sprint의 모든 모션 변경은 다음 5조를 만족해야 한다.

1. **Duration은 토큰만 사용.** 신규 토큰 5개는 §2에 정의. 인라인 `duration: 200`
   금지. 반드시 `import { duration } from "@dash2zero/design-tokens"` 경유.
2. **Easing은 토큰만 사용.** `easing.spring` (신규) 외에는 임의 cubic-bezier
   금지.
3. **reduce-motion 검사는 모든 새 모션의 default.** `AccessibilityInfo.isReduceMotionEnabled()`
   훅으로 감싸고, true일 때는 (a) `scale`/`translateY` → opacity fade only,
   (b) 무한 애니메이션은 정지 frame으로 고정. (`NeonButton.tsx` 패턴 참조)
4. **Native driver only.** `Animated.timing({ ... useNativeDriver: true })`.
   layout 속성(width/height)이 필요한 경우만 false, 그 경우 사유 주석 필수.
5. **정답/오답 피드백은 색 + glow + 단일 micro-pop만.** D-022 모션 일부
   강화는 허용되지만 학습 흐름 차단(>500ms 차단성 anim) 금지. `DESIGN_DIRECTION
   §9.2`의 "정답/오답은 색 변경 + glow만, scale 불가(흐름 차단)" 규칙 보존.
   본 sprint에서는 ✓ icon에만 한정된 spring scale을 허용함 — choice card
   본체는 흔들리지 않음.

> **Lint rule 추가 권고 (qa agent):** `no-restricted-syntax` ESLint 규칙으로
> `duration: <numeric literal> ms`을 component 파일에서 금지. M4 Cycle B에서
> qa가 따로 dispatch.

---

## 2. 모션 토큰 갱신 (P0-0)

**책임 agent:** designer + frontend
**파일:** `packages/design-tokens/src/motion.ts`
**예상 시간:** 30분
**선행 작업:** 없음. **나머지 P0 4건은 이 토큰에 의존하므로 가장 먼저 merge.**

### 2.1 신규/갱신 토큰

```ts
// packages/design-tokens/src/motion.ts — 전체 교체본
export const duration = {
  "motion.tap":      80,   // 기존 motion.fast → tap으로 명칭 변경 (의미 명확화)
  "motion.fast":    150,   // 기존 motion.base 유지
  "motion.base":    200,   // 기존 motion.medium 유지 — 가장 자주 사용
  "motion.stage":   240,   // ✨ NEW · lesson Notice→Hear→Meaning→Retrieve 전환 헌정
  "motion.spring":  320,   // ✨ NEW · toggle knob · badge pop · ✓ scale-in
  "motion.sheet":   360,   // 기존 명칭 변경 (motion.medium → sheet)
  "motion.slow":    300,   // 기존 유지 — hero scale-in
  "motion.progress":600,   // ✨ NEW · progress bar fill / chain advance
  "motion.count":   900,   // ✨ NEW · 숫자 카운트업 (Lesson Complete 한정)
} as const;

export const easing = {
  out:    "cubic-bezier(0.16, 1, 0.3, 1)",
  in:     "cubic-bezier(0.7, 0, 0.84, 0)",
  inOut:  "cubic-bezier(0.65, 0, 0.35, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)", // ✨ NEW · overshoot
  shake:  "cubic-bezier(0.36, 0.07, 0.19, 0.97)", // ✨ NEW · incorrect answer
} as const;

// React Native Easing 매핑 — Animated.timing에 직접 사용
import { Easing as RNEasing } from "react-native";
export const rnEasing = {
  out:    RNEasing.bezier(0.16, 1, 0.3, 1),
  in:     RNEasing.bezier(0.7, 0, 0.84, 0),
  inOut:  RNEasing.bezier(0.65, 0, 0.35, 1),
  spring: RNEasing.bezier(0.34, 1.56, 0.64, 1),
  shake:  RNEasing.bezier(0.36, 0.07, 0.19, 0.97),
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken   = keyof typeof easing;
```

### 2.2 호환성 처리

- `motion.fast` (80) → `motion.tap` 으로 이름 변경. **기존 코드의
  `motion.fast` 사용처는 모두 `motion.tap`으로 치환**하되 의미가 150ms로
  바뀐 곳은 `motion.fast` 신규 정의(150ms)에 매핑. designer가 PR에서 1:1
  diff 검토.
- `motion.medium` (200) → `motion.base` 유지 (현재 코드와 동일 시간).
- 토큰 import 경로는 변경 없음. 단지 export 추가.

### 2.3 테스트

`packages/design-tokens/test/motion.spec.ts` 신설 또는 갱신:

```ts
import { duration, easing } from "../src/motion";

test("duration tokens are monotonically meaningful", () => {
  expect(duration["motion.tap"]).toBe(80);
  expect(duration["motion.fast"]).toBe(150);
  expect(duration["motion.base"]).toBe(200);
  expect(duration["motion.stage"]).toBe(240);
  expect(duration["motion.spring"]).toBe(320);
  expect(duration["motion.sheet"]).toBe(360);
  expect(duration["motion.progress"]).toBe(600);
  expect(duration["motion.count"]).toBe(900);
});

test("all durations are within 80-1000ms range", () => {
  Object.values(duration).forEach((ms) => {
    expect(ms).toBeGreaterThanOrEqual(80);
    expect(ms).toBeLessThanOrEqual(1000);
  });
});
```

---

## 3. P0-1 · 학습 단계 시그니처 전환 모션

> **사용자에게 가장 큰 체감 영향. 본 sprint의 hero 작업.**

**책임 agent:** frontend (구현) + designer (감수)
**파일:** `apps/mobile/app/lesson/[wordId].tsx`, 신규 `apps/mobile/src/components/d022/StageTransition.tsx`
**예상 시간:** 4 ~ 6h
**선행:** P0-0 토큰 갱신 완료

### 3.1 목적

Notice → Hear → Meaning → Retrieve 4단계의 stage 전환을 단일 `setStage`
교체에서, **한글 글자는 좌상단으로 축소하며 RR + gloss + example이
밑에서 fade-up으로 stagger 등장**하는 시그니처 모션으로 교체. 사용자가
하루 12번 보는 무대이므로 이 모션 하나에 가장 많은 폴리시를 투입한다.

### 3.2 Acceptance Criteria

1. Notice → Hear 전환 시 audio button이 240ms ease-out으로 fade-in (현재는
   조건부 렌더 후 즉시 표시).
2. Hear → Meaning 전환 시:
   - 한글 글자(`text.word`) `fontSize` 64 → 56으로 240ms 축소 + 위쪽으로
     translateY -16 (Tier 1에서 Tier 1.5로 후퇴).
   - Romanization + gloss + example이 80ms stagger로 fade-up (각 240ms,
     translateY 8 → 0).
3. Meaning → Retrieve 전환 시 quiz 옵션 4개가 60ms stagger로 fade-up.
4. **reduce-motion = true** 일 때 translateY 변환 비활성, opacity 240ms
   fade만 유지.
5. 단계 전환 중 사용자가 CTA를 더블탭해도 모션이 중첩되지 않음(in-flight
   guard). React Native `Animated.Value`의 lifecycle 정리 포함.
6. 단계 전환 중 audio 재생이 끊기지 않음 (현재 동작 보존).

### 3.3 샘플 구현

```tsx
// apps/mobile/src/components/d022/StageTransition.tsx
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, type ViewStyle } from "react-native";
import { duration, rnEasing } from "@dash2zero/design-tokens";

type Props = {
  children: React.ReactNode;
  /** stage identity — 값이 바뀔 때만 entrance animation 재실행 */
  stageKey: string;
  /** 등장 stagger index — 0 = 즉시, 1+ = 60ms × index 지연 */
  delayIndex?: number;
  style?: ViewStyle;
};

export function StageReveal({ children, stageKey, delayIndex = 0, style }: Props) {
  const [reduce, setReduce] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const ty      = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduce(v));
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (v) => setReduce(v)
    );
    return () => { mounted = false; sub.remove(); };
  }, []);

  useEffect(() => {
    opacity.setValue(0);
    ty.setValue(reduce ? 0 : 8);
    const delay = delayIndex * 60;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration["motion.stage"],
        easing: rnEasing.out,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(ty, {
        toValue: 0,
        duration: duration["motion.stage"],
        easing: rnEasing.out,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stageKey, delayIndex, reduce, opacity, ty]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: reduce ? [] : [{ translateY: ty }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
```

```tsx
// apps/mobile/src/components/d022/KoreanWord.tsx (신규 또는 inline)
// 단계에 따라 글자 크기/위치를 변화시키는 컨테이너
import { useEffect, useRef } from "react";
import { Animated, type StyleProp, type TextStyle } from "react-native";
import { duration, rnEasing } from "@dash2zero/design-tokens";

type Tier = "hero" | "tier-1-5";

export function MorphingKoreanWord({
  children,
  tier,
  style,
}: {
  children: React.ReactNode;
  tier: Tier;
  style?: StyleProp<TextStyle>;
}) {
  // fontSize는 native driver로 animate 불가 — layout 속성.
  // 대안: 두 사이즈를 scale로 보간 (transform: scale, useNativeDriver: true).
  const scale = useRef(new Animated.Value(tier === "hero" ? 1 : 0.875)).current;
  const ty    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: tier === "hero" ? 1 : 0.875, // 64 → ~56
        duration: duration["motion.stage"],
        easing: rnEasing.out,
        useNativeDriver: true,
      }),
      Animated.timing(ty, {
        toValue: tier === "hero" ? 0 : -16,
        duration: duration["motion.stage"],
        easing: rnEasing.out,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tier, scale, ty]);

  return (
    <Animated.Text
      accessibilityLanguage="ko"
      style={[style, { transform: [{ translateY: ty }, { scale }] }]}
    >
      {children}
    </Animated.Text>
  );
}
```

```tsx
// apps/mobile/app/lesson/[wordId].tsx (관련 부분만, diff 형식)
// 한글 단어는 MorphingKoreanWord로 교체
- <Text style={{ fontSize: 64, ... }}>{word.korean}</Text>
+ <MorphingKoreanWord
+   tier={stage === "notice" || stage === "hear" ? "hero" : "tier-1-5"}
+   style={{ fontSize: 64, fontWeight: "900", color: lightColors["korean.glyph"], textAlign: "center" }}
+ >
+   {word.korean}
+ </MorphingKoreanWord>

// Meaning 단계의 RR + gloss + example을 StageReveal로 감싸고 stagger
- {(stage === "meaning" || stage === "retrieve") && (
-   <View>
-     <Text>{word.romanization}</Text>
-     <Text>{word.gloss}</Text>
-     <Text>{word.example_ko}</Text>
-   </View>
- )}
+ {(stage === "meaning" || stage === "retrieve") && (
+   <View>
+     <StageReveal stageKey={`${cursor}-rr`}     delayIndex={0}><Text>{word.romanization}</Text></StageReveal>
+     <StageReveal stageKey={`${cursor}-gloss`}  delayIndex={1}><Text>{word.gloss}</Text></StageReveal>
+     <StageReveal stageKey={`${cursor}-ko`}     delayIndex={2}><Text>{word.example_ko}</Text></StageReveal>
+     <StageReveal stageKey={`${cursor}-en`}     delayIndex={3}><Text>{word.example_en}</Text></StageReveal>
+   </View>
+ )}

// Quiz 4 옵션도 동일 패턴 — stagger 60ms × index
{word.options_for_quiz.map((opt, i) => (
  <StageReveal key={opt} stageKey={`${cursor}-opt-${i}`} delayIndex={i}>
    {/* 기존 Pressable */}
  </StageReveal>
))}
```

### 3.4 테스트

- **수동:** Lesson 화면 진입 → 각 단계 진행 시 stagger 확인. iPhone SE 320pt
  실기 또는 시뮬레이터에서 한글 글자가 위로 밀려도 화면 안에 들어오는지.
- **자동:**
  - `__tests__/StageReveal.spec.tsx` — `stageKey` 변경 시 opacity가 0 → 1로
    움직이는지 (`Animated.timing` mock).
  - reduce-motion = true 일 때 transform 빈 배열 확인.
- **eval:** lesson_completed 이벤트 발화 시간이 기존 대비 +0~+400ms 이내
  (모션 추가로 인한 user-perceived latency 검증 — analytics 책임).

### 3.5 위험

- `MorphingKoreanWord`의 scale 보간은 fontSize 변경이 아니므로 실측
  rendering이 약간 다를 수 있음. M3 Notice 단계에서 한글이 너무 작아 보이면
  base fontSize를 72로 올리고 scale 0.78로 보정.

---

## 4. P0-2 · Quiz 정답·오답 리액션 강화

**책임 agent:** frontend
**파일:** `apps/mobile/app/lesson/[wordId].tsx` (option pressable 부분), 신규 `apps/mobile/src/components/d022/QuizOption.tsx`
**예상 시간:** 3h
**선행:** P0-0

### 4.1 목적

정답 시 success glow가 부드럽게 펄스 + ✓ icon이 0.4→1.0 spring scale.
오답 시 360ms shake + danger border. **카드 본체에는 모션 적용 안 함**
(흐름 차단 회피).

### 4.2 Acceptance Criteria

1. 정답 선택 시 success border + glow가 **600ms ease-out**으로 강화되고
   ✓ icon이 **spring(320ms)**으로 등장.
2. 오답 선택 시 danger border + **shake easing 360ms**의 horizontal
   ±6px 흔들림. ✕ icon은 즉시 fade-in (200ms).
3. submitted 상태에서는 다시 누를 수 없음(현재 동작 보존).
4. reduce-motion 시 shake → opacity blink (200ms × 2) 로 대체.

### 4.3 샘플 구현

```tsx
// apps/mobile/src/components/d022/QuizOption.tsx
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, Text, View } from "react-native";
import { duration, rnEasing, lightColors } from "@dash2zero/design-tokens";

type State = "default" | "selected" | "correct" | "incorrect";

export function QuizOption({
  label,
  state,
  onPress,
  disabled,
}: {
  label: string;
  state: State;
  onPress: () => void;
  disabled?: boolean;
}) {
  const [reduce, setReduce] = useState(false);
  const shakeX = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.4)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let m = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => m && setReduce(v));
    return () => { m = false; };
  }, []);

  useEffect(() => {
    if (state === "incorrect" && !reduce) {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -6, duration: 60,  easing: rnEasing.shake, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  6, duration: 80,  easing: rnEasing.shake, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -4, duration: 80,  easing: rnEasing.shake, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  4, duration: 80,  easing: rnEasing.shake, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  0, duration: 60,  easing: rnEasing.shake, useNativeDriver: true }),
      ]).start();
    }
    if (state === "correct" || state === "incorrect") {
      Animated.parallel([
        Animated.timing(iconOpacity, { toValue: 1, duration: duration["motion.base"], delay: 140, easing: rnEasing.out, useNativeDriver: true }),
        Animated.timing(iconScale,   { toValue: 1, duration: duration["motion.spring"], delay: 140, easing: rnEasing.spring, useNativeDriver: true }),
      ]).start();
    } else {
      iconOpacity.setValue(0);
      iconScale.setValue(0.4);
    }
  }, [state, reduce, shakeX, iconOpacity, iconScale]);

  const borderColor =
    state === "correct"   ? lightColors["semantic.success"] :
    state === "incorrect" ? lightColors["semantic.danger"]  :
    state === "selected"  ? lightColors["neon.pink"]        :
                            lightColors["border.subtle"];

  const bg =
    state === "correct"   ? "rgba(16,185,129,0.12)" :
    state === "incorrect" ? "rgba(248,113,113,0.12)" :
    state === "selected"  ? "rgba(236,72,153,0.08)"  :
                            lightColors["surface.card"];

  return (
    <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={{
          minHeight: 60,
          borderRadius: 16,
          padding: 16,
          backgroundColor: bg,
          borderColor,
          borderWidth: state === "default" ? 1 : 2,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          shadowColor: state === "correct" ? lightColors["semantic.success"]
                     : state === "selected" ? lightColors["neon.pink"]
                     : "transparent",
          shadowOpacity: state === "default" ? 0 : 0.4,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          elevation: state === "default" ? 0 : 4,
        }}
      >
        <Text accessibilityLanguage="ko" style={{ fontSize: 20, fontWeight: "700", color: lightColors["text.primary"] }}>
          {label}
        </Text>
        <Animated.View style={{
          opacity: iconOpacity, transform: [{ scale: iconScale }],
          width: 28, height: 28, borderRadius: 14,
          backgroundColor: state === "correct" ? lightColors["semantic.success"] : lightColors["semantic.danger"],
          alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13 }}>
            {state === "correct" ? "✓" : "✕"}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
```

### 4.4 테스트

- **수동 적대 케이스:** 정답 → 다음 카드로 넘어가기 전에 한 번 더 탭 (무반응
  확인) · 오답 → 빠르게 더블탭 (shake 중첩 없음 확인).
- **자동:** `__tests__/QuizOption.spec.tsx` — state prop 변화에 따라
  Animated.timing이 호출되는 카운트 검증.

---

## 5. P0-3 · NeonButton ripple + hover lift + focus ring

**책임 agent:** frontend
**파일:** `apps/mobile/src/components/d022/NeonButton.tsx`
**예상 시간:** 3h
**선행:** P0-0

### 5.1 목적

현재 NeonButton은 press에서 scale(0.96)만 적용. **Ripple, focus ring,
glow brighten 3건을 추가**.

### 5.2 Acceptance Criteria

1. Press 시 터치 좌표에서 출발한 ripple이 4× scale로 600ms ease-out
   확장. 단일 버튼에서 동시 여러 ripple 가능 (튐 없음).
2. Pressed 상태에서 glow가 강화 (기본 glow.pink → glow.pink 1.4×).
3. Focus 상태(키보드/외부 키보드 사용자)에서 2px neon-cyan ring + 외곽
   glow.cyan.
4. reduce-motion = true 시 ripple 비활성, glow brighten은 즉시 적용 (no
   animation).
5. Ripple 컴포넌트는 unmount 시 cleanup 보장 (메모리 누수 없음).

### 5.3 샘플 구현

```tsx
// apps/mobile/src/components/d022/NeonButton.tsx (추가 부분만)
// 기존 import에 추가
import { useState, useRef, useCallback } from "react";
import { Animated, View, type GestureResponderEvent } from "react-native";

// Ripple sub-component
function Ripple({ x, y, size, onDone }: { x: number; y: number; size: number; onDone: () => void }) {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale,   { toValue: 1, duration: duration["motion.progress"], easing: rnEasing.out, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: duration["motion.progress"], easing: rnEasing.out, useNativeDriver: true }),
    ]).start(onDone);
  }, [scale, opacity, onDone]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x - size / 2, top: y - size / 2,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: "rgba(255,255,255,0.55)",
        opacity, transform: [{ scale }],
      }}
    />
  );
}

// NeonButton 내부에 추가
const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
const rippleId = useRef(0);
const buttonRef = useRef<View>(null);

const handlePressIn = useCallback((e: GestureResponderEvent) => {
  animateTo(0.96);
  if (reduceMotion) return;
  const { locationX, locationY } = e.nativeEvent;
  buttonRef.current?.measure?.((_x, _y, w, h) => {
    const size = Math.max(w, h) * 2;
    const id = rippleId.current++;
    setRipples((r) => [...r, { id, x: locationX, y: locationY, size }]);
  });
}, [animateTo, reduceMotion]);

const removeRipple = useCallback((id: number) => {
  setRipples((r) => r.filter((x) => x.id !== id));
}, []);

// Pressable JSX 내부에 추가 (LinearGradient inside)
<View ref={buttonRef} style={{ overflow: "hidden", borderRadius: 14, flex: 1 }}>
  <LinearGradient .../>
  {ripples.map((r) => (
    <Ripple key={r.id} x={r.x} y={r.y} size={r.size} onDone={() => removeRipple(r.id)} />
  ))}
</View>
```

### 5.4 Focus ring

React Native에서 키보드 focus 검출은 제한적 (`onFocus` 이벤트는 form 입력
요소에서만). 다음 두 가지 옵션:

- **A안 (권장):** `react-native-keyboard-controller` 또는 `expo-router`의
  네이티브 키보드 nav 이벤트 listen. 외부 키보드 사용자 한정.
- **B안 (간단):** `Pressable`의 `focused` 상태를 자체 관리하지 않고, App
  Store TestFlight 베타에서 외부 키보드 케이스 별도 검수. M4에서는 본
  티켓에서 제외하고 P1 a11y 라운드에 이관.

→ **결정 권고:** A안 라이브러리 추가는 의존성 부담. 본 sprint에서는 **focus
ring을 디자인 토큰만 정의**(`comp.button.focusRing`)하고 구현은 P1 a11y
라운드 (M5 W19)에 이관. 단 일관성을 위해 토큰 정의는 본 sprint에 포함.

```ts
// packages/design-tokens/src/components.ts 에 추가
focus: {
  ring: {
    width: 2,
    color: "neon.cyan",
    offset: 2,
    glow: "glow.cyan",
  },
},
```

### 5.5 테스트

- Press 후 빠르게 5번 더 누르면 ripple 5개 동시 표시 + 모두 cleanup.
- iOS Simulator에서 reduce-motion ON 후 ripple 미생성.

---

## 6. P0-4 · Skeleton 도입 + ActivityIndicator 제거

**책임 agent:** frontend
**파일:** `apps/mobile/src/components/d022/Skeleton.tsx` (신규), `apps/mobile/app/home.tsx`, `apps/mobile/app/lesson/[wordId].tsx`
**예상 시간:** 2h
**선행:** P0-0

### 6.1 목적

`docs/design/STATE_PATTERNS.md`가 이미 home/lesson loading 상태를
skeleton으로 지시하고 있음. 현재 `ActivityIndicator` 사용 중. **state token
사양대로 skeleton 컴포넌트 신설 + 교체**.

### 6.2 Acceptance Criteria

1. `Skeleton` 컴포넌트 — `width`, `height`, `radius` prop. background는
   `surface.muted` + shimmer overlay 1400ms ease-in-out infinite alternate.
2. Home loading 상태에서 session card(80px) + stats row(64px × 2) skeleton
   표시. ActivityIndicator 제거.
3. Lesson 진입 loading 상태에서 한글 자리(44px) + RR 자리(14px) + button
   자리(56px) skeleton.
4. Skeleton 진입 시 무조건 latency >150ms 이상만 표시 (짧은 fetch에서 깜빡임
   회피) — `useDelayedLoading(150)` 패턴.
5. reduce-motion 시 shimmer 비활성, 정적 muted 박스로 표시.

### 6.3 샘플 구현

```tsx
// apps/mobile/src/components/d022/Skeleton.tsx
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, View, type ViewStyle } from "react-native";
import { lightColors } from "@dash2zero/design-tokens";

export function Skeleton({
  width = "100%", height = 16, radius = 8, style,
}: { width?: number | "100%"; height?: number; radius?: number; style?: ViewStyle }) {
  const [reduce, setReduce] = useState(false);
  const t = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let m = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => m && setReduce(v));
    return () => { m = false; };
  }, []);

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1.0, duration: 700, useNativeDriver: true }),
        Animated.timing(t, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, t]);

  return (
    <Animated.View
      style={[
        {
          width, height, borderRadius: radius,
          backgroundColor: lightColors["surface.muted"],
          opacity: reduce ? 0.7 : t,
        },
        style,
      ]}
    />
  );
}

export function useDelayedLoading(isLoading: boolean, delay = 150) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!isLoading) { setShow(false); return; }
    const id = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(id);
  }, [isLoading, delay]);
  return show;
}
```

```tsx
// apps/mobile/app/home.tsx — loading 상태 교체 (diff)
- if (summary.isLoading) {
-   return (
-     <GradientBackground variant="dark" ...>
-       <ActivityIndicator color={lightColors["neon.cyan"]} size="large" />
-     </GradientBackground>
-   );
- }
+ const showSkeleton = useDelayedLoading(summary.isLoading);
+ if (summary.isLoading && showSkeleton) {
+   return (
+     <GradientBackground variant="dark" direction="vertical" style={{ flex: 1 }}>
+       <View style={{ padding: 20, paddingTop: 60 }}>
+         <Skeleton width={80} height={11} />
+         <Skeleton width="100%" height={140} radius={24} style={{ marginTop: 24 }} />
+         <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
+           <Skeleton width="100%" height={88} radius={16} style={{ flex: 1 }} />
+           <Skeleton width="100%" height={88} radius={16} style={{ flex: 1 }} />
+         </View>
+       </View>
+     </GradientBackground>
+   );
+ }
```

### 6.4 테스트

- **수동:** 네트워크 throttle (Network Link Conditioner · 3G) home 진입 →
  150ms 미만에서는 skeleton 안 뜨고, 이상에서는 뜸. iOS reduce-motion ON시
  shimmer 멈춤.

---

## 7. P0-5 · Audio button playing pulse + ring

**책임 agent:** frontend + designer
**파일:** `apps/mobile/app/lesson/[wordId].tsx` (현재 inline LinearGradient), 신규 `apps/mobile/src/components/d022/AudioButton.tsx`
**예상 시간:** 2h
**선행:** P0-0

### 7.1 목적

오디오 재생 중 사용자가 "지금 듣고 있다"는 시그널을 받아야 한다. 현재는
재생 중에도 정지 상태와 외형이 동일.

### 7.2 Acceptance Criteria

1. `state === "playing"` 일 때 box-shadow가 1400ms cosine 펄스
   (기본 glow.pink ↔ 1.4× glow.pink).
2. 동시에 외곽 2px neon-pink ring이 scale 1 → 1.5 + opacity 0.8 → 0으로
   반복 (ripple-like expansion).
3. `state === "loading"` 일 때 0.9s linear rotation의 conic gradient
   spinner (현재 ActivityIndicator 대체).
4. reduce-motion 시 모든 무한 anim 비활성 → 정적 강조(border-color
   neon-pink 2px).

### 7.3 샘플 구현

```tsx
// apps/mobile/src/components/d022/AudioButton.tsx
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { duration, lightColors, rnEasing } from "@dash2zero/design-tokens";

type AudioState = "idle" | "loading" | "playing" | "error";

export function AudioButton({
  state, onPress, accessibilityLabel,
}: { state: AudioState; onPress: () => void; accessibilityLabel: string }) {
  const [reduce, setReduce] = useState(false);
  const ringScale   = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const shadowPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let m = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => m && setReduce(v));
    return () => { m = false; };
  }, []);

  useEffect(() => {
    if (state !== "playing" || reduce) {
      ringScale.setValue(1); ringOpacity.setValue(0); shadowPulse.setValue(0);
      return;
    }
    const ring = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(ringScale,   { toValue: 1.5, duration: 1400, easing: rnEasing.out, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0,   duration: 1400, easing: rnEasing.out, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ringScale,   { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
      ]),
    ]));
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(shadowPulse, { toValue: 1, duration: 700, easing: rnEasing.inOut, useNativeDriver: false }),
      Animated.timing(shadowPulse, { toValue: 0, duration: 700, easing: rnEasing.inOut, useNativeDriver: false }),
    ]));
    ring.start(); pulse.start();
    return () => { ring.stop(); pulse.stop(); };
  }, [state, reduce, ringScale, ringOpacity, shadowPulse]);

  const shadowRadius = shadowPulse.interpolate({ inputRange: [0, 1], outputRange: [24, 34] });

  return (
    <Animated.View
      style={{
        shadowColor: lightColors["neon.pink"],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius,
        elevation: 12,
        borderRadius: 28,
        // reduce-motion일 때 정적 강조
        borderWidth: reduce && state === "playing" ? 2 : 0,
        borderColor: lightColors["neon.pink"],
      }}
    >
      {state === "playing" && !reduce && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute", left: -2, top: -2, right: -2, bottom: -2,
            borderRadius: 30, borderWidth: 2,
            borderColor: lightColors["neon.pink"],
            transform: [{ scale: ringScale }], opacity: ringOpacity,
          }}
        />
      )}
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        disabled={state === "loading"}
      >
        <LinearGradient
          colors={["#06B6D4", "#EC4899"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" }}
        >
          {state === "loading" ? <LoadingSpinner /> :
           state === "error"   ? <Text style={{ color: "#fff", fontSize: 18 }}>!</Text> :
           state === "playing" ? <Text style={{ color: "#fff", fontSize: 18 }}>❚❚</Text> :
                                  <Text style={{ color: "#fff", fontSize: 22 }}>▶</Text>}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// 간단한 spinner (LoadingSpinner를 별도 파일로 빼는 것 권장)
function LoadingSpinner() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(rot, { toValue: 1, duration: 900, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [rot]);
  return (
    <Animated.View style={{
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2.5, borderColor: "#fff", borderTopColor: "transparent",
      transform: [{ rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }],
    }} />
  );
}
```

### 7.4 테스트

- **수동:** Lesson Notice 단계에서 audio 탭 → spinner → playing 진입 시
  ring 확장 시작. 정지하면 즉시 종료. reduce-motion ON 시 정적 border.

---

## 8. Definition of Done

본 sprint의 모든 P0 PR은 다음을 만족해야 merge:

- [ ] `pnpm typecheck` 통과 (frontend)
- [ ] `pnpm test` 통과 (P0-0 토큰 spec 포함)
- [ ] `pnpm eval:srs` 통과 — lesson 흐름이 깨지지 않았는지 SRS evaluator로
      smoke
- [ ] 수동 시뮬레이터 검수:
    - [ ] iOS 17.0 (가장 낮은 지원) + iOS 26 (latest)
    - [ ] iPhone SE 1st gen (320pt) 한글 단어 carry over 없음
    - [ ] reduce-motion ON 상태에서 모든 모션이 fallback 경로로 동작
- [ ] designer agent visual sign-off
- [ ] qa agent 1차 적대 케이스 (double-tap, fast-cycle, background timeout)
      통과
- [ ] AGENTS.md §5 컨텍스트 기록 — D-NNN 결정 또는 sprint risk 등록 여부
      확인 (motion.fast 명칭 변경은 ADR 등록 불필요, 단순 token rename)

---

## 9. Agent 분배 권고

| Task | Primary | Reviewer | 예상 인-day |
|---|---|---|---|
| P0-0 토큰 | designer | frontend | 0.1 |
| P0-1 stage 전환 시그니처 | frontend | designer | 0.6 |
| P0-2 quiz 리액션 | frontend | designer | 0.4 |
| P0-3 NeonButton ripple | frontend | designer | 0.4 |
| P0-4 Skeleton | frontend | designer | 0.3 |
| P0-5 Audio button | frontend | designer | 0.3 |
| 통합 QA | qa | — | 0.5 |
| **합계** | | | **2.6 인-day** |

병렬화 가능: P0-2, P0-3, P0-4, P0-5는 P0-0 merge 후 4개 별도 worktree
병렬 진행. P0-1만 순차 (가장 큰 변경 + lesson 화면 conflict 위험).

---

## 10. P1 / P2 미리보기 (본 sprint 외)

- **P1 (M5 W19–20):** number counter (`StatCard.value`), badge pop +
  flame flicker, pull-to-refresh (`react-native-reanimated` 의존성 도입
  여부 결정 필요), modal sheet, toast 시스템 (현재 Alert.alert 대체).
- **P2 (post-GA):** icon morph (save/favorite burst), paywall gradient
  drift, app icon launch transition, sound design tokens, OS외 reduce-motion
  사용자 토글.

P1 의존성 결정 트리거: M5 W19 entry 1주 전(2026-06-02) PM이 `R-M5-01`
reconfirm 시점에 오너 사인오프 받기.

---

## 11. 본 작업의 컨텍스트 기록 의무

`AGENTS.md §5.4` 정책에 따라:

1. **D-NNN 결정:** motion token 확장은 "되돌리기 어렵지 않은" 결정이므로
   D-022 봉인의 자연 확장으로 간주. 별도 D-NNN 부여 불필요. 단
   CHANGELOG.md에 "motion token 확장: tap/fast/base/stage/spring/sheet/
   progress/count + spring/shake easing" 한 줄 추가.
2. **Sprint risk:** P0-1 (lesson stage 전환)이 user-perceived latency를
   변화시킬 가능성 — sprint risk 등록 권고. owner: frontend, mitigation:
   analytics가 lesson_completed.duration_sec p50/p95 모니터링.
3. **Skill 사용 기록:** designer + frontend가 본 dispatch 안의 모든 PR에서
   `theme-factory` 또는 `frontend-design` skill을 명시적으로 invoke했는지
   PR description에 기록.

---

## 12. 디스패치 프롬프트 (orchestrator가 그대로 사용)

```
[swarm dispatch] M4 W17 motion-system rollout

대상 agent: frontend (primary) + designer (review) + qa (sweep)
선행 검토: 본 문서 §0–§2 필독.
순차/병렬: P0-0 토큰 먼저 merge → 이후 P0-1만 단일 worktree, 나머지 4건은 병렬 worktree.

각 PR 제출 시 포함:
1. 영향 받은 화면 스크린샷 before/after (iPhone SE + iPhone 15 Pro)
2. reduce-motion ON 상태 스크린샷 1장
3. 본 문서 §8 DoD 체크박스 자가 확인

orchestrator는 본 sprint 종료 시 dash2zero Design System review 문서
§ 06 우선순위 로드맵 P0 5건의 status를 [x]로 업데이트하고 reviewer에게
Cycle B summary로 전달.

종료 게이트: 본 문서 §8 모든 체크 + qa 적대 케이스 0건 + designer sign-off.
실패 시 사용자(mju.jykim@gmail.com)에게 R-M4-NN sprint risk 명시.
```

---

> **문서 끝.** 질문 / 변경 요청은 본 design system 프로젝트 owner와 협의 후
> 본 파일을 직접 수정. 산출된 sample code는 보장된 동작이 아닌 reference
> 이므로 frontend agent의 typecheck + 시뮬레이터 검수가 always last word.
