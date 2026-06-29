# 21. QA 테스트 케이스

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-05 | 13세 미만 차단과 13~17세 privacy 회귀 케이스 추가 |
| CC2-08 | 결제 status enum 기반 QA 매트릭스 추가 |
| CC2-17 | OTA 허용/금지 회귀 매트릭스 추가 |
| CC2-18 | opt-in 분석/진단 수집 회귀 추가 |
| B-10 | 보안 사고 대응 체크 추가 |
| OPS 리뷰 | phased rollout halt trigger 잔여 마커 추가 |

## 1. QA 목표

- 신규 사용자가 3분 안에 첫 학습을 완료할 수 있다.
- 13세 미만 사용자는 모든 기능이 차단된다.
- opt-out 사용자의 Analytics/Crashlytics가 수집되지 않는다.
- SRS 복습 큐가 날짜와 정답/오답에 맞게 안정적으로 동작한다.
- 무료/프리미엄 권한이 명확하게 구분된다.
- 결제 복원, 계정 연결, 데이터 병합이 치명적 오류 없이 동작한다.
- OTA 허용/금지 범위가 지켜진다.
- 스토어 제출 전 정책 화면과 권한 설명이 준비되어 있다.

## 2. 테스트 환경

| 구분 | 대상 |
|---|---|
| iOS | 최신 iOS + 직전 주요 버전 |
| Android | 최신 Android + 직전 주요 버전 |
| 기기 | iPhone SE급, 일반 화면, 큰 화면 |
| 네트워크 | 정상, 느림, 오프라인 전환 |
| 계정 | 게스트, Apple, Google, email magic link |
| 결제 | sandbox monthly, sandbox yearly, 취소/만료/환불/복원 |
| 동의 | analytics opt-in, opt-out, diagnostics opt-in/out |
| 연령 | under 13, 13~17, 18+ |

## 3. 출시 차단 기준

| 등급 | 기준 | 출시 여부 |
|---|---|---|
| P0 | 결제 권한 오류, 학습 불가, 계정 데이터 손상, 앱 실행 불가, age gate 실패 | 차단 |
| P1 | 주요 흐름 불안정, 복습 큐 오류, 로그인/복원 실패율 높음 | 원칙적 차단 |
| P2 | 특정 화면 문구/레이아웃 오류, 비핵심 이벤트 누락 | 일정에 따라 허용 가능 |
| P3 | 사소한 카피/디자인 개선 | 허용 가능 |

## 4. P0 테스트: 첫 실행/연령/privacy

| ID | 시나리오 | 기대 결과 |
|---|---|---|
| QA-P0-001 | 앱 최초 실행 | age gate가 가장 먼저 표시 |
| QA-P0-002 | Under 13 선택 | 학습/계정/결제/분석 전부 차단 |
| QA-P0-003 | 13 to 17 선택 | privacy choices 기본 off, high privacy default |
| QA-P0-004 | 18+ 선택 | privacy choices 표시 후 onboarding 가능 |
| QA-P0-005 | Analytics opt-out | Firebase DebugView에 제품 이벤트 없음 |
| QA-P0-006 | Diagnostics opt-out | Crashlytics test crash 수집 안 됨 |
| QA-P0-007 | Settings에서 opt-in 변경 | 이후 이벤트부터 수집 |

## 5. P0 테스트: 첫 학습

| ID | 시나리오 | 기대 결과 |
|---|---|---|
| QA-P0-010 | 게스트로 시작 | 계정 없이 첫 lesson 시작 가능 |
| QA-P0-011 | Notice 단계 | 한글 최상위, romanization 보조 |
| QA-P0-012 | Hear 단계 | 오디오 수동 재생, 실패해도 진행 가능 |
| QA-P0-013 | Meaning 단계 | 영어 뜻과 예문 표시 |
| QA-P0-014 | Retrieve 정답 | 정답 피드백 후 stage 상승 |
| QA-P0-015 | Retrieve 오답 | 오답 피드백, stage -1 규칙 적용 |
| QA-P0-016 | lesson 완료 | completion 화면, streak, 다음 복습 안내 |
| QA-P0-017 | iPhone SE | 텍스트/CTA 겹침 없음 |

## 6. P0 테스트: SRS/daily_usage

| ID | 시나리오 | 기대 결과 |
|---|---|---|
| QA-P0-020 | 정답 처리 | next_stage = min(5, current + 1) |
| QA-P0-021 | 오답 1회 | next_stage = max(1, current - 1) |
| QA-P0-022 | 동일 due cycle 2회 오답 | stage 1 + weak=true |
| QA-P0-023 | Mastered 오답 | stage 4로 하락 |
| QA-P0-024 | 04:00 전후 세션 | local_day/streak 규칙 일관 |
| QA-P0-025 | 무료 신규 3개 도달 | 추가 신규 학습 차단/paywall 안내 |
| QA-P0-026 | 무료 복습 20개 도달 | 추가 복습 차단/paywall 안내 |
| QA-P0-027 | Premium 사용자 | 15 신규 단어, 복습 무제한 |

## 7. P0 테스트: 계정/병합

| ID | 시나리오 | 기대 결과 |
|---|---|---|
| QA-P0-030 | 게스트 학습 후 Apple 연결 | 학습 데이터 병합 |
| QA-P0-031 | 게스트 학습 후 Google 연결 | 학습 데이터 병합 |
| QA-P0-032 | 이메일 매직링크 cold start | 로그인 완료 후 앱 복귀 |
| QA-P0-033 | 같은 merge 요청 2회 | 중복 증가 없음 |
| QA-P0-034 | merge 실패 | 로컬 데이터 보존 및 재시도 가능 |
| QA-P0-035 | 로그아웃 후 재로그인 | 서버 학습 데이터 복원 |

## 8. P0 테스트: 결제 상태 매트릭스

| status | 기대 권한 | QA |
|---|---|---|
| active | Premium | 전체 pack 접근 가능 |
| grace_period | Premium | grace 안내, 접근 유지 |
| billing_retry | TBD | CC3-05 결정: grace_period 3일, billing_retry without grace는 last active 후 24시간 유지, expired/refunded/revoked는 즉시 Free 강등 결정 반영 후 확정 |
| expired | Free | Premium lock, 학습 기록 유지 |
| refunded | Free | Premium lock, 환불 상태 반영 |
| revoked | Free | Premium lock |
| transferred | 재동기화 | user mapping 확인 |
| unknown | 보수적 처리 | 서버 재확인/오류 안내 |

추가 결제 케이스:

| ID | 시나리오 | 기대 결과 |
|---|---|---|
| PAY-QA-001 | 게스트 구매 진입 | 로그인 요구 |
| PAY-QA-002 | 월간 구독 구매 | entitlement active |
| PAY-QA-003 | 연간 구독 구매 | entitlement active |
| PAY-QA-004 | 구매 취소 | Free 유지, 앱 멈춤 없음 |
| PAY-QA-005 | Restore 성공 | entitlement 복원 |
| PAY-QA-006 | Restore 실패 | 계정/스토어 안내 |
| PAY-QA-007 | webhook 중복 수신 | 중복 처리 없음 |

## 9. P0 테스트: RLS/API

| ID | 시나리오 | 기대 결과 |
|---|---|---|
| API-QA-001 | 다른 user profile 읽기 | 403/0 rows |
| API-QA-002 | 다른 user learning_states 읽기 | 403/0 rows |
| API-QA-003 | client entitlement update | 차단 |
| API-QA-004 | anonymous premium pack 접근 | 차단 |
| API-QA-005 | free pack rate limit 초과 | RATE_LIMITED |
| API-QA-006 | attempts batch 중복 event_id | 중복 무시 |
| API-QA-007 | RevenueCat webhook 중복 event_id | 중복 무시 |

## 10. OTA 회귀 매트릭스

| 변경 | 배포 방식 | 기대 결과 |
|---|---|---|
| typo/copy | OTA 허용 | staging 확인 후 production 가능 |
| 스타일 조정 | OTA 허용 | crash/레이아웃 확인 |
| content_manifest | OTA 허용 | version/hash 확인 |
| native module | OTA 금지 | store build 필요 |
| OS 권한 | OTA 금지 | store build 필요 |
| age gate | OTA 금지 | store build 필요 |
| 결제 로직 | OTA 금지 | store build 필요 |
| SRS 알고리즘 | OTA 금지 | store build 필요 |
| Privacy Manifest 영향 | OTA 금지 | store build 필요 |

## 11. 콘텐츠 QA

| 항목 | 검사 기준 |
|---|---|
| Starter Pack | 60개 published |
| MVP Content | 300개 구조 또는 scope 조정 결정 |
| 중복 | korean + meaning 기준 중복 없음 |
| 로마자 | Revised Romanization 일관성 |
| 예문 | 3~6어절, 신규 학습 포인트 1개 이하 |
| 번역 | 자연스러운 영어, 오역 없음 |
| distractor | 정답 1개, 오답 3개, 중복/동의어 충돌 없음 |
| 오디오 | 파일 존재, 재생 가능, 단어와 매칭 |
| 금지 콘텐츠 | 혐오/성적/폭력/정치/종교 논쟁 표현 제외 |

## 12. 접근성/레이아웃 QA

- 터치 타깃 44px 이상
- VoiceOver/TalkBack label
- 정답/오답 색상 외 구분 수단
- iPhone SE 텍스트 겹침 없음
- 동적 글자 크기 120% 확인
- 오디오 버튼 라벨 확인

## 13. Phased Rollout Gate

확정 결정:

- CC3-08 결정: phased rollout은 5/25/50/100% 단계와 crash/ANR/payment/age/data/support halt trigger를 적용한다. 임시 기준은 23_deployment_checklist.md §16을 따른다.

임시 gate:

| 지표 | 임시 기준 |
|---|---|
| crash-free users | 98% 미만이면 halt 검토 |
| 결제 후 Premium 미반영 | 재현 1건이면 halt |
| under-13 차단 실패 | 1건이면 halt |
| 계정 데이터 노출 의심 | 즉시 halt |
| support P0 문의 | 동일 원인 2건 이상이면 halt |

## 14. 출시 전 스모크 체크리스트

- age gate 표시
- privacy opt-out 미수집
- 게스트 첫 lesson 완료
- 복습 1회 완료
- Premium sandbox 구매
- 구매 복원
- 게스트 구매 차단
- 계정 병합
- 계정 삭제 요청
- Privacy/Terms 접근
- RLS 기본 테스트
- OTA 허용/금지 체크
- Crashlytics opt-in 수집 확인
- App Store/Google Play 심사용 안내 준비
