# M3-W15 Security — RLS Hybrid Plan + adversarial 5건 + audit_log Alert (paper)

- **Agent**: security (Senior Security & Privacy Specialist)
- **Commit SHA**: m3-w15-security
- **Branch / Worktree**: feat/m3-w15-rls-audit-alert / (security worktree)
- **사이클**: M3 W15 (2026-05-11)
- **작업 목표**:
  1. RLS evaluator hybrid 계획 문서화 (static 본화 한계 + W16 pg_test_role 도입 plan)
  2. adversarial 9건 (RLS-ADV-001~009) 보안 review notes 추가
  3. backend의 신규 RLS-ADV-005~009 매트릭스 cover 판정
  4. audit_log alert paper 설계 — trigger + workflow stub + runbook (실 webhook 미보유, M5 이연 결정)
- **사용한 Skill**: skill-creator(가이드) · root-cause-tracing · prompt-engineering — Senior 보안 페르소나로 매트릭스 / vault / pg_net 도입 평가

---

## 1. 산출물

### 작업 1 — RLS evaluator (backend 협업)
- `docs/security/RLS_EVALUATOR_HYBRID_PLAN.md` — static 한계(helper / EXISTS join / auth.uid substitution / planner 순서) + W16 pg_test_role hybrid 도입 계획
- `fixtures/adversarial/rls/RLS-ADV-001~004.yaml` — 기존 4건에 한 줄 위협 모델 review note prepend
- `fixtures/adversarial/rls/RLS-ADV-005~009.yaml` — 신규 5건 작성 + review note 포함
  - RLS-ADV-005: anon → 비-starter pack word READ (Information Disclosure, tier 우회)
  - RLS-ADV-006: expired entitlement → premium audio READ (EoP)
  - RLS-ADV-007: learning_attempts UPDATE (Tampering, append-only 위반)
  - RLS-ADV-008: cross-user content_reports READ (Information Disclosure)
  - RLS-ADV-009: account_deletion completed_at 셀프 SET (Tampering, soft-delete 우회)

### 작업 2 — audit_log alert (paper 모드)
- `infra/supabase/migrations/0004_audit_triggers.sql` — AFTER INSERT trigger + pg_net.http_post + vault.secrets 조회 + 5분 dedup + sha256 8자 actor hash + paper 모드 가드 (URL NULL 시 no-op)
- `.github/workflows/security-alert-stub.yml` — manual dispatch only (paper / live mode), M5 secret 등록 시 schedule 활성화 가능 구조
- `docs/security/AUDIT_ALERT_RUNBOOK.md` — top 3 alert 우선순위, dedup 5분 윈도, PII hash 정책, M5 활성화 절차, false positive 처리

---

## 2. 결정 (security agent 자율)

### 2.1 신규 RLS-ADV-005~009 매트릭스 cover 판정 — **충분 (W16 1건 보강 권고)**

| ID | 매트릭스 cell | cover 평가 | 비고 |
|---|---|:---:|---|
| 005 | (anon, words/word_translations/distractors, SELECT, tier filter) | OK | EXISTS join 정책의 실측은 W16 pg_test_role에서만 가능 — static은 정책 존재 여부만 검증 |
| 006 | (authenticated, audio_assets, SELECT, expired entitlement) | OK | status enum + period_ends_at 시간 비교 — W16 pg_test_role 필수 |
| 007 | (authenticated, learning_attempts, UPDATE, append-only) | OK | UPDATE policy 부재 = default-deny — static 검출 가능 |
| 008 | (authenticated, content_reports, SELECT, cross-user) | OK | owner-only USING 패턴 — `isOwnerOnlyPredicate`에 reporter_user_id 포함됨 |
| 009 | (authenticated, account_deletion_requests, UPDATE, completed_at 첫 set) | **부분** | USING의 `completed_at IS NULL` 가드는 이미 처리된 row만 차단. 첫 INSERT 후 사용자가 본인이 미래 시각으로 set하는 케이스는 WITH CHECK에 컬럼 제약 없음 → **W16 컬럼 GRANT 분리 또는 trigger 추가 필요** |

**W16 추가 후보** (1건):
- **RLS-ADV-010 (W16)**: `support` role JWT가 정상 발급된 사용자가 audit_log SELECT 시 본인 actor 외 row가 보이는지 검증 — `audit_self_select` policy의 `actor = 'user:' || auth.uid()` 매칭 패턴이 hash 형식 변경(M5)에 따라 깨질 수 있음. support role만 cross-user select 가능해야 함.

**판정 근거**: 9건이 STRIDE 6 카테고리(Spoofing 제외 — RLS 범주 아님) 중 5개를 cover (Tampering 3건, Information Disclosure 3건, EoP 2건, Repudiation 1건, DoS 미적용). 매트릭스 17 tables × 5 roles × 4 CRUD = 340 cell 중 9건이 "정책이 빠지면 즉시 매출/PII 손실"인 hot spot을 정확히 cover. 매트릭스 대표성 OK.

### 2.2 alert 우선순위 (자율)

P0 (즉시 page) 2종 / P1 (5분 dedup, 채널 통지) 2종 / P2 (일배치 요약) 4종. 근거는 runbook §2 참조.
- P0-1: self-entitlement upsert (매출 직접 손실)
- P0-2: audit_log 직접 write (Repudiation, GDPR 통지 산정 근거 소실)
- P1-1: cross-user PII read
- P1-2: anon write 시도

### 2.3 pg_net vs Edge Function (자율) — **pg_net 채택**

근거:
- DB 내부 trigger에서 동기/비동기 HTTP POST 가능 → audit_log INSERT와 동일 트랜잭션 흐름 유지
- Edge Function 호출은 서비스 코드 변경 + 별도 deploy + 비밀 관리 이중화 필요
- pg_net은 Supabase 표준 extension, 1인 개발자 운영 부담 최소
- 단점(timeout 3s, retry 없음)은 alert 도구 특성상 허용 — "발송 실패 시 audit chain은 보존" 원칙 우선

### 2.4 paper 모드 안전장치

- vault.secrets에서 URL 읽음 → NULL 또는 빈 문자열이면 trigger 본문 early return
- dedup 테이블은 정상 INSERT (M5 활성화 시 즉시 정상 동작)
- workflow_dispatch input `mode=paper` 기본값 → 실수로 live 발송 방지

---

## 3. 변경/신규 파일

- `docs/security/RLS_EVALUATOR_HYBRID_PLAN.md` (신규)
- `docs/security/AUDIT_ALERT_RUNBOOK.md` (신규)
- `infra/supabase/migrations/0004_audit_triggers.sql` (신규)
- `.github/workflows/security-alert-stub.yml` (신규)
- `fixtures/adversarial/rls/RLS-ADV-001~004.yaml` (review note prepend)
- `fixtures/adversarial/rls/RLS-ADV-005~009.yaml` (신규 5건)
- 본 context 파일

---

## 4. 의존성 / blocker

- **backend**: `scripts/eval/rls.ts` static 본화 + adversarial 9건 evaluator 실행 (W15 동시 작업 중) — 본 PR과 분리 commit
- **devops**: M5에 GitHub Secrets `SLACK_SECURITY_WEBHOOK` 등록 — W15에는 미발생
- **architect**: hybrid 결정의 ADR 등록(부록 또는 ADR-0005 신규) — W16 mid-sprint 회람
- **차단 항목 없음** — paper 모드는 W15 commit 가능

---

## 5. 다음 추천 액션

1. (W16 D-1) pg_test_role 시드 fixture `fixtures/seed/rls-eval/` 작성
2. (W16 D-2) `evaluatePgTest` driver 구현 + RLS-ADV-009 컬럼 GRANT 분리 / trigger 추가
3. (W16 D-3) RLS-ADV-010 (support role audit_log cross-user) 추가
4. (W16 D-4) hybrid 결정 ADR 초안 architect 회람
5. (M5 D-1) Slack #security 채널 + webhook 발급 → secret 등록 → live mode dry-run

---

## 6. 리스크 / 후속

- **R-23 해소 진행**: 9건 작성 완료, evaluator 본화는 backend 협업. exit criterion (9건 100% pass)는 backend evaluator 완료 후 확인.
- **R-25 (CI 안정성, 중간)**: pg_test_role nightly 도입 시 docker 의존 — mitigation: PR opt-in label + nightly 우선
- **R-26 (webhook URL 노출, 낮음)**: M5 활성화 시 GitHub Secrets + Vault 이중 보관, 분기별 rotation
- **R-27 (audit emit 누락, 중간)**: `_shared/audit.ts` 통합은 backend가 W16에 진행 — grep guard CI rule 추가 권고
- **R-30 신규 (낮음)**: paper 모드의 dedup 테이블이 INSERT만 되고 cleanup은 cron 미등록 → W15 시점 무한 누적 가능. mitigation: M5 직전 수동 TRUNCATE 또는 1주 내 cron 등록.

---

## 7. 보안 의견 요약 (호출자에게)

1. **RLS hybrid는 W16 P0** — static 단독은 매트릭스 cover까지만 신뢰 가능, 실측 false negative 잔존 (특히 EXISTS join + helper 함수 + auth.uid() substitution)
2. **신규 5건 cover 판정**: 충분. 매트릭스 hot spot 정확히 cover, STRIDE 5/6 카테고리 cover. RLS-ADV-009만 W16 컬럼 GRANT/trigger 보강 필요.
3. **alert paper 모드는 안전**: vault NULL → trigger no-op, dedup row만 유지. M5 활성화는 secret 등록 + Vault 등록 두 단계만으로 즉시 가능.
4. **PII 평문 금지 원칙 강제**: trigger 내 sha256 hash + grep guard CI rule (M5)로 이중 방어.

---

## 부록 A. 12항목 readiness 자가 진단 (W15 종료 시점)

| # | 항목 | 상태 |
|---:|---|:---:|
| 1 | RLS 매트릭스 SoT 확보 | ✅ |
| 2 | 평가 매트릭스 명시 (9건 대표) | ✅ |
| 3 | 평가 환경 결정 (static W15 / pg_test W16) | ✅ |
| 4 | adversarial fixture 9건 schema 일관 | ✅ |
| 5 | service_role evaluator 사용 금지 | ✅ |
| 6 | audit_log INSERT 경로 통합 | △ (backend W16) |
| 7 | Slack webhook URL 시크릿 | △ (M5) |
| 8 | alert 폭주 방지 (5분 dedup) | ✅ |
| 9 | false positive 처리 정책 | ✅ |
| 10 | M3 게이트 정합성 | ✅ |
| 11 | M4 brake 조건 식별 | ✅ |
| 12 | 결정의 ADR 등록 필요성 | △ (W16) |

---

**끝.**
