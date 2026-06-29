# Rollup — 기능 개발 사이클: 실 데이터 연결 + audio + 게스트 학습 흐름

> **일자**: 2026-05-20
> **트리거**: 사용자 명시 "이어서 기능 개발 진행해주세요"
> **선행**: D-022 frontend 13 화면 적용 완료 (이전 사이클)

---

## 1. 사이클 개요

D-022 시각 적용 완료 후 실 기능 동작 연결에 집중. 사용자 device 실행 시 학습 흐름이 실제로 끝까지 동작하도록 4건 작업.

---

## 2. 산출물

### 2.1 신규 hook (`apps/mobile/src/hooks/`)
- `useEntryWord.ts` — content-manifest에서 free pack(starter) 첫 단어 word_id 해석. M4 SRS scheduler로 교체 예정 (server `get_next_words` RPC)

### 2.2 Home 실 데이터 연결 (`app/home.tsx`)
- STUB_TODAY hardcoded 데이터 → `useTodaySummary()` hook 연결 (인증 사용자 = get_today_summary RPC, 게스트 = stub)
- "Start →" 버튼 → `useEntryWord()` 기반 실 word_id로 lesson 진입 (기존 `/lesson/w-st-011-사과` 하드코딩 제거)
- ActivityIndicator로 loading 상태 분기
- summary.error 시 "Couldn't refresh today's summary. Showing last known state." inline note
- `useFocusEffect` 적용 — lesson complete 후 router.back/replace 양쪽에서 stats 즉시 refetch

### 2.3 useTodaySummary refetch 안정화 (`src/hooks/useTodaySummary.ts`)
- `refetch`를 useCallback으로 stabilize — useFocusEffect dependency 무한 발화 방지

### 2.4 lesson screen 실 audio + 자동 재생 (`app/lesson/[wordId].tsx`)
- `playAudio()` 통합 — audio button 클릭 시 실제 발음 재생
- Hear stage 진입 시 자동 1회 재생 (UX-NEW-006)
- audioState로 audio button 시각 분기 — loading (Spinner), error (!), playing (glow 강화)
- 카드 전환 + unmount 시 `stopAudio()` 호출 — 중복 재생 방지
- `audio_url_word` null이면 stage 전환만 (graceful fallback, CC2-25)

### 2.5 게스트 학습 흐름 SecureStore 적재 (`app/lesson/[wordId].tsx`)
- handleSubmit에 세션 확인 → 게스트/인증 분기
- 게스트: `recordGuestAttempt` (SQLite + SecureStore queue) + `applyGuestSrs` (client-side leitner.applySrsTransition)
- 게스트도 srs_mastered_reached/lost/weak_flagged 이벤트 발화 (analytics 동의 후만 실 전송)
- 게스트 첫 시도는 `initialUserWordState` 사용

### 2.6 Root layout 초기화 (`app/_layout.tsx`)
- `initAudio()` — iOS AVAudioSession playsInSilentModeIOS=true (Q-FE-NEW-003)
- `initGuestDb()` — SQLite schema + SecureStore device_install_id 발급 (CC-04)

### 2.7 callback 머지 흐름 정합 (`app/auth/callback.tsx`)
- 머지 성공 후 SecureStore queue 삭제 + `clearGuestData()` 추가 — SQLite guest_uws/attempts/daily_usage 정리

---

## 3. 결정 적용

- **CC-04** — 게스트 모드 학습 가능 + sign-in 시 lossless 머지
- **CC-17** — 04:00 로컬 day 기준 (leitner.localDay04)
- **CC2-25** — audio 수동 재생 기본 + null fallback graceful
- **UX-NEW-006** — Hear stage 자동 재생 1회
- **Q-FE-NEW-003** — iOS 무음 스위치 우회 (학습 발음 본질)
- **CC2-04 + R-19** — device_install_id 기반 게스트 머지

---

## 4. 검증 시나리오 (frontend 후속 사이클 또는 사용자 device 검수)

### 4.1 게스트 학습 → 가입 머지 흐름
1. 앱 첫 실행 → onboarding 4 카테고리 선택 → home
2. Start → lesson chain 3 단어 학습 (audio 자동 재생 / quiz submit)
3. 게스트 attempts SecureStore에 누적 (3건)
4. lesson complete → router.replace home → stats 갱신
5. Settings → Sign in → magic link 전송 → callback 처리
6. callback에서 merge-guest 호출 → SQLite + SecureStore 정리 → home으로

**기대**: 가입 후 home에서 streak/mastered가 게스트 학습 분 반영됨 (서버가 머지 후 응답)

### 4.2 인증 사용자 학습 → paywall
1. 인증 + 무료 한도 사용 완료 (3 new / day) → lesson 진입
2. submit-attempt 응답 paywall_required=true
3. lesson_abandoned (reason=free_limit_reached) emit
4. router.replace `/paywall`
5. Subscribe → home으로 (premium=true, 한도 15 new/day)

**기대**: 무료 한도 도달 분기 정상 동작 + paywall 시각 D-022 정합

### 4.3 audio fallback
1. audio_url_word null 또는 fetch 실패
2. Notice 단계에서 audio button 탭 → stage 전환만 (Hear로) — 재생 실패 시 시각 표시 없음 (graceful)
3. Hear 자동 재생도 skip

**기대**: lesson 진행 차단 없음

---

## 5. 미해소 + 차기 사이클 권고

### 5.1 server-side daily usage 갱신 (M3 W16)
- 게스트는 client-side로 SRS state 갱신하지만 daily_usage 한도 enforcement는 client만으로 부족 (어뷰즈 가능)
- Edge Function `merge-guest`가 한도 정합 검증 필요

### 5.2 offline attempt retry (M4)
- 인증 사용자가 네트워크 끊긴 상태로 submit → catch 진입 → 진행만 계속, 데이터 손실
- offline queue + retry hook 추가 권고

### 5.3 useFocusEffect deps 안정화 추가 검증
- 본 사이클에서 `summary.refetch` useCallback wrap. 사용자 device 실행 시 무한 발화 없는지 확인 필요

### 5.4 Audio prefetch (FE-NEW-004)
- 현재 lesson chain audio는 각 단어별 fetchAudioUrls 일괄 호출 후 cache 없음
- chain 첫 단어 학습 중 다음 단어 audio prefetch + LRU 100MB 캐시 (M4 W17 권고)

---

## 6. 의존성 / build 영향

- 신규 dependencies 없음 (이전 사이클 expo-blur/expo-linear-gradient/expo-status-bar 활용)
- 기존 audio.ts / guestStore.ts / leitner.ts는 M2-S5 시점 이미 구현 — 본 사이클에서 wiring만 추가

---

## 7. 작업 통계

| 항목 | 수 |
|---|---|
| 신규 hook | 1 (useEntryWord) |
| 갱신 화면 | 3 (home / lesson / auth/callback) |
| 갱신 layout/hook | 2 (_layout, useTodaySummary) |
| 사이클 |  ~30분 |
| Task 종결 | #63 + #64 |

---

## 8. 다음 게이트 (자율 또는 사용자 결정)

### 8.1 자율 진행 가능
- **A. expo-notifications daily reminder** — privacy choice 후 활성, 4:00 reset 시간대 정합 (retention 핵심)
- **B. offline attempt retry hook** — 인증 사용자 데이터 손실 risk 해소 (M4 권고됐던 작업 가속)
- **C. M3 W16 gate sprint dispatch** — analytics measurement 14-day baseline + srs 이벤트 실 데이터 검증

### 8.2 사용자 확인 권고
- 사용자 device install + run 후 본 사이클 작업 정상 동작 확인 가능 시점

orchestrator 자율 선택: **A → C 순서**로 진행 (retention 메커니즘이 사용자 경험에 직접 영향). 사용자가 추가 우선순위 지시하면 그 방향 우선.
