# 23. 배포 및 출시 체크리스트

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-04 | Privacy Manifest/Required Reason API 검증 P0 gate |
| CC2-16 | C-13 D-42 사업자/결제 수령 주체 gate |
| CC2-17 | EAS Update OTA 허용/금지 SOP 추가 |
| CC2-20 | EU/EEA 명시 제외 SOP 추가 |
| CC2-21 | production key/keystore 긴급 인수 절차 추가 |
| B-07 | Do not sell/share 및 Notice at Collection 대응 방향 추가 |
| B-10 | 24시간 triage/72시간 침해 통지 절차 추가 |

## 1. 출시 범위

| 항목 | 기준 |
|---|---|
| 앱 | iOS/Android 모바일 앱 |
| 출시 국가 | US, CA, UK, AU, NZ |
| 제외 지역 | EU/EEA 전부 명시 제외 |
| 기본 언어 | en-US |
| 구독 | 월간/연간 Premium |
| 무료 범위 | Starter Pack 60개, daily 3 new words, 20 reviews/day |
| Premium 범위 | 전체 300개, daily 15 new words, unlimited review |
| 제외 | 음성 녹음, 사용자용 AI, 광고, 13세 미만 대상 기능 |

## 2. 출시 보류 P0 조건

아래 항목 중 하나라도 미해결이면 출시를 보류한다.

- P0 QA 실패
- production 결제/복원 실패
- Privacy Manifest/Required Reason API 검증 실패
- 개인정보 처리방침/약관 미게시
- 계정 삭제 흐름 미구현
- age gate 미구현 또는 13세 미만 차단 실패
- Starter Pack 60단어 미완성
- 앱 실행 또는 첫 lesson 완료 불가
- RLS policy test 실패
- service role key 또는 production secret이 앱/repo에 포함됨
- C-13 D-42 gate 실패 후 유료 출시 강행

## 3. D-42 사업자/결제 게이트

운영 주체는 확정 전까지 <TBD-C-13: 한국 개인사업자 가정>으로 표기한다.

| 상태 | 항목 |
|---|---|
| [ ] | 한국 개인사업자 등록 여부 확정 |
| [ ] | 통신판매업 신고 필요 여부 및 상태 확정 |
| [ ] | Apple Developer Account holder 정보 확정 |
| [ ] | Apple Paid Apps Agreement 완료 |
| [ ] | Google Play payments profile 완료 |
| [ ] | W-8BEN 또는 사업자 형태에 맞는 세금 서류 제출 |
| [ ] | RevenueCat payout/tax 설정 확인 |
| [ ] | 결제 수령 계좌/세금 정보 확인 |
| [ ] | Terms/Privacy/Payment policy의 TBD-C-13 마커 치환 |
| [ ] | 지원 이메일/사업자 연락처 확정 |

D-42까지 위 항목이 완료되지 않으면 Premium 구독 출시를 보류하거나 앱 출시 자체를 보류한다.

## 4. 코드/빌드 체크리스트

| 상태 | 항목 |
|---|---|
| [ ] | production 환경 변수 설정 완료 |
| [ ] | dev/staging/prod Supabase 프로젝트 분리 |
| [ ] | RevenueCat production app/API key 설정 확인 |
| [ ] | Firebase production project 연결 확인 |
| [ ] | iOS release build 생성 성공 |
| [ ] | Android release build 생성 성공 |
| [ ] | 앱 버전과 build number 증가 |
| [ ] | debug log/profiling flag 비활성화 |
| [ ] | service role key, webhook secret, service account가 앱 번들에 없음 |
| [ ] | age gate -> privacy choices -> onboarding 순서 확인 |
| [ ] | opt-out 상태 Analytics/Crashlytics 미수집 확인 |
| [ ] | 앱 시작, lesson, review, settings smoke test 통과 |

## 5. iOS Privacy Manifest / Required Reason API

| 상태 | 항목 |
|---|---|
| [ ] | PrivacyInfo.xcprivacy 파일 포함 |
| [ ] | Expo/RN/native SDK Required Reason API 사용 여부 확인 |
| [ ] | 선언 reason과 실제 사용 목적 일치 확인 |
| [ ] | fingerprinting 목적 사용 없음 확인 |
| [ ] | 새 native SDK 추가 시 manifest 재검토 완료 |
| [ ] | Xcode archive validation 통과 |
| [ ] | App Store Connect 업로드 전 privacy manifest 검증 증빙 저장 |

## 6. 데이터베이스/서버 체크리스트

| 상태 | 항목 |
|---|---|
| [ ] | production schema migration 적용 |
| [ ] | 모든 사용자 데이터 테이블 RLS enabled |
| [ ] | default deny 정책 확인 |
| [ ] | user owner-only policy test 통과 |
| [ ] | subscription_entitlements client read-only/server write-only 확인 |
| [ ] | daily_usage server SSOT 동작 확인 |
| [ ] | RevenueCat webhook endpoint 설정 |
| [ ] | webhook secret 검증 구현 |
| [ ] | webhook event id 멱등 처리 확인 |
| [ ] | 계정 삭제 요청 처리 확인 |
| [ ] | content_reports 생성 권한 확인 |
| [ ] | audit_log 운영 변경 기록 확인 |

확정 결정:

- CC3-04 결정: free content는 public read + rate limit/ETag/pagination/hash로 보호하고 Premium은 entitlement + signed URL TTL 6시간으로 보호한다. 배포 전 최소 rate limit과 premium content authenticated access는 필수다. App Check/DeviceCheck P0 강제 여부는 미니 라운드에서 확정한다.

## 7. 콘텐츠 체크리스트

| 상태 | 항목 |
|---|---|
| [ ] | Starter Pack 60개 published |
| [ ] | MVP 전체 300개 콘텐츠 또는 paid scope 조정 결정 |
| [ ] | 50단어 batch별 draft/review/TTS/import/QA 기록 |
| [ ] | 단어/뜻/로마자/예문 필수 필드 검증 |
| [ ] | distractor 정량 검증 통과 |
| [ ] | 오디오 파일 존재 및 재생 확인 |
| [ ] | content_version production 반영 |
| [ ] | 금지/민감 표현 검수 |
| [ ] | 앱에서 pack 접근 권한 확인 |
| [ ] | 콘텐츠 신고 기능 확인 |

검수 분리 확정 결정:

- CC3-07 결정: published 콘텐츠는 작성자와 독립 검수자를 분리하고 외부 한국어 원어민 또는 독립 검수자 pass/fail 검수를 P0로 요구한다.

## 8. 결제 체크리스트

| 상태 | 항목 |
|---|---|
| [ ] | App Store 구독 상품 생성 |
| [ ] | Google Play 구독 상품 생성 |
| [ ] | RevenueCat offerings 구성 |
| [ ] | 월간 가격 설정 |
| [ ] | 연간 가격 설정 |
| [ ] | 무료 체험 없음 확인 |
| [ ] | 가족 공유 비활성 확인 |
| [ ] | 게스트 구매 차단 확인 |
| [ ] | 로그인 후 sandbox 월간 구매 성공 |
| [ ] | 로그인 후 sandbox 연간 구매 성공 |
| [ ] | restore purchases 성공 |
| [ ] | active/grace_period/billing_retry/expired/refunded/revoked 상태 반영 확인 |
| [ ] | paywall에 가격, 자동 갱신, 해지 위치, Terms/Privacy 표시 |

확정 결정:

- CC3-05 결정: grace_period 3일, billing_retry without grace는 last active 후 24시간 유지, expired/refunded/revoked는 즉시 Free 강등.
- CC3-06 결정: 한국 거주자/한국 소비자법 적용 가능 사용자는 구매 후 7일 내 support email로 청약철회 요청 가능.

## 9. 정책/법무 체크리스트

| 상태 | 항목 |
|---|---|
| [ ] | 개인정보 처리방침 최종 검토 |
| [ ] | 이용약관 최종 검토 |
| [ ] | 결제 정책 최종 검토 |
| [ ] | 계정 삭제 안내 문구 확인 |
| [ ] | 13세 미만 사용 제한 문구 확인 |
| [ ] | 13~17세 high privacy default 반영 확인 |
| [ ] | 구독 자동 갱신 문구 확인 |
| [ ] | AU/NZ/UK 강행 소비자권리 보존 문구 확인 |
| [ ] | Google Play Data Safety 입력 완료 |
| [ ] | App Store Privacy Nutrition Label 입력 완료 |
| [ ] | CCPA/CPRA: Do not sell/share 문구 반영 |
| [ ] | 향후 sell/share 발생 전 Your Privacy Choices/Notice at Collection gate 문서화 |

## 10. Territory 설정 SOP

| 상태 | 항목 |
|---|---|
| [ ] | App Store Connect에서 US, CA, UK, AU, NZ만 선택 |
| [ ] | App Store Connect에서 EU/EEA 국가 미선택 확인 |
| [ ] | Google Play Console에서 US, CA, UK, AU, NZ만 선택 |
| [ ] | Google Play Console에서 EU/EEA 국가 미선택 확인 |
| [ ] | territory 설정 화면 스크린샷 저장 |
| [ ] | EU/EEA 추가 출시가 별도 gate 없이는 불가능하다는 release note 남김 |

## 11. EAS Update OTA SOP

### 11.1 OTA 허용

- copy/text typo
- 스타일 조정
- 비핵심 UI 버그
- content manifest 변경
- published 콘텐츠 상태 변경
- remote config의 안전한 표시값

### 11.2 OTA 금지

- native module 추가/변경
- OS 권한 변경
- 개인정보 수집 범위 변경
- age gate 변경
- 로그인/계정 병합 로직 변경
- RevenueCat 결제/entitlement 로직 변경
- 구독 가격/조건 변경
- 핵심 SRS 알고리즘 변경
- Privacy Manifest에 영향을 주는 변경

### 11.3 OTA 배포 절차

| 상태 | 항목 |
|---|---|
| [ ] | 변경이 OTA 허용 범위인지 체크 |
| [ ] | staging channel 배포 |
| [ ] | staging smoke test 통과 |
| [ ] | production phased rollout 시작 |
| [ ] | Crashlytics/지원 문의 모니터링 |
| [ ] | 문제가 있으면 이전 update로 rollback |

## 12. QA 체크리스트

| 상태 | 항목 |
|---|---|
| [ ] | P0 테스트 케이스 전체 통과 |
| [ ] | iPhone SE급 레이아웃 확인 |
| [ ] | 큰 글자 접근성 확인 |
| [ ] | 오프라인/느린 네트워크 확인 |
| [ ] | timezone/local day 04:00 reset 확인 |
| [ ] | under-13 age gate 차단 회귀 확인 |
| [ ] | 13~17세 opt-in/out 흐름 확인 |
| [ ] | 게스트에서 계정 연결 병합 확인 |
| [ ] | 앱 강제 종료 후 lesson 복구 확인 |
| [ ] | Analytics opt-in 후 핵심 이벤트 수집 확인 |
| [ ] | Analytics opt-out 미수집 확인 |
| [ ] | Crashlytics opt-in 후 테스트 crash 수집 확인 |
| [ ] | OTA 허용/금지 변경 회귀 확인 |

## 13. 키/인증서/계정 인수 체크리스트

| 상태 | 항목 |
|---|---|
| [ ] | Apple Developer owner/recovery 설정 확인 |
| [ ] | Google Play Console owner/recovery 설정 확인 |
| [ ] | EAS credentials 백업 확인 |
| [ ] | Android keystore 관리 위치 확인 |
| [ ] | Supabase owner access와 recovery 확인 |
| [ ] | RevenueCat owner access와 recovery 확인 |
| [ ] | Firebase owner access와 recovery 확인 |
| [ ] | production secret vault 저장 확인 |
| [ ] | 긴급 인수자 1명 지정 |
| [ ] | sealed recovery 문서 작성 |
| [ ] | 분기 복구 점검 일정 등록 |

## 14. 스토어 제출 체크리스트

| 상태 | 항목 |
|---|---|
| [ ] | 앱 이름 확정 |
| [ ] | subtitle/short description 작성 |
| [ ] | long description 작성 |
| [ ] | ASO 키워드 실측 근거 또는 가설 표기 |
| [ ] | iPhone 스크린샷 준비 |
| [ ] | Android phone 스크린샷 준비 |
| [ ] | 앱 아이콘 준비 |
| [ ] | 개인정보 처리방침 URL 준비 |
| [ ] | 지원 URL 준비 |
| [ ] | 심사용 계정 또는 게스트 접근 안내 준비 |
| [ ] | 연령 등급 설문 완료 |
| [ ] | Kids Category 미사용 확인 |
| [ ] | Google Play target audience under-13 미포함 확인 |

## 15. 출시 당일 체크리스트

| 시간 | 항목 |
|---|---|
| 출시 직전 | production DB/Storage 상태 확인 |
| 출시 직전 | RevenueCat/Firebase dashboard 접근 확인 |
| 출시 직전 | support inbox와 긴급 연락 채널 확인 |
| 출시 직후 | 신규 설치 및 첫 lesson smoke test |
| 출시 직후 | age gate/privacy choices 표시 확인 |
| 출시 직후 | paywall 가격 표시 확인 |
| 출시 직후 | production entitlement 확인 |
| 1시간 후 | Crashlytics 신규 crash 확인 |
| 1일 후 | onboarding/lesson completion/event funnel 확인 |
| 1일 후 | support inbox 확인 |

## 16. Phased Rollout / 자동 Halt

확정 결정:

- CC3-08 결정: phased rollout은 5/25/50/100% 단계와 crash/ANR/payment/age/data/support halt trigger를 적용한다. 임시 기준은 아래 조건 중 하나라도 발생하면 rollout을 halt하고 원인 분석한다.

임시 halt 후보:

| 지표 | 임시 기준 |
|---|---|
| crash-free users | 98% 미만 |
| 앱 실행 실패 | smoke test 재현 시 즉시 halt |
| 결제 성공 후 Premium 미반영 | 1건이라도 재현 가능하면 halt |
| under-13 차단 실패 | 1건이라도 재현 가능하면 halt |
| 계정 데이터 노출 의심 | 즉시 halt |
| support P0 문의 | 동일 원인 2건 이상 |

## 17. 사고 대응 체크리스트

| 상태 | 항목 |
|---|---|
| [ ] | incident owner 지정 |
| [ ] | 24시간 내 triage 시작 |
| [ ] | breach log 생성 |
| [ ] | 영향 데이터/사용자 범위 확인 |
| [ ] | secret rotation 필요성 판단 |
| [ ] | 감독기관 통지 필요성 판단 |
| [ ] | UK GDPR 등 적용 시 인지 후 72시간 내 신고 |
| [ ] | 고위험 사용자 통지 필요성 판단 |
| [ ] | 사후 재발 방지 태스크 생성 |

## 18. 롤백/핫픽스 기준

| 상황 | 대응 |
|---|---|
| 앱 실행 불가 | rollout halt, 긴급 hotfix 제출 |
| 결제 후 Premium 미반영 | RevenueCat 설정 확인, entitlement 보정, hotfix |
| 잘못된 콘텐츠 대량 노출 | content_version rollback 또는 status paused |
| 계정 데이터 접근 문제 | 관련 API 차단, RLS 재검토, 영향 범위 확인 |
| crash 급증 | OTA rollback 가능하면 rollback, native 이슈면 hotfix build |
| Privacy Manifest 누락 | iOS 제출 중단, build 재생성 |

## 19. 출시 후 7일 모니터링

- 신규 설치 수
- first_lesson_completed 비율
- D1 retention
- lesson completion rate
- review completion rate
- paywall view to purchase conversion
- crash-free users
- under-13 blocked count
- analytics opt-in rate
- 콘텐츠 신고 건수
- 구독/복원 문의 건수
- P0 support 문의 건수
