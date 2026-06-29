# HARNESS_MATURITY_ROADMAP 1차 작성

- **Agent**: planner
- **Commit SHA**: m0boost
- **Branch / Worktree**: chore/bootstrap / (single tree)
- **작업 목표**: 측정 철학 + 5단계 성숙도(bootstrap → alpha → beta → production → enterprise) + 도구 진화 경로 정의
- **왜 필요한 변경이었는가**: PM 옵션 B — M1 진입 전에 하네스 3대 문서 초안을 미리 작성하면 M1 PRD/Stack 작성 시 측정 가정과 함께 통합 사고 가능
- **변경된 파일**: `docs/harness/HARNESS_MATURITY_ROADMAP.md` (신규, 200+ 줄)
- **실행 명령어**: N/A
- **테스트 결과**: N/A
- **사용한 Skill**: humanizer (built-in 다듬기 — 페르소나 톤 유지) + theme-factory (구조화) + frontend-design (표 가독성) + taste-skill (의사결정 톤). 모두 본 작업 1회 사이클에서 사용
- **내린 결정**:
  1. 측정 철학을 "멋진 데모 vs 신뢰 가능한 제품" 비교로 명시
  2. 5단계 성숙도 + 단계별 졸업 게이트 정의
  3. 의도적 보류 5항목 (사용자별 학습 시간 정밀 / 망각 곡선 개인화 / A/B 가격 / 실시간 SOC / BigQuery export)
- **리스크 / 후속 작업**:
  - M3 도구 선택 시점에 ADR-0003 필요
  - 단계별 졸업 게이트 검증 절차는 orchestrator가 매 마일스톤 시점에 점검
- **의존성 / blocker**: 없음. 본 문서는 PM/architect 문서의 상위 입력
- **다음 추천 액션**: M1 진입 시 PRD/USER_JOURNEYS와 함께 본 로드맵의 alpha/beta 단계 산출물을 PRD §측정 섹션에 매핑
