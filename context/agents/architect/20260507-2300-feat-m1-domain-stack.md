# M1 사이클 2 — Domain Model + Stack Options Matrix

- **Agent**: architect
- **Commit SHA**: m1-c2 (단일 트리)
- **Branch / Worktree**: feat/m1-architecture / (single tree)
- **작업 목표**: Domain Model 15 엔티티 + Stack Options Matrix 3 후보 정량/정성 평가
- **왜 필요한 변경이었는가**:
  1. Domain Model 없이는 packages/contracts/ 인터페이스 작성 불가 → backend/frontend/qa 모두 차단
  2. Stack Options Matrix는 사용자 지시 §9 "고정 스택 금지" 충족 — 3 후보 평가 후 STACK_DECISION으로 봉인
  3. 5층 하네스의 Contract/Retrieval Layer 매핑이 본 문서의 직접 결과
- **변경된 파일**:
  - `docs/architecture/DOMAIN_MODEL.md` (신규, 약 280줄)
  - `docs/architecture/STACK_OPTIONS_MATRIX.md` (신규, 약 280줄)
- **실행 명령어**: N/A (문서)
- **테스트 결과**: N/A
- **사용한 Skill**:
  - **software-architecture** (가이드 문서) — 5층 패턴 + 도메인 분리 원칙
  - **prompt-engineering** (LLM) — 정량 평가 매트릭스 가중치 검토
  - **mcp-builder** (보류) — MCP server 작성 시점이 아니므로 사용 안 함
- **내린 결정**:
  1. **15 엔티티 정의**: User/Profile/GuestSession + Word/Translation/Distractor/WordPack/Manifest/Audio + UserWordState/Attempt/Session/DailyUsage + Entitlement + Report/Deletion/AuditLog
  2. **불변 키 정책**: word_id, user_id 영구 키 (CC2-15, CC3-07 그대로)
  3. **3 후보 가중 평가**: 후보 A(Lean) 78.2% / B(Balanced) 68.0% / C(Scale) 52.9%
  4. **권고**: 후보 A 채택 (1인 개발자 + 20주 + 월 $25 이하 적합)
  5. **벤더 락인 완화책**: Domain Model §7 9개 경계면 추상화 + 마이그레이션 트리거 정의 (Evolution Plan 차순 작업)
- **리스크 / 후속 작업**:
  - STACK_DECISION + STACK_EVOLUTION_PLAN + ADR-0001 작성 (이 사이클 다음, M1 사이클 3)
  - ADR-0002 (Domain Model 경계면 추상화 범위) — M2 진입 전
  - ADR-0004 (RLS 매트릭스) — M2-S2 진입 전
- **의존성 / blocker**:
  - **이 작업 결과에 의존**: pm의 MVP Scope (병행 작성 중 — 본 사이클의 Stack 결정에 의존), backend의 contracts 패키지 구현
  - blocker 없음
- **다음 추천 액션**:
  1. orchestrator 승인 → STACK_DECISION + ADR-0001 작성 (M1 사이클 3)
  2. designer는 Design Direction을 후보 A의 디자인 토큰 시스템과 정합되게 설계
