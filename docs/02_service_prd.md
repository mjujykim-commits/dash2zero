# dash2zero 서비스 기획서 PRD

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-01 | C-13 마커와 D-42 사업자/결제 수령 주체 게이트 반영 |
| CC2-05 | 13세 미만 차단, 13~17세 high privacy default 반영 |
| CC2-14 | 16주 구현 baseline + 4주 버퍼 = 20주 출시 계획 |
| CC2-17 | 콘텐츠 OTA 허용, 결제/권한/age gate/핵심 알고리즘 OTA 금지 |
| CC2-18 | age gate -> privacy choices -> onboarding 순서 |
| CC2-25 | Notice -> Hear -> Meaning -> Retrieve 4단계 학습 루프 |

## 1. 제품 정의

dash2zero는 영어권 한국어 초보 학습자가 하루 3분 동안 한국어 단어를 보고, 듣고, 뜻을 연결하고, 기억에서 꺼내도록 돕는 모바일 한국어 단어 학습 앱이다.

MVP는 회화 앱이나 AI 튜터 앱이 아니다. 음성 녹음, 발화 평가, 사용자용 AI 예문 생성, AI 개인화는 제외하고, 단어 카드, 오디오 재생, 능동 인출 퀴즈, 간격 반복 복습, 무료/프리미엄 구독 구조에 집중한다.

## 2. 제품 목표

| 목표 | 기준 |
|---|---|
| 첫 학습 완료 | 신규 사용자가 계정 없이 첫 3단어 lesson을 완료 |
| 습관 형성 | local day 04:00 기준 일일 학습/복습 루프 제공 |
| 콘텐츠 가치 | Starter Pack 60단어와 MVP 전체 300단어 구조 완성 |
| 구독 전환 | Premium은 전체 콘텐츠, 일일 15 신규 단어, 복습 무제한 제공 |
| 개발 명확성 | swarm coding agent가 추가 제품 판단 없이 구현 가능 |

## 3. 비목표

- 음성 녹음 및 발화 평가
- AI 챗봇, AI 튜터, 사용자용 AI 예문 생성
- TOPIK 고득점 대비
- 소셜/리더보드/커뮤니티
- 강의 영상, 교사 연결, 웹 정식 서비스
- 복잡한 웹 어드민
- 광고 SDK 또는 cross-context behavioral advertising
- EU/EEA storefront 출시
- 13세 미만 대상 기능

## 4. 대상 사용자

| 구분 | 설명 | 핵심 니즈 |
|---|---|---|
| Primary | 영어권 K-content 기반 초보자 | 한국어 단어가 보이고 들리는 경험 |
| Secondary | 한국 여행 준비자 | 카페, 식당, 이동, 결제 등 생존 표현 |
| Tertiary | TOPIK 전 단계 초급자 | 시험 전 기초 단어와 쉬운 문장 패턴 |

초기 비대상은 중급 이상 학습자, 발음 교정 니즈가 핵심인 사용자, 교사/학원, 13세 미만 사용자다.

## 5. 핵심 사용자 플로우

### 5.1 첫 진입

1. 앱 실행
2. age gate 표시
3. 13세 미만이면 차단 화면 고정
4. 13세 이상이면 privacy choices 표시
5. analytics/diagnostics opt-in 또는 거부
6. 한국어 수준 선택: New / Beginner / Returning learner
7. 관심 주제 선택: K-drama, K-pop, Travel, Food, Friends, Daily life
8. 게스트로 첫 학습 시작
9. 첫 3단어 세션 완료
10. 계정 생성은 구매/동기화/삭제/내보내기 시점에 제안

### 5.2 일일 학습

1. Home에서 Today 3 words 확인
2. Notice: 한글 형태 인지
3. Hear: 오디오 수동 재생
4. Meaning: 영어 뜻과 예문 확인
5. Retrieve: 객관식 퀴즈로 회상
6. 세 단어 완료
7. Session Result에서 learned, streak, due review 확인

### 5.3 복습

1. Home에서 Review due 진입
2. SRS due 단어 문제 풀이
3. 정답/오답에 따라 stage 갱신
4. weak=true 단어는 우선 복습 후보로 표시

### 5.4 결제

1. 무료 한도 또는 프리미엄 팩 접근 시 paywall 노출
2. 게스트이면 로그인/가입 선행
3. Monthly 또는 Annual 선택
4. App Store/Google Play 결제
5. RevenueCat entitlement 확인
6. Premium 콘텐츠 unlock
7. Restore Purchases는 로그인 후 paywall과 settings에서 제공

## 6. MVP 기능 범위

| 우선순위 | 기능 | 설명 |
|---|---|---|
| P0 | Age gate | 13세 미만 차단, 13~17세 high privacy default |
| P0 | Privacy choices | Analytics/Crashlytics 기본 off, opt-in 후 활성화 |
| P0 | 온보딩 | 수준, 관심 주제, 게스트 시작 |
| P0 | 게스트 학습 | 계정 없이 첫 학습 가능, 로컬 SQLite 저장 |
| P0 | 4단계 학습 루프 | Notice/Hear/Meaning/Retrieve |
| P0 | 오디오 재생 | TTS 정적 파일 재생, 자동재생 기본 off |
| P0 | 퀴즈 | 4지선다, distractor 검증, fallback |
| P0 | SRS 복습 | Leitner 5단계, due queue, weak flag |
| P0 | 계정 전환 | Apple/Google/이메일 매직링크 |
| P0 | 게스트 병합 | event_id 기반 idempotent merge |
| P0 | Premium entitlement | RevenueCat + Supabase user_id 매핑 |
| P0 | 계정 삭제 | Settings 내 삭제 요청, 30일 SLA |
| P1 | 로컬 알림 | 첫 학습 완료 후 선택 요청 |
| P1 | 콘텐츠 오류 신고 | word/example/audio 단위 신고 |
| P1 | 성장 리포트 | Learned, Mastered, Weak, Streak |
| P1 | 콘텐츠 원격 업데이트 | manifest/version 기반, OTA 경계 준수 |

## 7. 무료/프리미엄 정책

| 항목 | Free | Premium |
|---|---|---|
| 접근 단어 | Starter Pack 60단어 | 전체 300단어 + future packs |
| 일일 신규 단어 | 3개 | 15개 |
| 일일 복습 | 20문항 | 무제한 |
| 광고 | 없음 | 없음 |
| Weak Words | 제한 | 전체 |
| 상세 리포트 | 기본 지표 | 전체 지표 |
| 가격 | USD 0 | USD 1.99/mo, USD 14.99/yr |

무료 체험은 두지 않는다. 무료 플랜 자체가 체험 역할을 한다.

확정 결정:

- CC3-01 결정: 신규 Premium pack 무료 샘플 10개는 daily 3과 분리한 preview pool로 운영한다. 임시 기준은 Starter Pack 60단어와 daily 3 new words 제한을 우선한다.

## 8. 학습 모델

- SRS: 자체 Leitner 5단계
- 간격: 1일, 3일, 7일, 14일, 30일
- 정답: stage +1, 최대 stage 5
- 오답 1회: stage -1, 최소 stage 1
- 동일 due cycle 2회 연속 오답: stage 1 + weak=true
- Mastered: stage 5 도달
- 60/120일 장기 재노출: MVP 제외, Phase 3 실험 후보
- 일일 리셋: 사용자 로컬 타임존 04:00
- streak: completed_at 기준 local day에 1회만 증가

## 9. 주요 화면

| 화면 | 목적 |
|---|---|
| Splash/Loading | 앱 초기화 |
| Age Gate | 13세 미만 차단 |
| Privacy Choices | 분석/진단 동의 |
| Onboarding | 수준/관심사 선택 |
| Home | 오늘 학습/복습 진입 |
| Word Flow | Notice/Hear/Meaning/Retrieve |
| Session Result | 완료 결과와 다음 복습 |
| Review Due | due 단어 복습 |
| Pack Library | 무료/프리미엄 팩 확인 |
| Paywall | Premium 구독 안내 |
| Settings | 계정, 알림, privacy, help |
| Account | 로그인, 삭제 요청 |
| Help/Report | 문의와 콘텐츠 신고 |

## 10. 데이터 요구사항

핵심 엔티티는 profile, device_install, privacy_consent, word, word_pack, word_example, quiz_item, audio_asset, user_word_state, learning_attempt, learning_session, daily_usage, subscription_entitlement, content_manifest, content_report, audit_log다.

게스트는 로컬 SQLite 기준으로 시작하고, 가입 후 Supabase auth user_id로 병합한다. RevenueCat appUserID는 Supabase user_id 기준이다. word_id는 immutable로 유지하고 콘텐츠 삭제는 status/retired_at으로 처리한다.

## 11. 분석 이벤트

분석은 opt-in 후에만 수집한다. §3 핵심 이벤트 표의 SSOT는 12_event_taxonomy.md다.

핵심 이벤트:

- app_opened
- age_gate_completed
- privacy_choices_saved
- onboarding_completed
- lesson_started
- word_viewed
- audio_played
- audio_failed
- word_answered
- word_mastered
- word_weakened
- lesson_completed
- lesson_abandoned
- review_started
- review_completed
- paywall_viewed
- plan_selected
- checkout_started
- subscription_purchase_succeeded
- subscription_purchase_failed
- subscription_restore_succeeded
- subscription_status_changed

GA4/Firebase 예약 이벤트명은 커스텀 이벤트로 재정의하지 않는다.

## 12. 출시 계획

| 구분 | 기간 | 기준 |
|---|---:|---|
| 구현 baseline | 16주 | 핵심 기능, 콘텐츠, 결제, QA 준비 |
| 운영/심사/버퍼 | 4주 | 심사 반려, 법무/사업자, hotfix, 출시 모니터링 |
| 총 계획 | 20주 | D-42 사업자/결제 gate 포함 |

운영 주체와 결제 수령 주체는 확정 전까지 <TBD-C-13: 한국 개인사업자 가정>으로 표기한다. D-42까지 C-13이 확정되지 않으면 paid release는 보류한다.

## 13. 수용 기준

- 첫 사용자는 계정 없이 첫 세션을 완료할 수 있다.
- 첫 세션은 권장 3분 안에 끝난다.
- 13세 미만 사용자는 학습/계정/결제/분석이 차단된다.
- opt-out 사용자는 Firebase 제품 이벤트가 수집되지 않는다.
- 무료 사용자는 60단어 범위에서 학습/복습이 가능하다.
- Premium entitlement 변경은 앱 접근 권한에 반영된다.
- Starter Pack 60단어와 MVP 300단어 콘텐츠 구조가 정상 로드된다.
- 오프라인에서는 캐시된 콘텐츠 학습과 로컬 저장이 가능하다.
- 계정 삭제 경로가 앱 내에 존재한다.
- PrivacyInfo.xcprivacy 검증이 iOS release gate에 포함된다.

## 14. 미결정/주의사항

| 항목 | 상태 |
|---|---|
| C-13 사업자/결제 수령 주체 | <TBD-C-13: 한국 개인사업자 가정>, D-42 확정 필요 |
| 무료 vs 신규 팩 샘플 정책 | CC3-01 결정: 신규 Premium pack 무료 샘플 10개는 daily 3과 분리한 preview pool로 운영한다 확정 |
| grace period 일수 | 13_payment_policy.md와 17_terms_of_service.md에서 CC3-05 결정: grace_period 3일, billing_retry without grace는 last active 후 24시간 유지, expired/refunded/revoked는 즉시 Free 강등로 추적 |
| 한국 거주자 청약철회 창구 | CC3-06 결정: 한국 거주자/한국 소비자법 적용 가능 사용자는 구매 후 7일 내 support email로 청약철회 요청 가능으로 추적 |
| 검수 분리 | CC3-07 결정: published 콘텐츠는 작성자와 독립 검수자를 분리하고 외부 한국어 원어민 또는 독립 검수자 pass/fail 검수를 P0로 요구한다로 추적 |
| phased rollout halt trigger | CC3-08 결정: phased rollout은 5/25/50/100% 단계와 crash/ANR/payment/age/data/support halt trigger를 적용한다로 추적 |

약관, 개인정보, 환불 정책은 출시 전 전문가 검토가 필요하다.
