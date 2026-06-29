# M3-W15 Architect Readiness 자가 진단 (12 항목)

- **Agent**: architect
- **Sprint**: M3 W15 (2026-05-11 진입)
- **Branch / Worktree**: chore/m3-w15-readiness
- **상위 SSOT**: `context/rollups/20260511-M3-W14-evaluators-and-ci.md`, `docs/architecture/HARNESS_LAYERED_ARCHITECTURE.md`, `docs/architecture/STACK_EVOLUTION_PLAN.md`
- **Skill 사용**: software-architecture · root-cause-tracing · prompt-engineering

---

## 1. W15에서 architect 책임 범위 (재명시)

| 항목 | 산출 형태 | 마감 |
|---|---|---|
| R-12 통합 옵션 비교 + ADR 필요 여부 판단 | 본 문서 §6 + (필요 시) `docs/adr/ADR-0006-shared-srs-build.md` 초안 | W15 중반 |
| RLS evaluator 접근 결정에 architecture 자문 (security + backend 산출물 검토) | 본 문서 §7 + 리뷰 코멘트 | W15 후반 |
| M4 entry 전 추가 ADR 후보 목록 | 본 문서 §10 + orchestrator 합의 | W15 종료 |
| 5층 harness 성숙도 alpha→beta 전환 평가 | 본 문서 §6 + HARNESS_LAYERED_ARCHITECTURE 부록 갱신 후보 | W15 종료 |
| `docs/REVIEW_QA.md` "아키텍트" 섹션 신규 질문 적재 | 차이 발견 시 P0/P1/P2로 등록 | 상시 |

---

## 2. 12-항목 readiness 체크

| # | 항목 | 상태 | 비고 |
|---|---|---|---|
| 1 | W14 rollup 정독 (28 산출물 + R-12/R-22 갱신 + R-23/R-24 신규) | OK | §1~9 모두 확인 |
| 2 | `apps/api/edge-functions/_shared/srs.ts` vs `apps/mobile/src/srs/leitner.ts` 의 sibling 차이 재확인 | OK | 동일 STAGE_INTERVAL_DAYS / 동일 transition. Edge 쪽 주석에 "M3 진입 시 esm 빌드로 단일 source 검토" 명시. mobile 쪽은 `initialUserWordState` helper 추가, Edge 쪽은 미보유 → drift 리스크 작지만 기능 비대칭 존재 |
| 3 | `_shared/billing.ts`(W14 신설) 패턴이 R-12를 SRS+Payment 두 도메인에 동일 적용했는지 확인 | OK | rollup §4.1로 확정. SRS는 sibling, billing은 단일 _shared만. **비대칭이 명시적으로 살아있다 → §6에서 정리 필요** |
| 4 | RLS evaluator 도입 전 R-23 (RLS adversarial 9 case skip) 영향 추정 | OK | 보안 회귀 못 잡음. W15 1차에서 evaluator 도입 시 즉시 활성화. Q-AR-DOC-016로 등록 권고 |
| 5 | baseline metrics 14d 수집 환경 기준 정합 (어디서/누가/무슨 dashboard) | 부분 | analytics가 측정 evt emit 책임이나 **수집 저장소·dashboard 위치는 아직 ADR 없음** → §10 ADR-0006 후보 |
| 6 | ADR-0001~0005 변경 필요 여부 | OK | ADR 변경 사유 없음. ADR-0003 (custom runner)은 RLS evaluator로 5 category 완성되면 "Final" 토큰 부여 후보 |
| 7 | 5층 harness 성숙도 표 alpha/beta 전환 후보 식별 | OK | §6 표 참고 — Layer 1 Contract / Layer 4 Evaluation 일부 → beta 전환 후보 |
| 8 | M4 entry 차단 가능 risk 식별 | OK | R-23 (RLS) + R-12 (sibling) 둘 다 **M4 entry 직전까지 결정**되어야. R-24 (DB seed retire/replace 검사)는 M4 초입 sub-task |
| 9 | secret 관리 (Supabase service_role / RC API key / TTS provider key) ADR 부재 점검 | 부분 | 코드 베이스에는 dotenv 패턴 존재 가정이나 운영 회전 정책 미문서화. Q-AR-DOC-017로 등록 + ADR-0007 후보 |
| 10 | OTA 적용 범위 (CC2-17) 검증 자동화 여부 | 부분 | EAS plugin 검사 정책 docs에 있음(Layer 2 §3.3) but **eval로 검증되고 있지 않음**. M4 후보 |
| 11 | 운영 컴포넌트 수 ≤ 5 원칙 점검 | OK | 현 운영 대상: ① Supabase ② Edge Functions ③ RC ④ Firebase (Crashlytics+Analytics) ⑤ Expo/EAS = 5개. baseline metrics 저장소를 6번째로 만들면 안 됨 (Supabase 또는 Firebase로 흡수 권고) |
| 12 | 1인 개발자 운영 부담 evidence (W14 추가된 28 파일 + 2 workflow가 신규 운영 부담을 만들었는지) | OK | 모두 코드/yaml 레벨, 신규 SaaS 도입 없음. CI 1개 추가(eval-on-pr) — 부담 증가 미미 |

---

## 3. 결론 요약

- **W15에 ADR 1개 작성 권고**: R-12 통합 결정 (sibling copy 유지 vs esm 빌드 vs 코드 생성). §6 참조.
- **W15 → M4 사이 추가 ADR 2개 후보**: ADR-0006 baseline metrics 수집 환경, ADR-0007 secret 관리 정책. §10 참조.
- **RLS evaluator 도입 시 architecture 자문 1회 (W15 중반)**: pg_test_role 채택 vs 정책 SQL static 분석 vs supatest — 운영 부담 측면 의견 제출.
- **harness 성숙도**: Layer 1 (Contract) + Layer 4 (Evaluation/SRS·Payment·Privacy·Content) 4개 evaluator → **alpha → beta 전환 후보**. RLS evaluator 추가 시 Layer 2 (Policy)도 beta. §6 표.

---

## 4. 차단 / 의존

- 차단 없음. W15 진입 가능.
- 의존: RLS evaluator 접근 결정(security 주도) — architect는 검토자. baseline metrics emit 위치(analytics 주도) — architect는 §10 ADR-0006 초안화 시 결과 반영.

---

## 5. 다음 추천 액션

1. (W15-D1) §6 R-12 옵션 비교 ADR 초안화 → orchestrator 합의 → ADR-0006 머지
2. (W15-D2) security가 RLS evaluator PR 올리면 architecture 관점 review (운영 부담, Supabase 종속도)
3. (W15-D3) §10 ADR-0006 (baseline metrics) / ADR-0007 (secret) 초안 골격
4. (W15 종료) 5층 성숙도 표를 HARNESS_LAYERED_ARCHITECTURE.md §10 부록에 추가, M4 entry rollup에 인용

---

## 6. R-12 통합 옵션 비교 (W15 ADR 후보)

### 6.1 현 상태

- `apps/api/edge-functions/_shared/srs.ts` (Deno 환경, Edge Functions만 import)
- `apps/mobile/src/srs/leitner.ts` (RN/Hermes 환경, mobile만 import)
- 두 파일은 **수동 sibling copy**. STAGE_INTERVAL_DAYS / applySrs* / computeNextDue / isSameDueCycle / localDay04 동일 로직.
- 차이: mobile 쪽에 `initialUserWordState` helper 존재. Edge 쪽 미보유.
- 검증: mobile은 `leitner.spec.ts` 단위 테스트, Edge는 `scripts/eval/srs.ts` golden runner — **둘 다 _shared/srs.ts를 import** (W14 변경)? rollup §4.1 표현은 "Payment evaluator도 sibling-copy 분리 위험을 회피하기 위해 _shared/billing.ts로 추출"이라 했으나 SRS는 **여전히 sibling 두 파일**. drift 위험 유지.

### 6.2 옵션 A — tsup esm 빌드 + 공유 패키지 (`packages/srs-core`)

- 단일 SoT를 `packages/srs-core/src/index.ts`에 두고 tsup으로 ESM/CJS dual 빌드.
- mobile은 metro resolver로 workspace import, Edge Functions는 import map 또는 빌드 산출물(esm.sh 게시 또는 supabase/functions/_shared로 사전 복사 step).
- 장점: drift 원천 제거, type 단일화, golden runner와 mobile spec이 같은 모듈 검증.
- 단점: Deno 호환 ESM 빌드 (Node 의존 0), supabase CLI deploy step에 빌드 산출물 sync 필요. 빌드 도구 1개 추가(tsup), CI step 추가.
- 운영 부담: **중간** — 한 번 만들면 안정. 1인 개발자 감당 가능.

### 6.3 옵션 B — 코드 생성 (`scripts/codegen/sync-srs.ts`)

- mobile/leitner.ts를 **canonical**로 두고 _shared/srs.ts를 codegen으로 생성.
- 장점: 빌드 도구 추가 없음, 단일 노드 스크립트.
- 단점: 생성 파일은 commit, drift 발생 시 CI에서 diff 검출만. 타입 import는 여전히 두 곳. Deno-incompatible Node API가 mobile 쪽에 들어가면 자동 변환 불가능 — fragile.
- 운영 부담: **낮음** but 안전성도 낮음.

### 6.4 옵션 C — 현 sibling copy 유지 + lint rule + golden 강제

- `scripts/check-srs-parity.ts` 추가: 두 파일의 export signature와 STAGE_INTERVAL_DAYS 같은 상수가 동일한지 AST 비교, 불일치 시 CI fail.
- 장점: 도구 추가 0, 코드 변경 최소.
- 단점: 함수 본문의 의미 차이를 잡지 못함(예: same-cycle 처리 분기 변경). 사실상 이중 작성 인적 비용 유지.
- 운영 부담: **매우 낮음** but 인지 부담 유지.

### 6.5 추천

- **W15에 ADR-0006 작성 권고 (Option A 채택안)**.
- 사유: Payment 도메인은 이미 _shared/billing.ts 단일 SoT로 정리됐고, SRS만 sibling으로 남는 비대칭은 architecture 일관성 훼손. golden 50건 + adversarial RLS 9건이 W15-W16에 활성화되는 시점에 SRS SoT 통합이 evaluator 신뢰성의 토대.
- 단 옵션 A의 비용(tsup + supabase deploy sync)을 W15에 도입하기 어렵다면 ADR-0006은 "**Option C (parity check) 즉시 도입 + Option A는 M4 W17에 실시**" 단계 분리 결정으로 작성.
- ADR 필요 여부: **YES (W15 중)**. 단순 코드 변경이 아니라 Edge Functions ↔ mobile workspace 경계 결정 + 빌드 파이프라인 영향이라 의사결정 추적성 필요.

### 6.6 5층 harness 성숙도 표 (W14 시점)

| Layer | 성숙도 | 근거 | 전환 게이트 |
|---|---|---|---|
| 1 Contract | **alpha → beta 후보** | zod schema가 packages/contracts에 정착, evaluator 4개가 contract 위에서 동작. 회귀 case 22건 | RC webhook 실 sandbox sample 1회 + manifest hash mismatch 1 case 추가 시 beta |
| 2 Policy | alpha | RLS adversarial 4 case 작성됐으나 evaluator skip(R-23). daily_limit / age gate는 W15 추가 예정 | RLS evaluator 가동(W15) + daily_limit golden 4건 통과 시 beta |
| 3 Retrieval | alpha | SRS evaluator 22 golden + content evaluator 8 case. signed URL TTL/만료 case 미작성 | TTL expire case + manifest diff case 1+ 추가 시 beta |
| 4 Evaluation | **alpha → beta 후보** | 4 evaluator + CI strict + adversarial 9 통합. RLS만 결손 | RLS evaluator 추가 + nightly cron 활성화 시 beta |
| 5 Observability | pre-alpha | Crashlytics/FA SDK 도입 가정. baseline 14d 수집 인프라 미정 (ADR-0006 후보) | baseline 수집 저장소 + alert 채널 결정 + 1회 game-day 후 alpha |

---

## 7. RLS evaluator 접근 — architecture 관점 의견 (security/backend 결정 후 검토 예정)

| 옵션 | 운영 부담 | 신뢰도 | 1인 개발자 적합성 |
|---|---|---|---|
| 정책 SQL static 분석 (regex/pgsql parser) | **매우 낮음** (런타임 Supabase 불요) | 중간 (의미 모델링 한계) | 높음 |
| supatest 또는 pg_test_role 런타임 실행 | 중간 (CI에서 supabase local 부팅 필요) | **높음** | 중간 (CI 시간 + flake) |
| 정책 매트릭스 → declarative YAML → runner가 supabase REST/RPC 직호출 | 중간 | 높음 | 중간 |

- architect 의견: M3 W15에는 **정책 SQL static 분석 + adversarial 9 case의 일부(read/write 거부 4건)는 supabase local 런타임 검증** 하이브리드 권고. 운영 부담 급증 회피.

---

## 8. M4 entry 전 추가 ADR 후보 (§10)

| ID(가칭) | 제목 | 근거 | 시점 |
|---|---|---|---|
| ADR-0006 | Shared SRS module — esm build vs sibling parity check | §6 | W15 |
| ADR-0007 | Baseline metrics 수집 환경 (Supabase table vs Firebase BQ export vs PostHog) | readiness §2-#5 | W15-W16 |
| ADR-0008 | Secret 관리 정책 (Supabase env, RC API key, TTS provider key 회전 주기) | readiness §2-#9 | M4 W17 |
| ADR-0009 (선택) | OTA 적용 범위 자동 검증 (EAS plugin + eval) | readiness §2-#10 | M4 |

ADR-0006 / 0007은 **M3 게이트(W16) 통과 조건에 포함시킬 것** 권고.

---

## 9. REVIEW_QA 등록 후보 질문 (P0/P1/P2)

> 본 문서 작성과 동시에 `docs/REVIEW_QA.md` 아키텍트 섹션에 다음 질문을 등록 필요 (orchestrator 합의 후).

- (P0) Q-AR-DOC-016: RLS adversarial 9 case가 W15 evaluator 도입 전까지 skip 되는 동안의 보안 회귀 위험을 어떤 보상 통제로 막는가? (예: code review checklist, manual SQL review)
- (P0) Q-AR-DOC-017: secret 회전 주기/책임자/감사 로그 위치는? (Supabase service_role, RC, TTS, Firebase admin)
- (P1) Q-AR-DOC-018: baseline metrics 14d 수집 결과를 저장할 위치 — Supabase 새 table, Firebase BQ export, PostHog free tier 중 1개 선택. 6번째 운영 컴포넌트가 되지 않도록 결정.
- (P1) Q-AR-DOC-019: SRS sibling drift를 막는 옵션(§6) 결정 — ADR-0006 채택 옵션은?
- (P2) Q-AR-DOC-020: OTA 적용 범위(native 변경 차단)를 eval로 자동 검증할 것인가, EAS plugin 검사로 충분한가?

---

## 10. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-11 22:00 | M3 W15 readiness 12항목 자가 진단 + R-12 옵션 비교 + harness 성숙도 평가 + ADR 후보 + REVIEW_QA 후보 | architect |
