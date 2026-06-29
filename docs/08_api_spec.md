# API 명세서

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-06 | RevenueCat appUserID는 Supabase auth.users.id 기준 |
| CC2-07 | daily_usage 서버 SSOT API 추가 |
| CC2-08 | subscription_entitlements status enum과 webhook 멱등성 반영 |
| CC2-17 | content manifest 업데이트와 OTA 경계 반영 |
| BE/FE 리뷰 | 멱등 키, 페이지네이션, signed URL TTL, 에러 스키마 보강 |

## 1. API 원칙

- Supabase Auth JWT를 기본 인증으로 사용한다.
- 게스트는 서버 write를 하지 않고 로컬 저장 후 계정 전환 시 업로드한다.
- 결제 상태는 RevenueCat webhook을 신뢰 원천으로 한다.
- 학습 attempts는 event_id 기반 append-only로 업로드한다.
- 모든 write API는 idempotency key를 가져야 한다.
- 오류 응답은 표준 error schema를 따른다.
- 콘텐츠는 manifest/version/hash 기준으로 동기화한다.

## 2. 인증

| 방식 | MVP 포함 | 비고 |
|---|---:|---|
| Apple Sign In | Y | iOS 필수 |
| Google Sign-In | Y | Android/iOS |
| Email Magic Link | Y | 비밀번호 제외 |
| Email Password | N | MVP 제외 |
| Anonymous server user | N | 로컬 게스트로 대체 |

구매와 Restore Purchases는 authenticated user만 가능하다.

확정 결정:

- Android Apple Sign In 제공 여부는 06/22/24의 CC3-03 결정: Android에도 Sign in with Apple web flow를 보조 로그인 옵션으로 제공한다에서 추적한다.

## 3. 공통 요청/응답 규칙

### 3.1 공통 헤더

| 헤더 | 필수 | 설명 |
|---|---:|---|
| Authorization: Bearer JWT | 인증 API 필수 | Supabase Auth JWT |
| X-Client-Version | Y | 앱 버전 |
| X-Platform | Y | ios/android |
| X-Request-ID | Y | 클라이언트 요청 추적 ID |
| Idempotency-Key | write API 필수 | 중복 처리 방지 |

### 3.2 표준 오류 응답

    {
      "error": {
        "code": "AUTH_REQUIRED",
        "message": "Sign in is required.",
        "details": {},
        "request_id": "..."
      }
    }

### 3.3 오류 코드

| 코드 | HTTP | 설명 |
|---|---:|---|
| AUTH_REQUIRED | 401 | 계정 필요 |
| AGE_RESTRICTED | 403 | 13세 미만 차단 |
| PREMIUM_REQUIRED | 403 | Premium 필요 |
| DAILY_LIMIT_REACHED | 429 | 무료 일일 한도 도달 |
| CONTENT_VERSION_OLD | 409 | 콘텐츠 버전 오래됨 |
| APP_VERSION_UNSUPPORTED | 426 | 최소 앱 버전 미만 |
| MERGE_CONFLICT | 409 | 병합 재시도 필요 |
| IDEMPOTENCY_CONFLICT | 409 | 같은 key에 다른 payload |
| PAYMENT_STATE_UNKNOWN | 503 | 결제 상태 확인 실패 |
| RATE_LIMITED | 429 | 요청 제한 |
| VALIDATION_FAILED | 400 | 입력 검증 실패 |

### 3.4 페이지네이션

목록 API는 cursor 기반 pagination을 사용한다.

| 파라미터 | 기본 | 설명 |
|---|---:|---|
| limit | 50 | 최대 100 |
| cursor | null | 다음 페이지 cursor |

응답:

    {
      "items": [],
      "next_cursor": null
    }

## 4. 콘텐츠 API

### 4.1 GET /content/manifest

목적: 현재 콘텐츠 버전, pack 목록, 최소 앱 버전, ETag/hash 확인.

인증: optional. premium 여부에 따라 접근 가능한 pack metadata를 다르게 반환한다.

응답 필드:

| 필드 | 설명 |
|---|---|
| content_version | 현재 콘텐츠 버전 |
| manifest_hash | manifest 무결성 hash |
| min_supported_app_version | 최소 앱 버전 |
| generated_at | 생성 시각 |
| packs | pack metadata 배열 |

packs item:

| 필드 | 설명 |
|---|---|
| id | pack id |
| version | pack version |
| access_tier | free/premium |
| word_count | 단어 수 |
| status | published |
| etag | pack hash |

### 4.2 GET /content/packs/:pack_id

목적: pack의 words/examples/quiz/audio metadata를 가져온다.

접근:

| pack | 접근 |
|---|---|
| free published | anonymous 또는 authenticated |
| premium published | active/grace_period entitlement 필요 |
| draft/reviewed/paused/retired | client 접근 금지 |

응답 크기:

- 기본 limit 50 words.
- 최대 limit 100 words.
- 큰 pack은 cursor로 나눈다.

### 4.3 GET /content/audio-url

목적: premium 또는 보호 대상 audio asset의 signed URL 발급.

요청:

| 필드 | 설명 |
|---|---|
| audio_asset_id | 대상 asset |
| content_hash | 클라이언트 보유 hash |

응답:

| 필드 | 설명 |
|---|---|
| signed_url | 재생 URL |
| expires_in_sec | 기본 21600초, 6시간 |
| content_hash | 무결성 확인 |

free audio는 CDN/public 접근을 허용할 수 있으나 rate limit과 hash 검증을 적용한다.

확정 결정:

- CC3-04 결정: free content는 public read + rate limit/ETag/pagination/hash로 보호하고 Premium은 entitlement + signed URL TTL 6시간으로 보호한다. 임시 기준은 rate limit, manifest ETag, premium authenticated access 필수, App Check/DeviceCheck 적용 여부 검토다.

## 5. 학습 API

### 5.1 POST /learning/sessions

세션 생성. mode는 learn 또는 review다.

요청:

| 필드 | 필수 | 설명 |
|---|---:|---|
| mode | Y | learn/review |
| local_day | Y | 04:00 기준 날짜 |
| timezone | Y | IANA timezone |
| word_ids | Y | 세션 단어 목록 |

응답: session_id, accepted_word_ids, daily_usage snapshot.

### 5.2 POST /learning/attempts/batch

오프라인 큐 포함 batch 업로드.

제한:

| 항목 | 기준 |
|---|---:|
| max attempts per request | 100 |
| max payload | 256KB |
| idempotency | event_id per attempt |
| retry | exponential backoff |

요청 item:

| 필드 | 설명 |
|---|---|
| event_id | 클라이언트 생성 UUID |
| session_id | 세션 ID |
| word_id | 단어 ID |
| is_correct | 정답 여부 |
| answer_type | multiple_choice/tap_reveal |
| attempted_at | 시도 시각 |
| local_day | 04:00 기준 날짜 |
| stage_before | 클라이언트 참고값 |

서버 처리:

- event_id 중복은 무시한다.
- stage_before는 신뢰하지 않고 서버 상태와 attempts 순서로 재계산한다.
- daily_usage 한도 초과 attempt는 rejected로 반환할 수 있다.

### 5.3 POST /learning/sessions/:id/complete

세션 완료 처리. lesson_completed 또는 review_completed 기준이다.

idempotency:

- 이미 completed이면 기존 결과 반환.
- completed_at은 최초 완료 시각 유지.

### 5.4 GET /me/daily-usage

현재 local_day의 사용량과 남은 한도를 반환한다.

응답:

| 필드 | 설명 |
|---|---|
| local_day | 04:00 기준 날짜 |
| new_words_started_count | 신규 단어 수 |
| new_words_limit | 3 또는 15 |
| reviews_completed_count | 복습 수 |
| reviews_limit | 20 또는 null |

## 6. 게스트 병합 API

### POST /account/merge-guest

가입 후 로컬 게스트 데이터를 서버 user_id에 병합한다.

요청:

| 필드 | 설명 |
|---|---|
| merge_request_id | 클라이언트 생성 UUID |
| device_install_id | 게스트 설치 ID |
| local_profile | level/interests/timezone |
| attempts | 최대 500개까지 분할 업로드 |
| local_daily_usage | local_day별 사용량 |

규칙:

- attempts는 append-only.
- 중복 event_id는 무시.
- stage는 서버 재계산.
- daily_usage는 local_day별 병합.
- 실패 시 클라이언트는 로컬 데이터를 보존한다.

## 7. 구독 API

### 7.1 GET /me/entitlements

응답:

| 필드 | 설명 |
|---|---|
| entitlement_id | premium |
| status | active/grace_period/billing_retry/expired/refunded/revoked/transferred/unknown |
| product_id | 상품 ID |
| store | app_store/play_store |
| period_ends_at | 기간 종료 |
| grace_period_ends_at | grace 종료 |
| auto_renew_status | on/off/unknown |

### 7.2 POST /webhooks/revenuecat

RevenueCat webhook 수신.

처리 이벤트:

- INITIAL_PURCHASE
- RENEWAL
- CANCELLATION
- EXPIRATION
- BILLING_ISSUE
- UNCANCELLATION
- NON_RENEWING_PURCHASE
- PRODUCT_CHANGE
- REFUND
- TRANSFER

멱등성:

- revenuecat_events.event_id가 이미 processed이면 무시한다.
- raw_payload 저장 후 processing_status를 갱신한다.
- rc_app_user_id와 profiles.id 매핑 실패 시 failed로 보관하고 재처리 가능해야 한다.

## 8. 계정/개인정보 API

### DELETE /me

계정 삭제 요청 생성. 처리 SLA는 30일이다.

- active deletion request가 있으면 기존 요청 반환.
- pending_delete 상태에서는 신규 학습/결제를 차단한다.

### GET /me/export

사용자 학습 데이터 내보내기 요청. MVP에서는 P1이며, 수동 CSV export가 가능하도록 user_id 기준 정규화한다.

## 9. 콘텐츠 오류 신고 API

### POST /support/content-report

요청:

| 필드 | 설명 |
|---|---|
| target_type | word/example/audio |
| target_id | 대상 ID |
| report_type | typo/translation/romanization/audio/difficulty/other |
| message | 선택 |

rate limit:

- 사용자/기기 기준 1분 5건, 1일 30건.
- 동일 target/report_type은 24시간 중복 제출을 제한한다.

## 10. OTA와 API 경계

API/manifest로 변경 가능한 것:

- copy/text typo
- published 콘텐츠 상태
- content_manifest
- audio asset 교체
- remote config 표시값

store build가 필요한 것:

- native module 변경
- OS 권한 변경
- 개인정보 수집 범위 변경
- age gate 변경
- 로그인/계정 병합 로직 변경
- RevenueCat 결제/entitlement 로직 변경
- 핵심 SRS 알고리즘 변경
- Privacy Manifest에 영향을 주는 변경
