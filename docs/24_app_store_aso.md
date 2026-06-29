# 24. 앱스토어/ASO 기획서

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-05 | 13세 미만 대상 아님, Kids Category/under-13 target audience 미사용 |
| CC2-19 | ASO 키워드는 실측 근거 없으면 가설로 표기 |
| CC2-20 | MVP territory는 US/CA/UK/AU/NZ, EU/EEA 제외 |
| CC2-25 | 스크린샷에 4단계 학습 루프와 한글 최상위 화면 반영 |
| OPS 리뷰 | Account Holder/C-13, Apple Sign In Android 잔여 마커 반영 |

## 1. 문서 목적

이 문서는 dash2zero MVP의 App Store와 Google Play 등록 정보, 포지셔닝, 스크린샷 구성, 검색 키워드 가설을 정의한다. 실제 제출 전에는 각 스토어의 최신 정책과 글자 수 제한을 다시 확인한다.

## 2. 스토어 포지셔닝

핵심 메시지:

Learn 3 Korean words a day in about 3 minutes.

사용자 약속:

- beginner-friendly Korean vocabulary
- small daily lessons
- review system that brings words back before they fade
- no pressure, no long lessons
- built for English-speaking learners

말하지 않을 것:

- fluency 보장
- 단기간 완성 보장
- 발음 평가 제공
- AI 튜터 제공
- TOPIK 고득점 보장
- children 대상 서비스

## 3. 앱 이름 후보

| 용도 | 문구 | 비고 |
|---|---|---|
| Primary | dash2zero: Korean Words | 서비스명 + 검색어 균형 |
| Alternative | dash2zero Korean Vocabulary | 더 설명적 |
| Short | dash2zero | 브랜드 단독, 검색 약함 |

MVP 기본안은 dash2zero: Korean Words로 둔다.

## 4. Subtitle / Short Description

### App Store subtitle 후보

| 후보 | 의도 |
|---|---|
| 3 Korean words a day | 가장 직접적 |
| Learn Korean in 3 minutes | 핵심 루프 강조 |
| Korean vocabulary for beginners | 검색 의도 중심 |

기본안은 3 Korean words a day로 둔다.

### Google Play short description 후보

| 후보 | 의도 |
|---|---|
| Learn 3 Korean words a day with quick beginner lessons. | 기능+대상 명확 |
| Build Korean vocabulary in 3 minutes a day. | 짧고 기억 쉬움 |
| Simple Korean vocabulary practice for beginners. | 검색 의도 중심 |

기본안은 Learn 3 Korean words a day with quick beginner lessons.로 둔다.

## 5. Long Description 초안

dash2zero helps English-speaking beginners build Korean vocabulary with small daily lessons.

Learn 3 Korean words a day, review them with simple quizzes, and keep going without long study sessions. Each word includes Korean spelling, romanization, English meaning, example sentences, and audio playback.

What you can do:

- Learn beginner Korean words in short daily sessions
- See Korean spelling and romanization
- Hear Korean words and examples with audio playback
- Review words with a spaced repetition system
- Start as a guest and create an account later
- Keep your progress across devices when signed in
- Unlock more words and unlimited review with Premium

dash2zero is designed for learners who want a calm, consistent way to start Korean vocabulary. It does not include speaking tests, voice recording, or AI chat in the MVP.

## 6. 키워드 가설

실측 근거가 없는 키워드는 확정이 아니라 가설로 표기한다.

### App Store keyword 후보

- Korean
- Korean words
- Korean vocabulary
- learn Korean
- Hangul
- Korean beginner
- Korean flashcards
- spaced repetition

### Google Play 본문 반영 키워드

- learn Korean vocabulary
- Korean words for beginners
- Korean flashcards
- Korean study app
- Korean spaced repetition
- beginner Korean

출시 전 최소 확인:

- Apple Search Ads keyword popularity 수동 확인
- Google Play 검색 제안 수동 확인
- 경쟁 앱 title/subtitle 10개 샘플링
- 실측 근거가 없으면 ASO 가설로만 유지

## 7. 카테고리와 연령

| 항목 | 기준 |
|---|---|
| App Store Category | Education |
| Google Play Category | Education |
| Kids Category | 사용하지 않음 |
| Google target audience | under-13 미포함 |
| 서비스 이용 가능 연령 | 13세 이상 |
| 콘텐츠 기반 연령 등급 | 스토어 설문 결과 기준, 4+ 가능성 높음 |

주의: 스토어 콘텐츠 등급이 낮게 나오더라도 dash2zero 서비스 자체는 13세 미만을 대상으로 하지 않는다. 앱 내 age gate에서 13세 미만 사용을 차단한다.

## 8. Territory

MVP 출시국:

- United States
- Canada
- United Kingdom
- Australia
- New Zealand

EU/EEA 국가는 명시적으로 제외한다. App Store Connect와 Google Play Console territory 설정 스크린샷을 제출 전 증빙으로 보관한다.

## 9. 스크린샷 구성

| 순서 | 화면 | 헤드라인 |
|---:|---|---|
| 1 | Home / today lesson | 3 Korean words a day |
| 2 | Notice | See the Korean word first |
| 3 | Hear | Listen when you are ready |
| 4 | Meaning | Learn meaning with a short example |
| 5 | Retrieve | Check what you remember |
| 6 | Review queue | Review before words fade |
| 7 | Paywall | Unlock more words and unlimited review |

시각 기준:

- 실제 앱 화면을 사용한다.
- 한글 단어가 명확히 보여야 한다.
- iPhone SE급 레이아웃을 고려해 텍스트를 짧게 둔다.
- 마케팅 과장 이미지를 만들지 않는다.
- 음성 녹음/발화 평가로 오해될 이미지를 쓰지 않는다.

## 10. 앱 아이콘 방향

- 브랜드명 dash2zero의 2 또는 0을 시각 중심으로 둔다.
- 한국어 학습 앱임을 과하게 국기 이미지로만 표현하지 않는다.
- 작은 크기에서도 구분되는 단순한 형태를 사용한다.
- 복잡한 그라데이션과 세부 묘사는 피한다.

## 11. 심사 메모

스토어 심사용 메모에는 아래 내용을 포함한다.

- The app can be used as a guest for the first lesson.
- Premium unlocks more words and unlimited review.
- The app does not include voice recording, speaking tests, public user-generated content, or AI chat.
- Users under 13 are blocked by the age gate.
- Analytics and diagnostics are optional and off by default.
- Account deletion is available in Settings > Account > Delete Account.
- Restore Purchases is available in Settings and Paywall after sign-in.

## 12. 개인정보/데이터 안전 입력 기준

| 항목 | 입력 방향 |
|---|---|
| 계정 정보 | 로그인 사용 시 이메일/사용자 ID 수집 가능 |
| 구매 정보 | 앱스토어/구글플레이/RevenueCat을 통해 구독 상태 처리 |
| 앱 활동 | 학습 진행, 화면/이벤트 분석은 opt-in 후 수집 |
| 진단 | crash/performance 데이터는 opt-in 후 수집 |
| 위치 | 수집하지 않음 |
| 음성 | 수집하지 않음 |
| 연락처 | 수집하지 않음 |
| 광고 추적 | 사용하지 않음 |
| 판매/공유 | MVP에서 개인정보 판매/공유 없음 |

실제 입력 전 Firebase/RevenueCat/Supabase 설정과 앱 코드 기준으로 재확인한다.

## 13. 가격 표시 가설

| 상품 | 가격 가설 | 스토어 표시 예시 |
|---|---:|---|
| Monthly Premium | USD 1.99/month | Unlock all words and unlimited review |
| Yearly Premium | USD 14.99/year | Best value for steady learners |

가격은 1인 개발 서비스라는 점을 반영해 낮게 시작한다. 실제 국가별 가격은 Apple/Google localized price를 따른다.

## 14. Account Holder / C-13

스토어 등록 사업자와 결제 수령 주체는 확정 전까지 <TBD-C-13: 한국 개인사업자 가정>으로 표기한다.

D-42까지 아래를 확정해야 한다.

- Apple Developer Account holder
- Google Play payments profile
- 세금 서류
- 결제 수령 계좌
- 지원 URL/Privacy URL의 운영자 정보

## 15. Android Apple Sign In 잔여 결정

- CC3-03 결정: Android에도 Sign in with Apple web flow를 보조 로그인 옵션으로 제공한다. 임시 ASO/심사 기준은 iOS에는 Apple Sign In을 제공하고, Android에는 Google Sign-In과 email magic link를 기본 제공한다. Apple 계정 사용자가 Android에서 계정 복구할 수 있어야 한다면 Android Apple Sign In 웹 플로우 또는 email link 보조 정책을 확정해야 한다.

## 16. ASO 성과 지표

- store page view
- product page conversion rate
- keyword ranking
- install conversion
- uninstall rate after first day
- first_lesson_completed rate
- paywall view to purchase conversion

## 17. 출시 후 개선 가설

| 신호 | 개선 방향 |
|---|---|
| store view는 있으나 설치 낮음 | 첫 스크린샷/short description 개선 |
| 설치 후 첫 학습 완료 낮음 | 온보딩 단축, 첫 lesson 진입 개선 |
| paywall view 높고 구매 낮음 | Premium 가치 문구와 가격 재검토 |
| 콘텐츠 신고 많음 | 콘텐츠 QA 프로세스 강화 |
| 검색 유입 낮음 | keyword/description 조정 |

## 18. 확정 필요 사항

- 최종 앱 아이콘과 스크린샷 디자인
- C-13 사업자/결제 수령 주체
- 개인정보 처리방침 URL
- 지원 URL
- Android Apple Sign In 정책
- ASO 키워드 실측 근거
