# RLS Adversarial Cases (ADR-0004 + ADR-0003)

> 위치: `fixtures/adversarial/rls/*.yaml`
> 평가: `pnpm tsx scripts/eval/runner.ts --category=rls --strict`
> 정합성 SoT: `infra/supabase/migrations/0002_rls.sql` (정책 매트릭스)

## 본화 모드 (W15)

- **정적 SQL 분석**: `scripts/eval/rls.ts` 가 0002_rls.sql 의 모든 CREATE POLICY 를
  parse → 정책 분류기로 라벨(`owner-only` / `pack-tier-free` / `entitlement-subquery`
  / `support` / `unguarded` / `append-only`) → adversarial fixture 의
  (attacker_role × table × operation) 과 매칭 → blocked / http_status / row_count 단언.
- **미분류 정책 fail-loud**: `--strict` 모드에서 분류기가 라벨 못 붙인 정책이 1건이라도
  있으면 evaluator startup 시 throw. 0002_rls.sql 의 정책 추가/변경 drift 즉시 탐지.
- **service_role**: BYPASSRLS 분기 — 정책 무관 통과 (positive control).

W16 후보 (ADR-0007 예정): pg_test_role hybrid — 실제 Supabase ephemeral DB 에서
`SET LOCAL ROLE` + `SET request.jwt.claims` 으로 EXISTS 서브쿼리 / JWT custom claim 실측.

## 분포 (13건, W15 strict pass 목표 — D-014 통합)

> **D-014 통합 정책**: security 5건(005~009)은 STRIDE 매트릭스 cover 우선, backend 4건은
> evaluator 분기 cover 보강으로 010~013에 배치. 두 트랙 보존, ID 충돌 해소.

| ID | 시나리오 | attacker | table | op | STRIDE | 작성 트랙 |
|---|---|---|---|---|---|---|
| RLS-ADV-001 | 다른 user의 user_word_states SELECT | authenticated | user_word_states | SELECT | Information Disclosure | core |
| RLS-ADV-002 | anon이 learning_attempts INSERT | anon | learning_attempts | INSERT | Spoofing/EoP | core |
| RLS-ADV-003 | 자기 entitlement 직접 UPSERT | authenticated | subscription_entitlements | INSERT | EoP/Tampering | core |
| RLS-ADV-004 | audit_log 직접 INSERT/UPDATE/DELETE | authenticated | audit_log | INSERT | Repudiation | core |
| RLS-ADV-005 | anon이 비-starter pack 단어 SELECT | anon | words | SELECT | Information Disclosure | security |
| RLS-ADV-006 | 만료 entitlement → premium audio SELECT | authenticated | audio_assets | SELECT | Elevation of Privilege | security |
| RLS-ADV-007 | learning_attempts UPDATE (append-only 위반) | authenticated | learning_attempts | UPDATE | Tampering | security |
| RLS-ADV-008 | 다른 user의 content_reports SELECT | authenticated | content_reports | SELECT | Information Disclosure | security |
| RLS-ADV-009 | account_deletion_requests completed_at 셀프 SET | authenticated | account_deletion_requests | UPDATE | Tampering + Repudiation | security |
| RLS-ADV-010 | service_role 정상 entitlement UPSERT (positive) | service_role | subscription_entitlements | INSERT | DoS / over-block 회귀 | backend |
| RLS-ADV-011 | 다른 user_id 로 learning_attempts INSERT | authenticated | learning_attempts | INSERT | Tampering | backend |
| RLS-ADV-012 | user_word_states 직접 UPDATE (SRS state 자가 조작) | authenticated | user_word_states | UPDATE | Tampering | backend |
| RLS-ADV-013 | completed deletion_request UPDATE (undo 시도) | authenticated | account_deletion_requests | UPDATE | Tampering | backend |

## 분류기 1차 라벨 (evaluator 분기 cover)

| ID | 1차 분류기 |
|---|---|
| 001 | owner-only (cross-user) |
| 002 | append-only / role mismatch |
| 003 | append-only (service_role only write) |
| 004 | append-only (service_role only write) |
| 005 | pack-tier-free |
| 006 | entitlement-subquery |
| 007 | append-only (UPDATE policy 부재) |
| 008 | owner-only (reporter_user_id) |
| 009 | owner-only USING (completed_at IS NULL) + W16 컬럼 GRANT 보강 |
| 010 | bypass (negative-of-negative) |
| 011 | owner-only WITH CHECK |
| 012 | append-only (UPDATE policy 부재) |
| 013 | owner-only USING (completed_at IS NULL) |

## YAML 구조

```yaml
id: RLS-ADV-XXX
description: ...
threat_model: STRIDE/{Tampering|Information Disclosure|...}
input:
  attacker_role: anon | authenticated | service_role | other_user | external_webhook_caller | app_developer_misuse
  target:
    table: <table_name>
    user_id: <attacker uuid>            # owner-only 평가
    queried_user_id: <victim uuid>      # cross-user SELECT
    endpoint: PostgREST GET/POST/...    # operation 추론
    pack_tier: starter | core | topik   # pack-tier-free 평가 (anon SELECT)
    completed_at: <iso>                 # account_deletion_requests undo 시나리오
  payload:
    user_id: <위조 대상 uuid>           # WITH CHECK 평가
    sql: "<raw SQL>"                    # operation 추론 보조
    ...
expected:
  blocked: true | false
  row_count: 0                          # SELECT는 RLS row hide → 0
  http_status: 200 | 401 | 403
  audit_logged: true | false
```

## 운영 노트

- **ID 정책 (D-014, 2026-05-12 orchestrator 통합 봉인)**: security가 STRIDE 매트릭스 cover
  우선으로 005~009 점유. backend는 evaluator 분기 cover 추가건을 010~013에 배치.
  W16 이후 신규 시나리오 추가 시 014부터 사용.
- **9 → 13건 보강 이유**: 두 트랙 모두 보존 가치 — security는 위협 모델(STRIDE) 매트릭스,
  backend는 evaluator 분기(분류기 라벨 6종) cover. 중복 시나리오 없음.
- **false negative 위험 (W16 hybrid에서 보강)**: EXISTS 서브쿼리 (RLS-ADV-005/006), JWT
  custom claim `is_support()` 동작, audio_assets 의 entitlement EXISTS 절, completed_at
  컬럼 GRANT 분리(RLS-ADV-009 첫 SET 경계).
- **`audit_logged` 단언**은 evaluator 가 직접 검증하지 않음 — 본 필드는 W15 시점에서
  policy 의도 문서화. M5 audit chain 통합 시 별도 evaluator 분기 추가 예정.
- **strict pass 목표**: 13/13. 1건이라도 미분류 시 evaluator throw.
