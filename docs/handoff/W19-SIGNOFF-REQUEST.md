# W19 Sign-off Request — ConfirmSheet / PullToRefresh 2건

- **수신**: Lead Designer (외부, design system 프로젝트 owner)
- **발신**: dash2zero Swarm Coding Orchestrator
- **작성일**: 2026-06-05 (M5 W19 D-5 / W19 종료 시점)
- **참조**:
  - W18 sign-off: `docs/handoff/W18-SIGNOFF-REQUEST.md` (대기 중 또는 회신 수신)
  - W19 dispatch plan: `docs/handoff/W18-DISPATCH-PLAN.md` §2
  - W19 봉인: D-035 ConfirmSheet + D-036 PullToRefresh
- **Owner 전달 (mju.jykim@gmail.com → Lead Designer)**: W19 종료 시점 sign-off 요청

---

## 0. 한 줄 요약

P1.5 ConfirmSheet (Delete account 단일화) + P1.4 PullToRefresh (M6 droppable, 컴포넌트 봉인만) **2건 dispatch 완료**. Designer Q-2/Q-4 결정 정합 보존. W19 종료 시점 sign-off 요청 — **PTR은 60fps Profiler 첨부가 sign-off 조건** (Designer 명시).

---

## 1. 산출물 2건

### P1.5 ConfirmSheet (Animated, BottomSheet 재사용)

- **위치**: `apps/mobile/src/components/d022/ConfirmSheet.tsx` (~95줄)
- **방식**: 기존 BottomSheet (D-025) wrapper — 신규 모션 컴포넌트 아닌 **활용 작업**, Reanimated 불요
- **destructive 톤**: NeonButton gradient 대신 **danger solid Pressable** (DESIGN_DIRECTION §3.2 "정직/명세 톤" 정합)
- **Cancel**: NeonButton variant="secondary" (glass)
- **Haptic**: D-024 `hapticImpact("light")` on confirm

#### 통합 사용처 — Delete account 단일화 (D-031 정합)
- `apps/mobile/app/settings.tsx`:
  - 기존 `handleDeleteAccount` Alert.alert 2단계 (확인 → 성공/실패 Alert) → **ConfirmSheet 단일 시트**로 교체
  - 결과는 toast (성공 = user-action / 실패 = persistent error + Retry action) — D-034 정합
- **Lesson abandon confirm 추가 금지** ✅ (D-031 영구 보존)
- **Subscription manage modal 거절** ✅ (paywall/store 이동 유지)

### P1.4 PullToRefresh (Reanimated, M6 droppable)

- **위치**: `apps/mobile/src/components/d022/PullToRefresh.tsx` (~120줄)
- **방식**: `useAnimatedScrollHandler` worklet 3건 (onScroll/onEndDrag/onMomentumEnd) + `runOnJS(fireRefresh)` + `useAnimatedStyle` indicator
- **THRESHOLD 80px** raw 잔존 (Work Order §6 본문 명시값)
- **Reduce Motion 보강**: rotate 차단 (시각적 멀미 방지), opacity + translateY 기능상 유지

#### 통합 사용처
- **현재**: 컴포넌트 정의만 + d022/index.ts export
- **Home stats 통합**: useFocusEffect refetch와 병행 가능 — Owner 결정 후 별도 사이클
- **progress 화면**: M6 검토 (Designer §10 명시 — 본 sprint 범위 외)

---

## 2. 추가 — streak justIncremented 감지 logic (W18 후속 보강)

W18 sign-off 요청서 §8에서 알려진 한계로 명시했던 항목:

> "StreakBadge `justIncremented` 미감지: 현재 default false (mount 시 pop 없음, flicker만 동작)"

**해소 (사이클 KK)**:
- `apps/mobile/app/home.tsx`:
  - `useRef<number | null> prevStreakRef` + `useState<boolean> streakJustIncremented`
  - useEffect로 `today?.streak_days` 변경 감지 — 증가 시 true → 600ms 후 false
  - StreakBadge prop으로 전달
- 효과: 사용자가 lesson 완료 후 home 복귀 시 streak 갱신되면 StreakBadge가 자동으로 pop entry 재생

---

## 3. W19 D-1 회귀 검증 결과 (Owner 영역 — Designer 보고 권고)

ADR-0009 Accepted + Reanimated 3.10+ install (W18 D-1) 후 W19까지 누적 검증:
- [ ] `pnpm type-check` 0 error (**Owner 실행 필요**)
- [ ] `pnpm -r test` PASS (motion.spec.ts 9 case 포함) (**Owner 실행 필요**)
- [ ] D-022~D-029 봉인 컴포넌트 8건 visual diff 0 (**Owner 실기 확인 필요**)
- [ ] **PTR 60fps Profiler 첨부** (iPhone SE 또는 중급 디바이스 권고) — **sign-off 조건**

---

## 4. 4-rule Merge Gate cross-validate (2건 모두 PASS)

### ConfirmSheet
- Rule 1 GPU: BottomSheet 재사용 (D-025 PASS 보존) + destructive Pressable 정적
- Rule 2 Lifecycle: BottomSheet의 unmount cleanup 보존 + visible prop 호출자 관리
- Rule 3 Timing: BottomSheet motion 토큰 보존
- Rule 4 Skeleton: N/A

### PullToRefresh (Reanimated 전용 Rule 5 포함)
- Rule 1 GPU: useAnimatedStyle 출력 transform + opacity only ✅
- Rule 2 Lifecycle: AccessibilityInfo listener cleanup + useSharedValue 자동 cleanup ✅
- Rule 3 Timing: lightColors 토큰. raw 잔존: THRESHOLD 80px (Work Order 본문)
- Rule 4 Skeleton: N/A
- **Rule 5 Reanimated 전용**: worklet directive 명시 + transform/opacity only ✅

---

## 5. worklet 체크리스트 C1~C8 (PullToRefresh 정합)

| # | 항목 | 확인 |
|---|---|---|
| C1 | useSharedValue + useAnimatedScrollHandler | ✅ |
| C2 | "worklet" directive 4건 (onScroll/onEndDrag/onMomentumEnd/useAnimatedStyle) | ✅ |
| C3 | runOnJS(fireRefresh) 분리 | ✅ |
| C4 | console.log/warn worklet 내부 미사용 | ✅ |
| C5 | 무한 anim 없음 → cancelAnimation 불요 | ✅ |
| C6 | lightColors 토큰 사용 | ✅ |
| C7 | useAnimatedStyle 출력 transform + opacity only | ✅ |
| C8 | babel.config.js plugin 마지막 위치 | ✅ (D-033 사전 설정) |

---

## 6. 봉인 결정 (W19)

| ID | 결정 | 일자 |
|---|---|---|
| D-035 | P1.5 ConfirmSheet (Delete account 단일화) | 2026-06-04 |
| D-036 | P1.4 PullToRefresh (Reanimated, M6 droppable) | 2026-06-05 |

---

## 7. 회신 양식 (Lead Designer 권고)

```
[1] W19 Full Sign-off:
    "ConfirmSheet / PullToRefresh 2건 visual sign-off 부여. design system §06 P1 lane
    DoD 통과 → [x] 갱신."

[2] Conditional Sign-off:
    - PTR 60fps Profiler 수치 추가 첨부 요청 (Designer 명시 조건)
    - 또는 ConfirmSheet destructive solid 톤 visual tweak

[3] 변경 요청:
    - PTR 사용처 결정 (Home stats 통합 권고 vs M6 이월)
    - ConfirmSheet 2단계 확인 (checkbox "I understand") 추가 권고
    - Subscription tier modal 재요청 (현재 D-031 정합으로 거부 중)

[4] M6 backlog 진입 요청:
    - PTR Home stats 통합 + 60fps Profiler 측정
    - ConfirmSheet 2단계 확인
    - Subscription tier modal
    - progress 화면 PTR
```

---

## 8. 알려진 한계 (정직 보고)

1. **PTR 사용처 미통합**: 본 봉인은 컴포넌트만. Home stats 통합은 Owner 결정 후 별도 사이클 (Designer Q-2 "Home은 이미 useFocusEffect" 정합으로 시급성 낮음)
2. **PTR refreshing 동안 spinner withRepeat 미구현**: reference §115 후속 권고. 현재는 indicator opacity 1 + 정적 rotate (pull progress 마지막 값)
3. **PTR 60fps Profiler 미측정**: Owner 환경 실행 필요. sign-off 조건이라 명시
4. **ConfirmSheet 2단계 확인 (checkbox "I understand") 미구현**: Reference §99 "M6 검토" 명시. 본 sprint 범위 외
5. **iOS RefreshControl 대체 아님**: native PTR과 시각 다를 수 있음 — Designer 검토 시 trade-off 명시

---

## 9. W18 sign-off 후속 메모

W18 sign-off 요청서(`docs/handoff/W18-SIGNOFF-REQUEST.md`) §8에서 알려진 한계로 보고했던 **StreakBadge justIncremented 미감지**는 본 사이클(KK)에서 해소 완료 — Home에 streak 변경 감지 logic 추가. 사용자가 lesson 완료 후 home 복귀 시 streak 갱신이면 자동 pop entry 재생.

---

**dash2zero Swarm Coding Orchestrator 드림**

P.S. M5 W18+W19 P1 5건(Counter / Toast / Badge / ConfirmSheet / PTR) **모두 dispatch 완료**.
P1.4 PTR은 droppable이라 M6 검토 영역이지만 컴포넌트는 미리 봉인하여 사용처 결정 시 즉시 활용 가능합니다.
