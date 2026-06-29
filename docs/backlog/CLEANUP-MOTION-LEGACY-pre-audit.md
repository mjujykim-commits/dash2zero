# CLEANUP-MOTION-LEGACY 사전 점검 보고서

> **상태**: 사전 점검 완료 (M5 W18 entry 후 1 사이클 dispatch 시 사용)
> **작성일**: 2026-06-01 (M4 W17 D-6, orchestrator 사전 점검)
> **출처**: `docs/backlog/M5_LEARNING_QUALITY.md` CLEANUP-MOTION-LEGACY (Designer §3 B-2)
> **목적**: 삭제 안전성 사전 검증 → M5 W18 dispatch 시 빠른 실행

---

## 1. 삭제 후보 3건 — 안전성 매트릭스

| # | 항목 | 사용처 grep 결과 | 안전 삭제 | 사유 |
|---|---|---|---|---|
| 1 | `apps/mobile/src/components/d022/ChoiceCard.tsx` | **import 0건** ✅ | ✅ **즉시 삭제 가능** | D-029 이후 QuizOption이 완전 교체. lesson tsx에서 import 제거됨 |
| 2 | `apps/mobile/src/components/d022/PulseOverlay.tsx` | **import 0건** ✅ (index.ts export 1건만) | ✅ **즉시 삭제 가능** (단 index.ts export 먼저 제거) | D-024 봉인 컴포넌트지만 ChoiceCard 폐기 후 사용처 0 |
| 3 | `packages/design-tokens/src/motion.ts` MOTION_TOKENS legacy alias | **import 6건 활성** ⚠️ | ❌ **삭제 불가** | NeonButton/Shimmer/JellySwitch/BottomSheet/AudioButton/useMotionPress 6개 활성 컴포넌트가 사용 중 |

### 1.1 MOTION_TOKENS 사용처 detail (6건 활성)

| 파일 | 사용 토큰 | 마이그레이션 가능? |
|---|---|---|
| `NeonButton.tsx` | `PRESSED_SCALE` | 신규 토큰 추가 필요 (duration에 없음) |
| `Shimmer.tsx` | `SHIMMER_LOOP_DURATION` (1600) | 신규 token 필요 — `duration["motion.shimmer"]`로 확장 권고 |
| `JellySwitch.tsx` | `DURATION_QUICK` + `EASE_BOUNCE` | duration/rnEasing으로 대체 가능 |
| `BottomSheet.tsx` | `DURATION_NORMAL` + `EASE_DECELERATE` | duration/rnEasing 대체 가능 |
| `AudioButton.tsx` | `AUDIO_RING_DURATION` + `AUDIO_SPINNER_DURATION` + `AUDIO_PULSE_HALF` | 신규 token 필요 — `duration["motion.audio.*"]` 확장 권고 |
| `useMotionPress.ts` | `PRESSED_SCALE` + `DURATION_QUICK` + `EASE_BOUNCE` | duration/rnEasing 대체 가능 |

→ **MOTION_TOKENS legacy alias는 M5 cleanup에서 삭제 불가**. 별도 사이클 필요 (6 컴포넌트 마이그레이션 + 신규 토큰 추가 + alias 제거).

---

## 2. 사이클 분해 (M5 W18 dispatch 권고)

### 사이클 W (1 사이클, 즉시 가능) — **본 사전 점검 활용**

작업 분해:
1. `apps/mobile/src/components/d022/index.ts`: `export { PulseOverlay } ...` 행 + ChoiceCard 코멘트 삭제 (0.05 인-day)
2. `apps/mobile/src/components/d022/ChoiceCard.tsx` 파일 삭제 (0.01 인-day)
3. `apps/mobile/src/components/d022/PulseOverlay.tsx` 파일 삭제 (0.01 인-day)
4. `apps/mobile/app/lesson/[wordId].tsx`의 "ChoiceCard → QuizOption" 코멘트 1줄 정리 (선택 — 역사 보존 차원에서 유지 권고)
5. `apps/mobile/src/components/d022/QuizOption.tsx`의 "PulseOverlay 제거" 코멘트 1줄 정리 (선택 — 동일 권고)
6. 의존성 typecheck 1회 + grep "ChoiceCard\|PulseOverlay" 0 hit 확인
7. CHANGELOG.md + DECISION_LOG.md 정리

**예상 소요**: 0.1 인-day (직접 작성, sub-agent spawn 불필요 — D-026 Hybrid Policy 정합)

### 사이클 X (별도, M6+ 권고) — MOTION_TOKENS legacy 마이그레이션

작업 분해:
1. `packages/design-tokens/src/motion.ts`에 신규 token 추가:
   - `duration["motion.shimmer"]` 1600 (Shimmer용)
   - `duration["motion.audio.ring"]` 1400 / `duration["motion.audio.spinner"]` 900 / `duration["motion.audio.pulse-half"]` 700 (AudioButton용)
   - `duration["motion.pressed-scale"]` — 사실 0.96은 numeric 토큰이 아닌 ratio. `MOTION_TOKENS.PRESSED_SCALE`를 별도 export 유지 권고 (alias 외 정식 token)
2. 6 컴포넌트의 `MOTION_TOKENS.*` → 신규 token 1:1 sweep
3. `packages/design-tokens/src/motion.ts`의 MOTION_TOKENS legacy alias 제거
4. `packages/design-tokens/test/motion.spec.ts`의 "MOTION_TOKENS legacy alias" describe 그룹 삭제 (test 4건 제거)
5. typecheck + test PASS 확인

**예상 소요**: 0.5 인-day. **권고 시점**: M6 이후 (또는 P1 dispatch와 분리). D-027 sign-off된 컴포넌트 6건의 visual diff가 발생할 수 있어 designer 재검수 필요.

---

## 3. M5 W18 entry 의사결정 권고

### 3.1 즉시 처리 권고 (사이클 W)
- ChoiceCard + PulseOverlay 2개 파일 삭제 + index.ts 정리 → **0.1 인-day 1 사이클로 처리**
- Designer §3 B-2 권고 "M5 cleanup 사이클" 정합

### 3.2 보류 권고 (사이클 X로 분리)
- MOTION_TOKENS legacy alias 제거 → 6 컴포넌트 마이그레이션 + Designer 재검수 필요
- M5 P1 sprint 외 별도 사이클 권고 (의존성 영향이 P1과 무관)

---

## 4. 사용자 결정 필요 사항 (M5 W18 entry 시)

| Q | 결정 사항 |
|---|---|
| Q-1 | 사이클 W (ChoiceCard + PulseOverlay 삭제)를 M5 W18 entry **즉시 처리** vs P1 dispatch 완료 후? |
| Q-2 | MOTION_TOKENS legacy alias 제거를 M5 W18 (사이클 X 별도) vs M6 이후? Designer 재검수 부담 고려 |
| Q-3 | 사이클 W의 코멘트 잔존 (lesson tsx + QuizOption tsx "ChoiceCard"/"PulseOverlay" 언급) 정리 vs 역사 보존? |

권고 default: **Q-1 즉시 처리 / Q-2 M6 이후 / Q-3 역사 보존**

---

## 5. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-06-01 | 사전 점검 작성 (orchestrator) — 사용처 grep + 안전성 매트릭스 + 사이클 W/X 분해 + 사용자 결정 사항 3건 |
