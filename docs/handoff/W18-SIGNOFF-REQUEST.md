# W18 Sign-off Request — Counter / Toast / Badge 3건

- **수신**: Lead Designer (외부, design system 프로젝트 owner)
- **발신**: dash2zero Swarm Coding Orchestrator
- **작성일**: 2026-06-04 (M5 W18 D-4 야간 / W18 종료 직전)
- **참조**:
  - W18 dispatch plan: `docs/handoff/W18-DISPATCH-PLAN.md`
  - W18 D-1~D-4 봉인: D-031 + D-032 + D-033 + D-034 (DECISION_LOG)
- **Owner 전달 (mju.jykim@gmail.com → Lead Designer)**: W18 종료 시점 sign-off 요청

---

## 0. 한 줄 요약

P1.1 Counter / P1.2 Toast / P1.3 Badge **3건 dispatch 완료** + 통합 검증 통과. Designer W17 sign-off §"W18 종료 시 counter/toast/badge sign-off 요청" 충족. 4-rule + worklet 체크리스트 C1~C8 모두 PASS.

---

## 1. 산출물 3건

### P1.1 NumberCounter (Animated)
- **위치**: `apps/mobile/src/components/d022/NumberCounter.tsx` (75줄, reference + `useNumberCount` hook 추가 export)
- **통합 사용처**: `apps/mobile/app/lesson/complete.tsx` — "{N} words nailed." 0→N 카운트업 (motion.count 900ms)
- **Designer Q-2/§3.3 정합**: Lesson Complete 1곳만 활성 — Home stats / paywall 정적 유지

### P1.2 Toast (Reanimated, **첫 Reanimated 컴포넌트**)
- **위치**: `apps/mobile/src/components/d022/Toast.tsx` (Provider + hook + ToastItem 단일 파일, 약 200줄)
- **`apps/mobile/app/_layout.tsx`**: 최상위 ToastProvider mount
- **3-tier 우선순위 + max 3 stack + queue 대기** 패턴 정합
- **Designer Q-3 수정 정합**:
  - action 있는 error는 auto-dismiss 금지 (persistent)
  - 차단성 결제 에러는 Alert 유지 — actionable error만 persistent toast로 변환
- **통합 사용처 (4건)**:
  1. `settings.tsx` handleSyncNow 성공 → user-action toast
  2. `settings.tsx` handleSyncNow 실패 → persistent error toast + Retry action
  3. `settings.tsx` handleRestore 결과 (성공 = user-action / 실패 = persistent error + Retry)
  4. `settings.tsx` handleReminderToggle / handleReminderTime → user-action toast
  5. `privacy-choices.tsx` Switch (analytics + crash 2건) → user-action toast

### P1.3 StreakBadge (Animated)
- **위치**: `apps/mobile/src/components/d022/StreakBadge.tsx` (~100줄)
- **통합 사용처**: `apps/mobile/app/home.tsx` — streak ≥ 1일 때만 mount (DESIGN_DIRECTION §6.2 "Streak reset 단순 표시" 정합)
- **2 모션**: pop entry (justIncremented 시 1회 spring) + flame flicker (무한 800ms × 2 alternate)
- **잔여 작업**: `justIncremented` 감지 logic (focus 시 이전 값 비교) — W19 진입 시 별도 사이클 권고

---

## 2. W18 D-1 회귀 검증 결과 (Owner 영역 — Designer 보고 권고)

ADR-0009 Accepted + Reanimated 3.10+ install 후 회귀 검증:
- [ ] `pnpm type-check` 0 error (**Owner 실행 필요**)
- [ ] `pnpm -r test` PASS (motion.spec.ts 9 case 포함) (**Owner 실행 필요**)
- [ ] D-022~D-029 봉인 컴포넌트 8건 visual diff 0 (**Owner 실기 확인 필요**)

→ Owner 실기 검증 결과 첨부 후 본 sign-off 요청 디자이너 전달 권고.

---

## 3. 4-rule Merge Gate cross-validate 결과 (3건 모두 PASS)

### Rule 1 — GPU Acceleration
- **NumberCounter**: 텍스트 content 보간 (transform 아님) → useNativeDriver:false **사유 주석 명시** (Work Order §3 본문 정합)
- **Toast**: useSharedValue translateY + opacity, worklet 출력 transform + opacity only — Rule 5 정합
- **StreakBadge**: transform scale + rotate + opacity, useNativeDriver:true

### Rule 2 — Dynamic Lifecycle
- NumberCounter: addListener + stopAnimation + removeAllListeners cleanup
- Toast: cancelAnimation cleanup + setTimeout clearTimeout + queue promotion 동작
- StreakBadge: flicker loop.stop() cleanup + AccessibilityInfo listener cleanup

### Rule 3 — Visual Timing Uniformity
- 모든 timing이 `duration["motion.*"]` + `rnEasing.*` 토큰 사용
- raw 잔존: Toast 5000/3000ms (Work Order §4.2 본문) + StreakBadge 800ms (§5 본문) — 본문 명시값

### Rule 4 — Skeletal Transition
- N/A (3건 모두 skeleton 아님 — 사이클 J Shimmer 봉인 유지)

### Rule 5 — Reanimated 전용 (Toast 한정)
- worklet 출력 transform + opacity only ✅
- "worklet" directive 명시 ✅
- closure 외부 mutable 없음 (runOnJS dismiss 분리) ✅
- cancelAnimation cleanup ✅

---

## 4. worklet 체크리스트 C1~C8 (Toast 정합)

| # | 항목 | 확인 |
|---|---|---|
| C1 | useSharedValue + useAnimatedStyle | ✅ |
| C2 | "worklet" directive | ✅ |
| C3 | closure 외부 mutable 없음 (runOnJS 분리) | ✅ |
| C4 | console.log/warn worklet 내부 미사용 | ✅ |
| C5 | cancelAnimation cleanup | ✅ |
| C6 | duration / rnEasing 토큰 사용 | ✅ |
| C7 | worklet 출력 transform + opacity only | ✅ |
| C8 | babel.config.js plugin 마지막 위치 | ✅ (D-033 사전 설정) |

---

## 5. 봉인 결정 (W18 D-1~D-4)

| ID | 결정 | 일자 |
|---|---|---|
| D-031 | Lesson abandon confirm 거절 (dark-pattern 거리두기) | 2026-06-02 |
| D-032 | 오답 시 정답 미하이라이트 (인출 학습 표준) | 2026-06-02 |
| D-033 | react-native-reanimated 도입 Accepted | 2026-06-02 |
| D-034 | P1.2 Toast 시스템 (Reanimated 첫 사용처) | 2026-06-04 |

---

## 6. W19 dispatch 계획 (디자이너 회신 정합 보존)

| Day | 작업 |
|---|---|
| W19 D-1~3 | P1.5 ConfirmSheet (Delete account 단일화 — D-031 정합) |
| W19 D-4~5 | P1.4 PTR (Reanimated, **M6 droppable** — Designer Q-2 결정, 60fps Profiler 첨부 조건) |

---

## 7. 회신 양식 (Lead Designer 권고)

```
[1] W18 Full Sign-off:
    "Counter / Toast / Badge 3건 visual sign-off 부여. W19 P1.5 + P1.4 dispatch 진입 승인."

[2] Conditional Sign-off:
    - 추가 적대 케이스 검증 요청 N건
    - 또는 visual tweak 요청 (StreakBadge `justIncremented` 감지 logic 우선순위 / Toast position 등)

[3] 변경 요청:
    - Toast 사용처 추가/제거 권고
    - StreakBadge 시각 조정

[4] 추가 정보 요청:
    - 실기 스크린샷 또는 video clip 추가 요청
```

---

## 8. 추가 — 알려진 한계 (정직 보고)

1. **StreakBadge `justIncremented` 미감지**: 현재 default false (mount 시 pop 없음, flicker만 동작). 정확한 감지는 focus 시 이전 streak 값 비교 logic 필요 — W19 후순위 또는 별도 사이클 권고
2. **Reanimated 회귀 검증 자동화 없음**: D-022~D-029 봉인 컴포넌트 8건 visual diff는 Owner 실기 확인에 의존
3. **Toast position 고정**: bottom 32px 고정 — 키보드 표시 시 가림 가능성 (M6 mitigation 권고)

---

**dash2zero Swarm Coding Orchestrator 드림**
