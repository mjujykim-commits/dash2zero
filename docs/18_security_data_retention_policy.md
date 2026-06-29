# 18. 보안 및 데이터 보존 정책

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-03 | RLS default deny와 역할별 접근 기준 반영 |
| CC2-04 | Privacy Manifest/Required Reason API 검증을 iOS release gate로 추가 |
| CC2-05 | 13세 미만 차단과 13~17세 high privacy default 반영 |
| CC2-18 | Analytics/Crashlytics 기본 disabled, opt-in 후 활성화 |
| CC2-21 | production key vault와 긴급 인수 절차 추가 |
| B-07 | 개인정보 판매/공유 및 광고 추적 없음 |
| B-10 | 24시간 triage, 72시간 침해 통지 기준 추가 |

## 1. 문서 목적

이 문서는 dash2zero MVP의 보안 원칙, 접근 통제, 데이터 보존/삭제, 사고 대응, 키 관리 기준을 정의한다. 개발팀은 이 문서를 기준으로 DB 정책, 앱 동의 흐름, 운영 접근 권한, 배포 보안 체크리스트를 구현한다.

## 2. 보안 원칙

- 최소 수집: 학습 서비스 제공에 필요한 정보만 수집한다.
- 기본 비수집: 음성 녹음, 위치, 연락처, 광고 ID, IDFA는 MVP에서 수집하지 않는다.
- 기본 비활성: Analytics/Crashlytics는 사용자의 opt-in 전까지 disabled다.
- 기본 차단: Supabase 테이블은 RLS enabled + default deny다.
- 서버 신뢰: 결제, entitlement, 일일 한도, 계정 삭제의 최종 판단은 서버 기준이다.
- 클라이언트 비밀 금지: service role key, webhook secret, Firebase service account는 앱 번들에 포함하지 않는다.
- 운영 추적: 운영자 접근과 민감 작업은 audit_log에 기록한다.

## 3. 운영 주체와 책임자

- 운영 주체: <TBD-C-13: 한국 개인사업자 가정>
- 임시 가정: 한국 개인사업자 + 통신판매업 신고 예정
- C-13 확정 데드라인: 베타 출시 4주 전, 공개 출시 D-42
- 보안/개인정보 1차 책임자: Owner
- 긴급 인수자: 1명 지정, sealed recovery 절차로만 접근

## 4. 수집 데이터 분류

| 구분 | 예시 | 저장 위치 | 민감도 | 기본 보존 |
|---|---|---|---|---|
| 계정 데이터 | user_id, email, auth provider | Supabase Auth/Profile | 중 | 계정 유지 기간 |
| 연령 게이트 | age_band, 통과 여부 | 로컬/Supabase profile | 중 | 계정 유지 기간 |
| 동의 데이터 | analytics/diagnostics opt-in | privacy_consents | 중 | 동의 이력 유지 |
| 학습 데이터 | stage, attempts, streak, daily_usage | Supabase DB/로컬 SQLite | 중 | 계정 유지 기간 |
| 구독 데이터 | RevenueCat app user id, entitlement 상태 | RevenueCat/Supabase | 중 | 계정/법정 보존 기간 |
| 분석 데이터 | lesson/review/paywall 이벤트 | Firebase Analytics | 낮음~중 | Firebase 설정 기준 |
| 진단 데이터 | crash stack, device info | Crashlytics | 중 | Firebase 설정 기준 |
| 콘텐츠 데이터 | words, examples, audio | Supabase DB/Storage | 낮음 | 콘텐츠 운영 기간 |
| 문의/신고 | support email, report message | email/DB/운영 시트 | 중 | 처리 후 운영 필요 기간 |

## 5. 수집하지 않는 데이터

- 음성 녹음 파일
- 발화 평가 데이터
- 위치 정보
- 연락처
- 사진/파일
- 광고 ID/IDFA
- 광고 네트워크 식별자
- precise birthdate
- 자체 카드 결제 정보

## 6. 인증 및 계정 보안

| 항목 | 정책 |
|---|---|
| 로그인 | Apple, Google, email magic link |
| 게스트 | 로컬 저장, 서버 구매/동기화 불가 |
| 구매 | authenticated user만 가능 |
| RevenueCat appUserID | Supabase auth.users.id 문자열 |
| 세션 저장 | 플랫폼 secure storage 사용 |
| 로그아웃 | 로컬 세션 토큰 삭제, 서버 학습 데이터 유지 |
| 계정 삭제 | deletion request 생성 후 30일 내 삭제/비식별화 |

## 7. RLS와 접근 통제

RLS 상세 매트릭스는 07_erd_db_design.md를 기준으로 한다.

핵심 규칙:

- 사용자 데이터는 owner-only다.
- subscription_entitlements는 client read-only, server write-only다.
- content published 데이터만 앱에서 읽을 수 있다.
- content draft/reviewed는 운영 환경에서만 접근한다.
- content_reports는 신고자가 생성하고, 운영자가 처리한다.
- audit_log는 사용자에게 노출하지 않는다.

## 8. 비밀값과 키 관리

| 항목 | 저장 위치 | 회전 기준 | 앱 포함 여부 |
|---|---|---|---:|
| Supabase anon key | 앱 환경 설정 | 노출/정책 변경 시 | 예 |
| Supabase service role key | 암호화 vault/server env | 6개월 또는 노출 의심 시 | 아니오 |
| RevenueCat public SDK key | 앱 환경 설정 | 앱 재구성 시 | 예 |
| RevenueCat webhook secret | 암호화 vault/server env | 6개월 또는 노출 의심 시 | 아니오 |
| Firebase config | 앱 환경 설정 | 프로젝트 변경 시 | 예 |
| Firebase service account | 암호화 vault/server env | 6개월 또는 노출 의심 시 | 아니오 |
| Apple/Google signing credentials | Apple/Google/EAS secure store + vault | 플랫폼 정책 또는 노출 의심 시 | 아니오 |
| EAS credentials | EAS + vault backup | 분기 접근 테스트 | 아니오 |

### 8.1 긴급 인수 절차

- production 계정과 키는 Owner의 password manager/vault에 보관한다.
- 긴급 인수자는 1명 지정한다.
- 긴급 인수자는 평시 접근하지 않는다.
- sealed recovery 절차에는 vault 접근 방법, 2FA recovery code 위치, EAS/Apple/Google/Supabase/RevenueCat/Firebase owner transfer 절차를 포함한다.
- 분기 1회 복구 가능성만 점검하고 실제 secret은 노출하지 않는다.

## 9. Privacy Manifest / Required Reason API

iOS release build에는 PrivacyInfo.xcprivacy가 포함되어야 한다.

검증 기준:

- Expo/RN/native SDK가 사용하는 Required Reason API를 빌드 시점에 확인한다.
- Apple이 허용한 reason과 실제 앱 사용 목적이 일치해야 한다.
- fingerprinting 목적 사용은 금지한다.
- 새 native SDK 추가 시 manifest 재검토를 release gate로 둔다.
- App Store Connect 업로드 전 archive validation 결과를 보관한다.

## 10. 데이터 보존 기준

| 데이터 | 보존 기간 | 삭제 기준 | 비고 |
|---|---|---|---|
| 계정 데이터 | 계정 유지 기간 | 삭제 요청 후 30일 내 삭제/비식별화 | 법적 보존 제외 가능 |
| 학습 데이터 | 계정 유지 기간 | 삭제 요청 후 30일 내 삭제 | 복구 보장 없음 |
| 게스트 로컬 데이터 | 앱 설치 유지 기간 | 앱 삭제 또는 계정 병합 후 정리 | 기기 한정 |
| 동의 이력 | 계정 유지 기간 + 분쟁 대응 기간 | 삭제 요청 시 법적 필요 범위 제외 삭제 | 동의 증빙 목적 |
| subscription_entitlements | 계정/구독 유지 기간 | 삭제 후 최소화/비식별화 | 분쟁/세무 검토 필요 |
| RevenueCat raw events | 운영 필요 기간 | 보존 기간 도래 | 기간은 법무/세무 검토 필요 |
| Firebase Analytics | Firebase 설정 기준 | 보존 기간 도래 또는 삭제 요청 | opt-in 사용자만 |
| Crashlytics | Firebase 설정 기준 | 보존 기간 도래 또는 삭제 요청 | opt-in 사용자만 |
| content_reports | 처리 후 운영 필요 기간 | 보존 기간 도래 | 반복 오류 추적 |
| audit_log | 보안 운영 필요 기간 | 보존 기간 도래 | 변조 방지 우선 |

## 11. 계정 삭제와 데이터 권리

1. 사용자가 Settings > Account > Delete Account에서 삭제를 요청한다.
2. 앱은 학습 기록 삭제, 구독 취소 별도 필요, 복구 불가 가능성을 안내한다.
3. 서버는 deletion_requests를 생성한다.
4. pending_delete 상태에서는 신규 학습과 결제를 차단한다.
5. 30일 내 계정/학습 데이터를 삭제 또는 비식별화한다.
6. 구독 취소는 App Store/Google Play에서 사용자가 별도 처리해야 한다.

MVP에서 자동 데이터 내보내기는 P1이다. 단, 사용자별 학습 데이터는 user_id 기준 CSV 추출이 가능하도록 정규화한다.

## 12. 사고 대응 등급

| 등급 | 예시 | 목표 대응 |
|---|---|---|
| P0 | 사용자 데이터 대량 노출, 결제 권한 대량 오부여, secret 노출 | 즉시 feature freeze, 24시간 내 triage 시작 |
| P1 | 특정 사용자 데이터 접근 오류, 계정 병합 오류, 반복 crash | 1영업일 내 원인 분석 시작 |
| P2 | 분석 이벤트 누락, 비민감 콘텐츠 노출 오류 | 다음 패치 반영 |

## 13. 침해 통지 SOP

개인정보 침해가 의심되면 아래 절차를 따른다.

1. 0~24시간: 내부 triage 시작, incident owner 지정, breach log 생성.
2. 0~24시간: 영향 데이터, 사용자 범위, 원인, 진행 중인 악용 가능성 확인.
3. 24~48시간: containment 조치, secret rotation 필요성 판단, 법무/전문가 자문 필요성 판단.
4. 72시간 이내: UK GDPR 등 적용 법률상 감독기관 통지가 필요한 경우 인지 후 72시간 내 신고.
5. 지체 없이: 사용자에게 고위험이 있는 경우 직접 통지.
6. 사후: 원인 분석, 재발 방지, 정책/테스트 업데이트.

breach log 필수 항목:

- 발견 시각
- 발견자
- 영향 시스템
- 영향 데이터 유형
- 추정 사용자 수
- containment 조치
- 통지 필요성 판단
- 통지 시각과 대상
- 후속 조치

## 14. 백업, RTO/RPO

| 항목 | MVP 기준 |
|---|---|
| Supabase DB backup | Supabase 제공 백업 + 월 1회 export 검토 |
| Content source backup | 원본 스프레드시트/CSV와 audio source 별도 보관 |
| RPO | 사용자 학습 데이터 24시간 이내 손실을 목표 상한으로 둠 |
| RTO | P0 장애 시 24시간 내 핵심 학습/로그인 복구 목표 |
| Key recovery | 분기 1회 sealed recovery 절차 점검 |

RTO/RPO는 1인 운영 현실을 고려한 MVP 목표이며, 유료 사용자 증가 시 별도 상향한다.

## 15. 운영 접근 QA

- service role key가 앱 번들에 없다.
- RLS가 모든 사용자 데이터 테이블에 활성화되어 있다.
- 익명 사용자는 published free content 외 사용자 데이터에 접근할 수 없다.
- 구독 상태는 client에서 update/delete할 수 없다.
- support 역할은 support case 없이 사용자 데이터를 조회할 수 없다.
- audit_log가 운영 변경을 기록한다.
- opt-out 상태에서 Firebase Analytics/Crashlytics가 수집되지 않는다.
- under-13 선택 시 원격 수집이 없다.

## 16. MVP 제외

- 자체 카드 결제 저장
- 사용자 음성 파일 저장
- 위치 기반 기능
- 광고 네트워크 연동
- 13세 미만 대상 기능
- 복잡한 웹 어드민
- 자동화된 DSAR 포털

## 17. 확정 필요 사항

- C-13 사업자/결제 수령 주체 최종 확정
- RevenueCat raw event 보존 기간
- Firebase Analytics 데이터 보존 설정값
- free pack scrape 방어 수준: CC3-04 결정: free content는 public read + rate limit/ETag/pagination/hash로 보호하고 Premium은 entitlement + signed URL TTL 6시간으로 보호한다
