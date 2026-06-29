# react-native-reanimated Worklet 사용 가이드

- **상태**: Draft (M5 W18 entry + ADR-0009 Accepted 봉인 시점에 활성)
- **작성일**: 2026-06-01 (M4 W17 D-6, orchestrator 사전 작성 — Q-ADR-0009-3 권고 W18 D-3 일정에서 사전 진입)
- **출처**: ADR-0009 회람 의견 11건 (architect 4 / designer 3 / frontend 4) 통합
- **대상**: frontend agent (P1 신규 컴포넌트 작성 시) + qa agent (적대 케이스 검수 시)
- **관련 SoT**:
  - `docs/adr/ADR-0009-reanimated-adoption.md` (도입 결정)
  - `packages/design-tokens/src/motion.ts` (`duration` / `rnEasing` 토큰)
  - `docs/brand/MOTION_SYSTEM_SPEC.md` v1.1 (4-rule Merge Gate)

---

## 0. 한 줄 요약

신규 P1 컴포넌트(PTR / Toast / 등)는 `react-native-reanimated`로 구현, 기존 D-022~D-029 봉인 컴포넌트 8건은 `Animated` legacy 영구 유지. 본 가이드는 frontend agent가 worklet 패턴을 안전하게 작성하기 위한 8개 규칙.

---

## 1. 핵심 패턴 (frontend §1 권고)

### 1.1 useSharedValue + useAnimatedStyle 강제

```typescript
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { duration, rnEasing } from "@dash2zero/design-tokens";

function MyComponent() {
  const translateY = useSharedValue(24);
  const opacity = useSharedValue(0);

  // worklet 내부에서 호출 가능한 animated style
  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  // 시작 시점
  useEffect(() => {
    translateY.value = withTiming(0, { duration: duration["motion.sheet"] });
    opacity.value = withTiming(1, { duration: duration["motion.sheet"] });
  }, []);

  return <Animated.View style={animatedStyle}>...</Animated.View>;
}
```

**금지**:
- `Animated.Value` (legacy) — Reanimated 컴포넌트에서 혼용 금지
- `useNativeDriver` — Reanimated는 항상 native (옵션 자체 없음)
- `useRef(new Animated.Value(...))` 패턴 — Reanimated에선 `useSharedValue`만

---

## 2. Worklet runtime 제약 (architect §1 권고)

### 2.1 closure 외부 변수 접근 금지

```typescript
// ❌ 금지 — closure 외부 mutable 변수
const externalCounter = { value: 0 };
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  externalCounter.value += 1; // worklet runtime에서 native crash
  return { opacity: 0.5 };
});

// ✅ 허용 — closure 외부 immutable 상수
const SPEED = 1.5; // const primitive
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  return { transform: [{ scale: SPEED }] }; // 안전
});

// ✅ 허용 — runOnJS로 JS thread 호출
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  if (translateY.value < -100) {
    runOnJS(triggerDismiss)(); // JS thread에서 실행
  }
  return { transform: [{ translateY: translateY.value }] };
});
```

### 2.2 console.log 금지

worklet runtime은 console 미지원. 디버깅 시:
```typescript
// ✅ runOnJS로 JS thread console.log
runOnJS(console.log)("debug:", translateY.value);
```

### 2.3 "worklet" directive 필수

```typescript
useAnimatedStyle(() => {
  "worklet"; // ← 필수 — 미명시 시 JS thread 실행 (성능 손실)
  return { opacity: opacity.value };
});
```

---

## 3. 메모리 누수 방지 (architect §4 권고)

### 3.1 cancelAnimation cleanup

```typescript
import { cancelAnimation, withRepeat, withTiming } from "react-native-reanimated";

function ShimmerLoop() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1600 }),
      -1, // 무한 반복
      false,
    );

    // 필수 — unmount 시 cancel
    return () => {
      cancelAnimation(progress);
    };
  }, []);

  // ...
}
```

**Rule 2 (Lifecycle) 정합**: 무한 loop는 반드시 `cancelAnimation(sharedValue)` cleanup.

### 3.2 useSharedValue 자동 cleanup

`useSharedValue`는 컴포넌트 unmount 시 자동으로 native 메모리 해제. 별도 cleanup 불필요. 단 `withRepeat({ -1 })` 같은 무한 animation은 명시 cancel.

---

## 4. babel.config.js plugin 위치 (architect §3 권고)

### 4.1 plugin 배열 마지막에 강제 위치

```javascript
// apps/mobile/babel.config.js
module.exports = {
  presets: ["babel-preset-expo"],
  plugins: [
    // 다른 plugin들...
    "expo-router/babel",
    // ⚠️ react-native-reanimated/plugin은 반드시 마지막
    "react-native-reanimated/plugin",
  ],
};
```

**금지**: `react-native-reanimated/plugin` 다음에 다른 plugin이 오면 worklet 변환이 깨짐.

### 4.2 cache 무효화 의무 (frontend §4 권고)

babel 설정 변경 후:
```bash
# 로컬
expo start --clear

# EAS Build
eas build --clear-cache --profile preview
```

---

## 5. 모션 토큰 사용 (designer §1 권고)

### 5.1 duration / rnEasing 공유

기존 Animated 컴포넌트와 동일 토큰 사용. 모션 일관성 보장:

```typescript
import { duration, rnEasing } from "@dash2zero/design-tokens";

withTiming(toValue, {
  duration: duration["motion.sheet"], // 360ms
  easing: rnEasing.decelerate, // cubic-bezier(0.22, 1, 0.36, 1)
});

withSpring(toValue, {
  damping: 10,
  stiffness: 100,
  // Reanimated spring은 cubic-bezier 미사용 — physics 기반.
  // EASE_BOUNCE (cubic-bezier 0.34, 1.56, 0.64, 1)를 spring으로 근사:
  //   damping ≈ 10, stiffness ≈ 100, mass ≈ 1
});
```

### 5.2 worklet 내부 색 토큰 사용 (designer §3 권고)

```typescript
import { lightColors } from "@dash2zero/design-tokens";

// ✅ 안전 — lightColors는 상수 객체, worklet runtime에서 읽기 OK
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  return {
    backgroundColor: progress.value > 0.5
      ? lightColors["neon.pink"]
      : lightColors["surface.card"],
  };
});

// ❌ 비효율 — spread는 worklet runtime 비용
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  return { ...lightColors }; // 객체 전체 복사 — 피할 것
});
```

---

## 6. 4-rule Merge Gate Rule 5 (Reanimated 전용)

기존 4-rule (GPU / Lifecycle / Timing / Skeleton) + 추가:

### Rule 5 — Worklet 내부 layout 속성 변경 금지

```typescript
// ❌ 금지 — width/height/top/left/margin은 layout reflow
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  return { width: progress.value * 200 }; // layout 속성
});

// ✅ 허용 — transform / opacity만
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  return {
    opacity: progress.value,
    transform: [{ scaleX: progress.value }],
  };
});
```

worklet은 native UI thread에서 실행되지만, layout 속성 변경은 별도 layout pass 트리거 → 60fps 위험.

---

## 7. Toast 시스템 권고 (designer §2 + frontend §3)

### 7.1 자체 작성 권고 (외부 라이브러리 회피)

`react-native-toast-message`는 Animated (legacy) 사용 → Rule 5 위반 가능성. 자체 작성:

```typescript
// apps/mobile/src/components/d022/Toast.tsx (사전 권고 패턴)
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

interface ToastProps {
  message: string;
  priority: "system" | "user-action" | "error"; // designer §2 우선순위 정책
  onDismiss: () => void;
}

export function Toast({ message, priority, onDismiss }: ToastProps) {
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // enter
    translateY.value = withTiming(0, { duration: duration["motion.sheet"], easing: rnEasing.decelerate });
    opacity.value = withTiming(1, { duration: duration["motion.sheet"] });

    // auto-dismiss
    const timer = setTimeout(() => {
      translateY.value = withTiming(-80, { duration: duration["motion.fast"], easing: rnEasing.exit });
      opacity.value = withTiming(0, { duration: duration["motion.fast"] }, () => {
        runOnJS(onDismiss)();
      });
    }, priority === "error" ? 5000 : 3000);

    return () => {
      clearTimeout(timer);
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
  }, []);

  // ...
}
```

### 7.2 다중 Toast queue 우선순위 (designer §2)

```
priority: "error"        → 즉시 표시, 5s 노출
priority: "user-action"  → queue 대기, 3s 노출
priority: "system"       → queue 대기, 3s 노출
```

같은 우선순위 다중 toast 시 stacking (z-index +1 per layer, max 3 stack).

---

## 8. PTR (Pull-To-Refresh) 권고 (frontend §2)

### 8.1 useAnimatedScrollHandler 직접 사용 (외부 라이브러리 회피)

```typescript
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

function ScreenWithPTR() {
  const scrollY = useSharedValue(0);
  const isRefreshing = useSharedValue(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      "worklet";
      scrollY.value = event.contentOffset.y;
    },
    onEndDrag: (event) => {
      "worklet";
      if (event.contentOffset.y < -80 && !isRefreshing.value) {
        isRefreshing.value = true;
        runOnJS(handleRefresh)();
      }
    },
  });

  return (
    <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
      {/* ... */}
    </Animated.ScrollView>
  );
}
```

---

## 9. 점검 체크리스트 (PR review용)

PR이 Reanimated 사용 시 frontend / qa가 다음 8건 확인:

- [ ] **C1**: `useSharedValue` + `useAnimatedStyle` 패턴 사용 (Animated.Value 혼용 없음)
- [ ] **C2**: worklet 내부 `"worklet"` directive 명시
- [ ] **C3**: closure 외부 mutable 변수 접근 없음 (runOnJS로 분리)
- [ ] **C4**: console.log 또는 console.warn worklet 내부 미사용
- [ ] **C5**: `withRepeat({ -1 })` 사용 시 useEffect return에서 `cancelAnimation` 명시
- [ ] **C6**: `duration["motion.*"]` + `rnEasing.*` 토큰 사용 (raw numeric 금지)
- [ ] **C7**: Rule 5 — worklet 출력 style이 transform + opacity only (layout 속성 없음)
- [ ] **C8**: babel.config.js의 `react-native-reanimated/plugin`이 plugins 배열 마지막에 위치

---

## 10. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-06-01 | Draft 작성 (orchestrator) — ADR-0009 회람 의견 11건 통합 + 패턴 8건 + Toast/PTR 권고 + PR 체크리스트 8건. M5 W18 entry 시 활성 |
