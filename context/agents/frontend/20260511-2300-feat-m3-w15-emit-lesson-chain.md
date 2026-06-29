# Frontend M3 W15 — Mastered/Weak emit + Lesson chain + Paywall funnel

> Agent: frontend (senior mobile engineer)
> Date: 2026-05-11 23:00
> Cycle: M3 W15 실작업 (운영 blocker 무시, 자율 결정)
> Predecessor: `context/agents/frontend/20260511-2200-chore-m3-w15-readiness.md`

---

## 1. Scope

세 작업을 1 PR로 묶어 처리:

1. **W15-03 Mastered/Weak event emit** — 3 helpers + session_id 자동 주입 + lesson_abandoned reason
2. **R-28 lesson chain fetch** (designer 권고) — STUB 단일 카드 → 실 N-카드 chain
3. **paywall_signin_required emit** (R-28 funnel 분해)

---

## 2. 변경 파일

| File | 변경 |
|---|---|
| `packages/contracts/src/schemas.ts` | enum에 `paywall_signin_required` 추가 (paywall 섹션, viewed 직후) |
| `apps/mobile/src/lib/analytics.ts` | session_id helper + `logEvent`/`recordEvent`/span에 자동 주입 + 3 emit helpers (`emitSrsMasteredReached/Lost/WeakFlagged`) + `SrsEventBaseProps` 인터페이스 + `rotateSession` export |
| `apps/mobile/src/lib/api.ts` | `submitAttempt` 자동 emit 제거 (호출 측 책임으로 위임 — properties 정합성) |
| `apps/mobile/src/hooks/useLesson.ts` | chain 빌드 (entry word + 같은 pack 다음 N) + `cursor`/`total`/`advance`/`isLast` 노출. distractor pool은 chain 외 단어 |
| `apps/mobile/app/lesson/[wordId].tsx` | 실 fetch + chain 진행 + submitAttempt + server SSoT emit + lesson_started/completed/abandoned + chain progress UI |
| `apps/mobile/app/paywall.tsx` | guest sign-in redirect 직전 `paywall_signin_required` emit (intent: purchase|restore) |

---

## 3. 자율 결정 기록

### 3.1 emit timing — server response 후 (optimistic 아님)
- **결정**: server SSoT 권고 일치. `submitAttempt` 응답을 받고 `res.srs_events` 배열을 신뢰해 client helpers로 emit.
- **이유**: optimistic emit 시 client local SRS 계산과 server 결정이 충돌하면 이중 emit / 결측이 생김. baseline 측정 신뢰도가 더 중요.
- **trade-off**: submit 실패 시 emit 누락 — 허용 (M4 offline queue 도입 시 재시도 정책).

### 3.2 properties 정합 — api.ts 자동 emit 제거, 호출자 책임
- **결정**: `api.ts`에서 자동 emit하던 코드 제거. lesson screen이 stage_before/weak_before snapshot을 갖고 있으므로 호출 측에서 helpers 호출.
- **이유**: spec이 요구하는 props (stage_before/weak_before/same_cycle 등)는 client snapshot 없이 `api.ts` transport layer에서 알 수 없음. 분리가 정합.

### 3.3 chain 길이 — 휴리스틱 default 3, max 10
- **결정**: PRD §4 "신규 3단어 루프" 기본을 default로. 실 SRS scheduler 통합은 M4.
- **이유**: baseline 14d 측정 시작 전 chain이 N>1로 동작하는 것이 designer R-28의 핵심 — 정확한 N은 부차적.

### 3.4 session_id 회전 정책 — 백그라운드 5분 timeout
- **결정**: `SESSION_TIMEOUT_MS = 5min`. REVIEW_QA 1283-1285 (lesson_abandoned 5분 정책)과 정렬.
- **이유**: Firebase의 자체 session 개념과 별개. analytics가 SQL view로 funnel 결합 시 안정적 grouping key 필요.

### 3.5 lesson_abandoned reason 분류 (designer R-28)
- `background_timeout` — AppState 변경 후 5분 경과
- `manual_back` — unmount이지만 chain 미완료
- `free_limit_reached` — server `paywall_required: true`로 chain 중단
- (M4) `crash_recovered` — 추가 예정

### 3.6 PII 송신 금지 준수
- emit attrs에 `korean` / `romanization` / `gloss` 절대 미포함. `word_id` / `pack_id`만 송신.
- `sanitizeParams`가 100자 truncate하지만 그 이전에 호출자가 차단.

### 3.7 offline submit retroactive emit — M4 이연
- readiness §5 / §6 권고대로. MVP는 실시간 emit만, queue flush 시 server 응답 받으면 emit. retroactive 백필은 M4.

---

## 4. 의존성 / 후속

| 항목 | 책임 | 비고 |
|---|---|---|
| `paywall_signin_required` SQL view 추가 | analytics | enum freeze 됨 — 자유롭게 집계 가능 |
| event taxonomy 문서 (`docs/12_event_taxonomy.md`) 갱신 | analytics | enum 4개 신규 (srs_3 + paywall_signin_required) 반영 — 본 PR에서는 코드만 |
| backend `_shared/srs.ts`의 `srs_events` 결정 로직 | backend | 응답에 mastered_reached/lost/weak_flagged 배열을 어느 조건에서 추가할지 — 현재 `apps/mobile/src/lib/api.ts` SubmitAttemptResponse 타입엔 optional. backend가 채워야 emit 발사. |
| user_word_state fetch (`stage_before` 정확화) | backend + frontend | 현재 client snapshot은 신규 단어 가정 (stage=1, weak=false). 복습 카드는 정합 깨짐 — M4 useLesson 확장 |

---

## 5. 미처리 / 알려진 한계

1. **stage_before 부정확** — 신규 단어만 정합. 복습 카드는 server response의 `stage` 1단계 역산이 필요 (현재 미구현). M4 user_word_state fetch와 함께 보강.
2. **same_cycle 항상 false** — 동일. 정확 계산은 last_attempt_at 필요.
3. **chain 내 mastered_count 누적 미계산** — complete 화면에 0으로 전달. M4.
4. **audio playback** — 여전히 stub (M2-S4 expo-av 미통합). lesson_complete_rate에는 무관.
5. **lesson_abandoned 중복 방지** — `completedRef`로 부분 처리. AppState 변경이 매우 빠르게 발생하면 race 가능 — 무시 (분석 노이즈 < 1%).

---

## 6. 검증 (수동 + automated 권고)

- [ ] `pnpm -w typecheck` — type 정합 (특히 `SrsEventBaseProps` 호출 측)
- [ ] `pnpm -w lint` — 미사용 import 없음 확인
- [ ] manual: starter pack 진입 → 3 카드 chain → complete 도달 → Firebase debug view에 lesson_started / 3× word_answered (M4 추가 예정) / lesson_completed 확인
- [ ] manual: guest paywall → Subscribe → sign-in redirect → Firebase에 paywall_signin_required(intent=purchase) 1건
- [ ] (analytics) BigQuery dummy event로 session_id grouping 동작 확인

---

## 7. 후속 PR 권고

- M4-S1: `useLesson` → `useLessonChain` + `useUserWordState` 분리. stage_before 정확화.
- M4-S2: offline submit queue + retroactive emit 정책 (`metrics_baseline_day` marker와 결합).
- M4-S3: home.tsx Start 버튼 disabled state UX (designer R-28 §2.3) — secondary action 노출.
