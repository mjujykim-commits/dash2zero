# 19. 운영 관리자 기획서

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-03 | RLS와 audit_log 기준 반영 |
| CC2-15 | 콘텐츠 50단어 batch 운영 반영 |
| CC2-16 | 운영 주체 C-13 마커와 D-42 gate 반영 |
| CC2-21 | 운영 secret/키 접근 최소화 반영 |
| Q-PP-DOC-007 | Editor/Reviewer 분리 잔여 마커 추가 |

## 1. 문서 목적

이 문서는 dash2zero MVP 운영에 필요한 관리자 기능과 운영 도구 범위를 정의한다. MVP에서는 별도 웹 어드민 개발을 최소화하고, 제품 출시와 콘텐츠 품질 유지에 필요한 운영 흐름만 구현한다.

운영 주체는 확정 전까지 <TBD-C-13: 한국 개인사업자 가정>으로 표기한다.

## 2. 운영 원칙

- MVP에서는 복잡한 관리자 웹을 만들지 않는다.
- 콘텐츠 운영은 구조화된 CSV/스프레드시트와 Supabase Dashboard를 사용한다.
- 결제 상태 확인은 RevenueCat Dashboard와 Supabase subscription_entitlements를 기준으로 한다.
- 문의 처리는 이메일과 운영 시트를 기준으로 한다.
- 앱 사용자에게 노출되는 콘텐츠는 반드시 published 상태만 허용한다.
- 사용자 데이터 조회와 운영 변경은 audit_log 대상이다.

## 3. MVP 운영 도구 구성

| 목적 | MVP 도구 | 별도 개발 여부 |
|---|---|---:|
| 콘텐츠 작성 | Google Sheets/Excel/CSV | 없음 |
| 콘텐츠 검수 | 스프레드시트 상태 컬럼 + checklist | 없음 |
| 콘텐츠 반영 | CSV import 또는 Supabase Dashboard | 없음 |
| 오디오 파일 관리 | Supabase Storage | 없음 |
| 결제 상태 확인 | RevenueCat Dashboard + Supabase | 없음 |
| 크래시 확인 | Firebase Crashlytics | 없음 |
| 이벤트 분석 | Firebase Analytics | 없음 |
| 고객 문의 | support email + 운영 시트 | 없음 |
| 콘텐츠 신고 처리 | Supabase Dashboard/운영 시트 | 최소 구현 |
| 운영 감사 | audit_log table | DB 구현 |

## 4. 관리 대상 데이터

### 4.1 콘텐츠

- content_manifests
- word_packs
- words
- word_examples
- quiz_items
- audio_assets

### 4.2 사용자 운영

- profiles
- user_word_states
- learning_sessions
- learning_attempts
- daily_usage
- subscription_entitlements
- content_reports
- deletion_requests

### 4.3 분석/품질

- lesson/review completion 이벤트
- subscription funnel 이벤트
- crash-free users
- 콘텐츠 신고 건수
- 결제/Restore 문의 건수

## 5. 콘텐츠 상태 모델

| 상태 | 의미 | 앱 노출 |
|---|---|---:|
| draft | 작성 중 | 아니오 |
| reviewed | 1차 검수 완료 | 아니오 |
| published | 앱 노출 가능 | 예 |
| paused | 임시 비노출 | 아니오 |
| retired | 폐기/대체 | 아니오 |

published, paused, retired 전환은 audit_log에 남긴다.

## 6. 50단어 batch 운영 절차

| 단계 | 처리 내용 | 기록 |
|---|---|---|
| 1 | 후보 단어 50개 작성 | batch id |
| 2 | AI 보조 초안 생성 | prompt/version |
| 3 | Editor 1차 정리 | editor id |
| 4 | Reviewer pass/fail 검수 | checklist |
| 5 | TTS 생성/업로드 | provider/voice/hash |
| 6 | CSV validation | validation result |
| 7 | staging import | import log |
| 8 | 앱 QA | QA result |
| 9 | production publish | content_manifest version |
| 10 | audit | audit_log |

Starter Pack 60단어는 batch와 별도 P0 milestone으로 운영한다.

## 7. 역할 설계

| 역할 | 권한 | MVP 적용 |
|---|---|---:|
| Owner | 전체 접근, 키/스토어/결제 설정 | 예 |
| Content Editor | draft 작성/수정 | 운영 절차로 적용 |
| Content Reviewer | reviewed/published 승인 | 운영 절차로 적용 |
| Support | 제한적 사용자 조회, 문의 처리 | 운영 절차로 적용 |
| Analyst | Firebase/Crashlytics 조회 | 예 |
| Service Role | webhook/import/deletion 자동 처리 | 서버 전용 |

### 7.1 검수 분리 잔여 결정

- CC3-07 결정: published 콘텐츠는 작성자와 독립 검수자를 분리하고 외부 한국어 원어민 또는 독립 검수자 pass/fail 검수를 P0로 요구한다. 임시 기준은 Editor와 Reviewer 역할을 논리적으로 분리하고, 1인 운영 시 작성 후 24시간 경과 self-review + checklist + 10% 샘플 재검수 로그를 요구한다.

## 8. 운영 접근 통제

- Supabase Dashboard 접근자는 최소화한다.
- service role key는 앱, repo, 문서에 저장하지 않는다.
- 공유 계정을 사용하지 않는다.
- support 조회는 support case id 또는 content_report id가 있어야 한다.
- subscription_entitlements 수동 변경은 원칙적으로 금지한다.
- 불가피한 수동 보정은 Owner 승인과 audit_log가 필요하다.

## 9. 콘텐츠 신고 처리

| 단계 | 처리 내용 |
|---|---|
| 접수 | 앱에서 word/example/audio 단위 신고 생성 |
| 분류 | typo, translation, romanization, audio, difficulty, other |
| 확인 | 운영자가 원문과 신고 내용 검토 |
| 조치 | 수정, 유지, paused, retired, 다음 version 반영 |
| 기록 | 처리 상태, 조치, 처리자, resolved_at 기록 |

## 10. 지원 케이스 운영

MVP에서는 support_cases 테이블을 필수 구현하지 않는다. 문의량이 적은 단계에서는 이메일과 운영 시트로 처리한다. 단, 사용자 데이터 조회가 필요한 경우 운영 시트의 case id를 audit_log reason에 남긴다.

앱 내 고객지원 화면 필수 정보:

- support email
- 앱 버전
- 사용자 ID 또는 게스트 지원 코드
- 구독 복원 안내
- 계정 삭제 안내

## 11. 향후 어드민 웹 범위

| 기능 | 우선순위 | 조건 |
|---|---:|---|
| 콘텐츠 CRUD | P1 | 콘텐츠 팩 3개 이상 또는 월 2회 이상 업데이트 |
| 신고 처리 대시보드 | P1 | 월 신고 50건 이상 |
| 사용자 조회 | P2 | 고객지원 문의 증가 |
| 구독 상태 조회 | P2 | 결제 문의 증가 |
| 콘텐츠 버전 배포 | P1 | 콘텐츠 업데이트 주기 정례화 |
| 운영 권한 관리 | P2 | 운영자 2명 이상 |

## 12. 운영 리스크

| 리스크 | 대응 |
|---|---|
| Dashboard 직접 수정 실수 | import 전 백업, content_version, audit_log |
| published 전 필드 누락 | CSV validation + pass/fail checklist |
| 오디오 파일 링크 오류 | staging 앱에서 batch 전체 재생 확인 |
| 결제 문의 대응 지연 | RevenueCat customer ID 확인 절차 문서화 |
| 개인정보 과다 조회 | support case 기반 제한 조회 |
| 1인 운영 단일 장애점 | sealed recovery, 키 vault, 긴급 인수자 지정 |

## 13. D-42 운영 게이트

C-13 확정 데드라인은 베타 출시 4주 전, 공개 출시 D-42다.

D-42까지 아래 운영 정보가 확정되어야 한다.

- 사업자/운영자명
- 결제 수령 주체
- 지원 이메일
- 약관/처리방침 운영자 표시
- Apple/Google account holder 정보
- RevenueCat payout/tax 설정
