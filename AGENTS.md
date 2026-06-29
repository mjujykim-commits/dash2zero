# dash2zero — Swarm Coding 팀 헌장 (AGENTS.md)

> 버전: v1.0
> 발효일: 2026-05-07
> 대상: dash2zero swarm coding 팀 9명 + 추가 채용 agent
> 기준 문서: `docs/00_development_handoff.md`, `docs/SERVICE_REVIEW_QA.md`, `docs/REVIEW_QA.md`

---

## 1. 팀 구성 (13명 — Core 9 + Specialist 4)

### 1.1 Core 9 (모든 마일스톤 활동)

| 역할 | Agent ID | 페르소나 정의 | Worktree |
|---|---|---|---|
| 오케스트레이터 | `orchestrator` | `.claude/agents/orchestrator.md` | `worktrees/orchestrator` |
| 기획자 | `planner` | `.claude/agents/planner.md` | `worktrees/planner` |
| PM | `pm` | `.claude/agents/pm.md` | `worktrees/pm` |
| 디자이너 | `designer` | `.claude/agents/designer.md` | `worktrees/designer` |
| 아키텍트 | `architect` | `.claude/agents/architect.md` | `worktrees/architect` |
| 프론트엔드 | `frontend` | `.claude/agents/frontend.md` | `worktrees/frontend` |
| 백엔드 | `backend` | `.claude/agents/backend.md` | `worktrees/backend` |
| 보안 | `security` | `.claude/agents/security.md` | `worktrees/security` |
| QA | `qa` | `.claude/agents/qa.md` | `worktrees/qa` |

### 1.2 Specialist 4 (사전 채용 — 2026-05-07)

| 역할 | Agent ID | 페르소나 정의 | Worktree | 주 활동 마일스톤 |
|---|---|---|---|---|
| 학습 설계 | `learning` | `.claude/agents/learning.md` | `worktrees/learning` | M1 도메인 자문 / M2 SRS 알고리즘 검증 / M5 콘텐츠 검수 |
| 데이터/분석 | `analytics` | `.claude/agents/analytics.md` | `worktrees/analytics` | M3 이벤트 택소노미 정밀화 / 하네스 evaluation 정의 |
| 결제/법무 | `legal` | `.claude/agents/legal.md` | `worktrees/legal` | D-42(C-13 확정 후) 약관/결제 정책 최종 검토 / M4 Security와 협업 |
| DevOps/릴리스 | `devops` | `.claude/agents/devops.md` | `worktrees/devops` | M2 CI/CD 부트스트랩 / M5 ASO·배포·릴리스 게이트 |

**Specialist 4는 항시 standby**. 마일스톤이 도달하면 Orchestrator가 정식 활성화 명령(`docs/DECISION_LOG.md`에 산출물 범위 기록).

전원 20년 이상 경력 페르소나. Orchestrator는 코드를 작성하지 않고 통합·승인·기록·게이트만 담당.

### 1.3 Archive 정책

`docs/archive/agents/`에 12명 페르소나(기획 검토 단계 원본)가 보존되어 있다. 필요 시 추가 채용 가능하나, 13명으로 충분히 커버되므로 다른 채용은 Orchestrator 결정 시에만.

---

## 2. 전역 핵심 원칙 (절대 위반 금지)

1. **질문 최소화** — 정말 막히는 경우에만 질문. 추측 금지, 결정 로그 우선.
2. **설명보다 실행** — 산출물 우선, 산문 보조.
3. **추적 가능성** — 모든 작업에 commit SHA + context 기록 + 결정 로그가 따라붙는다.
4. **변경 문서화** — 코드 변경은 곧 문서 변경.
5. **인수인계 가능성** — 모든 산출물은 다음 팀이 받을 수 있는 형태로 마감.
6. **Thin Vertical Slice 우선** — 가로로 넓게 깔지 말고 세로로 한 줄기 먼저 끝까지.
7. **과도한 추상화/인프라/미래 대비 금지**.
8. **그러나 교체 가능성 큰 경계면은 추상화** — auth, storage, queue, model provider, observability, billing, search, vector store, notification.
9. **"지금은 가볍게, 갈아끼울 부분은 미리 분리"**.
10. **기술 스택 영구 확정 금지** — 단계별 진화 계획이 결과물.

## 3. 금지 행동

- 인증 우회
- 불투명한 외부 텔레메트리
- 불필요한 권한 요청
- 무단 네트워크 호출
- 위험한 스크립트 실행
- humanizer를 AI 사용 은폐 / 탐지 회피 목적으로 사용 (자연스러운 문장 다듬기에만 허용)
- main 브랜치 직접 commit
- Orchestrator 승인 없는 머지

---

## 4. Skill 사용 규칙 (역할별 강제)

각 agent는 **매 작업마다** 다음 skill을 반드시 사용하고, context 기록의 "사용한 Skill" 항목에 명시한다.

| 역할 | 매 작업마다 필수 Skill |
|---|---|
| 기획자 | humanizer · theme-factory · frontend-design · taste-skill |
| PM | humanizer · theme-factory · frontend-design · taste-skill |
| 프론트엔드 | humanizer · theme-factory · frontend-design · taste-skill |
| 디자이너 | theme-factory · frontend-design · canvas-design |
| 아키텍트 | software-architecture · prompt-engineering · mcp-builder (설계 시) |
| 백엔드 | test-driven-development · root-cause-tracing · prompt-engineering |
| QA | webapp-testing (사용자 플로우 검증 시) + content-research-writer (D-020 봉인 후, learning agent 콘텐츠 cross-review 시 G-01~G-10 quality gate 검증) |
| 보안 | (보안 심사 시 skill-creator + root-cause-tracing 권장) |
| 학습 설계 (`learning`) | content-research-writer · prompt-engineering (콘텐츠 검수 시) |
| 데이터/분석 (`analytics`) | prompt-engineering · root-cause-tracing (이벤트/지표 정의 시) |
| 결제/법무 (`legal`) | content-research-writer · humanizer (약관/처리방침 다듬을 때, 단 §4.1 humanizer 제한 준수) |
| DevOps (`devops`) | changelog-generator · file-organizer · using-git-worktrees(가이드) |
| 오케스트레이터 | 모든 agent의 skill 사용 내역을 파일 단위로 점검 |

Orchestrator는 미사용 발견 시 **머지 보류**.

### 4.1 humanizer 사용 제한

- 문장을 자연스럽게 다듬는 용도로만 사용
- 작성 주체 은폐, AI 사용 은폐, 탐지 회피 목적 **금지**
- 사용 시 context 기록에 명시 (skill: humanizer / purpose: 가독성 개선)

---

## 5. Context 기록 시스템 (필수)

### 5.1 경로

```
context/agents/{role}/YYYYMMDD-HHMM-{branch}-{shortsha}.md
```

예: `context/agents/backend/20260507-1430-feat-auth-a3f9c12.md`

### 5.2 필수 템플릿 (12항목)

```markdown
# {제목}

- **Agent**: {role}
- **Commit SHA**: {full sha}
- **Branch / Worktree**: {branch} / {worktree}
- **작업 목표**: 한 줄
- **왜 필요한 변경이었는가**: 1-3줄
- **변경된 파일**: 목록
- **실행 명령어**: 사용한 명령
- **테스트 결과**: pass/fail + 핵심 수치
- **사용한 Skill**: skill 이름 + 목적
- **내린 결정**: 1-3줄, 결정 로그 링크
- **리스크 / 후속 작업**: 알려진 위험과 todo
- **의존성 / blocker**: 다른 agent 의존
- **다음 추천 액션**: 다음 사이클에서 무엇
```

### 5.3 갱신 규칙

| 변경 종류 | 갱신할 문서 |
|---|---|
| 기술/제품 의사결정 | `docs/DECISION_LOG.md` |
| 구조 변경 | `docs/PROJECT_MAP.md` |
| 마일스톤 상태 | `docs/HANDOFF.md` |
| 외부 가시 변경 | `CHANGELOG.md` (changelog-generator로) |
| 되돌리기 어려운 결정 | `docs/adr/ADR-NNNN-{slug}.md` |
| Skill 추가/변경 | `docs/skills/SKILLS_INVENTORY.md` |
| **Risk 등록/갱신/해소** | **`docs/risk/RISK_REGISTER.md` (단일 SoT, 본 SoT 우선)** |
| 게이트 검증 결과 | `docs/harness/M3_GATE_V2_DASHBOARD.md` (M3) / 다음 마일스톤 동등 |
| 5층 하네스 컴플라이언스 | `docs/harness/HARNESS_COMPLIANCE_AUDIT.md` |

### 5.4 Risk 등록 강제 정책 (D-016/D-017 봉인 후 추가, 2026-05-12)

12명 agent 병렬 작업 시 R-NN ID 충돌이 4회 발현(D-014/D-015/D-016/D-017)했다. 다음 정책 강제:

1. **단일 SoT 원칙**: `docs/risk/RISK_REGISTER.md`가 R-NN의 최종 SoT. 다른 SSOT에 risk 등록 시 본 문서에도 **동시 등록 강제**.
2. **ID 충돌 사전 차단**: agent가 신규 R-NN 등록 시 RISK_REGISTER §2.1 마지막 ID 다음 번호 사용. 충돌 발견 시 즉시 orchestrator escalate.
3. **status 갱신 일자 명시**: closed 시 일자 + 해소 방법 + 증거 commit SHA 또는 SSOT 링크 명시.
4. **sprint risk → 글로벌 promotion**: R-W{NN}-NN / R-M{N}-NN이 sprint 종료 후 잔존 시 R-NN으로 promotion 강제.
5. **위반 시 처리**: orchestrator는 미사용/미반영 발견 시 **머지 보류**.

---

## 6. 마일스톤 게이트 (Orchestrator 승인 필수)

| M | 산출물 | 성공 기준 | 게이트 |
|---|---|---|---|
| M0 Bootstrap | repo skeleton, AGENTS.md, .codex, skill inventory, 보안 심사, ledger | 저장소 실행 가능, skill 가동, 누락 명시 | Orchestrator 서명 |
| M1 Product+Architecture+Stack | PRD, assumptions, journeys, MVP scope, non-goals, domain model, stack matrix, decision, evolution, ADR | 핵심 흐름 정의 + 스택 선택 + 진화 경로 | Architect+PM+Planner 합의 + Orchestrator 서명 |
| M2 Thin Vertical Slice | 핵심 사용자 흐름 E2E + 최소 UI/UX + 핵심 API + 데이터 흐름 + 핵심 하네스 | 1개 시나리오 실제 동작 + trace + contract validation | Frontend+Backend+QA 서명 + Orchestrator 서명 |
| M3 Harness Hardening | trace/eval, baseline, regression, structured output, dashboard | golden case 검증 + regression 감지 | Architect+PM+QA 서명 + Orchestrator 서명 |
| M4 Security+QA | adversarial/permission/e2e/audit/secret/retention | 핵심 플로우 통과 + 보안 리스크 문서화 | Security+QA 서명 + Orchestrator 서명 |
| M5 Beta Handoff | README, 실행, demo, seed, runbook, rollup, handoff | 외부 팀 clone→실행 가능 | 전원 서명 + Orchestrator 최종 |

---

## 7. Definition of Done

다음 7가지를 모두 만족해야 작업이 완료된 것이다.

1. **코드 존재** (또는 문서/구성 산출물 존재)
2. **테스트 존재** (코드 변경 시 — 단위/통합/E2E 중 적절한 것)
3. **문서 존재** (관련 SSOT 갱신)
4. **Context 기록 존재** (`context/agents/{role}/`에 12항목 템플릿)
5. **필요한 harness/tracing 존재** (해당하는 경우)
6. **보안 영향 검토 존재** (Security가 서명 또는 면제 사유 명시)
7. **Orchestrator 승인 또는 의도적 보류 사유 기록**

DoD 미충족 작업은 머지하지 않는다.

---

## 8. 병렬 개발 전략 (git worktree)

### 8.1 워크트리 권장 구조

```
worktrees/
  orchestrator/   (검토/통합 전용, 코드 변경 없음)
  planner/        (docs/product/, docs/adr/)
  pm/             (docs/HANDOFF.md, docs/harness/HARNESS_EXECUTION_BOARD.md)
  designer/       (docs/brand/, packages/design-tokens/)
  architect/      (docs/architecture/, packages/contracts/)
  frontend/       (apps/mobile/)
  backend/        (apps/api/, packages/domain/, infra/)
  security/       (docs/runbooks/SECURITY_REVIEW.md, RLS, Privacy Manifest)
  qa/             (apps/*/test/, fixtures/)
  learning/       (docs/product/learning/, fixtures/seeded/words/)
  analytics/      (docs/harness/, packages/analytics-sdk/)
  legal/          (docs/runbooks/{DATA_POLICY,RETENTION_POLICY}.md, 13/16/17번 v0.3 보강)
  devops/         (infra/eas/, infra/supabase-deploy/, scripts/release/)
```

### 8.2 브랜치 컨벤션

- `chore/bootstrap`
- `feat/core-flow`
- `feat/design-system`
- `feat/backend-domain`
- `feat/harness`
- `feat/auth`
- `feat/admin`
- `fix/security-{slug}`
- `test/e2e-core`
- `docs/handoff`

### 8.3 머지 규칙

- main 직접 commit 금지
- Orchestrator 승인 없이 머지 금지
- 각 머지는 commit message에 `[role]` 접두 + 작업 목표 한 줄
- DoD 7항목 충족 확인 후 머지

### 8.4 Hybrid Delegation Policy (D-026 / 2026-05-22 외부 designer sign-off)

본 정책은 13 agent 모두 준수. 핵심 원칙: **"최종 사용자 체감 퀄리티(Deliverable)의 수호"** > 기계적 프로세스 준수.

| 영역 | 권장 패턴 | 사유 |
|---|---|---|
| **모션 토큰 / StyleSheet / 마이크로 인터랙션 / 애니메이션 콜백 cleanup / 단순 버그 픽스 / 디자이너 피드백 반영** | Orchestrator 직접 작성 (in-context edit) | 컨텍스트 재구성 비용 감소 + stream timeout 회피 + 실시간 정교한 튜닝 |
| **신규 코어 화면 도입 (Thin Vertical Slice) / 복잡한 외부 API 레이어 설계 / 비즈니스 데이터 흐름 / Harness 테스트 스위트 대규모 구축** | Sub-agent (frontend/qa/security) spawn 강제 | Orchestrator 컨텍스트 과밀화 방지 + 독립 병렬 개발 시너지 |

상세 근거 및 사이클 이력: `docs/DECISION_LOG.md` D-026.

---

## 9. 하네스 / Observability 책임 분담

| 역할 | 산출물 | 위치 |
|---|---|---|
| 기획자 | 측정 철학 + 단계별 성숙도 정의 | `docs/harness/HARNESS_MATURITY_ROADMAP.md` |
| PM | regression / observability / structured output workstream + milestone + baseline + readiness 기준 | `docs/harness/HARNESS_EXECUTION_BOARD.md` |
| 아키텍트 | 5층 구조(Contract / Policy / Retrieval / Evaluation / Observability) | `docs/architecture/HARNESS_LAYERED_ARCHITECTURE.md` |
| 오케스트레이터 | compliance audit | `docs/harness/HARNESS_COMPLIANCE_AUDIT.md` |

도구 선택은 서비스 규모에 맞춤(Langfuse / Phoenix / 동등). dash2zero MVP 단계에서는 가벼운 옵션 우선, M3에서 결정.

---

## 10. 즉시 실행 순서 (한 번 더)

1. ~~프로젝트 구조 생성~~ ✅ M0-1
2. ~~9 agent 페르소나 배치~~ ✅ M0-2
3. ~~AGENTS.md / .codex/config.toml~~ ⏳ M0-3 (이 문서 + .codex 작성 중)
4. ~~핵심 추적 문서 6종~~ ⏳ M0-4
5. ⏳ Skill 저장소 clone + 보안 심사 — M0-5
6. ⏳ Orchestrator 첫 rollup — M0-6
7. M1: PRD / assumptions / journeys / MVP scope / non-goals / domain / stack matrix / stack decision / evolution / ADR
8. M2: Thin Vertical Slice 설계 + 구현
9. M3: Harness Hardening
10. M4: Security + QA
11. M5: Beta Handoff

각 마일스톤 게이트는 Orchestrator 서명 필수.

---

## 11. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | v1.0 발효. 9 agent 팀 헌장, skill 규칙, context 시스템, DoD, 마일스톤 게이트 정의 | orchestrator |
| 2026-05-12 | §5.3 갱신 규칙에 risk register / 게이트 dashboard / 5층 컴플라이언스 3행 추가 + §5.4 Risk 등록 강제 정책 5조 신설 (D-014~D-017 cross-track ID 충돌 4회 발현 후 정책 강화) | orchestrator |
| 2026-05-14 | §4 qa skill에 content-research-writer 추가 (D-020 봉인 — learning↔qa 콘텐츠 상호 검증 정책) | orchestrator |
