# P1 Work Order — 발주 요청 (W18 사전 dispatch)

- **수신**: Lead Designer (외부, design system 프로젝트 owner)
- **발신**: dash2zero Swarm Coding Orchestrator
- **작성일**: 2026-06-01 (M4 W17 D-6, 야간)
- **참조**:
  - `docs/handoff/W17-DESIGNER-SIGNOFF.md` §7 (P1 진행 승인 + ADR 사전 요구)
  - `dash2zero Design System/swarm-handoff/01-WORK-ORDER.md` §10 (P1/P2 미리보기)
  - `docs/adr/ADR-0009-reanimated-adoption.md` (Conditional Accept — 회람 완료)
  - `docs/architecture/REANIMATED_WORKLET_GUIDE.md` (사전 작성 완료)
- **Owner 전달**: mju.jykim@gmail.com → Lead Designer (2026-06-02 R-M5-01 reconfirm 시점)
- **목적**: P1 Work Order 패키지 발행 시 dash2zero 측 우선순위 + 의존성 + 일정 사전 공유

---

## 0. 한 줄 요약

W17 P0 5건 Full Sign-off 받았고, 사전 의존성 (ADR-0009 회람 + worklet 가이드 + cleanup grep) 완료. **P1 Work Order 패키지 발주 준비 완료** — 디자이너 의도 외 dash2zero 측 우선순위 5건 + 일정/의존성 명시.

---

## 1. dash2zero 측 P1 우선순위 (협의 요청)

W17 Work Order §10 + Designer Sign-off §7에서 명시된 P1 5건에 대해 dash2zero가 본 sprint(M5 W18)에서 가장 학습 가치/사용자 체감 효과를 정량 평가한 결과:

| # | P1 항목 | dash2zero 우선순위 | 사유 |
|---|---|---|---|
| 1 | **Number counter** (StatCard.value 카운트업) | P1.1 (highest) | Lesson Complete 화면에서 즉시 활용. "+N words mastered" 카운트업이 도파민 강화 — 학습 retention 직접 영향 |
| 2 | **Toast 시스템** (현재 Alert.alert 대체) | P1.2 | Settings (Haptic toggle / Reminder time) + sync flow + paywall restore 등 다수 화면에서 즉시 활용. 사용자 체감 광범위 |
| 3 | **Badge pop + flame flicker** (streak fire icon) | P1.3 | Home 화면의 streak 시각 강화. retention 자극 — 단 streak 7일 미만 사용자에게는 효과 제한적 |
| 4 | **Pull-to-refresh (PTR)** | P1.4 | Home 화면 stats / progress 화면. iOS 사용자에게 익숙한 패턴이라 학습 곡선 0 — 다만 현재 useFocusEffect refetch가 있어 시급성 낮음 |
| 5 | **Modal sheet 활용 사례** | P1.5 | BottomSheet 컴포넌트는 D-025 봉인. 사용 사례 (Delete account confirm / Subscription tier 변경 / Lesson abandon confirm) 디자이너 권고 필요 |

### 1.1 권고 dispatch 순서 (W18~W19)

```
W18 D-1~3: P1.1 Number counter + Toast 시스템 (병렬 가능 — 의존성 없음)
W18 D-4~5: P1.3 Badge pop + flame flicker (counter 패턴 재사용 가능)
W19 D-1~3: P1.4 PTR (의존성 — ADR-0009 Reanimated install 선행)
W19 D-4~5: P1.5 Modal sheet 활용 사례 (BottomSheet 기반 화면 3건 결정)
```

→ **2 sprint (W18+W19) 분할 dispatch 권고**. W18은 단순 P1 3건, W19는 Reanimated 의존성 항목.

---

## 2. 의존성 사전 준비 (orchestrator 완료)

### 2.1 ADR-0009 react-native-reanimated 도입 (Designer §7 요청)
- 상태: **Conditional Accept** (회람 완료)
- 위치: `docs/adr/ADR-0009-reanimated-adoption.md`
- Open Questions 3건 결정 완료:
  - Q-1 점진적 마이그레이션: **"never (legacy 영구 유지)"** — D-027/D-030 sign-off 보존
  - Q-2 babel plugin 빌드 시간: 측정 + +5%/+10%/+20% 임계
  - Q-3 worklet 가이드 작성: M5 P1 dispatch 직전 W18 D-3 → **사전 작성 완료** (아래 2.2 참조)
- M5 W18 entry 시 Accepted 봉인 + babel.config.js plugin 추가 + Reanimated 3.10+ install

### 2.2 worklet 사용 가이드 (Designer §7 권고)
- 상태: **Draft (사전 작성)**
- 위치: `docs/architecture/REANIMATED_WORKLET_GUIDE.md`
- 10 섹션: useSharedValue 패턴 + worklet runtime 제약 + cancelAnimation cleanup + babel plugin 위치 + 모션 토큰 공유 + Rule 5 (worklet layout 속성 금지) + Toast/PTR 권고 + PR 체크리스트 C1~C8
- frontend agent + qa agent가 P1 dispatch 시점 즉시 참조 가능

### 2.3 D-022 K-pop Bold 디자인 토큰
- `packages/design-tokens/src/motion.ts` D-028로 duration 9키 + easing 5종 + rnEasing 완성
- P1 항목 모두 기존 토큰으로 구현 가능
- 단 **counter 999~1000 같은 큰 수 카운트업**의 duration이 motion.count (900ms)로 충분한지 디자이너 검토 필요 — 100ms 미만 차이의 카운트업은 시각 인지 어려움

---

## 3. dash2zero 측 우려/협의 사항 (4건)

### 3.1 Toast 시스템 — 다중 toast 우선순위 정책

Designer Sign-off §회람 의견 §2에서 "다중 toast queue가 동시 visible일 때 z-index/stacking 순서가 visual diff 검수 단계에서 발견될 수 있음. P1 dispatch 시 toast 우선순위 정책 (system / user-action / error) 별도 명시 권고" 명시. 우리 측 권고:
- **error (Apple/Google IAP 실패 등)**: 즉시 표시, 5s 노출, **다른 toast 위 stacking (z-index 999)**
- **user-action (sync 완료 등)**: queue, 3s 노출
- **system (push notification opt-in 등)**: queue, 3s 노출
- Max 3 stack — 4번째 toast는 queue 대기 후 표시

P1 Work Order에 위 정책 포함 부탁드립니다.

### 3.2 Modal sheet 활용 사례 — 디자이너 의도 결정 필요

BottomSheet 컴포넌트(D-025)는 이미 봉인됐지만, **현재 modal 사용처 0건**. P1.5에서 어떤 화면에 BottomSheet 적용할지 디자이너 의도 필요:
- 후보 A: Delete account confirm (현재 Alert.alert 사용)
- 후보 B: Subscription tier 변경 알림 (현재 미구현)
- 후보 C: Lesson abandon confirm (현재 자동 이벤트만 emit, modal 없음)
- 후보 D: 위 3건 모두

dash2zero 권고: **A + C** (가장 활용도 높음). B는 paywall 화면 이동으로 대체 가능.

### 3.3 Number counter — 어디서 활용?

- **확정 (P1.1 진행 권고)**: Lesson Complete의 "{N} words nailed." — 0 → N 카운트업
- **검토 필요**:
  - Home의 stats card (mastered count) — 매 진입마다 카운트업하면 학습 흐름 방해 가능
  - Paywall의 "300+ words" — 정적 표시 적정성
  
→ Lesson Complete 1건만 활성 권고. 나머지는 정적 유지.

### 3.4 Reanimated install 직후 회귀 검증

ADR-0009 Accepted 봉인 + babel.config.js plugin 추가 + Reanimated 3.10+ install 직후:
- 기존 Animated 컴포넌트 8건 (NeonButton/Shimmer/JellySwitch/BottomSheet/AudioButton/StageReveal/MorphingKoreanWord/QuizOption)의 회귀 없음 확인 필요 (Reanimated의 babel transform이 일반 React 코드에 영향 없는지)
- **자동 검증**: `pnpm typecheck` + `pnpm test` (motion.spec.ts 9 case) 0 error
- **수동 검증**: lesson 1회 진행 + Home 진입 + Settings 진입 시 visual diff 0

P1 Work Order의 §종료 게이트에 위 회귀 검증 추가 부탁드립니다.

---

## 4. 일정 권고 (M5 W18 sprint plan)

| Day | 작업 | 책임 |
|---|---|---|
| **W18 D-1 (6/8 월)** | ADR-0009 Accepted 봉인 + babel.config.js plugin + Reanimated install + 회귀 검증 (§3.4) | orchestrator + frontend |
| W18 D-2 (6/9 화) | **D-031 봉인** (L-M5-001 오답 시 정답 미하이라이트, learning 검증 통과) + QuizOption v2 dispatch | orchestrator + learning + designer + frontend |
| W18 D-3 (6/10 수) | **사이클 W cleanup** (ChoiceCard + PulseOverlay 삭제, 0.1 인-day) + P1 Work Order 패키지 수신 시점 진입 | frontend + orchestrator |
| W18 D-4~5 (6/11~12 목금) | P1.1 Number counter + P1.2 Toast 시스템 dispatch | frontend |
| W18 D-6~7 (6/13~14 토일) | P1.3 Badge pop + flame flicker dispatch + W18 종료 게이트 검증 | frontend + qa |
| W19 D-1~5 (6/15~19 월금) | P1.4 PTR + P1.5 Modal sheet 활용 사례 dispatch | frontend + designer + qa |
| **GA 후보**: 2026-06-15 또는 2026-06-22 | R-M5-01 사용자 결정 | Owner |

---

## 5. P1 Work Order 패키지 형식 요청 (W17 동일 포맷)

W17 패키지가 매우 효율적이었습니다. 동일 형식 요청:
- `swarm-handoff/01-WORK-ORDER.md` — 12 섹션 work order
- `swarm-handoff/02-DESIGN-REVIEW/` — 라이브 데모 (index.html + assets)
- `swarm-handoff/03-REFERENCE/components/*.tsx` — 5건 reference 구현

추가 권고:
- W17 §11 "컨텍스트 기록 의무" 동일 유지 (CHANGELOG / Sprint risk / Skill 명시)
- W17 §8 DoD 동일 유지 (typecheck / test / eval:srs / 시뮬레이터 / reduce-motion)
- W17 §1 일관 규칙 5조에 **Rule 5 (Reanimated worklet 전용)** 추가 권고:
  > "worklet 출력 style은 transform + opacity only. layout 속성 (width/height/top/left/margin) 변경 금지."

---

## 6. 회신 양식 (Lead Designer)

다음 4건 중 하나로 부탁드립니다:

```
[1] P1 Work Order 발주 시점 확정:
    "W18 entry (2026-06-08) 또는 그 전 N일까지 P1 Work Order 패키지 발행"

[2] 우선순위 협의 수정:
    dash2zero §1 우선순위 (1~5)에서 변경 권고 N건 명시

[3] 우려/협의 사항 답신 (§3 1~4건):
    Toast 정책 / Modal 활용 사례 / counter 활용 / 회귀 검증

[4] 일정/범위 조정:
    W18+W19 2 sprint 분할이 너무 빠르면 M6 entry로 P1.4/P1.5 이월 권고
```

---

**dash2zero Swarm Coding Orchestrator 드림**

P.S. W17 Work Order 100% 마감 보고서(`docs/handoff/W17-WORK-ORDER-COMPLETION-REPORT.md`)와 Designer Full Sign-off(`docs/handoff/W17-DESIGNER-SIGNOFF.md`)는 이미 보관 완료. 추가 cross-reference 필요 시 지정 부탁드립니다.
