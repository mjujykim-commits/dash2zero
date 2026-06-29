# 22. MVP 개발 태스크

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-02 | 기능명세 v0.2 기준으로 swarm coding 가능한 태스크로 재분해 |
| CC2-14 | 16주 baseline + 4주 운영/심사/버퍼 = 20주 계획으로 조정 |
| CC2-15 | 콘텐츠 300단어를 50단어 batch x 6으로 분해, Starter Pack 60단어 별도 P0 milestone |
| CC2-16 | C-13 확정 데드라인 D-42를 태스크와 출시 보류 조건에 삽입 |
| CC2-17 | EAS Update OTA 허용/금지 범위 태스크화 |
| CC2-21 | production key/keystore 긴급 인수 절차 태스크화 |
| B-10 | 침해 통지 SOP 태스크화 |

## 1. 문서 목적

이 문서는 dash2zero MVP를 실제 개발 가능한 작업 단위로 나눈 실행 계획이다. 향후 swarm coding agent 팀은 이 문서를 기준으로 역할을 나누고, 추가 판단 없이 구현에 착수할 수 있어야 한다.

## 2. 개발 범위 요약

### 2.1 포함

- iOS/Android 모바일 앱
- age gate, privacy choices, onboarding
- 게스트 모드와 로컬 SQLite 학습
- Apple/Google/email magic link 로그인
- guest-to-account merge
- Notice/Hear/Meaning/Retrieve 4단계 학습 루프
- custom Leitner 5-stage SRS
- Starter Pack 60개 + MVP 전체 300개 콘텐츠 구조
- TTS 오디오 재생과 캐시
- 무료/프리미엄 권한 분기
- RevenueCat 구독 연동
- Supabase DB/Auth/Storage/RLS
- Firebase Analytics/Crashlytics opt-in 연동
- 개인정보/약관/계정 삭제 화면
- 콘텐츠 신고
- 배포/심사/키 보관 SOP

### 2.2 제외

- 음성 녹음
- 발화 평가
- 사용자용 AI 예문 생성
- 커뮤니티
- 웹 어드민
- 광고
- 자체 카드 결제
- EU/EEA storefront 출시
- 13세 미만 대상 기능

## 3. 20주 기준 개발 단계

| 단계 | 기간 | 목표 | 산출물 |
|---|---:|---|---|
| Phase 0 | 1주 | 프로젝트 세팅/설계 확정 | repo, env, DB migration skeleton, 디자인 토큰 |
| Phase 1 | 2~5주 | 핵심 학습 루프 구현 | age/privacy/onboarding, home, lesson, review, local SRS |
| Phase 2 | 6~9주 | 계정/동기화/콘텐츠/오디오 | Supabase, RLS, content import, TTS storage/cache |
| Phase 3 | 10~12주 | 결제/정책/분석 | RevenueCat, entitlement, paywall, Analytics opt-in, Crashlytics |
| Phase 4 | 13~14주 | QA/콘텐츠 검수/beta | Starter Pack QA, TestFlight/Internal testing |
| Phase 5 | 15~16주 | 출시 후보 빌드 | store listing, release build, 심사 제출 준비 |
| Buffer | 17~20주 | 심사 반려/운영/법무/콘텐츠 보정 | resubmission, hotfix, final launch gate |

## 4. D-42 사업자/결제 게이트

운영 주체는 확정 전까지 <TBD-C-13: 한국 개인사업자 가정>으로 표기한다.

D-42까지 아래 항목이 완료되지 않으면 paid release는 자동 보류한다.

| ID | 태스크 | 완료 기준 |
|---|---|---|
| BUS-001 | 한국 개인사업자 등록 여부 확정 | 사업자명/등록번호/주소/연락처 확정 또는 출시 보류 결정 |
| BUS-002 | 통신판매업 신고 여부 확정 | 신고 완료 또는 법무상 불필요 판단 기록 |
| BUS-003 | Apple Paid Apps Agreement | 계약/세금/은행 정보 제출 완료 |
| BUS-004 | Google payments profile | 결제 수령 프로필과 세금 정보 완료 |
| BUS-005 | W-8BEN 또는 관련 세금 서류 | 사업자 형태에 맞는 서류 제출 완료 |
| BUS-006 | RevenueCat payout/tax 설정 | production payout 설정 확인 |
| BUS-007 | Terms/Privacy 사업자 정보 치환 | 모든 TBD-C-13 grep 결과 0건 |

## 5. 작업 스트림

| 스트림 | 책임 |
|---|---|
| Mobile App | React Native 화면, 상태 관리, 로컬 저장, 네비게이션 |
| Backend/Data | Supabase schema, RLS, Edge Function, sync |
| Content | 단어/예문/오디오 데이터, import validation |
| Monetization | RevenueCat, entitlement, paywall |
| Analytics/QA | Firebase, event taxonomy, test automation |
| Policy/Store/Ops | privacy/terms, account deletion, store metadata, key recovery |

## 6. Phase 0 태스크

| ID | 인일 | 태스크 | 의존성 | 완료 기준 |
|---|---:|---|---|---|
| MVP-000 | 1 | Expo + TypeScript 프로젝트 생성 | 없음 | iOS/Android dev build 실행 |
| MVP-001 | 1 | navigation 구조 생성 | MVP-000 | age/privacy/onboarding/home/lesson/review/settings/paywall route |
| MVP-002 | 1 | 디자인 토큰 적용 | MVP-000 | color/type/spacing 기본 세팅 |
| MVP-003 | 1 | 환경 분리 설계 | MVP-000 | dev/staging/prod env 파일과 secret 경계 |
| MVP-004 | 2 | Supabase migration skeleton | MVP-003 | migration 재현 가능 |
| MVP-005 | 1 | lint/test/format 세팅 | MVP-000 | 기본 품질 명령 실행 |
| MVP-006 | 1 | Privacy/Terms static route | MVP-001 | 앱 설정에서 접근 가능 |
| MVP-007 | 1 | OTA 채널 설계 | MVP-003 | dev/staging/production update channel 정의 |

## 7. Phase 1 태스크: 학습 루프

| ID | 인일 | 태스크 | 의존성 | 완료 기준 |
|---|---:|---|---|---|
| MVP-100 | 2 | age gate 구현 | MVP-001 | 13세 미만 차단, 13~17세 high privacy flag |
| MVP-101 | 2 | privacy choices 구현 | MVP-100 | analytics/diagnostics 기본 off, settings 철회 |
| MVP-102 | 2 | onboarding 구현 | MVP-101 | level/interests 저장, guest start |
| MVP-103 | 2 | 홈 화면 구현 | MVP-102 | today lesson/review/progress 표시 |
| MVP-104 | 3 | 로컬 SQLite schema | MVP-000 | local_profile, states, attempts, usage |
| MVP-105 | 3 | 4단계 word flow | MVP-103 | Notice/Hear/Meaning/Retrieve UI |
| MVP-106 | 2 | 오디오 재생 UI | MVP-105 | 수동 재생, loading/failure 상태 |
| MVP-107 | 3 | quiz/distractor 로직 | MVP-105 | 4지선다 + fallback |
| MVP-108 | 3 | SRS 엔진 | MVP-104 | 1/3/7/14/30, 오답 stage -1, weak 처리 |
| MVP-109 | 2 | daily_usage 로컬 구현 | MVP-104 | 04:00 local day reset |
| MVP-110 | 2 | partial session 복구 | MVP-105 | 앱 종료 후 재개 또는 재시작 |

## 8. Phase 2 태스크: 데이터/계정/콘텐츠

| ID | 인일 | 태스크 | 의존성 | 완료 기준 |
|---|---:|---|---|---|
| MVP-200 | 3 | DB schema 구현 | MVP-004 | profiles/content/learning/payment 테이블 migration |
| MVP-201 | 3 | RLS matrix 구현 | MVP-200 | owner-only, client read-only entitlement 테스트 |
| MVP-202 | 2 | privacy_consents/deletion_requests | MVP-200 | 동의/삭제 요청 저장 |
| MVP-203 | 2 | Apple 로그인 iOS | MVP-001 | iOS 로그인 성공 |
| MVP-204 | 2 | Google 로그인 | MVP-001 | Android/iOS 로그인 성공 |
| MVP-205 | 2 | email magic link | MVP-001 | universal link cold start 처리 |
| MVP-206 | 4 | guest-to-account merge Edge Function | MVP-200, MVP-104 | idempotent merge, event 재계산 |
| MVP-207 | 2 | daily_usage server RPC | MVP-200 | 무료/프리미엄 한도 서버 enforce |
| MVP-208 | 2 | content manifest schema | MVP-200 | manifest hash/version/ETag |
| MVP-209 | 3 | content import validation | MVP-208 | CSV 오류 검출, status workflow |
| MVP-210 | 3 | Starter Pack 60단어 batch | MVP-209 | published + 앱 QA 완료 |
| MVP-211 | 12 | 50단어 batch x 6 | MVP-209 | 300단어 draft/review/TTS/import/QA |
| MVP-212 | 3 | Supabase Storage audio | MVP-208 | signed URL/cache/hash 검증 |
| MVP-213 | 2 | content report | MVP-200 | word/example/audio 신고 생성 |

### 8.1 콘텐츠 batch 분해

| Batch | 범위 | 완료 기준 |
|---|---|---|
| Starter | 60단어 | 무료 Starter Pack P0 QA 통과 |
| Batch 1 | 50단어 | draft -> review -> TTS -> import -> QA |
| Batch 2 | 50단어 | draft -> review -> TTS -> import -> QA |
| Batch 3 | 50단어 | draft -> review -> TTS -> import -> QA |
| Batch 4 | 50단어 | draft -> review -> TTS -> import -> QA |
| Batch 5 | 50단어 | draft -> review -> TTS -> import -> QA |
| Batch 6 | 50단어 | draft -> review -> TTS -> import -> QA |

확정 결정:

- CC3-07 결정: published 콘텐츠는 작성자와 독립 검수자를 분리하고 외부 한국어 원어민 또는 독립 검수자 pass/fail 검수를 P0로 요구한다. 임시 기준은 1인 운영 시 24시간 경과 후 self-review + checklist + 샘플 재검수 로그다.

## 9. Phase 3 태스크: 결제/분석/정책

| ID | 인일 | 태스크 | 의존성 | 완료 기준 |
|---|---:|---|---|---|
| MVP-300 | 2 | RevenueCat SDK 연동 | MVP-203~205 | offerings 조회 가능 |
| MVP-301 | 3 | subscription_entitlements + webhook | MVP-200 | status enum, idempotent event 처리 |
| MVP-302 | 2 | 로그인 후 purchase gate | MVP-300 | 게스트 구매 차단 |
| MVP-303 | 2 | paywall 화면 | MVP-300 | 월간/연간, no trial, family sharing off 고지 |
| MVP-304 | 2 | sandbox 구매 테스트 | MVP-303 | 구매 후 Premium 활성화 |
| MVP-305 | 2 | restore purchases | MVP-300 | 로그인 후 복원 |
| MVP-306 | 2 | 결제 실패/grace UI | MVP-301 | grace/billing_retry/expired 표시 |
| MVP-307 | 2 | Firebase Analytics opt-in | MVP-101 | opt-out 이벤트 미수집 |
| MVP-308 | 2 | Crashlytics opt-in | MVP-101 | diagnostics opt-in 후 수집 |
| MVP-309 | 2 | Privacy Manifest 검증 | MVP-000 | PrivacyInfo.xcprivacy 포함 |
| MVP-310 | 2 | account deletion flow | MVP-202 | pending_delete, 30일 SLA 안내 |

확정 결정:

- CC3-05 결정: grace_period 3일, billing_retry without grace는 last active 후 24시간 유지, expired/refunded/revoked는 즉시 Free 강등.
- CC3-03 결정: Android에도 Sign in with Apple web flow를 보조 로그인 옵션으로 제공한다.

## 10. Phase 4 태스크: QA/Beta

| ID | 인일 | 태스크 | 의존성 | 완료 기준 |
|---|---:|---|---|---|
| MVP-400 | 3 | P0 QA 실행 | Phase 1~3 | P0 차단 이슈 없음 |
| MVP-401 | 3 | 콘텐츠 QA | MVP-210~211 | Starter/MVP pack 검수 완료 |
| MVP-402 | 2 | 결제 상태 QA | MVP-301~305 | active/grace/billing_retry/expired/refund 테스트 |
| MVP-403 | 2 | age/privacy QA | MVP-100~101 | under-13 차단, opt-out 미수집 |
| MVP-404 | 2 | OTA 회귀 QA | MVP-007 | 허용/금지 변경 구분 테스트 |
| MVP-405 | 2 | TestFlight/Internal testing | MVP-400 | beta build 배포 |
| MVP-406 | 2 | beta feedback 정리 | MVP-405 | 출시 전 수정 목록 확정 |
| MVP-407 | 1 | crash-free 검토 | MVP-405 | 치명 crash 제거 |

## 11. Phase 5 태스크: 출시 후보와 제출

| ID | 인일 | 태스크 | 의존성 | 완료 기준 |
|---|---:|---|---|---|
| MVP-500 | 2 | App Store metadata | MVP-405 | 설명/키워드/스크린샷 준비 |
| MVP-501 | 2 | Google Play listing | MVP-405 | 설명/Data Safety/스크린샷 준비 |
| MVP-502 | 2 | territory 설정 | MVP-500~501 | US/CA/UK/AU/NZ만, EU/EEA 제외 증빙 |
| MVP-503 | 2 | production env 점검 | Phase 3 | DB/Storage/Auth/RevenueCat/Firebase 연결 확인 |
| MVP-504 | 2 | release build 생성 | MVP-503 | iOS/Android prod build 성공 |
| MVP-505 | 1 | Privacy Manifest/App Privacy 검증 | MVP-504 | iOS upload 전 검증 통과 |
| MVP-506 | 1 | 심사용 계정/게스트 안내 | MVP-504 | reviewer note 준비 |
| MVP-507 | 1 | 스토어 제출 | MVP-505~506 | 양대 스토어 제출 완료 |

## 12. Buffer 태스크: 운영/심사/핫픽스

| ID | 인일 | 태스크 | 의존성 | 완료 기준 |
|---|---:|---|---|---|
| BUF-001 | 3 | 심사 반려 대응 | MVP-507 | 반려 사유 triage와 resubmission |
| BUF-002 | 2 | hotfix build window | MVP-507 | 긴급 build 생성 가능 |
| BUF-003 | 2 | production key recovery rehearsal | MVP-503 | sealed recovery 점검 |
| BUF-004 | 2 | incident response rehearsal | MVP-503 | 24h triage/72h breach log template 확인 |
| BUF-005 | 2 | paid release go/no-go | BUS-001~007 | C-13/결제/세금 완료 여부 판단 |
| BUF-006 | 2 | launch monitoring setup | MVP-503 | crash/support/payment dashboard 확인 |

확정 결정:

- CC3-02 결정: 1인 운영 P0는 평일 업무시간 즉시 triage, 야간/주말은 자동응답 후 다음 확인 가능 시간 triage로 운영한다. 임시 기준은 평일 업무시간 P0 즉시 triage, 야간/주말은 다음 확인 가능 시간에 triage하되 결제/데이터 노출 의심은 모바일 알림으로 예외 처리한다.

## 13. 병렬 작업 제안

| 에이전트 | 담당 범위 | 주요 문서 | 쓰기 범위 |
|---|---|---|---|
| Agent A | 모바일 UI/네비게이션 | 05, 06, 10, 11 | app screens/components |
| Agent B | SRS/로컬 저장 | 03, 06, 07 | local db, srs engine |
| Agent C | Supabase/RLS/API | 07, 08, 18 | migrations, policies, edge functions |
| Agent D | 결제/paywall | 06, 13, 17 | RevenueCat, entitlement, paywall |
| Agent E | 콘텐츠 파이프라인 | 03, 04, 19 | content schema/import/QA |
| Agent F | 분석/QA/출시 | 12, 21, 23, 24 | analytics, tests, release checklist |

## 14. Definition of Done

- F-001~F-010 acceptance criteria 통과
- RLS policy test 통과
- age gate와 opt-in 분석 정책 검증
- 게스트 첫 학습/계정 병합/구매 전 로그인 gate 통과
- RevenueCat sandbox purchase/restore/grace/expired/refund 테스트 통과
- PrivacyInfo.xcprivacy 포함 및 iOS upload 검증
- Starter Pack 60단어 content QA 완료
- MVP 300단어 published 또는 paid release scope 조정 결정
- C-13 D-42 gate 통과 또는 paid release 보류 결정
- 스토어 제출 가능 수준의 metadata와 screenshot 준비

## 15. 주요 리스크

| 리스크 | 대응 |
|---|---|
| 1인 개발 범위 과대 | 20주 계획, 버퍼 4주, 웹 어드민/AI/발화 제외 유지 |
| 콘텐츠 제작 병목 | 50단어 batch x 6, Starter Pack 별도 milestone |
| 결제 심사 지연 | D-42 사업자/세금/스토어 계약 게이트 |
| SRS 정책 변경 | MVP 1/3/7/14/30 고정, 장기 리뷰는 Phase 3 실험 |
| 계정 병합 오류 | event_id 기반 append-only와 deterministic 재계산 |
| OTA 정책 위반 | OTA 금지 범위 store build로 강제 |
| 1인 운영 단일 장애점 | sealed recovery, 키 vault, 분기 복구 점검 |
