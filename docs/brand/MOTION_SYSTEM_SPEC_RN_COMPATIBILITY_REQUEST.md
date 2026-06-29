# Motion System Spec v1.0 — React Native 호환 재요청 패키지

- **수신**: Lead Designer (외부)
- **발신**: dash2zero Swarm Coding Orchestrator
- **작성일**: 2026-05-21 (W16 D-3)
- **참조 문서**: `docs/brand/MOTION_SYSTEM_SPEC.md` v1.0 (2026-05-21 SSOT)
- **목적**: v1.0의 디자이너 의도를 100% 보존하면서, 실제 앱 stack(React Native + Expo)에 적용 가능한 v1.1로 재요청
- **긴급도**: W16 sprint(5/18~5/25) 내 motion 적용을 목표 — 회신 가능 시점 알려주세요

---

## 1. 먼저 — 감사 인사와 채택 사항

v1.0의 다음 결정은 **그대로 채택 가능**합니다 (재작성 불필요):

| 항목 | v1.0 정의 | 채택 |
|---|---|---|
| Quick Bounce | `cubic-bezier(0.34, 1.56, 0.64, 1)` 180ms | ✅ — RN `Easing.bezier(0.34, 1.56, 0.64, 1)` 동일 |
| Deceleration | `cubic-bezier(0.22, 1, 0.36, 1)` 300ms | ✅ — 동일 |
| Swift Exit | `cubic-bezier(0.32, 0, 0.67, 0)` 180ms | ✅ — 동일 |
| 60fps GPU 가속 원칙 | transform / opacity만 | ✅ — RN native driver 정합 |
| layout-reflow 금지 | width/height/top/left/margin 미사용 | ✅ — RN에서도 동일 원칙 (특히 native driver는 transform/opacity만 지원) |
| §3 Category A/B/C 의도 (shake ±6px, scale 0.96, pulse 등) | 수치 명시 | ✅ — 수치는 RN에서도 그대로 적용 가능 |

→ **timing/easing 수치 + 의도(category A/B/C)는 confirm. 변경 없이 그대로 가져갑니다.**

---

## 2. stack 불일치 (재작성이 필요한 사유)

dash2zero는 **iOS/Android 네이티브 앱** — React Native + Expo SDK 51 + TypeScript. 13개 화면은 이미 `apps/mobile/app/*.tsx`에 `<View>`/`<Pressable>`/`<Text>` (RN 컴포넌트)로 구현되어 있고, **웹 DOM도 CSS 시스템도 사용하지 않습니다**.

v1.0이 가정한 환경은 웹(HTML/CSS/React DOM)입니다. 다음 6건은 RN에서 직접 작동하지 않아 재정의가 필요합니다:

| # | v1.0 표기 | 웹에서의 의미 | RN 호환성 | 재요청 필요? |
|---|---|---|---|---|
| 1 | `var(--ease-bounce)` | CSS custom property | ❌ RN에 CSS 변수 없음 | 형식만 — 수치는 채택 |
| 2 | `.btn-interactive` 클래스 | CSS class binding | ❌ RN에 className 없음 | 동등 컴포넌트 명세 |
| 3 | `.shake-error` / `.pulse-success` / `.shimmer-effect` / `.jelly-toggle-active` / `.progress-fill-interactive` | CSS keyframe class | ❌ RN: Animated/Reanimated hook | 동등 hook/컴포넌트 명세 |
| 4 | `onAnimationEnd` 이벤트 + `setState('idle')` 패턴 | DOM event | ❌ RN: Animated `.start(callback)` 또는 Reanimated worklet | 동등 콜백 패턴 |
| 5 | §4 example의 `<div onClick className="...">` | React DOM | ❌ RN: `<Pressable onPress style={...}>` | example 재작성 |
| 6 | `box-shadow` 동적 변경 (§3 Button Press) | CSS transition | ⚠️ RN: `shadowOpacity`(iOS) + `elevation`(Android) 분리, native driver 미지원 | 그림자 변경은 platform 분기 필요 |

---

## 3. 디자이너께 부탁드리는 결정 사항 (v1.1 작성 시 채워주세요)

저희가 RN으로 옮기면서 v1.0이 직접 답하지 않은 항목입니다. **수치/방향만 결정**해주시면 됩니다 — 실제 코드는 frontend agent가 작성합니다.

### Q-MOTION-1. 그림자 변경 동작 (§3 Button Press "reduces box shadow")
RN에서 그림자는 native driver로 애니메이션 불가. 3가지 옵션:
- (a) **scale만** 변경 (`scale 1.0 → 0.96`), 그림자 변경 생략 → 60fps 보장, 단 디자이너 의도 일부 손실 가능
- (b) scale + opacity로 그림자 느낌 모사 (`<Shadow>` 컴포넌트의 opacity를 0.6배 → 60fps OK, 디자이너 의도 근사)
- (c) scale + 실제 shadowOpacity 변경 (JS driver, 60fps 위험) → 디자이너 의도 100% 재현 but 성능 trade-off

**디자이너 결정**: (a) / (b) / (c) 중 어느 것?

### Q-MOTION-2. Skeleton shimmer 구현 (§3 Category C)
"좌→우로 1.6s 무한 metallic wave" — RN에서 두 가지 방법:
- (a) `expo-linear-gradient` + `Animated.View translateX(-100% → 100%)` — native driver, 60fps 보장
- (b) `react-native-skia` Shader — 가장 정교한 metallic 효과, but 추가 의존성 + 번들 크기 증가

**디자이너 결정**: (a) 표준 그라데이션 / (b) Skia Shader 중 어느 것?

### Q-MOTION-3. Page Transition (§3 Category B)
"Incoming page slides in from translateX(100%), exiting page moves to translateX(-15%) + opacity 0.8" — 이건 Expo Router의 default stack transition을 override해야 합니다. 두 가지 옵션:
- (a) Expo Router의 `animation: "slide_from_right"` 사용 (기본 제공, ≈100% 재현)
- (b) Custom transition (`react-native-reanimated` shared element) → §3 명세 정확 재현, but 모든 screen에 wrapper 필요

**디자이너 결정**: (a) 기본 stack transition (수치 약간 다를 수 있음) / (b) custom (정확)?

### Q-MOTION-4. Haptic feedback (실제 햅틱 진동)
"haptic feel"이 v1.0 전반에 강조되어 있는데 — 시각 애니메이션만인지, 아니면 **물리적 햅틱 진동**(iOS Haptic Engine / Android Vibrator)도 포함인지 명시 부탁드립니다.
- (a) 시각만 (현재 v1.0 해석)
- (b) 시각 + 햅틱 진동 (Expo `expo-haptics` 사용 — 정답 시 `Haptics.notificationAsync(Success)`, 오답 시 `Warning`)

**디자이너 결정**: (a) / (b)?

### Q-MOTION-5. iOS Reduce Motion 접근성 대응
iOS는 사용자가 "Reduce Motion" 설정 ON 시 spring/bounce 애니메이션을 단축하길 권장합니다 (Apple HIG). 우리는 이미 `AccessibilityInfo.isReduceMotionEnabled` detection을 NeonButton에 적용했습니다. 6 utility class 전체에 동일 적용 시:
- (a) **fade로 대체** (모든 motion → 150ms opacity fade)
- (b) **duration만 단축** (180ms → 80ms, easing은 linear)
- (c) **완전 비활성** (state 변화만, animation 없음)

**디자이너 결정**: (a) / (b) / (c)?

---

## 4. v1.1에서 추가로 부탁드리는 형식

v1.0의 형식은 그대로 유지하시되, 각 utility class 항목에 다음을 추가 부탁드립니다 (RN 매핑 가이드):

```
.btn-interactive (현재 v1.0 정의)
└─ RN 매핑: <Pressable> + Animated.View scale 1→0.96, native driver, 180ms
            → 디자이너 의도 보존 ✅
```

→ 이렇게 RN 매핑 1줄만 추가해주시면 v1.1은 web/RN 양쪽에서 동일 의도 보장.

또는, **디자이너가 RN을 모르시면** 위 Q-MOTION-1~5만 답해주세요. RN 매핑은 저희가 작성하고 v1.2로 봉인하기 전에 디자이너 sign-off만 받겠습니다.

---

## 5. 일정 영향 (W16 sprint)

| 항목 | 영향 | 비고 |
|---|---|---|
| W16 D-3~D-5 (5/21~5/23) | motion 적용 작업 시작 보류 | v1.1 회신 대기 |
| W16 D-4 (5/22) | ADR-0007 봉인은 영향 없음 | motion과 독립 |
| W16 D-7 (5/25) M3 gate | motion 미적용 시 영향? | M3 게이트 #4(baseline)와 별개, 게이트 통과는 가능. 단 motion이 D-022 stunning UX 완성도에 기여하므로 사용자 체감 측면 손실. |
| 핵심 학습 가치 (P0) | **영향 없음** | Task #82(quiz shuffle)/#83(guest home summary) 이미 완료 |

**권고**: 디자이너 회신 ~2일 내 가능하면 W16 sprint 내 적용 가능. 3일 이상 지연 시 motion 적용은 M4 W17(5/26~)로 이월 권고.

---

## 6. 응답 양식 (간단)

다음 5줄만 회신 부탁드립니다:

```
Q-MOTION-1: [a / b / c]
Q-MOTION-2: [a / b]
Q-MOTION-3: [a / b]
Q-MOTION-4: [a / b]
Q-MOTION-5: [a / b / c]
+ v1.1 spec 재작성: [O 직접 재작성 / X — orchestrator가 작성 후 sign-off만]
```

회신 받는 즉시 frontend/qa/security 3 agent에게 위임하고, 4-rule Merge Gate 감사 후 봉인하겠습니다.

감사합니다.
— dash2zero Swarm Coding Orchestrator
