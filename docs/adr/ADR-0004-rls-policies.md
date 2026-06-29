# ADR-0004 — RLS Policy Matrix (Default Deny)

- **상태**: **Accepted**
- **결정일**: 2026-05-08
- **작성**: backend agent + security agent
- **승인**: orchestrator
- **마일스톤**: M2-S1 (W5)
- **관련 문서**: ADR-0001 (Stack) / ADR-0002 (Abstractions) / DOMAIN_MODEL.md / SERVICE_REVIEW_QA §4 CC2-03

---

## Context

CC2-03 결정: "모든 Supabase 테이블은 default deny + RLS enabled를 기본값". DOMAIN_MODEL §5는 15 엔티티의 layer 매핑을 정의했으나 실제 RLS SQL 정책은 미작성. 본 ADR은 **테이블 × 역할 × CRUD 매트릭스**를 봉인한다.

M2-S2에서 모든 DB-touching 코드 작성 전에 본 매트릭스가 필수. RLS 미정의 시 anon 키로 모든 데이터 노출 (보안 사고 1순위, B-04 출시 차단급).

---

## Decision

### 1. 5개 역할 정의

| Role | Supabase 인증 키 | 사용처 |
|---|---|---|
| `anon` | anon public key | 게스트 모드 — Starter Pack 60단어 read만 |
| `authenticated` (owner) | user JWT | 가입 사용자 — 본인 데이터 owner-only |
| `premium_owner` | user JWT + entitlement check | Premium pack 접근 |
| `support` | service_role + JWT custom claim `role:support` | CS 운영자 — read-only, content_reports + audit_log |
| `service_role` | service_role key (서버 전용) | RC webhook handler / Edge Functions / 30일 cron / 머지 트랜잭션 |

> `support` 역할은 M5 운영 어드민 진입 시 활성화. M2-M4는 service_role만으로 운영자 작업 (Owner 1인).

### 2. 13개 테이블 × 5 역할 × 4 CRUD 매트릭스

| 테이블 | anon | authenticated (owner) | premium_owner | support | service_role |
|---|---|---|---|---|---|
| **users** (auth.users) | - | R own | R own | R | RUD |
| **profiles** | - | RU own | RU own | R | RUD |
| **guest_sessions** | CR own (device_install_id) | R own + merge target | - | R | RUD |
| **words** | R (free pack only) | R (all if entitled) | R (all) | R | RUD |
| **word_translations** | R (free pack) | R | R | R | RUD |
| **distractors** | R (free pack) | R | R | R | RUD |
| **word_packs** | R (tier=starter) | R (tier=starter) | R (all) | R | RUD |
| **word_pack_members** | R (free pack only) | R | R | R | RUD |
| **content_manifests** | R (latest only) | R | R | R | RUD |
| **audio_assets** | R (tier=free) | R (tier=free) | R (all, signed URL via Edge Fn) | R | RUD |
| **user_word_states** | - | R own | R own | R | RUD |
| **learning_attempts** | - | CR own (append-only, no UD) | CR own | R | RUD |
| **learning_sessions** | - | CR own | CR own | R | RUD |
| **daily_usage** | - | R own | R own | R | RUD (server SSOT) |
| **subscription_entitlements** | - | R own (read-only!) | R own | R | RUD (webhook 전용 write) |
| **content_reports** | C (anon, device_install_id) | CR own | CR own | RU all | RUD |
| **account_deletion_requests** | - | CR own | CR own | R | RUD (cron 전용) |
| **audit_log** | - | - | - | R (own actions only) | C only |

> **주**: `R = SELECT`, `C = INSERT`, `U = UPDATE`, `D = DELETE`, `-` = 접근 불가.

### 3. RLS 정책 SQL 패턴 (대표 예시)

```sql
-- 모든 테이블 default deny (RLS enabled, no public policy)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Owner-only read/update
CREATE POLICY "profile_owner_select" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profile_owner_update" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Support read all (M5+ 활성화 시)
CREATE POLICY "profile_support_select" ON profiles
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'support'
  );

-- learning_attempts: append-only (INSERT만, UPDATE/DELETE 금지)
ALTER TABLE learning_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempt_owner_insert" ON learning_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attempt_owner_select" ON learning_attempts
  FOR SELECT USING (auth.uid() = user_id);
-- UPDATE / DELETE policy 없음 → 거부됨

-- subscription_entitlements: client read-only, webhook write-only
ALTER TABLE subscription_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entitlement_owner_select" ON subscription_entitlements
  FOR SELECT USING (auth.uid() = user_id);
-- INSERT / UPDATE / DELETE policy 없음 → service_role만 가능 (Supabase 기본)

-- content_reports: anon 신고 허용 (rate limit은 Edge Function에서)
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_anon_insert" ON content_reports
  FOR INSERT WITH CHECK (true)
  -- 단, Edge Function에서 device_install_id 기반 throttle (시간당 5건)
  ;
CREATE POLICY "report_user_select_own" ON content_reports
  FOR SELECT USING (
    auth.uid() = reporter_user_id
    OR auth.jwt() ->> 'role' = 'support'
  );

-- audit_log: 어떤 user도 직접 write 금지 (service_role만)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_support_select" ON audit_log
  FOR SELECT USING (auth.jwt() ->> 'role' = 'support');
```

### 4. 핵심 검증 시나리오 (Adversarial)

M3 evaluation에서 자동 검증할 attack 시나리오:

| Case ID | 시도 | 기대 결과 |
|---|---|---|
| RLS-ADV-001 | anon이 다른 user의 user_word_states SELECT | 0 rows (deny) |
| RLS-ADV-002 | authenticated user가 본인 entitlements UPDATE 시도 | rejected (no UPDATE policy) |
| RLS-ADV-003 | authenticated user가 learning_attempts UPDATE 시도 (정답률 위조) | rejected (append-only) |
| RLS-ADV-004 | anon이 Premium audio_assets SELECT | 0 rows (tier=free filter) |
| RLS-ADV-005 | authenticated user가 audit_log INSERT 시도 | rejected (service_role only) |
| RLS-ADV-006 | RC webhook handler가 service_role로 entitlements UPSERT | success |
| RLS-ADV-007 | content_reports 시간당 6번째 INSERT (anon) | rejected (Edge Function throttle) |

→ 7 case는 `fixtures/adversarial/rls/*.yaml`로 작성 (M3에서 evaluation runner 입력).

### 5. service_role 사용 영역 (제한)

`service_role` 키는 다음 4개 위치에서만 사용:

1. **RC webhook handler** (Edge Function) — entitlements UPSERT
2. **30일 hard-delete cron** (Edge Function) — account_deletion_requests 처리
3. **게스트 머지 트랜잭션** (Edge Function) — user_word_states 충돌 해결
4. **운영자 수동 작업** (Supabase Dashboard, Owner only) — content retire 등 — 모든 변경은 audit_log

→ 클라이언트 (앱)에는 **절대 service_role 키 노출 금지** (CC2-21 결정 그대로).

---

## Rationale

### Default Deny 채택 이유

- Supabase RLS의 모범 사례 — public policy 없으면 자동 거부
- 정책 누락 = 자동 안전 (실수 방어)
- B-04 출시 차단급 보안 사고 사전 차단

### Append-only 패턴 (learning_attempts)

- 학습 정답률 위조 방어
- CC-16 결정과 정합 (오프라인 attempts append-only)
- 머지 트랜잭션의 idempotency 키 사용 가능

### Webhook Write-only 패턴 (subscription_entitlements)

- 클라이언트는 entitlement 직접 변경 불가 → Premium 우회 차단
- RC webhook → service_role → DB만이 권한 부여 경로
- B-12 출시 차단급 결제 보안

### Anon 신고 허용 (content_reports)

- 게스트도 콘텐츠 오류 신고 가능 (UX 친화)
- Throttle은 RLS가 아닌 Edge Function 책임 (시간당 5건/device_install_id)

---

## Consequences

### Positive

- 모든 테이블 default deny로 자동 보안
- service_role 사용 영역 제한 → 키 유출 위험 격리
- learning_attempts append-only → 위조 방어
- 87 golden + 7 RLS adversarial = 94 case로 자동 회귀 가능

### Negative

- service_role 의존도 증가 — Edge Functions 작성 부담
- support 역할은 M5 운영 어드민 도입 시 추가 작업 (JWT custom claim)
- RLS 정책 SQL 작성 비용 (~1-2 sprint day)

### Neutral

- 정책 변경은 migration 파일로 추적 (`infra/supabase/migrations/0002_rls.sql`)

---

## Validation

| 시점 | 검증 |
|---|---|
| M2-S2 (W6) | 13 테이블 RLS 정책 SQL 작성 + DB migration 적용 |
| M2-S3 (W7) | RLS-ADV-001~005 단위 테스트 통과 |
| M3 (W13) | 7 RLS adversarial fixtures/adversarial/rls/ 작성 + evaluation runner 통합 |
| M4 (W15) | 보안 심사 통과 (외부 펜테스트 없으나 self-audit) |

---

## Reversal Triggers

- Supabase RLS 성능 저하 (p95 > 100ms 추가) → 일부 정책 단순화 검토
- support 역할 도입이 M5보다 일찍 필요 → JWT custom claim 사전 작업
- service_role 키 유출 시 → 즉시 rotation + ADR 수정

---

## References

- DOMAIN_MODEL.md §5 — 5층 매핑
- ADR-0001 — Supabase 채택
- SERVICE_REVIEW_QA §4 CC2-03 / Q-BE-NEW-001 — RLS 매트릭스 요구사항
- Supabase RLS docs (외부 — 표준 패턴)

---

## Change Log

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-08 | M2-S1 v1.0 — 13 테이블 × 5 역할 × 4 CRUD 매트릭스 + 7 adversarial 정의 | backend + security (orchestrator 승인) |
