# M4 Entry E2E Suite Plan — dash2zero

> 작성: qa agent (시니어 QA, 20년)
> 작성일: 2026-05-11 23:00 KST (M3 W15)
> 목적: M4 (Security+QA) 진입 차단 게이트로 사용할 e2e 18 시나리오의 suite 구조, 도구 결정, 환경 의존성을 정의
> 입력: `context/agents/qa/20260511-2200-chore-m3-w15-readiness.md` §3 (P0 12 / P1 6)
> 책임 결정: e2e tool 선정 (Detox vs Maestro) — qa 자율, devops는 인프라 의견만; W16 최종 confirm

---

## 0. M4 진입 게이트 (entry criteria)

다음을 모두 만족해야 M4 (Security+QA hardening) 진입:

1. M3 W16 baseline 14d 수집 완료 + acceptable variance 확인 (`docs/runbooks/BASELINE_METRICS.md`)
2. 본 문서 §2 P0 12 시나리오 **green on iOS+Android matrix** (BrowserStack 또는 Firebase Test Lab 야간 1회)
3. P1 6 시나리오는 M4 W17(M4 1주차) 종료 시까지 green
4. RC sandbox webhook smoke 주 1회 manual은 M3 W15 결정대로 유지 (R-22)
5. RLS evaluator (R-23) green — security+backend가 W15 1차에 supatest 또는 SQL static analysis 결정 후 implementation

---

## 1. Detox vs Maestro 비교 + 권고

### 1.1 비교 매트릭스

| 축 | Detox (Wix) | Maestro (mobile.dev) | 가중치 |
|---|---|---|---:|
| 학습 곡선 | JS/TS Jest 매처. RN 팀 친숙 | YAML flow 단순. 비개발자도 작성 가능 | 0.10 |
| iOS Simulator 안정성 | 매우 안정. earlGrey/XCUITest 위에 동작 | 안정. iOS 시뮬레이터 + 실기기 모두 OK | 0.15 |
| Android Emulator 안정성 | 안정하나 sync 이슈 종종 (waitFor 명시 필요) | 매우 안정. flaky 적음 | 0.15 |
| RN 의존성 | RN-first 설계. Expo SDK 통합은 Bare 워크플로우 | RN/Expo 모두 OK. Expo Go에서도 일부 동작 | 0.10 |
| StoreKit Configuration 통합 | iOS 시뮬레이터 + StoreKit Config 파일 직접 호출 가능 | 동일하게 가능하나 launchArguments 명시 필요 | 0.10 |
| Play License Tester 통합 | adb shell + license tester 계정 sign-in 필요 (둘 다) | 동일 | 0.05 |
| 시각 회귀 (screenshot diff) | takeScreenshot + jest-image-snapshot 별도 통합 | takeScreenshot 내장 + Maestro Cloud diff | 0.10 |
| 접근성 시뮬레이션 (VoiceOver/TalkBack) | iOS XCUI accessibility API 직접 / Android espresso accessibility | Maestro `assertVisible`이 a11y label 사용 — VoiceOver 발화 단언은 우회 필요 | 0.10 |
| 클라우드 디바이스 매트릭스 통합 | BrowserStack App Live + Firebase Test Lab 둘 다 지원 | BrowserStack + AWS Device Farm + Maestro Cloud (자체) | 0.05 |
| CI 속도 (cold start → 첫 assert) | iOS 시뮬레이터 60-90s | iOS 시뮬레이터 30-50s | 0.05 |
| 멀티 디바이스 동시 실행 (E2E-008) | 어렵음 — 별도 worker 필요 | 어렵음 — 별도 worker 필요 (둘 다 비슷) | 0.05 |

### 1.2 권고: **Maestro를 P0 메인, Detox를 결제 시나리오 보조**

**근거**:
1. **dash2zero MVP 60단어 학습 e2e의 90%는 단순 tap-tap-assert 흐름** — Maestro YAML flow가 코드보다 짧고 유지보수 비용 낮음. PM/디자이너도 flow 검토 가능.
2. **Maestro는 flaky가 적음** — RN+Expo SDK 환경에서 Detox sync 이슈는 W12-W14에 이미 mobile-frontend가 unit test로 경험. e2e flaky는 baseline metric 회귀로 오인될 위험 (readiness §4 risk #9 인접).
3. **결제(StoreKit Configuration + RC sandbox) 시나리오는 Detox로 별도 suite** — sandbox webhook 응답 대기, entitlement 동기화 race를 검증할 때 JS 코드의 `await` + retry logic이 YAML보다 표현력이 높음. E2E-005/006/007/008만 Detox.
4. **a11y 시나리오(P1 E2E-017/018)는 두 도구 모두 한계** — Detox + iOS XCUITest의 `accessibilityLabel` query가 Maestro보다 정밀. 그러나 실측 VoiceOver 발화는 둘 다 별도 manual QA 디바이스 매트릭스 필수. 도구 선택과 무관.

**최종**:
- **메인 suite (Maestro)**: E2E-001/002/003/009/010/011/012/013/014/015/016 (11건)
- **결제 suite (Detox)**: E2E-004/005/006/007/008 (5건)
- **a11y suite (Detox + manual)**: E2E-017/018 (2건)

devops 의견 요청: **CI 통합 시 Maestro Cloud vs self-hosted (Mac M1 mini + Android emulator)** — 비용/속도 trade-off는 devops가 W15-W16에 결정 후 본 문서 §6에 추가.

---

## 2. P0 e2e Suite (12 시나리오 — M4 entry 차단)

| ID | 시나리오 | 도구 | 도메인 | fixture/seed | acceptance criteria |
|---|---|---|---|---|---|
| E2E-001 | first-run: age gate → privacy choices → onboarding → first lesson 완료 (3분 이내) | Maestro | 온보딩 | seed: empty Supabase user, content pack v1 (60 words seeded) | 3:00 mm:ss timer 초과 시 fail; lesson_complete 이벤트 1건 emit |
| E2E-002 | under-13 선택 → 모든 기능 차단 + lockout 화면 | Maestro | privacy | seed: empty | lockout screen visible; navigation 차단; audit_log entry 1건 |
| E2E-003 | 게스트 lesson 1회 → 가입 → SRS state 머지 (stage max + attempts append) | Maestro | 머지 | seed: SRS-035/036/038 golden fixture를 Supabase에 sync (스크립트 필요) | post-merge user_word_state.stage = max(guest, server); attempts append + dedupe |
| E2E-004 | 무료 일일 한도 도달 → paywall 표시 → cancel 시 차단 유지 | Detox | 결제 | seed: SRS-061 golden (free user, new=3) Supabase sync | paywall route visible; cancel 후에도 4번째 attempt 차단; 429 응답 |
| E2E-005 | 무료 → premium 구매 (sandbox) → entitlement active + 한도 해제 | Detox | 결제 | StoreKit Config: `dash2zero.storekit` (premium_monthly product), Play License Tester 계정 (`qa-license-tester@dash2zero.com`) | entitlements.is_premium=true; daily limit 우회 확인; PAY-001 golden 회귀 |
| E2E-006 | premium → 환불 (sandbox) → 즉시 free 강등 + Mastered/SRS 보존 | Detox | 결제 | StoreKit Config refund + RC sandbox webhook; SRS-026 mastered word seeded | is_premium=false; mastered_at 보존; user_word_states 무손실 |
| E2E-007 | premium → cancellation (will_renew=false) → period_end까지 active | Detox | 결제 | StoreKit Config cancel; RC sandbox webhook | is_premium=true until period_end; cancelled flag=true |
| E2E-008 | 다른 디바이스 entitlement 동기화 (A 구매 → B에서 active 확인) | Detox | 결제 동기화 | 2개의 device session (Detox multi-device or sequential) | A 구매 후 B에서 fetch 시 is_premium=true (5초 내) |
| E2E-009 | 오프라인 lesson 진행 → 온라인 복귀 → SRS replay + dedupe | Maestro | 네트워크 | seed: SRS-038 idempotent fixture; airplane mode toggle | 오프라인 attempt 3건 → 온라인 후 server attempts +3건 (중복 0) |
| E2E-010 | analytics opt-out → Firebase DebugView 0 제품 이벤트 | Maestro + Firebase DebugView API | privacy | empty user; analytics consent OFF | 30s window 내 product event 0; 필수 audit event는 emit |
| E2E-011 | ATT denied → ad_id 미수집 + marketing event 차단 | Maestro (iOS only) | privacy | iOS 시뮬레이터 ATT prompt; consent denied | ad_id field=null; marketing_event spy=0 |
| E2E-012 | 04:00 로컬 리셋 통과 후 streak 갱신 / cycle 분리 | Maestro | SRS | seed: SRS-047 (KST 04:00 reset) + 시뮬레이터 시간 03:59 → 04:01 점프 | streak count +1; new cycle key |

**P0 합계**: Maestro 7건 + Detox 5건

---

## 3. P1 e2e Suite (6 시나리오 — M4 1주차)

| ID | 시나리오 | 도구 | 도메인 | fixture/seed |
|---|---|---|---|---|
| E2E-013 | 콘텐츠 retire → 학습 중 단어 큐 제외 + 기존 SRS 보존 | Maestro | content | seed: CON-002 (retire-then-replay) golden + Mastered 단어 1개 |
| E2E-014 | OTA 업데이트 허용 범위 / 금지 범위 회귀 | Maestro | OTA | EAS Update channel `qa-staging`; allowed/forbidden bundle 2종 |
| E2E-015 | 푸시 알림 거부 사용자도 학습 리마인더 인앱 표시 | Maestro | notification | 디바이스 push permission denied; 04:00 + 학습 미실행 24h |
| E2E-016 | DSR delete 요청 → 30d SLA 내 삭제 + 로그 | Maestro + backend job spy | privacy | seed: 사용자 1명 + 30d-fast-forward script (backend agent에 요청) |
| E2E-017 | iPhone SE / 작은 화면 / Dynamic Type XXL CTA 비차단 | Detox + screenshot diff | a11y / device | SRS-049 fixture meta a11y_assertions.device_matrix 사용 |
| E2E-018 | 다크모드 + 색약 시뮬 시 정답/오답 구분 가능 | Detox + Sim Daltonism (iOS) / Color Correction (Android) | a11y | SRS-050 fixture a11y_assertions.color_modes_to_test |

---

## 4. fixture / seed 의존성 매핑

각 e2e는 Supabase staging DB에 사전 seed가 필요. seed 스크립트는 **`scripts/qa/seed-e2e.ts`** 신설 (W15 D+5 commit 권고, backend 협업).

| e2e ID | golden/adversarial fixture | Supabase seed 필요 | 비고 |
|---|---|---|---|
| E2E-001 | (none) | empty user + content pack v1 | content agent의 60단어 starter pack import |
| E2E-002 | (none) | age=10 선택 stub | privacy spec |
| E2E-003 | SRS-035 / SRS-036 / SRS-038 | guest device + server user_word_states | merge endpoint 호출 stub |
| E2E-004 | SRS-061 (renamed from 047) | free user with new_words_started_count=3 | daily_usage table seed |
| E2E-005 | (none) | empty premium-eligible user | StoreKit `dash2zero.storekit` config |
| E2E-006 | SRS-026 (mastered protection) | premium user with mastered word | RC sandbox refund webhook |
| E2E-007 | (none) | premium with will_renew=false | RC sandbox cancel |
| E2E-008 | (none) | shared user across 2 device sessions | RC entitlement fetch |
| E2E-009 | SRS-038 | offline-capable user | network throttle / airplane mode |
| E2E-010 | (none) | user with analytics_consent=false | Firebase DebugView API key (devops) |
| E2E-011 | (none) | iOS ATT denied | iOS 시뮬레이터 + idfa stub |
| E2E-012 | SRS-047 (i18n KST 04:00) + SRS-031 | KST timezone user | 시뮬레이터 시간 조작 |
| E2E-013 | CON-002 retire | retired word seeded | content_retire e2e — content agent seed |
| E2E-014 | (none) | EAS Update bundle 2종 | devops |
| E2E-015 | (none) | push permission denied user | iOS/Android permission stub |
| E2E-016 | (none) | DSR delete 요청 + 30d fast-forward | backend SLA test job |
| E2E-017 | SRS-049 (a11y Dynamic Type) | (no seed — UI only) | iPhone SE 시뮬레이터 + AX5 |
| E2E-018 | SRS-050 (a11y 색약) | (no seed — UI only) | Sim Daltonism / Color Correction |

---

## 5. M4 진입 전 환경 준비

### 5.1 Supabase staging fully seeded

- 60단어 starter pack (`fixtures/golden/content/CON-001.yaml` 적용분) 전체
- `daily_usage` table seed function (`scripts/qa/seed-daily-usage.ts`)
- guest device + signup merge용 fixture sync (`scripts/qa/sync-srs-fixtures.ts`)
- 의존: backend (D-Q-02 in readiness), content (D-Q-04)

### 5.2 RC sandbox

- RevenueCat staging project + sandbox API key (devops 보관)
- StoreKit Configuration file `apps/mobile/StoreKit/dash2zero.storekit`:
  - `premium_monthly` ($4.99 / 1mo / auto-renew)
  - `premium_annual` ($49.99 / 1y)
- Play License Tester:
  - `qa-license-tester@dash2zero.com` (Google Play Console > License Testers)
  - `qa-refund-test@dash2zero.com` (refund 시나리오 격리)

### 5.3 TestFlight Internal

- Internal Testers group: qa-team (5명) + dev-team (8명)
- TestFlight build per W17 1회 (M4 1주차)
- crash report (Crashlytics) 알람 임계값: crash-free users < 99.5% 시 Slack `#qa-alerts`

### 5.4 BrowserStack / Firebase Test Lab

- BrowserStack App Live: P0 시나리오 야간 1회, iOS 17/18 (iPhone SE 3rd, 14, 15 Pro) + Android 13/14 (Pixel 6a, Galaxy S24)
- Firebase Test Lab: Android 8/10/12 회귀 (older OS — ATT 불필요/AAB 호환성)
- 비용 예상: BrowserStack Mobile Automate $199/mo (devops 승인)

### 5.5 Detox + Maestro CI 통합

- GitHub Actions matrix:
  - `ios-maestro` (macos-14 runner, ~10min/suite)
  - `ios-detox-payment` (macos-14 runner, ~15min/suite — StoreKit 통합)
  - `android-maestro` (ubuntu-22 + emulator, ~12min/suite)
  - `android-detox-payment` (ubuntu-22 + emulator, ~18min/suite)
- 야간 cron: 02:00 UTC (= KST 11:00 — 한국 출근 직전 결과 확인)
- failure → Slack `#qa-alerts` 자동 알람

---

## 6. devops 협업 요청 (W16 결정 항목)

| ID | 항목 | 책임 | 마감 |
|---|---|---|---|
| Q-DEV-01 | Maestro Cloud vs self-hosted Mac M1 mini farm 비용 비교 | devops | W16 D+3 |
| Q-DEV-02 | BrowserStack vs Firebase Test Lab — P0/P1 분배 | devops | W16 D+5 |
| Q-DEV-03 | EAS Update 채널 `qa-staging` 셋업 (E2E-014) | devops | W16 D+5 |
| Q-DEV-04 | StoreKit Configuration 파일 위치 + Play License Tester 계정 발급 | devops + backend | W16 D+7 |
| Q-DEV-05 | Crashlytics + Sentry 알람 임계값 (crash-free users 99.5%) | devops + qa | W17 D+1 |

---

## 7. 위험 / 미해결

- **R-Q-E2E-01**: Maestro의 VoiceOver 발화 검증 한계 — 발화 stream 캡처가 OS-level이라 Maestro에서 직접 단언 불가. 우회로 a11y label 정확성만 단언하고 실제 발화는 manual QA 디바이스 매트릭스(iPhone SE 3rd + Pixel 6a 2회/주)로 보완.
- **R-Q-E2E-02**: 멀티 디바이스 동시(E2E-008) — Detox의 단일 process model로 어려움. 우회로 sequential simulation (A device 종료 후 B device 시작) + RC entitlement fetch race 단언으로 한정.
- **R-Q-E2E-03**: RC sandbox webhook flake — webhook 재전송 지연으로 e2e timeout 가능. retry 5회 + 30s timeout으로 buffer.
- **R-Q-E2E-04**: 시뮬레이터 시간 조작(E2E-012)이 iOS는 가능하나 Android emulator는 제한적. Android는 backend `as_of` 파라미터로 우회 (backend 협업).

---

## 8. 변경 이력

| 일시 | 작성자 | 변경 |
|---|---|---|
| 2026-05-11 23:00 KST | qa agent | 초안 작성 (M3 W15) — 18 시나리오, Maestro+Detox hybrid 권고 |
