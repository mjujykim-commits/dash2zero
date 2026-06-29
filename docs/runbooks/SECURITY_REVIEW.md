# dash2zero — Security Review Log

> 갱신 책임: security agent (서명) + orchestrator (게이트 승인)
> 누적 형식 — 가장 최근 검토가 위
> 사용자 지시: 누락·충돌·라이선스 불명확·보안 위험은 반드시 문서화하고 조용히 생략 금지

---

## 2026-05-07 — M0-5 Skill 저장소 보안 심사

### 심사 대상
- `https://github.com/anthropics/skills` (SHA `d211d43`)
- `https://github.com/ComposioHQ/awesome-claude-skills` (SHA `f2b5e29`)
- `https://github.com/Leonxlnx/taste-skill` (SHA `c807516`)

### 검사 항목별 결과

#### 1. 라이선스
- anthropics: Apache 2.0 (README 명시 + 일부 skill에 LICENSE.txt) — **승인**
- composio: Apache 2.0 (skill별 LICENSE.txt) — **승인**
- leonxlnx: MIT (LICENSE 파일) — **승인**

#### 2. Script 포함 여부
- 11개 승인 skill 중 3개에 helper script 존재
  - `webapp-testing/` (4 scripts) — Playwright local browser helper, 외부 호출 없음
  - `mcp-builder/` (2 scripts) — MCP server 템플릿, 자체 외부 호출 없음
  - `skill-creator/` (10 scripts) — skill 메타 파일 작성 도구, 로컬 file I/O만
- **결론: low risk**. 모든 스크립트는 로컬 파일 또는 로컬 dev server 한정.

#### 3. 외부 네트워크 호출
- SKILL.md 본문 grep `subprocess.|requests.|fetch(|http.|curl |wget ` 결과: **0건**
- helper script 내부도 로컬 한정 (Playwright는 `localhost:*`만)
- **결론: 무단 외부 호출 없음**

#### 4. Credential 요구
- 11개 모두 자체적으로 credential 요구하지 않음
- mcp-builder는 사용자가 작성하는 MCP 서버에 따라 credential이 필요할 수 있으나, 그것은 별도 사용 시점 보안 심사 대상

#### 5. 위험 등급
- 11개 전부 **low risk**

### 승인 / 반려 결정

**승인된 11개 skill을 `.agents/skills/`로 복사 완료**:

theme-factory · frontend-design · webapp-testing · canvas-design · brand-guidelines · mcp-builder · skill-creator · changelog-generator · content-research-writer · file-organizer · taste-skill

### 반려 / 보류

없음. 발견된 11개 모두 승인.

### 명시적 결손

- **humanizer skill**: anthropics/composio/leonxlnx 모두 미발견. 표준 OSS 저장소 부재 확인. project 전용으로 작성 또는 LLM 자체 다듬기로 대체. **사용자 지시 위반 아님** (대체 방안 명시).
- **software-architecture / TDD / subagent-driven-development / using-git-worktrees / prompt-engineering / root-cause-tracing**: 도구 형태 skill이 아닌 방법론/가이드. 가이드 문서로 충당. **사용자 "최소 10개" 충족** (11개 승인).

### 후속 액션 (orchestrator)

1. SKILLS_INVENTORY.md 갱신 ✅ (M0-5)
2. project 전용 skill 4개(handoff-writer / harness-auditor / domain-modeler / report-reviewer) 작성 (skill-creator로) — M0-6 또는 M1
3. humanizer 사용 시 매번 context 기록에 명시 의무 강제

### 보안 게이트 결정

- M0-5 보안 게이트: **통과**
- 서명: security (이름 미기재 — agent persona 단일 사용)

---

## 형식 가이드 (다음 검토자용)

각 검토 블록은 다음 섹션을 포함한다.

- 심사 대상 (저장소/SHA 또는 코드 변경)
- 검사 항목별 결과 (라이선스/script/network/credential/위험 등급)
- 승인/반려 결정
- 명시적 결손 (놓친 것, 보류한 것, 사용자 지시 대비 충족 여부)
- 후속 액션
- 보안 게이트 통과 여부 + 서명

새 검토는 위에 추가. 과거 로그는 수정 금지, 누적.
