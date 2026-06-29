# QA — M3 W15 Readiness 자가 진단

> 작성: qa agent (시니어 QA)
> 작성일: 2026-05-11
> 사이클: M3 W15 진입 직전 (W14 evaluator + adversarial commit 완료, R-23 RLS evaluator 미구현)
> 입력: `context/rollups/20260511-M3-W14-evaluators-and-ci.md` §9 / `docs/harness/EVALUATION_SCENARIOS.md` §2.2 / `fixtures/golden/srs/README.md`

---

## 1. W15 Readiness 12 항목

| # | 항목 | 상태 | 근거 / 액션 |
|---:|---|:---:|---|
| 1 | SRS golden 22 → 50 갭 분석 (잔여 28건) | ⏳ | §2 카테고리 분포안 — 본 문서로 첫 안 제시, analytics와 합의 필요 |
| 2 | Payment golden 7 → 15 잔여 8건 시나리오 식별 | ⏳ | grace→active 회복, billing_retry 24h 만료, transferred user_id 머지, cancelled (will_renew=false) period_end 도달, refunded 후 재구매 (PAY-ADV-002와 분리), unknown 강등, family-share 차단 (PAY-ADV-006), 환불-시-Mastered/SRS 보존 |
| 3 | Privacy golden 6 → 11 잔여 5건 식별 | ⏳ | UK-001/002/003, AGE-002 (게스트 under-13), AGE-003 (생년월일 변경 lockout) |
| 4 | Content golden 8 → 11 잔여 3건 식별 | ⏳ | CONTENT-002 word_id 영구성, PACK-003 signed URL 만료 후 재요청, PACK-004 rollback 캐시 무효화 |
| 5 | RLS evaluator 도입 전 fixture 9건 skip 영향 모니터링 | 🔴 차단 | R-23 — security+backend가 W15 1차에 supatest 또는 SQL static analysis 결정. QA는 evaluator 도입 후 회귀 trigger 정의 |
| 6 | M4 entry e2e suite 후보 도출 | ⏳ | §3 — 18 시나리오 제안 |
| 7 | baseline metrics 14d 수집 중 regression risk 후보 정리 | ⏳ | §4 — 9 후보 |
| 8 | Mastered/Weak measurement event emit 검증 (Q-DA-DOC-007) | ⏳ | analytics+frontend commit 후 QA가 Firebase DebugView + golden replay로 단언 |
| 9 | audit_log Slack alert 임계값 정의 | ⏳ | security+devops 리드, QA는 false positive rate 측정 case 추가 |
| 10 | eval-nightly cron 활성화 후 첫 야간 실패 대응 runbook | ⏳ | devops와 W15 마지막 날 dry-run |
| 11 | 게스트 → 가입 머지 회귀 SRS-035/036/038 + analytics 연결 | ✅ | golden 3건 보유. W15에서 capacity case (300+ attempts replay) 1건 추가 권고 |
| 12 | i18n / a11y / device matrix 회귀 자동화 후보 | 🔵 M4 | M3에는 evaluator 우선. M4 진입 직후 Detox/Maestro 매트릭스 commit |

범례: ✅ 준비 / ⏳ 작성 중 / 🔴 차단 / 🔵 후순위

---

## 2. SRS 잔여 28건 카테고리 분포안 (W15)

W14 commit 후 22건 보유. 잔여 28건은 **EVALUATION_SCENARIOS §2.2 매트릭스 누락 cell**과 **W14 commit에서 발견된 경계 갭**을 우선한다. 같은-cycle 우선 / Mastered 보호 / 재진입 / under-limit 외에 **타임존, 멀티-디바이스 충돌, 게스트 머지 conflict, retire 흐름**의 경계가 부족하다.

### 2.1 분포 제안 (총 28건)

| 카테고리 | 현재 | 추가 | 누적 | 추가 case 핵심 |
|---|---:|---:|---:|---|
| stage 전이 (정답) | 4 | 6 | 10 | 1→2/2→3/3→4/4→5의 prior incorrect 존재 변형, mastered 도달 직전 (stage 4 + 30d 누적) |
| stage 전이 (오답) | 4 | 6 | 10 | 2→1/3→2/4→3/5→4 prev_cycle / weak=true 상태에서 추가 오답 / stage 1 1회 오답 floor 유지 (SRS-013 보강) |
| same-cycle 2연속 오답 | 3 | 2 | 5 | weak=true 진입 직후 stage1 도달, prev_cycle correct 직후 same-cycle 2 wrong |
| Mastered 보호 | 3 | 0 | 3 | 충족 |
| 04:00 경계 | 3 | 2 | 5 | 04:00 정각 attempt (포함/제외 boundary), 23:59:59 → 00:00:00 streak 분리 |
| 타임존 변경 | 2 | 1 | 3 | DST 진입/이탈 (Sydney AEDT→AEST) — SRS-032 보강 |
| 멀티 디바이스 | 1 | 3 | 4 | (a) A=stage3 / B=stage4 동시 → server max, (b) A offline 6h replay 후 B 진행 → server-wins, (c) clock skew ±2min |
| 게스트 → 가입 머지 | 3 | 0 | 3 | 충족 |
| 콘텐츠 retire | 1 | 2 | 3 | retire 직후 큐에서만 제외 / Mastered 단어 retire 시 history 보존, replace_with_word_id 마이그레이션 |
| 일일 한도 | 4 | 0 | 4 | 충족 |
| **i18n / 시스템 언어 (신규)** | 0 | 3 | 3 | KR↔EN 시스템 언어 전환 시 stage 동일성, RTL fallback (Arabic 메뉴 시 학습 한글 그대로), 긴 영어 distractor 줄바꿈 |
| **접근성 (신규)** | 0 | 3 | 3 | VoiceOver 진행 중 attempt 타임스탬프 정확성, Dynamic Type XXL 시 stage 전이 동일, 색약 (정답/오답 색-only 의존 금지) |

W14 commit의 **11 카테고리 분포에 i18n + a11y 2 카테고리를 추가**하여 13 카테고리 / 50건으로 확장. M4 진입 시 i18n/a11y가 별도 evaluator 또는 e2e로 승격될 수 있도록 sentinel case로 먼저 golden에 박는다.

### 2.2 같은-cycle / Mastered / 재진입 / under-limit 외 경계 갭

W14 commit이 다룬 경계 외 **부족 경계** (W15에서 채울 대상):

1. **DST 경계** — IANA tz는 SRS-031/032에서 cover하나 actual DST shift가 미작성 (잔여 분포 #6)
2. **Multi-device clock skew** — 현재 SRS-040은 server max만 cover. NTP drift ±2min에서 due가 어느 쪽 기준인지 (잔여 분포 #7)
3. **Retire + Mastered 교차** — Mastered 단어가 retire되었을 때 mastered_at 보존 + 큐 제외 (잔여 분포 #9)
4. **Stage 1 1회 오답 floor** — SRS-013은 cover하나 weak=true 상태에서 추가 오답 시 floor 유지 (잔여 분포 #2)
5. **Prior incorrect 직후 정답** — stage 전이 정답 case 대부분 prior가 0/0. prior incorrect_count>0인 상태의 정답 회복이 미작성 (잔여 분포 #1)
6. **i18n / a11y는 evaluator 미존재** — golden case로 측정 가능한 단언만 박고 시각 회귀는 M4 e2e

---

## 3. M4 Entry 최소 e2e Suite (18 시나리오)

M4 (Security+QA) 진입 조건: M3 W16 baseline 통과 + **e2e 최소 suite green on iOS+Android matrix**. Detox 또는 Maestro로 작성, BrowserStack/Firebase Test Lab 야간 1회.

### 3.1 P0 e2e (12 시나리오 — M4 entry 차단)

| ID | 시나리오 | 도메인 | 차단 근거 |
|---|---|---|---|
| E2E-001 | first-run: age gate → privacy choices → onboarding → first lesson 완료 (3분 이내) | 온보딩 | CC2-25 SLO |
| E2E-002 | under-13 선택 → 모든 기능 차단 + lockout | privacy | CC2-05 / 차단성 |
| E2E-003 | 게스트 lesson 1회 → 가입 → SRS state 머지 (stage max + attempts append) | 머지 | SRS-035/036/038 e2e 단언 |
| E2E-004 | 무료 일일 한도 도달 → paywall 표시 → cancel 시 차단 유지 | 결제 | CC2-07 |
| E2E-005 | 무료 → premium 구매 (sandbox) → entitlement active + 한도 해제 | 결제 | StoreKit Config / Play License Tester |
| E2E-006 | premium → 환불 (sandbox) → 즉시 free 강등 + Mastered/SRS 보존 | 결제 | refunded golden e2e |
| E2E-007 | premium → cancellation (will_renew=false) → period_end까지 active | 결제 | golden cancelled 시나리오 e2e |
| E2E-008 | 다른 디바이스 entitlement 동기화 (A 구매 → B에서 active 확인) | 결제 동기화 | multi-device |
| E2E-009 | 오프라인 lesson 진행 → 온라인 복귀 → SRS replay + dedupe | 네트워크 | R-22/멱등 |
| E2E-010 | analytics opt-out → Firebase DebugView에서 제품 이벤트 0건 | privacy | QA-P0-005 |
| E2E-011 | ATT denied → ad_id 미수집 + marketing event 차단 | privacy | PRV-ADV-002/003 e2e |
| E2E-012 | 04:00 로컬 리셋 통과 후 streak 갱신 / cycle 분리 | SRS | day boundary 실측 |

### 3.2 P1 e2e (6 시나리오 — M4 1주차 권고)

| ID | 시나리오 | 도메인 |
|---|---|---|
| E2E-013 | 콘텐츠 retire → 학습 중 단어 큐 제외 + 기존 SRS 보존 | content |
| E2E-014 | OTA 업데이트 허용 범위 / 금지 범위 회귀 | OTA |
| E2E-015 | 푸시 알림 거부 사용자도 학습 리마인더 인앱 표시 | notification |
| E2E-016 | DSR delete 요청 → 30d SLA 내 삭제 + 로그 | privacy |
| E2E-017 | iPhone SE / 작은 화면 / Dynamic Type XXL CTA 비차단 | a11y / device |
| E2E-018 | 다크모드 + 색약 시뮬 시 정답/오답 구분 가능 | a11y |

E2E-005/006/007/008은 **StoreKit Configuration (iOS) + Google Play License Tester (Android)** 양쪽에서 sandbox 자동화. RevenueCat sandbox webhook은 M3 W15에 manual smoke로 분리 결정됨 (R-22).

---

## 4. baseline 14d 수집 중 Regression Risk 후보 (9건)

W15 시작 baseline 수집 (Day-3 retention / Day-1 streak / lesson_complete_rate / paywall_view_to_purchase) 동안 **회귀로 해석될 위험**을 사전 식별. metric drop이 회귀인지 자연 변동인지 분리하기 위해 QA가 옆에서 단언한다.

| # | Risk | 영향 metric | QA 사전 case |
|---:|---|---|---|
| 1 | Mastered/Weak event 신규 emit이 lesson_complete_rate session 카운트 중복 발생 | lesson_complete_rate | analytics emit 이전/이후 동일 입력 → 카운트 ±0 단언 case |
| 2 | 04:00 로컬 리셋이 baseline 윈도우 경계를 분할 (timezone-mixed 사용자) | Day-1 streak | SRS-031/032 + 추가 DST 1건이 streak emit 동일성 단언 |
| 3 | RC sandbox webhook이 nightly에서 빠진 사이 production drift 미감지 | paywall_view_to_purchase | manual smoke 주 1회 + PAY-ADV-001/004 회귀 |
| 4 | 게스트 머지 시 attempts append로 인한 lesson_complete 재emit | lesson_complete_rate | SRS-038 idempotent replay e2e |
| 5 | content retire가 baseline 기간 중 발생 시 큐 사이즈 급감 | Day-3 retention | retire 시 활성 사용자 alert + retire-then-replay golden |
| 6 | privacy choices 거부 사용자 비율 증가로 funnel event 누락 → 가짜 회귀 | 모든 funnel | choices별 sample 분리 단언 (필수 이벤트 vs 비필수) |
| 7 | RLS evaluator 도입 전까지 보안 회귀가 baseline에 반영되지 않음 | 보안 alarm 0 | R-23 — security alert 채널 부재 시 false negative |
| 8 | Multi-device server-wins 충돌 시 중복 attempt가 lesson_complete 카운트 부풀림 | lesson_complete_rate | SRS-040 + clock skew 신규 case |
| 9 | OTA hotfix가 baseline 윈도우 중간에 들어가면 회귀 비교 무효화 | 전 metric | baseline 14d freeze window 정의 (devops와 합의) |

---

## 5. 차단 / 의존성

### 5.1 차단 (BLOCKER)

- **R-23 RLS evaluator 미구현** — security+backend가 W15 1차에 결정하지 않으면 adversarial 9건 + 신규 RLS golden 작성 불가. QA는 evaluator interface 확정 후에만 RLS regression case 작성 가능.

### 5.2 의존성 (DEPENDENCY)

| ID | 항목 | 의존 agent | 필요 시점 |
|---|---|---|---|
| D-Q-01 | Mastered/Weak emit spec (이벤트명/properties) | analytics + frontend | SRS i18n/a11y 신규 case 작성 전 |
| D-Q-02 | Payment 잔여 8건 시나리오 detail (transferred user_id 머지 정책) | backend | golden 작성 전 |
| D-Q-03 | Privacy UK-001/002/003 게이팅 함수 위치 | legal + frontend | privacy 잔여 5건 작성 전 |
| D-Q-04 | Content PACK-003/004 manifest 캐시 무효화 정책 | content + backend | content 잔여 3건 작성 전 |
| D-Q-05 | baseline 14d freeze window (OTA hotfix 금지 기간) | devops + pm | baseline 수집 시작 전 |
| D-Q-06 | StoreKit Configuration 파일 / Play License Tester 계정 | backend + devops | M4 e2e E2E-005~008 작성 전 |
| D-Q-07 | Detox vs Maestro 결정 (M4 e2e 도구) | devops + qa | M4 entry 1주 전 |

### 5.3 W15 QA 작업 우선순위 (3일 단위)

1. **D+1~2**: SRS 잔여 28건 §2.1 분포안 analytics와 합의 → YAML 13건 (정답/오답 stage 전이 + i18n/a11y sentinel 6건) 작성
2. **D+3~5**: SRS 잔여 15건 (multi-device + DST + retire 교차) 작성
3. **D+3~7**: Payment 잔여 8건 + Privacy 잔여 5건 + Content 잔여 3건 backend/legal/content 협업 검토
4. **D+5~7**: M4 e2e suite §3 책임 agent와 합의 → P0 12건 시나리오 spec commit
5. **D+8~14**: baseline 수집 중 §4 9 risk를 daily monitoring + alert 임계값 합의

---

## 6. 출력 (orchestrator 호출자용 요약)

별도 메시지로 200단어 이내 회신.
