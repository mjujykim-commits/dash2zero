# M5 W18 dispatch 계획 (디자이너 P1 회신 반영)

- **작성일**: 2026-06-02 (W18 entry D-6)
- **출처**: `docs/handoff/W18-DESIGNER-P1-RESPONSE.md` (Q-1~Q-5 결정 5건)
- **W18 entry 일자**: 2026-06-08 (월)
- **참조**:
  - P1 패키지 위치: `dash2zero Design System/260601/dash2zero Design System/swarm-handoff-p1/`
  - reference 5건: NumberCounter / Toast / StreakBadge / PullToRefresh / ConfirmSheet
  - ADR-0009 Conditional Accept (`docs/adr/ADR-0009-reanimated-adoption.md`)
  - WORKLET_GUIDE (`docs/architecture/REANIMATED_WORKLET_GUIDE.md`)

---

## 0. 한 줄 요약

W18 D-1 ADR-0009 봉인 + Reanimated install + 회귀 검증 → W18 D-2~7 Animated 3건 (Counter/Badge/ConfirmSheet) + Reanimated 1건 (Toast) → W19 PTR (Reanimated, M6 droppable). **PTR은 GA 발목 잡으면 즉시 droppable** (디자이너 Q-2 결정).

---

## 1. W18 일자별 작업 분해 (5/26~5/27의 사이클 V/X 사전 자료 활용)

### W18 D-1 (2026-06-08 월) — ADR-0009 봉인 + Reanimated install

- [ ] ADR-0009 **Accepted 봉인** (현재 Conditional Accept) — DECISION_LOG 갱신
- [ ] `apps/mobile/package.json`에 `react-native-reanimated: ~3.10.x` 추가
- [ ] `apps/mobile/babel.config.js`의 plugins 배열 **마지막**에 `"react-native-reanimated/plugin"` 추가 (WORKLET_GUIDE §4.1)
- [ ] `expo install react-native-reanimated` 실행 (Owner) 후 `expo start --clear` (cache 무효화, WORKLET_GUIDE §4.2)
- [ ] **회귀 검증** — Reanimated install 직후 D-022~D-029 봉인 컴포넌트 8건 (NeonButton/Shimmer/JellySwitch/BottomSheet/AudioButton/StageReveal/MorphingKoreanWord/QuizOption) 무영향 확인:
  - `pnpm type-check` + `pnpm -r test` (motion.spec.ts 9 case PASS)
  - lesson 1회 진행 + Home 진입 + Settings 진입 visual diff 0
- 책임: **frontend + Owner (install)**, 예상 0.3 인-day

### W18 D-2 (2026-06-09 화) — D-032 봉인 (L-M5-001 오답 시 정답 미하이라이트)

- [ ] `docs/backlog/L-M5-001-correct-answer-highlight-decomposition.md` 작업 분해 7건 진입:
  - planner: PRD §4 인출 루프 갱신
  - designer: QuizOption v2 `correct-passive` state 시각 사양
  - frontend: QuizOption state union 4→5 + lesson [wordId].tsx state 계산 분기 1줄
  - qa: __tests__ + SRS golden 회귀
- [ ] **D-032 봉인** — DECISION_LOG 갱신
- 책임: **learning + designer + frontend + qa + orchestrator**, 예상 0.8 인-day

### W18 D-3 (2026-06-10 수) — 사이클 W cleanup

- [ ] `docs/backlog/CLEANUP-MOTION-LEGACY-pre-audit.md` 사이클 W 진입 (0.1 인-day):
  - `apps/mobile/src/components/d022/ChoiceCard.tsx` 파일 삭제
  - `apps/mobile/src/components/d022/PulseOverlay.tsx` 파일 삭제
  - `apps/mobile/src/components/d022/index.ts`의 `export { PulseOverlay } ...` 행 제거 + ChoiceCard 코멘트 정리
  - typecheck 1회 + grep "ChoiceCard\|PulseOverlay" 0 hit 확인
- (사이클 X = MOTION_TOKENS legacy alias 제거는 M6 권고 — pre-audit §2 정합)
- 책임: **frontend**, 예상 0.1 인-day

### W18 D-4 (2026-06-11 목) — P1.1 Counter + P1.2 Toast 병렬 dispatch

#### P1.1 NumberCounter (Animated)
- [ ] `swarm-handoff-p1/03-REFERENCE/components/NumberCounter.tsx` 채택
- [ ] `apps/mobile/src/components/d022/NumberCounter.tsx` 신규
- [ ] `apps/mobile/app/lesson/complete.tsx` 통합 — `{N} words nailed.`의 N을 0→N 카운트업 (motion.count 900ms)
- [ ] **Home stats card / paywall은 정적 유지** (디자이너 Q-2 §3.3 정합)
- 책임: **frontend**, 예상 0.2 인-day

#### P1.2 Toast (Reanimated)
- [ ] `swarm-handoff-p1/03-REFERENCE/components/Toast.tsx` 채택 (디자이너 Q-3 수정 반영 `persistent` 분기 포함)
- [ ] `apps/mobile/src/components/d022/Toast.tsx` 신규 (Provider + hook 패턴)
- [ ] **3-tier 우선순위 + max 3 stack** 구현
- [ ] **action 있는 error toast는 auto-dismiss 금지** (디자이너 Q-3 수정)
- [ ] **차단성 결제 에러는 toast가 아닌 기존 `Alert` 유지** (디자이너 Q-3 추가 가드)
- [ ] WORKLET_GUIDE §7 Toast 패턴 정합
- [ ] PR 체크리스트 C1~C8 (worklet guide §9) 자가 확인 후 첨부
- 책임: **frontend**, 예상 0.4 인-day

### W18 D-5~7 (6/12 금 ~ 6/14 일) — P1.3 Badge + 미니 통합

#### P1.3 StreakBadge (Animated)
- [ ] `swarm-handoff-p1/03-REFERENCE/components/StreakBadge.tsx` 채택
- [ ] `apps/mobile/src/components/d022/StreakBadge.tsx` 신규
- [ ] `apps/mobile/app/home.tsx`의 streak 7-dot row + fire icon에 통합 — pop + flicker
- 책임: **frontend**, 예상 0.3 인-day

#### W18 종료 — Designer sign-off 요청 (3건: Counter / Toast / Badge)
- [ ] DoD 자가 확인 + screenshot before/after + reduce-motion ON 스크린샷
- [ ] 디자이너 sign-off 요청

---

## 2. W19 일자별 작업 분해 (디자이너 결정 정합)

### W19 D-1~3 (6/15~6/17 월~수) — P1.5 ConfirmSheet (Animated, BottomSheet D-025 재사용)

- [ ] `swarm-handoff-p1/03-REFERENCE/components/ConfirmSheet.tsx` 채택 (BottomSheet wrapper)
- [ ] `apps/mobile/src/components/d022/ConfirmSheet.tsx` 신규
- [ ] **활용처는 Delete account confirm 1건만** (D-031 정합)
  - `apps/mobile/app/settings.tsx`의 Delete account row → ConfirmSheet 통합
- [ ] **Lesson abandon confirm 추가 금지** (D-031 거절 결정)
- 책임: **frontend**, 예상 0.3 인-day

### W19 D-4~5 (6/18~6/19 목~금) — P1.4 PTR (Reanimated, droppable)

- [ ] `swarm-handoff-p1/03-REFERENCE/components/PullToRefresh.tsx` 채택
- [ ] 60fps Profiler 측정 — 결과 sign-off 요청에 첨부 (디자이너 명시)
- [ ] **압박 시 즉시 droppable + M6 이월** (디자이너 Q-2 결정)
- 책임: **frontend + qa**, 예상 0.4 인-day

### W19 종료 — Designer sign-off 요청 (PTR + ConfirmSheet, PTR은 60fps Profiler 첨부)

---

## 3. dispatch 우선순위 매트릭스 (디자이너 결정 정합)

| # | 항목 | dispatch | droppable? | 사유 |
|---|---|---|---|---|
| P1.1 | NumberCounter | W18 D-4 | ❌ | Lesson Complete retention 직접 영향 (디자이너 §3.3 "유일한 감정적 모먼트") |
| P1.2 | Toast | W18 D-4 (병렬) | ❌ | 광범위 활용 (Settings/sync/restore) |
| P1.3 | StreakBadge | W18 D-5~7 | ❌ | Home streak 시각 강화 |
| P1.5 | ConfirmSheet (Delete account만) | W19 D-1~3 | ❌ | BottomSheet D-025 재사용, 0.3 인-day |
| **P1.4** | **PTR** | **W19 D-4~5** | **✅ M6 droppable** | Home 이미 useFocusEffect refetch — 중복. GA를 PTR로 늦추지 말 것 |

---

## 4. 회귀 검증 게이트 (W18 D-1 진입 시 필수)

Reanimated install 직후 D-022~D-029 봉인 컴포넌트 8건 회귀 없음 확인:

- [ ] `pnpm type-check` (0 error)
- [ ] `pnpm -r test` (motion.spec.ts 9 case PASS + 기존 spec 0 regression)
- [ ] lesson 1회 진행 — Notice→Hear→Meaning→Retrieve + StageReveal stagger + MorphingKoreanWord scale + QuizOption shake/spring 모두 정상
- [ ] Home 진입 — NeonButton ripple + Shimmer + Skeleton 정상
- [ ] Settings 진입 — JellySwitch toggle + Haptic 정상
- [ ] (옵션) Lesson Complete + paywall + BottomSheet 검증

**회귀 발견 시**: babel plugin 위치 + cache 무효화 재확인. 미해소 시 ADR-0009 R1 trigger 검토.

---

## 5. 디스패치 프롬프트 (frontend agent 위임 시)

```
[swarm dispatch] M5 W18 D-4 P1.1 + P1.2 병렬 dispatch

선행: ADR-0009 Accepted 봉인 + Reanimated install + 회귀 검증 PASS (W18 D-1)

P1.1 NumberCounter (Animated):
- reference: swarm-handoff-p1/03-REFERENCE/components/NumberCounter.tsx
- 적용: apps/mobile/app/lesson/complete.tsx의 "{N} words nailed."
- duration: motion.count (900ms)
- Home stats / paywall은 정적 유지 (D-031 정합)

P1.2 Toast (Reanimated):
- reference: swarm-handoff-p1/03-REFERENCE/components/Toast.tsx
- 정책: 3-tier (error/user-action/system) + max 3 stack
- 수정: action 있는 error toast는 auto-dismiss 금지 (디자이너 Q-3)
- 가드: 차단성 결제 에러는 toast가 아닌 기존 Alert 유지
- WORKLET_GUIDE §7 패턴 정합 + PR 체크리스트 C1~C8 자가 확인

종료: 디자이너 sign-off 요청 (screenshot before/after + reduce-motion ON)
```

---

## 6. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-06-02 | dispatch 계획 작성 (orchestrator, 자율 사이클 BB) — 디자이너 P1 회신 5건 모두 반영 |
