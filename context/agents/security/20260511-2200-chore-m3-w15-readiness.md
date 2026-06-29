# M3-W15 Security Readiness — RLS Evaluator + audit_log Alert 채널

- **Agent**: security (Senior Security & Privacy Specialist)
- **Commit SHA**: m3-w15-pre (W15 진입 직전 readiness 자가 진단)
- **Branch / Worktree**: chore/m3-w15-security-readiness / (security worktree)
- **사이클**: M3 W15 (2026-05-11 작성 — W14 종료 직후, W15 진입 전)
- **작업 목표**:
  1. RLS evaluator 평가 접근(static SQL 분석 vs pg_test_role) 보안 관점 의견 제시
  2. R-23(RLS adversarial 9건 skip) 해소를 위한 W15 작업 범위/책임 분담 명확화
  3. audit_log 위반 시도 alert 채널(Slack #security webhook) 우선순위 설계
  4. W14 발견 부수 issue 중 W15에 다뤄야 할 신규 리스크 후보 식별
- **사용한 Skill**: skill-creator(가이드) · root-cause-tracing(방법론) · prompt-engineering — Senior 보안 페르소나로 ADR-0004 / RLS 매트릭스 / adversarial fixtures 4건 cross-read
- **참조 문서**:
  - `context/rollups/20260511-M3-W14-evaluators-and-ci.md` §3, §8, §9
  - `infra/supabase/migrations/0002_rls.sql` (RLS 매트릭스 13×5×4, 17 ENABLE)
  - `fixtures/adversarial/rls/RLS-ADV-001~004.yaml`
  - `docs/adr/ADR-0004-rls-policies.md` (default-deny + append-only + service_role-write-only)
  - `context/agents/backend/20260508-1100-feat-m2-s1-adr-0004-rls.md`

---

## 1. W15 본인 작업 큐 (orchestrator 배정 확인)

| 작업 | 책임 분담 | 우선순위 | 산출물 위치 |
|---|---|---:|---|
| RLS evaluator (`scripts/eval/rls.ts` 신규 + runner.ts 라우팅 활성화) | security(설계) + backend(구현) | P0 | `scripts/eval/rls.ts` |
| 잔여 RLS adversarial 5건 (W14에 4건 → 매트릭스 대표 9건 채움) | security + qa | P0 | `fixtures/adversarial/rls/RLS-ADV-005~009.yaml` |
| audit_log 위반 시도 alert 채널 연결 (Slack #security webhook) | security + devops | P1 | `apps/api/edge-functions/_shared/audit.ts` + `infra/alerts/slack-security.md` |
| `eval-nightly.yml` cron RLS job 활성화 (devops와 connect) | security 검토 → devops 활성화 | P1 | `.github/workflows/eval-nightly.yml` |
| audit_log self-tampering 탐지 (RLS-ADV-004 시나리오의 INSERT 시도 자체를 별도 chain에 기록) | security | P2 | `_shared/audit.ts` 함수 추가 |

## 2. 12항목 readiness 자가 진단

| # | 항목 | 상태 | 메모 |
|---:|---|:---:|---|
| 1 | 진입 작업의 SoT(Source of Truth) 확보 — RLS 정책 SQL 위치 명확? | ✅ | `infra/supabase/migrations/0002_rls.sql` 단일 위치, 5 역할 × 13 테이블 매트릭스 ADR-0004와 1:1 |
| 2 | 평가 대상(role / table / CRUD) 매트릭스 명시 | ✅ | ADR-0004 §3에 13×5×4 = 260 cell. 단, 본 sprint에선 대표 9 case만 sealing |
| 3 | 평가 환경(local vs staging vs CI) 결정 | △ | **§6 결정 필요** — pg_test_role은 local Supabase 필수, static 분석은 CI에서 부하 0. 혼합안 권장 |
| 4 | adversarial fixture 포맷이 evaluator와 호환 | ✅ | YAML 4건 모두 `attacker_role / payload / expected.{blocked, http_status, audit_logged}` 동일 schema |
| 5 | service_role 키 노출 위험 점검 | ⚠️ | evaluator가 service_role을 쓰면 안 됨 — anon/authenticated JWT만 사용. 별도 로컬 .env 분리 필요 |
| 6 | audit_log INSERT 경로(서비스 코드)가 evaluator 시뮬레이션 가능? | △ | 현재 webhook 외 audit emit 지점이 흩어져 있음 — `_shared/audit.ts` 통합 필요(W15 부수 작업) |
| 7 | Slack #security webhook URL 시크릿 관리 | △ | 채널은 존재하나 webhook URL 미발급 — devops에 P1으로 요청, GitHub Secrets `SLACK_SECURITY_WEBHOOK` 등록 필요 |
| 8 | alert 폭주 방지(rate limit / dedup) | ⚠️ | 동일 user_id × action × 5분 윈도 dedup 미설계 — §10에 우선순위 기록 |
| 9 | false positive 시나리오 사전 분류 | ⚠️ | RLS는 SELECT 시 row 0건 반환(=block, 200 OK)이 정상. evaluator는 row_count==0과 403을 구분해야 — RLS-ADV-001 expected에 명시됨 |
| 10 | M3 게이트(W16)와의 정합성 | ✅ | M3 종료 = 5 evaluator 모두 strict CI. RLS evaluator W15 commit으로 충족 |
| 11 | 다음 단계(M4 Security+QA) brake 조건 식별 | ✅ | RLS evaluator 도입 후 9 case 100% pass 미만이면 M4 진입 불가 — 본 sprint exit criterion |
| 12 | 본 cycle 결정의 ADR/Decision 등록 필요성 | △ | static vs pg_test 결정은 ADR-0003 부록 또는 ADR 신규 필요 — §6 결론 후 architect와 협의 |

## 3. 변경된/신규 파일 (W15 commit 시점 예정)

- `scripts/eval/rls.ts` (신규)
- `scripts/eval/rls.spec.ts` (신규, vitest)
- `fixtures/adversarial/rls/RLS-ADV-005~009.yaml` (신규 5건)
- `apps/api/edge-functions/_shared/audit.ts` (확장 — emit 통합 + Slack alert hook)
- `infra/alerts/README.md` (신규 — Slack 채널 / 우선순위 / runbook 링크)
- `.github/workflows/eval-nightly.yml` (RLS job 활성화 — devops가 commit)
- 본 context 파일

## 4. 사용 Skill / 페르소나

- **Senior Security & Privacy Specialist** (system prompt) — 데이터 최소화, default-deny, "수집하지 않은 데이터는 유출되지 않는다" 원칙
- root-cause-tracing — RLS 매트릭스 260 cell 중 실제 violation 가능한 cell 9건 추출
- prompt-engineering — RLS evaluator의 expected.* 단언 구조 설계 가이드
- skill-creator(가이드) — Slack alert payload 템플릿 정형화

## 5. 내린 결정 (확정)

1. **잔여 RLS adversarial 5건 제목/시나리오 확정** (RLS-ADV-005~009):
   - RLS-ADV-005: anon이 starter 외 pack의 word READ 시도 (tier filter 우회)
   - RLS-ADV-006: 만료된 entitlement(`status=expired`)로 premium audio_assets READ 시도
   - RLS-ADV-007: learning_attempts UPDATE 시도(append-only 보호 — CC-16)
   - RLS-ADV-008: 다른 user의 content_reports SELECT 시도 (reporter_user_id 매칭)
   - RLS-ADV-009: account_deletion_requests의 `completed_at` 셀프 갱신 시도(soft-delete 우회)
2. **evaluator는 service_role 미사용** — anon JWT + 2명의 authenticated JWT(공격자/피해자)만 발급, 로컬 Supabase에서 실행. CI에서는 §6 결정에 따라 dual track.
3. **Slack alert는 P0/P1/P2 3등급 분리** — §10 참조. P0만 즉시 page, P1은 채널 통지, P2는 일배치 요약.

## 6. 결정 후보 (orchestrator/architect 승인 필요)

### 6.1 RLS evaluator 평가 접근 — Static SQL 분석 vs pg_test_role 실행 (보안 관점 의견)

| 접근 | 장점 | 단점 / false negative 위험 | 보안 의견 |
|---|---|---|---|
| **A. Static SQL 분석** (0002_rls.sql parse → 정책 USING/WITH CHECK 표현 추출 → adversarial과 매칭) | CI 부하 0, DB 불필요, 빠름 | (1) `is_support()` 같은 helper 함수의 런타임 evaluation을 재현 못 함 → false positive/negative 동시 가능 (2) `EXISTS (SELECT ... FROM word_pack_members ...)` 같은 join 정책의 실제 결과 추정 불가 (3) Postgres planner의 RLS 적용 순서(SELECT vs UPDATE WITH CHECK) 미시뮬레이션 (4) `auth.uid()` / `auth.jwt()->>'role'` 함수 substitution 누락 시 정책 적용 안 된 cell을 안전으로 오판할 수 있음 | **단독 사용 비권장** — 매트릭스 coverage 점검(어떤 table×role×CRUD에 정책이 빠졌는가)에는 적합하지만, 실제 block 여부 검증에는 부적합 |
| **B. pg_test_role / supabase local + 실제 JWT** | production-faithful — RLS engine 자체를 호출, helper 함수/EXISTS join 모두 실제 결과 | (1) Local Supabase docker 의존 — CI 시간 +30~60s (2) Migration 적용 실패 시 모든 case skip (3) auth.users 시드 필요 — fixture로 anon/user1/user2/support JWT 미리 발급 | **권장** — RLS는 행 단위 동적 평가가 본질. static으로는 검증 불가능한 영역이 너무 많음 |
| **C. Hybrid (권장 결론)** | static = 매트릭스 coverage gate(어떤 cell에 정책 자체가 빠졌나) / pg_test = adversarial 9 case 실제 실행 | 두 트랙 유지 비용 | **최종 권장** — `eval:rls:static` (PR-block, 빠름)과 `eval:rls:adversarial` (nightly + 사전 PR opt-in) 분리 |

**보안 의견 요지**: static-only는 false negative 위험이 구조적으로 존재(특히 `EXISTS` join 정책 + helper 함수). pg_test_role 기반 B를 메인으로, static은 정책 missing 검출용 보조로 운영. ADR-0003 부록 또는 ADR-0005 신규로 등록 권장.

### 6.2 RLS evaluator의 service_role 사용 금지 원칙

evaluator가 service_role을 사용해 fixture를 prepare하면 RLS 자체를 우회하므로, **prepare는 service_role / 공격 시도 호출은 anon 또는 authenticated JWT** 두 단계 분리. JWT 발급은 `supabase auth admin generate-link` 또는 사전 시드된 user의 `signInWithPassword` 사용.

### 6.3 audit_log evaluator의 chain 검증

W15에 audit_log self-tampering(RLS-ADV-004 + 신규 RLS-ADV-009) 시도가 차단되는 동시에, **시도 자체가 별도 chain에 기록**되는지를 evaluator로 단언. 이는 R-23 해소의 일부.

## 7. 리스크 / 후속 작업

- **R-23 (W14 신규, 중간)** — RLS adversarial 9건 skip → W15 commit 직후 해소 예정. 본 sprint exit criterion에 명시
- **R-25 신규 후보 (낮음~중간)** — RLS evaluator의 local Supabase 의존이 CI 안정성에 영향. nightly로 분리하면 PR 단계에서 실시간 회귀 못 잡음. mitigation: PR opt-in label `run-rls-adversarial`
- **R-26 신규 후보 (낮음)** — Slack webhook URL이 GitHub Secrets에 보관 — repo 권한자 노출 위험. mitigation: 채널은 private + URL rotation 분기별
- **R-27 신규 후보 (중간)** — audit_log emit이 코드 곳곳에 흩어져 있어 통합 시 누락 시도 미기록 가능. `_shared/audit.ts` 통합 + grep guard CI rule
- W14 발견 부수 issue: content evaluator가 candidate YAML만 검증(R-24) — DB seed 후 retire/replace 변경분은 별도 검사 필요. 보안 관점에서 RLS와 무관하나 audit_log emit point의 한 후보(content_reports 처리)와 겹침

## 8. 의존성 / blocker

- **devops**: Slack #security webhook URL 발급 + GitHub Secrets 등록 (`SLACK_SECURITY_WEBHOOK`). W15 중반까지 필요. blocker는 아님(P1)
- **backend**: `_shared/audit.ts` emit 통합 — backend가 webhook handler에서 호출하므로 협업 PR 필요
- **architect**: §6.1 결정에 대한 ADR 등록 승인. orchestrator가 W15 mid-sprint 회의에서 결정 권고
- **analytics**: RLS evaluator 결과를 baseline metrics 14-day 수집에 포함할지 결정 (M3 게이트 영향)
- **차단 항목 없음** — W15 진입 가능

## 9. 다음 추천 액션

1. (D-1, 2026-05-12) `scripts/eval/rls.ts` skeleton + RLS-ADV-005~009 5건 yaml 작성
2. (D-2) backend와 `_shared/audit.ts` 통합 PR 시작
3. (D-3) devops에 Slack webhook 요청, runbook `infra/alerts/README.md` 초안
4. (D-4) §6.1 hybrid 접근 ADR 초안 architect 회람
5. (D-5) RLS-ADV-001~009 9건 100% pass 확인 → W15 게이트 통과 신호

## 10. audit_log 위반 시도 alert 우선순위 (Slack #security)

| 우선순위 | 위반 패턴 | 근거 | Slack 동작 |
|:---:|---|---|---|
| **P0 (즉시 page)** | **self-entitlement upsert 시도** (RLS-ADV-003): authenticated 사용자가 본인 `subscription_entitlements` row를 직접 INSERT/UPDATE 시도 | 결제 우회 = 매출 직접 손실 + RC SoT 신뢰 붕괴. 단 1회도 production 발생 시 즉시 대응 필요. ADR-0004 service_role write-only 위반 | `@here` mention, runbook 링크 포함, on-call(1인 개발자 본인) DM 동시 |
| **P0 (즉시 page)** | **audit_log 직접 INSERT/UPDATE/DELETE 시도** (RLS-ADV-004): 사용자가 audit chain 자체를 위/변조 시도 | Repudiation = 사후 추적 불가능. GDPR 침해 통지(72h) 산정 근거 소실. M5 운영 시 가장 치명적 | P0 동일 처리 + 별도 audit chain에 시도 자체 기록 |
| **P1 (5분 dedup, 채널 통지)** | **다른 user의 PII read 시도** (RLS-ADV-001 류 — user_word_states / learning_attempts / profiles cross-user SELECT) | Information Disclosure. RLS가 row 0건으로 차단하지만 시도 자체가 권한 상승 공격 정찰 신호. 단일 시도는 false positive(JOIN 실수) 가능성 있어 dedup 권장 | thread reply, user_id × action × 5min window dedup |
| **P1 (채널 통지)** | **anon write 시도** (RLS-ADV-002 류 — anon → learning_attempts / user_word_states / subscription_entitlements INSERT) | 권한 상승. anon은 정상적으로 read만 가능해야 함. 봇/스크레이퍼 정찰 가능성 | thread reply |
| P2 (일배치 요약) | starter 외 pack/audio anon read 시도(RLS-ADV-005류), expired entitlement로 premium 접근 시도(RLS-ADV-006류) | tier 우회 시도 — 단일 시도는 무해(차단됨). 일배치로 트렌드 모니터링 | daily digest 18:00 KST |
| P2 (일배치 요약) | learning_attempts append-only 위반 시도(RLS-ADV-007), account_deletion `completed_at` 셀프 갱신(RLS-ADV-009) | 데이터 무결성 — 차단되며 단발은 무해. 트렌드 감시용 | daily digest 동봉 |

**dedup 규칙**: `(user_id, table, action)` × 5분 윈도. 동일 사용자가 같은 위반을 연속 시도해도 최초 1건만 alert, 윈도 종료 후 카운트 동봉(예: "지난 5분 동안 12회 시도").

**alert payload 최소 필드**: `severity / pattern_id(RLS-ADV-XXX) / actor(user_id 또는 anon+device_install_id) / table / attempted_action / blocked_by(policy 이름) / timestamp / runbook_url`. **PII 평문 절대 금지** — user_id는 hash 8자리 prefix만(예: `usr_a1b2c3d4`). 이메일/이름 포함 금지.

**runbook**: `infra/alerts/README.md`에 P0/P1별 1-2단계 액션(서비스 차단 여부, RC 대조, 통지 의무 판단) 명시. GDPR 72h 통지 산정 시작점이 P0 alert 시각이 되도록 timestamp는 UTC + KST 병기.

---

## 부록 A. W14 → W15 인계 보안 체크리스트

- [x] RLS 매트릭스 0002_rls.sql 검토 완료 — ENABLE 17 테이블(ADR-0004 13 + content_reports/account_deletion_requests/audit_log/guest_sessions 4) 모두 RLS on
- [x] adversarial 4건(RLS-ADV-001~004) expected schema 일관 확인
- [ ] RLS-ADV-005~009 작성 (W15 D-1)
- [ ] `_shared/audit.ts` emit 통합 (W15 D-2, backend 협업)
- [ ] Slack webhook URL 등록 (W15 D-3, devops 협업)
- [ ] hybrid 접근 ADR 초안 (W15 D-4, architect 회람)
- [ ] 9 case 100% pass 확인 (W15 D-5, exit criterion)

## 부록 B. REVIEW_QA.md 보안/개인정보 섹션 추가 질문 후보

본 sprint 진행 중 PM 결정이 필요한 항목 — `docs/REVIEW_QA.md` 보안/개인정보 섹션에 P1/P2로 등록 예정:

- (P1) Slack #security 채널의 retention 정책 — alert 메시지에 hash 처리된 user_id가 포함되므로 채널 retention이 30일 초과 시 PII 간접 노출 위험 평가 필요
- (P2) RLS evaluator local 실행 시 anon/user1/user2 fixture JWT의 만료 정책 — short-lived(5분) 권장, 누출 시 영향 최소화
- (P2) audit_log self-INSERT 시도 자체를 별도 chain에 기록하는 설계가 무한 재귀(시도 기록 시도) 가능성 — service_role 호출이므로 RLS 미적용이지만 명시적 가드 필요
