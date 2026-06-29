# EVALUATION_SCENARIOS 1차 윤곽 (87 case)

- **Agent**: analytics (D-006으로 사전 활성화, 2026-05-07)
- **Commit SHA**: m0boost (M0 보강 — 단일 트리, worktree 미가동)
- **Branch / Worktree**: chore/bootstrap / (single tree)
- **작업 목표**: M3 evaluation runner의 입력이 될 시나리오 윤곽 작성
- **왜 필요한 변경이었는가**: PM이 옵션 C 선택 — analytics 사전 활성화로 평가 시나리오를 미리 정의하면 M3 진입 시 즉시 runner 구현 가능. PM/architect의 하네스 문서가 본 시나리오에 의존
- **변경된 파일**: `docs/harness/EVALUATION_SCENARIOS.md` (신규, 280+ 줄)
- **실행 명령어**: (문서 작성, 명령 없음)
- **테스트 결과**: N/A (시나리오 정의 단계, 실행은 M3)
- **사용한 Skill**: prompt-engineering (LLM 자체 다듬기) + root-cause-tracing(방법론)으로 결정 매핑 추적
- **내린 결정**: 87 case 분포 = SRS 50 + 결제 9상태 + 6 adversarial + Privacy 11 + Content 11. 각 영역 100% 통과를 baseline으로 설정. (DECISION_LOG D-006)
- **리스크 / 후속 작업**:
  - SRS golden 50개 실제 yaml 작성은 M3 (learning과 협업)
  - Adversarial case는 security와 협업해서 보강 필요 (M4)
  - Langfuse 도입 결정 시 trace 통합 매핑 필요 (ADR-0003)
- **의존성 / blocker**: learning 정식 활성화 시 50 SRS case 보강 필요. 현 단계는 윤곽으로 충분
- **다음 추천 액션**: M3 진입 시 scripts/eval/runner.ts 구현 + fixtures/golden/{srs,payment,privacy,content}/*.yaml 작성
