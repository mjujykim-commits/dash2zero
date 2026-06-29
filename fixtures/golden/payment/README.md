# Payment Golden Cases (CC2-08 + CC3-05 + CC-09)

> 위치: `fixtures/golden/payment/*.yaml`
> 평가: `pnpm tsx scripts/eval/runner.ts --category=payment --strict`
> 정합성 SoT: `apps/api/edge-functions/_shared/billing.ts` (mapStatus / isPremiumActive)

## 분포 (15건, W15 strict pass 목표 = 100%)

| Category | 건수 | W14 | W15 | 케이스 ID |
|---|---|---|---|---|
| mapping (12 RC event → 9 status) | 7 | 4 | 3 | PAY-001/002/003/006/004/005/007 |
| idempotent (last_rc_event_id) | 2 | 1 | 1 | PAY-008/009 |
| signature (Authorization Bearer 검증) | 1 | 1 | 0 | PAY-010 |
| premium_active (active 단일) | 1 | 1 | 0 | PAY-012 |
| billing_retry_window (24h) | 2 | 0 | 2 | PAY-011/013 |
| cancellation_until_period_end | 2 | 0 | 2 | PAY-014/015 |
| **총** | **15** | **7** | **8** | — |

> **카운트 정정 (Q-BE-W15-002 — backend 자율 정정)**
>
> 이전 README 분포표는 mapping=6 / signature=2 / premium_active=2 / grace_period=1 로
> 표기되었으나 실제 본화 결과와 모순. 정정 사유:
> - mapping = 7 (RC 12 event 중 INITIAL_PURCHASE/RENEWAL/BILLING_ISSUE-grace/REFUND/
>   CANCELLATION/EXPIRATION/REVOKE 7종 본화. 잔여 5종(UNCANCELLATION/PRODUCT_CHANGE/
>   TRANSFER/TEST/SUBSCRIBER_ALIAS) 은 mapStatus 동일 분기/ignored 분기로 W16 보강 후보)
> - signature = 1 (positive case 는 webhook integration test 가 cover. 본 evaluator
>   는 negative-only — PAY-010 invalid_signature 1건이 충분)
> - premium_active = 1 (active 단일 — grace_period/billing_retry/cancelled 는 별도
>   카테고리(billing_retry_window / cancellation_until_period_end)로 분리되어 중복 카운트 회피)
> - grace_period 별도 카테고리 제거 (PAY-003 이 mapping 카테고리에서 BILLING_ISSUE +
>   gracePeriodMs 분기 단언 — 중복 슬롯 불필요)
>
> **W16 후보 보강 (현재 분포 외):**
>   PAY-016 UNCANCELLATION → active mapping
>   PAY-017 SUBSCRIBER_ALIAS → ignored at caller (status="active" 분기는 상수 반환,
>     실 webhook 에서는 dispatch 무시 — README 의 "ignored at caller" 주석 명시)

## YAML 구조 (W14 PAY-001~003 패턴)

```yaml
id: PAY-XXX
description: ...
category: mapping | idempotent | signature | premium_active | billing_retry_window | cancellation_until_period_end
input:
  event_type: INITIAL_PURCHASE | RENEWAL | ... | SUBSCRIBER_ALIAS  # mapping
  grace_period_expiration_at_ms: 1234567890                          # mapping (옵션)
  last_rc_event_id: evt_abc                                          # idempotent
  db_last_rc_event_id: evt_abc | null                                # idempotent (중복 시 동일)
  authorization: Bearer secret_x                                     # signature
  expected_authorization: Bearer secret_x                            # signature
  status: active | grace_period | billing_retry | cancelled | ...   # premium_active 계열
  period_ends_at: 2026-06-08T00:00:00Z                               # cancellation_until_period_end
  last_synced_at: 2026-05-08T00:00:00Z                               # billing_retry_window
  now: 2026-05-09T00:00:00Z                                          # premium_active 기준 시각
expected:
  status: active                                                     # mapping
  is_premium: true | false                                           # premium_active 계열
  http_status: 200 | 401                                             # signature / idempotent
  outcome: applied | idempotent_skip | invalid_signature             # idempotent / signature
```

## 운영 노트

- mapStatus 결정 표는 `apps/api/edge-functions/_shared/billing.ts` 주석 참조.
  fixture 변경 전 SoT 변경 여부 확인 필수.
- billing_retry 24h 경계 단언 (PAY-011/013) 은 `_shared/billing.ts` 의
  `24 * 60 * 60 * 1000` 상수와 1:1 (변경 시 양쪽 동기 필요).
- cancellation_until_period_end (PAY-014/015) 는 `now < periodEndsAt` 단순 비교.
  타임존 영향 없음 — 모두 UTC ISO 입력.
