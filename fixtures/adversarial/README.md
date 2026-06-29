# Adversarial Fixtures (보안 / 정책 위반 시도)

> 위치: `fixtures/adversarial/{rls,payment,privacy}/`
> 평가 방식: M3 W15에서 RLS evaluator 추가 (Supabase 실제 query 또는 정책 SQL static check)
> 본 commit에서는 fixture YAML만 작성 — runner는 skip 처리 (`rls_evaluator_pending_M3_W15`)
>
> 책임 agent: security + qa + legal

## 카테고리 분포

| 디렉토리 | 카테고리 | 1차 commit |
|---|---|---|
| `rls/` | 13 table × 5 role × 4 CRUD 중 대표 공격 — 다른 user 데이터 접근 / role 위장 / service_role 위조 | 4건 |
| `payment/` | 위조 webhook / replay attack / app_user_id 위장 | 2건 (mapping/idempotent와 별개) |
| `privacy/` | age gate 우회 / IDFA off 상태에서 ad_id 수집 / 13세 미만 자가신고 후 행동 분석 | 3건 |

## YAML 구조 (공통)

```yaml
id: ADV-XXX
description: 공격 시나리오 + 기대 차단
threat_model: STRIDE / LINDDUN 분류
input:
  attacker_role: anon | authenticated | service_role | other_user
  target: { table?: ..., user_id?: ..., endpoint?: ... }
  payload: { ... }
expected:
  blocked: true
  http_status: 401 | 403 | 410
  audit_logged: true
```

## ADR-0003 (Accepted) 적용

본 fixture set은 M3 W15 RLS evaluator 통합 후 `pnpm eval --category=rls --strict`로 CI 차단된다.
