# 20. 고객지원 운영 매뉴얼

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-01/16 | 운영 주체 C-13 마커와 D-42 gate 반영 |
| CC2-05 | 13세 미만 차단, 13~17세 privacy 문의 대응 반영 |
| CC2-06/08 | RevenueCat user mapping과 결제 status enum 반영 |
| B-10 | 보안 사고 24시간 triage, 72시간 통지 SOP 반영 |
| PM 리뷰 | 1인 운영 SLA 현실화 잔여 마커 추가 |

## 1. 문서 목적

이 문서는 dash2zero MVP 출시 후 고객 문의를 일관되게 처리하기 위한 내부 운영 기준이다. 개발팀은 이 문서를 기준으로 앱 내 고객지원 화면, 문의 메타데이터, 계정 삭제/구독 복원 안내 흐름을 구현한다.

운영 주체는 확정 전까지 <TBD-C-13: 한국 개인사업자 가정>으로 표기한다.

## 2. 지원 원칙

- 응답은 영어를 기본으로 한다.
- 학습자의 문제를 짧고 명확하게 해결한다.
- 결제/환불은 Apple App Store 또는 Google Play 기준을 우선 안내한다.
- 사용자의 학습 데이터나 구독 상태를 임의로 수정하지 않는다.
- 개인정보를 이메일로 과도하게 요구하지 않는다.
- 13세 미만 사용자에게는 서비스 이용을 지원하지 않는다.
- 보안/데이터 노출 의심은 일반 문의와 분리해 incident로 처리한다.

## 3. 지원 채널

| 채널 | 용도 | MVP 적용 |
|---|---|---:|
| 지원 이메일 | 일반 문의, 결제 문의, 삭제 요청 | 예 |
| 앱 내 문의 버튼 | 이메일 앱 실행 + 메타데이터 포함 | 예 |
| 앱 내 콘텐츠 신고 | 단어/예문/오디오 오류 신고 | 예 |
| FAQ 페이지 | 반복 문의 감소 | 후순위 |
| 실시간 채팅 | 즉시 응대 | 제외 |

## 4. 앱에서 포함할 문의 메타데이터

- 앱 버전
- OS 종류와 버전
- 사용자 ID 또는 게스트 지원 코드
- RevenueCat/Supabase entitlement status
- 현재 언어 설정
- 문의 발생 화면명
- analytics/diagnostics 동의 여부는 문의 본문에 자동 포함하지 않음

사용자는 이메일 본문에 삽입된 메타데이터를 삭제할 수 있어야 한다.

## 5. 문의 유형별 처리

| 유형 | 예시 | 1차 응답 |
|---|---|---|
| 계정 | 로그인 안 됨, 매직 링크 미수신 | 로그인 제공자/이메일 확인, 재시도 안내 |
| 게스트 병합 | 게스트 기록이 안 합쳐짐 | 로컬 데이터 보존 안내, 재시도 안내 |
| 학습 기록 | streak 사라짐, 복습 수 이상 | timezone/04:00 reset/동기화 상태 확인 |
| 구독 | Premium 안 열림 | 로그인 확인, Restore Purchases 안내, entitlement 확인 |
| 환불 | 결제 취소 요청 | Apple/Google 환불 절차 안내 |
| 콘텐츠 | 번역 오류, 오디오 이상 | 신고 접수, 다음 콘텐츠 패치 검토 |
| Privacy | 분석 철회, 삭제 요청 | Settings 경로 안내, DSAR 채널 안내 |
| 연령 | 13세 미만 차단 | 서비스 이용 불가 안내 |
| 기술 문제 | 앱 종료, 화면 멈춤 | 앱 버전/OS 확인, Crashlytics 확인 |
| 보안 | 데이터 노출 의심, 계정 오접근 | incident triage로 전환 |

## 6. 응답 우선순위

| 등급 | 기준 | 목표 처리 |
|---|---|---|
| P0 | 데이터 노출 의심, 결제 권한 광범위 오류, 로그인 전면 장애 | 즉시 또는 다음 확인 가능 시간 triage |
| P1 | 개별 결제 권한 오류, 계정 삭제 실패, 반복 크래시 | 1영업일 내 확인 시작 |
| P2 | 콘텐츠 오류, 일반 사용법 문의 | 3영업일 내 응답 목표 |
| P3 | 기능 제안, 일반 피드백 | 주간 정리 |

확정 결정:

- CC3-02 결정: 1인 운영 P0는 평일 업무시간 즉시 triage, 야간/주말은 자동응답 후 다음 확인 가능 시간 triage로 운영한다. 임시 기준은 평일 업무시간 P0 즉시 triage, 야간/주말은 다음 확인 가능 시간에 triage하되 결제/데이터 노출 의심은 모바일 알림으로 예외 처리한다.

## 7. 결제 문의 처리

1. 사용자가 로그인 상태인지 확인한다.
2. Restore Purchases를 실행했는지 확인한다.
3. Supabase user_id와 RevenueCat appUserID 매핑을 확인한다.
4. subscription_entitlements status를 확인한다.
5. active/grace_period이면 Premium 접근 복구를 안내한다.
6. expired/refunded/revoked이면 Free 권한 상태를 안내한다.
7. 환불은 스토어 환불 절차로 안내한다.

결제 status:

- active
- grace_period
- billing_retry
- expired
- refunded
- revoked
- transferred
- unknown

## 8. 기본 응답 템플릿

### 8.1 구독 복원

Subject: Premium access issue

Hi,

Please make sure you are signed in, then open Settings > Restore Purchases. If Premium is still unavailable, reply with the support code shown in Settings. We can check the subscription status linked to your dash2zero account, but we cannot see your full payment details.

### 8.2 환불

Subject: Refund request

Hi,

Refunds are handled by the store where the purchase was made. Please request a refund through Apple App Store or Google Play using the account that made the purchase. We can still help check whether your Premium access is active in dash2zero.

### 8.3 콘텐츠 오류

Subject: Content report received

Hi,

Thanks for reporting this. We will review the word, example, or audio item and include the fix in a content update if needed.

### 8.4 계정 삭제

Subject: Account deletion

Hi,

You can request account deletion in Settings > Account > Delete Account. This removes your dash2zero account and learning data. Active subscriptions must be cancelled separately through Apple App Store or Google Play.

### 8.5 13세 미만

Subject: Age requirement

Hi,

dash2zero is not available for children under 13. We cannot create or support accounts for users under 13.

## 9. 계정 삭제 처리

1. 사용자가 앱에서 삭제를 요청하면 앱 내 안내를 완료한다.
2. 이메일로 요청한 경우 사용자 식별을 위해 지원 코드 또는 로그인 이메일을 확인한다.
3. 삭제 대상 데이터를 확인한다.
4. deletion request 상태를 확인한다.
5. 30일 내 삭제 또는 비식별화 처리한다.
6. 구독 취소는 별도 스토어 절차가 필요하다는 점을 안내한다.

## 10. 콘텐츠 신고 처리

| 신고 유형 | 확인 기준 | 조치 |
|---|---|---|
| typo | 한글/영어 오탈자 | 수정 후보 등록 |
| translation | 의미 부정확 | 검수 후 수정 |
| romanization | 표기 기준 불일치 | Revised Romanization 기준 확인 |
| audio | 파일 누락/발음 오류 | 오디오 재생 확인, 교체 후보 등록 |
| difficulty | 초보자 난이도 부적합 | pack 재배치 검토 |
| other | 기타 | 운영자 분류 |

콘텐츠 오류 수정 시 word_id는 유지하고 content_version/status로 처리한다.

## 11. 보안 사고 대응

데이터 노출 또는 계정 오접근이 의심되면 일반 CS로 처리하지 않는다.

1. incident owner 지정.
2. 24시간 내 triage 시작.
3. breach log 생성.
4. 영향 데이터와 사용자 범위 확인.
5. containment와 secret rotation 필요성 판단.
6. UK GDPR 등 적용 법률상 통지 필요성이 있으면 인지 후 72시간 내 감독기관 신고 목표.
7. 사용자에게 고위험이면 지체 없는 통지 검토.

## 12. 사용자가 기대할 수 없는 지원

- 개인 맞춤 한국어 과외
- 발화 평가 또는 발음 채점
- 앱스토어/구글플레이 외부 직접 환불
- 13세 미만 사용자 계정 운영
- 사용자가 삭제한 계정의 학습 기록 복원 보장
- 광고 추적 opt-out 외부 도구 안내, MVP 광고 미사용

## 13. 운영 기록

문의가 들어오면 운영 시트에 아래 항목을 남긴다.

- 접수일
- 문의 유형
- 지원 코드 또는 사용자 ID
- 앱 버전
- OS
- entitlement status
- 상태: open/in_progress/resolved/wont_fix/incident
- 처리 메모
- 후속 제품 이슈 여부

사용자 데이터 조회가 필요한 경우 audit_log reason에 support case id를 남긴다.

## 14. D-42 운영 준비

D-42까지 아래가 확정되어야 한다.

- support email
- 운영자/사업자 표시명
- 환불/청약철회 안내 문구
- Privacy/Terms URL
- RevenueCat production dashboard 접근
- Apple/Google 결제 계정 접근
