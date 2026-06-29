# Motion System v1.1 — QA E2E Test Cases (MTC)

- **작성일**: 2026-05-21 (W16 D-3)
- **작성**: orchestrator (qa-engineer-senior agent stream timeout으로 직접 작성)
- **SSOT**: `docs/brand/MOTION_SYSTEM_SPEC.md` v1.1 (외부 designer 봉인 2026-05-21)
- **관련**: D-023 (DECISION_LOG), `packages/design-tokens/src/motion.ts` (MOTION_TOKENS)
- **적용 시점**: M3 W16 pilot (ChoiceCard) + M4 13 화면 확장 시 재사용

---

## 1. 인덱스 (15 case)

| ID | 분류 | 검증 대상 | 우선순위 | 자동화 |
|---|---|---|---|---|
| MTC-A.1 | 정답 피드백 | Pulse + Haptic Success | P0 | 수동 + Detox 부분 |
| MTC-A.2 | 정답 피드백 | 시각 status 유지 + advance 800ms | P0 | Detox |
| MTC-A.3 | 정답 피드백 | 연속 정답 5회 메모리 누수 | P1 | 수동 + Xcode Instruments |
| MTC-B.1 | 오답 피드백 | Shake ±6px 5-segment | P0 | 수동 (시각) + Detox (haptic) |
| MTC-B.2 | 오답 피드백 | Haptic Warning + 시각 분리 | P0 | Detox |
| MTC-B.3 | 오답 피드백 | 연속 오답 3회 lifecycle 복귀 | P0 | Detox |
| MTC-C.1 | 버튼 햅틱 | Press scale 1→0.96 + EASE_BOUNCE | P0 | 수동 |
| MTC-C.2 | 버튼 햅틱 | PressOut scale 0.96→1 | P0 | 수동 |
| MTC-C.3 | 버튼 햅틱 | Haptic Light 호출 + 그림자 0.6배 | P1 | Detox |
| MTC-D.1 | Reduce Motion | iOS Settings ON 시 spring 차단 | P0 | 수동 (iOS) |
| MTC-D.2 | Reduce Motion | 150ms opacity fade fallback | P0 | 수동 |
| MTC-D.3 | Reduce Motion | Haptic은 reduce motion과 별개 trigger | P1 | 수동 |
| MTC-E.1 | 성능 | 60fps 유지 (frame drop 0) | P0 | Xcode/Android Profiler |
| MTC-E.2 | 성능 | useNativeDriver:true 확인 (JS thread 미블록) | P0 | Profiler |
| MTC-E.3 | 성능 | Shimmer 1분 loop 메모리 안정 | P1 | Profiler 1분 측정 |

---

## 2. 분류별 케이스

### MTC-A. 정답 피드백 (Category A — Pulse Ripple + Haptic Success)

#### MTC-A.1 정답 선택 시 Haptic Success 1회 trigger

**Preconditions**:
- 게스트 또는 인증 사용자, lesson chain 진입 (`/lesson/:wordId`)
- Reduce Motion = false
- Network: online
- iOS: Taptic Engine 지원 디바이스 (iPhone 7+) / Android: Vibrator 지원

**Steps**:
1. Notice → Hear → Meaning → Retrieve 4단계 진행
2. Retrieve 단계에서 **정답 옵션 1회 탭** (선택 → pink glow 확인)
3. "Check" 버튼 탭 (submitted=true)

**Expected**:
- ChoiceCard status: `idle` → `success` (semantic.success border + green tint)
- `✓` 마크 inline 표시
- `Haptics.notificationAsync(NotificationFeedbackType.Success)` 1회 호출
- 800ms 후 advance() 또는 lesson/complete navigate

**Pass Criteria (정량)**:
- haptic 호출 count = exactly 1 (중복 금지)
- success state 진입 ≤ 100ms (submitted state 전파)
- frame drop = 0 (60fps 유지)

**Fail Criteria**:
- haptic 0회 또는 2회+
- width/height/top/left transition 발견 → Rule 1 위반

**검사 포인트**:
- `apps/mobile/src/components/d022/ChoiceCard.tsx` L91-95 (handlePress correct branch)

#### MTC-A.2 정답 선택 후 시각 status 유지 + advance 800ms

**Preconditions**: MTC-A.1과 동일

**Steps**:
1. 정답 선택 + submit
2. 800ms 동안 ChoiceCard 시각 관찰
3. 800ms 후 다음 카드 진입 확인 (또는 lesson/complete)

**Expected**:
- 800ms 동안 success 시각(녹색 border + ✓) **유지** (잠깐 깜빡임 없음)
- advance 후 새 카드 mount, ChoiceCard status `idle` 초기화 (다음 4 옵션이 idle로 렌더링)

**Pass Criteria**:
- 시각 유지 시간 800ms ± 50ms
- 새 카드의 status 모두 idle

**Fail Criteria**:
- 시각이 800ms 전에 사라짐 (status 조기 리셋 버그)
- 새 카드의 ChoiceCard에 success/error stale 잔존

#### MTC-A.3 연속 정답 5회 메모리 누수 없음

**Preconditions**:
- 인증 사용자, 5 단어 chain (free 한도 도달 회피)
- Xcode Instruments (iOS) 또는 Android Studio Profiler (Android)

**Steps**:
1. lesson 진입 + Instruments memory tracking 시작
2. 5 단어 모두 정답으로 통과 (각각 4단계)
3. lesson/complete 도달 시 memory snapshot
4. Home 복귀 → 재진입 → 다시 5단어 정답
5. 두 번째 lesson/complete 시 memory snapshot 비교

**Expected**:
- Animated.Value cleanup 정상 (unmount 시 release)
- AccessibilityInfo 리스너 cleanup 정상 (`sub.remove()` 호출)

**Pass Criteria**:
- 2회 lesson 사이 native heap 증가 < 1MB
- JS heap 증가 < 500KB
- Reanimated worker 활성 카운트 0 (idle)

**Fail Criteria**:
- 누적 메모리 증가 > 5MB / 5회 반복
- ChoiceCard mount/unmount log에 leak warning

---

### MTC-B. 오답 피드백 (Category A — Shake Deflection + Haptic Warning)

#### MTC-B.1 오답 선택 시 ±6px Shake 5-segment 실행

**Preconditions**:
- Reduce Motion = false (Q-MOTION-5 fallback 미적용 경로)

**Steps**:
1. Retrieve 단계에서 오답 옵션 선택 + Check
2. ChoiceCard의 transform 시각 관찰 (Slow Motion 녹화 권고)

**Expected**:
- Animated.sequence 5 segments × 60ms = 300ms 총 duration
- shakeAnim 시퀀스: -6 → +6 → -4 → +4 → 0
- transform: [{ scale: 1 }, { translateX: shakeAnim }]
- shakeAnim 종료값 = 0 (residual offset 없음)

**Pass Criteria**:
- 총 duration 300ms ± 30ms (MOTION_TOKENS.SHAKE_TOTAL_DURATION 정합)
- frame drop = 0
- 종료 후 translateX = 0

**Fail Criteria**:
- transform 외 layout property (margin/padding) 변경 → Rule 1 위반
- shake 종료 후 translateX ≠ 0 (잔존 offset)

**검사 포인트**: ChoiceCard.tsx L115-154

#### MTC-B.2 Haptic Warning 호출 + 시각 분리

**Preconditions**: MTC-B.1과 동일

**Steps**:
1. 오답 선택 + Check
2. iOS: Taptic Engine 진동 패턴 확인 / Android: Vibrator 패턴 확인

**Expected**:
- `Haptics.notificationAsync(NotificationFeedbackType.Warning)` 1회 호출
- iOS Warning 패턴: 짧은 진동 2회 (Apple HIG 정의)
- Android Warning 패턴: 짧은 진동 2회 (default)
- 시각 status는 'error' (semantic.danger border + red tint)

**Pass Criteria**:
- haptic 호출 count = 1
- 시각 status 'error' 도달 ≤ 100ms

**Fail Criteria**:
- haptic Warning이 아닌 다른 타입 (Success / Light) trigger
- 시각 status가 'success' 또는 'idle' (분기 오류)

#### MTC-B.3 연속 오답 3회 lifecycle 복귀 (Rule 2)

**Preconditions**:
- Reduce Motion = false
- 동일 카드에서 3회 연속 오답 시나리오 (실 lesson에서는 1회 submit 후 advance지만, 본 케이스는 ChoiceCard 단위 테스트 — Storybook 또는 mock parent component)

**Steps**:
1. ChoiceCard에 wrong option props 전달 (submitted=true, selected=true, isCorrect=false)
2. shake 종료까지 대기 (≈300ms)
3. submitted=false → true 재호출 (parent state reset)
4. 3회 반복

**Expected**:
- 매번 shake 정상 trigger
- shake 종료 후 shakeAnim = 0
- status 리셋이 외부 props 변화로 자연 처리됨 (Rule 2: dynamic lifecycle equivalent)

**Pass Criteria**:
- 3회 반복 모두 동일 shake 패턴 정확 재현
- Animated.sequence 누적 backlog 없음 (이전 sequence가 새 trigger 차단 금지)

**Fail Criteria**:
- 2번째 이후 shake가 작아지거나 빠르거나 끊김
- shakeAnim residual offset 누적

---

### MTC-C. 버튼 햅틱 (Q-MOTION-1 + Q-MOTION-4)

#### MTC-C.1 PressIn scale 1.0 → 0.96 (EASE_BOUNCE 180ms)

**Preconditions**: Reduce Motion = false, submitted = false

**Steps**:
1. ChoiceCard 길게 누름 (300ms)
2. transform.scale 시각 관찰

**Expected**:
- onPressIn → scaleAnim 1.0 → 0.96
- duration: 180ms (DURATION_QUICK)
- easing: EASE_BOUNCE (cubic-bezier(0.34, 1.56, 0.64, 1))

**Pass Criteria**:
- scale 도달값 = 0.96 (PRESSED_SCALE 정합)
- duration 180ms ± 20ms

**Fail Criteria**: easing이 linear / 다른 bezier

#### MTC-C.2 PressOut scale 0.96 → 1.0

**Steps**: PressIn 후 손가락 release

**Expected**: scaleAnim 0.96 → 1.0, 180ms, EASE_BOUNCE

**Pass/Fail**: MTC-C.1과 대칭

#### MTC-C.3 Haptic Light + 그림자 opacity 0.6배

**Steps**:
1. ChoiceCard 짧게 탭 (Press → Release)
2. iOS Taptic / Android Vibrator 확인
3. pressed=true 시 shadow opacity 측정 (개발자 모드 inspector 또는 시각 비교)

**Expected**:
- `Haptics.impactAsync(ImpactFeedbackStyle.Light)` 1회 호출 (onPress 시점)
- pressed shadow opacity = 0.06 (0.1 × 0.6 = PRESSED_SHADOW_OPACITY_RATIO)

**Pass Criteria**: shadow 변경이 즉시 (transition 없음, Pressable pressed boolean 분기)

---

### MTC-D. iOS Reduce Motion 접근성 (Q-MOTION-5)

#### MTC-D.1 iOS Settings Reduce Motion ON 시 spring 차단

**Preconditions**:
- iOS 디바이스 또는 시뮬레이터
- 앱 launch 시점에 Settings → Accessibility → Motion → Reduce Motion ON

**Steps**:
1. 앱 launch → home → lesson 진입
2. Retrieve에서 오답 선택 → Check
3. ChoiceCard 시각 관찰

**Expected**:
- `AccessibilityInfo.isReduceMotionEnabled()` = true (mount 시 detected)
- shake 시퀀스 차단, opacity fade fallback 진입

**Pass Criteria**:
- shake 0회 trigger (shakeAnim 변화 없음)
- opacity 0.3 → 1.0 fade 150ms × 2 진행

**Fail Criteria**: Reduce Motion ON에도 spring shake 실행

#### MTC-D.2 150ms opacity fade fallback

**Preconditions**: MTC-D.1과 동일 (Reduce Motion ON)

**Steps**: 오답 선택

**Expected**:
- Animated.sequence: opacity 1→0.3 (150ms) → 0.3→1.0 (150ms)
- 총 duration 300ms
- transform 변화 없음 (scale 1.0 유지, translateX 0 유지)

**Pass Criteria**:
- opacity 최저점 = 0.3
- 총 fade duration = 300ms ± 30ms
- frame drop = 0

#### MTC-D.3 Haptic은 Reduce Motion과 별개 trigger

**Preconditions**: Reduce Motion ON

**Steps**:
1. 오답 선택 → Haptics.Warning trigger 확인
2. 정답 선택 → Haptics.Success trigger 확인

**Expected**: haptic은 정상 호출됨 (Q-MOTION-5는 시각 모션만 감쇠, haptic은 보존)

**Pass Criteria**: haptic 호출 count = 1 (Warning 또는 Success)

**Fail Criteria**: Reduce Motion ON 시 haptic 미호출 (잘못된 분기)

---

### MTC-E. 성능 검증 (60fps/120fps)

#### MTC-E.1 60fps 유지 (frame drop 0)

**Preconditions**:
- iOS: Xcode Instruments Core Animation FPS / Android: Android Studio GPU Profiler
- 디바이스: iPhone 12 또는 Pixel 5 (mid-range 기준)

**Steps**:
1. lesson 진입 + Profiler 시작
2. 10개 ChoiceCard 시나리오 (5 정답 + 5 오답)
3. Profiler frame chart 분석

**Expected**: frame chart 16.67ms 라인 아래 유지 (60fps)

**Pass Criteria**:
- average FPS ≥ 58
- frame drop count = 0
- jank instance = 0

**Fail Criteria**: frame drop > 0 in shake or pulse sequence

#### MTC-E.2 useNativeDriver:true 확인 (JS thread 미블록)

**Steps**:
1. Profiler에 JS thread + Native thread 동시 보기
2. shake/scale 진행 중 JS thread 활동 측정

**Expected**:
- JS thread: ChoiceCard 애니메이션 중 idle (worker thread가 작업)
- Native thread (UIThread / Render): 16ms cycle 정상

**Pass Criteria**:
- JS thread 활동 < 5% during animation
- console.warn에 "useNativeDriver" 관련 warning 없음

**Fail Criteria**: JS thread spike > 20% during shake

#### MTC-E.3 Shimmer 1분 loop 메모리 안정 (후속 — pilot 외)

**Note**: Shimmer 컴포넌트는 후속 task. 본 MTC는 후속 PR 도착 시 활성화.

**Preconditions**: Shimmer 컴포넌트 mount, 1분 loop

**Steps**:
1. Shimmer mount + memory snapshot
2. 1분 대기 (loop 약 37회)
3. memory snapshot 비교

**Pass Criteria**: heap 증가 < 200KB / 1분

---

## 3. Coverage Matrix

| Spec v1.1 항목 | 적용 결정 | 커버 MTC |
|---|---|---|
| §1 EASE_BOUNCE (180ms button) | Q-MOTION-1 채택 | MTC-C.1, C.2 |
| §1 EASE_DECELERATE (300ms) | Modal/shake easing | MTC-B.1 |
| §1 EASE_EXIT (180ms) | Modal exit (후속) | (pilot 외) |
| §1 DURATION_QUICK 180 | Button + reduce motion fade base | MTC-C.1, D.2 |
| §1 DURATION_NORMAL 300 | Shake total | MTC-B.1 |
| §2 Q-MOTION-1 Shadow Press [b] | scale 0.96 + shadow 0.6배 | MTC-C.1, C.3 |
| §2 Q-MOTION-2 Shimmer [a] | expo-linear-gradient | MTC-E.3 (후속) |
| §2 Q-MOTION-3 Page Transition [a] | Expo Router slide_from_right | (pilot 외 — root layout 1회 설정으로 검증) |
| §2 Q-MOTION-4 Haptics [b] | Success/Warning/Light | MTC-A.1, B.2, C.3, D.3 |
| §2 Q-MOTION-5 Reduce Motion [a] | 150ms opacity fade | MTC-D.1, D.2, D.3 |
| §3 Category A Button Press | scale + shadow | MTC-C.1, C.2, C.3 |
| §3 Category A Shake Deflection | ±6px 5-seg | MTC-B.1, B.3 |
| §3 Category A Pulse Ripple | (후속 — pilot 외) | (pilot 외) |
| §3 Category B Modal Sheet | (후속) | (pilot 외) |
| §3 Category B Skeletal Shimmering | (후속) | MTC-E.3 |
| Rule 1 GPU (transform/opacity only) | 강제 | MTC-A.1, B.1 Fail Criteria |
| Rule 2 Dynamic Lifecycle | 강제 | MTC-B.3 |
| Rule 3 Visual Timing Uniformity | MOTION_TOKENS only | MTC-B.1, C.1 |
| Rule 4 Skeletal Transition | (후속) | MTC-E.3 |

---

## 4. 자동화 권고

| 도구 | 적용 범위 | 사유 |
|---|---|---|
| **수동 (Owner)** | 시각 검증 (shake/pulse 패턴), iOS Settings 토글 | RN motion은 시각 정합이 핵심 — 자동화 어려움 |
| **Detox** | onPress 호출, Haptic mock 검증, props 변화 | RN E2E 표준, Haptics는 mock으로 호출 횟수 검증 가능 |
| **Maestro** | 후속 검토 — RN motion 시나리오 cross-platform | YAML 기반 간단, 단 motion 정량 측정 한계 |
| **Xcode Instruments** | iOS 60fps, 메모리 누수 | Core Animation FPS, Allocations |
| **Android GPU Profiler** | Android 60fps, jank | Studio Profiler GPU rendering |
| **Storybook (mobile)** | ChoiceCard 단위 시각 검증 (MTC-B.3 등) | M4 도입 권고 — pilot 단계는 lesson screen에서 직접 검증 |

---

## 5. 빈틈 / 후속 권고

- **Pulse Ripple**: ✅ 구현 완료 (W16 D-4) — MTC-A.4 활성화 (§6 참조)
- **Modal Sheet / Page Transition**: Page Transition은 완료 (`_layout` slide_from_right). Modal Sheet은 후속 PR 도착 시 MTC-G 신규 작성
- **Skeleton Shimmer**: ✅ 구현 완료 + home/lesson 적용 (MTC-E.3 활성)
- **Settings toggle jelly animation**: ✅ JellySwitch 컴포넌트 구현 + Settings Haptic toggle에 적용 (W16 D-4)
- **Haptic Feedback toggle**: ✅ 구현 완료 (W16 D-4) — MTC-F 분류 추가 (§7 참조)

---

## 6. MTC-A.4 — Pulse Ripple 60fps (W16 D-4 추가)

### MTC-A.4 정답 시 PulseOverlay radial ripple

**Preconditions**:
- 게스트 또는 인증 사용자, lesson chain 진입
- Reduce Motion = false (true 시 별도 케이스 MTC-D.4)
- iOS/Android — Xcode Instruments Core Animation FPS 또는 Android Studio GPU Profiler 활성

**Steps**:
1. lesson Retrieve 단계에서 정답 옵션 탭
2. ChoiceCard 시각 관찰 (slow-motion 녹화 권장)
3. Profiler frame chart 동시 측정

**Expected**:
- ChoiceCard 내부에 radial circle 등장 (semantic.success 녹색)
- scale 0 → 2.2 + opacity 0.4 → 0
- duration: 450ms (MOTION_TOKENS.PULSE_DURATION 정합)
- easing: EASE_DECELERATE (자연스러운 expansion)
- 종료 후 PulseOverlay unmount (DOM 미잔존, `pulseActive=false` 상태)
- card의 `overflow: hidden`으로 ripple이 card 경계를 넘지 않음

**Pass Criteria (정량)**:
- pulse duration 450ms ± 30ms
- frame drop = 0 (60fps 유지)
- haptic Success 1회 + pulse 1회 (중복 금지)
- 종료 후 `pulseActive` state = false (re-mount 검증으로 lifecycle 확인)
- transform/opacity 외 layout property 변경 0건

**Fail Criteria**:
- width/height/borderRadius animation 발견 → Rule 1 위반
- pulse 종료 후 잔존 Animated.Value 또는 onDone 콜백 미발화 → Rule 2 위반
- pulse가 card 경계 넘어 다른 옵션을 덮음 → overflow:hidden 누락

**검사 포인트**:
- `apps/mobile/src/components/d022/PulseOverlay.tsx` L45-60 (Animated.parallel + onDone)
- `apps/mobile/src/components/d022/ChoiceCard.tsx` L91-95 (success 시 pulseActive=true)

### MTC-D.4 Reduce Motion ON 시 Pulse Ripple 차단

**Preconditions**: iOS Settings → Accessibility → Motion → Reduce Motion ON

**Steps**: 정답 선택

**Expected**:
- ChoiceCard status 'success' (border + tint 색 변화 보존)
- PulseOverlay **미mount** (`pulseActive=false`)
- Haptic Success는 정상 trigger (Reduce Motion과 별개)

**Pass Criteria**: pulse animation 0회, haptic 1회

---

## 7. MTC-F — Haptic Feedback Toggle (W16 D-4 추가, Apple HIG 정합)

### MTC-F.1 Haptic Toggle OFF 시 모든 vibration 차단

**Preconditions**:
- iOS/Android — Vibrator 지원 디바이스
- Settings → "Sound & Haptics" → Haptic Feedback toggle = OFF

**Steps**:
1. Settings 진입 → Haptic Feedback toggle OFF (마지막 토글 시 Light 1회 fire — 명시적 confirmation UX)
2. SecureStore key `profile_haptic_enabled` = "false" 확인
3. app 재시작 (background → foreground 또는 cold start)
4. lesson 진입 → 정답 선택 / 오답 선택 / 일반 버튼 press
5. 디바이스 vibration 발화 여부 측정

**Expected**:
- 단계 4의 모든 interaction에서 vibration **0회 발화**
- 시각 motion (scale, shake, pulse)은 정상 작동 (haptic toggle은 vibration만 제어)
- `initHaptics()` cold start 시 SecureStore에서 false 읽어 in-memory enabled=false

**Pass Criteria (정량)**:
- haptic 호출 count = 0 (지정 N회 interaction 동안)
- 시각 motion 호출 count = 정상 (별도 측정)
- in-memory `isHapticEnabled()` = false

**Fail Criteria**:
- toggle OFF 후에도 vibration 1회+ → wrapper 우회 호출 의심 (`import * as Haptics from "expo-haptics"` 잔존)

**검사 포인트**:
- `apps/mobile/src/lib/haptics.ts` `hapticImpact` / `hapticNotification` (enabled 분기)
- Settings `handleHapticToggle` → `setHapticEnabledGlobal` → SecureStore 저장

### MTC-F.2 Haptic Toggle ON 즉시 정상 작동

**Preconditions**: MTC-F.1 종료 상태 (OFF)

**Steps**: Settings → Haptic toggle ON → lesson 진입 → interactions

**Expected**: vibration 정상 발화 (count = interaction 수)

**Pass Criteria**: enabled 상태 즉시 반영 (cold start 없이도 동작)

### MTC-F.3 JellySwitch 토글 모션 검증

**Preconditions**: Reduce Motion = false

**Steps**: Settings → Haptic toggle 1회 탭

**Expected**:
- thumb translateX 0 → 24 (또는 역) 180ms (DURATION_QUICK)
- jellyScale sequence: 1 → 1.15 → 0.95 → 1.05 → 1 (총 320ms, 4 × 80ms)
- track opacity 0 ↔ 1 transition (180ms)
- haptic Light 1회 (Q-MOTION-4)

**Pass Criteria**:
- 모든 segment 정확 (slow-motion 녹화로 검증)
- useNativeDriver:true 확인 (Profiler에서 JS thread idle)

**Fail Criteria**: jellyScale residual offset (종료 시 ≠ 1) → Rule 2 위반

---

## 8. MTC-G — Modal Sheet Motion (W16 D-4 추가, §3 Category B)

### MTC-G.1 BottomSheet enter — translateY + scale + opacity (300ms EASE_DECELERATE)

**Preconditions**:
- Reduce Motion = false
- BottomSheet 컴포넌트가 사용되는 화면 (M4+ 후속 PR에서 활성)

**Steps**:
1. parent에서 visible=false → true 전환 (예: Pressable onPress)
2. BottomSheet 등장 시각 관찰 + Profiler frame chart

**Expected**:
- Animated.parallel: translateY 24→0 + scale 0.96→1 + opacity 0→1 + backdrop 0→1
- 모두 EASE_DECELERATE, 300ms (MOTION_TOKENS.DURATION_NORMAL)
- Modal `animationType="none"` (우리 motion 사용, RN 기본 비활성)
- backdrop opacity 0 → 1 함께 진행

**Pass Criteria (정량)**:
- enter duration 300ms ± 30ms
- frame drop = 0 (60fps)
- transform/opacity 외 layout property 변경 0건
- backdrop opacity 종료 = 1.0 정확

**Fail Criteria**:
- height/bottom property animation → Rule 1 위반
- enter 중간에 backdrop opacity 비동기 → 시각 불일치

**검사 포인트**: `apps/mobile/src/components/d022/BottomSheet.tsx` L84-105

### MTC-G.2 BottomSheet exit — 180ms EASE_EXIT + unmount

**Steps**:
1. visible=true 상태에서 visible=false 변경 또는 backdrop tap dismiss
2. Modal 컴포넌트 unmount 시점 측정

**Expected**:
- exit: translateY 0→24 + opacity 1→0 + backdrop 1→0
- duration 180ms (DURATION_QUICK), EASE_EXIT
- `.start(({ finished }) => setMounted(false))` 콜백으로 Modal unmount
- Rule 2: 다음 enter 시 translateY/scale/opacity 초기값(.setValue) 정상

**Pass Criteria**:
- exit duration 180ms ± 20ms
- Modal DOM 미잔존 (mount=false 후)
- 다음 visible=true 시 enter motion 정확 재시작 (residual offset 0)

**Fail Criteria**: exit 종료 후 Modal 잔존 → Rule 2 위반 + memory leak vector

### MTC-G.3 Reduce Motion ON 시 fade 대체

**Preconditions**: iOS Settings Reduce Motion ON

**Steps**: visible=false → true

**Expected**:
- transform 차단 (translateY=0, scale=1 강제)
- opacity fade 150ms (REDUCE_MOTION_FADE_DURATION) enter
- exit도 150ms opacity fade

**Pass Criteria**: spring motion 0회, opacity 정확

### MTC-G.4 Android Back + backdrop tap dismiss

**Steps**:
1. (Android) BottomSheet 활성 상태에서 Back 버튼
2. (양 OS) backdrop 영역 tap

**Expected**:
- Modal API `onRequestClose` → onClose() 호출 → visible=false → exit motion → unmount
- dismissOnBackdrop=true 시 backdrop tap이 onClose 호출
- dismissOnBackdrop=false 시 backdrop tap 무시 (focus shake 등 별도 표현 권고)

---

## 9. Coverage Matrix v3 (W16 D-4 종료)

| Spec v1.1 항목 | 적용 결정 | 커버 MTC | 상태 |
|---|---|---|---|
| §3 Category A Pulse Ripple | ✅ PulseOverlay 컴포넌트 | MTC-A.4, D.4 | 활성 |
| §3 Category A Jelly Toggle | ✅ JellySwitch 컴포넌트 | MTC-F.3 | 활성 |
| §3 Category B Modal Sheet | ✅ BottomSheet 컴포넌트 (사용처는 후속 PR) | MTC-G.1~G.4 | 활성 (컴포넌트 봉인, 사용 대기) |
| Apple HIG Haptic toggle | ✅ Settings + lib/haptics.ts wrapper | MTC-F.1, F.2 | 활성 |

**디자이너 권고 P0/P1/P2 100% 완료**.
