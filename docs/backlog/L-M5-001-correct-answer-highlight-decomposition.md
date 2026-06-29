# L-M5-001 사전 분해 — 오답 시 정답 미하이라이트

> **상태**: Draft (M5 W18 entry 직전 봉인 권고 — D-032 등재 후 frontend dispatch)
> **작성일**: 2026-06-01 (M4 W17 D-6, orchestrator 사전 분해)
> **출처**: `docs/backlog/M5_LEARNING_QUALITY.md` L-M5-001 (Designer W17 sign-off §4)
> **PRD 영향**: §4 인출 루프 정합성 (D-032 봉인 시 PRD 본문 갱신 권고)
> **ID 이력**: 당초 D-031 사전 예약 → 2026-06-02 D-031을 P1 Lesson abandon confirm 거절 봉인이 선점 → 본 결정은 D-032로 sliding

---

## 1. Learning 관점 — 인출 학습(retrieval practice) 문헌 정합

### 1.1 인출 학습 핵심 원리

**Karpicke & Roediger (2008), "The Critical Importance of Retrieval for Learning"**:
> "After an incorrect attempt, the learner should immediately see the correct answer to enable error-driven encoding."

**Pyc & Rawson (2009), "Testing the retrieval effort hypothesis"**:
- 오답 직후 정답 노출 = "feedback-enhanced retrieval"
- 정답 미노출 시 학습자는 자신의 오답을 정답으로 강화할 위험 ("misinformation effect")

**Hattie & Timperley (2007), "The Power of Feedback"**:
- 효과적 feedback은 3 질문에 답해야: "Where am I going?" / "How am I going?" / "Where to next?"
- 오답 only feedback (현재 dash2zero) = "How am I going?"만 답함 — 불완전

### 1.2 SRS와의 정합

dash2zero의 Leitner 5-stage SRS (C-08, CC2-10):
- 오답 시 stage 감소 (max(1, current-1)) — **수학적 패널티는 적절**
- 단 **시각 피드백이 부재**하면 학습자의 "정답이 뭐였지?" 인지 부담이 다음 카드까지 carry-over
- 다음 카드 진입 시 (chain 내 다음 단어) 이전 카드 정답을 회상하는 인지 비용 = 학습 효율 저하

### 1.3 결론 (learning 검증)

**디자이너 §4 제안 강력 동의**. 표준 인출 학습 패턴에 정합. PRD §4 갱신 권고:
- 현행: "오답 시 색 + glow 변경"
- 개정: "오답 시 사용자 선택 카드 = error + shake + ✕ icon, **정답 카드 = correct-passive (glow만, ✓ icon 없음)**. 정답 카드의 success border가 학습자에게 즉시 정답 노출"

---

## 2. QuizOption v2 사양 (Designer 협업 사전 draft)

### 2.1 State 확장 — 4 → 5

기존 (D-029):
```typescript
type State = "default" | "selected" | "correct" | "incorrect";
```

신규 (D-032, M5 W18 진입 후):
```typescript
type State =
  | "default"
  | "selected"
  | "correct"         // 사용자가 직접 고른 정답 — ✓ spring + glow + Haptic Success
  | "correct-passive" // 사용자가 안 고른 정답이지만 노출 — glow만, ✓ icon 없음, haptic 없음
  | "incorrect";      // 사용자가 고른 오답 — ✕ spring + shake + glow + Haptic Warning
```

### 2.2 시각 디자인 (Designer 사전 협업 권고)

| State | 시각 처리 |
|---|---|
| `default` | surface.card / border.subtle / shadow none |
| `selected` | neon.pink 2px border + glow + tint 8% |
| `correct` | semantic.success 2px border + glow + tint 12% + ✓ spring scale-in (140ms 지연, motion.spring 320ms) |
| **`correct-passive`** | **semantic.success 2px border + glow (✓ icon 미표시, scale-in 없음) + tint 12% — `correct`와 동일하지만 icon 영역 hidden** |
| `incorrect` | semantic.danger 2px border + glow + tint 12% + ✕ spring scale-in + shake (±6px 5-segment 360ms) |

### 2.3 Haptic 정합 (D-024)

- `correct` (사용자 선택): `hapticNotification("success")` 호출
- `correct-passive` (정답이지만 미선택): **haptic 없음** — 사용자의 입력이 아니므로
- `incorrect` (사용자 선택): `hapticNotification("warning")` 호출

### 2.4 Reduce Motion fallback (Q-MOTION-5 정합)

- `correct-passive`는 shake/spring 없음 → reduce motion 추가 분기 불필요. 시각만 (border + glow + tint)

---

## 3. lesson [wordId].tsx state 계산 변경

### 3.1 현재 (D-029)

```typescript
const state = !submitted
  ? isSelected ? "selected" : "default"
  : isSelected
    ? isCorrectOpt ? "correct" : "incorrect"
    : "default";
```

### 3.2 신규 (D-032, M5 W18)

```typescript
const state: QuizOptionState = !submitted
  ? (isSelected ? "selected" : "default")
  : isSelected
    ? (isCorrectOpt ? "correct" : "incorrect")
    : (isCorrectOpt ? "correct-passive" : "default"); // ← 오답 선택 시 정답 카드 노출
```

핵심 변경: `!isSelected && submitted` 분기에서 `isCorrectOpt`이면 `correct-passive` 부여.

### 3.3 영향 평가

- **사용자 정답 선택 시**: 변화 없음 (본인 카드만 `correct`, 다른 옵션은 `default`)
- **사용자 오답 선택 시**: 본인 카드 `incorrect` + **정답 카드 `correct-passive`** (1 카드 추가 시각 변화)
- **백 단계 호환**: state union 확장이라 기존 사용처 무영향. QuizOption 컴포넌트만 `correct-passive` 분기 추가

---

## 4. DECISION D-032 봉인 사전 draft (M5 W18 entry 시점 등재)

```
| 2026-06-08 | D-032 인출 학습 표준 정합 — 오답 시 정답 미하이라이트 봉인 (L-M5-001) — 외부 Lead Designer W17 sign-off §4 신규 백로그 진행. learning 검증 (Karpicke & Roediger 2008 / Pyc & Rawson 2009 / Hattie & Timperley 2007) 통과. PRD §4 인출 루프 갱신: 오답 시 사용자 선택 카드 = error + 정답 카드 = correct-passive (glow만, ✓ icon 없음, haptic 없음). QuizOption State union 4→5 ("correct-passive" 신규). lesson [wordId].tsx state 계산 분기 1줄 변경. Haptic 미발화 정합 (D-024). Reduce Motion 추가 분기 불요. M5 W18 첫 sprint frontend dispatch | learning + designer + orchestrator |
```

---

## 5. 작업 분해 (M5 W18 첫 sprint)

| # | 작업 | 책임 | 예상 시간 | 선행 |
|---|---|---|---|---|
| 1 | PRD §4 인출 루프 갱신 | planner | 0.1 인-day | 없음 |
| 2 | QuizOption v2 사양 디자이너 sign-off | designer | 0.1 인-day | 1 |
| 3 | QuizOption.tsx `correct-passive` state 추가 | frontend | 0.2 인-day | 2 |
| 4 | lesson [wordId].tsx state 계산 분기 변경 | frontend | 0.05 인-day | 3 |
| 5 | __tests__/QuizOption.spec.tsx state 5개 검증 | qa | 0.2 인-day | 3 |
| 6 | SRS golden case 재검증 (회귀 0건) | qa | 0.1 인-day | 4 |
| 7 | D-032 봉인 등재 + PRD §4 갱신 commit | orchestrator | 0.05 인-day | 1~6 |
| | **합계** | | **~0.8 인-day** | |

병렬화 가능: 1+2 (planner + designer 동시) → 3 → 4+5+6 (frontend + qa 동시) → 7

---

## 6. 검증 게이트 (M5 W18 첫 sprint 종료 조건)

- [ ] PRD §4 본문 갱신 (planner + orchestrator 승인)
- [ ] QuizOption v2 visual sign-off (designer)
- [ ] QuizOption state 5개 시각 검증 (storybook 또는 lesson 화면 visual diff)
- [ ] SRS golden 57 cases 회귀 0건 (pnpm eval:srs)
- [ ] D-032 봉인 + DECISION_LOG 등재

---

## 7. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-06-01 | 사전 분해 작성 (orchestrator) — learning 문헌 정합 + QuizOption v2 사양 + state 분기 + DECISION 사전 draft + 작업 분해 7건 + 검증 게이트 |
