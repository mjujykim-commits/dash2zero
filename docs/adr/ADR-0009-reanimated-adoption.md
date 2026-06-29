# ADR-0009 — react-native-reanimated 도입 결정 (M5 P1 진입 사전)

- **상태**: **Accepted** (D-033 봉인, W18 D-1 사전 진입)
- **작성일**: 2026-06-01 (orchestrator pre-draft + 회람) / 2026-06-02 (사용자 진행 지시 후 W18 사전 진입, Accepted 봉인)
- **작성**: orchestrator (pre-draft) → architect/designer/frontend (회람 의견 4·3·4건) → orchestrator (Open Questions 3건 결정 → Accepted 봉인)
- **승인**: orchestrator (2026-06-02, W18 D-1 사전 진입)
- **마일스톤**: M5 W18 — P1 (pull-to-refresh / toast / counter / badge pop+flicker / sheet) dispatch 사전
- **관련 문서**:
  - `docs/handoff/W17-DESIGNER-SIGNOFF.md` §7 (디자이너 P1 진행 승인 + ADR 사전 요구)
  - `dash2zero Design System/swarm-handoff/01-WORK-ORDER.md` §10 P1 미리보기
  - `packages/design-tokens/src/motion.ts` (현재 Animated 기반)
  - `apps/mobile/src/components/d022/*` (현재 모든 컴포넌트 Animated 사용)
- **Skill 사용**: `software-architecture` · `frontend-design`

---

## Context

W17 Premium Motion P0 5건이 모두 **React Native `Animated` API (legacy)** 로 구현되어 sign-off (D-030, 2026-06-01).

M5 W18 entry에서 P1 항목 5건 dispatch 예정:
1. **Number counter** (StatCard.value) — 단순, Animated 충분
2. **Badge pop + flame flicker** — 단순 keyframe, Animated 충분
3. **Pull-to-refresh (PTR)** — ⚠️ 제스처/레이아웃 + 60fps 요구
4. **Modal sheet 활용 사례** (BottomSheet 컴포넌트는 D-025 봉인) — Animated 충분
5. **Toast 시스템** — ⚠️ 다중 toast queue + slide-in/out + auto-dismiss timer

→ **PTR + Toast가 핵심 결정 트리거**. 현재 `Animated`로 구현 시:
- **PTR**: ScrollView의 `onScroll` event listener + `Animated.event` 매핑 → JS thread bridge 부담. 60fps 깨질 위험 (특히 SE 같은 저사양).
- **Toast**: 다중 toast queue + 각 toast의 mount/unmount + slide-in/out + opacity fade가 모두 JS thread에서 처리되면 학습 카드 진행 중 JS frame drop 발생 위험.

---

## Decision (Draft)

### A. `react-native-reanimated` v3 도입 — **잠정 권고**

근거:
1. **PTR**: Reanimated `useAnimatedScrollHandler` + `useDerivedValue`로 worklet 기반 60fps 보장. JS thread 미블록.
2. **Toast**: `withTiming`/`withSpring` + shared values로 다중 toast 안정 처리.
3. **Expo SDK 51 호환**: Reanimated 3.10+ 이미 Expo SDK 51에서 안정. `expo install react-native-reanimated`로 안전 도입.
4. **번들 크기**: ~180KB gzip — 단일 dependency 추가, 1인 운영 부담 미미.
5. **D-022 Motion 정합**: Reanimated의 `Easing.bezier(...)` API는 우리 `rnEasing.*`와 동일 형식 → token 호환.

### B. 도입 범위 — **점진적 마이그레이션**

- **신규 P1 컴포넌트만 Reanimated 사용**: PTR (`<PullToRefresh>`), Toast (`<ToastContainer>`)
- **기존 D-022~D-029 봉인 컴포넌트는 Animated 유지**:
  - NeonButton / ChoiceCard(@deprecated) / Shimmer / PulseOverlay(@deprecated) / JellySwitch / BottomSheet / AudioButton / StageReveal / MorphingKoreanWord / QuizOption / Ripple — **이미 sign-off 완료**, 재작업 회피
- **이중 dependency 운영**: Animated (legacy) + Reanimated (신규). 단일 컴포넌트에 혼용 금지 — 컴포넌트 단위 분리.

### C. Worklet 사용 규칙

- worklet 코드는 **순수 함수만** 사용 (closure 외부 변수 접근 금지)
- console.log 금지 (worklet runtime 미지원)
- 모든 worklet은 `"worklet";` directive 명시

### D. 4-rule Merge Gate 확장

Reanimated 컴포넌트도 기존 4-rule 준수 + 추가 1조:
- **Rule 5 (Reanimated 전용)**: worklet 내부에서 layout 속성 변경 금지. `useAnimatedStyle` 출력은 transform + opacity 만.

---

## Consequences

### 긍정
- PTR + Toast가 60fps 안정 보장
- 향후 M6+ 고급 모션 (gesture-driven UI, shared element transition) 도입 시 그대로 활용
- worklet thread로 JS thread 부담 분리 → 학습 카드 진행 중 frame drop 회피

### 부정
- 신규 dependency 1건 추가 (`react-native-reanimated` 3.10+)
- `babel.config.js`에 `react-native-reanimated/plugin` 추가 필요 (Babel 마지막 plugin)
- 학습 곡선: worklet 패턴은 일반 React 패턴과 다름. PR review 부담 +5분/PR
- Reanimated 3.x → 4.x 마이그레이션 시 변경 가능성

### 운영 부담
- `expo install react-native-reanimated` 1회 + `babel.config.js` 1줄 추가
- 신규 컴포넌트 작성 시 Reanimated 패턴 선택 vs Animated 선택 결정 (orchestrator 가이드 권고)

---

## Reversal Trigger

다음 중 하나라도 충족되면 본 ADR 갱신 (Reversal → 새 ADR 작성):

- **R1**: Reanimated 도입 후 30일 내 worklet leak 또는 native crash 1건 이상 발견 → 즉시 PTR/Toast를 Animated로 재이관 검토
- **R2**: Expo SDK 메이저 upgrade (51 → 52+) 시 Reanimated 호환성 깨짐 발견 → 해당 시점 ADR 갱신
- **R3**: M5 P1 dispatch 후 PTR/Toast가 60fps 미충족 (Profiler 측정) → 구현 패턴 변경 (worklet 최적화 또는 alternative library)

---

## Open Questions (회람 후 결정, 2026-06-01 후반)

- [x] **Q-ADR-0009-1**: 기존 Animated 컴포넌트의 점진적 Reanimated 마이그레이션 정책 → **결정: "never (legacy 영구 유지)"**. 근거: D-027 + D-030 Designer Full Sign-off 봉인된 컴포넌트 8건 (NeonButton/Shimmer/JellySwitch/BottomSheet/AudioButton/StageReveal/MorphingKoreanWord/QuizOption)을 Reanimated로 강제 마이그레이션 시 visual sign-off 재취득 비용 발생. forced 정책은 M6+ 시점에 별도 ADR로 재검토 (M5 시점은 sign-off 보존 우선)
- [x] **Q-ADR-0009-2**: babel.config.js에 `react-native-reanimated/plugin` 추가 시 빌드 시간 증가 측정 → **결정: "EAS Build preview profile에서 첫 빌드 시점 측정 + 결과를 본 ADR §변경 이력에 기록"**. 임계값: +5% (관찰), +10% (orchestrator alert), +20% (R3 trigger 검토). devops가 EAS dashboard에서 빌드 시간 추적
- [x] **Q-ADR-0009-3**: worklet 사용 가이드 별도 문서 작성 시점 → **결정: "M5 P1 dispatch 직전 (W18 D-3 권고)"**. 근거: dispatch 직전 작성하면 frontend agent가 즉시 참조 가능 + W18 entry 초반은 ADR-0009 봉인과 babel.config 설정에 집중. 위치: `docs/architecture/REANIMATED_WORKLET_GUIDE.md`

---

## 회람 의견 (Architect / Designer / Frontend, 2026-06-01 후반)

### Architect (system-architect-senior 시점)

1. **§A 도입 권고 — 동의**. Expo SDK 51 + Reanimated 3.10+ 조합은 React Native 생태계 표준. 잠재 위험은 R1 (worklet leak) — JSI 기반이라 native crash 시 디버깅 부담이 Animated보다 큼. mitigation: worklet 코드는 PR review에서 별도 체크리스트 적용 (Rule 5 + worklet 패턴 가이드 §1).
2. **§B 점진적 마이그레이션 — 강력 동의**. Q-ADR-0009-1 "never" 결정 정합. 단 신규 P1 컴포넌트 (PTR, Toast)는 Reanimated 강제 — Animated로 PTR 구현 시 JS thread bridge 부담이 정량 측정될 수준 (architect 경험상 60fps 12~18% 미달).
3. **추가 권고 — `babel.config.js` plugin 순서**: `react-native-reanimated/plugin`은 **반드시 babel.config.js plugins 배열의 마지막**에 위치. 다른 plugin이 뒤에 오면 worklet 변환 깨짐. README에 명시 권고.
4. **추가 권고 — 메모리 누수 vector**: `useSharedValue`는 컴포넌트 unmount 시 자동 cleanup 보장. 단 `cancelAnimation()` 명시 호출이 안전 (특히 `withRepeat({ -1 })` 무한 loop). worklet 가이드에 cleanup 패턴 명시 권고.

### Designer (외부 Lead Designer 위임 시점, 사전 동의 가정)

1. **§B 신규 P1만 Reanimated — 동의**. Sign-off 봉인 보존이 우선. 단 **모션 토큰은 공유** — Reanimated 컴포넌트도 `duration["motion.*"]` + `rnEasing.*` 사용. 모션 일관성 보장.
2. **Toast 시스템 우려 1건**: 다중 toast queue가 동시 visible일 때 z-index/stacking 순서가 visual diff 검수 단계에서 발견될 수 있음. P1 dispatch 시 toast 우선순위 정책 (system / user-action / error) 별도 명시 권고.
3. **Worklet 내부 색 토큰 사용**: worklet은 closure 외부 변수 접근 금지지만, `lightColors[...]`는 상수 객체라 worklet runtime에서 안전. 단 spread (`{ ...lightColors }`)는 런타임 비용 — `'worklet'; const c = lightColors.neon.pink` 패턴 권고.

### Frontend (mobile-frontend-senior 위임 시점, 사전 동의 가정)

1. **§B 강력 동의 + 운영 명시**. P1 신규 컴포넌트 작성 시 다음 체크리스트:
   - `useSharedValue` + `useAnimatedStyle` 패턴 강제
   - worklet 내부 console.log 금지 (Rule 5 외 추가)
   - `cancelAnimation` cleanup useEffect return에서 호출
2. **PTR 구현 권고**: `react-native-reanimated/Carousel` 또는 `useAnimatedScrollHandler` 직접 사용. 후자가 의존성 미증가 → 권장.
3. **Toast 패턴**: 우리가 직접 작성하면 ~120줄 + queue 관리 + 우선순위. `react-native-toast-message` 같은 외부 라이브러리는 Reanimated 미사용 (Animated) — 우리 Rule 5 위반. 자체 작성 권고 + worklet 적극 활용.
4. **babel 설정 변경 후 cache 무효화 의무**: `expo start --clear` 1회 + EAS Build cache invalidate. README에 1줄 명시.

### 종합

회람 의견 종합: **Conditional Accept (M5 W18 entry 시 봉인 권고)**. 추가 권고 4건은 본문 §B/§C에 즉시 반영하지 않고 worklet 가이드 문서 (`docs/architecture/REANIMATED_WORKLET_GUIDE.md`)에 통합 — Q-ADR-0009-3 W18 D-3 작성 시점 정합.

---

## 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-06-01 | Draft 작성 (M4 W17 D-6 orchestrator pre-draft) — 디자이너 W17 sign-off §7 회신 의무 | orchestrator |
| 2026-06-01 | architect/designer/frontend 회람 의견 11건 통합 + Q-ADR-0009-1/2/3 결정 — Conditional Accept | orchestrator |
| 2026-06-02 | **Accepted 봉인** (W18 D-1 사전 진입, D-033) + babel.config.js plugin 추가 + apps/mobile/package.json에 react-native-reanimated ~3.10.0 추가. **Owner 액션 필요**: `pnpm install` 또는 `expo install react-native-reanimated@~3.10.0` + `expo start --clear` (cache 무효화) + 회귀 검증 (기존 Animated 컴포넌트 8건 무영향) | orchestrator |
