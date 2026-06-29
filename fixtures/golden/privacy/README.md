# Privacy Golden Cases (CC-04 + CC-11 + CC2-11 + CC3-04)

> 위치: `fixtures/golden/privacy/*.yaml`
> 평가: `pnpm eval --category=privacy`
> 정합성 SoT: `scripts/eval/privacy.ts` (MIN_AGE=13 / DELETE_SLA=30d / EXPORT_SLA=30d)

## 분포 (W14 11/11 closed → W15 +5 확장 = 16건)

> 정정 (2026-05-11): W14 rollup §2의 "6 / 11"은 1차 commit 시점 기준이며, 디스크상에는 W14 1차 6 + 2차 5 = 11건이 모두 작성되어 있었다. drift 잠금 위해 본 README를 SoT로 고정한다.

| Category | 누적 | W14-1차 | W14-2차 | W15 확장 | 케이스 |
|---|---|---|---|---|---|
| age_gate (CC-04 13세) | 2 | 1 | 1 | 0 | PRV-001 / PRV-002 |
| idfa (CC3-04 ATT) | 2 | 1 | 1 | 0 | PRV-003 / PRV-004 |
| privacy_choices (analytics/personalization/marketing) | 4 | 2 | 1 | +1 (PRV-014 GDPR Art.7(3) withdrawal) | PRV-005 / PRV-006 / PRV-007 / PRV-014 |
| dsr_delete (CC-11 30일 SLA) | 3 | 1 | 1 | +1 (PRV-016 cancel-window 재로그인) | PRV-008 / PRV-011 / PRV-016 |
| dsr_export | 1 | 1 | 0 | 0 | PRV-010 |
| soft_delete | 1 | 0 | 1 | 0 | PRV-009 |
| family_share (신설 W15) | 1 | 0 | 0 | +1 (PRV-012 entitlement_inherited=false) | PRV-012 |
| minor_refund (신설 W15) | 1 | 0 | 0 | +1 (PRV-013 KR 미성년 환불 SLA) | PRV-013 |
| ccpa_no_sale (신설 W15) | 1 | 0 | 0 | +1 (PRV-015 opt-out no-op confirm) | PRV-015 |
| **총** | **16** | **6** | **5** | **+5** | — |

## W15 확장 5건 요약

| ID | P | 카테고리 | 단언 핵심 |
|---|---|---|---|
| PRV-012 | P0 | family_share | family_share=false 시 entitlement_inherited=false (RC family_share toggle 회귀 catch) |
| PRV-013 | P1 | minor_refund | KR 14~18세 부모 환불 청구 → 30d 처리 SLA |
| PRV-014 | P1 | privacy_choices | GDPR Art.7(3) 동의 철회 forward-only (retroactive purge 의무 부정) |
| PRV-015 | P2 | ccpa_no_sale | "판매·공유 없음" 정책 하 opt-out no-op confirm + 12개월 재요청 |
| PRV-016 | P1 | dsr_delete | cancel-window 내 단순 재로그인은 복구 아님 — 명시적 cancel API 필요 (UX dark pattern 회피) |

## evaluator union 확장 필요 (3 카테고리)

`scripts/eval/privacy.ts` 의 `category` union에 `family_share` / `minor_refund` / `ccpa_no_sale` 추가 + 빈 분기를 두어야 strict mode가 깨지지 않는다 (W14 패턴 준수). PRV-014 / PRV-016은 기존 분기 재사용.

```ts
category:
  | "age_gate"
  | "idfa"
  | "privacy_choices"
  | "dsr_delete"
  | "dsr_export"
  | "soft_delete"
  | "family_share"      // W15
  | "minor_refund"      // W15
  | "ccpa_no_sale";     // W15
```

## YAML 구조 (W15 확장 반영)

```yaml
id: PRV-XXX
description: ...
category: <위 9종 중 1>
input:
  # age_gate
  age: number
  # idfa
  att_status: authorized | denied | not_determined | restricted
  requested_ad_id: boolean
  # privacy_choices
  choice: { analytics, personalization, marketing }
  requested_event_send: analytics | personalization | marketing
  consent_withdrawn_at?: ISO        # PRV-014
  prior_events_collected_count?: number
  # dsr_delete / soft_delete
  delete_request_at: ISO
  now: ISO
  user_action?: re_login_attempt | explicit_cancel_api  # PRV-016
  # dsr_export
  export_request_at: ISO
  # family_share (W15)
  entitlement_holder_user_id: string
  requesting_user_id: string
  holder_status: active | grace_period | ...
  family_share_enabled: boolean
  # minor_refund (W15)
  user_age: number
  jurisdiction: KR | US | EU | ...
  parental_consent_obtained: boolean
  purchase_at: ISO
  refund_request_at: ISO
  # ccpa_no_sale (W15)
  user_jurisdiction: US-CA | ...
  opt_out_request_at: ISO
  current_sale_status: boolean
  current_share_status: boolean
expected:
  # 기존 필드 +
  entitlement_inherited?: boolean         # PRV-012
  requester_is_premium?: boolean
  refund_eligible?: boolean               # PRV-013
  refund_route?: string
  response_sla_days?: number
  resolution_sla_days?: number
  resolved_within_sla?: boolean
  retroactive_purge_required?: boolean    # PRV-014
  prior_events_retained?: boolean
  opt_out_confirmed?: boolean             # PRV-015
  response_within_days?: number
  status_after?: string
  re_request_allowed_after_months?: number
  cancel_requires_explicit_api?: boolean  # PRV-016
```

## drift 잠금

본 README의 누적 16건 / 9 카테고리 / W15 확장 5건은 디스크 fixture와 1:1 정합한다. PRV-XXX 파일 추가/삭제 시 본 표를 동시 갱신 (CI grep 후보: `ls fixtures/golden/privacy/*.yaml | wc -l == 16`).
