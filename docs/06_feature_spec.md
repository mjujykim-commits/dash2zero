# 기능 명세서

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

이 문서는 SERVICE_REVIEW_QA.md의 CC2/B 답변을 반영해 F-001~F-010을 swarm coding 가능한 구현 단위로 재작성한 버전이다.

| 반영 항목 | 결정 |
|---|---|
| CC2-02 | 기능마다 trigger, 입력값, 상태 전이, 실패 분기, idempotency, analytics, QA 기준 명시 |
| CC2-05 | age gate는 분석 동의보다 먼저 표시, 13세 미만은 모든 기능 차단 |
| CC2-06 | 유료 구매는 인증 사용자만 가능, RevenueCat appUserID는 Supabase user_id 기준 |
| CC2-07 | 일일 한도는 daily_usage 서버 SSOT, 게스트는 로컬 동일 규칙 |
| CC2-10 | SRS 오답은 기본 stage -1, 같은 due cycle 2회 연속 오답 시 stage 1 + weak |
| CC2-17 | OTA로 결제/권한/age gate/핵심 알고리즘 변경 금지 |
| CC2-18 | age gate -> privacy choices -> onboarding 순서 |
| CC2-25 | Notice -> Hear -> Meaning -> Retrieve 4단계 학습 루프 |

## 1. 공통 기능 작성 규칙

모든 P0 기능은 아래 항목을 구현 기준으로 삼는다.

| 항목 | 설명 |
|---|---|
| Owner | 주요 구현 책임 스트림 |
| Trigger | 기능이 시작되는 사용자/시스템 이벤트 |
| Preconditions | 실행 전 만족해야 하는 조건 |
| Inputs | 클라이언트/서버 입력값 |
| State | 읽거나 변경하는 상태 |
| Success | 정상 완료 결과 |
| Failure | 오류/예외 처리 |
| Idempotency | 중복 실행 처리 |
| Analytics | 기록할 이벤트 |
| Acceptance | 완료 판정 기준 |
| QA | 최소 검증 케이스 |

## 2. 상태와 역할

### 2.1 사용자 상태

| 상태 | 설명 | 허용 기능 |
|---|---|---|
| blocked_under_13 | age gate에서 13세 미만 선택 | 모든 학습/계정/분석/결제 차단 |
| guest | 계정 없는 로컬 사용자 | Starter Pack 무료 학습, 로컬 저장 |
| authenticated_free | 로그인한 무료 사용자 | Starter Pack, 일일 3 신규 단어, 복습 20문항 |
| authenticated_premium | Premium entitlement active | 전체 콘텐츠, 일일 15 신규 단어, 복습 무제한 |
| pending_delete | 계정 삭제 요청 생성 | 신규 학습 차단, 데이터 삭제 처리 대기 |

### 2.2 핵심 서버 상태

- profiles
- device_installs
- user_word_states
- learning_sessions
- learning_attempts
- daily_usage
- subscription_entitlements
- content_reports
- audit_log

## 3. P0 기능 명세

### F-001 First Run, Age Gate, Privacy Choices, Onboarding

| 항목 | 명세 |
|---|---|
| Owner | Mobile App, Analytics/Policy |
| Trigger | 앱 최초 실행 또는 local install reset 후 실행 |
| Preconditions | 앱이 local secure storage와 SQLite에 접근 가능 |
| Inputs | selected_age_band, analytics_opt_in, diagnostics_opt_in, level, interests, timezone, locale |
| State | device_install_id, age_gate_status, privacy_consent, onboarding_status, local_profile |
| Success | age gate 통과 후 privacy choices 저장, onboarding 완료 또는 건너뛰기 가능, 홈 진입 |
| Failure | 13세 미만 선택 시 학습/계정/결제/분석 전부 차단 화면 고정 |
| Idempotency | onboarding_completed=true면 재표시하지 않음. privacy choices는 settings에서 변경 가능 |
| Analytics | age_gate_completed는 동의 전 서버 전송 금지. 동의 후 onboarding_completed 기록 |
| Acceptance | 첫 실행 순서가 age gate -> privacy choices -> onboarding -> home이다 |
| QA | 13세 미만 선택, 13~17세 선택, 18세 이상 선택, analytics 거부/허용, 앱 재실행 |

#### F-001 세부 규칙

- age gate는 생년월일 전체를 저장하지 않는다. age band와 통과 여부만 저장한다.
- 13세 미만 선택 후 즉시 앱 기능을 차단하고, 우회 안내를 제공하지 않는다.
- 13~17세는 high privacy default를 적용한다. 비필수 분석은 opt-in 전까지 수집하지 않는다.
- analytics와 diagnostics는 기본 off다.
- 온보딩의 level/interests는 제품 개인화가 아니라 초기 콘텐츠 순서 힌트로만 사용한다.

### F-002 Guest Learning

| 항목 | 명세 |
|---|---|
| Owner | Mobile App, Local Data |
| Trigger | guest가 홈에서 Start Lesson 또는 Review 선택 |
| Preconditions | age gate 통과, local content manifest 존재, Starter Pack 캐시 가능 |
| Inputs | device_install_id, local_day, timezone, selected_pack_id |
| State | local_profile, local_word_states, local_daily_usage, cached_words, queued_attempts |
| Success | 서버 계정 없이 Starter Pack 학습 가능, 시도 기록 로컬 저장 |
| Failure | 콘텐츠 캐시 없음 + 네트워크 없음이면 연결 필요 화면 표시 |
| Idempotency | local attempt event_id 중복은 무시 |
| Analytics | 동의 전 원격 전송 금지. 동의 후 guest 식별자는 device_install_id 기반 익명 이벤트로 기록 |
| Acceptance | 게스트가 첫 lesson을 완료하고 앱 재실행 후 진행 상태가 유지된다 |
| QA | 오프라인 실행, 앱 강제 종료, 동일 문제 중복 제출, 04:00 local reset |

### F-003 Account Sign-in and Guest Merge

| 항목 | 명세 |
|---|---|
| Owner | Mobile App, Backend/Data |
| Trigger | guest가 Sign in, Sync, Premium purchase, Restore Purchases, Export, Delete Account 진입 |
| Preconditions | age gate 통과, 네트워크 연결, Supabase Auth 사용 가능 |
| Inputs | auth_provider, auth_token, local_guest_snapshot, device_install_id, merge_request_id |
| State | profiles, device_installs, user_word_states, learning_attempts, daily_usage |
| Success | Supabase user_id 생성/확인, 게스트 학습 데이터가 계정으로 병합됨 |
| Failure | 인증 실패, magic link 만료, merge 실패. 실패 시 로컬 데이터 보존 후 재시도 가능 |
| Idempotency | merge_request_id와 attempt event_id로 중복 병합 방지 |
| Analytics | sign_in_started, sign_in_succeeded, guest_merge_started, guest_merge_succeeded, guest_merge_failed |
| Acceptance | 같은 local snapshot을 2회 전송해도 서버 상태가 중복 증가하지 않는다 |
| QA | Apple, Google, email magic link, cold start universal link, merge retry, multi-device 로그인 |

#### F-003 병합 규칙

- 서버는 client stage 값을 그대로 믿지 않고 attempts를 기준으로 SRS 상태를 재계산한다.
- 동일 word_id에 서버 상태와 로컬 상태가 모두 있으면 더 최근 attempt를 모두 반영해 next state를 계산한다.
- daily_usage는 local_day별로 병합하되, 무료 한도 초과분은 서버에서 rejected_attempts로 표시하고 학습 상태에는 반영하지 않는다.
- 결제 기능 진입 전에는 반드시 authenticated 상태여야 한다.

#### F-003 잔여 결정

- CC3-03 결정: Android에도 Sign in with Apple web flow를 보조 로그인 옵션으로 제공한다. 기본 구현 가정은 iOS에서는 Apple Sign In 필수 제공, Android에서는 Google + email magic link를 기본 제공하되, Apple 계정으로 생성한 사용자의 복구 경로가 필요한 경우 Android Apple Sign In 웹 플로우 지원 여부를 별도 결정한다.

### F-004 Word Learning Card

| 항목 | 명세 |
|---|---|
| Owner | Mobile App, UX |
| Trigger | lesson/review flow에서 단어 노출 |
| Preconditions | word item과 example, audio metadata 로드 완료 |
| Inputs | word_id, content_version, display_settings |
| State | current_lesson_step, audio_cache_state |
| Success | 한글, romanization, 영어 뜻, 예문, 오디오 재생 버튼 표시 |
| Failure | 오디오 실패 시 학습 진행은 유지하고 Retry/Continue 제공 |
| Idempotency | word_viewed는 동일 session_id+word_id+step에서 1회만 기록 |
| Analytics | word_viewed, audio_played, audio_failed |
| Acceptance | iPhone SE에서 텍스트 겹침 없이 scroll 가능한 카드로 표시된다 |
| QA | 긴 영어 뜻, 긴 예문, 오디오 없음, 큰 글자 설정, romanization 숨김 |

#### F-004 4단계 표시

| 단계 | 목적 | UI |
|---|---|---|
| Notice | 한글 형태 인지 | 한글 대형 표시, romanization 보조 |
| Hear | 소리 노출 | 수동 play 버튼, 재생 상태, 실패 상태 |
| Meaning | 뜻 연결 | 영어 뜻과 짧은 예문 표시 |
| Retrieve | 회상 | 4지선다 객관식 기본 |

### F-005 Quiz and Distractor Rules

| 항목 | 명세 |
|---|---|
| Owner | Mobile App, Content |
| Trigger | Retrieve 단계 진입 |
| Preconditions | 정답 1개와 distractor 후보 3개 이상 존재 |
| Inputs | word_id, candidate_distractors, session_id |
| State | learning_attempts, user_word_states |
| Success | 4지선다 표시, 답변 후 즉시 피드백, attempt 저장 |
| Failure | distractor 부족 시 same pack/category 후보에서 서버/로컬 생성, 그래도 실패하면 tap-to-reveal 대체 |
| Idempotency | attempt event_id 중복 제출은 무시 |
| Analytics | word_answered with is_correct, stage_before, stage_after |
| Acceptance | 정답과 distractor가 중복되지 않고, 정답이 항상 하나만 존재한다 |
| QA | 후보 부족, 동의어 충돌, 이전 문제 정답 반복, 오프라인 상태 |

#### F-005 distractor 정량 기준

- 총 4지선다: 정답 1개 + 오답 3개.
- 오답은 정답과 english_gloss가 같거나 거의 같은 항목을 금지한다.
- 같은 pack/category 후보를 우선 사용한다.
- 너무 쉬운 오답 방지를 위해 품사 또는 의미 범주를 최소 1개 이상 맞춘다.
- 직전 3문제의 정답을 distractor로 재사용하지 않는다.
- 후보가 부족하면 global beginner pool을 사용한다.
- 최종 후보가 3개 미만이면 객관식 대신 tap-to-reveal recall로 fallback한다.

### F-006 SRS Review Engine

| 항목 | 명세 |
|---|---|
| Owner | Mobile App, Backend/Data |
| Trigger | lesson attempt 저장, review answer 제출, daily due queue 계산 |
| Preconditions | user_word_states 또는 local_word_states 존재 |
| Inputs | word_id, is_correct, current_stage, attempt_at, local_day, due_cycle_id |
| State | user_word_states, learning_attempts, daily_usage |
| Success | stage, weak flag, next_review_at이 결정적으로 계산됨 |
| Failure | 서버 동기화 실패 시 local queued_attempts에 저장 후 재시도 |
| Idempotency | event_id 기준 append-only, 서버 재계산은 deterministic |
| Analytics | word_answered, review_completed, word_mastered, word_weakened |
| Acceptance | 같은 attempt sequence는 기기/서버에서 같은 SRS 결과를 만든다 |
| QA | 정답, 1회 오답, 2회 연속 오답, Mastered 오답, 04:00 경계, overdue |

#### F-006 SRS 규칙

| stage | label | interval |
|---:|---|---:|
| 1 | New | 1일 |
| 2 | Learning | 3일 |
| 3 | Familiar | 7일 |
| 4 | Strong | 14일 |
| 5 | Mastered | 30일 |

- 정답: next_stage = min(5, current_stage + 1).
- 오답 1회: next_stage = max(1, current_stage - 1).
- 동일 due cycle에서 같은 word_id 2회 연속 오답: next_stage = 1, weak = true.
- Mastered(stage 5) 1회 오답: stage 4.
- 60/120일 장기 재노출은 MVP 제외, Phase 3 실험 후보.
- 04:00 전에 시작해 04:00 이후 완료한 session은 started_at의 local_day에 귀속한다. 단 streak는 completed_at 기준 local_day에 1회만 증가한다.

### F-007 Lesson Session State

| 항목 | 명세 |
|---|---|
| Owner | Mobile App |
| Trigger | lesson_started 또는 review_started |
| Preconditions | due queue 또는 new words queue 존재 |
| Inputs | mode, word_ids, session_id, local_day |
| State | current_session, current_step, partial_progress, daily_usage |
| Success | session completed 또는 abandoned로 종료 |
| Failure | 앱 종료/백그라운드/네트워크 오류 시 partial 저장 |
| Idempotency | session_id 재사용 시 완료된 step은 재기록하지 않음 |
| Analytics | lesson_started, lesson_abandoned, lesson_completed, review_started, review_completed |
| Acceptance | 강제 종료 후 재실행 시 마지막 완료 step 이후부터 재개 또는 명시적 재시작 가능 |
| QA | 백그라운드 5분, OS kill, 네트워크 전환, 중복 완료 버튼 탭 |

### F-008 Free/Premium Gating

| 항목 | 명세 |
|---|---|
| Owner | Mobile App, Backend/Data, Monetization |
| Trigger | pack 접근, lesson 시작, review 시작, paywall 진입 |
| Preconditions | user status와 entitlement 확인 가능 |
| Inputs | user_id or guest id, pack_id, local_day, requested_action |
| State | daily_usage, subscription_entitlements, content manifest |
| Success | 권한 내 기능은 허용, 초과/잠금 항목은 paywall 또는 login gate로 안내 |
| Failure | entitlement 확인 실패 시 최근 캐시를 제한적으로 사용하고 결제 CTA는 보류 |
| Idempotency | 같은 action request는 daily_usage 중복 증가 금지 |
| Analytics | paywall_viewed, limit_reached, premium_gate_viewed |
| Acceptance | 무료/프리미엄 한도와 pack 접근이 서버 기준으로 일관된다 |
| QA | 무료 3단어 초과, 무료 review 20문항 초과, premium 만료, offline 캐시 |

#### F-008 정책

| 구분 | 무료 | Premium |
|---|---:|---:|
| 접근 콘텐츠 | Starter Pack 60단어 | MVP 전체 300단어 + future packs |
| 일일 신규 단어 | 3 | 15 |
| 일일 복습 | 20 | 무제한 |
| 구매 가능 | 로그인 후 가능 | 해당 없음 |
| Restore | 로그인 후 가능 | 로그인 후 가능 |

#### F-008 잔여 결정

- CC3-01 결정: 신규 Premium pack 무료 샘플 10개는 daily 3과 분리한 preview pool로 운영한다. v0.2 임시 구현은 신규 premium pack이 추가되어도 무료 사용자의 daily 3 new words와 Starter Pack 60단어 제한을 우선한다. 샘플 10개 공개가 필요하면 별도 sample_pack 또는 preview_words로 분리해야 하며, daily limit과 충돌하지 않도록 별도 preview counter를 둔다.

### F-009 Subscription and Paywall

| 항목 | 명세 |
|---|---|
| Owner | Monetization, Mobile App, Backend/Data |
| Trigger | premium locked content 접근, review limit 초과, Settings purchase/restore |
| Preconditions | age gate 통과, authenticated user, RevenueCat offerings 로드 |
| Inputs | user_id, rc_app_user_id, product_id, store, environment |
| State | subscription_entitlements, RevenueCat customer state |
| Success | 구매 성공 후 entitlement active, Premium 기능 해제 |
| Failure | 구매 취소/실패/네트워크 오류 시 free 상태 유지, 재시도 가능 |
| Idempotency | RevenueCat event id와 transaction id 기준 중복 webhook 무시 |
| Analytics | paywall_viewed, plan_selected, checkout_started, subscription_purchase_succeeded, subscription_purchase_failed |
| Acceptance | 게스트는 구매 전에 로그인 요구. purchase/restore 후 entitlement가 서버와 앱에 일치 |
| QA | 월간/연간 구매, 취소, 복원, 만료, 환불, billing retry, grace 상태 |

#### F-009 잔여 결정

- CC3-05 결정: grace_period 3일, billing_retry without grace는 last active 후 24시간 유지, expired/refunded/revoked는 즉시 Free 강등. 현재 DB status는 active, grace_period, billing_retry, expired, refunded, revoked, transferred, unknown을 지원한다.

### F-010 Account Deletion and Data Rights

| 항목 | 명세 |
|---|---|
| Owner | Mobile App, Backend/Data, Privacy |
| Trigger | Settings > Account > Delete Account |
| Preconditions | authenticated user |
| Inputs | user_id, confirmation_text or confirm checkbox, reason optional |
| State | profiles, user_word_states, sessions, attempts, daily_usage, entitlements |
| Success | deletion request 생성, 신규 학습 차단, 30일 내 삭제 또는 비식별화 |
| Failure | 네트워크 오류 시 재시도, 미인증 사용자는 로그인 요구 |
| Idempotency | active deletion request가 있으면 중복 생성하지 않음 |
| Analytics | account_delete_requested는 동의 사용자의 경우만 기록 |
| Acceptance | 삭제 요청 후 앱은 pending_delete 상태를 표시하고 구독 취소는 스토어에서 별도 안내 |
| QA | 삭제 요청, 중복 요청, 로그아웃 후 재로그인, premium 사용자 삭제, restore 후 삭제 |

## 4. P1 기능

| ID | 기능 | v0.2 기준 |
|---|---|---|
| F-101 Local Reminder | 첫 lesson 완료 후 알림 권한 요청, 거부 시 홈 배너 fallback |
| F-102 Content Report | word/example/audio 단위 오류 신고, rate limit 적용 |
| F-103 Weak Words | weak=true 단어 집중 복습 큐 |
| F-104 Privacy Preferences | analytics/diagnostics 동의 철회와 상태 표시 |
| F-105 Content Manifest Update | OTA 허용 범위 내 manifest/content update |
| F-106 Growth Summary | 주간 학습 단어/복습/weak 변화 요약 |

## 5. P2 기능

- 다크 모드 완전 QA
- 어트리뷰션 도구
- A/B 테스트 인프라
- 원격 푸시
- 이미지 기반 학습
- 60/120일 장기 retention review 실험

## 6. 제외 기능

- 음성 녹음
- 발화 평가
- 사용자용 AI 예문 생성
- AI 챗봇
- 소셜/리더보드
- 강의 영상
- TOPIK 대비 모드
- 광고 SDK 또는 cross-context behavioral advertising

## 7. 공통 오류 처리

| 상황 | 처리 |
|---|---|
| 네트워크 단절 | 캐시 콘텐츠만 학습 가능, 서버 write는 queued_attempts에 저장 |
| 오디오 다운로드 실패 | Retry/Continue 제공, 학습 진행 차단 금지 |
| 결제 실패 | 오류 메시지 + Retry. Restore는 로그인 후 가능 |
| entitlement 불명 | 최근 서버 확인값이 active면 제한적 grace UI, 신규 purchase CTA는 보류 |
| 병합 실패 | 로컬 데이터 보존, merge_request_id로 재시도 |
| 콘텐츠 retire | 기존 SRS 기록 유지, 신규 노출 중단 |
| age gate 미완료 | 모든 화면 접근 전 age gate로 redirect |

## 8. 구현 완료 정의

- F-001~F-010 acceptance criteria 통과
- P0 QA 케이스 통과
- Analytics opt-in 전 원격 분석 미수집
- 게스트 구매 차단 및 로그인 후 구매 가능
- SRS deterministic unit test 통과
- RevenueCat sandbox purchase/restore/expiration/refund 테스트 통과
- RLS matrix와 API access rule 일치
