# 알림 정책서

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-05 | 13~17세 마케팅 push 금지 |
| CC2-18 | privacy choices 기본 off와 설정 철회 반영 |
| FE 리뷰 | iOS provisional, 권한 거부 fallback, 조용한 시간 timezone 처리 보강 |

## 1. 알림 원칙

- MVP 알림은 학습 습관 보조용 로컬 알림을 우선한다.
- 원격 push는 MVP 제외 또는 P2로 둔다.
- 알림 권한은 앱 첫 실행 시 요청하지 않는다.
- 첫 lesson 완료 후 사용자가 reminder를 원할 때 요청한다.
- 사용자가 거부해도 핵심 학습 기능은 정상 동작해야 한다.
- 13~17세 사용자에게 마케팅성 알림을 보내지 않는다.

## 2. 알림 유형

| 유형 | MVP 포함 | 설명 |
|---|---:|---|
| Daily local reminder | P1 | 사용자가 선택한 시간에 학습 알림 |
| Review due local reminder | P1 | due review가 있을 때 로컬 알림 |
| Marketing push | 제외 | MVP 미사용 |
| Remote push | P2 | 서버 push 인프라 필요 |
| Subscription renewal push | 제외 | 스토어 시스템 안내 우선 |

## 3. 권한 요청 시점

1. 사용자가 첫 lesson을 완료한다.
2. 앱이 자체 reminder opt-in 화면을 보여준다.
3. 사용자가 Turn on reminders를 누른다.
4. OS notification permission을 요청한다.
5. 허용 시 로컬 알림 스케줄을 만든다.
6. 거부 시 홈/설정에 fallback 안내를 둔다.

## 4. iOS Provisional 권한

iOS provisional notification은 MVP 기본 전략으로 사용하지 않는다. 사용자가 명시적으로 reminder를 켠 뒤 standard permission을 요청한다.

향후 provisional을 실험하려면 아래 조건이 필요하다.

- 13~17세 사용자 제외 또는 별도 privacy 검토
- 알림 내용이 학습 reminder로 제한
- 설정에서 즉시 끌 수 있음
- App Store 심사 메모에 알림 목적 설명

## 5. 알림 카피

### 5.1 Opt-in 화면

Want a daily reminder?

A short reminder can help you keep your 3-minute habit.

CTA:

- Turn on reminders
- Not now

### 5.2 권한 거부 후

Reminders are off. You can turn them on later in Settings.

### 5.3 Daily reminder

Time for 3 Korean words.

### 5.4 Review reminder

You have words ready to review.

## 6. 조용한 시간

- 기본 조용한 시간: 21:00~08:00 사용자 로컬 timezone.
- 사용자가 21:00~08:00 사이 시간을 직접 선택하면 허용한다.
- timezone 변경 시 다음 스케줄부터 새 timezone 기준으로 계산한다.
- 04:00 학습일 reset과 알림 시간은 별도 개념이다.

## 7. 알림 설정

| 설정 | 기본값 | 설명 |
|---|---|---|
| Daily reminder | off | 사용자가 시간 선택 |
| Review reminder | off | due review가 있을 때만 |
| Quiet hours | on | 21:00~08:00 |
| Marketing | off/미사용 | MVP 사용 금지 |

## 8. 권한 거부 fallback

| 상황 | 앱 처리 |
|---|---|
| OS 권한 거부 | Home에 reminder off 상태 표시 |
| 권한 영구 거부 | Settings로 이동 안내 |
| 알림 스케줄 실패 | 앱 내 due count와 home CTA 유지 |
| 13세 미만 | 알림 요청 없음 |
| pending_delete | 모든 알림 취소 |

## 9. 분석 이벤트

알림 이벤트는 analytics opt-in 사용자에게만 수집한다.

- reminder_prompt_viewed
- reminder_permission_requested
- reminder_permission_granted
- reminder_permission_denied
- reminder_scheduled
- reminder_cancelled

## 10. QA 기준

- 앱 첫 실행 시 OS 알림 prompt가 뜨지 않는다.
- 첫 lesson 완료 전에는 권한 요청이 없다.
- Turn on reminders를 눌러야 OS prompt가 뜬다.
- 거부 후 학습 기능이 막히지 않는다.
- 13세 미만 차단 사용자는 알림 요청이 없다.
- pending_delete 상태에서 예약 알림이 취소된다.
