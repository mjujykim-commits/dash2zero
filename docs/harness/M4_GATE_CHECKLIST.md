# M4 Sprint Gate — D-7 사전 양식 (CHECKLIST)

- **책임**: orchestrator (최종 판정) + 각 조건 책임 agent (evidence 첨부)
- **작성일**: 2026-06-01 (M4 W17 D-6)
- **검증 일자**: **2026-06-02 (M4 W17 D-7, M4 종료)**
- **참조**: M3_GATE_V2_CHECKLIST.md 패턴 적용 + Work Order W17 완료 매트릭스
- **SSOT 우선순위**: 본 문서 > sprint plan > DASHBOARD

---

## 0. 한 줄 요약 (D-6 시점)

**3/8 ✅ + 5/8 🟡** (당초 표기) → **4/8 ✅ + 4/8 🟡** (D-030 sign-off 수신 후 갱신, 2026-06-01).
사이클 R 종료 시점 Work Order P0 5건 완성 + Designer Full Sign-off 수신. 잔여 4건은 환경 검증 필요(Owner/CI 영역).

---

## 1. 8조건 D-7 검증 양식

각 조건의 5요소: Evidence 위치 / 검증 명령어 / Pass criteria / Fail action / PASS/FAIL 도장.

---

### 조건 #1 — Work Order P0 5건 코드 완성

- **Evidence**:
  - `packages/design-tokens/src/motion.ts` (duration 9키 + easing 5종 + rnEasing + MOTION_TOKENS)
  - `apps/mobile/src/components/d022/{StageReveal,MorphingKoreanWord,QuizOption,AudioButton,Shimmer}.tsx`
  - `apps/mobile/src/components/d022/NeonButton.tsx` (Ripple + glow brighten)
  - `apps/mobile/src/hooks/useDelayedLoading.ts`
  - `apps/mobile/app/lesson/[wordId].tsx` (4단계 stagger + QuizOption + AudioButton 통합)
  - `apps/mobile/app/home.tsx` (useDelayedLoading + Shimmer)
- **검증 명령어**:
  ```bash
  ls apps/mobile/src/components/d022/{StageReveal,MorphingKoreanWord,QuizOption,AudioButton}.tsx
  ls apps/mobile/src/hooks/useDelayedLoading.ts
  grep -l "MorphingKoreanWord\|StageReveal\|QuizOption" apps/mobile/app/lesson/\[wordId\].tsx
  ```
- **Pass criteria**: 모든 신규 컴포넌트 파일 존재 + lesson screen import 확인
- **Fail action**: 누락 컴포넌트 즉시 재작성
- **D-7 도장**: ✅ **PASS** (사이클 R 종료 사전 충족, 재검증 불필요)

---

### 조건 #2 — `pnpm typecheck` 통과 (전 workspace)

- **Evidence**: 로컬 또는 CI 실행 결과
- **검증 명령어**:
  ```bash
  pnpm type-check  # root: pnpm -r type-check
  ```
- **Pass criteria**: 0 error / 0 warning (또는 D-029 변경분 한정 0 error)
- **Fail action**: 타입 에러 발견 시 즉시 수정 (env 한계 — Owner 실행)
- **D-7 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **Owner 또는 CI** (env 한계)

---

### 조건 #3 — `pnpm test` 통과 (motion.spec.ts 포함)

- **Evidence**: vitest 실행 결과
- **검증 명령어**:
  ```bash
  pnpm -r test
  # 또는 packages/design-tokens만:
  cd packages/design-tokens && pnpm test
  ```
- **Pass criteria**: motion.spec.ts 9 case 모두 PASS + 기존 spec 0 regression
- **Fail action**: D-028/D-029 변경분 정합 확인 (MOTION_TOKENS alias 동기 등)
- **D-7 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **Owner 또는 CI** (env 한계)

---

### 조건 #4 — `pnpm eval:srs` smoke 통과

- **Evidence**: SRS evaluator 결과
- **검증 명령어**:
  ```bash
  pnpm eval:srs
  ```
- **Pass criteria**: SRS golden cases 57/57 PASS (M3 게이트 #2 baseline 유지) + Work Order P0-1/P0-2 변경으로 lesson 흐름 회귀 0건
- **Fail action**: lesson [wordId].tsx 변경분의 stage/cursor 로직 review
- **D-7 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **Owner 또는 CI** (env 한계)

---

### 조건 #5 — Definition of Done §8 4-rule Merge Gate cross-validate

- **Evidence**: `docs/handoff/W17-WORK-ORDER-COMPLETION-REPORT.md §4`
- **검증 방법**: 보고서 §4의 Rule 1~4 PASS/FAIL 표 확인
- **Pass criteria**: 4 Rule 모두 PASS (이미 orchestrator cross-validate 완료)
- **Fail action**: PASS 외 Rule 발견 시 해당 컴포넌트 재작업
- **D-7 도장**: ✅ **PASS** (사이클 R 종료 사전 충족)

---

### 조건 #6 — 외부 Lead Designer Sign-off

- **Evidence**: `docs/handoff/W17-WORK-ORDER-COMPLETION-REPORT.md` 발송 후 Designer 회신
- **검증 방법**: Owner가 외부 Designer에게 보고서 전달 → 회신 양식 4건 중 (1) Sign-off 또는 (2) Conditional Sign-off 수신
- **Pass criteria**: Sign-off (전체 또는 조건부) 수신
- **Fail action**: 변경 요청 시 cycle T 진행
- **D-7 도장**: ✅ **PASS** (Full Sign-off 수신 2026-06-01, D-030 봉인) — 단 조건부 검증 게이트 2건은 §8/§2 A-2로 이전: SE 한글 ≥44px (사전 승인된 0.90 fallback 가능) + reduce-motion 실기 3매

---

### 조건 #7 — qa agent 적대 케이스 (double-tap / fast-cycle / background timeout)

- **Evidence**: qa agent 검증 결과 또는 Owner 실기 테스트
- **검증 방법**:
  - lesson에서 정답 옵션 더블탭 → QuizOption disabled로 무반응 확인
  - 오답 옵션 빠르게 더블탭 → shake 중첩 없음 확인
  - lesson 진행 중 앱 background → 5분 후 foreground → lesson_abandoned 이벤트 정상 발화
- **Pass criteria**: 3 적대 케이스 모두 정상 동작
- **Fail action**: qa cycle T로 분리
- **D-7 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **qa agent 또는 Owner**

---

### 조건 #8 — iPhone SE + iPhone 15 Pro + reduce-motion ON 스크린샷 3매

- **Evidence**: Owner 실기 빌드 결과 스크린샷
- **검증 방법**: 각 P0 항목 (P0-1 lesson stage / P0-2 QuizOption / P0-3 NeonButton ripple / P0-4 Skeleton / P0-5 AudioButton) before/after
- **Pass criteria**: 3 디바이스 환경에서 모션 정상 + reduce-motion fallback 동작 확인
- **Fail action**: 환경별 회귀 발견 시 컴포넌트 재작업
- **D-7 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **Owner 실기 빌드**

---

## 2. D-7 (6/2) 일자별 체크리스트

### D-7 오전 (Owner 실행)
- [ ] `pnpm type-check` 1회 (조건 #2)
- [ ] `pnpm -r test` 1회 (조건 #3, motion.spec.ts 포함)
- [ ] `pnpm eval:srs` 1회 (조건 #4)
- [ ] 외부 Lead Designer에게 `docs/handoff/W17-WORK-ORDER-COMPLETION-REPORT.md` 전달

### D-7 오후 (orchestrator + Owner + Designer)
- [ ] Designer 회신 (조건 #6) 수신 후 판정
- [ ] orchestrator 본 CHECKLIST의 도장 영역 PASS/FAIL 확정 (8/8 또는 부분)
- [ ] Owner 실기 빌드 + 스크린샷 (조건 #8) — 별도 1~2일 가능 (D-7+1 이월 허용)

### D-7 종료 시점 (orchestrator)
- [ ] PASS 5~6/8 시 CONDITIONAL PASS (조건 #6/#7/#8 사후 처리)
- [ ] PASS 7~8/8 시 M4 W17 마감 + M5 W18 진입 권고
- [ ] PASS ≤ 4 시 cycle T 또는 HOLD

---

## 3. 판정 행렬 (PASS 누적 기반)

| PASS 수 | 판정 | 다음 액션 |
|---|---|---|
| 8/8 | **M4 W17 마감 — 게이트 통과** | M5 W18 entry + design system review 문서 §06 P0 status `[x]` |
| 7/8 | **CONDITIONAL PASS** | 1건 mitigation을 M5 W18 첫 sprint에 우선 + Owner 통보 |
| 5~6/8 | **CONDITIONAL HOLD** | 1~2일 보강 후 재판정 |
| ≤ 4/8 | **FAIL** | Owner 결정 — cycle T 진행 또는 일정 재설정 |

---

## 4. Reversal Trigger (게이트 통과 후 ≤ 7일 monitoring)

- **R1** (R-M4-04): `lesson_completed.duration_sec` p95 baseline 대비 +500ms 초과 → StageReveal stagger 60→40ms 단축 또는 비활성
- **R2**: typecheck/test가 D-7 통과 후 ≤ 3일 내 회귀 1건 발견 → 즉시 mitigation cycle
- **R3**: Designer Sign-off 조건부였던 항목이 7일 내 미해소 → cycle T 강제
- **R4**: 실기 스크린샷에서 reduce-motion fallback 미동작 발견 → 해당 컴포넌트 즉시 재작업

---

## 5. 사용자 reconfirm 양식

```
M4 W17 D-7 게이트 판정 결과 (2026-06-02)

조건별 도장:
#1 Work Order P0 5건 코드 완성:    PASS (사전 충족)
#2 pnpm type-check:                 [PASS/FAIL]  Owner 실행 결과
#3 pnpm -r test (motion.spec.ts):    [PASS/FAIL]  Owner 실행 결과
#4 pnpm eval:srs smoke:              [PASS/FAIL]  Owner 실행 결과
#5 4-rule Merge Gate cross-validate: PASS (사전 충족)
#6 외부 Designer Sign-off:           [PASS/CONDITIONAL/PENDING]  Designer 회신
#7 qa 적대 케이스 3건:                [PASS/FAIL]  qa 또는 Owner 검증
#8 실기 스크린샷 3매:                 [PASS/FAIL/PENDING]  Owner 빌드

누적: N/8 PASS

orchestrator 판정: [M4 마감 / CONDITIONAL PASS / HOLD / FAIL]
사유: <1~3 sentence>

다음 단계:
- (PASS 시) M5 W18 entry — backlog 1순위: P1 (number counter / badge pop / pull-to-refresh / toast)
- (HOLD 시) cycle T 작업 N건

Owner reconfirm: [통합 승인 / 부분 수정 / 보류]
```

---

## 6. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-06-01 | D-6 사전 양식 작성 (orchestrator) — 8조건 evidence 양식 + 판정 행렬 + Reversal Trigger |
