# M3-W15 Backend Readiness Self-Diagnosis

- **Agent**: backend (시니어 백엔드 엔지니어, mju.jykim@gmail.com)
- **사이클**: M3 W15 (RLS evaluator + Payment 잔여 8건 + 콘텐츠 라이프사이클 보강)
- **작성일**: 2026-05-11 22:00 KST
- **선행 rollup**: `context/rollups/20260511-M3-W14-evaluators-and-ci.md`
- **상태**: W15 진입 가능 (차단 없음, dependency는 §11 참고)

---

## 1. 역할 (Role)

W15에서 backend가 책임지는 표면:

- **RLS evaluator 본화** — W14에 prototype `scripts/eval/rls.ts`(static SQL 분석)이 들어왔으나 placeholder 수준. W15에서 RLS adversarial 9 case가 nightly + PR strict에서 fail-loud하게 돌도록 본화한다.
- **Payment golden 잔여 8건 채움** — `fixtures/golden/payment/PAY-004/005/007/009/011/013/014/015.yaml` 의 input/expected를 `_shared/billing.ts` SoT 기준으로 채우고, README "W14-2차" 칸 → "W15" 칸으로 재라벨.
- **`_shared/billing.ts` 안정성 유지** — webhook + evaluator import 양쪽이 깨지지 않도록 type/shape freeze. 신규 RC 이벤트 추가 시 ADR 마이너 갱신 룰 수립.
- **(보조)** content evaluator의 distractors_unique를 DB seed 후 retire/replace 변경 시까지 검증하도록 R-24 보강안 sketch (실 작업은 content agent + analytics).
- **(보조)** R-12 esm 빌드 통합은 W16 후보로 유지. W15에서는 결정 보류 표시만.

## 2. 사이클 목표 (Goal)

W15 종료 시 다음 4개 상태 달성:

1. RLS evaluator가 PR CI(`eval-on-pr.yml`)와 `eval-nightly.yml` cron 양쪽에서 strict 모드로 9 RLS adversarial case를 실행하여 모두 pass.
2. `pnpm eval:payment --strict` 가 누적 15건 모두 pass (W14 7 + W15 8). README 분포 표 100% 달성 표기.
3. RLS 정책 매트릭스(`infra/supabase/migrations/0002_rls.sql`) 변경 시 evaluator drift를 자동 감지(파서 fail-loud, 미매핑 정책 카운트 출력).
4. R-23 (RLS 회귀 못 잡음) 리스크 등급 → 해소(closed). R-22는 W14에 이미 해소.

## 3. 완료 (Done — W14 carryover)

- `apps/api/edge-functions/_shared/billing.ts` SoT 추출 + webhook import 정합 ✅
- `scripts/eval/payment.ts` 7 case 통과 (mapping 4 / idempotent 1 / signature 1 / premium_active 1) ✅
- W14 commit에 `scripts/eval/rls.ts` static 파서 prototype 동봉 (placeholder, runner 라우팅 연결됨) ✅
- RLS adversarial 4 case YAML 봉인 (`RLS-ADV-001~004`) ✅
- `eval-nightly.yml` 에 RLS skeleton job 자리 잡혀 있음 (manual dispatch만, cron disabled) ✅

## 4. 진행 중 (In progress)

- **Payment 잔여 8건 fixture 파일은 디스크에 생성되어 있으나** (`PAY-004/005/007/009/011/013/014/015.yaml`) input/expected 검증은 본 사이클에서 한 번 더 SoT 대조 필요. 현재는 `mapStatus` / `isPremiumActive` 경로 기준으로 구조만 잡힌 상태.
- RLS evaluator 결정(§6)에 따라 W15 1차 commit에서 static-only 본화 vs static + supatest hybrid 분기 결정 직전 단계.

## 5. 차단 (Blocked)

- **없음.** W15 backend 작업은 W14 산출물(billing.ts SoT, runner.ts 라우팅, 0002_rls.sql, RLS-ADV fixture 4건)만으로 시작 가능.
- 단, supatest 도입(§6 옵션 B)을 채택할 경우 **devops가 CI에 Supabase ephemeral DB(서비스 컨테이너) 부팅을 추가해야 함** — 이는 §11 의존성에 등록.

## 6. 신규 결정 (RLS evaluator 접근 — Decision Record)

### 옵션 비교

| # | 접근 | 장점 | 단점 | 비용/시간 |
|---|---|---|---|---|
| A | **Static SQL 분석 강화** (현 W14 prototype 본화) — 0002_rls.sql 파서 + adversarial fixture를 정책 매트릭스에 매핑 | 외부 의존 0, CI에서 ms 단위 실행, drift 즉시 탐지(미매핑 정책 fail-loud), nightly cron 즉시 켤 수 있음 | 실제 PostgREST/RLS 동작과 1:1 보장 못함, `is_support()` JWT custom claim·EXISTS 서브쿼리는 의미 분석 필요 | S (W15 내) |
| B | **pg_test_role 스타일 SQL assertion** — Supabase ephemeral DB 부팅 후 `SET LOCAL ROLE` + `SET request.jwt.claims` 으로 실제 정책 실행 | RLS의 진짜 의미(EXISTS, USING + WITH CHECK 조합) 검증, regression 신뢰도 최고 | CI 컨테이너 부팅 30~60s, devops 의존, pg_tap or 직접 SQL harness 추가 필요 | M (W15-W16 걸침) |
| C | **supatest (or supabase-js + service_role mock)** — Edge Function 호출 단으로 우회 | 실제 RPC + JWT 흐름 검증 | RLS 단위가 아니라 통합 테스트, false negative 위험(Edge Function 자체 버그 섞임), evaluator 책임 경계 흐려짐 | M, ROI 낮음 |

### 결정: **A 본화 + B를 W16에 phase-2로 추가 (hybrid).**

근거:
1. W14 prototype에 이미 A 골격이 존재(`scripts/eval/rls.ts`). owner-only 술어 인식, role 매칭, default-deny fall-through 모두 구현됨. 본화 비용이 낮고 W15 안에 끝낸다.
2. RLS adversarial 4 case 모두 A로 결정 가능(다른-user SELECT, anon INSERT, self-entitlement UPSERT, audit_log tampering 모두 정책 존재/술어 owner-only/role 거부의 조합).
3. B(실 DB)는 가치는 있지만 CI에 컨테이너 부팅을 도입하는 결정은 backend 단독으로 내릴 수 없고 devops와 ADR 필요. W16에 별도 ADR-0007(예정) "RLS regression DB harness"로 격리.
4. 양쪽을 같은 evaluator 인터페이스(`evaluateRlsCase(c)`)로 유지하여 `--mode=static|supatest` 플래그로 전환 가능하도록 설계.

### A 본화 시 W15에서 backend가 하는 구체 작업

1. `parsePolicies()` 강화: 현재 정규식이 한 줄 형태만 파싱 가능 → 0002_rls.sql 의 multi-line `USING (... )`, multi-line `WITH CHECK ( ... )` 모두 캡처. `EXISTS (SELECT 1 FROM ...)` 절은 raw text 보존.
2. `isOwnerOnlyPredicate()` 외에 `isPackTierFreePredicate()`, `isEntitlementSubqueryPredicate()`, `isSupportPredicate()` 분류기 추가 — 정책 의도 라벨링.
3. **미매핑 정책 fail-loud**: 0002_rls.sql 의 모든 정책이 1개 이상 분류기에 매칭되어야 evaluator가 ready. 미매핑 1건이라도 있으면 RLS evaluator startup fail (drift 즉시 알림).
4. `RlsAdvCase.input.attacker_role` 에 `service_role` 케이스 추가 — webhook 정상 흐름이 차단되지 않는지 negative-of-negative case 1건 추가 (RLS-ADV-005 후보).
5. `runner.ts` 의 `evalcategory === "rls"` 가 fixture가 0건일 때 skip이 아닌 ready=false 로 표시되도록 가드 추가(`--strict` 와 conjunction).
6. `eval-nightly.yml` 의 RLS job cron 활성화(현재 manual dispatch만) — devops PR로 enable.

## 7. 신규 리스크 (Risks)

| ID | 리스크 | 등급 | 대응 |
|---|---|---|---|
| R-25 | RLS static 분석이 EXISTS 서브쿼리 의미를 단순화 → 실제 `audio_assets` 의 entitlement EXISTS 절을 owner-only로 잘못 분류 | 중 | §6 옵션 A에서 분류기를 named pattern으로 분리하여 EXISTS 절은 별도 예측, W16 옵션 B 도입 시 cross-check |
| R-26 | Payment 잔여 8건 작성 시 `mapStatus` 표(`_shared/billing.ts`) 의 SUBSCRIBER_ALIAS = "active" 분기 의도가 모호 → expected 작성 시 잘못 봉인할 위험 | 낮 | analytics + orchestrator 와 1회 Q 확인 (Q-BE-W15-001로 §11 등록), README의 SUBSCRIBER_ALIAS 행 주석화 |
| R-27 | `is_support()` 정책이 W15 시점엔 JWT custom claim 미발급 (M5 도입 예정) → support_select 정책이 false 상수로 평가되어 RLS adversarial에서 의도와 다른 결과 | 낮 | evaluator는 정책 존재 사실만 검증 — 동작은 M5 통합 시 phase-2(B)로 검증한다고 ADR에 명시 |

## 8. Skill 사용 (강제 + 선택)

| Skill | 용도 | 본 사이클 사용처 |
|---|---|---|
| TDD (강제) | RLS 파서 강화 시 unit spec 우선 | `scripts/eval/rls.spec.ts` 신규 (parsePolicies 14건 정책 모두 파싱 단언, isOwnerOnlyPredicate truth table) |
| root-cause-tracing (강제) | Payment 잔여 fixture가 fail 시 mapStatus 결정표 vs README 모순 추적 | PAY-007 REVOKE / PAY-009 idempotent_new / PAY-013 billing_retry 24h 경계 |
| prompt-engineering (강제) | RLS evaluator의 `--mode` flag 메시지 + diff 형식이 reviewer가 즉시 readable 한지 | runner stdout `[rls] N pass / N fail` 라인의 reason 메시지 컨벤션 |

## 9. 다음 작업 (Next concrete actions, 순서)

1. `scripts/eval/rls.spec.ts` 작성 (RED) — parsePolicies로 0002_rls.sql 의 모든 CREATE POLICY 줄을 N개 잡는다는 단언, isOwnerOnlyPredicate 4 패턴 truth table.
2. `parsePolicies` multi-line 강화 (GREEN) → spec 통과.
3. 정책 분류기(owner-only / pack-tier-free / entitlement-subquery / support / append-only) 추가 + "미매핑 0건" 단언 추가.
4. RLS adversarial case 9건(현 4건 + 신규 5건 후보) 의 input.attacker_role × target.table × operation 매트릭스 정합 검증.
5. Payment 잔여 8건 fixture 의 input/expected 를 `mapStatus` / `isPremiumActive` 동작에 맞춰 채움 + runner pass.
6. `.github/workflows/eval-nightly.yml` RLS cron 활성화 PR (devops PR review).
7. R-23 closed, R-25/26/27 open으로 SWARM_LEDGER 갱신.
8. W15 종료 시 mini-rollup `context/rollups/20260518-M3-W15-rls-and-payment.md` 작성 협조.

## 10. 예상 산출물 (Artifacts)

- `scripts/eval/rls.ts` — 본화 (parser 강화 + 분류기 + mode flag)
- `scripts/eval/rls.spec.ts` — 신규 (vitest unit)
- `fixtures/adversarial/rls/RLS-ADV-005-service-role-positive.yaml` — 신규 (negative-of-negative)
- `fixtures/adversarial/rls/RLS-ADV-006-anon-pack-tier-cross-pack.yaml` — 신규 (anon이 starter 외 pack 단어 SELECT 시도)
- `fixtures/adversarial/rls/RLS-ADV-007-other-user-attempt-insert.yaml` — 신규 (cross-user INSERT WITH CHECK 차단)
- `fixtures/adversarial/rls/RLS-ADV-008-uws-direct-update.yaml` — 신규 (UPDATE policy 부재 → 차단)
- `fixtures/adversarial/rls/RLS-ADV-009-deletion-request-after-completed.yaml` — 신규 (`completed_at IS NOT NULL` 시 UPDATE WITH CHECK 거부)
- `fixtures/golden/payment/PAY-004/005/007/009/011/013/014/015.yaml` — 8건 본화 (Payment 잔여 분포안은 §10.1)
- `fixtures/golden/payment/README.md` — 분포 표 갱신 (W15 칸 → ✅)
- `.github/workflows/eval-nightly.yml` — RLS cron uncomment (devops 협업)
- `context/rollups/20260518-M3-W15-rls-and-payment.md` — W15 종료 rollup 기여분

### 10.1 Payment 잔여 8건 분포안 (Decision)

목표: 누적 15건 = README 분포 표 100% 달성. 분류기 라벨은 `PaymentCase.category` 값과 1:1.

| ID | category | 시나리오 | 핵심 단언 | _shared/billing.ts 경로 |
|---|---|---|---|---|
| PAY-004 | mapping | `CANCELLATION` (will_renew=false, period 진행 중) → status=cancelled | mapStatus("CANCELLATION") === "cancelled" | switch CANCELLATION |
| PAY-005 | mapping | `EXPIRATION` → status=expired | mapStatus("EXPIRATION") === "expired" | switch EXPIRATION |
| PAY-007 | mapping | `REVOKE` (가족공유 회수, 즉시 무효) → status=revoked | mapStatus("REVOKE") === "revoked" | switch REVOKE |
| PAY-009 | idempotent | last_rc_event_id 가 db_last_rc_event_id 와 다름 → outcome=applied, http=200 | applied 분기 | idempotent if 분기 |
| PAY-011 | billing_retry_window | status=billing_retry, last_synced_at < 24h before now → is_premium=true | isPremiumActive billing_retry 24h 통과 | switch billing_retry |
| PAY-013 | billing_retry_window | status=billing_retry, last_synced_at = 25h before now → is_premium=false | 24h 경계 초과 강등 | switch billing_retry |
| PAY-014 | cancellation_until_period_end | status=cancelled, period_ends_at = now + 5d → is_premium=true | cancelled 정책 | switch cancelled |
| PAY-015 | cancellation_until_period_end | status=cancelled, period_ends_at = now - 1d → is_premium=false | period 만료 후 강등 | switch cancelled |

확인 후 카테고리 분포 누계:
- mapping 6 (W14: PAY-001/002/003/006 = 4 + W15: PAY-004/005/007 = 3 → **합 7**) — README 목표 6 vs 실제 7. 이는 README 의 W14-1차 mapping 카운트와 PAY-006 정의 모순 가능성. **§11 Q-BE-W15-002로 orchestrator 확인.**
- idempotent 2 (W14: PAY-008 + W15: PAY-009)
- signature 2 (W14: PAY-010 + W15: 잔여 없음 — PAY-010 단독, README의 signature=2 목표면 +1 case 필요. **§11 Q-BE-W15-002 동일 항목으로 정정 요청.**)
- premium_active 2 (W14: PAY-012 + W15: 신규 ID 필요 시 PAY-016 추가)
- grace_period 1 (W14: PAY-003 가 mapping+grace 겸용일 가능성 — README 카운트 모순)
- billing_retry_window 2 (PAY-011/013)
- cancellation_until_period_end 2 (PAY-014/015)

> **결정**: 분포 표 정합은 §11 Q-BE-W15-002로 orchestrator + analytics에 1회 raise → 답신 도착 후 PAY-016/017 추가 여부 결정. 본 사이클에서는 일단 **위 8건을 1차로 본화**하고, 추가 필요 시 W15 후반에 PAY-016/017 (signature happy path + premium_active grace edge) 보강.

## 11. 다른 agent 의존 (Dependencies)

| 누구 | 무엇 | 마감 | 우회 가능? |
|---|---|---|---|
| orchestrator | Q-BE-W15-001 (SUBSCRIBER_ALIAS = "active" 분기 의도 확인) | W15 D-2 | Yes — 보수적으로 "ignored at caller"로 봉인하고 PAY case 작성 안 함 |
| orchestrator + analytics | Q-BE-W15-002 (Payment README 분포 카운트 정정 vs PAY-016/017 추가 필요 여부) | W15 D-3 | Yes — 8건 본화 후 추가는 W15 후반에 결정 |
| security | RLS adversarial 신규 5건(RLS-ADV-005~009)의 위협모델 라벨 review | W15 D-3 | Yes — backend 가 STRIDE 라벨 임시 부착 후 security가 adjust |
| devops | `eval-nightly.yml` RLS cron 활성화 PR review + 옵션 B 도입 시 Supabase 컨테이너 service in CI | W15 D-5 / W16 | Yes (cron uncomment), No (B는 W16) |
| qa | runner stdout RLS reason 메시지 가독성 review | W15 D-5 | Yes — 차주로 미룰 수 있음 |

## 12. 종료 조건 (Definition of Done)

W15 backend 작업이 완료되었다고 선언하는 기준 7개 모두 ✅ 일 때:

1. `pnpm tsx scripts/eval/runner.ts --category=rls --strict` 가 9 case (RLS-ADV-001~009) 모두 pass.
2. `pnpm tsx scripts/eval/runner.ts --category=payment --strict` 가 15 case (PAY-001~015) 모두 pass.
3. `scripts/eval/rls.spec.ts` vitest 통과 + parsePolicies가 0002_rls.sql 의 모든 CREATE POLICY 를 1개도 누락 없이 파싱(미매핑 0건).
4. `_shared/billing.ts` 의 export shape (mapStatus signature, isPremiumActive signature, RcEventType, EntitlementStatus union) 무변경 — webhook + evaluator 양쪽 import 정합 유지.
5. `eval-nightly.yml` RLS job cron 활성화 PR이 devops review 통과되어 main에 머지.
6. R-23 (RLS 회귀 못 잡음) SWARM_LEDGER에서 closed, R-25/26/27 open으로 등록.
7. W15 rollup `context/rollups/20260518-M3-W15-rls-and-payment.md` 의 backend 섹션에 본 context 파일 링크 + 산출물 목록 반영.
