# M5 학습 품질 라운드 — Backlog

- **작성**: orchestrator
- **수신 일자**: 2026-06-01 (디자이너 W17 sign-off §4 신규 백로그 회신)
- **대상 sprint**: M5 W18~W20 (학습 품질 라운드)
- **책임 협업**: learning + designer + frontend
- **DECISION 등록 의무**: 본 backlog의 각 항목 봉인 시 D-NNN 등재 (PRD §4 인출 루프 정합성에 영향)

---

## L-M5-001 · 오답 시 정답 미하이라이트 (인출 학습 표준 정합)

### 출처
디자이너 W17 sign-off §4 (2026-06-01) — Motion Work Order 검토 중 발견된 학습 설계 이슈. P0 모션 sign-off와 독립.

### 문제 정의
현재 `lesson [wordId].tsx` retrieve 단계 state 계산:

```typescript
const state = !submitted
  ? isSelected ? "selected" : "default"
  : isSelected
    ? isCorrectOpt ? "correct" : "incorrect"
    : "default";
```

→ 사용자가 **오답을 고른 경우**: 그 옵션만 `incorrect`, **정답 옵션은 `default`로 남음**.
→ 학습자가 "그럼 정답이 뭐였지?"를 시각적으로 받지 못함.

gloss 텍스트로 의미는 보이지만, **인출 학습(retrieval practice)의 표준**은 정답 카드 자체를 success로 함께 밝혀주는 것.

### 제안 (디자이너)
- `submitted && isCorrectOpt`이면 선택 여부와 무관하게 **`correct` 상태 부여**
- **✓ spring scale-in은 사용자가 직접 고른 카드에만** (정답이지만 미선택 카드는 glow만)
- 즉:
  - 사용자 정답 선택 → 본인 카드 = `correct` + ✓ spring + glow + Haptic Success
  - 사용자 오답 선택 → 본인 카드 = `incorrect` + ✕ spring + shake + Haptic Warning. **추가로 정답 카드 = `correct-passive` (glow만, ✓ icon 없음)**

### 영향 평가
- **PRD §4 인출 루프 정합성에 영향** → DECISION 등록 대상 (D-NNN)
- QuizOption 컴포넌트에 신규 state `"correct-passive"` 추가 또는 prop `showIcon` 분리
- 학습 효과: 인출 실패 시 정답 즉시 노출 → 다음 카드에서 재인출 정확도 향상 (learning agent 검증 필요)

### 작업 분해 (M5 진입 시)
1. **learning agent**: 인출 학습 문헌(SRS 관련) 정합 검증 — "오답 즉시 정답 노출"이 학습 곡선에 미치는 영향. PRD §4 갱신 권고.
2. **designer**: QuizOption v2 사양 — `correct-passive` 시각 (glow만, icon 없음) + 색 분기
3. **frontend**: state 계산 로직 분기 + QuizOption prop 확장
4. **qa**: golden case (SRS) 회귀 + visual diff
5. **orchestrator**: DECISION D-NNN 봉인 (PRD §4 인출 루프 정합성 영향 명시)

### 우선순위
- **P0** (학습 품질 직접 영향) — M5 W18 entry 첫 sprint 권고

### 관련 SoT
- `docs/product/PRD.md §4` 인출 루프 정합성
- `apps/mobile/src/components/d022/QuizOption.tsx` (현재 D-029 봉인 — 본 backlog 진행 시 갱신)
- `apps/mobile/app/lesson/[wordId].tsx` Quiz 블록 state 계산

---

## CLEANUP-MOTION-LEGACY · M5 cleanup 일괄 (디자이너 §3 B-2 권고)

### 작업 범위
- `apps/mobile/src/components/d022/ChoiceCard.tsx` 파일 삭제 (D-029 @deprecated)
- `apps/mobile/src/components/d022/PulseOverlay.tsx` 파일 삭제 (D-030 @deprecated)
- `packages/design-tokens/src/motion.ts`의 MOTION_TOKENS legacy alias 제거
  (D-023~D-027 봉인 컴포넌트 8건의 마이그레이션 후 — D-029 export 제외분 이미 제거됨)
- d022/index.ts 정리

### 진행 조건
- M5 W18 entry 직후 1 사이클로 일괄 처리 (게이트 진입 직전 churn 회피 — 디자이너 §3 B-2 명시)
- 사용처 0 grep 재확인 + typecheck PASS 후 삭제

### 우선순위
- **P2** (cleanup, 기능 영향 없음) — M5 W18 entry 후 1 사이클

---

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-06-01 | 신규 작성 — 디자이너 W17 sign-off §4 + §3 B-2 회신 반영 (orchestrator) |
