# M1 사이클 3 — STACK_DECISION + STACK_EVOLUTION_PLAN + ADR-0001

- **Agent**: architect
- **Commit SHA**: m1-c3
- **Branch / Worktree**: feat/m1-stack-decision / (single tree)
- **작업 목표**: 후보 A 채택을 STACK_DECISION + EVOLUTION_PLAN + ADR-0001로 봉인
- **왜 필요한 변경이었는가**:
  1. STACK_OPTIONS_MATRIX의 권고(후보 A 78.2%)를 형식 결정으로 봉인 — 사용자 지시 §9-6 "선택 결과는 무조건 문서화"
  2. EVOLUTION_PLAN으로 향후 마이그레이션 트리거 사전 정의 — 사용자 지시 §9-5
  3. ADR-0001로 영구 추적 가능한 결정 봉인
- **변경된 파일**:
  - `docs/architecture/STACK_DECISION.md` (신규, ~150줄)
  - `docs/architecture/STACK_EVOLUTION_PLAN.md` (신규, ~210줄)
  - `docs/adr/ADR-0001-stack-decision.md` (신규, ~120줄)
- **실행 명령어**: N/A
- **테스트 결과**: N/A
- **사용한 Skill**:
  - software-architecture (가이드 — ADR 표준 형식, 4 phase 진화 모델)
  - prompt-engineering (LLM — 트리거/마이그레이션 비용 표 정합성)
- **내린 결정**:
  1. **후보 A 봉인**: RN+Expo+TS / Supabase / RC / Firebase / EAS / TTS(M2 결정)
  2. **4 phase 진화 모델**: Lean → Growth → Balanced → Enterprise
  3. **20개 마이그레이션 트리거 정의**: 비즈니스 5 + 운영 7 + 규제 5 + 팀 3
  4. **9개 경계면별 진화 경로** (Auth/DB/Storage/Queue/TTS/Observability/Billing/Search/Notification)
  5. **추상화 vs 하드코딩 분리**: 5개만 추상화 (TTS / Storage URL / Trace / Auth / Webhook)
  6. **5개 Reversal Trigger** (가격 인상 / DAU 10k / EU / B2B / 팀 확장)
- **리스크 / 후속 작업**:
  - ADR-0002 (Domain Model 추상화 범위) — M2 진입 전
  - ADR-0003 (Harness 도구 선택) — M3
  - ADR-0004 (RLS 매트릭스) — M2-S2 전
  - ADR-0005 (TTS provider) — M2-S2 W6
  - 분기별 트리거 점검 (post-launch) — orchestrator
- **의존성 / blocker**:
  - **본 작업이 의존**: 모든 후속 M1/M2/M3 산출물 (Domain Model, MVP Scope, Design Direction 등)
  - blocker 없음
- **다음 추천 액션**:
  1. **orchestrator**: ADR-0001 승인 + DECISION_LOG D-007 갱신 ✅ (이 사이클에 함께 처리)
  2. **designer**: Design Direction + Theme Decisions (M1 사이클 4)
  3. **orchestrator**: M1 게이트 검증 + 서명 → M2 진입 (M1 사이클 5)
