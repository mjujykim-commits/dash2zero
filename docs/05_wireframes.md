# 화면설계서 / Wireframe 초안

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-18 | 첫 실행 순서 age gate -> privacy choices -> onboarding |
| CC2-25 | iPhone SE급 단일 컬럼, 하단 고정 CTA, Notice/Hear/Meaning/Retrieve 4단계 |
| CC2-05 | 13세 미만 차단, 13~17세 privacy 우선 |

## 1. 화면설계 원칙

- 모바일 앱 첫 화면은 학습 도구여야 하며 랜딩 페이지처럼 보이면 안 된다.
- 하루 3분 루프를 방해하는 장식, 긴 설명, 과도한 카드 중첩을 피한다.
- 한 화면의 주요 행동은 1개로 제한한다.
- 한글 단어가 첫 시각 신호가 되도록 한다.
- iPhone SE급 화면에서도 버튼과 텍스트가 겹치지 않는다.
- 결제, 계정 삭제, 개인정보 화면은 같은 디자인 시스템 안에서 처리한다.

## 2. 정보 구조

MVP 하단 탭은 3개로 시작한다.

| 탭 | 포함 화면 |
|---|---|
| Home | Today lesson, Review due, Progress summary |
| Packs | Starter/Premium packs, locked state, paywall entry |
| Settings | Account, Notifications, Privacy, Help, Delete Account |

Review와 Progress는 Home 안에서 진입한다.

## 3. 첫 실행 플로우

### 3.1 Splash

    dash2zero
    Loading...

### 3.2 Age Gate

    How old are you?

    [Under 13]
    [13 to 17]
    [18 or older]

13세 미만 선택 시:

    dash2zero is not available for children under 13.
    [Close]

### 3.3 Privacy Choices

    Privacy choices
    Help improve dash2zero with analytics and crash diagnostics.

    [ ] Analytics
    [ ] Crash diagnostics

    [Continue]

기본값은 모두 off다. 13~17세는 high privacy default 문구를 더 짧고 명확하게 제공한다.

### 3.4 Level

    How much Korean do you know?

    [New to Korean]
    [Beginner]
    [Returning learner]

### 3.5 Interests

    What brings you to Korean?

    [K-drama] [K-pop]
    [Travel] [Food]
    [Friends] [Daily life]

    [Start today's 3 words]

## 4. Home

    Today
    0 / 3 words

    Review due: 4
    Streak: 2 days

    [Start 3-minute lesson]
    [Review due words]

    Learned 18 · Mastered 3 · Weak 2

상태:

| 상태 | 처리 |
|---|---|
| 오늘 lesson 완료 전 | Start 3-minute lesson 강조 |
| due review 있음 | Review due words 표시 |
| 무료 한도 초과 | limit 안내 + paywall CTA |
| offline | cached content 안내 |
| pending_delete | 신규 학습 CTA 숨김 |

## 5. 4단계 Word Flow

### 5.1 공통 레이아웃

- 단일 컬럼
- 화면 상단 progress: 1/3 words 또는 review count
- 중앙 scroll 가능한 word card
- 하단 고정 CTA
- iPhone SE에서 한글/뜻/CTA가 동시에 인지 가능해야 함

### 5.2 Notice

    1 / 3

    사과
    sagwa

    [Continue]

한글이 최상위 시각 요소다. romanization은 보조 크기다.

### 5.3 Hear

    사과

    [Play audio]
    Listen to the word.

    [Continue]

오디오는 수동 재생이 기본이다. 실패 시:

    Audio didn't load.
    [Try again] [Continue]

### 5.4 Meaning

    사과
    apple

    사과 주세요.
    Apple, please.

    Pattern
    주세요 = please give me

    [Try a question]

Pattern note는 있을 때만 표시한다.

### 5.5 Retrieve

    What does 사과 mean?

    [apple]
    [water]
    [coffee]
    [banana]

정답 피드백:

    Correct
    사과 means apple.
    [Next]

오답 피드백:

    Not quite
    사과 means apple.
    [Next]

## 6. Session Result

    3 words learned
    Review tomorrow

    Learned: 21
    Streak: 3 days

    [Done]

첫 세션 완료 후 알림 권한은 곧바로 OS prompt를 띄우지 않고, 로컬 reminder opt-in 화면을 먼저 보여준다.

## 7. Pack Library

    Starter Korean
    Free · 60 words
    [Start]

    Survival Korean
    Premium · 80 words
    [Unlock]

    Daily Korean
    Premium · 80 words
    [Unlock]

    K-Content Korean
    Premium · 80 words
    [Unlock]

## 8. Paywall

게스트가 paywall CTA를 누르면 먼저 로그인/가입 화면을 표시한다.

    Unlock all Korean word packs

    Monthly USD 1.99
    Annual USD 14.99

    Includes all 300 words, daily 15 new words, and unlimited review.
    Auto-renews. Cancel anytime in App Store or Google Play.
    Family sharing is not included.

    [Continue]
    [Restore purchases]
    [Terms] [Privacy]

grace period 문구는 CC3-05 결정에 맞춰 반영한다.

## 9. Settings

    Account
    Notifications
    Audio
    Romanization
    Privacy choices
    Help
    Delete account

Privacy choices에서는 analytics와 diagnostics를 철회할 수 있어야 한다.

## 10. Delete Account

    Delete account

    This removes your dash2zero account and learning data.
    Active subscriptions must be cancelled in App Store or Google Play.

    [I understand]
    [Delete account]

2단계 확인 후 deletion request를 생성한다.

## 11. 상태 화면

| 상태 | 화면 처리 |
|---|---|
| 로딩 3초 미만 | Skeleton |
| 로딩 3초 이상 | Retry 버튼 |
| 오프라인 | 캐시 학습만 가능 안내 |
| 콘텐츠 없음 | No words ready yet + Home |
| 오디오 실패 | Try again + Continue |
| 결제 실패 | 스토어 오류 + Retry |
| Restore 실패 | 로그인/스토어 계정 확인 안내 |
| 삭제 확인 | 2단계 확인 |
| 13세 미만 | 서비스 이용 불가 화면 고정 |

## 12. 접근성 기준

- 터치 타깃 44px 이상
- 색 대비 WCAG AA 기준
- VoiceOver/TalkBack 라벨 제공
- 오디오 버튼 라벨 예: Play pronunciation for 사과
- 동적 글자 크기 120%까지 레이아웃 유지
- 정답/오답은 색만으로 구분하지 않음

## 13. 반응형 범위

- iPhone SE급 소형 화면: 단일 컬럼, scroll card, 하단 CTA
- 일반 iPhone/Android: 동일 구조, 여백 확대
- 대형 iPhone/Android: 카드 max width 제한
- 태블릿: 확대형 레이아웃만 지원
