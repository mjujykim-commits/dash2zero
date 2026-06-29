# ERD / DB 설계서

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-03 | 모든 테이블 default deny + RLS enabled, 역할 x CRUD 매트릭스 추가 |
| CC2-06 | RevenueCat appUserID는 Supabase auth.users.id 기준 |
| CC2-07 | daily_usage 서버 SSOT 추가 |
| CC2-08 | subscription_entitlements 컬럼과 status enum 확정 |
| CC2-16 | 사업자/결제 수령 주체 위치에 TBD-C-13 마커 사용 |
| B-12 | webhook 구현 가능한 entitlement schema 확정 |

## 1. 설계 원칙

- Supabase Postgres를 기준으로 한다.
- 서버 사용자 식별자의 SSOT는 auth.users.id다.
- RevenueCat appUserID는 auth.users.id와 동일하게 설정한다.
- 게스트 데이터는 로컬 SQLite에 저장하고 가입 시 Edge Function으로 병합한다.
- 콘텐츠는 versioned immutable 원칙을 따른다.
- word_id는 삭제/변경하지 않고 status와 retired_at으로 비활성화한다.
- 모든 사용자 데이터 테이블은 RLS enabled + default deny를 기본값으로 한다.
- 운영자 변경은 service_role 경유와 audit_log 기록을 필수로 한다.

## 2. ERD 개요

| 영역 | 테이블 |
|---|---|
| 계정 | profiles, device_installs, privacy_consents, deletion_requests |
| 학습 | user_word_states, learning_sessions, learning_attempts, daily_usage |
| 콘텐츠 | content_manifests, word_packs, words, word_examples, quiz_items, audio_assets |
| 결제 | subscription_entitlements, revenuecat_events |
| 운영 | content_reports, audit_log |

## 3. 핵심 관계

- auth.users.id 1:1 profiles.id
- profiles.id 1:N user_word_states.user_id
- profiles.id 1:N learning_sessions.user_id
- learning_sessions.id 1:N learning_attempts.session_id
- words.id 1:N word_examples.word_id
- words.id 1:N audio_assets.word_id
- word_packs.id 1:N words.pack_id
- profiles.id 1:N subscription_entitlements.user_id
- revenuecat_events.event_id 1:0..1 subscription_entitlements.last_rc_event_id

## 4. 테이블 상세

### 4.1 profiles

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK, auth.users.id | 사용자 ID |
| email | text | nullable | 로그인 이메일 |
| auth_provider | text | not null | apple/google/email |
| timezone | text | not null | IANA timezone |
| locale | text | not null default en-US | 앱 언어 |
| age_band | text | not null | 13_17 또는 18_plus |
| is_under_13_blocked | boolean | not null default false | 13세 미만 차단 여부 |
| level | text | nullable | A0/A1/A1+ |
| interests | text[] | default empty | 관심 주제 |
| account_status | text | active/pending_delete/deleted | 계정 상태 |
| created_at | timestamptz | not null | 생성일 |
| updated_at | timestamptz | not null | 갱신일 |
| deleted_at | timestamptz | nullable | 삭제 완료일 |

### 4.2 device_installs

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | 설치 식별자 |
| user_id | uuid | nullable FK profiles.id | 가입 후 연결 |
| platform | text | ios/android | 플랫폼 |
| app_version | text | not null | 앱 버전 |
| build_number | text | nullable | 빌드 번호 |
| device_locale | text | nullable | 기기 locale |
| created_at | timestamptz | not null | 생성일 |
| merged_at | timestamptz | nullable | 계정 병합일 |

### 4.3 privacy_consents

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | 동의 기록 ID |
| user_id | uuid | nullable FK profiles.id | 가입 사용자 |
| device_install_id | uuid | nullable FK device_installs.id | 게스트 기기 |
| analytics_opt_in | boolean | not null default false | 분석 동의 |
| diagnostics_opt_in | boolean | not null default false | 진단 동의 |
| consent_version | text | not null | 동의 문구 버전 |
| granted_at | timestamptz | nullable | 동의 시각 |
| revoked_at | timestamptz | nullable | 철회 시각 |

### 4.4 word_packs

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | text | PK | starter/survival 등 |
| title | text | not null | 표시명 |
| description | text | nullable | 설명 |
| access_tier | text | free/premium | 접근 등급 |
| word_count | int | not null | 단어 수 |
| content_version | int | not null | 콘텐츠 버전 |
| status | text | draft/reviewed/published/paused/retired | 상태 |
| published_at | timestamptz | nullable | 배포일 |
| retired_at | timestamptz | nullable | 비활성화 |

### 4.5 words

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | text | PK | 불변 word_id |
| pack_id | text | FK word_packs.id | 단어팩 |
| korean | text | not null | 한글 |
| romanization | text | not null | Revised Romanization |
| english_gloss | text | not null | 영어 뜻 |
| part_of_speech | text | nullable | 품사 |
| level | text | not null | A0/A1/A1+ |
| category | text | nullable | 범주 |
| tags | text[] | default empty | 태그 |
| content_version | int | not null | 콘텐츠 버전 |
| status | text | draft/reviewed/published/paused/retired | 상태 |
| retired_at | timestamptz | nullable | 비활성화 |

### 4.6 word_examples

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | 예문 ID |
| word_id | text | FK words.id | 단어 |
| example_ko | text | not null | 한국어 예문 |
| example_en | text | not null | 영어 번역 |
| new_learning_points_count | int | default 1 | 신규 학습 포인트 수 |
| status | text | draft/reviewed/published/paused/retired | 상태 |
| content_version | int | not null | 콘텐츠 버전 |

### 4.7 quiz_items

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | 퀴즈 ID |
| word_id | text | FK words.id | 정답 단어 |
| prompt_type | text | meaning_to_korean/korean_to_meaning | 문제 유형 |
| correct_option | text | not null | 정답 option |
| distractor_options | text[] | size 3 | 오답 3개 |
| validation_status | text | pass/fail | 검수 상태 |
| content_version | int | not null | 콘텐츠 버전 |

### 4.8 audio_assets

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | 오디오 ID |
| word_id | text | nullable FK words.id | 단어 오디오 |
| example_id | uuid | nullable FK word_examples.id | 예문 오디오 |
| kind | text | word/example | 종류 |
| provider | text | not null | TTS provider |
| voice_id | text | not null | voice |
| storage_path | text | not null | Supabase Storage path |
| duration_ms | int | nullable | 길이 |
| content_hash | text | not null | 캐시 무결성 |
| license_note | text | nullable | 라이선스/출처 |
| status | text | draft/published/retired | 상태 |

### 4.9 user_word_states

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| user_id | uuid | PK, FK profiles.id | 사용자 |
| word_id | text | PK, FK words.id | 단어 |
| content_version_seen | int | not null | 마지막 학습 콘텐츠 버전 |
| stage | int | 1~5 | Leitner stage |
| weak | boolean | default false | weak 표시 |
| correct_count | int | default 0 | 정답 수 |
| wrong_count | int | default 0 | 오답 수 |
| consecutive_wrong_in_due_cycle | int | default 0 | 같은 due cycle 연속 오답 |
| last_seen_at | timestamptz | nullable | 마지막 노출 |
| next_review_at | timestamptz | nullable | 다음 복습 |
| mastered_at | timestamptz | nullable | stage 5 최초 달성 |
| updated_at | timestamptz | not null | 갱신 |

### 4.10 learning_sessions

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | 세션 ID |
| user_id | uuid | FK profiles.id | 사용자 |
| mode | text | learn/review | 세션 유형 |
| local_day | date | not null | 04:00 기준 학습일 |
| timezone | text | not null | IANA timezone |
| status | text | started/completed/abandoned | 상태 |
| started_at | timestamptz | not null | 시작 |
| completed_at | timestamptz | nullable | 완료 |
| abandoned_at | timestamptz | nullable | 중단 |

### 4.11 learning_attempts

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| event_id | uuid | PK | 클라이언트 생성 멱등 키 |
| session_id | uuid | FK learning_sessions.id | 세션 |
| user_id | uuid | FK profiles.id | 사용자 |
| word_id | text | FK words.id | 단어 |
| answer_type | text | multiple_choice/tap_reveal | 답변 유형 |
| is_correct | boolean | not null | 정답 여부 |
| stage_before | int | nullable | 이전 stage |
| stage_after | int | nullable | 이후 stage |
| attempted_at | timestamptz | not null | 시도 시각 |
| local_day | date | not null | 04:00 기준 학습일 |
| source | text | online/offline_merge | 출처 |

### 4.12 daily_usage

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| user_id | uuid | PK, FK profiles.id | 사용자 |
| local_day | date | PK | 04:00 기준 날짜 |
| timezone | text | not null | IANA timezone |
| new_words_started_count | int | default 0 | 신규 단어 시작 수 |
| reviews_completed_count | int | default 0 | 완료 복습 수 |
| lesson_completed_count | int | default 0 | 완료 lesson 수 |
| paywall_view_count | int | default 0 | paywall 노출 수 |
| created_at | timestamptz | not null | 생성 |
| updated_at | timestamptz | not null | 갱신 |

### 4.13 subscription_entitlements

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | entitlement row |
| user_id | uuid | FK profiles.id | 사용자 |
| rc_app_user_id | text | not null | RevenueCat appUserID, Supabase user_id 문자열 |
| rc_original_app_user_id | text | nullable | RevenueCat original app user id |
| entitlement_id | text | not null | premium |
| product_id | text | not null | monthly/yearly product id |
| store | text | app_store/play_store | 스토어 |
| environment | text | sandbox/production | 환경 |
| status | text | active/grace_period/billing_retry/expired/refunded/revoked/transferred/unknown | 권한 상태 |
| period_started_at | timestamptz | nullable | 기간 시작 |
| period_ends_at | timestamptz | nullable | 기간 종료 |
| grace_period_ends_at | timestamptz | nullable | grace 종료 |
| auto_renew_status | text | on/off/unknown | 자동 갱신 |
| ownership_type | text | purchased/family_shared/unknown | 소유 유형, MVP family_shared 차단 |
| last_rc_event_id | text | nullable | 마지막 webhook event id |
| last_synced_at | timestamptz | nullable | 동기화 시각 |
| created_at | timestamptz | not null | 생성 |
| updated_at | timestamptz | not null | 갱신 |

### 4.14 revenuecat_events

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| event_id | text | PK | RevenueCat event id |
| user_id | uuid | nullable FK profiles.id | 매핑 사용자 |
| rc_app_user_id | text | not null | RevenueCat app user id |
| event_type | text | not null | webhook event type |
| product_id | text | nullable | 상품 |
| purchased_at | timestamptz | nullable | 구매 시각 |
| expiration_at | timestamptz | nullable | 만료 시각 |
| raw_payload | jsonb | not null | 원본 payload |
| processed_at | timestamptz | nullable | 처리 시각 |
| processing_status | text | received/processed/failed/ignored | 처리 상태 |

### 4.15 content_reports

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | 신고 ID |
| user_id | uuid | nullable FK profiles.id | 신고자 |
| device_install_id | uuid | nullable | 게스트 신고 |
| word_id | text | nullable FK words.id | 단어 |
| example_id | uuid | nullable FK word_examples.id | 예문 |
| audio_asset_id | uuid | nullable FK audio_assets.id | 오디오 |
| report_type | text | typo/translation/romanization/audio/difficulty/other | 유형 |
| message | text | nullable | 내용 |
| status | text | open/in_review/resolved/wont_fix | 처리 상태 |
| created_at | timestamptz | not null | 생성 |
| resolved_at | timestamptz | nullable | 처리 |

### 4.16 audit_log

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | 로그 ID |
| actor_user_id | uuid | nullable | 작업자 |
| actor_role | text | support/admin/service_role | 역할 |
| action | text | not null | 작업 |
| target_table | text | not null | 대상 테이블 |
| target_id | text | nullable | 대상 ID |
| reason | text | nullable | 사유 |
| created_at | timestamptz | not null | 생성 |

## 5. RLS 정책 매트릭스

약어: C=create, R=read, U=update, D=delete. 모든 테이블은 명시된 접근 외 default deny다.

| 테이블 | anonymous | authenticated owner | premium owner | support | admin | service_role |
|---|---|---|---|---|---|---|
| profiles | - | R/U own | R/U own | R limited | R limited | C/R/U/D |
| device_installs | C own device | R own linked | R own linked | - | R limited | C/R/U/D |
| privacy_consents | C own device | C/R/U own | C/R/U own | - | R limited | C/R/U/D |
| deletion_requests | - | C/R own | C/R own | R status | R status | C/R/U/D |
| word_packs | R published | R published | R published | R | C/R/U | C/R/U/D |
| words | R free published | R free published | R all published | R | C/R/U | C/R/U/D |
| word_examples | R free published | R free published | R all published | R | C/R/U | C/R/U/D |
| quiz_items | R free published | R free published | R all published | R | C/R/U | C/R/U/D |
| audio_assets | R free published metadata | R free published metadata | R all published metadata | R | C/R/U | C/R/U/D |
| user_word_states | - | C/R/U own | C/R/U own | R own by support case only | R limited | C/R/U/D |
| learning_sessions | - | C/R/U own | C/R/U own | R own by support case only | R limited | C/R/U/D |
| learning_attempts | - | C/R own | C/R own | R own by support case only | R limited | C/R/U/D |
| daily_usage | - | C/R/U own via RPC | C/R/U own via RPC | R own by support case only | R limited | C/R/U/D |
| subscription_entitlements | - | R own | R own | R own by support case only | R limited | C/R/U/D via webhook |
| revenuecat_events | - | - | - | R limited | R limited | C/R/U/D |
| content_reports | C limited | C/R own | C/R own | R/U assigned | R/U | C/R/U/D |
| audit_log | - | - | - | R own actions | R | C/R |

## 6. RLS 구현 패턴

- owner 조건은 user_id = auth.uid()를 기준으로 한다.
- premium 콘텐츠 접근은 subscription_entitlements의 active/grace_period 상태를 서버 RPC 또는 Edge Function에서 확인한다.
- client에서 subscription_entitlements update/delete는 금지한다.
- admin성 변경은 앱 클라이언트가 아니라 service_role 환경에서만 수행한다.
- support 접근은 support case 또는 content_report 처리 범위로 제한한다.

## 7. API/DB 멱등성 기준

| 작업 | 멱등 키 | 처리 |
|---|---|---|
| learning attempt 업로드 | learning_attempts.event_id | 중복 insert ignore |
| guest merge | merge_request_id + event_id | 중복 attempts 무시 후 재계산 |
| RevenueCat webhook | revenuecat_events.event_id | processed면 재처리 금지 |
| deletion request | active request per user | 기존 요청 반환 |
| content report | user_id/device + target + 24h window | 중복 신고 rate limit |

## 8. 로컬 SQLite

| 테이블 | 용도 |
|---|---|
| local_profile | 게스트 상태, age gate, privacy choices |
| cached_content_manifest | pack/version/hash |
| cached_words | free pack 및 허용된 premium cache |
| cached_audio_assets | storage path, hash, expiry |
| local_word_states | 게스트 SRS 상태 |
| local_daily_usage | 04:00 기준 게스트 한도 |
| queued_attempts | 오프라인 attempt queue |
| sync_metadata | 마지막 sync, schema version |

## 9. 콘텐츠 접근과 scrape 방어

MVP는 free Starter Pack 60개를 앱에서 접근 가능하게 제공한다. 프리미엄 콘텐츠는 entitlement가 확인된 사용자에게만 제공한다.

- 콘텐츠 API는 pagination, ETag, manifest hash를 사용한다.
- free pack endpoint에도 per-device/per-IP rate limit을 둔다.
- premium pack은 signed URL 또는 authenticated fetch만 허용한다.
- 오디오 파일은 content_hash로 캐시 무결성을 확인한다.
- bulk export endpoint는 제공하지 않는다.

### 9.1 잔여 결정

- CC3-04 결정: free content는 public read + rate limit/ETag/pagination/hash로 보호하고 Premium은 entitlement + signed URL TTL 6시간으로 보호한다. 임시 기준은 Supabase RLS + API rate limit + manifest ETag + App Check/DeviceCheck 검토다. App Check/DeviceCheck를 P0로 강제할지, 출시 후 hardening으로 둘지 결정이 필요하다.

## 10. 삭제/보존

- 계정 삭제 요청 후 30일 내 profile, states, sessions, attempts, daily_usage를 삭제 또는 비식별화한다.
- subscription_entitlements는 결제/분쟁/세무 대응에 필요한 최소 필드만 비식별 보존할 수 있다.
- raw RevenueCat payload 보존 기간은 법무/세무 검토 대상이다.
- C-13 관련 운영 주체는 <TBD-C-13: 한국 개인사업자 가정>으로 표기한다.

## 11. 마이그레이션 우선순위

| 순서 | 작업 |
|---:|---|
| 1 | profiles, device_installs, privacy_consents |
| 2 | content_manifests, word_packs, words, examples, quiz_items, audio_assets |
| 3 | user_word_states, sessions, attempts, daily_usage |
| 4 | subscription_entitlements, revenuecat_events |
| 5 | content_reports, deletion_requests, audit_log |
| 6 | RLS policy test suite |
