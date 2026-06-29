# Motion System v1.1 — Security · Privacy · Permission Review

- **작성일**: 2026-05-21 (W16 D-3)
- **작성**: orchestrator (security-privacy-senior agent stream timeout으로 직접 작성, post-review 권장)
- **SSOT**: `docs/brand/MOTION_SYSTEM_SPEC.md` v1.1 (외부 designer 봉인 2026-05-21)
- **관련**: D-023 (DECISION_LOG), `docs/18_security_data_retention_policy.md`, `apps/mobile/app.json`
- **적용 시점**: M3 W16 D-3 즉시 + 일부 항목 M4 출시 전

---

## 1. 위험 분류 summary

| 위험도 | 항목 ID | 1줄 사유 | 액션 시점 |
|---|---|---|---|
| Medium | S-MOTION-1 | Android VIBRATE 권한 명시 누락 (expo-haptics autolink 동작 검증 필요) | M3 W16 D-3 즉시 |
| Low | S-MOTION-2 | Animated.Value cleanup pattern — ChoiceCard는 양호하나 13 화면 확장 시 회귀 위험 | M4 확장 시 review |
| Low | S-MOTION-3 | AccessibilityInfo는 read-only API — 개인정보 영향 없음 | 영향 없음 |
| Medium | S-MOTION-4 | Apple HIG: Settings에 Haptic Feedback toggle 제공 권고 | M4 출시 전 |
| Low | S-MOTION-5 | shimmer 1.6s loop unmount 시 .stop() 필요성 — pilot에는 미적용 | 후속 PR 작성 시 |

---

## 2. 항목별 상세

### S-MOTION-1. expo-haptics 권한 검토

**위험 수준**: Medium  
**영향**: 권한 / Android 빌드 / Store 심사

**현황 평가**:
- `apps/mobile/package.json`에 `expo-haptics: ~13.0.0` 추가됨 ✅
- `apps/mobile/app.json` Android permissions: `["android.permission.INTERNET", "android.permission.POST_NOTIFICATIONS"]` — **VIBRATE 권한 명시 없음**
- iOS: Haptic Engine은 별도 Info.plist 키 불필요 (NSHapticEngineUsage는 존재하지 않는 키 — iOS는 묵시적 사용 허용). 단, App Store 심사에서 사용 의도가 명확해야 함 (학습 피드백 = 정당한 사용)
- Android: VIBRATE는 일반 권한(normal permission) — 사용자 동의 dialog 불필요하지만 manifest 선언은 필수. **expo-haptics 13.x는 autolinking 시 AndroidManifest.xml에 자동 주입**하지만, EAS Build prebuild 시 명시적으로 app.json plugins에 추가하는 것이 안전 (autolink 동작 검증 부담 회피)

**권고 액션**:
- **(Owner) M3 W16 D-3 즉시**: `apps/mobile/app.json`의 `android.permissions` 배열에 `"android.permission.VIBRATE"` 명시 추가. expo-haptics autolink가 작동하더라도 명시는 안전 (중복 선언은 OS가 무시).
- **(frontend agent) 후속**: 첫 EAS Build (preview profile)에서 `pnpm dlx expo prebuild --platform android` 실행 후 `AndroidManifest.xml`에 `<uses-permission android:name="android.permission.VIBRATE" />` 존재 확인 + 로그 보관
- **(M4 출시 전) Owner**: Apple App Store Connect의 App Privacy 라벨 — Haptic은 데이터 수집이 아님 (디바이스 출력) → 라벨 추가 불필요. Google Play Data Safety도 동일.

**근거 문서**:
- [Apple HIG — Playing Haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)
- [Android Vibration Permission Docs](https://developer.android.com/reference/android/Manifest.permission#VIBRATE) (normal permission)
- [expo-haptics SDK 51 docs](https://docs.expo.dev/versions/v51.0.0/sdk/haptics/)

**Reversal Trigger**:
- expo-haptics 14.x 이상에서 권한 처리 방식 변경 발생 시 본 권고 갱신
- Android 14+ 정책 변경으로 VIBRATE이 normal → runtime 권한으로 격상 시

---

### S-MOTION-2. Animated 성능 vector + memory leak

**위험 수준**: Low (pilot ChoiceCard 기준), Medium (13 화면 확장 시 회귀 위험)

**현황 평가**:
- `apps/mobile/src/components/d022/ChoiceCard.tsx`는 모범 패턴 ✅
  - `useRef(new Animated.Value(...))` 사용 — re-render 시 인스턴스 재생성 회피
  - `AccessibilityInfo.addEventListener` cleanup (return에서 `sub.remove()`) ✅
  - mounted ref pattern으로 unmount 후 setState 차단 ✅
  - useNativeDriver: true 강제 (모든 Animated.timing 호출) ✅
- React Native 0.74의 Animated API는 안정적, native driver 우회 가능성 낮음
- Reanimated는 본 pilot에서 미사용 (Animated만 사용) — 추후 도입 시 worklet thread leak vector 별도 검토 필요
- 13 화면 확장 시 신규 컴포넌트마다 위 패턴 반복 적용 보장 필요

**권고 액션**:
- **(frontend agent) 13 화면 확장 시**: 신규 motion 컴포넌트 작성 시 ChoiceCard의 5가지 패턴 (useRef Animated.Value / cleanup listener / mounted ref / useNativeDriver:true / Animated.sequence start callback) 체크리스트로 강제
- **(orchestrator) 4-rule Merge Gate Rule 2 강화**: 본 5가지 패턴을 PR review checklist로 추가
- **(qa-engineer-senior) MTC-A.3**: 연속 5회 정답 메모리 측정 케이스에서 Animated leak 감지

**근거 문서**:
- [React Native Animated docs — Native Driver](https://reactnative.dev/docs/animated#using-the-native-driver)
- [Reanimated Worklet Threading](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/worklets/) (M4 도입 시 참조)

**Reversal Trigger**:
- Reanimated 3.x로 마이그레이션 시 worklet thread leak vector 재평가
- 13 화면 중 5개 이상에 motion 적용 후 메모리 1MB+ 증가 발견 시

---

### S-MOTION-3. AccessibilityInfo API 사용

**위험 수준**: Low  
**영향**: 개인정보 (영향 없음)

**현황 평가**:
- `AccessibilityInfo.isReduceMotionEnabled()`는 OS 설정 read-only API. **사용자 데이터 수집 아님** (디바이스 설정 조회)
- iOS: iOS 14+ 안정 지원
- Android: Android API 23+ 지원, 일부 OEM 디바이스 미지원 가능 (Promise reject 또는 false 반환)
- ChoiceCard.tsx의 fallback: `AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)` — reject 시 reduceMotion = false (안전한 기본값, motion 활성)

**권고 액션**:
- **(frontend agent)**: 현재 패턴 유지. fallback이 false인 것은 안전 (Apple HIG의 default behavior와 정합)
- **(orchestrator) 보안 라벨**: App Store/Play Store 데이터 수집 라벨에 별도 항목 추가 불필요 — AccessibilityInfo는 device-only

**근거 문서**:
- [React Native AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo)
- [Apple HIG — Accessibility / Motion](https://developer.apple.com/design/human-interface-guidelines/accessibility#Motion)

**Reversal Trigger**: 없음 (안정 API)

---

### S-MOTION-4. App Store / Google Play 심사 영향

**위험 수준**: Medium  
**영향**: 심사 / Apple HIG 위반 risk

**현황 평가**:
- **Apple HIG — Playing Haptics**: "Provide a way for people to turn haptic feedback off" 권고 명시. 다수 앱(iMessage, Mail, Settings)이 Settings → Sounds & Haptics에 toggle 제공
- dash2zero **현재 Settings에 Haptic Feedback toggle 없음** → Apple 심사에서 직접 reject 사유는 아니지만 reviewer 재량으로 권고 받을 수 있음 (Guideline 4.0 Design)
- Google Play: Vibration toggle 권고는 명시적으로 없음 (Android는 시스템 레벨 Vibration 설정에 의존)
- 데이터 수집 라벨: 양 store 모두 motion/haptic은 **수집 항목 아님** (출력 only). App Privacy / Data Safety 갱신 불필요

**권고 액션**:
- **(Owner) M4 출시 전 (5/25 ~ 출시 사이)**:
  - `apps/mobile/app/settings.tsx`의 NOTIFICATIONS 또는 신규 "Sound & Haptics" 섹션에 `Haptic Feedback` toggle 추가
  - SecureStore key `profile_haptic_enabled` (default true)
  - ChoiceCard / 후속 motion 컴포넌트가 본 setting을 읽어 `Haptics.*` 호출 분기 (Q-MOTION-5의 reduceMotion 분기와 별도)
- **(qa-engineer-senior) MTC-H 신규 작성** (후속): Settings haptic toggle off 시 ChoiceCard에서 Haptics 미호출 검증
- **(legal/policy) 영향 없음**: 데이터 수집 라벨 갱신 불필요

**근거 문서**:
- [Apple HIG — Playing Haptics, "Allowing People to Disable Haptics"](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)
- [App Store Review Guideline 4.0 Design](https://developer.apple.com/app-store/review/guidelines/#design)
- dash2zero CC-09 (Honest disclosure principle) — 사용자 통제권 제공 정합

**Reversal Trigger**:
- App Store 심사에서 haptic 미제어 사유 reject 발생 시 즉시 본 권고 P0 격상
- Apple HIG가 haptic toggle 의무화로 변경 시 (현재는 권고)

---

### S-MOTION-5. CPU/Memory leak 시나리오 (Shimmer 1.6s loop)

**위험 수준**: Low (pilot ChoiceCard 외 — 후속 PR 적용 시 활성)

**현황 평가**:
- ChoiceCard.tsx에는 shimmer 미적용 → 본 항목은 후속 PR 시점에 적용
- v1.1 §2 Q-MOTION-2 채택: `expo-linear-gradient + Animated.View translateX -100% → 100% 1.6s loop, useNativeDriver:true`
- 일반적인 RN shimmer 패턴 (예: `Animated.loop(Animated.timing(...))`)은 `.stop()` 호출 없이 unmount 시 native 자원이 자동 해제됨 (React Native 0.74 동작)
- 그러나 `Animated.loop`의 iterations 옵션 미지정 시 (-1 default) `.stop()` 명시 호출이 안전 — Owner 권고 사항

**권고 액션**:
- **(frontend agent) Skeleton 컴포넌트 신규 작성 시**:
  - `useRef`로 loop 인스턴스 보관: `const loopRef = useRef<Animated.CompositeAnimation>()`
  - useEffect cleanup에서 `loopRef.current?.stop()` 호출
  - Pattern 예시 코드:
    ```tsx
    useEffect(() => {
      const loop = Animated.loop(
        Animated.timing(translateX, {
          toValue: 1,
          duration: MOTION_TOKENS.SHIMMER_LOOP_DURATION,
          useNativeDriver: true,
        })
      );
      loop.start();
      loopRef.current = loop;
      return () => loop.stop();
    }, []);
    ```
- **(qa-engineer-senior) MTC-E.3**: Shimmer 1분 loop 메모리 측정 케이스를 후속 PR 도착 시 활성화
- **(orchestrator) Rule 4 Merge Gate**: Skeleton PR review 시 cleanup 패턴 강제 검사

**근거 문서**:
- [React Native Animated.loop](https://reactnative.dev/docs/animated#loop)
- [Reanimated Memory Best Practices](https://docs.swmansion.com/react-native-reanimated/docs/guides/memory-management/) (Reanimated 도입 시)

**Reversal Trigger**:
- Skeleton 적용 후 1분 측정에서 메모리 200KB+ 증가 발견 시 → cleanup 패턴 강제 + 본 권고 격상

---

## 3. 즉시 액션 권고 요약 (orchestrator / Owner / frontend에 전달)

| 액션 | 책임 | 시점 | 파일 |
|---|---|---|---|
| `android.permissions`에 `VIBRATE` 추가 | Owner / orchestrator | **W16 D-3 즉시** | `apps/mobile/app.json` |
| EAS Build preview 첫 빌드 시 AndroidManifest 권한 확인 | frontend / devops | M3 W16 D-7 (5/25) | EAS build logs |
| Settings에 Haptic Feedback toggle 추가 | frontend (후속 task) | **M4 출시 전** | `apps/mobile/app/settings.tsx` + `apps/mobile/src/lib/profile.ts` |
| Skeleton 컴포넌트 작성 시 loop.stop() cleanup 강제 | frontend | 후속 PR 작성 시 | (신규 컴포넌트) |
| 13 화면 motion 확장 시 5-pattern checklist 적용 | frontend / orchestrator | M4 W17~ | (review 부속 문서) |

---

## 4. M3/M4 게이트 영향

| 게이트 | 영향 | 사유 |
|---|---|---|
| **M3 D-7 (5/25) 게이트** | **영향 없음** | motion은 M3 게이트 4 KPI와 독립. 단 S-MOTION-1 (VIBRATE 권한)은 EAS Build 통과 조건이라 D-7 빌드 검증에 사전 적용 권고 |
| **M4 W17~W20 (개발)** | 영향 있음 | 13 화면 확장 + Settings haptic toggle + Skeleton 컴포넌트 — 세 작업이 M4 작업 backlog에 신규 진입 |
| **M4 출시 (M5 W23~ 예상)** | **사전 sign-off 필요 항목 2건** | (1) Apple Store 심사에 haptic toggle 제공 사실 명시 (App Review note) + (2) Play Store 심사 시 vibration 권한 사유 자동 명시 (autolink description) |

---

## 5. 빈틈 / 후속 권고

- **Reanimated 도입 결정**: Motion v1.2 또는 M5에서 Reanimated 마이그레이션 결정 시 worklet thread + JSI 보안 vector 별도 검토 필요 (현재는 Animated만 사용 → 범위 외)
- **Haptic 광범위 사용 시 배터리 영향**: iOS는 미미, Android는 일부 디바이스에서 vibration 빈도가 배터리 영향 — Settings toggle이 해결책 (S-MOTION-4)
- **Modal sheet motion (v1.1 §3 Category B)** 도입 시 sheet 외부 탭 → dismiss 시 accessibility focus 회수 패턴 별도 검토 (RN sheet UI 알려진 함정)
- **Audio policy (CC2-25)와 haptic의 관계**: haptic은 iOS silent mode와 별개 작동 (시스템 정책) — CC2-25는 audio 한정이므로 haptic은 영향 없음. 단 사용자 인지를 위해 settings에 명시 권고 (S-MOTION-4)
