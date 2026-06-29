# ADR-0006 — Shared SRS Module (`packages/srs-core`)

- **상태**: **Accepted** (orchestrator 사이클 후 봉인)
- **결정일**: 2026-05-11 (M3 W15)
- **작성**: architect agent
- **승인 예정**: orchestrator (W15 합의 사이클)
- **마일스톤**: M3 W15 (분리·빌드) → M3 W16 (양측 import 통합) → M4 W17 (sibling 제거 + R-12 closed)
- **관련 문서**: ADR-0001 (Stack) / ADR-0002 (Domain Abstractions) / ADR-0003 (Harness Tool) / `docs/architecture/STACK_EVOLUTION_PLAN.md` / `docs/architecture/HARNESS_LAYERED_ARCHITECTURE.md` / R-12 (RISK REGISTER) / `context/rollups/20260511-M3-W14-evaluators-and-ci.md` §4.1 / `context/agents/architect/20260511-2200-chore-m3-w15-readiness.md` §6
- **Skill 사용**: `software-architecture` · `prompt-engineering`

---

## Context

### R-12 history

R-12("SRS 로직이 mobile/Edge 양쪽에 sibling copy로 존재 — drift 위험")는 M2-S2 시점에 RISK REGISTER에 등록됐다. 당시 결정은 "MVP 단계에서는 sibling 유지, M3 진입 시 esm 빌드로 단일 source 검토"였고, `apps/api/edge-functions/_shared/srs.ts` 헤더 주석에도 동일 문구가 박제됐다.

W14에서 Payment 도메인은 동일한 drift 우려에 대응하여 `_shared/billing.ts` 단일 SoT로 정리됐다 (rollup §4.1). 그러나 SRS는 여전히:

- `apps/mobile/src/srs/leitner.ts` — RN/Hermes 환경 (canonical, `initialUserWordState` helper 포함)
- `apps/api/edge-functions/_shared/srs.ts` — Deno runtime 환경 (sibling, `initialUserWordState` 미보유)

두 파일을 수동 동기화하는 패턴이 남아있다. STAGE_INTERVAL_DAYS와 transition 로직은 현재 동일하나, helper 누락 자체가 이미 1차 drift다. golden 50건 + RLS adversarial 9건이 W15-W16에 활성화되는 시점에 "evaluator는 _shared/srs.ts를 검증하나 mobile은 sibling을 실행"하는 비대칭이 신뢰성의 근간을 흔든다.

### 현 sibling 패턴의 문제

1. **비대칭**: Payment는 단일 SoT, SRS는 sibling — architecture 일관성 훼손
2. **정적 검증 한계**: 두 파일 본문의 의미 동등성을 단위 테스트가 자동으로 보장하지 못함
3. **타입 분기**: `UserWordStateInput` (mobile) vs `UwsState` (Edge) — 동일 도메인의 타입이 두 곳에서 진화 가능
4. **evaluator 신뢰 토대**: SRS golden runner가 `_shared/srs.ts`를 import하나, mobile 런타임은 별도 파일 — "evaluator green = mobile green" 보장 부재

### 대안 검토 (readiness §6.2~6.4)

| 옵션 | 운영 부담 | 안전성 | 1인 개발자 적합성 |
|---|---|---|---|
| A. tsup esm 빌드 + `packages/srs-core` 공유 패키지 | 중간 (한 번 만들면 안정) | **높음** | 적합 (boring stack) |
| B. 코드 생성 (`scripts/codegen/sync-srs.ts`) | 낮음 | 낮음 (본문 의미 변화 미감지) | 위험 (Deno-incompatible API 자동 변환 불가) |
| C. parity-check (AST 비교 lint rule) | 매우 낮음 | 매우 낮음 (signature/상수만) | 적합하지만 임시방편 |

---

## Decision

> **Option A를 채택한다 — `packages/srs-core` 신규 워크스페이스 패키지를 단일 SoT로 두고, `tsup`으로 ESM(Deno 호환) + CJS dual 빌드한다. mobile은 metro workspace import, Edge Functions는 `supabase/functions/_shared/srs.ts`로 빌드 산출물을 사전 복사하는 deploy step을 둔다. R-12는 단계적 폐기.**

### 단계 분리

| 단계 | 시점 | 작업 주체 | 산출물 | 게이트 |
|---|---|---|---|---|
| **Phase 1 — 패키지 분리** | M3 W15 | architect (스켈레톤) → backend (구현 이전) | `packages/srs-core/` (package.json / tsconfig.json / tsup.config.ts / src/index.ts) | `pnpm -F @dash2zero/srs-core build` 통과, dist/ ESM/CJS 산출 |
| **Phase 2 — import 통합** | M3 W16 | backend | mobile `leitner.ts` → `import { applySrsTransition } from "@dash2zero/srs-core"`. Edge `_shared/srs.ts` → tsup dist의 ESM bundle을 supabase deploy step에서 sync. 양측 spec/golden 동시 통과. | leitner.spec.ts + scripts/eval/srs.ts 모두 green |
| **Phase 3 — sibling 제거 + R-12 closed** | M4 W17 | backend | `apps/mobile/src/srs/leitner.ts` 삭제 (re-export shim만 유지 가능) + `apps/api/edge-functions/_shared/srs.ts` 삭제 (deploy step의 dist 산출물로 완전 대체). RISK REGISTER에 R-12 → **closed** 마킹. | parity drift = 0, evaluator + mobile spec 둘 다 동일 모듈 검증 |

### 거부된 대안

- **Option B (코드 생성)**: canonical 1개 + generated sibling 1개 구조이나, 함수 본문이 Deno와 RN 모두에서 안전한지 자동 보장 못함. mobile에서 `Intl` 외 Node-only API가 무심코 들어가면 codegen은 통과하나 Edge에서 런타임 실패. **거부.**
- **Option C (parity-check)**: AST signature + 상수만 비교하므로 본문 의미 차이를 잡지 못함 (예: same-cycle 분기 변경, `mastered_at` null 처리 변경). 매번 drift가 다시 발생할 수 있는 임시방편. **거부.** 단 Phase 1~2 진행 중 transition gate로 1주짜리 보호망으로만 잠시 운용 가능.

---

## Consequences

### Positive

- **Drift 0 보장** — mobile + edge function이 동일 모듈을 import. evaluator green = mobile green이 architecturally guaranteed.
- **Architecture 일관성 회복** — Payment(`_shared/billing.ts` SoT)와 SRS(`packages/srs-core` SoT)가 모두 단일 SoT 패턴으로 정리. 비대칭 해소.
- **타입 단일화** — `UserWordStateInput`/`UwsState` 등 분기된 타입을 `packages/srs-core`의 단일 export로 통합. `@dash2zero/contracts`와 정합 가능 (향후 zod schema 합류 여지).
- **Evaluator 신뢰성 토대** — SRS golden 50건 + RLS evaluator가 W15-W16에 가동되는 시점에 "검증 대상 = 운영 대상" 등식 성립. M3 게이트 통과 조건 충족.
- **Boring stack 친화** — tsup은 esbuild 위 얇은 wrapper, 신규 SaaS 0개. 운영 컴포넌트 ≤ 5 원칙 유지.

### Negative

- **빌드 도구 1개 추가 (tsup)** — devDependency, CI step (`pnpm -F @dash2zero/srs-core build`) 추가
- **Supabase deploy 파이프라인 변경** — Edge Function 배포 전에 dist의 ESM bundle을 `supabase/functions/_shared/srs.ts`로 sync하는 step 필요 (CI workflow 변경 1회)
- **Deno 호환 제약** — `packages/srs-core/src/index.ts`는 Node-only API 금지. `Intl`, 표준 `Date`, 순수 함수만. tsup config에 `platform: "neutral"` 강제

### Neutral

- mobile metro의 workspace 해석은 이미 `@dash2zero/contracts`로 검증된 패턴 — 추가 학습 비용 없음
- Phase 3 완료 시점에 `_shared/srs.ts` 헤더의 "M3 진입 시 esm 빌드로 단일 source 제공 검토" 주석은 자동으로 obsolete — 파일 자체가 dist 산출물로 교체됨

---

## Affected Files

### Phase 1 (W15, 본 ADR과 동시)

- **신규**: `packages/srs-core/package.json` — `@dash2zero/srs-core`, private workspace, tsup build script
- **신규**: `packages/srs-core/tsconfig.json` — ES2022, neutral platform, declaration emit
- **신규**: `packages/srs-core/tsup.config.ts` — ESM + CJS dual, dts, `platform: "neutral"`
- **신규(스켈레톤)**: `packages/srs-core/src/index.ts` — 함수 시그니처 export 표시 (구현은 W15-W16에 backend가 이전)

### Phase 2 (W16, backend 작업 큐)

- **수정**: `apps/mobile/src/srs/leitner.ts` — 본문 제거 → `export * from "@dash2zero/srs-core"` re-export shim (import 호환 유지)
- **수정**: `apps/api/edge-functions/_shared/srs.ts` — Edge 배포 시 tsup dist의 ESM bundle로 자동 교체 (CI deploy step에 sync)
- **수정**: `apps/mobile/package.json` — `dependencies`에 `"@dash2zero/srs-core": "workspace:*"` 추가
- **수정**: `apps/mobile/metro.config.js` — workspace resolver 검증 (이미 contracts에서 검증된 경우 NOOP)
- **수정**: CI workflow (`.github/workflows/...`) — `pnpm -F @dash2zero/srs-core build` step + supabase deploy 전 `_shared` sync step
- **수정**: `apps/mobile/src/srs/leitner.spec.ts` — import 경로 변경 (re-export shim 유지 시 무변경)
- **수정**: `scripts/eval/srs.ts` — import 경로를 `_shared/srs.ts` → tsup dist 또는 직접 패키지 import (Deno import map)

### Phase 3 (M4 W17)

- **삭제 후보**: `apps/mobile/src/srs/leitner.ts` (shim만 남기거나 완전 삭제 후 import 경로 일괄 치환)
- **삭제**: `apps/api/edge-functions/_shared/srs.ts` 원본 (deploy step의 dist 산출물로 완전 대체)
- **갱신**: `docs/risk/REGISTER.md` — R-12 → **Closed** (resolution: ADR-0006 Phase 3 완료)

---

## Reversal Triggers

다음 중 하나라도 발생 시 본 ADR 재검토 + 필요 시 supersede:

1. **tsup 빌드 산출물의 Deno 호환성 결함** — Edge Functions runtime에서 ESM bundle 로드 실패가 1회 이상 발생 (Supabase Deno 버전 업그레이드와의 충돌 포함)
2. **Supabase Edge Functions 워크스페이스 import 정식 지원** — Supabase가 monorepo workspace import를 native 지원하는 경우 deploy sync step 자체가 불필요해짐 → 단순화 방향으로 ADR 갱신
3. **mobile 번들 사이즈 회귀** — `packages/srs-core` import로 인한 RN bundle size 증가가 측정 가능한 수준(≥ 5KB gzipped)으로 확인되고 tree-shaking으로 해결 불가능한 경우 (현 시점 SRS 코드 ~3KB raw로 risk 낮음)
4. **Deno-incompatible API 도입 필연성** — SRS 로직이 timezone DB나 Node-only crypto를 요구하게 되면 platform 분기 필요 → 단일 SoT 모델 재설계
5. **Phase 2 구현 비용이 W16 capacity 초과** — backend 합의 결과 W16에 import 통합 불가 시 Phase 2를 W17로 슬립, 그동안 Option C parity-check를 1주 임시 운용

---

## Validation

| 시점 | 검증 항목 | 통과 기준 |
|---|---|---|
| W15 (Phase 1 종료) | `packages/srs-core` 빌드 | `pnpm -F @dash2zero/srs-core build` 통과, dist/index.js (ESM) + dist/index.cjs (CJS) + dist/index.d.ts 산출 |
| W16 (Phase 2 종료) | 양측 import 통합 | `apps/mobile/src/srs/leitner.spec.ts` (단위) + `scripts/eval/srs.ts` (golden 50) 모두 green, 두 entry가 동일 모듈을 검증함을 import graph로 증빙 |
| W16 종료 / M3 게이트 | drift 0 증빙 | `apps/mobile/src/srs/leitner.ts`와 `apps/api/edge-functions/_shared/srs.ts`의 본문이 모두 `packages/srs-core` re-export 또는 dist 산출물 |
| M4 W17 (Phase 3 종료) | R-12 closed | sibling 파일 제거 또는 shim only, RISK REGISTER 갱신, `_shared/srs.ts` 헤더 obsolete 주석 자동 정리 |

---

## References

- ADR-0001 — Stack Decision (monorepo / pnpm workspace)
- ADR-0002 — Domain Model Abstractions (`AudioGenerator`, `WebhookHandler` 인터페이스 추출 패턴 — 본 ADR은 동일 정신)
- ADR-0003 — Harness Tool (custom runner — SRS evaluator가 본 패키지를 검증)
- `docs/architecture/STACK_EVOLUTION_PLAN.md` — workspace package 정책
- `docs/architecture/HARNESS_LAYERED_ARCHITECTURE.md` — Layer 4 Evaluation 신뢰 토대
- R-12 (RISK REGISTER) — SRS sibling drift
- `context/rollups/20260511-M3-W14-evaluators-and-ci.md` §4.1 — Payment `_shared/billing.ts` 단일 SoT 선례
- `context/agents/architect/20260511-2200-chore-m3-w15-readiness.md` §6 — 옵션 비교 매트릭스
- Q-AR-DOC-019 — SRS sibling drift 옵션 결정 (본 ADR로 답변됨)

---

## Change Log

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-11 22:30 | M3-W15 v1.0 — Option A 채택 (tsup esm + `packages/srs-core`) + 3-Phase 단계 분리 (W15 분리 / W16 통합 / W17 sibling 제거 + R-12 closed) + 대안 B/C 거부 사유 | architect |
