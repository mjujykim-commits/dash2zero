# Rollup — 핵심 기능 개발 자율 사이클 (디자인 외부 검토 동안)

> **일자**: 2026-05-20
> **트리거**: 사용자 명시 "외부 디자인 전문가에게 검토를 요청했습니다. 그동안 우리는 핵심 기능 개발에 집중합시다."
> **선행**: D-022 frontend 13 .tsx 적용 완료 (사용자 외부 검토 진행 중)

---

## 1. 사이클 개요

디자인 외부 검토 진행 동안 핵심 기능 개발 6건 자율 진행. 사용자 학습 흐름의 완성도 + 데이터 무결성 + 결제 funnel 정확도 + retention 메커니즘에 집중.

---

## 2. 산출물

### 2.1 Task #68 — lesson에서 report entry point
- `app/lesson/[wordId].tsx` 상단 bar 신설:
  - ← Back (left) + "Card N of M" (center) + ⚐ report (right)
  - ⚐ 탭 시 `/report/${wordId}`로 push (CC2-15 정합)
  - hitSlop 8 적용 (a11y)
- "Step N of 4" stage indicator 명확화 (이전 "N of 4"는 의미 모호)

### 2.2 Task #69 — 학습 통계 화면 (mastered/weak words)
- 신규 `apps/mobile/src/hooks/useWordProgress.ts`:
  - 게스트: SQLite `guest_uws` query + content manifest in-memory join
  - 인증: RPC `get_word_progress` (M4 W17 backend 신설 예정, 현재는 빈 fallback)
  - mastered (stage=5, !weak) / weak (weak=true) 분리
- 신규 `app/progress.tsx`:
  - 상단 statsRow: mastered count (neon.lime) + weak count (neon.pink)
  - MASTERED 섹션 + NEEDS REVIEW 섹션 — FlatList 렌더
  - 빈 상태 카피 (mastered: "Reach Stage 5...", weak: "🎉 No weak words right now.")
  - useFocusEffect refetch — lesson 후 복귀 시 즉시 갱신
- `app/settings.tsx`: LEARNING 섹션 신설 (neon.cyan) — "Your progress" 진입
- `_layout.tsx`: progress 화면 Stack 등록

### 2.3 Task #70 — Reminder 시간 사용자 선택 UI
- `app/settings.tsx` NOTIFICATIONS 섹션 확장:
  - 4 preset chip (7 AM / 9 AM / Noon / 7 PM) — frictionless, time picker 라이브러리 불필요
  - 선택 chip은 neon.lime border 2px + glow background (D-022 정합)
  - reminder.enabled + permStatus=granted 조건일 때만 chip row 표시
- `handleReminderTime(hour)` → `setReminderPreference` (자동 reschedule)

### 2.4 Task #71 — Audio prefetch (latency 0 보장)
- `src/lib/audio.ts` 확장:
  - `prefetchAudio(uri)` — Sound.createAsync({ shouldPlay: false }) 후 cache Map 적재
  - `prefetchCache` — Map<uri, CachedSound> + PREFETCH_LIMIT=6 LRU eviction
  - `clearAudioCache()` — chain 종료 시 전체 unload
  - `playAudio()` cache hit 분기 — 즉시 재생 (setPositionAsync(0) + playAsync)
  - `stopAudio()` cache 항목 보존 (다음 재생 재사용)
- `app/lesson/[wordId].tsx`:
  - cursor 변경 시 현재 카드 + 다음 카드 audio 백그라운드 prefetch
  - unmount 시 clearAudioCache (메모리 보호)

### 2.5 Task #72 — lesson chain length 동적 조정 (PRD §4 정합)
- `app/home.tsx` handleStart:
  - chain length = `max(3, remaining_new + reviews_due)` 또는 `min(requested, maxChain)`
  - maxChain = isPremium ? 15 : 10
  - `router.push(/lesson/${wordId}?chain=${chainLength})`
- `app/lesson/[wordId].tsx`:
  - useLocalSearchParams에 `chain?: string` 추가
  - useLesson에 chainLengthParam 전달
- `src/hooks/useLesson.ts`:
  - MAX_CHAIN_LENGTH 10 → 15 (PRD: premium up to 15)

### 2.6 Task #73 — paywall funnel measurement 분기 보강
- `app/paywall.tsx` handlePurchase:
  - 기존: `paywall_viewed` + `plan_selected`
  - 추가: `purchase_started` / `purchase_cancelled` / `purchase_failed` (error attr) / `purchase_completed`
- M3 게이트 #4 baseline KPI `paywall_view_to_purchase` 측정 정확도 향상

---

## 3. 결정 적용

- **CC2-15** (content reporting): lesson screen 상단 ⚐ entry → /report/[wordId] (J-006 정합)
- **PRD §4** (lesson chain): 무료 3~10 / premium 5~15 동적 적용
- **CC2-25** (audio): prefetch는 자동 재생이 아니라 latency 0 보장만
- **FE-NEW-004** (audio cache): 1차 메모리 cache (6 entry LRU). M4 W17에 디스크 cache 추가 권고
- **Q-DA-DOC-007** (paywall funnel): 4 추가 이벤트로 funnel 정확도 향상

---

## 4. 미해소 (M4 권고 또는 backend 정합 필요)

- **NetInfo 기반 online 감지** — 현재 AppState active만으로 retry queue flush. @react-native-community/netinfo 추가 시 online 전이 감지 가능 (P1)
- **dailylimit hint** — 사용자가 day 마지막 무료 단어에 도달했을 때 inline note. submitAttempt 응답 daily_usage 정합 필요 (M4 backend)
- **i18n locale 전환** — UI 영문 only. M5 또는 그 이후 (PRD scope)
- **get_word_progress RPC** — 인증 사용자 progress 데이터 backend 미구현. M4 W17 backend 신설 권고
- **Audio 디스크 cache** — 현재 메모리만. 100MB LRU 디스크 cache는 M4 W17 (FE-NEW-004 잔여)
- **SE 320pt overflow** — text.word 64px / text.hero.ko 88px가 SE에서 overflow 가능. responsive 분기 (88 → 64 → 48) 권고

---

## 5. 본 세션 누적 작업 (총 12 사이클)

D-022 frontend 적용 (이전) + 본 세션 6 자율 사이클 + W16 D-2 + 4 user-value 사이클:

| # | Task | 카테고리 |
|---|---|---|
| 1 | D-022 13 .tsx (#62) | 디자인 |
| 2 | Home 실 데이터 (#63) | 데이터 wiring |
| 3 | 게스트 학습 흐름 (#64) | 데이터 무결성 |
| 4 | Notifications (#65) | retention |
| 5 | Offline retry queue (#66) | 데이터 무결성 |
| 6 | M3 W16 D-2 dry-run (#67) | 게이트 |
| 7 | lesson report entry (#68) | UX 완성도 |
| 8 | Progress 화면 (#69) | UX 완성도 |
| 9 | Reminder time chip (#70) | retention |
| 10 | Audio prefetch (#71) | 학습 흐름 |
| 11 | Lesson chain dynamic (#72) | 학습 흐름 |
| 12 | Paywall funnel 보강 (#73) | conversion |

---

## 6. 다음 게이트

### 자율 진행 가능
- **NetInfo 통합** (P1, 의존성 추가 필요)
- **M3 W16 D-3** ADR-0007 architect 회람 (시뮬레이션 5/21)
- **SE responsive size** (text.word/hero.ko 88→64→48 분기)

### 사용자 결정 권고 시점
- 외부 디자인 검토 결과 수신 후 → D-022 보강/롤백 결정
- 사용자 device install + 본 세션 작업 시각 확인

### 사용자 권한 필요
- `pnpm --filter @dash2zero/mobile install` — expo-secure-store + expo-crypto + 기존 expo-blur/linear-gradient/status-bar
- `expo run:ios` / `run:android` — 사용자 device screenshot
