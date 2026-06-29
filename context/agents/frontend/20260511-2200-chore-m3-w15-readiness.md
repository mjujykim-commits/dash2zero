# Frontend Readiness — M3 W15 진입 자가 진단

> 작성: frontend (senior mobile engineer)
> 일자: 2026-05-11
> 입력: `context/rollups/20260511-M3-W14-evaluators-and-ci.md` §9 W15 작업 큐
> 목적: W15 frontend 책임 항목 (Mastered/Weak emit + baseline event audit + R-15 deep link M3 보강) 진입 가능성 점검

---

## 1. 12항목 자가 진단 체크리스트

| # | 항목 | 상태 | 근거 / 메모 |
|---|---|---|---|
| 1 | analytics.ts logEvent ESSENTIAL_EVENTS 게이팅 정상 | ✅ ready | `apps/mobile/src/lib/analytics.ts` L39-58. `srs_*`는 ESSENTIAL_EVENTS 아님 — 동의 후에만 송신 (PRV-002 적합). |
| 2 | AnalyticsEventName enum에 `srs_mastered_reached` / `srs_mastered_lost` / `srs_weak_flagged` 존재 | ✅ ready | `packages/contracts/src/schemas.ts` L341-344. W14 commit으로 이미 contract 측 추가됨. |
| 3 | leitner.ts 전이 결과에서 mastered/weak 변경 검출 가능 | ✅ ready | `applySrsTransition` 반환 `mastered_at`, `weak`, `stage` 비교로 client-local 검출 가능. |
| 4 | lesson submit 경로 (`lesson/[wordId].tsx` → `lesson/complete.tsx`) emit 삽입 지점 | ⚠ partial | `[wordId].tsx`는 stub submit. M2-S5 실 fetch 통합과 함께 emit 추가 필요. |
| 5 | useLesson 훅이 SRS 전이 결과 노출 | ❌ gap | 현재 `useLesson`은 word fetch만; submit/SRS 전이는 별도 hook 미존재. submitAttempt mutation hook 신설 필요. |
| 6 | home.tsx daily summary가 mastered_count 변화량 표시 | ⚠ partial | STUB_TODAY만 사용. `useTodaySummary` hook 통합 미완. |
| 7 | TraceCollector firebaseTraceCollector 동작 | ✅ ready | `analytics.ts` L80-103. `recordEvent`/`startSpan` 둘 다 logEvent 매핑. |
| 8 | snake_case + Firebase reserved name 회피 정책 | ✅ ready | `srs_*` prefix는 GA4 reserved 충돌 없음 (확인). |
| 9 | 동의 전 essential 송신 화이트리스트 정합 | ✅ ready | srs_* / metrics_baseline_day는 비필수 분기 — 정상. |
| 10 | offline submit queue → emit 정합 (네트워크 복구 시 retroactive emit?) | ❌ gap | 현재 offline submit queue 자체가 미구현. emit 시점 정의가 동기화 시점 결정에 따라 달라짐. |
| 11 | R-15 (rollup의 merge-guest SRS 재계산) M3 보강 가능성 | ⚠ partial | server SoT — `triggerGuestMergeIfNeeded` (`useLesson.ts` L120-) wire는 있으나 server-side stage 재계산 검증 evaluator 부재. |
| 12 | R-17 (Magic Link Universal/App Link 외부 동작) M3 보강 | ⚠ partial | AASA + assetlinks.json 정적 검증 완료. 실제 클릭 → 앱 오픈 e2e 자동 검증은 미수행 (외부 작업 필요). |

요약: **12항목 중 5 ✅, 5 ⚠, 2 ❌.** Mastered/Weak emit 자체는 contract/transport 모두 ready, lesson submit hook 통합과 offline queue 정의가 진입 차단 아닌 ⚠ 항목.

---

## 2. Mastered/Weak measurement event emit 설계

### 2.1 발사 위치 결정

| Trigger | 화면 | 시점 | 비고 |
|---|---|---|---|
| `srs_mastered_reached` | `lesson/[wordId].tsx` submit handler | server submitAttempt 응답에서 `mastered_at` 새로 set + 이전 stage<5 일 때 1회 | server 응답 권위 (SSoT). client local 계산은 fallback. |
| `srs_mastered_lost` | 동상 | 응답 stage가 4이고 직전 stage===5 였을 때 (CC3-05 보호 발동) | Mastered 이탈 명시. weak는 false 유지. |
| `srs_weak_flagged` | 동상 | 응답 `weak=true` 새로 set (직전 false) | same-cycle 2연속 오답 시. |
| (옵션) `srs_weak_cleared` | — | 정답으로 weak 해제 | enum에 미정의 — 추가 여부는 analytics 결정. **차단 아님.** |

**원칙**: lesson complete 화면 (`lesson/complete.tsx`)이 아니라 **submit 직후** emit. complete 화면은 daily aggregate 표시일 뿐 attempt 단위 정합 어려움. complete에는 `lesson_completed` (이미 enum 존재) 1회만.

### 2.2 스키마 후보

```ts
// 모두 device 시각 ts + word_id + 전이 컨텍스트
attrs:
  word_id: string            // 'w-st-011-사과'
  stage_before: 1..5
  stage_after: 1..5
  weak_before: boolean
  weak_after: boolean
  same_cycle: boolean        // CC3-05 진단용
  pack_id: string            // 'starter-en-001' — cohort cut
  is_review: boolean         // false=신규, true=복습
  // PII 금지: korean glyph / gloss / romanization 송신 금지
```

W15 commit 시 SRS evaluator golden case에 본 emit 검증을 추가하지 않는 이유: client-only event이며 server SoT는 별도 audit_log로 covered.

---

## 3. baseline metrics 측정용 추가 클라이언트 이벤트 audit

rollup §6의 baseline 4지표 vs 현 enum:

| 지표 | 필요 client event | enum 보유? | gap |
|---|---|---|---|
| Day-3 retention | `app_open` (DAU 기반) + user_id stable | ✅ | 없음. server-side cohort SQL로 계산 가능. |
| Day-1 streak 유지율 | `lesson_completed` + day_offset 산출 가능 | ✅ | 없음. server에서 user_word_state 조회로도 가능. |
| lesson_complete_rate | `lesson_started` ÷ `lesson_completed` | ✅ | 없음. 단 abandoned 사유 (close vs background timeout) 구분 필요 시 attrs 보강. |
| paywall_view → purchase 전환 | `paywall_viewed` → `subscription_purchase_succeeded` | ✅ | 없음. 단 동일 session_id 결합이 server-side로 된다는 가정 — `session_id` 항상 attach 되는지 확인 필요 (현 logEvent는 미주입). |

**필요 추가 client event: 0건.** 단 다음 2개 보강은 W15 내 권고 (차단 아님):
- `logEvent` 호출에 `session_id` 자동 주입 (현재 schema attrs 옵션이지만 실제 주입 path 없음).
- `lesson_abandoned`에 `reason`(`background_timeout` | `manual_back` | `crash_recovered`) attr 추가 — abandoned vs completed 구분 정밀도 ↑.

---

## 4. R-15 deep link M3 처리 가능성

`context/SWARM_LEDGER`/M2 rollup 기준 **R-15는 두 의미로 혼용** 중:
- (a) M2 rollup §Risks: "merge-guest SRS stage 정확 재계산" — open, M3 보강
- (b) 사용자 prompt 표현: "Magic Link Universal/App Link 검증" — 실제로는 R-17

**(a) merge-guest SRS 재계산**: `apps/api/edge-functions/merge-guest`가 server SoT. M3 W15에서 SRS golden 28건 추가 시 *guest-merge replay* 시나리오 (예: 게스트 5건 attempt 중 stage 5 도달 → 가입 시 stage 정확 복원) 1-2건을 SRS-051~052 로 추가 권고. **M3 내 처리 가능.**

**(b) Magic Link Universal/App Link**: AASA / `assetlinks.json` 정적 파일 + `app/auth/callback.tsx` 라우팅은 이미 존재. 실제 동작은 (i) 실 도메인 hosting + (ii) 실 device build + (iii) 실 메일 클라이언트에서 클릭 — 3 prerequisite 모두 환경 의존. **M3 내 자동화 검증은 불가**, M3에서는 (i) callback.tsx route guard 단위 테스트 (ii) AASA/assetlinks 정합 정적 lint 추가까지가 최선. e2e는 alpha TestFlight/Internal track 진입 후로 이연.

---

## 5. 차단 / 의존성

| 항목 | 종류 | 차단? |
|---|---|---|
| submitAttempt mutation hook 신설 | 자체 작업 | 아니오 — emit 작업과 함께 1 PR로 처리 가능 |
| offline submit queue 정의 | analytics + backend 협업 | **부분 차단** — emit "언제" 발사할지 결정 필요. queue flush 시점에 retroactive emit 할지 vs 실시간만 할지. **권고: MVP는 실시간만 (queue flush 시 server 응답 받으면 emit), retroactive는 M4.** |
| `session_id` 주입 path | 자체 작업 | 아니오 |
| guest-merge SRS golden 추가 | analytics + qa | 아니오 (frontend는 hook 정합만 검증) |
| Magic Link e2e | external (TestFlight) | M3 처리 불가 — M4 alpha 단계 이연 권고 |

**결론: W15 진입 차단 없음.** Mastered/Weak emit + session_id 주입 + lesson_abandoned reason 보강을 1 PR로 묶는 것 권고.
