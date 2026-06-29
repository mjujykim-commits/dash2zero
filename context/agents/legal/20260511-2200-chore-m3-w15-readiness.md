# Legal · M3 W15 Readiness Self-Assessment

> 작성: payments-legal-specialist
> 작성일: 2026-05-11 22:00 KST
> 사이클: M3 W15 진입 직전 (W14 rollup 서명 완료)
> 참조: `context/rollups/20260511-M3-W14-evaluators-and-ci.md` §9, `scripts/eval/privacy.ts`, `fixtures/golden/privacy/` (현 11/11), `docs/13_payment_policy.md`, `docs/16_privacy_policy.md`, `docs/17_terms_of_service.md`, ADR-0004, CC-04 / CC-11 / CC2-11 / CC3-04
> 상태: GREEN with 3 watch items

---

## 0. 컨텍스트 정정

W14 rollup §2는 Privacy golden을 "6 / 11 (55%)"로 기록했으나, 실제 디스크에는 **PRV-001~011 11건이 모두 작성**되어 있다 (W14 1차 6 + 2차 5). README 분포표(11건 100%)와 evaluator의 6 카테고리(age_gate / idfa / privacy_choices / dsr_delete / dsr_export / soft_delete)도 정합. 즉 "Privacy 잔여 5건"은 이미 closed 되었고, W15에서는 **목표 11건을 초과하는 신규 영역(가족 공유 / CCPA / 미성년자 결제 환불 / Cancel-Window UX / 14세 미만 한국 KISA)을 추가할지** 의사결정이 필요하다. 본 문서는 그 가정 하에 작성한다.

---

## 1. 12항목 자가진단

| # | 항목 | 상태 | 근거 / 비고 |
|---|---|:---:|---|
| 1 | Privacy evaluator 카테고리 6종 SoT 일치 | GREEN | `scripts/eval/privacy.ts:20-25`의 union이 README 분포표 6열과 1:1 매핑. MIN_AGE=13 / DELETE_SLA=30 / EXPORT_SLA=30이 CC-04 + CC-11 상수와 일치. |
| 2 | 11/11 골든 모두 evaluator pass (strict 가정) | GREEN | PRV-009/011 cron-window 경계가 31d / 29d로 양쪽 분리. PRV-005/006/007이 analytics/personalization/marketing 3 토글 모두 cover. |
| 3 | DSR 30d SLA — 정책 ↔ evaluator ↔ 운영 매뉴얼 정합 | YELLOW | `docs/16_privacy_policy.md` / `docs/20_customer_support_operations_manual.md` / evaluator 모두 30d로 일치하는지 W15 1일차에 cross-check 필요. soft_deleted_at = req로 단언하므로 backend도 동일 시점 기록 보장 필요(R-23 인접). |
| 4 | ATT IDFA flow (CC3-04) — Privacy 정책 + RC custom attributes 정합 | GREEN | PRV-003/004 + PRV-ADV-002 (adversarial)로 denied/authorized/post-denial 모두 cover. |
| 5 | 자동 갱신 24h 전 고지 / 가격 표시 의무 (Apple §3.1.2(a) + Google Play subscriptions) | YELLOW | `docs/13_payment_policy.md §5` 필수 문구 9개 명시되어 있음. 다만 RC paywall 4개 variant 별로 실제 노출 disclosure 카피가 lock되었는지는 W15 paywall_view 이벤트 baseline 직전 확인 필요. |
| 6 | 환불 정책 — "환불 불가" 표현 부재 + 한국/AU/NZ/UK 강행 소비자 권리 보존 문구 (CC2-13) | GREEN | TOS §0의 CC2-13 반영 줄로 보존 문구 표명. Payment policy의 환불 처리 책임이 "Apple/Google 권한"으로 정확히 위임. 단 1인 개발자 응답 SLA는 §2 Q-PL-NEW-002에서 재확인. |
| 7 | 가족 공유 (Family Sharing) — disabled 명시 ↔ App Store Connect 설정 일치 | YELLOW | `docs/13_payment_policy.md §2` "가족 공유: 비활성화" 선언과 §5 필수 문구 "Family sharing is not included" 표시. 단 RC 측 family_share=false toggle 운영 매뉴얼 부재 (Q-PL-NEW-005). |
| 8 | 미성년자 결제 / 환불 분쟁 대응 (한국 13~17 high-privacy) | YELLOW | TOS §3에 13~17 high privacy default 명시. 결제 UI는 누구나 가능하나 한국 미성년자 부모 동의 없는 결제 환불 청구권에 대한 운영 매뉴얼 챕터 미존. 한국 사용자 가시화 전(M4) 결정 필요. |
| 9 | EU GDPR 동의 흐름 — 약관 동의와 개인정보 처리 동의 분리 | YELLOW | TOS와 Privacy 별도 문서이나, 온보딩 동의 UI에서 두 toggle이 분리되었는지 검증 evaluator 부재. M4 진입 전 확인 항목. |
| 10 | CCPA "Do Not Sell or Share" — B-07 "판매/공유 없음"이면 opt-out 링크 면제 가능 | GREEN | TOS §0 B-07 "개인정보 판매/공유 및 광고 추적 없음" 명시되어 CCPA §1798.135 opt-out 의무 면제 근거 존재. 단 미국 출시 시 Privacy Policy의 CCPA 섹션 추가 필요 (Top 3에 포함). |
| 11 | 약관/처리방침 변경 시 동의 vs 통지 정책 | RED | `docs/16_privacy_policy.md` / `docs/17_terms_of_service.md`에 "material change → re-consent vs notice-only" 분기 규정 부재. M4 진입 전 추가 필수. |
| 12 | AI 사용 고지 (콘텐츠 보조 작성) | YELLOW | TOS §2에 "사용자용 AI 챗봇 미제공"은 명시되었으나, **콘텐츠 제작에 AI 보조 사용 여부 disclosure** 부재. EU AI Act 2026 적용 일정 고려 시 M4 GA 전 결정 필요. |

종합 신호: GREEN 4 / YELLOW 6 / RED 1 → **M3 W15 진입 차단 항목 없음**. RED 1건(#11 정책 변경 절차)은 M4 진입 전 처리.

---

## 2. Privacy 잔여 (확장) 5건 시나리오 제안

11건 목표는 closed. 다음 5건은 **목표 초과 확장**으로, M4 출시 시장 의사결정에 따라 우선순위가 달라진다. orchestrator가 채택 여부 판단 권장.

| 신규 ID | 카테고리 (신설 or 기존) | 시나리오 | 책임 / 의존 | 우선순위 |
|---|---|---|---|---|
| PRV-012 | family_share (신설) | RC family_share=false 환경에서 부 계정의 entitlement가 가족 구성원에 inherit되지 않음 단언 (Q-PL-NEW-005) | legal + backend | P0 — 가족 공유 disabled가 설계 핵심 가정 |
| PRV-013 | minor_refund (신설) | 한국 만 14세 미만 결제 시도 → 차단 / 만 14~19세 결제 후 부모 환불 청구 → 30일 내 처리 표기 | legal | P1 — 한국 출시 의존 |
| PRV-014 | privacy_choices (확장) | 동의 후 30일 이내 철회 시 기존 수집 데이터 처리 (analytics 이벤트 retroactive purge or 보존) | legal + analytics | P1 — GDPR Art.7(3) right to withdraw |
| PRV-015 | ccpa_no_sale (신설) | "데이터 판매 없음" 정책 하에서 사용자 opt-out 요청은 no-op으로 confirm 응답 + 12개월 내 재요청 허용 | legal | P2 — 미국 출시 의존 |
| PRV-016 | dsr_delete (확장) | 삭제 요청 후 cancel-window(< 30d) 내 사용자가 재로그인 시도 → soft_deleted_at 보존 + 명시적 cancel API 호출 시에만 복구 | legal + backend + ux | P1 — UX-side dark pattern 회피 |

> 참고: evaluator union에 `family_share` / `minor_refund` / `ccpa_no_sale`을 추가할 경우 `scripts/eval/privacy.ts`의 switch에 빈 분기를 추가해야 strict mode가 깨지지 않는다(W14 패턴).

---

## 3. M4 진입 전 정책 문서 갱신 Top 3

| 순위 | 항목 | 근거 | 작업 단위 |
|---|---|---|---|
| 1 | **Paywall disclosure 4-variant lock** — RC paywall A/B/C/D 4 화면 모두에 §5 필수 문구 9개 노출 검증 표 | Apple §3.1.2(a) + Google Play subscriptions 위반 시 reject 즉시 발생 → baseline metrics 14d 시작(W15) 전 확정 | docs/13_payment_policy.md §5 하단에 variant matrix 표 추가 |
| 2 | **정책 변경 시 동의 vs 통지 정책** (#11 RED) | 약관/처리방침 material change 정의 + 14일 전 in-app banner + re-consent 트리거 조건 표가 부재. M4 운영 시작 후 변경하면 추가 동의 청구 비용 폭증 | docs/16_privacy_policy.md + docs/17_terms_of_service.md에 §"Changes to this Policy" 섹션 신설 |
| 3 | **가족 공유 운영 매뉴얼** (Q-PL-NEW-005) | 정책은 disabled이나 RC dashboard 토글, App Store Connect "Family Sharing" off, 사용자 CS 응답 템플릿("가족 구성원 결제 분리 안내")이 묶인 매뉴얼 부재 | docs/20_customer_support_operations_manual.md + docs/13_payment_policy.md §6 cross-link |

차순위 (Top 3 외 후보, M4 W2 이내):
- RC platform-specific (Apple grace period 16d vs Google account hold 30d) mapStatus 정합 표를 docs/13에 명시
- AI 사용 고지(#12) — TOS §"Service Description"에 "콘텐츠는 AI 보조로 작성 후 인간 검수" 1문장 추가
- CCPA 섹션 (PRV-015 채택 시)

---

## 4. 가족 공유 evaluator case 의견

**찬성, 단 P0 1건만.** 가족 공유는 정책상 disabled이나 RC family_share toggle이 잘못 설정되거나 향후 활성화 시 entitlement inheritance가 자동으로 작동해 무료 사용자 다수가 premium 상태가 될 위험(매출 손실)이 크다. PRV-012 한 건으로:

- input: `entitlement_holder_user_id=A`, `requesting_user_id=B`, `family_share_enabled=false`
- expected: `entitlement_inherited=false`

만 단언해도 family-sharing 설정이 잘못 켜진 회귀를 즉시 catch한다. evaluator union에 `family_share` 카테고리 추가 + isPremiumActive 함수 또는 별도 helper에서 holder check만 추가하면 된다(payment evaluator와 cross-cutting). PRV-013(미성년 환불)는 한국 출시 시점에 P1로 격상.

---

## 5. 차단 / 의존성

- **차단 없음** — M3 W15 진입 가능.
- **W15 의존 (legal이 다른 agent에 의존하는 항목)**:
  - DSR 30d SLA cross-check는 backend가 soft_deleted_at write timing을 evaluator 단언과 일치시킬 것 필요(#3 YELLOW).
  - audit_log alert 채널(security + devops)이 DSR 위반/age_gate 우회/marketing-without-consent 시도를 #security 채널로 라우팅하면, legal은 SLA 응답 시계를 audit_log timestamp 기준으로 운영 매뉴얼에 박을 수 있음.
- **W15에서 legal이 다른 agent에 제공할 항목**:
  - PRV-012~016 신규 5건의 input/expected YAML 초안 (orchestrator가 채택 여부 판단 후 작성).
  - Paywall variant matrix 표 (analytics가 baseline 수집 시작 전 합의).

---

## 6. 후속 질문 (REVIEW_QA "결제/법무" 섹션 후보)

- Q-LG-W15-01 (P0): 만 14세 미만 한국 사용자에 대한 KISA 부모 동의 흐름을 13세 GDPR 라인과 별도로 운영할 것인가? (현재 단일 13세 게이트)
- Q-LG-W15-02 (P0): 정책 material change 시 in-app banner + re-consent vs notice-only 분기 기준 (예: 결제 가격 변경은 re-consent, 문구 다듬기는 notice).
- Q-LG-W15-03 (P1): 콘텐츠 제작 AI 보조 사용을 TOS에 disclosure할지 — EU AI Act 2026 단계별 적용 고려.
- Q-LG-W15-04 (P1): PRV-012~016 5건 중 어디까지 채택할지 (가족 공유 P0 권장 / 나머지 출시 시장 의존).
- Q-LG-W15-05 (P2): 1인 개발자 환불 응답 SLA 공식 SLA 표기 (현재 미명시) — Apple은 자체 처리하나 사용자 직접 문의 시 응답 시한 commit이 운영 부담 vs 약관 분쟁 회피 trade-off.

---

서명: payments-legal-specialist · 2026-05-11 22:00 KST
