# RLS Evaluator — Hybrid Plan (Static + pg_test_role)

- **Author**: security agent (Senior Security & Privacy Specialist)
- **Date**: 2026-05-11 (M3 W15)
- **Related**: ADR-0003 (Evaluator Harness), ADR-0004 (RLS Matrix), `scripts/eval/rls.ts`
- **Status**: Hybrid 결정 — W15 static 본화 + W16 pg_test_role 도입
- **Cycle**: M3 W15 (작업 1)

---

## 1. 배경

W15 시점 `scripts/eval/rls.ts`는 **static SQL 분석** 단독 모드.
- `infra/supabase/migrations/0002_rls.sql`을 정규식으로 파싱
- adversarial fixture (`fixtures/adversarial/rls/RLS-ADV-001~009.yaml`)와 매칭
- (attacker_role, table, operation) 별 정책 후보 추출 → owner-only USING/WITH CHECK 패턴 검사

**보안 결론**: static 단독은 **매트릭스 cover 점검**에 적합하지만, **실제 block 여부 검증에는 false positive/negative가 구조적으로 존재**한다. W16에서 pg_test_role 기반 실측 모드를 추가하여 hybrid로 운영해야 한다.

---

## 2. Static SQL 분석의 한계 (W15 본화 모드)

### 2.1 helper 함수 런타임 evaluation 재현 불가

`is_support()` 같은 SECURITY DEFINER 함수의 런타임 결과를 static parser는 알 수 없다.

```sql
CREATE POLICY profile_support_select ON profiles FOR SELECT USING (is_support());
```

- static: `is_support()`가 무엇을 반환하는지 모름 → role=`all`, USING expression이 owner-only가 아니므로 "anyone reads" 로 오판 가능
- 현재 evaluator는 `rolesMatch`에서 policy.role을 토큰 매칭만 함 → support만 통과시키는 정책을 매트릭스에서 누락 가능
- **false negative 위험**: support 권한이 부적절하게 다른 role에 grant되어도 static은 검출 못 함

### 2.2 EXISTS join 정책의 실제 결과 추정 불가

`words_anon_select`, `wt_anon_select`, `distractors_anon_select`, `audio_authenticated_select`는 모두 EXISTS 서브쿼리에 의존:

```sql
CREATE POLICY words_anon_select ON words FOR SELECT TO anon
  USING (
    retired_at IS NULL
    AND EXISTS (
      SELECT 1 FROM word_pack_members wpm
      JOIN word_packs wp ON wp.pack_id = wpm.pack_id
      WHERE wpm.word_id = words.word_id AND wp.tier = 'starter'
    )
  );
```

- static parser는 EXISTS 서브쿼리의 join 결과를 시뮬레이션 못 함
- RLS-ADV-005 (anon → 'core_a1' pack의 word READ)에서 실제 차단 여부는 **word_pack_members 시드 데이터에 의존** — static은 "policy 존재함" 까지만 검증
- **false positive 위험**: 시드가 잘못되어 비-starter word가 starter pack에 매핑되어도 static은 통과 판정

### 2.3 auth.uid() / auth.jwt() substitution 누락

현재 `isOwnerOnlyPredicate`는 정규식으로 `auth.uid()=user_id` 등 4개 패턴만 cover:

```ts
return /auth\.uid\(\)=user_id|user_id=auth\.uid\(\)|auth\.uid\(\)=merged_to_user_id|auth\.uid\(\)=reporter_user_id/.test(normalized);
```

- 새로운 owner-only 컬럼명(예: `subscriber_user_id`, `actor_user_id`)이 추가되면 정규식 업데이트 필요 — **누락 시 owner-only가 아닌 정책으로 오판 → 차단되는데 evaluator는 "통과" 판정 = false positive**
- `auth.jwt()->>'role'`, `current_setting('request.jwt.claims', true)` 같은 다른 substitution은 미지원

### 2.4 Postgres planner의 RLS 적용 순서 미시뮬레이션

- SELECT 시 USING이 평가되고, INSERT 시 WITH CHECK가, UPDATE 시 USING+WITH CHECK 모두 평가
- 현재 evaluator는 operation 분기를 단순화하여 `WITH CHECK` only 정책의 INSERT 차단만 처리
- **RLS-ADV-009 (account_deletion_requests의 completed_at 첫 set)**: USING의 `completed_at IS NULL` 가드는 이미 처리된 row만 차단함. 사용자가 첫 INSERT 후 본인이 completed_at을 미래 시각으로 set하는 케이스는 WITH CHECK에 컬럼 제약 없으므로 **통과될 수 있음 — static은 검출 못 함**. trigger/컬럼 GRANT 분리가 W16 후속 필요.

### 2.5 default-deny 판정의 한계

매칭 정책 0건이면 default-deny로 판정하고 있으나:
- 실제로는 GRANT 자체가 누락된 경우와, RLS는 통과하지만 컬럼 권한이 없는 경우가 다른 에러 코드를 반환
- HTTP status 401 vs 403 vs 200+0row의 실제 동작은 PostgREST 버전/설정 의존 — static 추정은 best-effort

---

## 3. W16 pg_test_role Hybrid 도입 계획

### 3.1 실행 환경

- **Local Supabase docker** (CI: `supabase/setup-cli` action + `supabase start`)
- Migration `0001_init.sql` + `0002_rls.sql` + `0003_rpc.sql` 적용
- 시드: `fixtures/seed/rls-eval/` (신규 생성 예정)
  - users: anon, user1 (`11111111-...`), user2 (`22222222-...`), support (custom JWT claim)
  - word_packs: 'starter' tier 1건, 'core_a1' tier 1건
  - word_pack_members 매핑
  - subscription_entitlements: user1(active), user2(expired), 신규 user3(grace_period)
  - audio_assets: 'free' 1건, 'premium' 1건
  - learning_attempts: user1 본인 1건 (UPDATE 시도 대상)
  - account_deletion_requests: user1 진행중 1건

### 3.2 평가 모드

```ts
// scripts/eval/rls.ts (W16 확장)
type RlsMode = "static" | "pg_test";

function evaluateRlsCase(c: RlsAdvCase, mode: RlsMode = "static"): EvalResult {
  if (mode === "pg_test") return evaluatePgTest(c);
  return evaluateStatic(c);
}
```

- `evaluatePgTest`: 시드된 user의 JWT로 supabase-js 클라이언트 생성 → fixture의 SQL/endpoint 그대로 실행 → row_count, status, error code 비교
- service_role은 **prepare(시드 cleanup/restore) 단계에서만 사용**, 공격 시도 호출에는 절대 사용 금지

### 3.3 CI 운영 — Dual Track

| Track | 트리거 | 시간 | 범위 | 게이트 |
|---|---|---|---|---|
| `eval:rls:static` | 모든 PR | <5s | 9건 모두 + 매트릭스 missing-policy lint | PR 차단 |
| `eval:rls:pg_test` | nightly + PR label `run-rls-adversarial` | 60-90s | 9건 실측 | nightly 실패 시 #security alert (M5 webhook 등록 후) |

**근거**:
- static은 빠르고 안정적 → PR 단계 회귀 차단 (정책 누락/role 오타 등)
- pg_test는 docker 기동 + migration 적용으로 무겁지만 production-faithful → nightly + opt-in
- 두 track 모두 9건 100% pass가 M3 게이트

### 3.4 missing-policy lint (static 보조 활용)

static의 강점은 **매트릭스의 빈 cell 검출**. W16에 추가:
- 17 tables × 5 roles × 4 CRUD = 340 cell 매트릭스 생성
- 각 cell에 매칭되는 policy 개수 출력
- expected matrix (ADR-0004 §3) 와 diff → 신규 정책 누락 검출

### 3.5 pg_test 도입 시 신규 위험

- **R-25 (W15 readiness §7)**: local Supabase docker 의존이 CI 안정성에 영향 → nightly 분리로 mitigation
- **R-28 신규**: 시드 데이터의 신뢰성 — 시드가 틀리면 pass 했어도 가짜 신뢰. fixture에 시드 hash 기록 필요
- **R-29 신규**: pg_test_role JWT 만료 — 5분 short-lived, evaluator가 발급 직전 갱신

---

## 4. W15 → W16 인계 체크리스트

- [x] `scripts/eval/rls.ts` static 본화 (backend가 W15 commit)
- [x] adversarial 9건 yaml + security review notes (본 W15 commit)
- [x] 본 hybrid plan 문서 (본 W15 commit)
- [ ] (W16) pg_test_role 시드 fixture `fixtures/seed/rls-eval/`
- [ ] (W16) `evaluatePgTest` driver 구현
- [ ] (W16) `eval-nightly.yml` rls:pg_test job 추가
- [ ] (W16) missing-policy lint static 확장
- [ ] (W16) RLS-ADV-009 검증 후 컬럼 GRANT 분리 또는 trigger 추가 (account_deletion_requests.completed_at)
- [ ] (W16) ADR-0005 또는 ADR-0003 부록으로 hybrid 결정 등록 (architect 회람)

---

## 5. 결정 (security agent 자율)

1. **W15 commit 범위**: static 본화 + adversarial 9건 + 본 hybrid plan. PR-block은 static만.
2. **pg_test_role은 W16 P0**: M3 게이트(W16) 진입 전 도입. 미도입 시 매출·PII 영역(ADV-003/006/008) false negative 잔존.
3. **service_role evaluator 사용 금지 원칙 유지**: prepare는 service_role / 공격 시도는 anon|authenticated JWT.
4. **alert 채널은 M5 이연** (orchestrator 결정) — webhook URL 없이 trigger + workflow stub만 W15에 작성. 실제 alert 발송은 M5 secret 등록 후.

---

**끝.**
