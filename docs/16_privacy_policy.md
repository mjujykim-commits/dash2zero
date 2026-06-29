# 개인정보 처리방침 초안

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-01 | 컨트롤러/운영자 정보에 C-13 마커 반영 |
| CC2-05 | 13세 미만 차단과 13~17세 high privacy default 반영 |
| CC2-18 | Analytics/Crashlytics opt-in 흐름 반영 |
| B-07 | 개인정보 판매/공유 및 광고 추적 없음, Do not sell/share 문구 반영 |
| B-10 | 24시간 triage, 72시간 침해 통지 기준 반영 |
| SEC 리뷰 | DSAR 채널, 법적 근거, 처리자/국외 이전 보강 |

## 1. 문서 상태

이 문서는 내부 개발용 개인정보 처리방침 초안이다. 실제 출시 전 법무 검토가 필요하다.

- 컨트롤러/운영자: <TBD-C-13: 한국 개인사업자 가정>
- 임시 가정: 한국 개인사업자 + 통신판매업 신고 예정
- 공식 언어: en-US 단독
- C-13 확정 데드라인: 베타 출시 4주 전, 공개 출시 D-42

## 2. 서비스와 대상

dash2zero는 영어권 초보자를 위한 한국어 단어 학습 앱이다. MVP는 13세 미만을 대상으로 하지 않는다.

- 13세 미만: 앱 사용, 계정 생성, 학습 시작, 분석 수집, 결제 차단
- 13~17세: high privacy default 적용, 비필수 분석 opt-in, 마케팅 알림 금지
- 18세 이상: privacy choices에서 분석/진단 동의 선택 가능

## 3. 수집 데이터

| 데이터 | 예시 | 수집 조건 |
|---|---|---|
| 계정 정보 | user_id, email, auth provider | 로그인 시 |
| age gate | age band, 통과 여부 | 첫 실행 시 |
| 학습 데이터 | 단어 stage, attempts, streak, daily_usage | 학습 기능 사용 시 |
| 콘텐츠 신고 | target id, report type, message | 신고 제출 시 |
| 구독 상태 | RevenueCat app user id, entitlement, product id, status | 구매/복원 시 |
| 분석 데이터 | lesson/review/paywall 이벤트 | opt-in 후 |
| 진단 데이터 | crash log, app/device diagnostics | opt-in 후 |
| 문의 데이터 | 이메일, 문의 내용, 지원 코드 | 지원 문의 시 |

## 4. 수집하지 않는 데이터

- 음성 녹음
- 위치 정보
- 연락처
- 사진/파일
- 광고 ID/IDFA
- 자체 카드 결제 정보
- precise birthdate
- 사용자용 AI 생성 예문 입력

## 5. 처리 목적과 법적 근거

| 목적 | 데이터 | 법적 근거 가정 |
|---|---|---|
| 앱 계정 제공 | 계정 정보 | 계약 이행 |
| 학습 기능 제공 | 학습 데이터 | 계약 이행 |
| 구독 권한 제공 | 구독 상태 | 계약 이행, 법적 의무 |
| 계정 삭제/데이터 권리 처리 | 계정/학습 데이터 | 법적 의무, 계약 이행 |
| 콘텐츠 오류 처리 | 콘텐츠 신고 | 정당한 이익 |
| 보안/부정 사용 방지 | 로그, audit, rate limit | 정당한 이익 |
| 제품 분석 | 분석 이벤트 | 동의 |
| crash 진단 | 진단 데이터 | 동의 |
| 고객지원 | 문의 데이터 | 계약 이행, 정당한 이익 |

최종 legal basis는 출시 전 법무 검토에서 확정한다.

## 6. Privacy Choices

첫 실행 순서는 age gate -> privacy choices -> onboarding이다.

기본값:

- Analytics: off
- Crash diagnostics: off
- Marketing notifications: off/not used

사용자는 Settings에서 언제든 동의를 철회할 수 있다. 철회 후에는 이후 이벤트 수집을 중단한다.

## 7. 개인정보 판매/공유

MVP는 광고 SDK, 광고 ID/IDFA, cross-context behavioral advertising을 사용하지 않는다. dash2zero는 MVP에서 개인정보를 판매하거나 공유하지 않는다.

정책 문구:

We do not sell or share personal information.

향후 광고 추적, sell/share에 해당할 수 있는 처리가 생기면 캘리포니아 배포 전 Your Privacy Choices 또는 Do Not Sell or Share My Personal Information 링크와 Notice at Collection을 추가한다.

## 8. 처리자와 국외 이전

| 처리자 | 국가/지역 | 목적 |
|---|---|---|
| Supabase | 미국/EU 등 제공 리전 | Auth, DB, Storage |
| RevenueCat | 미국 등 | 구독 상태 처리 |
| Firebase/Google | 미국 등 | Analytics/Crashlytics |
| Apple | 사용자 스토어 국가 등 | App Store IAP, Apple Sign In |
| Google | 사용자 스토어 국가 등 | Google Play Billing, Google Sign-In |
| Email provider | TBD | 고객지원 |

실제 처리자, 리전, DPA/SCC 등 국외 이전 안전장치는 출시 전 최종 확인한다.

## 9. 데이터 보존

| 데이터 | 보존 기준 |
|---|---|
| 계정 데이터 | 계정 유지 기간, 삭제 요청 후 30일 내 삭제/비식별화 |
| 학습 데이터 | 계정 유지 기간, 삭제 요청 후 30일 내 삭제 |
| 게스트 로컬 데이터 | 앱 설치 유지 기간 또는 계정 병합 후 정리 |
| 구독 데이터 | 계정/구독 유지 기간 및 법적/분쟁 대응 필요 기간 |
| 분석/진단 데이터 | Firebase 설정 기준, opt-in 사용자만 |
| 문의/신고 데이터 | 처리 후 운영 필요 기간 |
| audit_log | 보안 운영 필요 기간 |

## 10. 사용자 권리와 DSAR

사용자는 적용 법률에 따라 접근, 정정, 삭제, 처리 제한, 이동, 동의 철회, 이의 제기 권리를 가질 수 있다.

MVP 처리 채널:

- 앱: Settings > Account > Delete Account
- 앱: Settings > Privacy choices
- 이메일: support email, C-13 확정 후 최종 표기
- 컨트롤러: <TBD-C-13: 한국 개인사업자 가정>

DSAR 처리 목표는 30일이다. 본인 확인을 위해 로그인 계정, 지원 코드, 이메일 확인이 필요할 수 있다.

## 11. 계정 삭제

- 계정 삭제 요청은 앱 설정에서 시작한다.
- 삭제 요청 후 신규 학습과 결제를 차단할 수 있다.
- 계정/학습 데이터는 30일 내 삭제 또는 비식별화한다.
- 활성 구독 취소는 App Store 또는 Google Play에서 별도로 처리해야 한다.
- 법적/분쟁/세무상 필요한 최소 데이터는 보존될 수 있다.

## 12. 아동과 청소년

- 13세 미만은 서비스 이용 불가.
- 13세 미만 선택 시 학습/계정/분석/결제 차단.
- 13~17세는 high privacy default.
- 13~17세에게 마케팅 push를 보내지 않는다.
- Kids Category 또는 under-13 target audience로 출시하지 않는다.

## 13. 보안

- Supabase RLS default deny.
- 사용자 데이터 owner-only 접근.
- service role key는 앱에 포함하지 않음.
- 결제 entitlement는 client read-only/server write-only.
- production secret은 암호화 vault에 보관.
- 운영 접근과 민감 변경은 audit_log에 기록.

## 14. 침해 통지

개인정보 침해가 의심되면 24시간 내 내부 triage와 breach log를 시작한다. UK GDPR 등 적용 법률상 통지가 필요한 경우 인지 후 72시간 내 감독기관 신고를 목표로 한다. 사용자에게 고위험이 있는 경우 지체 없이 사용자 통지를 검토한다.

## 15. AI 사용

AI는 콘텐츠 제작 보조에만 사용된다. 사용자의 학습 데이터, 문의 내용, 개인 데이터를 사용자별 AI 예문 생성 또는 모델 학습 목적으로 사용하지 않는다.

향후 AI 기능이 추가되면 별도 동의, 처리 목적, 데이터 보존, opt-out 기준을 다시 정의한다.

## 16. 정책 변경

> W15 갱신 (2026-05-11): 종전 RED 상태 (#11) 해소. 중요 변경(material change)과 비중요 변경(notice-only)을 분기하고 in-app 절차를 명시한다.

### 16.1 변경 분류

| 변경 유형 | 분기 | 사용자 절차 |
|---|---|---|
| **Material change (re-consent 필요)** — 신규 카테고리 데이터 수집, 처리 목적 신설, 신규 처리자 / 국외 이전 추가, 보존 기간 연장, sell/share 신설, 13~17세 관련 변경, DSAR 채널 축소 | re-consent | 시행 14일 전 in-app banner 노출 + 이메일(보유 사용자) → 시행일에 onboarding 동의 화면 재노출 → 동의 거부 시 해당 처리 중단(서비스 핵심 기능 영향 시 사용자 안내 후 계정 유지/삭제 선택) |
| **Notice-only change** — 문구 다듬기, 처리자 이름 변경(범위 동일), 회사 주소 변경, 오타 정정, 추가 권리 안내(축소 없음) | notice-only | 시행일에 in-app banner 1회 노출 + Settings > Legal > Changelog 갱신, 별도 동의 청구 없음 |
| **Security / 침해 통지 관련** | 별도 절차 | §14 침해 통지 절차 적용 (24h triage / 72h 감독기관) |

### 16.2 통지 채널 우선순위

1. In-app banner (앱 실행 시 1회 dismissible, material change는 강제 동의 modal)
2. 보유 이메일 (회원가입 이메일 보유 사용자만, marketing opt-in과 분리된 transactional 채널)
3. Settings > Legal > Changelog (모든 변경 영구 기록, 시행일 / 분류 / diff summary)

### 16.3 운영 책임

- 변경 PR 시 본 §16.1 분류 라벨 부착 필수 (`material` / `notice-only`).
- material change는 시행 30일 전 legal + product orchestrator 서명 필요.
- audit_log에 정책 변경 이벤트 기록 (changelog_id / classification / actor / 시행일).

### 16.4 일반 원칙

개인정보 수집 범위, 분석/진단, 광고/판매/공유 관련 변경은 출시 전 정책과 앱 동의 흐름을 함께 갱신한다. 합리적인 사전 고지 없이 사용자 권리를 축소하지 않는다.

## 17. 출시 전 확정 필요

- C-13 사업자/컨트롤러 정보
- support email과 DSAR 채널
- 처리자 리전/DPA/SCC
- Firebase 데이터 보존 기간
- RevenueCat raw event 보존 기간
- 캘리포니아 Notice at Collection 필요 여부 최종 판단
