# P1 Motion Work Order · M5 W18–W19 Swarm Handoff

> **Status:** Issued — Designer approved P1 dispatch (W18-P1-WORK-ORDER-REQUEST 회신)
> **FROM:** Lead Designer (dash2zero Design System)
> **TO:** Swarm Coding Orchestrator (frontend / designer / qa)
> **DATE:** 2026-06-02 (M5 W18 entry D-6)
> **Predecessor:** swarm-handoff/01-WORK-ORDER.md (W17 P0, Full Sign-off D-030)
> **Depends on:** ADR-0009 Accepted 봉인 (W18 D-1) + REANIMATED_WORKLET_GUIDE.md

W17 포맷 그대로. 회신 양식은 **[A] Full P1 발주** — 단, §0의 5개 결정과
함께 발주한다. **그중 2건은 dash2zero 권고를 거절/수정**했으니 §0을 먼저 읽을 것.

---

## 0. 발주 결정 — dash2zero 협의 5건 회신

| # | 협의 항목 | 디자이너 결정 |
|---|---|---|
| **Q-1** | 발행 시점 | **W18 entry(6/8) 전 발행 — 본 문서가 그것.** 일정 슬립 없음. |
| **Q-2** | 우선순위 1~5 | **부분 수정.** Counter(P1.1)·Toast(P1.2)·Badge(P1.3) 동의. **PTR(P1.4)는 droppable로 강등** — Home은 이미 `useFocusEffect` refetch가 있어 중복. W19 마지막 dispatch + 압박 시 M6 이월. Modal(P1.5)은 **활용처 축소**(아래 Q-4). |
| **Q-3** | Toast 우선순위 정책 | **수정 승인.** 3-tier + max 3 stack 채택. **단 1건 수정: action이 있는 error toast는 auto-dismiss 금지(수동 dismiss까지 유지).** 결제 실패 같은 actionable error가 5초 후 사라지면 사용자가 복구 경로를 잃는다. |
| **Q-4** | Modal 활용처 | **부분 거절.** ✅ Delete account confirm 채택. ❌ **Lesson abandon confirm 거절** — `DESIGN_DIRECTION §2.1` "가입/푸시 강요 회피, 도구 톤"에 위배. 학습 이탈을 막는 confirm은 게임식 dark-pattern이다. dash2zero가 의도적으로 거리 두는 Duolingo 패턴. 자동 `lesson_abandoned` emit 유지. → **P1.5 활용처는 Delete account 1건만.** |
| **Q-5** | Rule 5 (worklet layout 금지) | **승인.** §1에 5조로 추가. |

> **Q-4는 타협하지 않는다.** "사용자가 3분 만에 가볍게 들어왔다 나가는" 것이
> dash2zero의 핵심 약속이다. 나가려는 사용자를 모달로 붙잡는 순간 그 약속이
> 깨진다. learning agent가 retention 위해 abandon-confirm을 다시 요청하더라도,
> 그건 streak/notification 설계로 풀 문제지 모달 마찰로 풀 문제가 아니다.

---

## 1. 일관 규칙 (W17 §1 + Rule 5)

W17의 5조 그대로 유지 + Reanimated 컴포넌트(Toast/PTR)에 한해:

6. **Rule 5 (worklet 전용):** `useAnimatedStyle` 출력은 transform + opacity
   only. layout 속성(width/height/top/left/margin) 변경 금지. worklet 내부
   `"worklet"` directive 필수, closure 외부 mutable 접근 금지(runOnJS 분리),
   `withRepeat({ -1 })`는 `cancelAnimation` cleanup 필수. → 상세는
   `docs/architecture/REANIMATED_WORKLET_GUIDE.md` C1~C8.

**컴포넌트별 엔진 (ADR-0009 정합):**

| 컴포넌트 | 엔진 | 사유 |
|---|---|---|
| NumberCounter | **Animated** (legacy) | 단순 1D 보간 |
| StreakBadge | **Animated** (legacy) | scale/rotate keyframe |
| ConfirmSheet | **Animated** (legacy) | 기존 BottomSheet D-025 재사용 |
| Toast | **Reanimated** | 다중 queue + JS thread 부담 회피 |
| PullToRefresh | **Reanimated** | 제스처 60fps |

단일 컴포넌트 안에서 두 엔진 혼용 금지.

---

## 2. Agent 분배 + 일정

| Task | 엔진 | Primary | 예상 | dispatch |
|---|---|---|---|---|
| P1.1 NumberCounter | Animated | frontend | 0.2 | W18 D-4 |
| P1.2 Toast + Provider | Reanimated | frontend | 0.5 | W18 D-4~5 |
| P1.3 StreakBadge | Animated | frontend | 0.3 | W18 D-6 |
| P1.4 PullToRefresh | Reanimated | frontend | 0.4 | W19 (droppable) |
| P1.5 ConfirmSheet 활용 | Animated | frontend+designer | 0.3 | W19 |
| 통합 QA | — | qa | 0.5 | W18/W19 게이트 |

**선행:** W18 D-1 ADR-0009 Accepted 봉인 + `react-native-reanimated/plugin`
babel 추가 + `expo start --clear` + §8 회귀 검증 통과까지 **Reanimated
컴포넌트(P1.2/P1.4) 착수 금지.** Animated 컴포넌트(P1.1/P1.3/P1.5)는 선착수 가능.

---

## 3. P1.1 · NumberCounter (Animated)

**파일:** `apps/mobile/src/components/d022/NumberCounter.tsx` (신규) → reference 동봉.

**활용 (Q3 결정):** **Lesson Complete의 "{N} words nailed." 1건만.**
Home stats / Paywall 숫자는 정적 유지. 매 Home 진입 카운트업은 학습 흐름을
방해하고, "hero motion은 화면당 1회"(motion.count 토큰 정의) 원칙에도 어긋난다.

**AC:**
1. mount(또는 viewport 진입) 시 `from`→`value` 카운트업, `motion.count` 900ms ease-out.
2. 큰 수 우려(dash2zero §2.3): MVP 단어 수는 최대 300대. 900ms로 충분.
   **단 value가 한 자리(예: 3)면 카운트업이 인지 안 되니 `value < 5`일 때는
   `motion.spring` 320ms로 단축** (reference에 미반영 — frontend 추가).
3. reduce-motion 시 최종값 즉시 표시.
4. `accessibilityLabel`은 최종값으로 고정(중간값 VoiceOver 낭독 방지).

---

## 4. P1.2 · Toast 시스템 (Reanimated)

**파일:** `apps/mobile/src/components/d022/Toast.tsx` + `providers/ToastProvider.tsx` → reference 동봉.

**활용:** 현재 `Alert.alert` 사용처를 toast로 점진 대체 — paywall restore 결과,
sync 완료, reminder 토글 결과, privacy 변경 등. **결제 실패 같은 차단성
에러는 toast가 아니라 기존 Alert 유지**(사용자가 명시적으로 인지해야 하는
모달성 정보).

**AC:**
1. 3-tier 우선순위 + max 3 stack (reference 구현).
2. **action 있는 error는 auto-dismiss 금지** (Q3 수정안).
3. enter: translateY -24→0 + opacity, `motion.sheet`. exit: `motion.fast` + ease-in.
4. error는 stack 최상위 즉시 삽입 + `hapticNotification("warning")`.
5. worklet C1~C8 전부 충족. reduce-motion 시 opacity fade only.

---

## 5. P1.3 · StreakBadge (Animated)

**파일:** `apps/mobile/src/components/d022/StreakBadge.tsx` (신규) → reference 동봉.

**AC:**
1. pop entry — `justIncremented` 시 scale 0.4→1.08→1 spring(`motion.spring`).
2. flame flicker — 🔥 scale 1↔1.08 + rotate ±2deg 무한(1600ms alternate).
3. **streak 끊김 시 pop/flicker 없이 정적** (`DESIGN_DIRECTION §6.2`).
4. reduce-motion 시 pop→fade, flicker 정지.

---

## 6. P1.4 · PullToRefresh (Reanimated, droppable)

**파일:** `apps/mobile/src/components/d022/PullToRefresh.tsx` (신규) → reference 동봉.

> **강등 사유(Q2):** Home은 `useFocusEffect`로 이미 refetch한다. PTR은
> "익숙한 패턴"이지만 추가 가치가 marginal. **W19 마지막에 dispatch하고,
> 일정 압박 시 주저없이 M6로 이월.** 적용처는 Home 1곳만.

**AC:**
1. `useAnimatedScrollHandler` — overscroll < -80px에서 release 시 `runOnJS(onRefresh)`.
2. indicator는 pull 거리 비례 opacity + rotate (worklet, transform/opacity only).
3. refreshing 동안 spinner 회전(`withRepeat` + `cancelAnimation` cleanup).
4. worklet C1~C8 충족.

---

## 7. P1.5 · ConfirmSheet 활용 (Animated, 기존 BottomSheet 재사용)

**파일:** `apps/mobile/src/components/d022/ConfirmSheet.tsx` (신규 thin wrapper) → reference 동봉.

> **신규 모션 컴포넌트 아님.** D-025 BottomSheet를 재사용한 **활용 작업**.

**활용처 (Q4 결정): Delete account confirm 1건만.** 현재 Settings의
`Alert.alert` 삭제 확인을 ConfirmSheet로 교체. copy는 `11_ux_writing_guide §13` 그대로.

**AC:**
1. BottomSheet 위 title/body/confirm/cancel 레이아웃.
2. destructive primary는 danger 색(gradient 아님), cancel은 secondary.
3. **Lesson abandon에는 적용 금지**(Q4). Subscription manage는 store 이동 유지.

---

## 8. Reanimated 도입 회귀 검증 (dash2zero §3.4)

W18 D-1 install 직후, P1 착수 전 게이트:

- [ ] `pnpm typecheck` 0 error
- [ ] `pnpm test` (motion.spec.ts 9 case 포함) 0 fail
- [ ] 기존 Animated 컴포넌트 8건 visual 회귀 0 — lesson 1회 + Home + Settings 수동 진입
- [ ] `babel.config.js`의 `react-native-reanimated/plugin`이 plugins 배열 **마지막**
- [ ] `expo start --clear` + EAS cache invalidate 수행

---

## 9. Definition of Done

W17 §8 그대로 + 추가:

- [ ] worklet 사용 PR은 C1~C8 체크리스트(WORKLET_GUIDE §9) 첨부
- [ ] Toast: 빠르게 4개 trigger 시 max 3 stack + queue 동작 확인
- [ ] PTR: iPhone SE에서 60fps 유지(Profiler) — 미달 시 R3 trigger 검토
- [ ] reduce-motion ON 스크린샷: counter(정적)/toast(fade)/badge(정적)/PTR/sheet(fade)
- [ ] DoD 게이트 통과 후 design system review §06 P1 lane을 `[x]`로 갱신

---

## 10. 컨텍스트 기록 의무

- CHANGELOG: "P1 motion — counter / toast / streak badge / PTR / confirm sheet" + Reanimated 도입.
- ADR-0009 → Accepted 봉인 시 변경 이력에 babel 빌드 시간 측정값 기록(Q-ADR-0009-2).
- Sprint risk: PTR 60fps 미달 가능성(R3 trigger 연동) + Reanimated worklet leak(R1).
- **신규 DECISION 권고:** "Lesson abandon confirm modal 미채택 — 도구 톤 보존"을 D-NNN으로 봉인(향후 learning agent 재요청 대비 근거).

---

## 11. 디스패치 프롬프트

```
[swarm dispatch] M5 W18–W19 P1 motion rollout

대상: frontend (primary) + designer (P1.5 활용처 review) + qa (sweep)
선행: 본 문서 §0 결정 5건 필독. W18 D-1 ADR-0009 봉인 + Reanimated install +
      §8 회귀 검증 통과 후 Reanimated 항목(P1.2/P1.4) 착수.

착수 순서:
  W18: P1.1 counter(Animated) ∥ P1.2 toast(Reanimated) → P1.3 badge(Animated)
  W19: P1.5 confirm sheet 활용(Animated) → P1.4 PTR(Reanimated, droppable)

거절/수정 반영 필수:
  - Q-4: Lesson abandon confirm 구현 금지 (Delete account만)
  - Q-3: action error toast auto-dismiss 금지
  - Q-2: PTR은 마지막 + droppable

각 PR: before/after 스크린샷(SE + 15 Pro) + reduce-motion 1매 + worklet PR은 C1~C8.
종료: §9 DoD 전부 + qa 적대 케이스 0 + designer sign-off(P1.5 활용처).
```

---

> reference 구현은 `03-REFERENCE/components/` 5건. 라이브 데모는
> `02-DESIGN-REVIEW/index.html` §4.3(counter/toast/badge)·§4.4(PTR/sheet)에서
> 직접 확인. 보장된 동작이 아닌 reference이므로 typecheck+시뮬 검수가 last word.
