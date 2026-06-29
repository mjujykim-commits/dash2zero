# 콘텐츠 운영 및 검수 가이드

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-11 | AI 검수 기준을 pass/fail 정량 체크리스트로 전환 |
| CC2-15 | 콘텐츠 300단어를 50단어 batch 단위로 분해 |
| CC2-17 | 콘텐츠 manifest/status 변경은 OTA 허용 범위, 핵심 앱 로직 변경은 금지 |
| CC2-21 | 운영 변경과 published 전환은 audit_log 대상 |

## 1. 목적

이 문서는 단어, 예문, 발음 음성, 오답 후보, 태그를 일관된 기준으로 제작하고 검수하기 위한 운영 기준이다.

## 2. 콘텐츠 원칙

- 영어권 초보자가 실제로 만날 수 있는 단어를 우선한다.
- 예문은 짧고 상황이 분명해야 한다.
- AI 초안은 반드시 사람이 검수한다.
- AI는 승인권을 갖지 않는다.
- 음성은 상업적 이용 가능한 TTS 파일만 사용한다.
- 배포된 word_id는 변경하지 않는다. 수정은 content_version, status, retired_at으로 처리한다.

## 3. 원본 관리 방식

초기 콘텐츠 원본은 스프레드시트 또는 CSV로 관리한다. 최종 앱 반영 전 validation을 통과한 JSON 또는 Supabase 테이블로 변환한다.

| 필드 | 설명 | 필수 | 검증 |
|---|---|---:|---|
| word_id | 불변 고유 ID | Y | 중복 없음 |
| korean | 한글 표기 | Y | 한글 포함, 공백 오류 없음 |
| romanization | Revised Romanization | Y | 표준 표기 검수 |
| english_gloss | 영어 뜻 | Y | 1~5단어 권장 |
| part_of_speech | 품사 | Y | enum |
| level | A0/A1/A1+ | Y | 초보 난이도 |
| pack_id | 단어팩 | Y | 존재하는 pack |
| category | 범주 | Y | enum |
| tags | 태그 배열 | Y | 5개 이하 권장 |
| example_ko | 한국어 예문 | Y | 3~6어절 |
| example_en | 영어 번역 | Y | 자연스러운 영어 |
| distractors | 오답 후보 3개 이상 | Y | 중복/동의어 충돌 없음 |
| pronunciation_note | 선택 발음 노트 | N | 짧은 영어 note |
| audio_word_path | 단어 음성 | Y | 파일 존재/hash |
| audio_example_path | 예문 음성 | Y | 파일 존재/hash |
| content_version | 콘텐츠 버전 | Y | manifest와 일치 |
| status | draft/reviewed/published/paused/retired | Y | workflow 상태 |

## 4. 50단어 batch 워크플로우

| 단계 | 담당 | 산출물 | 완료 기준 |
|---|---|---|---|
| 1. 후보 수집 | Content Editor | word candidates | 중복/난이도 1차 필터 |
| 2. 메타데이터 초안 | AI 보조 + Editor | gloss, tags, category | 필수 필드 채움 |
| 3. 예문 초안 | AI 보조 + Editor | example_ko/en | 3~6어절, 신규 포인트 1개 |
| 4. distractor 초안 | AI 보조 + Editor | distractor 3개 이상 | 정답 중복 없음 |
| 5. 1차 검수 | Reviewer | pass/fail sheet | 정량 검수 통과 |
| 6. TTS 생성 | Editor | audio mp3 + metadata | provider/voice/license 기록 |
| 7. 앱 import | Ops/Data | staging DB | validation 통과 |
| 8. 앱 QA | Reviewer | QA result | 재생/퀴즈/레이아웃 확인 |
| 9. publish | Owner/Reviewer | content_manifest | status published |
| 10. audit | System/Owner | audit_log | 변경 기록 저장 |

Starter Pack 60단어는 별도 P0 milestone으로 운영한다. MVP 300단어는 Starter 60 + 50단어 batch x 6 기준으로 추적한다.

## 5. Pass/Fail 검수표

| 항목 | Pass 기준 | Fail 예시 |
|---|---|---|
| 필수 필드 | 모든 Y 필드 존재 | audio_path 누락 |
| 한글 표기 | 실제 한국어 표기와 일치 | 오탈자, 띄어쓰기 오류 |
| 로마자 | Revised Romanization 일치 | 임의 발음식 표기 |
| 영어 뜻 | 초보자가 이해 가능, 1~5단어 권장 | 너무 긴 설명, 오역 |
| 예문 길이 | 3~6어절 | 너무 긴 문장 |
| 신규 포인트 | 예문당 신규 학습 포인트 1개 이하 | 새 문법/단어가 과다 |
| 난이도 | A0~A1 수준 | 중급 문법 또는 관용구 과다 |
| 문화/안전 | 혐오/성/폭력/정치/종교 논쟁 없음 | 민감 표현 포함 |
| distractor | 정답 1개, 오답 3개, 중복 없음 | 동의어/정답 중복 |
| 오디오 | 파일 존재, 잡음 없음, 단어와 매칭 | 잘못된 파일, 무음 |
| 라이선스 | 상업적 사용 가능성 기록 | provider/voice/license 누락 |

## 6. Distractor 정량 규칙

- 4지선다 기준 정답 1개 + 오답 3개.
- 오답은 정답과 english_gloss가 같거나 사실상 같은 항목을 금지한다.
- 같은 pack/category 후보를 우선한다.
- 같은 품사 또는 같은 의미 범주를 최소 1개 이상 맞춘다.
- 직전 3문제의 정답은 distractor로 재사용하지 않는다.
- 후보가 3개 미만이면 global beginner pool에서 보충한다.
- 그래도 부족하면 객관식 대신 tap-to-reveal recall fallback을 허용한다.

## 7. 예문 규칙

- 3~6어절 이내
- 신규 학습 포인트 1개 이하
- 여행/음식/K-content/일상 상황 중 하나와 연결
- 존댓말 기본
- 비속어, 선정적 표현, 편향 표현 금지
- 영어 번역은 학습자가 상황을 이해할 수 있게 자연스럽게 작성

## 8. 음성 제작 규칙

- MVP는 한국어 Neural TTS 정적 파일을 사용한다.
- 런타임 TTS 호출은 금지한다.
- 단어 음성 2초 이내 권장.
- 예문 음성 5초 이내 권장.
- provider, voice_id, 생성일, 라이선스 조건, content_hash를 기록한다.
- 파일명 예시: audio/words/starter_001_v1.mp3
- 음성 파일 교체 시 content_version 또는 audio asset version을 갱신한다.

## 9. AI 사용 규칙

| 허용 | 금지 |
|---|---|
| 예문 초안 | 무검수 자동 배포 |
| 태그 초안 | 사용자별 실시간 AI 예문 생성 |
| 오답 후보 초안 | 민감 주제 예문 생성 |
| 난이도 후보 | AI 단독 품질 승인 |
| 영어 설명 초안 | AI 생성 사실 은폐 목적의 허위 표시 |

## 10. 콘텐츠 오류 처리

| 단계 | 기준 |
|---|---|
| 접수 | 앱 내 Report content issue 또는 지원 이메일 |
| 분류 | typo/translation/romanization/audio/difficulty/other |
| triage | 영업일 3일 내 확인 목표 |
| 조치 | 수정, 유지, paused, retired, 다음 version 반영 |
| 긴급 | 잘못된 콘텐츠 대량 노출 시 content_manifest rollback 또는 status paused |
| SRS 보호 | word_id 유지, 기존 user_word_states 보존 |

## 11. 버전 및 OTA 정책

- word_id는 불변이다.
- 콘텐츠 변경 시 content_version을 증가시킨다.
- 삭제 대신 status=retired 또는 retired_at을 사용한다.
- 기존 학습자의 SRS 기록은 유지한다.
- published 콘텐츠 상태 변경과 content_manifest 변경은 OTA 허용 범위다.
- SRS 알고리즘, 결제 권한, age gate 변경은 OTA 금지이며 store build가 필요하다.

## 12. 검수 책임 분리

운영 역할은 Content Editor와 Content Reviewer를 논리적으로 분리한다.

확정 결정:

- CC3-07 결정: published 콘텐츠는 작성자와 독립 검수자를 분리하고 외부 한국어 원어민 또는 독립 검수자 pass/fail 검수를 P0로 요구한다. 임시 기준은 1인 운영 시 작성 후 최소 24시간 경과 후 self-review, pass/fail checklist, 10% 샘플 재검수 로그를 요구한다.

## 13. Audit Log 대상

- content status 변경
- published/paused/retired 처리
- audio file 교체
- content_manifest production 반영
- subscription_entitlement 수동 보정이 필요한 콘텐츠 관련 CS 처리
