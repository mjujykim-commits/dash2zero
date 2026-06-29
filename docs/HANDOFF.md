# dash2zero — Handoff & Milestone Gates

> 목적: 마일스톤별 게이트 체크리스트 + 서명 + 다음 팀 인수 가이드
> 갱신 책임: orchestrator (마일스톤 상태 변경 시)
> 게이트 통과는 orchestrator 서명이 SSOT

---

## 1. 마일스톤 상태판

| M | 이름 | 상태 | 시작 | 완료 | 게이트 서명 |
|---|---|---|---|---|---|
| M0 | Bootstrap | **completed** | 2026-05-07 | 2026-05-07 | orchestrator (rollup `context/rollups/20260507-M0-bootstrap.md`) |
| M1 | Product+Architecture+Stack | **completed** | 2026-05-07 | 2026-05-08 | orchestrator (rollup `context/rollups/20260508-M1-product-architecture-stack.md`) |
| M2 | Thin Vertical Slice | **completed** | 2026-05-08 (W5) | 2026-05-08 (W12) | orchestrator (M2 게이트 rollup `context/rollups/20260508-M2-thin-vertical-slice-complete.md`) — 7 sprint S1~S7 모두 통과, 산출물 ~60 파일 / ~7,000줄 |
| M3 | Harness Hardening | **in_progress** (W13 ✅ / W14 ✅ / W15 진행: dispatch v2 + Cycle A 통합 ✅) | 2026-05-11 | - | W15 dispatch v2 `context/rollups/20260511-M3-W15-dispatch-plan-v2.md` + Cycle A `context/rollups/20260512-M3-W15-cycle-a-integration.md` (orchestrator 서명, D-014/D-015 봉인 + ADR-0006 Accepted) |
| M4 | Security+QA | pending | - | - | - |
| M5 | Beta Handoff | pending | - | - | - |

---

## 2. M0 Bootstrap 게이트

### 2.1 산출물 체크리스트

- [x] 프로젝트 디렉토리 구조 (M0-1)
- [x] 9 agent 페르소나 배치 (M0-2)
- [x] AGENTS.md (M0-3)
- [x] .codex/config.toml (M0-3)
- [x] PROJECT_MAP.md (M0-4)
- [x] DECISION_LOG.md (M0-4)
- [x] HANDOFF.md (이 문서, M0-4)
- [x] SKILLS_INVENTORY.md (M0-4 초안 + M0-5 보안 심사 결과 11개 승인)
- [x] SWARM_LEDGER.md (M0-4)
- [x] ASSUMPTIONS.md (M0-4)
- [x] Skill 저장소 clone 결과 (M0-5: 3 repos, 11 skills 승인)
- [x] 보안 심사 결과 (M0-5: low risk 11/11, 통과)
- [x] M0 rollup (M0-6: `context/rollups/20260507-M0-bootstrap.md`)

### 2.2 성공 기준

- 저장소 실행 가능: 디렉토리 구조 + 헌장 + agent 페르소나 모두 존재 ✅ (현재까지)
- Skill 체계 가동: M0-5 완료 후 평가
- 보안 승인/반려 기록: M0-5 완료 후 평가
- 누락 사항 문서화: 본 문서에 명시

### 2.3 알려진 누락 / 보류

| 항목 | 사유 | 처리 시점 |
|---|---|---|
| `worktrees/*` 디렉토리 | M2 본격 병렬 시 생성. 현재는 단일 트리 작업 충분 | M2 |
| `apps/*`, `packages/*`, `infra/*` 내부 | M1/M2 산출물에서 채워짐 | M1~M2 |
| Skill 저장소 실제 clone | M0-5에서 환경 검증 후 시도 | M0-5 |
| Project 전용 skill 4개 (handoff-writer 등) | bootstrap 후 skill-creator로 생성 | M0-5 또는 M1 |

### 2.4 게이트 서명

- **Orchestrator 서명: ✅ 통과**
- 서명 일자: 2026-05-07
- Rollup: `context/rollups/20260507-M0-bootstrap.md`
- 다음 게이트: M1 (Product+Architecture+Stack) — ready 상태, 진입 차단 항목 없음

---

## 3. M1 산출물 (예정)

| 산출물 | 책임 | 위치 |
|---|---|---|
| PRD | planner + pm | `docs/product/PRD.md` ✅ (M1-c1) |
| ASSUMPTIONS | planner + architect | `docs/product/ASSUMPTIONS.md` ✅ (M1-c1 보강) |
| User Journeys | planner + designer | `docs/product/USER_JOURNEYS.md` ✅ (M1-c1) |
| MVP Scope | pm | `docs/product/MVP_SCOPE.md` ✅ (M1-c2) |
| Non-Goals | pm | `docs/product/MVP_SCOPE.md` §2.3 ✅ |
| Domain Model | architect + backend | `docs/architecture/DOMAIN_MODEL.md` ✅ (M1-c2) |
| Stack Options Matrix | architect + pm + planner | `docs/architecture/STACK_OPTIONS_MATRIX.md` ✅ (M1-c2) |
| Stack Decision | architect (orchestrator 승인) | `docs/architecture/STACK_DECISION.md` ✅ (M1-c3, D-007) |
| Stack Evolution Plan | architect | `docs/architecture/STACK_EVOLUTION_PLAN.md` ✅ (M1-c3) |
| ADR-0001 | architect | `docs/adr/ADR-0001-stack-decision.md` ✅ (M1-c3, **Accepted**) |
| Harness Maturity Roadmap | planner | `docs/harness/HARNESS_MATURITY_ROADMAP.md` ✅ (M0 보강에서 사전 작성) |
| Harness Execution Board | pm | `docs/harness/HARNESS_EXECUTION_BOARD.md` ✅ (M0 보강에서 사전 작성) |
| Harness Layered Architecture | architect | `docs/architecture/HARNESS_LAYERED_ARCHITECTURE.md` ✅ (M0 보강에서 사전 작성) |
| Evaluation Scenarios | analytics | `docs/harness/EVALUATION_SCENARIOS.md` ✅ (D-006 보너스, M3 입력) |
| Design Direction | designer | `docs/brand/DESIGN_DIRECTION.md` ✅ (M1-c4) |
| Theme Decisions | designer | `docs/brand/THEME_DECISIONS.md` ✅ (M1-c4) |

### 3.1 M1 성공 기준

- 서비스 핵심 흐름 정의 완료
- 기술 스택이 서비스 목적에 맞게 선택됨 (3개 후보 평가 + 선택 사유 + 진화 경로)
- "왜 이 스택인지" 설명 가능 (ADR-0001)
- 향후 마이그레이션 트리거 정의 완료

---

## 4. M2 ~ M5 (게이트 정의)

상세는 `AGENTS.md §6`. 각 마일스톤 진입 시 본 문서에 산출물 체크리스트 + 서명 추가.

### 4.1 M3 Harness Hardening 게이트 조건 (W15 dispatch v2 + Cycle A 반영, 2026-05-12 갱신)

W16 종료 시점에 다음이 충족되어야 M3 게이트 통과:

1. Evaluator 5개 모두 strict CI 통합 (SRS / Payment / Privacy / Content / RLS)
2. Golden 102건 완성 (W15 Cycle A 갱신: SRS 57 / Payment 15 / Privacy 16 / Content 14)
3. Adversarial 13건 모두 evaluator로 violation 분류 (D-014 RLS-ADV 9→13 보강)
4. **baseline 수집 파이프 동작 검증** (D-010 봉인) — 3-source(Supabase staging + synthetic seed + 1인 dogfood) 적재 확인 + 14-day cron 가동 + Day-0~Day-N snapshot 누적. **real-user baseline 14-day 수집은 M5로 이연**
5. `eval-nightly.yml` cron 최소 1회 green
6. audit_log alert **stub 모드** dev 환경 검증 (D-011 봉인) — console + DB 적재. 실 Slack webhook URL 연결은 M5 이연
7. R-23 (RLS) 해소, R-24 (distractors retire) 해소
8. ADR-0003 (Custom runner) Accepted finalization
9. **ADR-0006 (packages/srs-core) Accepted** ✅ (W15 Cycle A 봉인, 2026-05-12)
10. PRD threshold 4 KPI commit ✅ (D-013 충족, planner W15 Day-1 commit)

진척 dashboard: `docs/harness/M3_GATE_V2_DASHBOARD.md` (orchestrator W15 Cycle A 작성).

W15 Cycle A 추가 결정 (2026-05-12):
- D-014 RLS-ADV-006~009 → 010~013 rename (backend 작성분), security 005~009 (STRIDE cover) 우선
- D-015 SRS-051~055 → 056~060 rename (learning 작성분), analytics 051~053 (lead 점유) 우선 + 5개 evaluator enum W16 D1 backend 활성화 큐

ADR-0007 (baseline 저장소 정식 ADR)은 M3 게이트 통과 후 W16 architect 작성. ADR-0008 (secret 회전)은 M4 W17로 이연.

---

## 5. 인수 가이드 (Beta Handoff 전 미니 가이드)

새 팀이 이 저장소를 받으면 다음 순서로 읽는다.

1. `AGENTS.md` — 헌장
2. `docs/00_development_handoff.md` — v0.3 봉인 인계
3. `docs/HANDOFF.md` (이 문서) — 마일스톤 현황
4. `docs/PROJECT_MAP.md` — 디렉토리 맵
5. `docs/DECISION_LOG.md` — 의사결정 누적
6. `docs/architecture/STACK_DECISION.md` (M1 이후) — 기술 선택 사유
7. `docs/SERVICE_REVIEW_QA.md §8` — 기획 단계 결정 SSOT
8. `docs/REVIEW_QA.md §5` — 사업계획서 결정 SSOT
9. 각자 담당 영역의 v0.3 기획서

---

## 6. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M0 진입 + 마일스톤 상태판 초안 + M0 게이트 체크리스트 | orchestrator |
| 2026-05-11 | M3 W15 시작 표기 + §4.1 M3 게이트 조건 갱신 (D-010~D-013 봉인 반영, real-user baseline → 수집 파이프 검증으로 변경, alert stub 모드 명시, ADR-0006 추가) | orchestrator |
| 2026-05-12 | W15 Cycle A 결과 반영 — §1 마일스톤 상태판 Cycle A 진척 표기 + §4.1 ADR-0006 Accepted 표시 + D-013 충족 표시 + D-014/D-015 봉인 + Golden 102 + Adversarial 13 갱신 | orchestrator |
