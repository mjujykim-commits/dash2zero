# Rollup — 핵심 기능 자율 사이클 B (개인화 + 데이터 무결성 + 반응형)

> **일자**: 2026-05-20
> **트리거**: 사용자 명시 "자율 진행" (2회)
> **선행**: `context/rollups/20260520-core-features-cycle.md` (사이클 A)

---

## 1. 사이클 개요

디자인 외부 검토 진행 중. 핵심 기능 4건 추가 자율 진행. 개인화 + 데이터 무결성 + 반응형 + conversion 강화 + retention 시각화.

---

## 2. 산출물

### 2.1 Task #74 — Onboarding motivation 영구 저장 + 개인화
- 신규 `apps/mobile/src/lib/profile.ts`:
  - `getLearningMotivation / setLearningMotivation / clearLearningMotivation` — SecureStore 기반
  - `getMotivationDisplay` — 4 motivation별 emoji + label + greeting 카피
- `app/onboarding.tsx`:
  - handleContinue에서 setLearningMotivation 호출 + `onboarding_completed` 이벤트 발화
  - `?mode=update` 분기 — Settings에서 재진입 시 router.back, first-run 시 router.replace("/home")
  - update 모드는 `learning_motivation_changed` 이벤트
- `app/home.tsx`:
  - useFocusEffect에 motivation 갱신
  - "Today" greeting 아래 motivation별 인사 (예: "🎤 Pick up where your favorite idols left off.")
- `app/settings.tsx`:
  - LEARNING 섹션에 "Learning goal" row 신설 — 현재 motivation emoji + label 표시 + 탭 시 onboarding?mode=update

### 2.2 Task #75 — NetInfo 통합 (offline → online 전이 시 즉시 retry)
- 의존성 추가: `@react-native-community/netinfo@11.3.1`
- 신규 `apps/mobile/src/lib/connectivity.ts`:
  - `onTransitionOnline(callback)` — offline → online 전이만 발화 (캡티브 포털 + isInternetReachable=false 회피)
  - `isCurrentlyOnline()` query helper
- `app/_layout.tsx`:
  - AppState active 외에 NetInfo 전이도 retry queue flush 트리거
  - 인증 사용자만 flush (게스트는 guestStore가 처리)

### 2.3 Task #76 — SE responsive typography (88-64 viewport 분기)
- 신규 `apps/mobile/src/hooks/useResponsiveScale.ts`:
  - 3 tier: small (< 360) / medium (360-412) / large (≥ 412)
  - hero (88→80→64) / word (64→56→48) / display (36→32→28) / heroSuccess (120→100→80)
- 적용 화면 4건:
  - `app/index.tsx` (welcome) — hero 88 동적 + lineHeight 0.95
  - `app/lesson/[wordId].tsx` — text.word + `adjustsFontSizeToFit` + numberOfLines=1
  - `app/lesson/complete.tsx` — heroSuccess check (140→100→80 wrapper) + display
  - `app/paywall.tsx` — display heading + annual price gradient text

### 2.4 Task #77 — daily_usage inline hint (conversion 강화)
- `app/lesson/[wordId].tsx`:
  - submitAttempt 응답 daily_usage에서 무료 한도 도달 직전 분기:
    - 1 word left: "1 free word left today."
    - 한도 도달: "All N free words used today. Upgrade for 15."
  - inline pill chip — neon.pink border + 탭 시 /paywall (paywall_required 분기 외에 hint 단계 conversion)

### 2.5 Task #78 — Home streak history visualization (retention)
- `app/home.tsx`:
  - motivation line 아래 7 dot row
  - streak_days > i 인 dot은 neon.lime background + glow shadow
  - streak > 7일 시 "+N more" 라임 텍스트

---

## 3. 결정 적용

- **CC-04** (게스트 동등 가치): SecureStore motivation은 게스트도 저장
- **PRD §4** (premium 15 vs free 10): daily_usage hint와 chain length 동적 조정 정합
- **CC-09** (Honest disclosure): "1 free word left" / "All N used" 명시 카피 — surprise 없음
- **D-018** (premium positioning): hint chip → /paywall direct push
- **R-19** (offline-safe): NetInfo + AppState 양쪽 retry 트리거

---

## 4. 본 세션 누적 작업 (총 17 사이클)

| # | Task | 카테고리 |
|---|---|---|
| 1 | D-022 13 .tsx | 디자인 |
| 2 | Home 실 데이터 | 데이터 wiring |
| 3 | 게스트 학습 흐름 SecureStore | 데이터 무결성 |
| 4 | Notifications daily reminder | retention |
| 5 | Offline retry queue | 데이터 무결성 |
| 6 | M3 W16 D-2 dry-run | 게이트 |
| 7 | lesson report entry | UX 완성도 |
| 8 | Progress 화면 | UX 완성도 |
| 9 | Reminder time chip | retention |
| 10 | Audio prefetch | 학습 흐름 |
| 11 | Lesson chain dynamic | 학습 흐름 |
| 12 | Paywall funnel 보강 | conversion |
| 13 | Onboarding motivation | 개인화 |
| 14 | NetInfo 통합 | 데이터 무결성 |
| 15 | SE responsive typography | a11y / device coverage |
| 16 | daily_usage inline hint | conversion |
| 17 | Streak history visualization | retention |

---

## 5. 미해소 (M4 권고)

- `get_word_progress` RPC backend 신설 (Progress 인증 사용자)
- Audio 디스크 cache 100MB LRU (현재 메모리 6 entry)
- Streak 끊김 시점 시각 차별화 (현재는 단순 dot 활성 카운트)
- i18n locale 전환 (M5+)
- TimePicker 라이브러리 — Reminder 임의 시간 (현재는 4 preset)

---

## 6. 의존성 누적

본 세션 추가:
- expo-blur ~13.0.0 (Cycle 1)
- expo-linear-gradient ~13.0.0 (Cycle 1)
- expo-status-bar ~1.12.0 (Cycle 1)
- expo-secure-store ~13.0.0 (Cycle 3)
- expo-crypto ~13.0.0 (Cycle 3)
- @react-native-community/netinfo 11.3.1 (Cycle 14)

사용자 install 필요:
```bash
pnpm --filter @dash2zero/mobile install
pnpm --filter @dash2zero/mobile exec expo prebuild
pnpm --filter @dash2zero/mobile exec expo run:ios  # 또는 run:android
```

---

## 7. 다음 게이트

### 자율 진행 가능
- **W16 D-3 ADR-0007 회람** (시뮬레이션 5/21) — orchestrator architect persona
- **streak 끊김 시각 차별화** — D+N 형태 dot dimming (P2)
- **lesson에 share 기능** (CC-19 lesson_shared 이벤트)

### 외부 디자인 검토 결과 수신 시점
- D-022 보강 / 부분 롤백 / 유지 결정 (사용자 호출)

### M4 W17 backend 의존
- `get_word_progress` RPC 신설
- daily_usage server-side enforcement 강화
- Audio 디스크 cache 100MB LRU
