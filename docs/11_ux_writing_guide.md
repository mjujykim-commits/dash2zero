# UX Writing 가이드

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-18 | age gate/privacy choices 카피 추가 |
| UX 검토 | 오디오 로딩/실패, 단복수, 통화 표기, 결제/가족 공유 안내 보강 |
| CC2-05 | 13세 미만 차단과 13~17세 privacy tone 반영 |

## 1. 톤 원칙

- 짧고 직접적으로 쓴다.
- 사용자를 과하게 칭찬하지 않는다.
- 학습 성과를 보장하지 않는다.
- 기능 설명을 길게 늘이지 않는다.
- 결제, 삭제, privacy는 애매하게 쓰지 않는다.
- 영어권 초보 학습자가 이해할 수 있는 쉬운 영어를 사용한다.

## 2. 기본 문체

| 원칙 | 사용 | 피함 |
|---|---|---|
| 짧은 CTA | Start lesson | Begin your transformative Korean journey |
| 구체적 상태 | 4 words to review | Keep going |
| 명확한 실패 | Audio did not load | Something went wrong |
| 결제 투명성 | Auto-renews. Cancel in the store. | Unlock everything magically |
| 학습 보조 | Review tomorrow | You have mastered Korean |

## 3. Age Gate 카피

### 질문

How old are you?

### 선택지

- Under 13
- 13 to 17
- 18 or older

### 13세 미만 차단

dash2zero is not available for children under 13.

CTA: Close

우회 방법, 다시 선택하라는 안내, 부모 동의 유도는 MVP에서 제공하지 않는다.

## 4. Privacy Choices 카피

### 제목

Privacy choices

### 본문

Help improve dash2zero with analytics and crash diagnostics. These are optional.

### 옵션

- Analytics
- Crash diagnostics

### CTA

Continue

### 설정 화면 철회

You can change these choices anytime.

## 5. Onboarding 카피

| 화면 | 문구 |
|---|---|
| Level title | How much Korean do you know? |
| Level option A | New to Korean |
| Level option B | Beginner |
| Level option C | Returning learner |
| Interest title | What brings you to Korean? |
| Start CTA | Start today's 3 words |

## 6. 학습 루프 카피

| 단계 | 제목/본문 | CTA |
|---|---|---|
| Notice | Look at the word. | Continue |
| Hear | Listen to the word. | Continue |
| Meaning | See what it means. | Try a question |
| Retrieve | What does [word] mean? | Next |

정답:

Correct

오답:

Not quite

정답 설명:

[word] means [meaning].

## 7. 오디오 상태 카피

| 상태 | 문구 | CTA |
|---|---|---|
| loading | Loading audio... | 없음 |
| loaded | Play audio | Play |
| playing | Playing... | 없음 또는 Stop |
| failed | Audio did not load. | Try again / Continue |
| offline | Audio is not available offline yet. | Continue |

발음 평가를 암시하는 문구를 쓰지 않는다. 예: “Check your pronunciation” 금지.

## 8. 단복수 규칙

| 수 | 표기 |
|---:|---|
| 0 | 0 words |
| 1 | 1 word |
| 2 이상 | 2 words |
| 1 day | 1 day |
| 2 days | 2 days |
| 1 review | 1 review |
| 2 reviews | 2 reviews |

streak 문구:

- 0 days
- 1 day streak
- 3 day streak

## 9. 통화/가격 표기

| 항목 | 표기 |
|---|---|
| 월간 | USD 1.99/month |
| 연간 | USD 14.99/year |
| 스토어 가격 | 앱 내 실제 가격은 스토어 SDK 표시값 우선 |
| 자동 갱신 | Auto-renews. Cancel anytime in App Store or Google Play. |
| 가족 공유 | Family sharing is not included. |
| 무료 체험 없음 | No free trial. Free plan is available. |

국가별 로컬 가격은 스토어가 반환한 localized price를 표시한다.

## 10. Paywall 카피

제목:

Unlock all Korean word packs

혜택:

- All 300 MVP words
- 15 new words a day
- Unlimited review
- Weak words practice

하단 고지:

Auto-renews. Cancel anytime in App Store or Google Play. No free trial. Family sharing is not included.

## 11. 권한/알림 카피

로컬 reminder opt-in:

Want a daily reminder?

A short reminder can help you keep your 3-minute habit.

CTA:

- Turn on reminders
- Not now

알림 거부 fallback:

Reminders are off. You can turn them on later in Settings.

## 12. 오류 카피

| 상황 | 문구 |
|---|---|
| 일반 오류 | Something went wrong. Try again. |
| 네트워크 | You are offline. Cached words may still work. |
| 콘텐츠 없음 | No words are ready yet. |
| 결제 실패 | The purchase did not finish. Try again in the store. |
| Restore 실패 | We could not find an active purchase for this account. |
| 병합 실패 | Your guest progress is safe. Try syncing again. |
| 삭제 요청 실패 | We could not send the deletion request. Try again. |

## 13. 계정 삭제 카피

제목:

Delete account

본문:

This removes your dash2zero account and learning data. Active subscriptions must be cancelled separately in App Store or Google Play.

확인:

I understand

최종 CTA:

Delete account

## 14. 콘텐츠 신고 카피

CTA:

Report an issue

유형:

- Typo
- Translation
- Romanization
- Audio
- Too difficult
- Other

완료:

Thanks. We will review this item.

## 15. 금지 표현

- Become fluent fast
- Master Korean in days
- AI tutor
- Speaking test
- Pronunciation score
- Guaranteed results
- Native-level Korean
- For children
