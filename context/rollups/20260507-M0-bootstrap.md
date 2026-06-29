# Rollup — M0 Bootstrap (2026-05-07)

> 작성: orchestrator
> 사이클: M0 Bootstrap
> 상태: **완료, 게이트 통과 권고**

---

## 1. 전체 진행 상황

M0 Bootstrap의 6개 sub-task 모두 완료.

| Task | 상태 | 산출물 |
|---|---|---|
| M0-1 디렉토리 구조 생성 | ✅ | apps/packages/infra/.codex/.agents/.vendor/docs/context/scripts/fixtures + worktrees용 root |
| M0-2 9 agent 페르소나 배치 | ✅ | `.claude/agents/` 9개 (orchestrator 신규 + 기획 검토 archive에서 8명 복원) + `docs/archive/agents/`에 옵션 4명 보존 |
| M0-3 AGENTS.md / .codex/config.toml | ✅ | swarm coding 헌장 v1.0 + Codex 설정 |
| M0-4 핵심 추적 문서 6종 | ✅ | PROJECT_MAP / DECISION_LOG / HANDOFF / SKILLS_INVENTORY / SWARM_LEDGER / ASSUMPTIONS |
| M0-5 Skill clone + 보안 심사 | ✅ | 11 skill 승인 → `.agents/skills/` 복사 + SECURITY_REVIEW 기록 |
| M0-6 첫 rollup (이 문서) | ✅ | 본 문서 |

## 2. 완료된 핵심 산출물

### 2.1 헌장 / 설정
- `AGENTS.md` (v1.0, 11개 섹션, 9 agent + 옵션 4명, skill 규칙, context 시스템, DoD, 마일스톤 게이트)
- `.codex/config.toml` (SSOT 우선순위, skill 강제 매핑, harness 후보, gate, security boundaries, DoD)

### 2.2 추적 SSOT 6종
- `docs/PROJECT_MAP.md` — 디렉토리 맵 + v0.3 영역별 매핑
- `docs/DECISION_LOG.md` — 기획 단계 결정 승계 + swarm 신규 D-001~D-004
- `docs/HANDOFF.md` — 마일스톤 상태판 + M0 게이트 체크리스트
- `docs/skills/SKILLS_INVENTORY.md` — 11 skill 승인 + 7 부재 처리 방침
- `context/SWARM_LEDGER.md` — Day 0 ledger
- `docs/product/ASSUMPTIONS.md` — 5개 영역 25개 가정 등록

### 2.3 보안
- `docs/runbooks/SECURITY_REVIEW.md` — M0-5 보안 심사 통과

## 3. 미해결 리스크

| 리스크 | 심각도 | 처리 |
|---|---|---|
| **C-13 사업자 미확정** | high | D-42 데드라인 유지. M1 진입과 무관하게 진행되나 paid release 전 차단 |
| **humanizer 표준 skill 부재** | low | LLM 자체 다듬기로 대체 + context 기록에 명시 |
| **skill-creator 라이선스 추정 (Apache 2.0)** | low | 사용 전 anthropics 공식 답변 1회 확인 권고 |
| **기술 스택 잠정 결정의 재검증 미완료** | medium | M1 STACK_OPTIONS_MATRIX → STACK_DECISION → ADR-0001 |
| **worktrees 미생성** | low | M2 본격 병렬 시 생성, 현재 단일 트리 작업 충분 |
| **project 전용 skill 4개 미작성** | low | M0-6 또는 M1에서 skill-creator로 작성 |

## 4. Regressions

- M0는 신규 사이클이라 regression 없음
- 다음 사이클부터 frontend/backend 코드 변경이 시작되면 regression 추적 시작

## 5. Harness 적용 상태

| 영역 | 상태 |
|---|---|
| Trace 수집 | M3 도입 (Langfuse/Phoenix 후보) |
| Evaluation | M3 도입 |
| Regression | M3 도입 |
| Structured output 검증 | M3 도입 |
| Baseline metrics | M2 데이터 수집, M3 baseline 확립 |
| 실행 이력 추적 | **현재**: context/agents/ + SWARM_LEDGER + rollup |

→ M0 단계 harness는 "agent 활동 기록"만 가동. 본격 trace는 M2/M3 단계에서 도입.

## 6. Skill 사용 현황 (M0)

| Skill | 사용 횟수 | 사용 agent | 비고 |
|---|---|---|---|
| (M0는 bootstrap이라 skill 사용 없음) | - | - | M1 진입 시 skill 사용 강제 시작 |

orchestrator는 M1 첫 사이클부터 매 작업마다 skill 사용 점검을 시작한다.

## 7. 다음 단계 권고

### 7.1 M0 게이트 결정
- **M0 게이트 통과 권고**. 사용자 사업계획서/v0.3 봉인 기획서 → swarm coding 헌장/SSOT/skill 시스템/보안 심사 모두 정합성 확인.
- 알려진 누락(humanizer 등) 모두 명시적 처리 방침 확보.
- `docs/HANDOFF.md` 마일스톤 상태판 갱신 필요 (M0 → completed).

### 7.2 M1 진입 준비

M1 산출물 14개 (`docs/HANDOFF.md §3` 참조). 책임 매핑:

| 산출물 | 주 책임 | 보조 |
|---|---|---|
| PRD | planner | pm |
| ASSUMPTIONS (보강) | planner + architect | - |
| User Journeys | planner | designer |
| MVP Scope | pm | planner |
| Domain Model | architect | backend |
| Stack Options Matrix | architect | pm + planner |
| Stack Decision | architect | orchestrator 승인 |
| Stack Evolution Plan | architect | - |
| ADR-0001 | architect | - |
| Harness Maturity Roadmap | planner | - |
| Harness Execution Board | pm | - |
| Harness Layered Architecture | architect | - |
| Design Direction | designer | frontend |
| Theme Decisions | designer | frontend |

### 7.3 M1 진입 권고 순서

1. **planner**: PRD + User Journeys + ASSUMPTIONS 보강 + Harness Maturity Roadmap (skill 강제: humanizer + theme-factory + frontend-design + taste-skill)
2. **architect**: Domain Model + Stack Options Matrix (skill 강제: software-architecture(가이드 문서) + prompt-engineering(LLM) + mcp-builder)
3. **pm**: MVP Scope + Harness Execution Board (skill 강제: humanizer + theme-factory + frontend-design + taste-skill)
4. **architect → orchestrator 합의**: Stack Decision + Evolution Plan + ADR-0001
5. **designer**: Design Direction + Theme Decisions (skill 강제: theme-factory + frontend-design + canvas-design + brand-guidelines)
6. **architect**: Harness Layered Architecture (M3 미리보기)
7. **orchestrator**: M1 게이트 검증 + 서명 → M2 진입

### 7.4 핵심 성공 기준 (M1)

- 서비스 핵심 흐름이 PRD에 정의됨
- 기술 스택 3개 후보(Lean / Balanced / Scale) 정량/정성 평가 완료
- "왜 이 스택인지" ADR-0001로 설명 가능
- 진화 트리거(MAU/job 처리량/trace volume/enterprise 요구 등) 정의 완료
- 가정(ASSUMPTIONS)과 사실 분리 명시

## 8. 새 팀이 이어받기 위한 Handoff Note

다음 사람이 이 저장소를 받으면 다음 순서로 진입한다.

1. `AGENTS.md` 읽고 헌장 이해
2. `docs/HANDOFF.md`에서 현재 마일스톤 상태 확인
3. `context/rollups/`에서 가장 최근 rollup 읽기 (= 이 문서)
4. `docs/DECISION_LOG.md`에서 누적 결정 확인
5. `docs/00_development_handoff.md`에서 v0.3 봉인 인계 확인
6. 본인 영역의 v0.3 기획서(02~24) 1차 읽기
7. 본인 영역의 페르소나 정의(`.claude/agents/{role}.md`) 재확인
8. M1 산출물 중 본인 책임 항목부터 시작

## 9. Orchestrator 서명

- **M0 게이트 통과**: 권고 ✅
- **서명일**: 2026-05-07
- **다음 게이트**: M1 (Product+Architecture+Stack)
- **M1 진입 차단 항목**: 없음 (C-13은 D-42 게이트로 분리 추적)
