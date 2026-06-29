# 결제 정책서

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-01/16 | 결제 수령 주체는 <TBD-C-13: 한국 개인사업자 가정>, D-42 확정 gate |
| CC2-06 | 구매/Restore는 authenticated user만 가능 |
| CC2-08 | subscription_entitlements status enum 반영 |
| CC2-13 | AU/NZ/UK 배제 불가능한 소비자 권리 보존 |
| PL 리뷰 | 자동 갱신 24시간 전 안내, 가족 공유 비활성 고지 보강 |

## 1. 문서 상태

이 문서는 내부 초안이다. 실제 출시 전 Apple/Google 정책, 사업자 정보, 세무, 환불 관련 법무 검토가 필요하다.

- 결제 수령 주체: <TBD-C-13: 한국 개인사업자 가정>
- 임시 가정: 한국 개인사업자 + 통신판매업 신고 예정
- C-13 확정 데드라인: 베타 출시 4주 전, 공개 출시 D-42

## 2. 결제 모델

- Free + Premium 구독
- 결제 수단: Apple App Store IAP, Google Play Billing
- 결제 SDK: RevenueCat
- 외부 결제: MVP 미운영
- 무료 체험: 없음
- 광고: 없음
- 가족 공유: 비활성화
- 구매 가능 상태: authenticated user만 가능

## 3. 상품

| 상품 | 가격 가설 | 설명 |
|---|---:|---|
| Free | USD 0 | Starter Pack 60단어, 일일 3단어, 복습 20문항 |
| Premium Monthly | USD 1.99/month | 전체 콘텐츠, 일일 15단어, 복습 무제한 |
| Premium Annual | USD 14.99/year | 월간 대비 저가 장기 구독 |

국가별 실제 가격은 스토어 가격 tier와 localized price를 따른다. 세금 포함 여부는 각 스토어 표시 정책을 따른다.

## 4. Premium 혜택

- 전체 300단어 접근
- 이후 future premium packs 접근
- 일일 신규 15단어
- 복습 무제한
- Weak Words 집중 복습
- 상세 성장 리포트

## 5. 구매 화면 필수 문구

- 가격
- 갱신 주기
- 자동 갱신
- 해지 위치
- 결제는 Apple/Google 계정으로 청구
- 구독은 현재 기간 종료 전 해지하지 않으면 자동 갱신
- 무료 체험 없음
- 가족 공유 미포함
- Restore Purchases 제공
- Terms / Privacy 링크

기본 문구:

Auto-renews. Cancel anytime in App Store or Google Play. No free trial. Family sharing is not included.

### 5.1 Paywall 4-variant disclosure lock (W15 추가)

> 출시 차단급: Apple §3.1.2(a) "Subscriptions" 가이드라인 위반 시 즉시 reject. M3 W15 paywall_view baseline 시작 전 4 variant 모두 lock.
> 톤: Honest (designer 가이드 일관). 과장/유도 표현 금지.

| # | 필수 항목 | Variant A (default) | Variant B (annual emphasis) | Variant C (monthly emphasis) | Variant D (compact) |
|---|---|---|---|---|---|
| 1 | 가격 (localized) | "USD 1.99 / month" | "USD 14.99 / year" | "USD 1.99 / month" | "From USD 1.99" |
| 2 | 갱신 주기 | "Billed monthly" | "Billed yearly" | "Billed monthly" | "Monthly or yearly" |
| 3 | 자동 갱신 사실 | "Auto-renews each month until canceled." | "Auto-renews each year until canceled." | "Auto-renews until canceled." | "Auto-renews until canceled." |
| 4 | 해지 방법 | "Cancel anytime in App Store / Google Play account settings." | (동일) | (동일) | (동일) |
| 5 | 결제 청구 주체 | "Charged to your Apple / Google account." | (동일) | (동일) | (동일) |
| 6 | 24h 전 미해지 시 갱신 고지 | "Cancel at least 24 hours before the renewal date to avoid being charged." | (동일) | (동일) | (동일, 작은 글씨 허용 — 가독성 충족 시) |
| 7 | 무료 체험 부재 | "No free trial." | (동일) | (동일) | (동일) |
| 8 | 가족 공유 부재 | "Family sharing is not included." | (동일) | (동일) | (동일) |
| 9 | Restore + Terms / Privacy 링크 | "Restore Purchases · Terms · Privacy" | (동일) | (동일) | (동일) |

**lock 규칙**:
- 9개 항목은 **4 variant 모두 시각적으로 노출** 되어야 한다 (스크롤 후라도 가시 영역 진입 가능해야 함). 모달 내부 hidden은 reject 사유.
- 가격은 스토어 localized price와 정합 (RC `Offerings` API 응답 기준).
- 변경 시 본 표 갱신 + analytics가 paywall_view 이벤트에서 `variant_id` 4종 모두 baseline 14d 수집 후에만 가격/문구 A/B 가능.
- 4 variant lock 검증은 E2E 스냅샷 (analytics responsibility) + paywall_view 이벤트의 `variant_id` 분포로 confirm.

## 6. 구매와 복구

| 기능 | 조건 | 처리 |
|---|---|---|
| Purchase | 로그인 필요 | RevenueCat purchase 시작 |
| Restore Purchases | 로그인 필요 | RevenueCat restore 후 entitlement 확인 |
| Guest purchase | 불가 | 로그인/가입 화면으로 이동 |
| Guest restore | 불가 | 로그인/가입 화면으로 이동 |

RevenueCat appUserID는 Supabase auth.users.id 문자열로 설정한다.

## 7. 결제 상태 enum

| status | 앱 권한 | 설명 |
|---|---|---|
| active | Premium 유지 | 정상 구독 |
| grace_period | Premium 유지 | 결제 문제 후 유예 기간 |
| billing_retry | 정책 확정 필요 | 스토어/RevenueCat 상태에 따라 처리 |
| expired | Free 강등 | 구독 만료 |
| refunded | Free 강등 | 환불 확인 |
| revoked | Free 강등 | 권한 취소 |
| transferred | 재동기화 | RevenueCat transfer 처리 필요 |
| unknown | 보수적 처리 | 서버 재확인 필요 |

확정 결정:

- CC3-05 결정: grace_period 3일, billing_retry without grace는 last active 후 24시간 유지, expired/refunded/revoked는 즉시 Free 강등. 현재 임시 기준은 active/grace_period에서만 Premium 유지, expired/refunded/revoked는 Free 강등이다.

## 8. 자동 갱신과 24시간 전 안내

스토어 구독은 자동 갱신된다. 앱 내 paywall과 terms에는 아래 내용을 명시한다.

- 구독은 자동 갱신된다.
- 현재 기간 종료 최소 24시간 전까지 취소하지 않으면 갱신될 수 있다.
- 사용자는 App Store 또는 Google Play 계정 설정에서 취소한다.
- 실제 갱신, 취소, 청구 시점은 각 스토어 정책을 따른다.

앱이 별도 24시간 전 push/email 알림을 보장하지 않는다. 사용자가 로컬 reminder에 동의했더라도 구독 갱신 알림은 스토어 시스템 안내를 우선한다.

## 9. 환불

- 기본 환불 경로는 Apple/Google 스토어 환불 절차다.
- 지원팀은 환불 경로를 안내하고 필요한 경우 결제 상태 확인을 돕는다.
- 스토어가 환불을 승인하면 RevenueCat webhook을 통해 권한을 Free로 강등한다.
- 환불/결제 문의 1차 응답 목표는 영업일 3일이다.

한국 거주자 또는 한국 소비자법 적용 가능성이 있는 사용자의 청약철회 창구는 별도 확정이 필요하다.

- CC3-06 결정: 한국 거주자/한국 소비자법 적용 가능 사용자는 구매 후 7일 내 support email로 청약철회 요청 가능.

## 10. 소비자 강행규정

본 결제 정책은 법률이 허용하는 범위에서 적용된다. AU Consumer Law, NZ Consumer Guarantees Act, UK Consumer Rights Act 등 배제할 수 없는 소비자 권리, 보증, 환불 권리를 제한하지 않는다.

## 11. 가격 변경

- 가격 인상 시 앱 내 공지 또는 이메일 등 합리적인 방법으로 사전 고지한다.
- 기존 구독자의 동의/고지는 Apple/Google 정책을 따른다.
- 가격 인하 또는 프로모션은 기존 구독자에게 자동 적용되지 않을 수 있다.

## 12. 서비스 종료

- 서비스 종료 시 가능한 범위에서 최소 60일 전 공지한다.
- 잔여 구독 환불은 스토어 정책을 우선한다.
- 사업자 귀책 종료라면 법률이 요구하는 범위에서 잔여 기간 환불 지원을 원칙으로 한다.

## 13. D-42 결제 출시 게이트

D-42까지 아래가 완료되지 않으면 paid release를 보류한다.

- Apple Paid Apps Agreement
- Google payments profile
- 세금 서류
- 결제 수령 계좌
- RevenueCat production 설정
- Terms/Privacy/Payment의 C-13 치환
