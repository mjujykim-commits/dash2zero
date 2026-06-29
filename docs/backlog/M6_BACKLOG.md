# M6 Backlog — Post-GA 보강 항목

- **작성**: orchestrator
- **작성일**: 2026-06-05 (M5 W19 종료 시점, M5 RECAP §8 분해)
- **대상 sprint**: M6 (2026-06-22~ 또는 GA Post 1주)
- **출처**:
  - `docs/handoff/W18-DESIGNER-P1-RESPONSE.md` (Designer Q-2 PTR M6 droppable)
  - `docs/handoff/W18-SIGNOFF-REQUEST.md` §8 / `docs/handoff/W19-SIGNOFF-REQUEST.md` §8 (알려진 한계)
  - `docs/backlog/CLEANUP-MOTION-LEGACY-pre-audit.md` (사이클 X)
  - `docs/adr/ADR-0009-reanimated-adoption.md` (Open Q-1)
- **GA 영향**: 본 backlog 8건 모두 GA critical path 아님. GA 후 progressive 보강.

---

## 0. 한 줄 요약

8건 식별. **P0 0건 (GA blocker 없음)** + P1 3건 (사용자 가치 영향) + P2 5건 (정합/내부). M6 entry 시 P1 우선 분해 권고.

---

## 1. 우선순위 매트릭스

| ID | 항목 | 우선순위 | 작업 분량 | 의존성 |
|---|---|---|---|---|
| **M6-001** | PullToRefresh **Home stats 사용처 통합 + 60fps Profiler 측정** | P1 | 0.3 인-day + Profiler 0.2 | 없음 (PTR 컴포넌트 D-036 봉인 완료) |
| **M6-002** | PullToRefresh **progress 화면 적용** | P2 | 0.2 인-day | M6-001 정합 검증 후 |
| **M6-003** | ConfirmSheet **2단계 확인 (checkbox "I understand")** | P2 | 0.3 인-day + Designer 권고 sync | Designer sign-off — 2단계 확인 UX 결정 필요 |
| **M6-004** | **Subscription tier 변경 modal** | P2 | 0.5 인-day | **D-031 정합 충돌 가능** — 현재 paywall/store 이동 유지. 디자이너 재요청 시 D-NNN 봉인 후 진행 |
| **M6-005** | **MOTION_TOKENS legacy alias 제거** (6 활성 사용처 마이그레이션 + Designer 재검수) | P2 | 0.5 인-day + Designer 재검수 0.2 | CLEANUP pre-audit §2 사이클 X 정합. D-022~D-029 sign-off visual diff 위험 |
| **M6-006** | **Toast refreshing spinner withRepeat 보강** | P1 | 0.2 인-day | Toast.tsx 기존 봉인. worklet C5 cancelAnimation 정합 필수 |
| **M6-007** | **Toast position 키보드 가림 mitigation** | P1 | 0.3 인-day | iOS Keyboard API + KeyboardAvoidingView wrapper 검토 |
| **M6-008** | Reanimated 워크릿 마이그레이션 정책 재검토 | P2 | 0.2 인-day (ADR 갱신만) | 새 sprint risk 발견 시 ADR-0009 Q-1 재결정 |

**합계**: P1 3건 (~1.0 인-day) + P2 5건 (~1.7 인-day) = **2.7 인-day** (Designer sync 별도)

---

## 2. P1 우선 권고 — M6 entry 첫 sprint (3건)

### M6-001 · PTR Home stats 통합 + 60fps Profiler 측정 (P1)

**왜 P1**: D-036 봉인 컴포넌트의 sign-off 조건이 60fps Profiler 첨부. 사용처 통합 없이는 Profiler 측정 자체가 불가능 → sign-off 미완료 상태 영구화 위험.

**작업 분해**:
1. `apps/mobile/app/home.tsx`:
   - 기존 ScrollView → `<PullToRefresh refreshing={isRefreshing} onRefresh={handleRefresh}>` wrap
   - `handleRefresh`: `setIsRefreshing(true)` → `await summary.refetch()` → `setIsRefreshing(false)`
2. Owner 60fps Profiler 측정:
   - iPhone SE (저사양) 권고
   - Xcode Instruments Core Animation FPS 또는 react-native-performance
3. Designer 결과 첨부 후 sign-off 요청

**예상**: 0.5 인-day (frontend 0.3 + Owner Profiler 0.2)

**결정 사항**: PTR과 useFocusEffect 동시 trigger 시 race 검토. Owner 결정 필요 — Owner 결정 시 즉시 dispatch 가능.

### M6-006 · Toast refreshing spinner withRepeat (P1)

**왜 P1**: 현재 indicator는 pull progress 마지막 값에 멈춤 (refreshing=true 동안 정적). UX 표준은 회전 지속.

**작업 분해**:
1. `Toast.tsx`에 refreshing prop 분기 추가 → withRepeat(rotate 0→360) loop
2. cancelAnimation cleanup (worklet C5 정합)
3. Reduce Motion 시 정적 (기존 패턴)

**예상**: 0.2 인-day

### M6-007 · Toast position 키보드 가림 mitigation (P1)

**왜 P1**: 현재 Toast position `bottom: 32` 고정 — 키보드 표시 시 가림. Settings의 이메일 입력 같은 form 화면에서 toast 미노출 위험.

**작업 분해**:
1. `Toast.tsx`의 ToastProvider `<View>` wrapper에 `useKeyboard()` hook 또는 `KeyboardAvoidingView` 적용
2. iOS keyboard height 추적 → bottom dynamic 조정 (worklet 또는 JS)
3. Android: keyboard event listener

**예상**: 0.3 인-day. 단 iOS/Android 분기 + 회귀 검증 필요.

---

## 3. P2 그룹 — M6 후속 또는 별도 sprint

### M6-002 · PTR progress 화면 적용 (P2)
- M6-001 정합 검증 후 동일 패턴 적용. 작업 분량 0.2 인-day.

### M6-003 · ConfirmSheet 2단계 확인 (P2)
- Reference §99 "M6 검토" 명시. Delete account 등 파괴적 작업에 추가 안전망.
- **Designer 권고 sync 필수** — UX 결정 (checkbox "I understand" 또는 typed confirmation "DELETE")
- 작업 분량 0.3 인-day + Designer 0.2

### M6-004 · Subscription tier 변경 modal (P2 / 보류)
- **D-031 정합 충돌 가능** — 현재 paywall/store 이동 유지가 정합. 디자이너가 재요청하면 D-NNN으로 봉인 후 진행
- **현재 권고: 보류** (디자이너 명시 재요청 없으면 GA 후 user feedback 기반 재검토)

### M6-005 · MOTION_TOKENS legacy alias 제거 (P2)
- CLEANUP pre-audit §2 사이클 X 분해 명시
- 6 활성 사용처 (NeonButton/Shimmer/JellySwitch/BottomSheet/AudioButton/useMotionPress) 마이그레이션
- 신규 token 추가 (motion.shimmer / motion.audio.* / motion.pressed-scale)
- **Designer 재검수 부담** — D-022~D-029 sign-off 8건 visual diff 위험
- 작업 분량 0.5 인-day + Designer 0.2

### M6-008 · Reanimated 워크릿 마이그레이션 정책 재검토 (P2)
- ADR-0009 Open Q-1 "never (legacy 영구 유지)" 결정 정합
- M6 신규 sprint risk 발견 시 (예: Reanimated 3.x → 4.x major upgrade) ADR 갱신
- 현재는 trigger 없음 — monitoring only

---

## 4. M6 entry sprint plan 권고 (예상)

| Day | 작업 | 책임 |
|---|---|---|
| W21 D-1 | M6-001 PTR Home 통합 + Owner Profiler 측정 | frontend + Owner |
| W21 D-2 | M6-006 Toast withRepeat + M6-007 Keyboard 가림 mitigation | frontend |
| W21 D-3 | W21 sign-off 요청서 (M6-001/006/007 3건) | orchestrator |
| W21 D-4~5 | (선택) M6-002 progress PTR + M6-003 Designer sync | frontend + Designer |
| W22+ | M6-005 MOTION_TOKENS cleanup (Designer 재검수 후) | frontend + Designer |

---

## 5. GA 영향 평가 (정직 보고)

본 backlog **8건 모두 GA blocker 아님**:

- M6-001/002 (PTR): D-036 droppable 정합 — 미통합 상태로 GA 가능
- M6-003 (2단계 확인): Reference §99 "M6 검토" — Designer 자체 권고
- M6-004 (Subscription tier modal): D-031 정합 충돌 — paywall/store 이동 유지가 정답
- M6-005 (MOTION_TOKENS legacy): 백엔드 시그니처 변경 없음, 사용처 정합 OK
- M6-006/007 (Toast): 보강 — 기능은 동작
- M6-008 (Reanimated 정책): monitoring only

→ GA 후보 **6/15 또는 6/22 모두 진행 가능**. M6 backlog는 Post-GA progressive 보강.

---

## 6. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-06-05 | 사전 분해 작성 (orchestrator, 사이클 MM) — M5 RECAP §8 8건 우선순위 분해 + P1 3건 권고 + GA 영향 정직 보고 |
