# dash2zero — Project Map

> 갱신 책임: orchestrator
> 갱신 트리거: 디렉토리 구조 변경 시
> 마지막 갱신: 2026-06-05 (M5 W19 종료 — P1 5건 dispatch 완료 + Reanimated 도입 봉인 + Dark-pattern 거리두기 + 인출 학습 정합 + M5 RECAP, docs/handoff + docs/release + apps/mobile 컴포넌트 5건 + 인프라 2건)

---

## 1. 최상위 구조

```
dash2zero/
├── README.md                    # 외부 인수 가이드 (M5 Beta Handoff 입력)
├── AGENTS.md                    # Swarm coding 헌장 (v1.0 + §5.4 Risk 정책)
├── CHANGELOG.md                 # 외부 가시 변경 (changelog-generator로 갱신)
├── .codex/
│   └── config.toml              # Codex/Agent 설정 (SSOT 우선순위, skill, gates)
├── .claude/
│   └── agents/                  # 9 swarm agent 페르소나
├── .agents/
│   └── skills/                  # 보안 심사 후 승인된 skill 복사본
├── .vendor/
│   └── agent-skills/            # 외부 skill 저장소 clone (심사 전)
├── apps/                        # 사용자/관리자 facing 앱 (M2~)
├── packages/                    # 공유 패키지 (contracts, design-tokens, domain)
├── infra/                       # IaC, 배포 정의 (M2~)
├── docs/                        # 모든 문서 SSOT
├── context/                     # Agent 작업 기록 + rollup
├── scripts/                     # 빌드/운영 스크립트
├── fixtures/                    # 테스트 데이터 (seeded/golden/adversarial)
└── worktrees/                   # git worktree 병렬 작업 (M2~)
```

## 2. docs/ 구조

```
docs/
├── PROJECT_MAP.md               # 이 문서
├── DECISION_LOG.md              # 모든 의사결정 통합 로그
├── HANDOFF.md                   # 마일스톤 게이트 + 서명 + handoff note
├── 00_development_handoff.md    # v0.3 → swarm coding 인계 (기획팀 작성)
├── REVIEW_QA.md                 # 사업계획서 리뷰 SSOT (1·2차 라운드)
├── SERVICE_REVIEW_QA.md         # 23개 서비스 기획서 리뷰 SSOT (CC2/B/CC3)
├── 01_business_plan.md ~ 24_app_store_aso.md   # v0.3 봉인 기획서 23개 + 사업계획서
├── product/
│   ├── ASSUMPTIONS.md           # 가정/추정치 (숫자 근거 명시)
│   ├── PRD.md                   # M1 산출물
│   ├── USER_JOURNEYS.md         # M1 산출물
│   └── MVP_SCOPE.md             # M1 산출물
├── architecture/
│   ├── DOMAIN_MODEL.md          # M1 산출물
│   ├── STACK_OPTIONS_MATRIX.md  # M1 산출물 (3개 후보 비교)
│   ├── STACK_DECISION.md        # M1 산출물 (최종 선택)
│   ├── STACK_EVOLUTION_PLAN.md  # M1 산출물 (마이그레이션 트리거)
│   └── HARNESS_LAYERED_ARCHITECTURE.md  # M1 산출물 (5층)
├── adr/
│   ├── ADR-NNNN-{slug}.md       # 되돌리기 어려운 결정
│   ├── ADR-0007-baseline-storage.md   # Accepted 2026-05-21 (3-source + aggregate-only + R4 Reversal)
│   └── ADR-0009-reanimated-adoption.md # Accepted 2026-06-02 (D-033 봉인, W18 D-1 사전 진입)
├── architecture/
│   └── REANIMATED_WORKLET_GUIDE.md    # orchestrator (2026-06-01 — M5 P1 dispatch 사전 가이드, 10 섹션, ADR-0009 회람 의견 통합)
├── harness/
│   ├── HARNESS_MATURITY_ROADMAP.md    # 기획자 (M3)
│   ├── HARNESS_EXECUTION_BOARD.md     # PM (M3)
│   ├── HARNESS_COMPLIANCE_AUDIT.md    # Orchestrator (M3 W15 Cycle B — 5층 컴플라이언스 매트릭스 + 10 Gap)
│   ├── BASELINE_METRICS.md            # analytics (M3 W15 — 4 KPI 정의 + 3-source)
│   ├── M3_GATE_V2_DASHBOARD.md        # orchestrator (M3 W15 Cycle A — 10조건 진척)
│   ├── M3_GATE_V2_CHECKLIST.md        # orchestrator (2026-05-22 — D-7 evidence 도장 양식)
│   ├── M4_GATE_CHECKLIST.md           # orchestrator (2026-06-01 — D-7 8조건 evidence 양식)
│   └── GA_GATE_CHECKLIST.md           # orchestrator (2026-06-01 — D-14 사전 16조건 evidence 양식 + 판정 행렬)
├── security/
│   ├── RLS_EVALUATOR_HYBRID_PLAN.md   # security (M3 W15 — static+W16 hybrid plan)
│   ├── AUDIT_ALERT_RUNBOOK.md         # security (M3 W15 — paper 모드 + M5 활성화)
│   └── MOTION_SECURITY_REVIEW.md      # security (2026-05-21 — 5 항목, expo-haptics 권한 + Apple HIG + Animated leak)
├── legal/
│   └── FAMILY_SHARE_OPS.md            # legal (M3 W15 — Q-PL-NEW-005)
├── qa/
│   ├── M4_E2E_SUITE_PLAN.md           # qa (M3 W15 — Maestro+Detox hybrid, P0 12 + P1 6)
│   └── MOTION_TEST_CASES.md           # qa (2026-05-21 — MTC-A~G 15+ case, D-024/D-028/D-029 정합)
├── handoff/                           # orchestrator → 외부 designer 협업 SoT (2026-05-21~)
│   ├── W17-WORK-ORDER-COMPLETION-REPORT.md   # 마감 보고 (Owner 전달용)
│   ├── W17-DESIGNER-SIGNOFF.md               # 외부 Designer Full Sign-off 메모 (D-030)
│   ├── W18-P1-WORK-ORDER-REQUEST.md          # P1 발주 사전 요청 (6/2 Owner 전달 완료)
│   ├── W18-DESIGNER-P1-RESPONSE.md           # Designer P1 회신 보관 (D-031 봉인 근거)
│   ├── W18-DISPATCH-PLAN.md                  # W18~W19 dispatch 계획 (디자이너 결정 정합)
│   ├── W18-SIGNOFF-REQUEST.md                # W18 마감 (Counter/Toast/Badge)
│   ├── W19-SIGNOFF-REQUEST.md                # W19 마감 (ConfirmSheet/PTR)
│   └── M4-BACKEND-SUBMIT-ATTEMPT-AUDIT.md    # backend SSOT 정합 권고 (M5 W18 Owner 결정)
├── backlog/                           # M5+ 진입 사전 분해 (2026-06-01~)
│   ├── M5_LEARNING_QUALITY.md                # L-M5-001 오답 정답 미하이라이트 + CLEANUP-MOTION-LEGACY
│   ├── L-M5-001-correct-answer-highlight-decomposition.md # learning 문헌 검증 + QuizOption v2 사양 + D-031 draft
│   └── CLEANUP-MOTION-LEGACY-pre-audit.md    # ChoiceCard/PulseOverlay 안전 삭제 grep + 사이클 W/X 분해
├── release/                           # 마일스톤 종합 보고서 (stakeholder 공유용, 2026-06-01~)
│   ├── M3_M4_MILESTONE_RECAP.md              # M3+M4 8주 진척 (W15~W17)
│   └── M5_MILESTONE_RECAP.md                 # M5 W18+W19 4일 14 자율 사이클 + 6 봉인 결정 + 5 신규 컴포넌트
├── pm/
│   ├── W15_SPRINT_BOARD.md            # pm (M3 W15 — 12명 트랙 일일 운영판)
│   └── CAPACITY_LEDGER.md             # pm (M3 W15 — 4 envelope 가이드)
├── design/
│   ├── LESSON_CHAIN_PATTERN.md        # designer (M3 W15 — R-28)
│   ├── DARK_MODE_ADOPTION_MATRIX.md   # designer (M3 W15)
│   ├── STATE_PATTERNS.md              # designer (M3 W15 — 5상태 토큰)
│   └── RR_TYPOGRAPHY_GUIDE.md         # designer (M3 W15 — UX-NEW-001)
├── devops/
│   ├── AUDIT_ALERT_SECRETS.md         # devops (M3 W15 — Secret 양쪽 등록)
│   └── EVAL_PR_CAPACITY.md            # devops (M3 W15 — 5 evaluator wall time)
├── learning/
│   ├── LESSON_COMPLETE_RATE_THRESHOLDS.md  # learning (M3 W15 — 3-tier + cohort)
│   └── CONTENT_QUALITY_POLICY.md           # orchestrator (D-019 봉인 2026-05-13 — 8 quality gate + 검수 워크플로 6단계)
├── risk/
│   └── RISK_REGISTER.md                    # orchestrator (M3 W15 Cycle B — R-NN 통합 SSOT)
├── skills/
│   └── SKILLS_INVENTORY.md      # 설치된 skill 목록 + 보안 심사 결과
├── brand/
│   ├── DESIGN_DIRECTION.md      # M1/M2 산출물 + D-022 K-pop Bold 갱신 (2026-05-18)
│   ├── THEME_DECISIONS.md       # M1/M2 산출물 + D-022 K-pop Bold 갱신 (2026-05-18)
│   ├── MOTION_SYSTEM_SPEC.md    # 외부 Lead Designer 봉인 v1.1 (2026-05-21 — RN/Expo 호환 재작성, Q-MOTION 5 decisions)
│   ├── MOTION_SYSTEM_SPEC_RN_COMPATIBILITY_REQUEST.md  # orchestrator → designer (2026-05-21 v1.0 RN 호환 재요청 패키지)
│   └── DESIGN_REVIEW_W16_MOTION.md  # 외부 Lead Designer review (2026-05-21 — APPROVED with High Honors, P0/P1/P2 분해)
├── screens/                                    # M1 original mockup
│   └── v2-stunning/                            # D-022 K-pop Bold mockup (2026-05-18 사용자 승인)
│       ├── 01-welcome.html ~ 13-report.html    # 13 화면 HTML mockup
│       ├── 14-motion-showcase.html             # W16 Premium Motion 시연 (2026-05-22 — 사용자 브라우저 체험)
│       ├── index.html                          # 13 화면 트리 + 6 user flow + Motion Showcase 링크
│       └── assets/tokens-kpop-bold.css         # production token 1:1 매핑
├── runbooks/
│   ├── SECURITY_REVIEW.md       # M0~M4 누적
│   ├── DATA_POLICY.md           # M2~ 산출물
│   ├── RETENTION_POLICY.md      # M2~ 산출물
│   ├── PRE_MORTEM_M3_TO_GA.md   # orchestrator (M3 W15 Cycle B — 8 도메인 × 30 시나리오)
│   └── DAILY_OPERATIONS_CHECKLIST.md  # orchestrator (M3 W15 마감 — 1인 개발자 매일 routine)
└── archive/
    └── agents/                  # 기획 검토 단계 12명 페르소나 (v0.3 봉인 시 보존)
```

## 3. context/ 구조

```
context/
├── SWARM_LEDGER.md              # 전체 활동 ledger (오케스트레이터 일일 갱신)
├── agents/
│   ├── orchestrator/            # Core 9 — rollup, 게이트 결정 기록
│   ├── planner/
│   ├── pm/
│   ├── designer/
│   ├── architect/
│   ├── frontend/
│   ├── backend/
│   ├── security/
│   ├── qa/
│   ├── learning/                # Specialist 4 — 사전 채용 (M1 활성)
│   ├── analytics/
│   ├── legal/
│   └── devops/                  # 각 폴더에 YYYYMMDD-HHMM-{branch}-{shortsha}.md
├── rollups/                     # 사이클 종료 rollup
└── reviews/                     # 코드 리뷰 / 마일스톤 게이트 검토
```

## 4. fixtures/ 구조

```
fixtures/
├── seeded/                      # 정상 시드 데이터 (개발/스테이징)
├── golden/                      # 정답 케이스 (regression 검증)
└── adversarial/                 # 공격/엣지 케이스 (security/QA)
```

## 5. v0.3 봉인 기획서 매핑 (영역별 SSOT)

| 영역 | v0.3 문서 | 갱신 시 영향 받는 swarm 작업 |
|---|---|---|
| 사업/MVP | 01_business_plan, 02_service_prd | M1 PRD, MVP scope |
| 학습 | 03_learning_methodology, 04_content_operations | M1 도메인, M2 SRS, content pipeline |
| UX | 05_wireframes, 10_design_system, 11_ux_writing_guide | M1 design direction, M2 mobile UI |
| 기능/기술 | 06_feature_spec, 07_erd, 08_api_spec, 09_architecture | M1 도메인/스택, M2 vertical slice |
| 분석 | 12_event_taxonomy | M3 harness, observability |
| 결제/약관 | 13_payment_policy, 17_terms_of_service | M4 결제, runbook |
| 알림/권한/보안 | 14_notification, 15_permission, 16_privacy, 18_security | M2~M4 backend, security |
| 운영 | 19_admin, 20_customer_support | M5 runbook |
| QA/배포 | 21_qa_test_cases, 22_mvp_dev_tasks, 23_deployment, 24_aso | M2~M5 |

## 6. 미생성 / 예정 디렉토리 (마일스톤별)

| 디렉토리 | 생성 마일스톤 | 책임 | 상태 |
|---|---|---|---|
| `apps/mobile/` | M2 | frontend | ✅ M2 생성 |
| `apps/api/` | M2 | backend | ✅ M2 생성 |
| `apps/admin/` | M5 | backend (운영 어드민) | 예정 |
| `packages/contracts/` | M1 | architect | ✅ |
| `packages/domain/` | M2 | backend | ✅ |
| `packages/design-tokens/` | M2 | designer | ✅ (M3 W15 states.ts 추가) |
| `packages/srs-core/` | **M3 W15** | architect (Phase 1) / backend (Phase 2) | ✅ Phase 1 스켈레톤 (ADR-0006 Accepted) |
| `infra/supabase/` | M2 | backend | ✅ |
| `infra/supabase/migrations/` | M2 | backend | ✅ (M3 W15 0004_audit_triggers.sql 추가) |
| `infra/eas/` | M2 | frontend / devops 옵션 | ✅ |
| `worktrees/*` | M2 본격 병렬 시 | 각 agent (13명) | ✅ M2 |
| `packages/analytics-sdk/` | M3 | analytics | 미생성 (현재는 apps/mobile/src/lib/analytics.ts로 inline) |
| `infra/eas/`, `infra/supabase-deploy/`, `scripts/release/` | M2~M5 | devops | 진행 |
| `fixtures/seeded/words/` | M2 | learning + qa (D-020) | ✅ M2 starter 60 + D-019(2026-05-13) core 180 + premium 300 (batch 2 완료 5/14) + monthly-2026-06 50 (자율 진행 5/14) = **590 단어 누적** · paywall promise 전체 충족 |
| `scripts/baseline/` | **M3 W15** | analytics | ✅ (queries.sql + run.ts) |
| `scripts/seed/` | **M3 W15** | devops | ✅ (synthetic-baseline.ts) |
| `scripts/eval/` | M3 W13~W15 | backend / qa | ✅ (runner / srs / rls / payment / privacy / content) |

## 7. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M0-1 디렉토리 구조 생성 | orchestrator |
| 2026-05-07 | M0-2 9 agent 페르소나 배치 + archive 4명 보존 | orchestrator |
| 2026-05-07 | M0-3 AGENTS.md / .codex/config.toml 작성 | orchestrator |
| 2026-05-07 | M0-4 PROJECT_MAP.md 초안 | orchestrator |
| 2026-05-07 | D-005 사전 채용 반영 — Specialist 4명 context 디렉토리 + worktree 매핑 + 예정 디렉토리 갱신 | orchestrator |
| 2026-05-12 | M3 W15 Cycle A 결과 반영 — packages/srs-core 신규 (ADR-0006 Phase 1), scripts/baseline / scripts/seed 신규, docs/{security,legal,qa,pm,design,devops,learning,harness} 보강 디렉토리, infra/supabase/migrations/0004 추가 | orchestrator |
| 2026-06-01 | M3 W16 + M4 W17 누적 반영 (자율 사이클 AA) — docs/handoff/ + docs/backlog/ + docs/release/ **3 신규 디렉터리**. docs/{brand,harness,adr,architecture,qa,security,screens} **14건 신규 자료**. 봉인 결정 9건 (D-022~D-030) + ADR-0007 Accepted + ADR-0009 Draft. Motion 컴포넌트 10건 (NeonButton/Shimmer/JellySwitch/BottomSheet/AudioButton/StageReveal/MorphingKoreanWord/QuizOption + ChoiceCard/PulseOverlay deprecated) + 3 게이트 양식(M3/M4/GA CHECKLIST) + Motion Showcase HTML | orchestrator |
| 2026-06-05 | M5 W18+W19 누적 반영 (자율 사이클 LL) — handoff 4건 신규 (W18-DESIGNER-P1-RESPONSE / W18-DISPATCH-PLAN / W18-SIGNOFF-REQUEST / W19-SIGNOFF-REQUEST) + release/M5_MILESTONE_RECAP 신규. **P1 5건 신규 컴포넌트** (NumberCounter / Toast / StreakBadge / ConfirmSheet / PullToRefresh) + QuizOption State 5 (D-032) + cleanup 2건 (ChoiceCard + PulseOverlay 삭제). 봉인 결정 6건 (D-031~D-036). ADR-0009 Draft → Accepted. Reanimated 도입 + babel 설정 + ToastProvider _layout mount. 사용처 통합 11건 (lesson/home/settings/privacy/layout). 누적 (M3+M4+M5): D-022~D-036 **15 봉인** + ADR 0007/0009 Accepted | orchestrator |
