# dash2zero 개발 인계 패키지

> 문서 상태: v0.3 개발 인계 기준  
> 작성일: 2026-05-07  
> 대상: swarm coding agent 팀  
> 기준 문서: REVIEW_QA.md, SERVICE_REVIEW_QA.md, 02~24 서비스 기획서

---

## 1. 현재 상태

23개 서비스 기획서가 v0.3 개발 인계 기준으로 정리되었다. CC2/B/CC3 리뷰에서 나온 출시 차단급 P0는 문서에 반영되어 있으며, TBD-CC3 마커는 모두 결정 문구로 치환되었다.

남은 미확정은 C-13 사업자/결제 수령 주체와 출시 전 법무/세무 검토다. 해당 항목은 개발 착수는 가능하지만 유료 출시 gate로 남는다.

## 2. SSOT 우선순위

결정 충돌이 생기면 아래 순서로 판단한다.

1. SERVICE_REVIEW_QA.md §8 결정 사항 로그
2. SERVICE_REVIEW_QA.md §4.1 CC2 답변, §4.2 CC3 답변
3. REVIEW_QA.md §5 결정 사항 로그
4. 06_feature_spec.md, 07_erd_db_design.md, 08_api_spec.md
5. 나머지 도메인별 서비스 기획서

문서 간 충돌이 발견되면 임의 구현하지 말고 결정 로그를 먼저 갱신한다.

## 3. 필수 전제

- 앱: React Native + Expo + TypeScript
- Backend/Auth/DB/Storage: Supabase
- 결제: RevenueCat + Apple/Google IAP
- 분석/진단: Firebase Analytics/Crashlytics, opt-in 후 활성화
- 언어: en-US 공식본
- MVP 제외: 음성 녹음, 발화 평가, 사용자용 AI, 광고, 웹 어드민, EU/EEA 출시, 13세 미만 대상 기능

## 4. 남은 출시 Gate

| Gate | 기준 | 차단 범위 |
|---|---|---|
| C-13 | 사업자/결제 수령 주체 D-42 확정 | 유료 출시 차단 |
| 법무/세무 | Terms/Privacy/Payment 최종 검토 | 스토어 제출 차단 가능 |
| Privacy Manifest | iOS build validation 통과 | iOS 제출 차단 |
| RLS | default deny + policy tests 통과 | 개발/출시 차단 |
| 결제 | sandbox purchase/restore/status matrix 통과 | 유료 출시 차단 |
| 콘텐츠 | Starter 60 + MVP 300 구조 QA | 출시 범위 조정 필요 |

## 5. 개발팀 문서 읽기 순서

1. 02_service_prd.md
2. 06_feature_spec.md
3. 07_erd_db_design.md
4. 08_api_spec.md
5. 22_mvp_development_tasks.md
6. 23_deployment_checklist.md
7. 담당 영역별 상세 문서

담당 영역별 상세 문서:

| 영역 | 문서 |
|---|---|
| 학습/콘텐츠 | 03, 04 |
| UX/UI | 05, 10, 11 |
| 분석 | 12 |
| 결제/법무 | 13, 16, 17 |
| 알림/권한/보안 | 14, 15, 18 |
| 운영/QA/ASO | 19, 20, 21, 24 |

## 6. Swarm Agent 권장 분배

| Agent | 담당 범위 | 주요 문서 | 산출물 |
|---|---|---|---|
| Mobile UI | navigation, screens, word flow, settings | 05, 06, 10, 11 | React Native screens/components |
| Learning Core | local SQLite, SRS, daily usage, session state | 03, 06, 07 | SRS engine, local repositories |
| Backend/Data | Supabase schema, RLS, Edge Functions, merge | 07, 08, 15, 18 | migrations, policies, RPC/functions |
| Monetization | RevenueCat, paywall, entitlement, restore | 06, 08, 13, 17 | purchase flow, webhook handling |
| Content Pipeline | CSV validation, TTS assets, content manifest | 03, 04, 07, 19 | import scripts, validation reports |
| Analytics/QA/Release | Firebase, QA cases, deployment checklist | 12, 21, 23, 24 | event instrumentation, test matrix, release runbook |

## 7. 구현 차단 규칙

- age gate 전 원격 분석 수집 금지.
- 13세 미만은 학습/계정/결제/분석 전부 차단.
- 게스트 구매와 Restore Purchases 금지, 로그인 선행.
- RevenueCat appUserID는 Supabase auth.users.id 기준.
- subscription_entitlements는 client read-only, server/webhook write-only.
- service role key와 webhook secret은 앱 번들/repo에 포함 금지.
- OTA로 native, 권한, privacy, age gate, 결제, SRS 핵심 알고리즘 변경 금지.
- published 콘텐츠는 독립 검수자 pass/fail 검수 필요.

## 8. CC3 최종 결정 요약

| ID | 결정 |
|---|---|
| CC3-01 | 무료 샘플 10개는 daily 3과 분리한 preview pool로 운영 |
| CC3-02 | 1인 운영 P0는 영업시간 중심 SLA, 야간/주말은 자동응답 + 다음 확인 가능 시간 triage |
| CC3-03 | Android에도 Sign in with Apple web flow를 보조 로그인 옵션으로 제공 |
| CC3-04 | free content는 public read + rate limit/ETag/pagination/hash, premium은 entitlement + signed URL TTL 6시간 |
| CC3-05 | grace_period 3일, billing_retry without grace는 24시간 임시 유지, expired/refunded/revoked 즉시 Free 강등 |
| CC3-06 | 한국 거주자/한국 소비자법 적용 가능 사용자는 구매 후 7일 내 support email로 청약철회 요청 가능 |
| CC3-07 | published 콘텐츠는 외부 한국어 원어민 또는 독립 검수자 pass/fail 검수를 P0로 요구 |
| CC3-08 | rollout은 5/25/50/100%, crash/ANR/payment/age/data/support 기준 halt + Owner 수동 재개 |

## 9. 개발 착수 Definition of Ready

- v0.3 문서 23개 확인 완료
- SERVICE_REVIEW_QA.md §8 결정 로그 확인 완료
- 로컬/스테이징/프로덕션 환경 분리 계획 확인
- Supabase migration/RLS 테스트부터 시작
- 기능별 작업은 22_mvp_development_tasks.md의 ID를 기준으로 생성
- 구현 중 의사결정 충돌은 새 CC 항목으로 기록

## 10. 인계 결론

제품 구현은 시작 가능하다. 단, 유료 출시와 스토어 제출은 C-13, 법무/세무 검토, Privacy Manifest, 결제 sandbox, RLS 테스트가 닫힌 뒤 진행한다.
