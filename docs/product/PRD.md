# dash2zero — Product Requirements Document (PRD)

> 작성: planner agent (M1, 2026-05-07)
> 협업 입력: pm (MVP Scope), architect (Domain Model), designer (Direction)
> 상위 SSOT: 사업계획서(`01_business_plan.md`), v0.3 23개 기획서, REVIEW_QA §5, SERVICE_REVIEW_QA §8
> Skill 사용: humanizer (built-in 다듬기) · theme-factory · frontend-design · taste-skill

---

## 1. 한 줄 정의

> **dash2zero는 영어권 한국어 초보자가 매일 3분 동안 단어를 보고·듣고·기억에서 꺼내고·짧은 문장 패턴으로 이해하게 만드는 모바일 학습 앱이다.**

- 1차 출시: US / CA / UK / AU / NZ
- 출시 언어: en-US 단일 (UI), 한국어 (학습 콘텐츠)
- 사업 모델: Free + Premium 구독 ($4.99/mo, $49.99/yr — D-018 봉인 2026-05-13, 사업계획서 §10.2)
- 운영 조건: 1인 개발자, 20주 baseline + buffer 일정 (CC2-14)

## 2. 제품 약속 (Product Promise)

다음 5가지를 사용자에게 약속한다. 각 약속은 측정 가능하고 (`docs/harness/EVALUATION_SCENARIOS.md`) 회귀로 검증된다.

| 약속 | 측정 |
|---|---|
| 하루 3분 안에 학습 1세션이 끝난다 | 평균 lesson duration < 3분 (CC2-25) |
| 단어를 정확한 간격으로 다시 만난다 | Leitner 1/3/7/14/30일 90개 case 100% 통과 |
| 결제하면 즉시 Premium, 환불하면 즉시 Free | RC webhook 9 상태 매트릭스 100% 통과 |
| 13세 미만은 어떤 데이터도 남기지 않는다 | age gate + privacy 11 case 100% 통과 |
| 단어 콘텐츠가 바뀌어도 학습 진도는 깨지지 않는다 | content_version × user_word_states 11 case 100% 통과 |

## 3. 사용자 / 비대상

### 3.1 1차 타깃 — 영어권 K-콘텐츠 기반 초보 한국어 학습자

- 한국어 수준: A0–A1 (완전 초보 또는 초급)
- 동기: K-pop, K-drama, 한국 여행, 한국 음식, 한국 친구
- 학습 상황: 모바일, 짧은 시간, 매일 반복

### 3.2 2차 타깃 — 한국 여행 준비형

- 카페/식당/지하철/쇼핑/길 묻기 표현 빠른 습득
- 생존 한국어 100단어 + 생활 한국어 100단어 + K-콘텐츠/관계 100단어 (사업계획서 §9.1)

### 3.3 비대상 (MVP 범위 제외)

- 한국어 중급 이상
- TOPIK 시험 고득점 준비자
- 한국어 교사/학원/기업 교육
- 13세 미만 (CC2-05: 신규 가입/결제/분석 차단)
- EU/EEA 거주자 (CC2-20: 1차 territory 제외)
- 발음 자동 평가, AI 실시간 튜터, 음성 녹음 기반 학습 (사업계획서 §3.3, MVP 제외)

## 4. 핵심 학습 루프 (Notice → Hear → Meaning → Retrieve)

CC2-25 결정 — 4단계 단일 컬럼 카드 + 하단 고정 CTA, 오디오 수동 재생 기본값.

| 단계 | 사용자 행동 | 시각 위계 |
|---|---|---|
| **Notice** | 한글 단어 본다 | 한글 최상위 |
| **Hear** | "Listen" 탭 → 발음 재생 | 오디오 버튼 + 재생 표시 |
| **Meaning** | 영어 의미 + 짧은 예문 본다 | 보조 영역 (펼치기) |
| **Retrieve** | 객관식 4지선다 또는 tap-to-reveal | CTA 하단 고정 |

- 한 lesson = 신규 단어 3개(무료) 또는 15개(Premium) + 복습 20개(무료) 또는 무제한(Premium) (C-07)
- 일일 리셋: 사용자 로컬 04:00 (C-17)
- Mastered 정의: stage 5 도달 (CC2-09: 30/60/120일 재노출은 MVP 제외)
- 오답 강하: `next_stage = max(1, current - 1)`, 같은 cycle 2연속 오답 시 stage 1 + weak (CC3-05)

## 5. MVP 핵심 기능 (P0)

| ID | 기능 | 결정 근거 |
|---|---|---|
| F-001 | 가입/로그인 (Apple Sign In + Google + Email magic link) | CC-03, CC3-03 (Android에도 Apple Sign In) |
| F-002 | 게스트 학습 (구매/동기화/데이터 권리는 가입 후) | CC-04, CC2-06 |
| F-003 | 게스트→가입 시 학습 데이터 머지 | CC2-04 |
| F-004 | 단어 카드 4단계 학습 | CC2-25 |
| F-005 | 객관식 4지선다 퀴즈 (distractor 정량 룰 — CC2-11) | CC-08 |
| F-006 | Leitner 5단계 SRS (1/3/7/14/30일) | C-08, CC3-05 |
| F-007 | 일일 학습 한도 (무료 3, Premium 15 + 복습 20/무제한) | C-07, CC2-07 |
| F-008 | 단어 카드 음성 재생 (TTS, Storage 캐시) | C-05, C-06 |
| F-009 | RevenueCat 구독 (체험 없음, Restore 필수, 가족 공유 비활성) | C-09 |
| F-010 | 인앱 계정 삭제 + 데이터 내보내기 (30일 SLA) | C-11 |
| F-011 | First-run: age gate → privacy choices → onboarding | CC2-18 |
| F-012 | 13세 미만 차단 (계정/학습/결제/분석) | CC2-05, CC2-14 |
| F-013 | Streak / 진행률 / Mastered 카운트 표시 | C-08, CC2-25 |
| F-014 | 콘텐츠 manifest 원격 업데이트 + audio_hash 검증 | CC-15, CC3-04 |
| F-015 | 콘텐츠 신고 (앱 내 단어별 5종 카테고리) | CC2-15 (운영 어드민과 연결) |

> 각 기능의 입력값/엣지/검증/실패분기/idempotency/analytics/acceptance criteria/QA case는 `06_feature_spec.md` v0.3에 명세. 본 PRD는 약속 + 분류만.

## 6. Premium 가치 (CC2-08, CC3-04 준수)

| 항목 | Free | Premium |
|---|---|---|
| Starter Pack 60단어 | 전체 접근 | 전체 접근 |
| 신규 단어 일일 한도 | 3 | 15 |
| 복습 한도 | 20 | 무제한 |
| Premium pack 300단어 | 미접근 (각 신규 pack의 무료 샘플 10개만 preview pool로 노출 — CC3-01) | 전체 접근 |
| Premium audio | 미접근 | signed URL TTL 6시간 |
| 매월 50단어 추가 pack | 무료 샘플 10개 preview | 전체 접근 |

## 7. 비-기능 요구사항 (NFR)

본 NFR은 M3에서 baseline 측정 후 SLO로 봉인. 현재는 잠정 목표.

| Metric | 잠정 목표 | 측정 위치 |
|---|---|---|
| 첫 lesson 진입 시간 (cold start) | < 3초 (p95) | Crashlytics + custom trace |
| Lesson 완료 시간 | < 3분 (p50) | lesson_started → lesson_completed |
| Crash-free users | ≥ 99.5% | Crashlytics |
| Android ANR | < 0.47% | Crashlytics |
| 결제 시도 → 성공률 | ≥ 95% | RC webhook + Analytics |
| 음성 재생 latency (캐시 hit) | < 200ms | custom trace |

## 8. 핵심 KPI

### 8.1 KPI 카탈로그

| KPI | 정의 | 측정 |
|---|---|---|
| First lesson completion rate | 가입 후 첫 lesson_completed / lesson_started | Firebase Analytics |
| D1 / D3 / D7 retention | 다음 1일 / 3일 / 7일 내 lesson_started 발생률 | Firebase + 로컬 timezone 보정 (사용자 04:00 리셋) |
| Day-1 streak 유지율 | 가입 D0 lesson_completed 사용자가 D1에 streak 끊기지 않음 비율 | 자체 메트릭 + Firebase |
| Free → Paid conversion | paywall_viewed → subscription_purchase_succeeded | Firebase + RC webhook |
| paywall_view_to_purchase | paywall source × signin step 분해 funnel 전환율 | Firebase (source enum), §8.3 참조 |
| lesson_complete_rate | lesson_started → lesson_completed (전체 lesson, first lesson 분리) | Firebase Analytics |
| Mastered words (avg per user) | stage 5 도달 단어 누적 | 자체 메트릭 |
| Streak retention | 7일 / 14일 / 30일 streak 유지율 | 자체 메트릭 |
| Refund rate | refund / purchase | RC webhook |

### 8.2 baseline 4지표 임계값 (M3 W15 자율 결정 — 2026-05-11)

> **결정 권한**: planner (사용자 자율 결정 위임).
> **참조**: Sensor Tower 2024 학습앱 benchmark, Duolingo 1년차 retention 공개 데이터, B2C SaaS conversion benchmark, learning agent `LESSON_COMPLETE_RATE_THRESHOLDS.md`.
> **운영 모드**: 본 임계값은 **absolute baseline**이며, W16 14d baseline 수집 후 **relative (mean − 1.5σ)** 로 전환 가능 (analytics agent baseline aggregation queries 회수 시점).

| Metric | Target | Minimum acceptable | Warning band | Critical | Source / 근거 |
|---|---|---|---|---|---|
| **Day-3 retention** | ≥ 35% | ≥ 25% | 25–35% | < 25% | Sensor Tower 2024 학습앱 median (Duolingo/Memrise/Drops 등) — 한국어 카테고리는 표본이 작아 영어/스페인어 학습앱 비교군 사용 |
| **Day-1 streak 유지율** | ≥ 60% | ≥ 45% | 45–60% | < 45% | Duolingo 1년차 공개 데이터 (D1 streak 70% → 첫 출시 앱 보정 −10%p) |
| **lesson_complete_rate** | ≥ 75% | ≥ 60% | 60–75% | < 60% | learning agent `LESSON_COMPLETE_RATE_THRESHOLDS.md` 인용 — 3분/12 step 모바일 마이크로러닝 기준 |
| **paywall_view_to_purchase** | ≥ 4% | ≥ 2% | 2–4% | < 2% | B2C SaaS subscription median 3–5%. 단 `paywall_signin_required` 단계 분해 후 측정 (게스트 paywall 클릭은 signin 통과 전 단계로 별도 카운트). **D-018 봉인 후 영향 평가**: 가격 $1.99→$4.99 상승 시 price sensitivity로 conversion rate 2.5배 하락 가능성 있으나, premium positioning 신호로 "진지한 학습자" 유입 효과로 일부 상쇄 — target 4% / minimum 2% 유지 (W16 baseline 후 relative 전환 시 재조정) |

#### 8.2.1 Pass / Fail 판정 규칙

- **Pass**: target 도달
- **Conditional Pass**: minimum acceptable 이상 + 다음 cycle 개선 액션 ADR 등록
- **Fail**: minimum acceptable 미만 → M5 베타 진입 보류 또는 scope 축소 검토

#### 8.2.2 W16 → relative 전환 조건

- baseline 14d 누적 N ≥ 200 user-event 또는 N ≥ 50 unique user
- 위 조건 충족 시 다음 cycle부터 임계값 = `mean − 1.5σ` (warning), `mean − 2σ` (critical)
- 전환은 analytics + planner + pm 합의로 ADR 등록 후 발효

### 8.3 paywall source enum

paywall_view_to_purchase는 source × step 2축으로 분해 측정한다.

**source enum** (PRD `paywall_source` 단일 SoT):

| value | 트리거 위치 | 비고 |
|---|---|---|
| `organic` | Settings 화면 "Upgrade" 버튼, Premium 안내 배너 클릭 | 자발적 진입 |
| `onboarding` | First-run onboarding 직후 first paywall (J-001 직결) | 노출 1회 한정 |
| `limit_hit` | 일일 무료 3단어 한도 도달 / Premium pack lock 클릭 | J-002 / J-003 분기 합산. 향후 `free_limit_reached` `premium_pack_locked` 두 sub-source로 분리 가능 (analytics 합의) |

**step funnel** (paywall 진입 후):

```
paywall_viewed
  → paywall_signin_required (게스트인 경우 signin 게이트, 가입자는 skip)
  → paywall_signin_completed
  → paywall_iap_sheet_opened
  → subscription_purchase_succeeded
```

전환율 계산은 단계별 누적 비율 + 종단(`paywall_viewed → succeeded`) 둘 다 노출한다.

### 8.4 Privacy Manifest 정합성 체크리스트 (M4 진입 전 검증)

iOS Privacy Manifest (`PrivacyInfo.xcprivacy`) 항목과 PRD §12 보류 항목 정합성을 M4 W15 진입 시 1회 검증한다.

| 항목 | PRD 정합 위치 | 검증 |
|---|---|---|
| `NSPrivacyCollectedDataTypes` | F-011 privacy choices, F-012 13세 미만 차단 | analytics 거부 사용자에게 송신되지 않는 이벤트 목록과 일치 |
| `NSPrivacyAccessedAPITypes` | UserDefaults / FileTimestamp / SystemBootTime / DiskSpace 사용 declarations | RN/Expo 의존 라이브러리 audit 결과와 cross-check |
| `NSPrivacyTracking` | `false` (광고 식별자 미사용) | RC SDK + Firebase Analytics 설정과 일치 |
| `NSPrivacyTrackingDomains` | 빈 배열 | 외부 추적 도메인 0건 확인 |
| 3rd-party SDK manifests | Firebase / RevenueCat / Sentry (선택) 각 SDK manifest 포함 여부 | Xcode build phase에서 누락 시 fail |

체크리스트 미통과 시 iOS submission 차단 → M5 베타 진입 보류.

## 9. Non-Goals (MVP에서 의도적 제외)

| 항목 | 사유 | 도입 시점 후보 |
|---|---|---|
| 음성 녹음 / 발음 평가 | 1인 운영 부담 + privacy | post-MVP |
| AI 실시간 튜터 | LLM 비용 + 운영 복잡도 | post-MVP |
| 사용자 생성 콘텐츠 (UGC) | 검수 부담 + 신고 운영 | post-MVP |
| 소셜 / 친구 / 리더보드 | 첫 출시 범위 외 | post-MVP |
| 30/60/120일 장기 재노출 | Phase 3 실험 후보 (CC2-09) | post-MVP |
| BigQuery export | 비용 (CC2-23) | DAU 1k 또는 분석 질문 명확 시 |
| EU/EEA 출시 | GDPR/DSA 추가 검토 (CC2-20) | post-MVP |
| 태블릿 / 가로 모드 / 다크 모드 | MVP UI 범위 (CC2-25 단일 컬럼) | post-MVP |
| A/B 가격 실험 | RC product ID 고정 제약 | post-MVP |

## 10. 마일스톤 매핑 (20주)

CC2-14 결정대로 16주 baseline + 4주 buffer.

| 주차 | 마일스톤 | 산출물 핵심 |
|---|---|---|
| W1–W2 | M0 Bootstrap | 헌장 + 9 + 4 agent + skill 시스템 ✅ (완료) |
| W3–W4 | M1 Product+Architecture+Stack | PRD ✅ + Domain + Stack Decision + Design Direction |
| W5–W12 | M2 Thin Vertical Slice | apps/mobile + apps/api + 핵심 시나리오 1개 E2E |
| W13–W14 | M3 Harness Hardening | 87 golden case runner + baseline 14일 |
| W15–W16 | M4 Security + QA | adversarial + e2e + audit + secret + retention |
| W17–W18 | M5 Beta Handoff | README + demo + seed + runbook + 베타 모집 |
| W19–W20 | Buffer | 심사 반려 / 콘텐츠 검수 슬립 / hotfix |

> C-13 사업자/결제 수령 주체 데드라인은 D-42 (베타 출시 4주 전 = W14 종료 시점). 미확정 시 paid release 자동 보류.

## 11. 측정 철학 (Harness 연결)

본 PRD의 모든 약속은 다음 4개 문서로 측정된다 (M0 보강에서 사전 작성).

- `docs/harness/HARNESS_MATURITY_ROADMAP.md` — 측정 단계
- `docs/harness/HARNESS_EXECUTION_BOARD.md` — 3 workstream
- `docs/architecture/HARNESS_LAYERED_ARCHITECTURE.md` — 5층
- `docs/harness/EVALUATION_SCENARIOS.md` — 87 case

## 12. 보류 / 데드라인 추적

| 항목 | 데드라인 | 차단 범위 |
|---|---|---|
| C-13 사업자/결제 수령 주체 | D-42 (W14 종료) | paid release |
| 법무/세무 검토 | 출시 직전 (W17~) | store submission |
| Privacy Manifest | iOS submission 전 | iOS build upload |
| RLS 정책 매트릭스 (ADR-0004) | M2 첫 DB-touching merge 전 | 개발 진행 |
| 결제 sandbox 매트릭스 통과 | M5 진입 전 | paid release |

## 13. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M1-1 v1.0 작성 — 제품 약속 5개 + 학습 루프 4단계 + 기능 P0 15개 + Premium 매트릭스 + KPI + non-goals + 20주 일정 | planner |
| 2026-05-11 | M3 W15 — §8 baseline 4지표 임계값 자율 결정 (D-3 retention 35/25%, Day-1 streak 60/45%, lesson_complete_rate 75/60%, paywall_view_to_purchase 4/2%) + paywall source enum (organic/onboarding/limit_hit) + Privacy Manifest 정합성 체크리스트 + W16 relative (mean−1.5σ) 전환 명시 | planner |
| 2026-05-13 | §8.2 paywall_view_to_purchase 행에 D-018 봉인 영향 평가 추가 — $4.99 가격으로 인한 price sensitivity와 premium positioning 효과 명시, target/minimum 유지 (W16 baseline 후 재조정) | orchestrator |
