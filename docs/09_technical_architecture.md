# 기술 아키텍처 설계서

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-03 | Supabase RLS default deny와 service_role 경계 반영 |
| CC2-04 | iOS Privacy Manifest/Required Reason API release gate 반영 |
| CC2-06~08 | RevenueCat user mapping, daily_usage, entitlement schema 반영 |
| CC2-17 | EAS Update OTA 허용/금지 경계 명시 |
| AR 리뷰 | NFR/SLO, 비용 시나리오, vendor exit plan 보강 |

## 1. 아키텍처 목표

- 1인 개발자가 유지 가능한 단순한 구조.
- 모바일 앱 중심의 cross-platform 코드베이스.
- 결제/학습/콘텐츠 권한의 서버 기준 일관성.
- 오프라인에서도 기본 학습이 가능한 로컬-first UX.
- 출시 전 정책/보안 심사 항목을 명시적으로 통과.

## 2. 시스템 구성

| 계층 | 기술 | 책임 |
|---|---|---|
| Mobile | React Native + Expo + TypeScript | UI, 로컬 저장, 학습 루프, 오디오 재생 |
| Local DB | SQLite | 게스트 학습, offline attempts, cache metadata |
| Auth/DB | Supabase Auth + Postgres | 사용자, 학습 상태, daily_usage, RLS |
| Storage | Supabase Storage | TTS audio, content assets |
| Server Logic | Supabase Edge Functions/RPC | merge, entitlement sync, daily_usage enforce |
| Payment | RevenueCat | IAP abstraction, webhook, entitlement source |
| Analytics | Firebase Analytics | opt-in product analytics |
| Diagnostics | Firebase Crashlytics | opt-in crash diagnostics |
| Build/OTA | EAS Build/Update | native build, safe OTA delivery |

## 3. 신뢰 경계

| 경계 | 신뢰 수준 | 원칙 |
|---|---|---|
| Mobile client | 낮음 | 클라이언트 stage/entitlement 직접 신뢰 금지 |
| Supabase RLS | 중~높음 | owner-only와 server-only write 정책 |
| Edge Functions | 높음 | service role 사용, 비밀값 서버 보관 |
| RevenueCat webhook | 높음 | 결제 상태 source of truth |
| Firebase | 보조 | 제품/진단 분석, 권한 판단에 사용 금지 |

## 4. 데이터 흐름

### 4.1 게스트 학습

1. 앱 설치 후 device_install_id 생성.
2. age gate와 privacy choices를 로컬 저장.
3. Starter Pack 콘텐츠를 캐시.
4. attempts와 SRS 상태를 SQLite에 저장.
5. 가입 시 merge_guest API로 서버 병합.

### 4.2 로그인 사용자 학습

1. Supabase Auth JWT 획득.
2. content manifest 조회.
3. learning session 생성.
4. attempts batch 업로드.
5. 서버가 user_word_states와 daily_usage를 갱신.
6. 앱은 서버 결과로 로컬 상태를 reconcile.

### 4.3 결제

1. authenticated user만 paywall purchase 가능.
2. RevenueCat appUserID는 Supabase user_id로 설정.
3. 구매 후 RevenueCat customer state를 앱이 갱신.
4. webhook이 subscription_entitlements를 업데이트.
5. 앱은 /me/entitlements로 최종 권한 확인.

## 5. NFR / SLO

| 항목 | MVP 목표 | 측정 방법 |
|---|---:|---|
| 앱 cold start | p75 3초 이하 | local performance log, QA 기기 |
| cached lesson start | p75 1초 이하 | lesson_started 전후 측정 |
| API p95 latency | 800ms 이하 | Edge Function/Supabase logs |
| crash-free users | 99% 이상 beta, 99.5% 목표 | Crashlytics opt-in 기준 |
| content manifest fetch | p95 1초 이하 | client timing |
| attempt batch success | 99% 이상 | server success/failed ratio |
| purchase entitlement sync | p95 30초 이하 | RevenueCat webhook -> entitlement update |
| RTO | P0 장애 24시간 내 핵심 기능 복구 | incident log |
| RPO | 사용자 학습 데이터 손실 24시간 이하 목표 | backup/export 확인 |

SLO는 MVP 운영 목표이며 법적 보장은 아니다.

## 6. 오프라인 전략

| 데이터 | 오프라인 처리 |
|---|---|
| free content | manifest와 hash 기반 캐시 |
| audio | cached_audio_assets와 content_hash 검증 |
| attempts | queued_attempts에 저장 후 재연결 시 batch 업로드 |
| daily_usage | 게스트/오프라인 중 로컬 계산 후 서버 reconcile |
| premium entitlement | 마지막 서버 확인값을 짧게 캐시하되 신규 구매는 네트워크 필요 |

## 7. EAS Update OTA 경계

OTA 허용:

- copy/text typo
- 스타일 조정
- 비핵심 UI 버그
- content manifest
- remote config 표시값

OTA 금지:

- native module 변경
- OS 권한 변경
- age gate 변경
- 개인정보 수집 범위 변경
- 로그인/merge 로직 변경
- 결제/entitlement 로직 변경
- SRS 핵심 알고리즘 변경
- Privacy Manifest 영향 변경

## 8. 보안 아키텍처

- service role key는 Edge Function/server env에만 둔다.
- 앱에는 Supabase anon key와 RevenueCat public SDK key만 포함한다.
- 모든 사용자 데이터 테이블은 RLS enabled다.
- subscription_entitlements는 client read-only, webhook/server write-only다.
- 운영 변경은 audit_log에 기록한다.
- under-13 사용자는 서버 계정/분석/결제를 생성하지 않는다.

## 9. Privacy Manifest / Native SDK 관리

- iOS release build에는 PrivacyInfo.xcprivacy를 포함한다.
- native SDK 추가 시 Required Reason API 사용 여부를 검토한다.
- fingerprinting 목적 사용은 금지한다.
- Privacy Manifest 영향 변경은 OTA가 아니라 store build로 배포한다.

## 10. 비용 시나리오

| 단계 | 규모 가정 | 월 비용 가설 | 비고 |
|---|---|---:|---|
| MVP 개발 | 내부/소수 tester | USD 0~30 | Supabase/Firebase free tier 중심 |
| Beta | DAU 100 이하 | USD 0~50 | Storage/egress 관찰 |
| Early launch | DAU 1,000 이하 | USD 25~150 | Supabase Pro 전환 후보 |
| Growth | DAU 5,000 이하 | USD 150~500 | Storage/CDN/DB/analytics 비용 재검토 |

BigQuery export는 기본 비활성화한다. DAU 1,000 이상 또는 명확한 분석 질문이 있을 때 비용 상한과 billing alert를 설정하고 활성화한다.

## 11. Supabase Free -> Pro 전환 조건

아래 중 하나라도 발생하면 Pro 전환을 검토한다.

- DB/storage/egress free quota 압박
- 백업/복구 요구 강화
- 성능 p95 목표 미달
- 유료 사용자 증가로 운영 안정성 필요
- support/incident 대응상 로그 보존 필요

## 12. Vendor Exit Plan

| 벤더 | Exit 방식 | 난이도 |
|---|---|---|
| Supabase Auth/DB | Postgres dump, auth user export, RLS 재구현 | 중 |
| Supabase Storage | bucket export, storage path 유지 | 중 |
| RevenueCat | store receipt validation 직접 구현 또는 대체 서비스 | 높음 |
| Firebase Analytics | 이벤트 taxonomy 유지 후 대체 SDK 전환 | 중 |
| Crashlytics | 대체 crash reporter SDK 전환 | 낮음~중 |
| Expo/EAS | bare RN 또는 다른 CI/CD로 이전 | 중 |

exit를 쉽게 하기 위해 domain model은 vendor SDK 타입에 직접 결합하지 않는다.

## 13. 환경 분리

| 환경 | 용도 | 데이터 |
|---|---|---|
| dev | 로컬 개발 | 샘플 콘텐츠/테스트 계정 |
| staging | QA/TestFlight/Internal testing | sandbox 결제/검수 콘텐츠 |
| production | 실제 출시 | production DB/Storage/RevenueCat/Firebase |

bundle id, app icon, URL scheme, Supabase project, RevenueCat app, Firebase project를 환경별로 분리한다.

## 14. 주요 리스크와 대응

| 리스크 | 대응 |
|---|---|
| RLS 실수 | policy test suite, default deny |
| 결제 상태 불일치 | webhook idempotency, /me/entitlements 재조회 |
| OTA 정책 위반 | 허용/금지 체크리스트, staging channel |
| 콘텐츠 scraping | rate limit, ETag, premium auth, App Check 검토 |
| 1인 운영 단일 장애점 | secret vault, sealed recovery, 긴급 인수자 |
| 비용 급증 | BigQuery off, billing alert, egress 모니터링 |
