# dash2zero 서비스 기획서 리뷰 — 질의응답 (SERVICE_REVIEW_QA.md)

> 프로젝트: dash2zero
> 문서 유형: 23개 후속 서비스 기획서 통합 리뷰 질의응답
> 시작일: 2026-05-07
> 관리자: 오케스트레이터 (Claude)
> 답변자: PM (사용자)
> 상태: Active — CC3 답변 완료, 23개 서비스 기획서 v0.3 개발 인계 기준 반영 완료
> 선행 문서: `docs/REVIEW_QA.md` (사업계획서 리뷰, 1·2차 라운드 완료)

---

> # [필수] PM 답변 작성 전 반드시 읽으세요 (MUST READ)
>
> **답변을 이 문서에 직접 작성하시는 경우, 아래 A ~ F 규칙을 반드시 따라주세요.**
> 양식이 일관되어야 오케스트레이터가 자동으로 §8 결정 사항 로그에 통합하고
> 후속 작업(코드 구현, 콘텐츠 작성, 약관 확정)에 자동 반영할 수 있습니다.

## A. 답변 작성 양식 (필수)

각 질문 항목의 `- 영향:` 줄 **바로 아래**에 다음 한 줄을 추가합니다.

```
- 답변 (YYYY-MM-DD): 결정 내용 / 사유
```

## B. 상태 토큰 변경 (권장)

답변과 동시에 `[질문중]` → `[답변완료]` (또는 `[재질문]`/`[보류]`).

## C. 답변이 어려운 경우의 표기법

| 상황 | 표기 |
|---|---|
| 아직 결정 못함 | `- 답변 (2026-05-08): 보류 — 베타 결과 후 결정` |
| 다른 결정에 의존 | `- 답변 (2026-05-08): CC2-XX 결정 후 답변` |
| 다른 질문과 동일 | `- 답변 (2026-05-08): Q-XX-DOC-001과 동일` |
| 본인이 모르는 영역 | `- 답변 (2026-05-08): 모름 — 전문가 자문 필요` |
| MVP 후로 미룸 | `- 답변 (2026-05-08): MVP 제외, Phase 3 검토` |

## D. 추천 답변 순서

1. **§4 Cross-cutting 발견 (CC2-01 ~ CC2-25) 먼저** — 25개가 풀리면 §7의 P0 절반 이상이 자동 해결.
2. **§5 출시 차단급 P0 항목** — 법적/심사 리스크 우선.
3. **§7 각 agent 별 P0 질문** — 위 둘에서 다뤄지지 않은 영역별 갭.
4. **마지막으로 P1, P2**.

## E. 답변 예제 (Before → After)

```markdown
#### Q-PP-DOC-002. [답변완료] F-006 SRS 오답 강하 폭과 04:00 미완료 큐 결정성 (P0)
- 발견 문서/위치: docs/06_feature_spec.md §F-006
- 배경: ...
- 질문: ...
- 영향: ...
- 답변 (2026-05-08): 오답 시 stage -1 강하(Mastered → stage 3 강하). 04:00 경계 미완료 큐는 익일로 이월하되 streak 미증가. C2-13 결정 갱신.
```

## F. 답변 작성 완료 후

답변 작성이 모두 끝나면 **"답변 완료"** 라고 알려주세요.

---

> # 위 가이드를 읽으셨다면 아래로 진행하세요.

---

## 1. 검토 라운드 정보

- **선행 라운드 (REVIEW_QA.md)**: 사업계획서 v0.1 1차 + 2차 답변 검증. PM 답변 99% 완료, C-13 보류.
- **본 라운드 (SERVICE_REVIEW_QA.md)**: PM이 작성한 23개 후속 서비스 기획서 통합 검토.
- **검토 인원**: 12 agent (page 2 매핑 참조)
- **검토 방식**: 각 agent에게 책임 영역의 1~4개 문서 할당, REVIEW_QA.md §5 결정 로그와의 일관성 + 2차 라운드 P0-2 갭 처리 + swarm coding 가능성 평가.

---

## 2. 검토 대상 문서 + 담당 Agent 매핑

| # | 문서 | 담당 Agent (PREFIX) |
|---|---|---|
| 02 | service_prd | PP |
| 03 | learning_methodology_curriculum | LD |
| 04 | content_operations_review_guide | LD |
| 05 | wireframes | UX |
| 06 | feature_spec | PP, FE |
| 07 | erd_db_design | AR, BE |
| 08 | api_spec | AR, BE, FE |
| 09 | technical_architecture | AR |
| 10 | design_system | UX |
| 11 | ux_writing_guide | UX |
| 12 | event_taxonomy | DA |
| 13 | payment_policy | PL |
| 14 | notification_policy | FE |
| 15 | permission_policy | BE, SEC |
| 16 | privacy_policy | SEC, PL |
| 17 | terms_of_service | PL |
| 18 | security_data_retention_policy | SEC |
| 19 | admin_planning | PP |
| 20 | customer_support_operations_manual | PM |
| 21 | qa_test_cases | QA |
| 22 | mvp_development_tasks | PM |
| 23 | deployment_checklist | PM, OPS |
| 24 | app_store_aso | PP, OPS |

---

## 3. 종합 통계

| 항목 | 수 |
|---|---:|
| 검토 Agent | 12 |
| 검토 대상 문서 | 23 |
| 총 신규 질문 | 177 |
| P0 질문 | 약 95 |
| P1 질문 | 약 65 |
| P2 질문 | 약 17 |
| Cross-cutting 발견 (CC2) | 25 |
| 출시 차단급 P0 | 약 12 |

### 문서별 평가 요약 (S=충분 / P=부분 / N=불충분)

| 문서 | 평가 | 핵심 이슈 |
|---|---|---|
| 02 PRD | P | C-01~C-20 거시 정책은 일치하나 C2-XX 갭이 §13 "미결정"에서 누락, `<TBD-C-13>` 마커 부재 |
| 03 학습 방법론 | P | Mastered 후 30/60/120일 재노출이 §5에 없는 신규 정책 |
| 04 콘텐츠 운영 | P | AI 검수 5개 항목 모두 정성, distractor 정량 룰 부재 |
| 05 와이어프레임 | P | Notice/Hear/Meaning/Retrieve 4단계 화면 구조 미정, 분석 동의 모달 위치 누락 |
| 06 기능명세 | **N** | F-001~F-010이 단순 bullet, swarm coding 불가 |
| 07 ERD | P | RLS 매트릭스 부재, daily_usage/audit_log/subscription_entitlements 컬럼 표 부재 |
| 08 API | P | 멱등 키, 페이지네이션, signed URL TTL, 에러 스키마 미정의 |
| 09 기술 아키텍처 | P | NFR 무근거, 비용 시나리오 0, 벤더 락인 엑시트 0 |
| 10 디자인 시스템 | P | 영문 폰트 미확정, 8pt 그리드 부재, 다크 모드 토큰 미정 |
| 11 UX Writing | P | 음성 로딩/실패 카피 부재, 단복수/통화 i18n 규칙 없음 |
| 12 이벤트 택소노미 | P | §3과 §6 결제 이벤트 불일치, Firebase 한도 미언급, GA4 예약명 충돌 |
| 13 결제 정책 | P | grace 일수 부재, 가족공유 사전 고지 부재, `<TBD-C-13>` 마커 부재 |
| 14 알림 정책 | P | iOS provisional 권한 미언급, 거부 fallback 빈약 |
| 15 권한 정책 | **N** | 1쪽 미만, 운영자 RBAC/감사로그/MFA 부재 |
| 16 개인정보 처리방침 | P | UK Children's Code/CCPA 미반영, DSAR 채널 미정의, 법적 근거 미매핑 |
| 17 이용약관 | P | §11 준거법 한국법이 1차 출시국과 충돌, AU/NZ 강행규정 면책 충돌 |
| 18 보안/데이터 보존 | P | 침해 통지 72시간 절차 부재, 키 회전 주기 부재, RTO/RPO 부재 |
| 19 운영 어드민 | P | Editor/Reviewer 동일인 운영, 검수 책임 분리 부재 |
| 20 운영 매뉴얼 | P | P0 즉시 SLA 1인 운영자 비현실 |
| 21 QA 테스트 케이스 | P | 13세 차단 회귀 0건, 정량 임계값 0, 결제 9상태 매트릭스 부족 |
| 22 MVP 태스크 분해 | P | 16주 버퍼 0, 콘텐츠 300단어 1태스크 압축, 인-day 추정 부재 |
| 23 배포 체크리스트 | P | OTA 경계 0건, W-8BEN 부재, 키 인수 절차 부재 |
| 24 ASO | P | 키워드 실측 근거 0, 연령 등급 미결정 |

---

## 4. Cross-cutting 발견 (CC2-01 ~ CC2-25)

여러 agent가 동시에 지적한 갭. 이 25개가 풀리면 §7 개별 P0 95개 중 절반 이상이 자동 해결됩니다. **PM이 가장 먼저 답변할 항목**.

| # | 결정 갭 | 지적 Agent | 영향 받는 문서 |
|---|---|---|---|
| **CC2-01** | **`<TBD-C-13>` 마커 즉시 삽입** (3개 문서 grep 0건) | PP, PM, PL | 13, 16, 17, 19 등 사업자 정보 등장 모든 곳 |
| **CC2-02** | **F-001~F-010 기능명세 swarm coding 불가** (입력값/엣지/검증/실패분기/idempotency 부재) | PP, FE | 06 |
| **CC2-03** | **RLS 정책 매트릭스 미작성** (테이블×역할×CRUD 표 0건) | AR, BE, SEC | 07, 15, 18 |
| **CC2-04** | **Privacy Manifest / Required Reason API 미반영** (Apple 2024.5+ 자동 거절 사유) | FE, SEC, OPS | 18, 23 |
| **CC2-05** | **13세 미만 차단 메커니즘 + UK Children's Code 13–17 미처리** | PP, SEC, QA, PL | 16, 17, 21, 24 |
| **CC2-06** | **RevenueCat App User ID ↔ Supabase user_id 매핑 컬럼 부재** | AR, BE | 07, 08 |
| **CC2-07** | **daily_usage 테이블 부재** (무료 일일 3/15 한도 enforce 위치 불명) | BE | 07, 08 |
| **CC2-08** | **subscription_entitlements 컬럼 표 부재** (rc_app_user_id, grace_period, period_end, status enum 등) | AR, BE | 07 |
| **CC2-09** | **Mastered 후 30/60/120일 재노출이 §5 결정 로그에 없는 신규 정책** | LD | 03 |
| **CC2-10** | **Leitner stage 1로 강하의 학습 효과 (과한 페널티 우려)** | LD | 03, 06 |
| **CC2-11** | **AI 검수 5개 항목 모두 정성 — 정량 0/1 기준 부재** | LD | 04 |
| **CC2-12** | **약관 §11 준거법 한국법 ↔ 1차 출시국(US/CA/UK/AU/NZ) 충돌 (출시 차단급)** | PL | 17 |
| **CC2-13** | **AU Consumer Law / NZ CGA / UK CRA 강행규정 vs 약관 §10 면책 충돌** | PL | 17 |
| **CC2-14** | **16주 일정 버퍼 0** (1인 개발자 컨텍스트 스위칭/심사 반려 흡수 여력 없음) | PM | 22 |
| **CC2-15** | **콘텐츠 300단어 + TTS + 검수가 1태스크로 압축** (1태스크 ≤ 3일 원칙 위반) | PM, LD | 22, 04 |
| **CC2-16** | **C-13(사업자) 결정 데드라인이 태스크/체크리스트에 박혀 있지 않음** | PM, PL, OPS | 22, 23, 13, 17 |
| **CC2-17** | **EAS Update OTA 허용/금지 범위 SOP 부재** (Apple §3.3.1 / Guideline 4.7 경계) | PP, AR, FE, OPS, QA | 09, 23, 21 |
| **CC2-18** | **분석 동의 모달 위치/기술 구현 미정** (setAnalyticsCollectionEnabled vs setConsent vs Consent Mode v2) | UX, SEC, DA | 05, 12, 16 |
| **CC2-19** | **ASO 키워드 실측 근거 0** (iTunes Search Ads Popularity, Sensor Tower 등 미수집) | PP, OPS | 24 |
| **CC2-20** | **App Store Connect territory 명시적 EU/EEA 제외 SOP 부재** | PL, OPS | 23 |
| **CC2-21** | **인증서/키스토어 1인 단일 장애점 인수 절차 (Dead man's switch) 부재** | OPS | 23 |
| **CC2-22** | **이벤트 택소노미 §3 핵심 이벤트 표와 §6 결제 퍼널 불일치** (checkout_started 등 5개 이벤트 §3 누락) | DA | 12 |
| **CC2-23** | **Firebase Free 한도 + BigQuery export 비용 시뮬 미언급** | DA | 12 |
| **CC2-24** | **GA4 예약 이벤트명 충돌** (`session_start` vs `app_opened`, `purchase` vs `purchase_succeeded`) | DA | 12 |
| **CC2-25** | **iPhone SE급 카드 + 4단계 학습 루프(Notice/Hear/Meaning/Retrieve) 화면 구조 미정** | UX | 05 |

### 4.1 Cross-cutting 답변 (CC2-01 ~ CC2-25)

#### CC2-01. [답변완료] `<TBD-C-13>` 마커 즉시 삽입
- 영향: 13, 16, 17, 18, 19, 23, 24 및 사업자/운영자/결제 수령 주체가 등장하는 모든 문서
- 답변 (2026-05-07): C-13은 확정 전까지 `<TBD-C-13: 한국 개인사업자 가정>` 마커로 표기한다. 임시 가정은 "한국 개인사업자 + 통신판매업 신고 예정"이며, 신고 완료가 아니라 신고 예정 상태로 둔다. 확정 데드라인은 베타 출시 4주 전, 즉 공개 출시 D-42로 고정한다. 출시 언어와 스토어 표기는 en-US 단독 공식본으로 두고, 한국어 병기본은 내부 참고용 비공식 번역으로만 관리한다. 마커 삽입은 본 문서 답변 통합 후 오케스트레이터가 23개 문서 v0.2 갱신 단계에서 일괄 반영한다.

#### CC2-02. [답변완료] 기능명세 F-001~F-010 구현 가능성 부족
- 영향: 06
- 답변 (2026-05-07): `06_feature_spec.md`는 v0.2에서 전면 보강한다. 각 기능은 user story, trigger, 입력값, 선행조건, 상태 전이, API/DB touchpoint, 실패 분기, idempotency, analytics, acceptance criteria, QA case를 갖는 구현 단위로 재작성한다. F-001~F-010은 swarm coding agent가 추가 판단 없이 작업할 수 있을 때까지 bullet 수준 설명을 허용하지 않는다.

#### CC2-03. [답변완료] RLS 정책 매트릭스 부재
- 영향: 07, 15, 18
- 답변 (2026-05-07): 모든 Supabase 테이블은 default deny + RLS enabled를 기본값으로 한다. v0.2에서 테이블 x 역할(anonymous, authenticated owner, premium owner, support, admin, service_role) x CRUD 매트릭스를 추가한다. 사용자 데이터는 owner-only, 구독 권한은 client read-only/server write-only, 콘텐츠는 published read-only, 운영자 변경은 service_role 경유와 audit_log 필수로 둔다.

#### CC2-04. [답변완료] Privacy Manifest / Required Reason API
- 영향: 18, 23
- 답변 (2026-05-07): iOS 출시 차단 게이트로 `PrivacyInfo.xcprivacy`를 필수 산출물에 포함한다. Expo/RN 및 모든 native SDK가 사용하는 Required Reason API를 빌드 시점에 스캔하고, Apple 승인 사유와 실제 사용 목적이 일치하는 항목만 manifest에 선언한다. fingerprinting 목적 사용은 금지한다. Xcode archive validation 및 App Store Connect 업로드 전 manifest 검증을 배포 체크리스트 P0로 추가한다.

#### CC2-05. [답변완료] 13세 미만 차단 + UK Children's Code
- 영향: 16, 17, 21, 24
- 답변 (2026-05-07): dash2zero는 13세 미만 대상 서비스가 아니다. 첫 실행에서 분석 동의보다 먼저 neutral age gate를 표시하고, 13세 미만 선택 시 계정 생성, 학습 시작, 분석 수집, 결제를 모두 차단한다. 13~17세는 UK Children's Code 대응을 위해 high privacy default, 비필수 분석 opt-in, 마케팅 push 금지, 최소 데이터 수집, 개인정보 설정 접근성 강화로 처리한다. Google Play target audience는 under-13을 포함하지 않고, App Store Kids Category에는 등록하지 않는다.

#### CC2-06. [답변완료] RevenueCat App User ID와 Supabase user_id 매핑
- 영향: 07, 08
- 답변 (2026-05-07): 유료 구매는 인증 사용자만 가능하게 한다. RevenueCat `appUserID`의 기준값은 Supabase `auth.users.id`로 고정한다. 게스트는 무료 학습만 가능하며 paywall 구매 CTA 클릭 시 계정 생성/로그인을 먼저 요구한다. DB에는 `user_id`, `rc_app_user_id`, `rc_original_app_user_id`, `rc_customer_id`, `store`, `environment`를 보관한다.

#### CC2-07. [답변완료] daily_usage 테이블 부재
- 영향: 07, 08
- 답변 (2026-05-07): 일일 한도 enforce의 SSOT는 서버의 `daily_usage` 테이블로 둔다. 최소 컬럼은 `user_id`, `local_day`, `timezone`, `new_words_started_count`, `reviews_completed_count`, `lesson_completed_count`, `paywall_view_count`, `created_at`, `updated_at`이다. day boundary는 사용자 로컬 시간 04:00 기준이며, 게스트 상태에서는 로컬 DB로 동일 규칙을 적용하고 가입 후 서버에 병합한다.

#### CC2-08. [답변완료] subscription_entitlements 컬럼 표 부재
- 영향: 07
- 답변 (2026-05-07): `subscription_entitlements`를 별도 테이블로 두고 RevenueCat webhook의 멱등 처리 기준으로 사용한다. 필수 컬럼은 `id`, `user_id`, `rc_app_user_id`, `rc_original_app_user_id`, `entitlement_id`, `product_id`, `store`, `environment`, `status`, `period_started_at`, `period_ends_at`, `grace_period_ends_at`, `auto_renew_status`, `ownership_type`, `last_rc_event_id`, `last_synced_at`, `created_at`, `updated_at`이다. status enum은 `active`, `grace_period`, `billing_retry`, `expired`, `refunded`, `revoked`, `transferred`, `unknown`으로 둔다.

#### CC2-09. [답변완료] Mastered 후 30/60/120일 재노출 신규 정책
- 영향: 03
- 답변 (2026-05-07): MVP에는 60/120일 재노출 정책을 넣지 않는다. 기존 결정인 Leitner 5단계 1/3/7/14/30일을 유지한다. stage 5는 Mastered로 표시하되 30일 maintenance review만 생성한다. 60/120일 장기 보존 리뷰는 Phase 3 실험 후보로 분리한다.

#### CC2-10. [답변완료] 오답 시 stage 1 강하 과잉 페널티
- 영향: 03, 06
- 답변 (2026-05-07): 오답 시 즉시 stage 1로 초기화하지 않는다. 기본 규칙은 `next_stage = max(1, current_stage - 1)`이다. 단, 같은 due cycle에서 동일 단어를 2회 연속 오답 처리하면 `weak=true`로 표시하고 stage 1로 강등한다. Mastered(stage 5) 오답은 1회 오답 시 stage 4로 내려간다.

#### CC2-11. [답변완료] AI 검수 기준 정량화 부재
- 영향: 04
- 답변 (2026-05-07): AI는 콘텐츠 작성 보조만 수행하고 승인권을 갖지 않는다. v0.2에서 각 콘텐츠 항목에 pass/fail 검수표를 추가한다. 최소 기준은 필수 필드 존재, 한글 표기 정상, Revised Romanization 일치, 영어 gloss 1~5단어, 예문 내 신규 학습 포인트 1개 이하, 금지/민감 표현 없음, distractor 중복/동의어 충돌 없음, 오디오 파일 매칭 정상이다.

#### CC2-12. [답변완료] 약관 준거법 한국법과 1차 출시국 충돌
- 영향: 17
- 답변 (2026-05-07): MVP 약관에서는 소비자에게 배타적 한국 관할을 강제하지 않는다. 운영 주체는 `<TBD-C-13: 한국 개인사업자 가정>`으로 표기하되, 준거법/관할 조항은 "관련 법률이 허용하는 범위에서 대한민국 법을 적용하되, 사용자의 거주지에서 배제할 수 없는 소비자 보호 법률과 관할권은 제한하지 않는다"는 방식으로 수정한다. 최종 문구는 출시 전 법무 검토 대상이다.

#### CC2-13. [답변완료] AU/NZ/UK 강행규정과 면책 충돌
- 영향: 17
- 답변 (2026-05-07): 약관의 책임 제한과 면책은 "법률이 허용하는 최대 범위"로만 적용한다. AU Consumer Law, NZ Consumer Guarantees Act, UK Consumer Rights Act 등 배제 불가능한 보증, 환불, 소비자 권리를 제한하지 않는다는 문구를 약관과 결제 정책에 명시한다.

#### CC2-14. [답변완료] 16주 일정 버퍼 0
- 영향: 22
- 답변 (2026-05-07): v0.2 개발 일정은 16주 고정이 아니라 "16주 구현 baseline + 4주 운영/심사/버퍼"의 20주 계획으로 조정한다. 공개 출시 D-42에 C-13, 스토어 계약, 세금 서류, 결제 수령 주체를 확정하지 못하면 paid release는 자동 보류한다.

#### CC2-15. [답변완료] 콘텐츠 300단어 + TTS + 검수 태스크 과압축
- 영향: 22, 04
- 답변 (2026-05-07): 콘텐츠 작업은 50단어 단위 batch로 분해한다. 각 batch는 draft, AI 보조 초안, human review, TTS 생성/업로드, 앱 import, content QA, rollback manifest 작성으로 나눈다. Starter Pack 60단어는 별도 P0 milestone으로 두고, MVP 전체 300단어는 6개 batch로 추적한다.

#### CC2-16. [답변완료] C-13 사업자 결정 데드라인 태스크 부재
- 영향: 22, 23, 13, 17
- 답변 (2026-05-07): C-13 확정 데드라인은 베타 출시 4주 전, 공개 출시 D-42로 고정한다. D-42까지 한국 개인사업자 등록, 통신판매업 신고 여부, Apple Paid Apps Agreement, Google payments profile, W-8BEN, RevenueCat payout 설정이 완료되지 않으면 유료 구독 기능은 출시 범위에서 제외하거나 출시 자체를 보류한다.

#### CC2-17. [답변완료] EAS Update OTA 경계 SOP 부재
- 영향: 09, 21, 23
- 답변 (2026-05-07): OTA는 copy, 스타일, 비핵심 UI 버그, 콘텐츠 manifest, 원격 설정의 안전한 변경에만 사용한다. native module, 권한, 개인정보 수집 범위, 결제/entitlement 로직, age gate, 로그인, 구독 가격/조건, 핵심 학습 알고리즘 변경은 OTA 금지이며 store review가 필요한 정식 빌드로 배포한다. OTA 배포는 staging 채널 검증, phased rollout, crash threshold 기반 자동 halt 기준을 둔다.

#### CC2-18. [답변완료] 분석 동의 모달 위치/기술 구현 미정
- 영향: 05, 12, 16
- 답변 (2026-05-07): 첫 실행 순서는 age gate -> privacy choices -> onboarding이다. Firebase Analytics와 Crashlytics는 기본 disabled로 시작하고, 사용자가 analytics/diagnostics에 동의한 뒤 활성화한다. 구현은 `setAnalyticsCollectionEnabled(false)` 초기값, 동의 후 true 전환, 광고 관련 consent는 전부 denied로 둔다. 설정 화면에서 언제든 철회 가능해야 한다.

#### CC2-19. [답변완료] ASO 키워드 실측 근거 부재
- 영향: 24
- 답변 (2026-05-07): MVP 제출 전 최소 리서치만 수행한다. Apple Search Ads keyword popularity, Google Play Console 사전 키워드 후보, 경쟁 앱 제목/부제 수동 샘플링을 기록한다. 유료 ASO 도구는 필수 사용하지 않는다. 실측 근거가 없으면 해당 키워드는 "가설"로만 표기하고 확정 키워드로 취급하지 않는다.

#### CC2-20. [답변완료] EU/EEA 제외 SOP 부재
- 영향: 23
- 답변 (2026-05-07): MVP 출시 국가는 US, CA, UK, AU, NZ로 제한한다. App Store Connect와 Google Play Console에서 EU/EEA 국가는 명시적으로 제외하고, 제출 전 territory 설정 스크린샷을 배포 증빙으로 보관한다. EU/EEA 추가 출시는 GDPR/DSA/VAT/소비자권리 검토 후 별도 release gate를 통과해야 한다.

#### CC2-21. [답변완료] 인증서/키스토어 1인 단일 장애점
- 영향: 23
- 답변 (2026-05-07): production 키, keystore, Apple/Google 계정 recovery code, EAS credentials, Supabase/RevenueCat/Firebase owner access는 암호화 vault에 보관한다. 긴급 인수자는 1명 지정하고, sealed recovery 절차를 문서화한다. 분기 1회 접근 복구 테스트를 수행한다. 키와 인증서는 repo, 문서, 채팅에 평문 저장하지 않는다.

#### CC2-22. [답변완료] 이벤트 택소노미 결제 이벤트 불일치
- 영향: 12
- 답변 (2026-05-07): `12_event_taxonomy.md` v0.2에서 §3 핵심 이벤트 표를 SSOT로 둔다. 결제 퍼널 이벤트는 `paywall_viewed`, `plan_selected`, `checkout_started`, `checkout_cancelled`, `subscription_purchase_succeeded`, `subscription_purchase_failed`, `subscription_restore_started`, `subscription_restore_succeeded`, `subscription_restore_failed`, `subscription_status_changed`로 통일한다.

#### CC2-23. [답변완료] Firebase Free 한도 + BigQuery 비용 시뮬 부재
- 영향: 12
- 답변 (2026-05-07): MVP는 BigQuery export를 기본 비활성화한다. Firebase 기본 대시보드와 Crashlytics만 사용하고, BigQuery는 DAU 1,000 이상 또는 분석 질문이 명확해진 뒤 활성화한다. 활성화 전에는 월 비용 상한, billing alert, 이벤트 샘플링/보존 정책을 문서화한다.

#### CC2-24. [답변완료] GA4 예약 이벤트명 충돌
- 영향: 12
- 답변 (2026-05-07): GA4/Firebase 자동 수집/예약 이벤트명은 커스텀 이벤트로 재정의하지 않는다. `session_start`, `first_open`, `app_update`, `in_app_purchase`, `purchase` 등 예약/권장 이벤트와 충돌 가능성이 있는 이름은 denylist로 관리한다. 구독 이벤트는 `subscription_` prefix를 사용한다.

#### CC2-25. [답변완료] iPhone SE + 4단계 학습 루프 화면 구조
- 영향: 05
- 답변 (2026-05-07): lesson word flow는 Notice -> Hear -> Meaning -> Retrieve 4단계로 고정한다. iPhone SE 기준 단일 컬럼, 하단 고정 CTA, scroll 가능한 카드, 오디오 수동 재생 기본값을 적용한다. 한글은 최상위 시각 요소, romanization은 보조, 영어 의미와 예문은 카드 내부 하위 영역으로 둔다. Retrieve 단계는 객관식 또는 tap-to-reveal recall 중 MVP 구현 부담이 낮은 객관식 우선으로 둔다.

## 4.2 Cross-cutting CC3 답변

#### CC3-01. [답변완료] 무료 일일 3 ↔ 월 50팩 샘플 10 충돌
- 답변 (2026-05-07): 신규 Premium pack의 무료 샘플 10개는 일일 신규 3단어 한도와 분리한 preview pool로 운영한다. 무료 사용자는 각 신규 pack당 10개 샘플 단어를 한 번씩 미리 볼 수 있으며, preview 학습은 정규 SRS와 daily new words count에 넣지 않는다. 샘플 단어를 정규 학습/SRS에 편입하려면 Starter Pack 또는 무료 daily 3 범위에 들어가야 한다. 이 방식은 무료 학습 습관을 깨지 않으면서 Premium pack의 가치를 보여주기 위한 결정이다.

#### CC3-02. [답변완료] 1인 운영 P0 SLA 현실화
- 답변 (2026-05-07): 사용자 고지 SLA는 영업일 기준으로 둔다. P0는 평일 업무시간에는 가능한 즉시 triage, 야간/주말/공휴일에는 자동응답 후 다음 확인 가능 시간에 triage한다. 단, 데이터 노출 의심, 결제 권한 대량 오류, 앱 실행 불가처럼 사업/보안 영향이 큰 이벤트는 Owner 모바일 알림을 받도록 한다. 24시간 상시 human monitoring을 약속하지 않는다.

#### CC3-03. [답변완료] Apple Sign In Android 제공 여부
- 답변 (2026-05-07): iOS에는 native Apple Sign In을 필수 제공한다. Android에도 Apple 계정 사용자의 계정 복구와 cross-platform 접근성을 위해 Sign in with Apple web flow를 제공한다. Android 기본 로그인 CTA는 Google과 email magic link를 우선 노출하되, "Continue with Apple"을 보조 로그인 옵션으로 제공한다. 이는 Apple Guideline 4.8의 동등한 privacy-focused login 요구와 플랫폼 간 계정 잠김을 피하기 위한 보수적 결정이다.

#### CC3-04. [답변완료] anon 키 free pack scrape 방어
- 답변 (2026-05-07): Starter Pack 60개 free content는 낮은 마찰을 위해 공개 접근을 허용하되, bulk export는 제공하지 않는다. 방어는 rate limit, ETag/manifest hash, 페이지네이션, content_hash 검증, abuse logging으로 시작한다. Premium content와 premium audio는 authenticated user + entitlement 확인 후 접근하며 signed URL TTL은 6시간으로 둔다. App Check/DeviceCheck는 MVP P0가 아니라 abuse가 관찰되거나 DAU 1,000 이상이 되면 hardening gate로 도입한다.

#### CC3-05. [답변완료] grace period 일수와 강등 시점
- 답변 (2026-05-07): 앱 정책상 grace_period는 3일로 둔다. RevenueCat/스토어가 grace_period 상태와 종료 시각을 제공하면 그 시각까지 Premium을 유지한다. billing_retry 상태지만 grace_period_ends_at이 없으면 마지막 active 확인 시각부터 24시간만 임시 유지하고 이후 Free로 강등한다. expired, refunded, revoked는 즉시 Free로 강등한다. 스토어의 실제 결제 재시도 횟수는 앱이 직접 정의하지 않고 Apple/Google/RevenueCat 상태를 따른다.

#### CC3-06. [답변완료] 한국 거주자 우회 가입 7일 청약철회 창구
- 답변 (2026-05-07): 공식 출시국은 US/CA/UK/AU/NZ로 유지하지만, 한국 사업자 가정이므로 한국 거주자 또는 한국 소비자법 적용 가능 사용자를 위한 직접 접수 창구를 둔다. 구매 후 7일 이내 support email로 청약철회 요청을 접수할 수 있게 하고, 원칙적으로 Apple/Google 환불 절차를 먼저 안내한다. 스토어 절차로 해결되지 않지만 한국법상 환불 의무가 확인되는 경우, C-13 확정 사업자 기준으로 수동 보상/환불 절차를 운영한다. 최종 문구와 예외는 법무 검토 대상이다.

#### CC3-07. [답변완료] Editor/Reviewer 동일인 검수
- 답변 (2026-05-07): published 콘텐츠는 작성자와 검수자를 분리한다. MVP P0 기준으로 Starter Pack 60개와 Premium 300단어는 외부 한국어 원어민 또는 독립 검수자 1명의 pass/fail 검수를 받아야 한다. AI 검증과 24시간 지연 self-review는 보조 수단이며 외부/독립 검수를 대체하지 않는다. 검수자 이름 또는 식별자, 검수일, batch id, 수정 내역을 운영 시트와 audit_log에 남긴다.

#### CC3-08. [답변완료] Phased Rollout halt trigger
- 답변 (2026-05-07): phased rollout은 5% -> 25% -> 50% -> 100% 단계로 진행하고, 자동 halt + Owner 수동 재개 권한을 둔다. halt 조건은 crash-free users 99% 미만, Android ANR 0.5% 초과, 결제 시도 대비 purchase/entitlement 실패율 5% 초과, 결제 성공 후 Premium 미반영 재현 1건, under-13 차단 실패 1건, 계정 데이터 노출 의심 1건, 동일 원인 P0 support 2건 이상이다. 재개는 원인 분석과 수정/rollback 확인 후 Owner가 수동 승인한다.

---

## 5. 출시 차단급 P0 항목 (긴급도 순)

이게 안 풀리면 **법적/심사상 출시가 불가능**하거나 **개발 시작 자체가 불가**합니다.

| 우선 | 항목 | 출시 차단 사유 |
|---|---|---|
| **B-01** | **Privacy Manifest / Required Reason API 미반영** (CC2-04) | iOS 17.4+ 미제출 시 빌드 업로드 자동 거절 |
| **B-02** | **약관 §11 준거법 한국법** (CC2-12) | 1차 출시국 거주자 강행규정 위반, Apple/Google CMA 불공정 약관 거절 |
| **B-03** | **F-001~F-010 swarm coding 불가** (CC2-02) | 기능명세가 구현 가능 단위 아님, 개발 시작 불가 |
| **B-04** | **RLS 매트릭스 부재** (CC2-03) | Supabase RLS 미정의 시 anon 키로 모든 데이터 노출 (보안 사고 1순위) |
| **B-05** | **C-13(사업자) 데드라인 미박힘** (CC2-16) | 사업자 미정 시 W-8BEN, RevenueCat, Apple Paid Apps Agreement, 약관, 결제 정책, 통신판매업 모두 차단 |
| **B-06** | **UK Children's Code 13–17세 미처리** (CC2-05) | UK ICO 매출 4% 또는 £17.5M 과징금 |
| **B-07** | **CCPA "Do Not Sell or Share" 링크 + Notice at Collection 부재** | 캘리포니아 출시 시 CPPA 시정명령 |
| **B-08** | **인증서/키스토어 1인 인수 절차 부재** (CC2-21) | 개발자 사고 시 앱 영구 업데이트 불가 — 사업 자체 종료 |
| **B-09** | **EAS Update OTA 경계 SOP 부재** (CC2-17) | 잘못 사용 시 Apple §3.3.1 위반으로 앱 takedown |
| **B-10** | **GDPR/UK GDPR 72시간 침해 통지 절차 부재** | 사고 발생 시 즉시 위반 |
| **B-11** | **연령 게이트 무결성 (게스트 모드 COPPA)** (CC2-05) | COPPA 1건당 $51,744 과징금 |
| **B-12** | **subscription_entitlements 컬럼 표 + RC App User ID 매핑** (CC2-06, CC2-08) | webhook 구현 불가, 환불/만료 처리 분기 미정 |

### 5.1 출시 차단급 P0 답변 상태

| 항목 | 상태 | 답변 |
|---|---|---|
| B-01 | [답변완료] | CC2-04로 해결. `PrivacyInfo.xcprivacy`와 Required Reason API 검증을 iOS P0 release gate로 둔다. |
| B-02 | [답변완료] | CC2-12로 해결. 배타적 한국 관할을 강제하지 않고, 거주지 강행 소비자 보호권을 제한하지 않는다. |
| B-03 | [답변완료] | CC2-02로 해결. `06_feature_spec.md`를 구현 가능 단위로 전면 보강한다. |
| B-04 | [답변완료] | CC2-03으로 해결. default deny + RLS matrix를 작성한다. |
| B-05 | [답변완료] | CC2-01, CC2-16으로 해결. `<TBD-C-13: 한국 개인사업자 가정>` 마커와 D-42 확정 게이트를 둔다. |
| B-06 | [답변완료] | CC2-05로 해결. 13세 미만 차단, 13~17세 high privacy default를 적용한다. |
| B-07 | [답변완료] | MVP는 광고 SDK, cross-context behavioral advertising, 개인정보 판매/공유를 하지 않는다. 개인정보 처리방침과 앱 내 privacy choices에 "We do not sell or share personal information"을 명시한다. 향후 sell/share 또는 광고 추적이 생기면 출시 전 `Your Privacy Choices` 또는 `Do Not Sell or Share My Personal Information` 링크와 Notice at Collection을 추가하기 전까지 캘리포니아 배포를 중단한다. |
| B-08 | [답변완료] | CC2-21로 해결. production 키/keystore/recovery code의 암호화 vault와 긴급 인수 절차를 둔다. |
| B-09 | [답변완료] | CC2-17로 해결. OTA 허용/금지 범위와 halt 기준을 둔다. |
| B-10 | [답변완료] | 보안 사고 대응 SOP를 추가한다. 개인정보 침해 의심 시 24시간 내 내부 triage, breach log 작성, UK GDPR 기준 통지 필요성이 있으면 인지 후 72시간 내 감독기관 신고, 고위험이면 사용자에게 지체 없이 통지한다. 이 기준은 `18_security_data_retention_policy.md`, `20_customer_support_operations_manual.md`, `23_deployment_checklist.md` v0.2에 반영한다. |
| B-11 | [답변완료] | CC2-05로 해결. age gate에서 13세 미만은 게스트 포함 모든 학습/계정/분석/결제를 차단한다. |
| B-12 | [답변완료] | CC2-06, CC2-08로 해결. 인증 사용자 구매만 허용하고 `subscription_entitlements` 컬럼과 RevenueCat user mapping을 확정한다. |

---

## 6. §5 결정 로그와의 일관성 검증 (요약)

| §5 결정 | 23개 문서 반영 상태 |
|---|---|
| C-01 RN+Expo+TS+EAS | OK (3개 문서 일치) |
| C-02 Supabase | OK |
| C-03 Apple/Google/매직링크 | OK (단 Android Apple Sign In 미언급) |
| C-04 게스트 머지 | 부분 (충돌 해결 알고리즘/idempotency 미정) |
| C-05 한국어 Neural TTS | OK (단 provider/라이선스 미정) |
| C-06 Supabase Storage + 캐시 | 부분 (signed URL TTL/CDN 정책 미정) |
| C-07 무료 60/3/20 vs Premium 300/15/무제한 | OK |
| C-08 Leitner 1/3/7/14/30 | OK (단 강하 폭은 stage 1로 단정) |
| C-09 IAP 무체험/Restore/가족공유 비활성 | 부분 (가족공유 비활성 사전 고지 누락) |
| C-10 5개국 출시 / 13세 차단 | 부분 (UK Children's Code 13–17 미처리) |
| C-11 30일 SLA | 부분 (운영 매뉴얼/체크리스트에 SLA 검증 누락) |
| C-12 Firebase + Crashlytics | 부분 (한도/예약명/동의 흐름 미정) |
| C-13 사업자 보류 | **데드라인 미박힘, 마커 미삽입** |
| C-14 16주 일정 | 부분 (버퍼 0) |
| C-15 콘텐츠 OTA | 부분 (manifest 스키마/diff 미정) |
| C-16 오프라인 캐시만 | OK (단 멀티 디바이스 충돌 미정) |
| C-17 04:00 로컬 리셋 | OK |
| C-18 en-US/Noto Sans KR/RR | 부분 (영문 폰트 미확정, 발음 변화 표기 미정) |
| C-19 매월 50팩 | 부분 (1인 검수 캐파 미증명) |
| C-20 5개국 territory | 부분 (명시적 제외 SOP 부재) |

---

## 7. Agent 별 질의응답

> 양식: ID — [상태] 제목 (우선순위) — 한 줄 요약
> 자세한 발견 위치/배경/영향은 검토 시 agent 결과 산출물 참조

### 7.1 기획자 (PP) — 15건 (PRD/기능명세/어드민/ASO)

- **Q-PP-DOC-001** [질문중] F-005 퀴즈 객관식 distractor 생성·검증 룰 부재 (P0)
- **Q-PP-DOC-002** [질문중] F-006 SRS 오답 강하 폭과 04:00 미완료 큐 결정성 (P0)
- **Q-PP-DOC-003** [질문중] F-003 게스트→가입 머지 충돌 해결 룰 부재 (P0)
- **Q-PP-DOC-004** [질문중] F-008 무료 일일 3 ↔ C-19 월 50팩 샘플 10 충돌 (P0)
- **Q-PP-DOC-005** [질문중] PRD §13 "미결정"에 C2-XX 마커 부재 (P0)
- **Q-PP-DOC-006** [질문중] F-009 결제 실패 grace window·billing retry 정책 부재 (P0)
- **Q-PP-DOC-007** [질문중] 어드민 §11 검수 책임 분리 부재 (Editor/Reviewer 동일인) (P0)
- **Q-PP-DOC-008** [질문중] ASO §9 연령 등급(4+/9+/12+/17+) 결정 부재 (P0)
- **Q-PP-DOC-009** [질문중] PRD §11 분석 이벤트 결제 깔때기/이탈 이벤트 누락 (P1)
- **Q-PP-DOC-010** [질문중] F-007 lesson 중단 partial state 정의 (P1)
- **Q-PP-DOC-011** [질문중] 어드민 §3 콘텐츠 신고 "최소 구현"의 앱 측 사양 부재 (P1)
- **Q-PP-DOC-012** [질문중] ASO §10 스크린샷 6장 vs PRD §9 화면 13개 매칭 (P1)
- **Q-PP-DOC-013** [질문중] PRD §6 P1 "콘텐츠 원격 업데이트"와 EAS Update 경계 (P1)
- **Q-PP-DOC-014** [질문중] PRD §4 비대상 vs ASO §9 포지셔닝 정합성 (P2)
- **Q-PP-DOC-015** [질문중] 어드민 §13 "RLS 정책 분리"만 명시, 매트릭스 부재 (P2)

### 7.2 PM (PM) — 15건 (MVP 태스크/배포/운영 매뉴얼)

- **Q-PM-DOC-001** [질문중] 16주 일정에 버퍼가 어떻게 흡수되었는가 (P0)
- **Q-PM-DOC-002** [질문중] 콘텐츠 300개 제작/검수가 1개 태스크로 압축된 사유 (P0)
- **Q-PM-DOC-003** [질문중] 사업자 등록(C-13) 확정 데드라인 태스크 미박힘 (P0)
- **Q-PM-DOC-004** [질문중] production 키 인수/보관 절차 부재 (P0)
- **Q-PM-DOC-005** [질문중] 1인 운영 P0 "즉시 확인" SLA 비현실성 (P0)
- **Q-PM-DOC-006** [질문중] SRS 강하/Mastered/Weak 전이 규칙 구현 태스크 분리 (P1)
- **Q-PM-DOC-007** [질문중] 베타 테스터 모집 채널/인원/피드백 수집 태스크 부재 (P1)
- **Q-PM-DOC-008** [질문중] 30일 계정 삭제 SLA가 운영 매뉴얼에 미반영 (P1)
- **Q-PM-DOC-009** [질문중] 콘텐츠 신고 → 패치 사이클 정의 누락 (P1)
- **Q-PM-DOC-010** [질문중] 롤백 결정권자/통보 채널/빌드 보관 미정의 (P1)
- **Q-PM-DOC-011** [질문중] swarm coding을 위한 인-day/의존성 메타데이터 부재 (P1)
- **Q-PM-DOC-012** [질문중] 오프라인 캐시 구현 태스크 누락 (P1)
- **Q-PM-DOC-013** [질문중] EU storefront 미출시 차단 태스크 미명시 (P2)
- **Q-PM-DOC-014** [질문중] 스토어 심사 반려 사후 대응 흐름 부재 (P2)
- **Q-PM-DOC-015** [질문중] 1인 운영자의 데이터 백업 주기 미정의 (P2)

### 7.3 디자이너 (UX) — 15건 (와이어/디자인 시스템/UX Writing)

- **Q-UX-DOC-001** [질문중] Notice/Hear/Meaning/Retrieve 4단계 화면 구조 (P0)
- **Q-UX-DOC-002** [질문중] Hear 단계 자동재생 기본값 (P0)
- **Q-UX-DOC-003** [질문중] 분석 동의 모달의 위치와 형태 (P0)
- **Q-UX-DOC-004** [질문중] iPhone SE급 Word Card 레이아웃 명세 (P0)
- **Q-UX-DOC-005** [질문중] 한글-RR-영어 시각 위계 수치 정의 (P0)
- **Q-UX-DOC-006** [질문중] 영문 폰트 확정 (Inter vs 시스템) (P1)
- **Q-UX-DOC-007** [질문중] 간격 스케일과 8pt 그리드 (P1)
- **Q-UX-DOC-008** [질문중] 다크 모드 토큰 구조 (P1)
- **Q-UX-DOC-009** [질문중] 음성 로딩/실패 상태 카피 (P1)
- **Q-UX-DOC-010** [질문중] 숫자/통화/streak 단복수 표기 규칙 (P1)
- **Q-UX-DOC-011** [질문중] 게스트→가입 데이터 머지 화면 (P1)
- **Q-UX-DOC-012** [질문중] 일일 04:00 리셋의 시각적 신호 (P2)
- **Q-UX-DOC-013** [질문중] 13세 연령 확인의 신뢰성 (P2)
- **Q-UX-DOC-014** [질문중] Paywall 가족 공유/체험 비활성 안내 (P2)
- **Q-UX-DOC-015** [질문중] VoiceOver 라벨 작성 규칙 표준화 (P2)

### 7.4 아키텍트 (AR) — 15건 (기술 아키텍처/ERD/API)

- **Q-AR-DOC-001** [질문중] EAS Update OTA 경계 정의 (P0)
- **Q-AR-DOC-002** [질문중] subscription_entitlements 컬럼 표 누락 (P0)
- **Q-AR-DOC-003** [질문중] Storage 버킷 정책과 서명 URL TTL (P0)
- **Q-AR-DOC-004** [질문중] 게스트 머지 재계산 알고리즘 (P0)
- **Q-AR-DOC-005** [질문중] NFR 측정 방법과 SLO/KPI 구분 (P0)
- **Q-AR-DOC-006** [질문중] 인프라 월 비용 추정 시나리오 (P0)
- **Q-AR-DOC-007** [질문중] 벤더 락인 엑시트 플랜 (P1)
- **Q-AR-DOC-008** [질문중] RLS 정책 구체 패턴 (P0)
- **Q-AR-DOC-009** [질문중] 로컬 SQLite 마이그레이션 (P1)
- **Q-AR-DOC-010** [질문중] Edge Functions 책임 분리와 재시도 (P1)
- **Q-AR-DOC-011** [질문중] content_manifest 롤백 시나리오 (P1)
- **Q-AR-DOC-012** [질문중] /content/packs/:pack_id 응답 크기 (P1)
- **Q-AR-DOC-013** [질문중] 일일 04:00 로컬 리셋 구현 (P1)
- **Q-AR-DOC-014** [질문중] 환경 분리 운영 체계 (P2)
- **Q-AR-DOC-015** [질문중] 분석 이벤트 스키마 검증 (P2)

### 7.5 프론트엔드 (FE) — 15건 (기능명세/API/알림)

- **Q-FE-DOC-001** [질문중] iOS Privacy Manifest 및 Required Reason API 미대응 (P0)
- **Q-FE-DOC-002** [질문중] Apple Sign In Android 제공 의무 (P0)
- **Q-FE-DOC-003** [질문중] 오디오 세션 카테고리 및 무음 모드 정책 (P0)
- **Q-FE-DOC-004** [질문중] signed URL TTL과 오프라인 캐시 invalidation (P0)
- **Q-FE-DOC-005** [질문중] IAP를 게스트가 구매 가능한가 (P0)
- **Q-FE-DOC-006** [질문중] 매직링크 Universal Link cold start 핸들링 (P0)
- **Q-FE-DOC-007** [질문중] POST /learning/attempts/batch 페이로드 한계와 멱등 (P0)
- **Q-FE-DOC-008** [질문중] OTA 업데이트 경계와 심사 정책 (P0)
- **Q-FE-DOC-009** [질문중] 알림 권한 거부 fallback 채널 (P1)
- **Q-FE-DOC-010** [질문중] 콘텐츠 manifest 페이지네이션 및 ETag 캐시 (P1)
- **Q-FE-DOC-011** [질문중] 최소 지원 OS 버전 및 강제 업데이트 (P1)
- **Q-FE-DOC-012** [질문중] 조용한 시간 21:00–08:00의 타임존 처리 (P1)
- **Q-FE-DOC-013** [질문중] 게스트 SQLite 스키마 마이그레이션 (P1)
- **Q-FE-DOC-014** [질문중] Restore Purchases 게스트 케이스 (P1)
- **Q-FE-DOC-015** [질문중] i18n 구조 및 한글 폰트 번들 (P2)

### 7.6 백엔드 (BE) — 12건 (ERD/API/권한)

- **Q-BE-DOC-001** [질문중] RLS 정책 매트릭스 부재 (P0)
- **Q-BE-DOC-002** [질문중] 게스트→회원 머지 트랜잭션 명세 (P0)
- **Q-BE-DOC-003** [질문중] daily_usage 카운터 SSOT (P0)
- **Q-BE-DOC-004** [질문중] RevenueCat App User ID 매핑 컬럼 (P0)
- **Q-BE-DOC-005** [질문중] 콘텐츠 manifest JSON Schema 및 diff 배포 (P0)
- **Q-BE-DOC-006** [질문중] content_version × user_word_states 연결 (P0)
- **Q-BE-DOC-007** [질문중] anon 키로 free pack 접근 ↔ scrape 위협 (P0)
- **Q-BE-DOC-008** [질문중] API 에러 응답 표준 및 페이지네이션 (P1)
- **Q-BE-DOC-009** [질문중] webhook 보안 및 재처리 (P1)
- **Q-BE-DOC-010** [질문중] 계정 삭제 ↔ RC alias ↔ 세무 보존 분리 (P1)
- **Q-BE-DOC-011** [질문중] 멀티 디바이스 동시 로그인 충돌 (P1)
- **Q-BE-DOC-012** [질문중] audit_log / 운영자 액션 추적 (P2)

### 7.7 보안/개인정보 (SEC) — 15건 (처리방침/보안/권한)

- **Q-SEC-DOC-001** [질문중] UK Age Appropriate Design Code(15 표준) 적용 범위 (P0)
- **Q-SEC-DOC-002** [질문중] Privacy Manifest 작성 책임 및 SDK별 Required Reason (P0)
- **Q-SEC-DOC-003** [질문중] CCPA/CPRA "Do Not Sell or Share" 링크 + Notice at Collection (P0)
- **Q-SEC-DOC-004** [질문중] GDPR-UK Art.33/34 72시간 침해 통지 절차 (P0)
- **Q-SEC-DOC-005** [질문중] DSAR 접수 채널·검증 절차·컨트롤러 신원 (P0)
- **Q-SEC-DOC-006** [질문중] 수집 데이터별 법적 근거(legal basis) 매핑 (P0)
- **Q-SEC-DOC-007** [질문중] 연령 게이트 무결성 — 입력 방식·재시도 차단 (P0)
- **Q-SEC-DOC-008** [질문중] 운영자/관리자/CS RBAC 및 감사로그 (P0)
- **Q-SEC-DOC-009** [질문중] 암호화 표준·키 회전·백업 RTO/RPO (P1)
- **Q-SEC-DOC-010** [질문중] Firebase Analytics 동의 흐름 첫 실행 분기 구현 (P1)
- **Q-SEC-DOC-011** [질문중] 30일 soft-delete 윈도우 — 복구 가능 여부 (P1)
- **Q-SEC-DOC-012** [질문중] 데이터 내보내기 — 포맷·범위·SLA 명문화 (P1)
- **Q-SEC-DOC-013** [질문중] 제3자 처리자(processor) 명시·국외이전 안전장치 (P1)
- **Q-SEC-DOC-014** [질문중] 콘텐츠 신고 RLS와 신고자 보호 (P2)
- **Q-SEC-DOC-015** [질문중] 푸시 토큰·디바이스 식별자의 사용자 결합 보관 (P2)

### 7.8 QA (QA) — 15건 (QA 테스트 케이스)

- **Q-QA-DOC-001** [질문중] 13세 미만 차단 회귀 테스트 케이스 0건 (P0)
- **Q-QA-DOC-002** [질문중] OTA(EAS Update) 회귀 매트릭스 미정의 (P0)
- **Q-QA-DOC-003** [질문중] 결제 grace/billing retry 분리 케이스 부재 (P0)
- **Q-QA-DOC-004** [질문중] 게스트 머지 idempotency 회귀 부재 (P0)
- **Q-QA-DOC-005** [질문중] 정량 출시 게이트 KPI 부재 (P0)
- **Q-QA-DOC-006** [질문중] 디바이스 매트릭스 추상화 (P1)
- **Q-QA-DOC-007** [질문중] 음성 캐시 무결성 회귀 부재 (P1)
- **Q-QA-DOC-008** [질문중] 접근성 매트릭스 부족 (P1)
- **Q-QA-DOC-009** [질문중] 시간대/시계 조작 회귀 부재 (P1)
- **Q-QA-DOC-010** [질문중] 자동 테스트 커버리지 목표 없음 (P1)
- **Q-QA-DOC-011** [질문중] 가족 공유 차단 회귀 부재 (P1)
- **Q-QA-DOC-012** [질문중] 적대적/부정 시나리오 부재 (P2)
- **Q-QA-DOC-013** [질문중] 콘텐츠 신고 후 운영 회귀 부재 (P2)
- **Q-QA-DOC-014** [질문중] Analytics/Crashlytics 회귀 케이스 표면적 (P2)
- **Q-QA-DOC-015** [질문중] 베타 테스트 → 정식 출시 전이 게이트 없음 (P2)

### 7.9 학습설계 (LD) — 15건 (학습 방법론/콘텐츠 운영)

- **Q-LD-DOC-001** [질문중] Mastered 이후 30/60/120일 재노출 정책이 §5에 없음 (P0)
- **Q-LD-DOC-002** [질문중] Leitner 오답 시 stage 1로 강하의 학습 효과 (P0)
- **Q-LD-DOC-003** [질문중] AI 검수 5개 항목의 정량 0/1 기준 부재 (P0)
- **Q-LD-DOC-004** [질문중] 1인 검수 캐파 vs 매월 50팩 + 7일 오류 SLA (P0)
- **Q-LD-DOC-005** [질문중] Distractor 선정의 정량 규칙 부재 (P0)
- **Q-LD-DOC-006** [질문중] 한글 자모 선행 코스 미제공의 A0 학습 곡선 위험 (P0)
- **Q-LD-DOC-007** [질문중] 연음/받침 발음 변화 시 RR 표기 기준 (P0)
- **Q-LD-DOC-008** [질문중] 조사/패턴이 60/300 단어 카운트에 포함되는지 (P1)
- **Q-LD-DOC-009** [질문중] 무료 60단어 한도 도달 후 사용자 동선 (P0)
- **Q-LD-DOC-010** [질문중] 한 단어 다의어/다품사 분해 정책 (P1)
- **Q-LD-DOC-011** [질문중] 예문당 신규 학습 포인트 1개 원칙의 검증 방법 (P1)
- **Q-LD-DOC-012** [질문중] TTS provider/voice의 일관성과 라이선스 추적 (P1)
- **Q-LD-DOC-013** [질문중] 콘텐츠 오류 신고-수정 사이의 학습자 SRS 보호 (P1)
- **Q-LD-DOC-014** [질문중] 일일 학습 루프 6단계의 시간 설계 (P2)
- **Q-LD-DOC-015** [질문중] CEFR/TOPIK 직접 매핑 회피의 마케팅 영향 (P2)

### 7.10 데이터/분석 (DA) — 15건 (이벤트 택소노미)

- **Q-DA-DOC-001** [질문중] §3과 §6 결제 이벤트 정의 정합성 (P0)
- **Q-DA-DOC-002** [질문중] Firebase 무료 한도 및 BigQuery export 정책 (P0)
- **Q-DA-DOC-003** [질문중] 게스트→가입 머지(identify/alias) 구현 (P0)
- **Q-DA-DOC-004** [질문중] RevenueCat ↔ Firebase 결제 이벤트 파이프라인 (P0)
- **Q-DA-DOC-005** [질문중] 동의 게이팅 기술 구현 (setAnalyticsCollectionEnabled / setConsent / Consent Mode v2) (P0)
- **Q-DA-DOC-006** [질문중] GA4/Firebase 예약명 충돌 회피 (P0)
- **Q-DA-DOC-007** [질문중] Mastered/Weak 측정 이벤트 부재 (P0)
- **Q-DA-DOC-008** [질문중] lesson duration 계산 규칙 (P1)
- **Q-DA-DOC-009** [질문중] 속성 카디널리티와 Firebase 한도 (P1)
- **Q-DA-DOC-010** [질문중] D1/D7 리텐션 정확 정의와 timezone (P1)
- **Q-DA-DOC-011** [질문중] 클라이언트 vs 서버 이벤트 무결성 (P1)
- **Q-DA-DOC-012** [질문중] paywall_viewed/plan_selected source 분류 enum (P1)
- **Q-DA-DOC-013** [질문중] Crashlytics와 Analytics 사용자 매핑 (P2)
- **Q-DA-DOC-014** [질문중] A/B 테스트 인프라 부재 (P2)
- **Q-DA-DOC-015** [질문중] 사용자 속성(user property) 설계 명시 (P2)

### 7.11 결제/법무 (PL) — 15건 (결제 정책/약관/처리방침)

- **Q-PL-DOC-001** [질문중] 약관 §11 준거법·관할의 1차 출시국 적합성 (P0, **출시 차단급**)
- **Q-PL-DOC-002** [질문중] AU Consumer Guarantees·NZ CGA·UK CRA 강행규정 vs 약관 §10 면책 충돌 (P0)
- **Q-PL-DOC-003** [질문중] UK Children's Code 13–17세 대응 (P0)
- **Q-PL-DOC-004** [질문중] grace period 일수·재시도 횟수·강등 시점 명시 (P0)
- **Q-PL-DOC-005** [질문중] 자동 갱신 24시간 전 알림 카피·채널 (P0)
- **Q-PL-DOC-006** [질문중] 가족 공유 비활성 사전 고지 위치 (P1)
- **Q-PL-DOC-007** [질문중] App Store Connect territory EU/EEA 제외 SOP 문서화 (P0)
- **Q-PL-DOC-008** [질문중] C-13 보류 동안 `<TBD-C-13>` 마커 즉시 삽입 (P0)
- **Q-PL-DOC-009** [질문중] 한국 거주자 우회 가입 7일 청약철회 운영 창구 (P0)
- **Q-PL-DOC-010** [질문중] 처리방침에 학습 데이터의 AI 학습·재사용 정책 명시 (P1)
- **Q-PL-DOC-011** [질문중] 환불 SLA 3영업일의 1인 운영 실현성 (P1)
- **Q-PL-DOC-012** [질문중] 가격 변경 시 기존 구독자 동의·고지 절차 구체화 (P1)
- **Q-PL-DOC-013** [질문중] 게스트 모드 데이터의 가입 시 머지 동의 흐름 (P1)
- **Q-PL-DOC-014** [질문중] 처리방침 §7 국외 이전 구체적 처리자·국가 명시 (P1)
- **Q-PL-DOC-015** [질문중] 약관 §12 영문 우선과 한국어본 병기 정책 충돌 (P2)

### 7.12 DevOps/배포 (OPS) — 15건 (배포 체크리스트/ASO)

- **Q-OPS-DOC-001** [질문중] EAS Update OTA 허용 범위·금지 범위 SOP (P0)
- **Q-OPS-DOC-002** [질문중] C-13 결제 수취 주체 데드라인 명시 (P0)
- **Q-OPS-DOC-003** [질문중] W-8BEN-E·Paid Apps Agreement 체크리스트 추가 (P0)
- **Q-OPS-DOC-004** [질문중] 인증서·키스토어 1인 인수 절차(Dead man's switch) (P0)
- **Q-OPS-DOC-005** [질문중] App Store Connect territory 명시적 제외 SOP (P0)
- **Q-OPS-DOC-006** [질문중] Privacy Manifest·Required Reason API 검증 (P0)
- **Q-OPS-DOC-007** [질문중] Phased Rollout 자동 Halt 트리거 (P1)
- **Q-OPS-DOC-008** [질문중] ASO 키워드 실측 근거 (iTunes Search Ads Popularity 등) (P1)
- **Q-OPS-DOC-009** [질문중] 5개국별 가격·세금·로컬라이제이션 (P1)
- **Q-OPS-DOC-010** [질문중] 스크린샷 디바이스 스펙·로컬라이제이션 범위 (P1)
- **Q-OPS-DOC-011** [질문중] RevenueCat sandbox→production 전환 검증 윈도우 (P1)
- **Q-OPS-DOC-012** [질문중] 환경별 번들 ID/아이콘/스킴 분리 (P1)
- **Q-OPS-DOC-013** [질문중] 모니터링 임계값과 알림 채널 (P1)
- **Q-OPS-DOC-014** [질문중] Hotfix SLA·강제 업데이트 게이트 (P2)
- **Q-OPS-DOC-015** [질문중] 심사용 데모 계정·게스트 안내 명세 (P2)

---

## 8. 결정 사항 로그

> PM 답변으로 합의된 사항을 영속적으로 기록. 후속 작업의 기준.

| 일자 | 영역 | 결정 사항 | 근거 질문 ID | 영향 받는 문서 |
|---|---|---|---|---|
| 2026-05-07 | C-13/사업자 | 확정 전까지 `<TBD-C-13: 한국 개인사업자 가정>` 마커 사용. 임시 가정은 한국 개인사업자 + 통신판매업 신고 예정. 확정 데드라인은 베타 출시 4주 전/공개 출시 D-42. 공식 약관/스토어 언어는 en-US 단독. | CC2-01, CC2-16 | 13, 16, 17, 18, 19, 23, 24 |
| 2026-05-07 | 기능명세 | `06_feature_spec.md`는 F-001~F-010을 user story, trigger, 입력값, 상태 전이, 실패 분기, idempotency, analytics, acceptance criteria, QA case 단위로 전면 보강한다. | CC2-02 | 06 |
| 2026-05-07 | 보안/RLS | Supabase는 default deny + RLS enabled. 사용자 데이터 owner-only, 구독은 client read-only/server write-only, 운영 변경은 service_role + audit_log 필수. | CC2-03 | 07, 15, 18 |
| 2026-05-07 | iOS 심사 | `PrivacyInfo.xcprivacy`와 Required Reason API 선언을 iOS P0 release gate로 둔다. 실제 SDK 스캔 결과와 Apple 승인 사유가 일치해야 한다. | CC2-04 | 18, 23 |
| 2026-05-07 | 연령/아동 | 13세 미만은 first-run age gate에서 차단. 13~17세는 high privacy default, 비필수 분석 opt-in, 마케팅 push 금지로 처리한다. Kids Category/under-13 target audience는 사용하지 않는다. | CC2-05 | 16, 17, 21, 24 |
| 2026-05-07 | 결제/권한 | 유료 구매는 인증 사용자만 가능. RevenueCat `appUserID`는 Supabase `auth.users.id` 기준. 게스트는 무료 학습만 허용하고 구매 전 로그인/가입을 요구한다. | CC2-06, CC2-08 | 07, 08, 13 |
| 2026-05-07 | 일일 한도 | `daily_usage` 테이블을 서버 SSOT로 사용하고 local day는 04:00 기준으로 계산한다. 게스트는 로컬 저장 후 가입 시 병합한다. | CC2-07 | 07, 08 |
| 2026-05-07 | SRS | MVP는 Leitner 1/3/7/14/30일만 사용. 60/120일 장기 리뷰는 Phase 3 실험 후보. 오답은 기본 stage -1, 동일 due cycle 2회 연속 오답 시 stage 1 + weak 처리. | CC2-09, CC2-10 | 03, 06 |
| 2026-05-07 | 콘텐츠 운영 | 콘텐츠는 50단어 batch로 분해하고 AI 검수는 승인권 없는 pass/fail 보조 검수로 제한한다. Starter Pack 60단어는 별도 P0 milestone. | CC2-11, CC2-15 | 04, 22 |
| 2026-05-07 | 약관/소비자권리 | 배타적 한국 관할 강제 금지. 대한민국 법 적용은 법률이 허용하는 범위로 제한하고, US/CA/UK/AU/NZ의 배제 불가능한 소비자 보호 권리를 제한하지 않는다. | CC2-12, CC2-13 | 17 |
| 2026-05-07 | 일정 | 개발 계획은 16주 구현 baseline + 4주 운영/심사/버퍼의 20주 계획으로 조정한다. | CC2-14 | 22 |
| 2026-05-07 | OTA 배포 | EAS Update OTA는 copy/style/비핵심 UI/content manifest/원격 설정에만 허용. native, 권한, 개인정보, 결제, age gate, 로그인, 핵심 알고리즘 변경은 store build로만 배포한다. | CC2-17 | 09, 21, 23 |
| 2026-05-07 | 분석 동의 | 첫 실행 순서는 age gate -> privacy choices -> onboarding. Analytics/Crashlytics는 default disabled, opt-in 후 활성화, 설정에서 철회 가능. | CC2-18 | 05, 12, 16 |
| 2026-05-07 | ASO/출시국 | ASO 키워드는 최소 실측 근거를 수집하되, 근거 없는 항목은 가설로 표기. MVP territory는 US/CA/UK/AU/NZ만 열고 EU/EEA는 명시 제외한다. | CC2-19, CC2-20 | 23, 24 |
| 2026-05-07 | 운영 연속성 | production 키/keystore/recovery code/EAS credentials는 암호화 vault에 보관하고 긴급 인수자 1명과 sealed recovery 절차를 둔다. | CC2-21 | 23 |
| 2026-05-07 | 분석 이벤트 | §3 핵심 이벤트 표를 SSOT로 두고 결제 퍼널 이벤트를 통일한다. GA4 예약/자동 이벤트명은 커스텀 이벤트로 재정의하지 않는다. MVP BigQuery export는 기본 비활성화한다. | CC2-22, CC2-23, CC2-24 | 12 |
| 2026-05-07 | 학습 UX | lesson word flow는 Notice -> Hear -> Meaning -> Retrieve 4단계로 고정. iPhone SE는 단일 컬럼, 하단 고정 CTA, scroll 카드, 오디오 수동 재생 기본값을 사용한다. | CC2-25 | 05 |
| 2026-05-07 | CCPA/CPRA | MVP는 개인정보 판매/공유와 광고 추적을 하지 않는다. 정책에 "Do not sell or share"를 명시하고, 향후 sell/share 또는 광고 추적이 생기면 캘리포니아 배포 전 privacy choices 링크와 Notice at Collection을 추가한다. | B-07 | 16, 23 |
| 2026-05-07 | 침해 통지 | 개인정보 침해 의심 시 24시간 내 내부 triage와 breach log를 시작한다. UK GDPR 기준 통지 필요성이 있으면 인지 후 72시간 내 감독기관 신고, 고위험이면 사용자에게 지체 없이 통지한다. | B-10 | 18, 20, 23 |
| 2026-05-07 | Free preview | 신규 Premium pack의 무료 샘플 10개는 daily 3과 분리한 preview pool로 운영한다. preview는 정규 SRS와 daily_usage new words count에 포함하지 않는다. | CC3-01 | 02, 03, 06 |
| 2026-05-07 | 운영 SLA | 1인 운영은 24시간 human SLA를 약속하지 않는다. P0는 평일 업무시간 즉시 triage, 야간/주말은 자동응답 후 다음 확인 가능 시간 triage이며, 보안/결제/앱 실행 P0는 Owner 모바일 알림을 둔다. | CC3-02 | 20, 22 |
| 2026-05-07 | Apple 로그인 | iOS native Apple Sign In 필수. Android에도 Apple 계정 사용자의 복구와 cross-platform 접근성을 위해 Sign in with Apple web flow를 보조 옵션으로 제공한다. | CC3-03 | 06, 08, 22, 24 |
| 2026-05-07 | 콘텐츠 scrape 방어 | Starter Pack free content는 public read + rate limit/ETag/pagination/hash/abuse logging으로 보호한다. Premium content/audio는 authenticated entitlement + signed URL TTL 6시간. App Check/DeviceCheck는 abuse 또는 DAU 1,000 이상 hardening gate. | CC3-04 | 07, 08, 18, 23 |
| 2026-05-07 | Grace/Billing | grace_period는 3일. billing_retry에 grace 종료 시각이 없으면 마지막 active 확인 후 24시간만 임시 유지. expired/refunded/revoked는 즉시 Free 강등. 재시도 횟수는 Apple/Google/RevenueCat 상태를 따른다. | CC3-05 | 06, 13, 17, 21, 22, 23 |
| 2026-05-07 | 한국 청약철회 | 한국 거주자 또는 한국 소비자법 적용 가능 사용자는 구매 후 7일 내 support email로 청약철회 요청 가능. 스토어 환불 절차 우선, 법적 의무가 확인되면 C-13 사업자 기준 수동 보상/환불 절차를 운영한다. | CC3-06 | 13, 17, 23 |
| 2026-05-07 | 콘텐츠 검수 | published 콘텐츠는 작성자와 검수자를 분리한다. Starter Pack 60개와 Premium 300단어는 외부 한국어 원어민 또는 독립 검수자 1명의 pass/fail 검수를 P0로 요구한다. | CC3-07 | 04, 15, 19, 22, 23 |
| 2026-05-07 | Rollout halt | phased rollout은 5%->25%->50%->100%. crash-free users 99% 미만, ANR 0.5% 초과, 결제 실패율 5% 초과, Premium 미반영/under-13 실패/데이터 노출 의심 등에서 halt하고 Owner가 수동 재개한다. | CC3-08 | 21, 23 |

---

## 9. 다음 단계 권고

### 완료된 단계

- CC2-01 ~ CC2-25 답변 완료
- 출시 차단급 B-01 ~ B-12 답변 완료
- §8 결정 사항 로그 갱신 완료
- CC3-01 ~ CC3-08 답변 완료
- 23개 서비스 기획서 v0.3 개발 인계 기준 반영 완료

### 다음 단계

1. C-13 사업자/결제 수령 주체를 D-42 전 확정한다.
2. 출시 전 법무/세무 검토를 진행한다.
3. 개발 착수용 인계 패키지를 기준으로 swarm coding agent를 구성한다.
4. 개발 중 정책 변경이 생기면 본 문서 §8 결정 로그를 먼저 갱신한 뒤 각 서비스 기획서를 수정한다.

> 권고: 다음 작업은 개발 착수용 인계 패키지 검토와 swarm coding agent 구성이다. `v0.3`은 개발 인계 기준이며, `v1.0`은 C-13/법무/베타 직전 검토가 닫힌 뒤 봉인한다.

---

## 11. §7 개별 질문 자동 해결 매핑 (2026-05-07 추가)

CC2-01 ~ CC2-25 + B-07/B-10 답변으로 §7 개별 질문 중 자동 해결되는 항목 매핑.
v0.2 문서 갱신 시 해당 결정에 따라 작성하면 됨. 매핑된 질문은 v0.2 반영 후 `[답변완료]`로 일괄 정리.

| §7 질문 ID | 자동 해결 근거 | 비고 |
|---|---|---|
| Q-PP-DOC-001 (distractor 룰) | CC2-11 + Q-LD-DOC-005 | v0.2에서 정량 게이트 명시 |
| Q-PP-DOC-002 (SRS 강하/04:00 큐) | CC2-10 + CC2-07 | 강하 룰 확정, 04:00 큐는 daily_usage |
| Q-PP-DOC-003 (게스트 머지 룰) | CC2-06 + CC2-07 | 머지는 Edge Function/대기 — 잔여 (트랜잭션 SQL 정의 필요) |
| Q-PP-DOC-004 (무료 일일 3 ↔ 신규 팩 샘플) | (잔여) | CC2 미해결 — v0.2 또는 추가 답변 필요 |
| Q-PP-DOC-005 (PRD §13 마커) | CC2-01 | `<TBD-C-13>` 마커 일괄 삽입 |
| Q-PP-DOC-006 (결제 grace) | CC2-08 (status=billing_retry, grace_period_ends_at) | v0.2 결제 정책에 일수 명시 필요 |
| Q-PP-DOC-007 (어드민 검수 분리) | CC2-15 (50단어 batch) | 동일인 검수 우려 잔여 — Editor/Reviewer 별도 자료 필요 |
| Q-PP-DOC-008 (ASO 연령 등급) | CC2-05 | Kids Category/under-13 미사용 |
| Q-PP-DOC-013 (콘텐츠 OTA) | CC2-17 | 콘텐츠 manifest는 OTA 허용 |
| Q-PP-DOC-015 (RLS 매트릭스) | CC2-03 | 자동 해결 |
| Q-PM-DOC-001 (16주 버퍼) | CC2-14 (20주) | 자동 해결 |
| Q-PM-DOC-002 (콘텐츠 1태스크) | CC2-15 (50단어 batch × 6) | 자동 해결 |
| Q-PM-DOC-003 (사업자 데드라인) | CC2-16 (D-42) | 자동 해결 |
| Q-PM-DOC-004 (production 키 보관) | CC2-21 | 자동 해결 |
| Q-PM-DOC-006 (SRS 전이 태스크) | CC2-10 | v0.2 22번 태스크에 분리 |
| Q-UX-DOC-001 (4단계 화면 구조) | CC2-25 | 자동 해결 |
| Q-UX-DOC-002 (Hear 자동재생) | CC2-25 (수동 재생 기본) | 자동 해결 |
| Q-UX-DOC-003 (분석 동의 모달 위치) | CC2-18 (age gate → privacy → onboarding) | 자동 해결 |
| Q-UX-DOC-004 (SE급 카드 레이아웃) | CC2-25 (단일 컬럼/하단 고정 CTA) | 자동 해결 |
| Q-UX-DOC-005 (한글-RR-영어 위계) | CC2-25 (한글 최상위, romanization 보조) | 자동 해결 |
| Q-UX-DOC-013 (13세 연령 신뢰성) | CC2-05 (neutral age gate) | 자동 해결 |
| Q-AR-DOC-001 (OTA 경계) | CC2-17 | 자동 해결 |
| Q-AR-DOC-002 (subscription_entitlements 컬럼) | CC2-08 | 자동 해결 |
| Q-AR-DOC-008 (RLS 구체 패턴) | CC2-03 | 자동 해결 |
| Q-AR-DOC-013 (04:00 리셋 구현) | CC2-07 | 자동 해결 |
| Q-FE-DOC-001 (Privacy Manifest) | CC2-04 | 자동 해결 |
| Q-FE-DOC-005 (게스트 IAP 차단) | CC2-06 (인증 사용자만 결제) | 자동 해결 |
| Q-FE-DOC-008 (OTA 심사 정책) | CC2-17 | 자동 해결 |
| Q-FE-DOC-014 (Restore 게스트) | CC2-06 (Restore도 로그인 후) | 자동 해결 |
| Q-BE-DOC-001 (RLS 매트릭스) | CC2-03 | 자동 해결 |
| Q-BE-DOC-003 (daily_usage SSOT) | CC2-07 | 자동 해결 |
| Q-BE-DOC-004 (RC App User ID 매핑) | CC2-06 + CC2-08 | 자동 해결 |
| Q-SEC-DOC-001 (UK Children's Code) | CC2-05 | 자동 해결 |
| Q-SEC-DOC-002 (Privacy Manifest) | CC2-04 | 자동 해결 |
| Q-SEC-DOC-003 (CCPA Do Not Sell) | B-07 | 자동 해결 |
| Q-SEC-DOC-004 (72시간 침해 통지) | B-10 | 자동 해결 |
| Q-SEC-DOC-007 (연령 게이트 무결성) | CC2-05 | 자동 해결 |
| Q-SEC-DOC-010 (분석 동의 흐름) | CC2-18 | 자동 해결 |
| Q-QA-DOC-001 (13세 차단 회귀) | CC2-05 | v0.2 21 QA에 회귀 케이스 추가 |
| Q-QA-DOC-002 (OTA 회귀 매트릭스) | CC2-17 | v0.2 21 QA에 추가 |
| Q-QA-DOC-003 (결제 grace 매트릭스) | CC2-08 status enum | v0.2 21 QA에 추가 |
| Q-LD-DOC-001 (30/60/120일 재노출) | CC2-09 (MVP 제외) | 자동 해결 |
| Q-LD-DOC-002 (Leitner stage 1 강하) | CC2-10 | 자동 해결 |
| Q-LD-DOC-003 (AI 검수 정량) | CC2-11 | 자동 해결 |
| Q-LD-DOC-004 (1인 검수 캐파) | CC2-15 (50단어 batch) | 자동 해결 |
| Q-LD-DOC-005 (Distractor 정량) | CC2-11 | 자동 해결 |
| Q-DA-DOC-001 (§3과 §6 결제 통일) | CC2-22 | 자동 해결 |
| Q-DA-DOC-002 (Firebase 한도/BigQuery) | CC2-23 | 자동 해결 |
| Q-DA-DOC-003 (게스트→가입 머지) | CC2-06 (인증 후 user_id 단일화) | 자동 해결 |
| Q-DA-DOC-004 (RC ↔ Firebase 파이프라인) | CC2-23 (BigQuery 비활성), CC2-08 (서버 webhook 신뢰) | 자동 해결 |
| Q-DA-DOC-005 (동의 게이팅 구현) | CC2-18 | 자동 해결 |
| Q-DA-DOC-006 (GA4 예약명) | CC2-24 | 자동 해결 |
| Q-PL-DOC-001 (약관 §11 준거법) | CC2-12 | 자동 해결 |
| Q-PL-DOC-002 (AU/NZ 강행규정) | CC2-13 | 자동 해결 |
| Q-PL-DOC-003 (UK Children's) | CC2-05 | 자동 해결 |
| Q-PL-DOC-007 (territory EU 제외) | CC2-20 | 자동 해결 |
| Q-PL-DOC-008 (TBD-C-13 마커) | CC2-01 | 자동 해결 |
| Q-OPS-DOC-001 (OTA 경계 SOP) | CC2-17 | 자동 해결 |
| Q-OPS-DOC-002 (C-13 데드라인) | CC2-16 | 자동 해결 |
| Q-OPS-DOC-003 (W-8BEN/Paid Apps) | CC2-16 (D-42에 포함) | 자동 해결 |
| Q-OPS-DOC-004 (키 인수 절차) | CC2-21 | 자동 해결 |
| Q-OPS-DOC-005 (territory 명시 제외) | CC2-20 | 자동 해결 |
| Q-OPS-DOC-006 (Privacy Manifest 검증) | CC2-04 | 자동 해결 |
| Q-OPS-DOC-008 (ASO 키워드 실측) | CC2-19 (가설로 표기) | 자동 해결 |

### 11.1 자동 해결 통계

| 구분 | 수 |
|---|---:|
| §7 총 질문 | 177 |
| CC2/B로 자동 해결 | **약 60개** |
| 잔여 질문 (v0.2 갱신 시 해결 또는 추가 답변 필요) | **약 117개** |

### 11.2 잔여 질문의 처리 권고

잔여 질문 약 117개는 대부분 **세부 명세** 또는 **문서별 보강** 항목으로, 다음 둘 중 하나로 자연 해결됨:

1. **v0.2 갱신 시 자연 해소**: 디자인 토큰, 카피 규칙, 컴포넌트 변형, 에러 응답 표준 등
2. **v0.2 갱신 후 잔여 식별**: PM이 v0.2 작성 시 추가 결정이 필요한 항목 발견 시 별도 라운드

P0 잔여 중 CC2 자동 해결 안 되는 핵심 항목:

- Q-PP-DOC-004 (무료 일일 3 ↔ 신규 팩 샘플 10 충돌) — 추가 답변 필요
- Q-PM-DOC-005 (1인 운영 P0 SLA 비현실) — 추가 답변 필요
- Q-AR-DOC-005 (NFR 측정 방법/SLO 구분) — v0.2 09에서 보강
- Q-AR-DOC-006 (인프라 비용 시나리오) — v0.2 09에서 보강
- Q-FE-DOC-002 (Apple Sign In Android) — 추가 답변 필요 (심사 5.4.8 경계)
- Q-FE-DOC-003 (오디오 세션 카테고리) — v0.2 06/14에서 보강
- Q-FE-DOC-006 (매직링크 Universal Link) — v0.2 06에서 보강
- Q-FE-DOC-007 (attempts/batch 페이로드 한계) — v0.2 08에서 보강
- Q-BE-DOC-002 (머지 트랜잭션 SQL) — v0.2 08에서 보강 (CC2-06이 부분 제공)
- Q-BE-DOC-005 (manifest JSON Schema) — v0.2 08에서 보강
- Q-BE-DOC-007 (anon 키 scrape 위협) — 추가 답변 필요
- Q-SEC-DOC-005 (DSAR 채널) — v0.2 16에서 보강 (`<TBD-C-13>` 위치)
- Q-SEC-DOC-006 (수집 데이터 법적 근거) — v0.2 16에서 보강
- Q-SEC-DOC-008 (운영자 RBAC) — v0.2 15/18에서 보강 (CC2-03이 부분 제공)
- Q-PL-DOC-004 (grace period 일수) — 추가 답변 필요 (CC2-08이 컬럼만 정의)
- Q-PL-DOC-005 (자동 갱신 24시간 알림) — v0.2 13/17에서 보강
- Q-PL-DOC-009 (한국 우회 가입 7일 청약철회) — 추가 답변 필요
- Q-OPS-DOC-007 (Phased Rollout 자동 Halt 트리거) — v0.2 23에서 보강

> 약 8개가 **v0.2로 풀 수 없는 추가 답변 필요 항목**. 23개 문서 v0.2 갱신 후 별도 미니 라운드(약 8개 P0 추가 답변)면 본격 개발 착수 가능.

### 11.3 우선 8개 문서 v0.3 반영 상태

| 문서 | 상태 | 핵심 반영 |
|---|---|---|
| 06_feature_spec.md | v0.3 완료 | F-001~F-010 구현 단위 재작성, SRS/게스트/결제/학습 루프 보강, CC3 결정 반영 |
| 07_erd_db_design.md | v0.3 완료 | RLS 매트릭스, daily_usage, subscription_entitlements, audit_log, scrape 방어 결정 |
| 12_event_taxonomy.md | v0.3 완료 | 결제 이벤트 SSOT, GA4 예약명 회피, opt-in 분석, BigQuery 기본 off |
| 15_permission_policy.md | v0.3 완료 | OS 권한, 앱 역할, RBAC, audit_log, 검수 분리 결정 |
| 17_terms_of_service.md | v0.3 완료 | 배타적 한국 관할 제거, 소비자 강행규정 보존, grace/청약철회 결정 |
| 18_security_data_retention_policy.md | v0.3 완료 | 침해 통지 SOP, 키 회전, RTO/RPO, Privacy Manifest gate, scrape 방어 결정 |
| 22_mvp_development_tasks.md | v0.3 완료 | 20주 계획, D-42 사업자 gate, 콘텐츠 batch, CC3 운영 결정 |
| 23_deployment_checklist.md | v0.3 완료 | D-42, territory 제외, OTA SOP, 키 인수, rollout halt 결정 |

### 11.4 CC3 최종 결정 매핑

| 결정 ID | 질문 | 반영 문서 | 상태 |
|---|---|---|---|
| CC3-01 | Q-PP-DOC-004 무료 일일 3 vs 신규 팩 샘플 정책 | 02, 03, 06 | 답변완료 |
| CC3-02 | Q-PM-DOC-005 1인 운영 P0 SLA 야간/주말 정책 | 20, 22 | 답변완료 |
| CC3-03 | Q-FE-DOC-002 Android Apple Sign In 제공 여부 | 06, 08, 22, 24 | 답변완료 |
| CC3-04 | Q-BE-DOC-007 free pack scrape 방어 수준 | 07, 08, 18, 23 | 답변완료 |
| CC3-05 | Q-PL-DOC-004 grace period 일수/강등 시점 | 06, 13, 17, 21, 22, 23 | 답변완료 |
| CC3-06 | Q-PL-DOC-009 한국 거주자 청약철회 창구 | 13, 17, 23 | 답변완료 |
| CC3-07 | Q-PP-DOC-007 검수 책임 분리/외부 검수자 | 04, 15, 19, 22, 23 | 답변완료 |
| CC3-08 | Q-OPS-DOC-007 phased rollout halt trigger | 21, 23 | 답변완료 |

### 11.5 잔여 15개 문서 v0.3 반영 상태

| 문서 | 상태 | 핵심 반영 |
|---|---|---|
| 02_service_prd.md | v0.3 완료 | 20주 계획, 4단계 학습 루프, privacy/age gate, CC3 결정 정리 |
| 03_learning_methodology_curriculum.md | v0.3 완료 | 60/120일 MVP 제외, stage -1 오답, preview pool 결정 |
| 04_content_operations_review_guide.md | v0.3 완료 | pass/fail 검수표, 50단어 batch, 외부/독립 검수 결정 |
| 05_wireframes.md | v0.3 완료 | age gate -> privacy -> onboarding, SE급 4단계 word flow |
| 08_api_spec.md | v0.3 완료 | 멱등 키, 에러 표준, pagination, signed URL TTL, scrape 방어 결정 |
| 09_technical_architecture.md | v0.3 완료 | NFR/SLO, 비용 시나리오, Supabase Free->Pro, vendor exit plan |
| 10_design_system.md | v0.3 완료 | 영문/한국어 폰트, 8pt grid, 다크 모드 토큰, 컴포넌트 기준 |
| 11_ux_writing_guide.md | v0.3 완료 | privacy/age/audio/paywall/error 카피, 단복수/통화 규칙 |
| 13_payment_policy.md | v0.3 완료 | entitlement status enum, 자동 갱신 24시간 안내, grace/청약철회 결정 |
| 14_notification_policy.md | v0.3 완료 | local reminder, iOS provisional 판단, 거부 fallback, quiet hours |
| 16_privacy_policy.md | v0.3 완료 | DSAR, legal basis, UK Children's, Do not sell/share, 72시간 통지 |
| 19_admin_planning.md | v0.3 완료 | RBAC, audit_log, 50단어 batch 운영, 검수 분리 결정 |
| 20_customer_support_operations_manual.md | v0.3 완료 | 결제 status 문의 처리, 보안 사고 SOP, 1인 SLA 결정 |
| 21_qa_test_cases.md | v0.3 완료 | age/privacy/결제 status/OTA/RLS/rollout halt 회귀 테스트 |
| 24_app_store_aso.md | v0.3 완료 | ASO 가설 표기, territory, Apple Sign In Android 결정 |

### 11.6 v0.3 전체 검증 요약

| 항목 | 결과 |
|---|---:|
| v0.3 전환 문서 | 23/23 |
| 우선 8개 문서 | 8/8 완료 |
| 잔여 15개 문서 | 15/15 완료 |
| TBD-CC3 마커 | 0건 |
| CC3 결정 | 8/8 문서 반영 |
| TBD-C-13 마커 | 사업자/운영자/결제 주체 문서에 반영 |

CC3 미니 라운드는 답변 완료되었다. 23개 서비스 기획서는 v0.3 개발 인계 기준으로 전환되었으며, 남은 미확정은 C-13 사업자/결제 수령 주체와 출시 전 법무 검토다.

---

## 10. 변경 이력

| 일자 | 변경 내용 | 작성자 |
|---|---|---|
| 2026-05-07 | 23개 서비스 기획서 통합 1차 리뷰 완료. 12 agent × 평균 15개 = 총 177개 신규 질문 도출, Cross-cutting CC2 25개·출시 차단급 B-01~B-12 식별 | 오케스트레이터 |
| 2026-05-07 | PM이 CC2-01~CC2-25 답변 + B-07/B-10 결정 로그 통합 + §8 결정 로그 17개 결정 정리 + §9 다음 단계 권고 작성 | PM |
| 2026-05-07 | §11 자동 해결 매핑 표 추가. §7 177개 중 약 60개 CC2/B로 자동 해결, 잔여 약 117개 중 P0 추가 답변 필요 항목 약 8개 식별 | 오케스트레이터 |
| 2026-05-07 | 우선 8개 문서(06/07/12/15/17/18/22/23) v0.2 갱신 완료. 잔여 P0 8개를 TBD-CC3-01~08 마커로 삽입 | PM |
| 2026-05-07 | 잔여 15개 문서(02/03/04/05/08/09/10/11/13/14/16/19/20/21/24) v0.2 갱신 완료. 23개 서비스 기획서 전체 v0.2 전환 확인 | PM |
| 2026-05-07 | CC3-01~CC3-08 미니 라운드 답변 완료. 23개 서비스 기획서의 TBD-CC3 마커를 결정 문구로 치환하고 v0.3 개발 인계 기준으로 승격 | PM |
| 2026-05-07 | 기획 검토 sub agent 12명 세션 종료. 페르소나 파일을 `.claude/agents/`에서 `docs/archive/agents/`로 이동(보존). 종료 사유/이력/재활성화 방법은 archive README.md에 기록. 향후 출시 직전 최종 검토, C-13 확정 후 약관 재검토, 베타 피드백 반영 시 재활성화 가능 | 오케스트레이터 |
