# HARNESS_LAYERED_ARCHITECTURE 1차 작성

- **Agent**: architect
- **Commit SHA**: m0boost
- **Branch / Worktree**: chore/bootstrap / (single tree)
- **작업 목표**: 5층 구조(Contract / Policy / Retrieval / Evaluation / Observability) + 각 레이어 책임/인터페이스/실패 모드/소유자/테스트/교체 가능성 정의
- **왜 필요한 변경이었는가**: 사용자 지시 §8 — Architect 책임 산출물. 각 레이어를 교체 가능한 인터페이스로 추상화해야 도구 선택이 변해도 코드가 안 깨짐 (사용자 지시 §2 "교체 가능성 큰 경계면 추상화")
- **변경된 파일**: `docs/architecture/HARNESS_LAYERED_ARCHITECTURE.md` (신규, 280+ 줄)
- **실행 명령어**: N/A
- **테스트 결과**: N/A
- **사용한 Skill**: software-architecture (가이드 문서 — 5층 패턴) + prompt-engineering (LLM 자체 다듬기) + mcp-builder(향후 확장 시 검토). 본 작업에서 핵심은 5층 분해
- **내린 결정**:
  1. 5층 분해: Contract → Policy → Retrieval → Evaluation → Observability (위→아래)
  2. 각 레이어에 책임/인터페이스(M1 이후 위치)/실패 모드/소유자/테스트/교체 가능성 6항목 정의
  3. 데이터 흐름 예시 (학습 정답 입력)로 5층이 어떻게 협력하는지 시각화
  4. 실패 격리 원칙 (각 레이어 실패가 위로 전파되지 않음)
  5. ADR 연결: ADR-0001 (Stack), ADR-0002 (Domain Model), ADR-0003 (Harness 도구), ADR-0004 (RLS) 인덱스 등록
- **리스크 / 후속 작업**:
  - M1에서 Contract Layer의 packages/contracts/ 실제 구현 시작
  - M2에서 Policy Layer의 RLS 매트릭스 SQL 작성 (ADR-0004)
  - M3에서 Evaluation runner 구현 + Harness 도구 ADR-0003
- **의존성 / blocker**: HARNESS_MATURITY_ROADMAP(planner) + HARNESS_EXECUTION_BOARD(pm) + EVALUATION_SCENARIOS(analytics)에 의존
- **다음 추천 액션**: M1 진입 시 STACK_OPTIONS_MATRIX 작성하면서 본 5층의 각 레이어가 후보 스택에서 어떻게 구현되는지 명시 (Contract Layer는 zod ↔ io-ts ↔ valibot 등)
