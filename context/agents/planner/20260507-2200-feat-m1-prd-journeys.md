# M1 사이클 1 — PRD + User Journeys + ASSUMPTIONS 보강

- **Agent**: planner
- **Commit SHA**: m1-c1 (단일 트리, worktree 미가동 — M2부터 worktree 분기)
- **Branch / Worktree**: feat/m1-product / (single tree)
- **작업 목표**: M1 산출물 14개 중 3개 동시 작성 (PRD / USER_JOURNEYS / ASSUMPTIONS 보강)
- **왜 필요한 변경이었는가**:
  1. PRD는 M1 게이트의 핵심 — 제품 약속 5개 + 학습 루프 4단계 + 기능 P0 + KPI + non-goals 정의
  2. USER_JOURNEYS는 5층 하네스의 Evaluation Layer 입력 — 87 golden case가 8개 journey에 매핑됨
  3. ASSUMPTIONS는 추정치 → 검증 가능한 형태로 누적
- **변경된 파일**:
  - `docs/product/PRD.md` (신규, 약 200줄)
  - `docs/product/USER_JOURNEYS.md` (신규, 약 250줄)
  - `docs/product/ASSUMPTIONS.md` (편집, A-501~505 + A-601~605 추가)
- **실행 명령어**: N/A (문서 작성)
- **테스트 결과**: N/A
- **사용한 Skill**:
  - **humanizer** (built-in 다듬기 — SKILLS_INVENTORY §3.1 정책대로 외부 OSS 부재): 문장 자연스러움. AI 사용 은폐 목적 아님 (사용자 지시 §3 준수)
  - **theme-factory**: 표/섹션 구조화 (PRD §5 P0 기능 표, Journey × Layer 매핑 표)
  - **frontend-design**: ASCII 흐름도 (J-001~J-005 흐름)
  - **taste-skill**: "멋진 데모 vs 신뢰 가능한 제품" 톤 (PRD §2 약속 5개)
- **내린 결정**:
  1. PRD 제품 약속 5개를 측정 가능한 형태로 매핑 (Evaluation Scenarios에 모두 link)
  2. 학습 루프 4단계로 고정 (CC2-25 결정 그대로)
  3. P0 기능 15개 — F-001 ~ F-015. v0.3 기획서 06_feature_spec.md를 SSOT로 참조
  4. 8개 journey 정의 (5 핵심 + 3 보조). 핵심 5는 M2 thin vertical slice 후보
  5. 20주 일정 매핑 (W1-W20)
- **리스크 / 후속 작업**:
  - PRD §10 일정 매핑은 M1 진입 시점인 W3-W4에 한정 — M2 이후는 가정
  - User Journeys §8 매핑이 EVALUATION_SCENARIOS와 1:1 정합되어야 함 (M3 진입 시 재검증)
  - ASSUMPTIONS A-501~505는 베타 실측 데이터 대기 (M5 검증 시점)
- **의존성 / blocker**: 
  - **다음 사이클 의존**: architect의 Domain Model + Stack Options Matrix가 작성되어야 PRD §5 P0 기능이 구현 단위로 분해 가능
  - blocker 없음
- **다음 추천 액션**: 
  1. **architect**: Domain Model + Stack Options Matrix 작성 시작
  2. **pm**: MVP Scope 작성 (PRD §5 P0 기능을 sprint task로 분해)
  3. **designer**: Design Direction (PRD §4 학습 루프와 J-001 흐름을 시각 언어로 변환)
