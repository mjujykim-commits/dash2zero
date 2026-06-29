# 디자인 시스템

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-25 | 한글 최상위, romanization 보조, iPhone SE 단일 컬럼 기준 |
| CC2-18 | privacy choices/age gate를 기본 컴포넌트로 포함 |
| UX 검토 | 영문 폰트, 8pt grid, 다크 모드 토큰 보강 |

## 1. 디자인 원칙

- 학습 도구처럼 조용하고 빠르게 느껴져야 한다.
- 한글 단어가 첫 번째 시각 신호다.
- 장식보다 읽기, 듣기, 선택하기의 명확성을 우선한다.
- 하단 CTA는 한 화면의 다음 행동을 분명히 한다.
- iPhone SE급 화면에서 모든 핵심 텍스트와 버튼이 겹치지 않는다.
- 카드 안에 또 다른 카드 구조를 만들지 않는다.

## 2. 컬러 토큰

| 토큰 | 값 | 용도 |
|---|---|---|
| color.bg | #FAFAF7 | 기본 배경 |
| color.surface | #FFFFFF | 카드/시트 배경 |
| color.text.primary | #1F2933 | 주요 텍스트 |
| color.text.secondary | #61707D | 보조 텍스트 |
| color.border | #D8DEE4 | 구분선 |
| color.action | #1F7A5B | 주요 CTA |
| color.action.text | #FFFFFF | CTA 텍스트 |
| color.warning | #B7791F | 주의/결제 상태 |
| color.danger | #C2413A | 삭제/오류 |
| color.success | #2F855A | 정답/성공 |
| color.info | #2B6CB0 | 정보성 링크 |

단일 hue 지배를 피하고, 학습 UI는 배경/텍스트/액션의 대비로 구성한다.

## 3. 다크 모드 토큰

MVP에서는 다크 모드 완전 QA를 P2로 둔다. 단, 토큰 구조는 미리 준비한다.

| 토큰 | Light | Dark 후보 |
|---|---|---|
| color.bg | #FAFAF7 | #111827 |
| color.surface | #FFFFFF | #1F2937 |
| color.text.primary | #1F2933 | #F9FAFB |
| color.text.secondary | #61707D | #CBD5E1 |
| color.border | #D8DEE4 | #374151 |
| color.action | #1F7A5B | #34D399 |
| color.danger | #C2413A | #F87171 |

다크 모드는 출시 차단 기능이 아니며, 색상 토큰만 코드 구조에 준비한다.

## 4. 타이포그래피

| 용도 | 폰트 | 크기 | 굵기 | 비고 |
|---|---|---:|---:|---|
| Korean word | Noto Sans KR | 48 | 700 | Word flow 최상위 |
| Korean compact | Noto Sans KR | 32 | 700 | 작은 화면/복습 |
| Romanization | System / Inter | 18 | 500 | 보조 정보 |
| English heading | System / Inter | 24 | 700 | 화면 제목 |
| Body | System / Inter | 16 | 400 | 설명/예문 |
| Small | System / Inter | 13 | 400 | 보조 라벨 |
| Button | System / Inter | 16 | 700 | CTA |

영문 폰트는 시스템 폰트를 기본으로 둔다. Inter 번들은 앱 크기와 라이선스/성능 이슈가 없을 때만 사용한다. 한국어는 Noto Sans KR을 기준으로 한다.

## 5. 8pt Grid

| 토큰 | 값 | 용도 |
|---|---:|---|
| space.1 | 4 | 미세 간격 |
| space.2 | 8 | 기본 내부 간격 |
| space.3 | 12 | 라벨/본문 사이 |
| space.4 | 16 | 섹션 내부 |
| space.5 | 24 | 화면 블록 사이 |
| space.6 | 32 | 상하 큰 간격 |
| space.8 | 48 | hero성 단어 영역 |

고정 포맷 요소는 aspect ratio 또는 min/max height를 갖는다. hover/pressed/loading 상태로 레이아웃이 밀리면 안 된다.

## 6. Radius / Border / Shadow

| 토큰 | 값 | 용도 |
|---|---:|---|
| radius.sm | 6 | 입력/작은 칩 |
| radius.md | 8 | 카드/버튼 기본 |
| radius.lg | 12 | bottom sheet |
| border.default | 1 | 카드/구분 |
| shadow.none | 0 | 기본 |
| shadow.sheet | subtle | modal/bottom sheet |

일반 카드는 8px radius를 넘지 않는다. 중첩 카드 금지.

## 7. 컴포넌트

### 7.1 Primary Button

- 높이: 52px
- radius: 8px
- full width on small screens
- loading 상태에서도 높이 고정
- disabled는 대비를 유지하되 누를 수 없음이 명확해야 함

### 7.2 Icon Button

- 최소 터치 영역 44px
- 오디오 재생, 뒤로가기, 설정 등은 아이콘 사용
- unfamiliar icon은 accessibility label 필수

### 7.3 Word Card

| 영역 | 기준 |
|---|---|
| Korean | 카드 상단 중앙, 가장 큼 |
| Romanization | Korean 아래 보조 |
| English | Meaning 단계에서 명확히 표시 |
| Example | Meaning 단계 하단 |
| Audio | Hear 단계 주요 control |
| CTA | 화면 하단 고정 |

### 7.4 Choice Button

- 4지선다 고정 높이 권장
- 정답/오답 색상 + 아이콘/텍스트로 피드백
- 선택 후 같은 문제에서 중복 tap 방지

### 7.5 Privacy Choices

- checkbox 또는 switch 사용
- 기본 off
- Continue는 off 상태에서도 가능
- 13~17세는 마케팅/광고성 선택지를 노출하지 않음

### 7.6 Age Gate

- neutral age band 선택
- 생년월일 전체 입력 금지
- 13세 미만 선택 시 차단 화면
- 차단 화면에는 우회 방법을 안내하지 않음

## 8. 레이아웃 기준

| 화면 | 레이아웃 |
|---|---|
| Age/Privacy/Onboarding | 단일 컬럼, 하단 CTA |
| Home | compact dashboard, CTA 1~2개 |
| Word Flow | scroll card + 하단 CTA |
| Paywall | 가격/조건 명확, Terms/Privacy 링크 |
| Settings | list layout |
| Delete Account | 경고 색상과 2단계 확인 |

## 9. 접근성

- 터치 타깃 44px 이상
- WCAG AA 대비 목표
- VoiceOver/TalkBack label 필수
- 정답/오답을 색만으로 구분하지 않음
- 동적 글자 크기 120%까지 주요 CTA 표시
- 오디오 버튼 라벨: Play pronunciation for [word]

## 10. 금지 패턴

- 장식용 gradient orb/bokeh 배경
- marketing hero형 첫 화면
- 카드 안 카드
- 문서 설명문처럼 기능을 길게 설명하는 인앱 텍스트
- 글자 크기를 viewport width로 직접 스케일링
- 음성 녹음/발화 기능을 암시하는 아이콘 또는 문구
