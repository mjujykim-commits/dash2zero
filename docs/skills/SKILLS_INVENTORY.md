# dash2zero — Skills Inventory

> 갱신 책임: orchestrator + security
> 최종 갱신: 2026-05-07 M0-5 (clone + 보안 심사 완료)
> 정책: `.vendor/agent-skills/`에 clone → security 심사 → 승인된 것만 `.agents/skills/`로 복사

---

## 1. 심사 결과 요약 (M0-5)

| 출처 저장소 | upstream SHA | License | 위험 | 결과 |
|---|---|---|---|---|
| anthropics/skills | `d211d43` | Apache 2.0 (대부분) — 일부 source-available 미사용 | low | **승인** |
| ComposioHQ/awesome-claude-skills | `f2b5e29` | Apache 2.0 (skill별 LICENSE.txt) | low | **승인** |
| Leonxlnx/taste-skill | `c807516` | MIT | low | **승인** |

**총 11개 skill 승인 → `.agents/skills/`로 복사 완료**. 사용자 지시 "최소 10개 이상" 충족.

## 2. 승인된 Skill 인벤토리 (11개)

| Skill | 출처 | upstream SHA | License | Script 파일 | Network | Cred 필요 | Risk | 승인자 | 사유 |
|---|---|---|---|---|---|---|---|---|---|
| theme-factory | anthropics-skills | d211d43 | Apache 2.0 (LICENSE.txt) | 0 | 없음 | 없음 | low | security | 표준 anthropics 공식 skill, 정적 가이드 |
| frontend-design | anthropics-skills | d211d43 | Apache 2.0 (LICENSE.txt) | 0 | 없음 | 없음 | low | security | 표준 anthropics 공식 skill |
| webapp-testing | anthropics-skills | d211d43 | Apache 2.0 (LICENSE.txt) | 4 (Playwright helpers) | 로컬 dev server에 한정 | 없음 | low | security | Playwright 통한 로컬 webapp 테스트만, 외부 호출 없음 |
| canvas-design | anthropics-skills | d211d43 | Apache 2.0 (LICENSE.txt) | 0 | 없음 | 없음 | low | security | 시각 디자인 가이드 |
| brand-guidelines | anthropics-skills | d211d43 | Apache 2.0 (LICENSE.txt) | 0 | 없음 | 없음 | low | security | 브랜드 스타일 가이드 |
| mcp-builder | anthropics-skills | d211d43 | Apache 2.0 (LICENSE.txt) | 2 (template helpers) | 없음 (사용자 작성 MCP에 의존) | 사용 시 MCP server 별 키 | low | security | MCP 서버 빌드 가이드, dash2zero가 호출 시점에 검토 |
| skill-creator | anthropics-skills | d211d43 | Apache 2.0 (저장소 정책) | 10 (skill 메타 도구) | 없음 | 없음 | low | security | 신규 skill 작성 보조 도구, project 전용 skill 4개 생성에 사용 |
| changelog-generator | composio-awesome | f2b5e29 | Apache 2.0 | 0 | git 로컬만 | 없음 | low | security | git log 분석 → CHANGELOG 생성 |
| content-research-writer | composio-awesome | f2b5e29 | Apache 2.0 | 0 | 없음 | 없음 | low | security | 콘텐츠 작성 가이드 |
| file-organizer | composio-awesome | f2b5e29 | Apache 2.0 | 0 | 없음 (로컬 파일만) | 없음 | low | security | 로컬 파일 구조 정리 가이드 |
| taste-skill | leonxlnx-taste | c807516 | MIT | 0 | 없음 | 없음 | low | security | 디자인 taste 가이드 |

### 2.1 Script 파일이 있는 skill 추가 메모

- **webapp-testing**: Playwright `chromium`/`firefox` helper. 로컬 dev server `http://localhost:*`에만 접근. 외부 송출 없음.
- **mcp-builder**: MCP server 템플릿 빌더. 자체적으로 외부 호출하지 않음. 사용자가 작성한 MCP server가 호출 시 별도 보안 심사.
- **skill-creator**: skill 정의 파일(SKILL.md) 작성/검증 도구. 외부 호출 없음.

세 항목 모두 **low risk** 유지.

## 3. 부재 / 미설치 Skills (사용자 지시 대비)

### 3.1 필수 6개 중 부재 1개

| Skill | 부재 사유 | 처리 방침 |
|---|---|---|
| **humanizer** | 표준 OSS 저장소 부재 (anthropics/composio/leonxlnx 모두에 없음) | **project 전용으로 작성**(M1) 또는 LLM 자체 능력으로 대체. 사용 시 `context` 기록 "사용한 Skill"에 명시 |

### 3.2 추가 12개 중 부재 6개

| Skill | 부재 사유 | 처리 방침 |
|---|---|---|
| software-architecture | 별도 도구 형태 skill 없음 (anthropics/composio 모두) | architect는 가이드 문서로 대체 — `docs/architecture/HARNESS_LAYERED_ARCHITECTURE.md` 등 |
| test-driven-development | 도구 형태 skill 없음 (방법론) | backend는 표준 TDD 워크플로우 — pytest/jest red-green-refactor |
| subagent-driven-development | 도구 형태 skill 없음 | 본 헌장(AGENTS.md)이 이미 그 패턴 자체 |
| using-git-worktrees | 도구 형태 skill 없음 | M2 진입 시 `scripts/setup-worktrees.sh` 작성 + AGENTS.md §8에 가이드 |
| prompt-engineering | leonxlnx-taste/research에 문서 형태로 일부 존재 | 가이드 문서 참조 + LLM 자체 능력 |
| root-cause-tracing | 도구 형태 skill 없음 | backend는 5-Why / Fishbone 등 표준 RCA 워크플로우 |

→ **충족 평가**: 사용자 지시 "최소 10개 이상 설치" 기준 11개 설치로 충족. 부재 7개는 모두 도구 skill이 아닌 방법론/가이드라 자체 문서로 충당.

## 4. Project 전용 Skill 생성 계획 (skill-creator로 — M0-6 또는 M1)

| Skill | 책임 | 사용처 | 생성 시점 |
|---|---|---|---|
| handoff-writer | 마일스톤/사이클 종료 시 handoff 문서 자동 생성 | orchestrator | M0-6 또는 M1 |
| harness-auditor | harness 컴플라이언스 검사 (skill 사용/context 기록/DoD) | orchestrator | M3 진입 직전 |
| domain-modeler | v0.3 기획서 → 도메인 모델 추출 보조 | architect, backend | M1 |
| report-reviewer | rollup/리포트 일관성 검토 | orchestrator | M1 또는 M2 |

`.agents/skills/skill-creator/`를 사용하여 각 skill을 `SKILL.md` 형식으로 작성.

## 5. humanizer 사용 정책 (재명시 — 강조)

- **자연스러운 문장 다듬기 용도로만** 사용
- **AI 사용 사실 은폐 / 탐지 회피 / 작성 주체 속이기 금지**
- 본 인벤토리에 OSS 저장소가 없어 LLM 자체 다듬기 능력으로 대체 — context 기록 "사용한 Skill"에 `humanizer (built-in)` 명시 + purpose 기재
- 위반 시 orchestrator는 머지 거부

## 6. 알려진 누락 / 위험

| 항목 | 사유 | 후속 |
|---|---|---|
| anthropics/skills 저장소 루트 LICENSE 파일 부재 | README에 Apache 2.0 명시 + 각 skill 별 LICENSE.txt 보유 | 위험 없음 — 이미 라이선스 명시됨 |
| skill-creator 디렉토리 자체에 LICENSE.txt 없음 | 저장소 정책상 Apache 2.0으로 추정 | 사용 전 anthropics 공식 답변 확인 권고 (medium-low) — orchestrator가 추적 |
| humanizer 부재 | OSS 저장소 부재 | LLM 자체 다듬기로 대체, project 전용 skill 작성 보류 |

## 7. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M0-4 인벤토리 초안 + 필수/추가/전용 skill 명단 정의 | orchestrator |
| 2026-05-07 | M0-5 3개 저장소 clone + 보안 심사 + 11개 skill `.agents/skills/`로 승인 복사 + 부재 7개 처리 방침 확정 | orchestrator + security |
