# dash2zero

> 영어권 사용자를 위한 한국어 학습 모바일 앱 (MVP, 1인 개발자 + 13 agent swarm coding 팀)
> 작성: orchestrator (2026-05-12, M3 W15 사전 작업 마감 시점)
> 갱신 책임: orchestrator (마일스톤 종료 시 + 외부 가시 변경 시)

---

## 1. dash2zero가 무엇인가

영어권 사용자가 **한국어 starter 60단어**부터 학습을 시작해, Leitner 5-stage SRS로 mastered까지 진행하는 모바일 앱.

- **target 사용자**: 영어권 한국어 학습 입문자 (US/CA/UK/AU/NZ, EU 미출시)
- **핵심 가치**: 3분 lesson + 04:00 local reset + 무료 한도 + 영문 UI (en-US 단일)
- **수익 모델**: freemium (starter 60 무료, core 180 + topik premium) + RC + Apple/Google IAP
- **가격 (D-018 봉인, 2026-05-13)**: Premium Monthly $4.99/mo · Premium Annual $49.99/yr (사업계획서 §10.2)
- **GA 일자 권고**: 2026-06-15 월 또는 2026-06-22 일 (사용자 R-M5-01 응답 결과에 따라 분기)

---

## 2. 현재 마일스톤 상태 (2026-05-12 시점)

| M | 이름 | 상태 | 시작 | 완료 |
|---|---|---|---|---|
| M0 | Bootstrap | ✅ completed | 2026-05-07 | 2026-05-07 |
| M1 | Product+Architecture+Stack | ✅ completed | 2026-05-07 | 2026-05-08 |
| M2 | Thin Vertical Slice | ✅ completed (S1~S7) | 2026-05-08 | 2026-05-08 |
| M3 | Harness Hardening | 🟡 in_progress (W13 ✅ / W14 ✅ / **W15 Cycle B dispatch ✅** / W16 게이트 진입 직전) | 2026-05-11 | - |
| M4 | Security+QA | pending (W17~W18, 2026-05-26~6/8) | - | - |
| M5 | Beta Handoff | pending (W19~W20, 2026-06-09~6/22) | - | - |

**상세**: `docs/HANDOFF.md` §1 마일스톤 상태판

**M3 게이트 진척**: 10조건 중 4/10 충족 + 6/10 W15 종료 trajectory — `docs/harness/M3_GATE_V2_DASHBOARD.md`

---

## 3. 빠른 시작 (외부 인수 시)

### 3.1 인수 직후 첫 읽을 문서 9건 (순서 고정)

1. **본 README.md** — 인수 첫 페이지
2. `AGENTS.md` — swarm coding 헌장 (v1.0 + §5.4 Risk 정책)
3. `CHANGELOG.md` — 외부 가시 변경 인벤토리
4. `docs/00_development_handoff.md` — v0.3 봉인 인계 (기획 팀 작성)
5. `docs/HANDOFF.md` — 마일스톤 현황 + 게이트 서명
6. `docs/PROJECT_MAP.md` — 디렉토리 맵
7. `docs/DECISION_LOG.md` — 의사결정 누적 (D-001~D-017 + ADR 0001~0008)
8. `docs/risk/RISK_REGISTER.md` — R-NN 22 + sprint risk 단일 SoT
9. `docs/DECISION_RISK_ADR_MATRIX.md` — 3자 cross-reference 정합성 검증

### 3.2 도메인별 입수 SSOT

| 영역 | 핵심 SSOT |
|---|---|
| 사업/MVP | `docs/01_business_plan.md` / `docs/02_service_prd.md` / `docs/product/PRD.md` |
| 학습 방법론 | `docs/03_learning_methodology.md` / `docs/learning/LESSON_COMPLETE_RATE_THRESHOLDS.md` |
| UX/디자인 | `docs/05_wireframes.md` / `docs/10_design_system.md` / `docs/design/*` |
| 기능/기술 | `docs/06_feature_spec.md` / `docs/07_erd.md` / `docs/08_api_spec.md` / `docs/architecture/*` |
| 분석 | `docs/12_event_taxonomy.md` / `docs/harness/BASELINE_METRICS.md` |
| 결제/약관 | `docs/13_payment_policy.md` / `docs/legal/FAMILY_SHARE_OPS.md` |
| 보안 | `docs/18_security_review.md` / `docs/security/RLS_EVALUATOR_HYBRID_PLAN.md` / `docs/security/AUDIT_ALERT_RUNBOOK.md` |
| 운영 | `docs/19_admin.md` / `docs/20_customer_support.md` / `docs/runbooks/PRE_MORTEM_M3_TO_GA.md` |
| QA/배포 | `docs/21_qa_test_cases.md` / `docs/qa/M4_E2E_SUITE_PLAN.md` / `docs/23_deployment.md` |

---

## 4. 기술 스택 (ADR-0001 Accepted, Lean / Managed / Serverless-first)

| 영역 | 선택 | ADR |
|---|---|---|
| Mobile | React Native + Expo + TypeScript, Expo Router, EAS | ADR-0001 |
| Backend | Supabase (Postgres / Auth / Storage / Edge Functions / RLS) | ADR-0001 |
| Auth | Apple Sign In + Google Sign In + Email magic link (비밀번호 제외) | ADR-0001 |
| Game/Speech | TTS Google Cloud Neural2 (한국어), Supabase Storage + 앱 캐시 | ADR-0005 |
| Payment | RevenueCat + Apple/Google IAP, 무료 체험 없음, Restore 필수 | ADR-0001 / ADR-0002 |
| Analytics | Firebase Analytics + Crashlytics, IDFA 미사용 | ADR-0001 |
| SRS | 자체 Leitner 5-stage (1/3/7/14/30일), `packages/srs-core` (ADR-0006) | ADR-0006 |
| Domain | 5+4 추상화 (auth/storage/queue/model/observability/billing/search/vector/notification) | ADR-0002 |
| Harness | Custom runner + Firebase (Langfuse 보류) | ADR-0003 |
| RLS | 13 테이블 × 5 역할 × 4 CRUD 매트릭스 | ADR-0004 |
| Baseline | 3-source (staging + synthetic + dogfood) | ADR-0007 (W16 pending) |
| Secret 회전 | 분기별 (Slack/Supabase) / 6개월 (EAS/RC) | ADR-0008 (M4 W17 pending) |

**진화 경로**: `docs/architecture/STACK_EVOLUTION_PLAN.md` — MAU 0 → 1k → 10k+ 단계별 trigger.

---

## 5. SSOT 우선순위 (충돌 시 적용 순서)

```
1. docs/DECISION_LOG.md          (모든 의사결정 통합)
2. docs/risk/RISK_REGISTER.md    (R-NN 단일 SoT, D-016/D-017 봉인 후 강화)
3. docs/adr/ADR-NNNN-{slug}.md   (되돌리기 어려운 결정)
4. docs/SERVICE_REVIEW_QA.md §8  (기획 단계 결정)
5. docs/REVIEW_QA.md §5          (사업계획서 결정)
6. v0.3 봉인 기획서 23개         (docs/01~24)
```

상세: `AGENTS.md §5` Context 기록 시스템 + §5.4 Risk 등록 강제 정책 5조.

---

## 6. swarm coding 팀 구성 (13명)

### Core 9
orchestrator / planner / pm / designer / architect / frontend / backend / security / qa

### Specialist 4 (사전 채용 + 마일스톤 활성)
learning / analytics / legal / devops

**페르소나 정의**: `.claude/agents/*.md`
**Worktree**: `worktrees/*` (M2 본격 병렬 후 활성)
**역할별 skill 강제**: `AGENTS.md §4`

---

## 7. 사용자 자율 결정 위임 정책 (D-012 봉인)

사용자(`mju.jykim@gmail.com`)는 다음 영역에 대해 swarm coding 팀에게 자율 결정 권한을 위임:
- 운영 blocker (사업자 등록 / Slack URL / 베타 모집) → 제품 완성 후 M5 entry reconfirm
- 12명 시니어 자율 판단 영역 → orchestrator 통합 승인만

**M5 W19 진입 1주 전(2026-06-02)** PM이 사용자에게 R-M5-01 reconfirm 알림 송출 — 양식: `context/rollups/20260512-R-M5-01-user-reconfirm-template.md`.

---

## 8. 정량 산출 누적 (2026-05-12 시점)

| 항목 | 누적 |
|---|---|
| 마일스톤 | M0~M3 W15 Cycle B dispatch (6/8) |
| Sprint | W5~W15 (총 11 sprint 진행) |
| 결정 (D-NNN) | 16건 (D-001~D-017, D-002/D-003 사용 안 함) |
| ADR | 8건 (5 Accepted + 3 pending) |
| Risk | 34개 R-NN (open 18 + closed 4 + mitigated 2 + closed candidacy 1) + sprint risk 13건 |
| Golden case | 102+건 (SRS 57 + Payment 15 + Privacy 16 + Content 14) |
| Adversarial | 13건 (RLS 13건, W15 D-014 보강) |
| 산출 파일 (Cycle A 시점) | 신규 ~78 + 갱신 ~22 |
| 산출 파일 (M3 종료 예상) | 신규 ~109 + 갱신 ~53 |
| Pre-mortem 시나리오 | 30건 (score ≥ 4 GA 차단 후보 8건) |

---

## 9. 운영 비용 (1인 개발자 기준)

| 항목 | 무료 티어 | 유료 진입 trigger |
|---|---|---|
| Supabase | Spark plan | MAU 10k+ 또는 DB 500MB+ |
| RevenueCat | $2,500/mo 매출까지 무료 | $2,500/mo 이상 |
| Firebase | Spark plan | DAU 1k+ (Crashlytics) / BigQuery export 시 |
| Apple Developer | $99/year | 유료 (필수) |
| Google Play | $25 one-time | 유료 (필수) |
| GitHub Actions | 2000분/mo | 무료 한도 70% 도달 시 (Q-OPS-W15-008) |
| Slack | Free (90일 메시지) | 분기별 검토 |

---

## 10. 외부 인수 시 즉시 실행 명령

```bash
# 1. clone
git clone <repo-url>
cd dash2zero

# 2. install
pnpm install        # workspace 의존성 (packages/srs-core 빌드 포함)

# 3. SSOT 읽기 순서 (본 README §3.1)
cat AGENTS.md CHANGELOG.md
cat docs/HANDOFF.md docs/PROJECT_MAP.md docs/DECISION_LOG.md
cat docs/risk/RISK_REGISTER.md

# 4. 마일스톤 게이트 검증 (M3 종료 직전 시점)
pnpm eval            # 5 evaluator strict (SRS/Payment/Privacy/Content/RLS)
pnpm eval:srs        # SRS 57건
pnpm eval:rls        # RLS 13건 adversarial

# 5. 베타 운영 (M5 W19 진입 후)
cat context/rollups/20260512-R-M5-01-user-reconfirm-template.md  # 사용자 reconfirm 양식
cat docs/runbooks/PRE_MORTEM_M3_TO_GA.md                          # 출시 후 monitoring 입력
```

---

## 11. 라이선스 / 기여 (M5 이후)

- **라이선스**: M5 이후 결정 (deferred)
- **기여 가이드**: GA 이후 결정 (deferred)
- **연락**: mju.jykim@gmail.com (사용자, 1인 개발자)

---

## 12. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-12 | README 신규 작성 (외부 인수 가이드, M5 W20-03 Beta Handoff 입력 SSOT, 사전 작업 8 사이클 누적 최종 시점) | orchestrator |
