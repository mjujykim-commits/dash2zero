# dash2zero — Swarm Ledger

> 목적: 전체 swarm coding 활동의 일일 ledger. 누가 무엇을 했고, 다음 사이클에 무엇이 필요한지를 한 눈에.
> 갱신 책임: orchestrator (사이클 종료 시)
> 형식: 최신이 위, 과거가 아래 (역순 누적)

---

## 2026-05-08 — Day 5 M2-S5 W9 (Edge Functions 3종 + Auth + Bootstrap Runbook)

### 활동 요약
- backend: 3 Edge Functions (merge-guest 멱등 + content-manifest ETag/diff + audio-signed-url 6h TTL)
- frontend + backend: Supabase auth client + AuthClient 어댑터 (5 메서드)
- frontend: sign-in 화면 (Apple/Google/Magic Link UI) + api.ts (4 wrapper) + useTodaySummary hook
- devops + backend: BOOTSTRAP_INFRA.md 8 영역 runbook
- security: AuthClient + 1Password Emergency Kit 검토

### Skill 사용 (강제 점검 통과)
| Agent | Skill |
|---|---|
| backend | TDD · root-cause-tracing · prompt-engineering |
| frontend | humanizer · theme-factory · frontend-design · taste-skill |
| devops | changelog-generator · file-organizer · using-git-worktrees |
| security | (review) |
| orchestrator | (점검) |

### 산출 통계 (~1,400줄)
- Edge Functions: ~580줄 (merge-guest 220 + content-manifest 200 + audio-signed-url 160)
- Mobile: ~430줄 (supabase.ts 110 + sign-in.tsx 140 + api.ts 130 + useTodaySummary.ts 50)
- Runbook: ~330줄 (BOOTSTRAP_INFRA.md)

### 주요 결정 적용
- CC2-04 + BE-NEW-003 머지 트랜잭션 + idempotency
- CC2-15 + BE-NEW-005 manifest diff fetch + ETag
- CC3-04 signed URL TTL 6h
- CC2-21 1Password Emergency Kit (절차 봉인)
- ADR-0002 AuthClient 어댑터

### 신규 Risk
- R-15: merge-guest SRS stage 정확 재계산 (M3 보강)
- R-16: content-manifest 페이로드 크기 (M2-S6 페이지네이션)
- R-17: Magic Link deep link Universal Link/App Link 검증 (M2-S6)

### 다음 사이클
- **M2-S6 (W10-W11)**: revenuecat-webhook + delete-account + IAP/Apple/Google 통합 + Magic Link deep link + Paywall + 게스트 머지 트리거 + 신고 + Settings

---

## 2026-05-08 — Day 4 M2-S4 W8 (Onboarding/Home + Audio + RPCs + Starter 60)

### 활동 요약
- frontend + designer: Onboarding 4 카테고리 + Home (Today/Streak/Mastered)
- frontend + analytics: audio.ts (expo-av 무음 우회) + analytics.ts (Firebase + TraceCollector)
- backend: 0003_rpc.sql (3 RPC) + _shared/srs.ts (R-12 해결)
- learning + devops: starter-pack-candidates.yaml v1.0 60단어 + generate-audio.ts script

### Skill 사용 (강제 점검 통과)
| Agent | Skill |
|---|---|
| frontend | humanizer · theme-factory · frontend-design · taste-skill |
| designer | theme-factory · frontend-design · canvas-design · brand-guidelines |
| backend | TDD · root-cause-tracing · prompt-engineering |
| analytics | prompt-engineering · root-cause-tracing |
| learning | content-research-writer · prompt-engineering |
| devops | changelog-generator · file-organizer · using-git-worktrees(가이드) |
| orchestrator | (점검) |

### 산출 (~1,150줄)
- TS 화면 + lib: ~410줄 (onboarding 90 + home 110 + audio 90 + analytics 120)
- SQL: ~150줄 (3 RPC)
- Shared module: ~80줄 (_shared/srs.ts)
- YAML: ~120줄 (Starter Pack v1.0 60단어)
- Script: ~140줄 (generate-audio.ts)

### Risk 갱신
- R-12 partial closed (sibling copy 패턴)
- R-14 신규: Firebase 무료 티어 한도 (DAU 1k 전 모니터링)

### 다음 사이클
- **M2-S5 (W9)**: Supabase apply + TTS 키 발급 + audio 생성 + 가입 흐름 + Edge Functions (merge-guest, content-manifest, audio-signed-url) + 외부 검수자 계약

---

## 2026-05-08 — Day 3 M2-S3 W7 (First-run + SRS + Lesson card + submit-attempt)

### 활동 요약
- frontend: Expo config (app.json + tsconfig + babel + _layout) + 4 화면 (index/age-gate/privacy-choices/lesson)
- backend + learning: SRS Leitner pure function + 12 단위 테스트
- backend: Edge Function `submit-attempt` (RLS bypass + idempotent + atomic daily_usage)
- frontend + designer: 단어 카드 4단계 통합 화면 (Notice → Hear → Meaning → Retrieve, CC2-25 그대로)
- security: Privacy Manifest 선언 (CC2-04) + age-gate 정책 검토
- learning: Starter Pack candidate yaml v0.1 (10/60단어)

### Skill 사용 (강제 점검 통과)
| Agent | Skill |
|---|---|
| frontend | humanizer · theme-factory · frontend-design · taste-skill |
| designer | theme-factory · frontend-design · canvas-design · brand-guidelines |
| backend | TDD · root-cause-tracing · prompt-engineering |
| security | (review) |
| learning | content-research-writer · prompt-engineering |
| orchestrator | (점검) |

### 산출 코드 통계
- TypeScript: ~520줄 (mobile config + 화면 + SRS)
- Tests: ~165줄 (12 unit case)
- Edge Function: ~190줄 (submit-attempt)
- YAML: ~120줄 (Starter Pack candidates)
- 합계: ~1,000줄 신규

### 신규 Risk
- R-12: Edge Functions monorepo import 제약 — _shared/ 추출 패턴 검증
- R-13: RR vs 실제 발음 불일치 — Starter 60단어는 받침 단순 단어 우선 선정

### 다음 사이클
- **M2-S4 (W8)**: Onboarding + Home + 음성 재생 + Google TTS 키 발급 + Firebase 통합 + Streak + Starter Pack 50개 추가 + RPC

---

## 2026-05-08 — Day 2 M2-S2 W6 (schemas + tokens + ADR-0005)

### 활동 요약
- architect + learning: ADR-0005 Google Cloud TTS Neural2 봉인 (86.3% 가중점수)
- backend: 0001_init.sql (17 테이블 + 9 enums + 11 indexes)
- backend + security: 0002_rls.sql (ADR-0004 매트릭스 SQL 적용)
- architect + backend: schemas.ts (13 entity + RC webhook + 35개 analytics events)
- designer + frontend: design-tokens 5 모듈 (colors/typography/spacing/components/motion)

### Skill 사용 (강제 점검 통과)
| Agent | Skill |
|---|---|
| architect | software-architecture · prompt-engineering |
| backend | TDD(방법론) · root-cause-tracing(방법론) · prompt-engineering |
| security | (RLS 7 adversarial 검증) |
| learning | content-research-writer · prompt-engineering |
| designer | theme-factory · frontend-design · canvas-design · brand-guidelines |
| frontend | humanizer · theme-factory · frontend-design · taste-skill |
| orchestrator | (점검) |

### 신규 결정
- **ADR-0005 Accepted**: Google Cloud TTS Neural2 채택

### 신규 파일 (M2-S2 W6)
- `docs/adr/ADR-0005-tts-provider.md`
- `infra/supabase/migrations/0001_init.sql` (17 tables)
- `infra/supabase/migrations/0002_rls.sql` (ADR-0004 매트릭스)
- `packages/contracts/src/schemas.ts` (350+줄)
- `packages/contracts/tsconfig.json`
- `packages/design-tokens/src/{colors,typography,spacing,components,motion}.ts`
- `packages/design-tokens/tsconfig.json`
- `context/rollups/20260508-M2-S2-week6.md`

### 신규 Risk
- R-11: Google Cloud TTS 가격/SLA 변경 (ADR-0005 Reversal Trigger)

### 다음 사이클
- **M2-S3 (W7)**: Expo init + First-run + Word/SRS + 단어 카드 4단계 + 객관식 quiz + 일일 한도 + Starter Pack candidate + Google TTS 키 발급

---

## 2026-05-08 — Day 1 M1 사이클 5 + M2-S1 W5 (전 13명 활성)

### 활동 요약 (M1 사이클 5)
- orchestrator: M1 게이트 검증 + 종료 rollup + M2 진입 서명
- M1 산출물 16/16 통과
- HANDOFF.md M1 completed, M2 in_progress

### 활동 요약 (M2-S1 W5)
- architect: ADR-0002 (5 추상화 + 4 직접) — Accepted
- backend + security: ADR-0004 (RLS 13×5×4) — Accepted
- D-008 learning + D-009 devops Specialist 정식 활성화
- devops: pnpm workspaces + apps/packages/infra scaffold + EAS 환경 분리 + GitHub Actions PR check
- learning: 콘텐츠 검수표 v0.1 작성 시작 + 외부 검수자 모집 W4-W5 + B-1 candidate 빈도 코퍼스 정리

### Skill 사용 (강제 점검 통과)
| Agent | Skill |
|---|---|
| architect | software-architecture · prompt-engineering · mcp-builder(보류) |
| backend | TDD(방법론) · root-cause-tracing(방법론) · prompt-engineering |
| security | (ADR 검토) |
| learning (Specialist 활성) | content-research-writer · prompt-engineering |
| devops (Specialist 활성) | changelog-generator · file-organizer · using-git-worktrees(가이드) |
| orchestrator | (점검) |

### 신규 결정
- D-008: learning Specialist 정식 활성화
- D-009: devops Specialist 정식 활성화
- ADR-0002 Accepted: Domain Model 추상화 (5+4)
- ADR-0004 Accepted: RLS 매트릭스 (13×5×4)

### 신규 파일 (M2-S1)
- 2 ADR + root package.json + pnpm-workspace.yaml + apps/mobile + apps/api + 2 packages + 2 infra READMEs + eas.json + 2 GitHub workflows + 4 context 기록 + 1 rollup = **약 21 파일**

### 신규 Risk (MVP_SCOPE §6 추가)
- R-09: pnpm + RN/Expo monorepo 초기 마찰
- R-10: Supabase Free 7일 비활성 일시정지

### 다음 사이클
- **M2-S2 (W6)**: Supabase 3 프로젝트 생성 + 0001/0002 migration + Expo init + zod schema 구현 + design tokens export + ADR-0005 TTS provider + First-run + Word/SRS + B-1 candidate list

---

## 2026-05-08 — Day 1 M1 사이클 4 (designer)

### 활동 요약
- designer: DESIGN_DIRECTION (~280줄) + THEME_DECISIONS (~280줄)
- 산출 2개 문서 + context 1개

### Skill 사용 (강제 4개 모두 통과)
| Skill | 사용 |
|---|---|
| theme-factory | ✅ color/type/space 토큰 체계화 |
| frontend-design | ✅ SE 320pt 카드 ASCII + scale 검증 |
| canvas-design | ✅ hero 6장 스토리보드 |
| brand-guidelines | ✅ 톤 5 키워드 + 거리두기 4 제품 |

### 주요 결정
- **신뢰감 종류**: 개인형 도구 (primary) + 운영형 신뢰 (secondary)
- **톤 5 키워드**: Quiet · Honest · Spacious · Steady · Respectful
- **거리두기 (회피)**: Duolingo / Memrise / Drops / LingoDeer 게임화 톤
- **한영 광학 매칭**: 1.0 : 0.92 비율
- **Color**: Light MVP + Dark 토큰 미리 정의, 모든 조합 WCAG AA+
- **Spacing**: 8pt grid (11 token)
- **SE 320pt 카드**: 4단계 한 화면 fit (overflow 없음)
- **Motion**: bounce/spring/hero 금지, 80-200ms ease-out
- **폰트**: Noto Sans KR + Inter (SIL OFL 1.1) — 번들 ~2MB

### 이전 P0 처리
- UX-NEW-002 광학 매칭 ✅
- UX-NEW-007 8pt grid ✅
- UX-NEW-008 다크 토큰 ✅
- UX-NEW-001 RR 줄바꿈 (M2 frontend 구현 위임)

### 다음 사이클
- **M1 사이클 5**: orchestrator — M1 게이트 검증 + rollup + M2 진입 서명

---

## 2026-05-08 — Day 1 M1 사이클 3 (architect + orchestrator)

### 활동 요약
- architect: STACK_DECISION + STACK_EVOLUTION_PLAN + ADR-0001 (3개 문서 ~480줄)
- orchestrator: D-007 ADR-0001 Accepted 승인 + DECISION_LOG/HANDOFF 갱신
- 산출 3개 문서 + context 2개

### 주요 결정
- **ADR-0001 Accepted**: 후보 A (Lean / Managed) 봉인
- **4 phase 진화 모델 + 20 트리거** 정의
- **9 경계면별 진화 경로** + 마이그레이션 비용 추정

### Skill 사용
| Agent | Skill |
|---|---|
| architect | software-architecture · prompt-engineering · mcp-builder(보류) |
| orchestrator | (점검만 — Skill 사용 강제 점검 통과) |

### 후속 ADR 일정 (M1-c3에서 사전 정의)
- ADR-0002 (M2 진입 전): Domain Model 추상화 범위
- ADR-0003 (M3): Harness 도구 선택
- ADR-0004 (M2-S2 전): RLS 매트릭스
- ADR-0005 (M2-S2 W6): TTS provider 선택

### 다음 사이클
- **M1 사이클 4**: Design Direction + Theme Decisions (designer)
- **M1 사이클 5**: M1 게이트 검증 + rollup + M2 진입 서명 (orchestrator)

---

## 2026-05-07 — Day 0 M1 사이클 1+2 (planner + architect + pm)

### 활동 요약 (M1 사이클 1)
- planner: PRD + USER_JOURNEYS + ASSUMPTIONS 보강 (10개 가정 추가)
- 산출 3개 문서 + context 1개

### 활동 요약 (M1 사이클 2)
- architect: DOMAIN_MODEL (15 엔티티) + STACK_OPTIONS_MATRIX (3 후보 가중 평가)
- pm: MVP_SCOPE (P0 15 / P1 6 + 20주 sprint + 콘텐츠 6 batch + Risk 8)
- 산출 3개 문서 + context 2개

### Skill 사용
| Agent | Skill |
|---|---|
| planner | humanizer · theme-factory · frontend-design · taste-skill |
| architect | software-architecture · prompt-engineering · mcp-builder(보류) |
| pm | humanizer · theme-factory · frontend-design · taste-skill |

### 주요 결정
- **후보 A (Lean) 권고**: 78.2% vs B 68.0% vs C 52.9%
- **20주 일정 확정**: M2 thin vertical slice는 W5-W12 (7주)
- **콘텐츠 6 batch**: Starter 60 + Premium 50×5 = 310단어
- **Specialist 활성 트리거**: learning W5 / analytics W12 / legal W14(D-42) / devops W11

### 사용된 결정 인용
PRD: CC-03 / CC-07 / CC-08 / CC-09 / CC-11 / CC-15 / CC-17 / CC-18 / CC2-04 / CC2-05 / CC2-06 / CC2-07 / CC2-08 / CC2-09 / CC2-10 / CC2-14 / CC2-15 / CC2-18 / CC2-22 / CC2-25 / CC3-01 / CC3-03 / CC3-04 / CC3-05 / CC3-07 / CC3-08

### 다음 사이클
- **M1 사이클 3**: STACK_DECISION + STACK_EVOLUTION_PLAN + ADR-0001 (architect + orchestrator 승인)
- **M1 사이클 4**: Design Direction + Theme Decisions (designer)
- **M1 게이트**: orchestrator 서명 → M2 진입

### 명시적 보류
- ADR-0002 (Domain Model 경계면 추상화) — M2 진입 전
- ADR-0003 (Harness 도구 선택) — M3 진입 시
- ADR-0004 (RLS 매트릭스) — M2-S2 진입 전

---

## 2026-05-07 — Day 0 Bootstrap (보강 #3 — 하네스 3대 문서 + analytics 활성화)

### 활동 요약
- **PM 옵션 B + C 동시 진행**
- D-006: analytics agent 정식 활동 시작 (M3 사전 활성화)
- analytics: `docs/harness/EVALUATION_SCENARIOS.md` 작성 (87 case 윤곽)
- planner: `docs/harness/HARNESS_MATURITY_ROADMAP.md` 작성 (5단계 성숙도)
- pm: `docs/harness/HARNESS_EXECUTION_BOARD.md` 작성 (3 workstream)
- architect: `docs/architecture/HARNESS_LAYERED_ARCHITECTURE.md` 작성 (5층)
- 4명 context 기록 작성

### Skill 사용
| Agent | 사용한 Skill |
|---|---|
| analytics | prompt-engineering · root-cause-tracing |
| planner | humanizer (built-in) · theme-factory · frontend-design · taste-skill |
| pm | humanizer (built-in) · theme-factory · frontend-design · taste-skill |
| architect | software-architecture(가이드) · prompt-engineering · mcp-builder(보류) |

### 신규 결정
- **D-006**: analytics agent 사전 활동 시작 (M3 트리거 도래 전)

### 산출 통계
- 신규 문서 4개 (총 ~980 줄)
- context 기록 4개
- 사용된 결정 인용: CC2-03, CC2-05, CC2-06, CC2-07, CC2-08, CC2-09, CC2-10, CC2-14, CC2-15, CC2-17, CC2-18, CC2-22, CC2-23, CC2-25, CC3-04, CC3-05, CC3-07, CC3-08

### 미해결 / 다음 사이클 권고
- M0 보강 종료 → M1 자동 진입 권고
- M1 첫 작업: planner의 PRD + USER_JOURNEYS (skill: humanizer · theme-factory · frontend-design · taste-skill 강제)

### 명시적 보류
- ADR-0003 (Harness 도구 선택)은 M3에 작성 (현 단계는 후보만 제시)
- W2-M5 dashboard 구현 도구는 M5 결정

---

## 2026-05-07 — Day 0 Bootstrap (보강 #2 — Specialist 사전 채용)

### 활동 요약
- Specialist 4명(`learning`, `analytics`, `legal`, `devops`) 사전 채용 (D-005)
- archive 원본은 보존, active는 단순 ID로 변경
- AGENTS.md / .codex/config.toml / DECISION_LOG / PROJECT_MAP 모두 갱신
- context/agents/ 4개 디렉토리 추가 (총 13명 분 보유)
- 활성 인원: 9 → **13**

### 신규 결정
- **D-005**: Specialist 4명 사전 채용 (Core 9 + Specialist 4 = 활성 13명)

### 활동 트리거 (사전 정의)
- learning: M1 도메인 자문 / M2 SRS 검증 / M5 콘텐츠 검수
- analytics: M3 이벤트 택소노미 / 하네스 evaluation 정의
- legal: C-13 사업자 확정 후 D-42 약관/결제 정책
- devops: M2 CI/CD bootstrap / M5 ASO/배포 게이트

### 다음 단계
- M1 진입 시 planner 작업 시작과 함께 learning은 도메인 자문 standby
- M3 진입 1주 전 analytics 사전 활성화 권고
- D-42 도래 시 legal 자동 활성화

---

## 2026-05-07 — Day 0 Bootstrap

### 활동 요약
- M0 Bootstrap 시작
- 디렉토리 구조 일괄 생성 (apps/packages/infra/.codex/.agents/.vendor/docs/context/scripts/fixtures)
- archive에서 기획 검토 8명 페르소나 복원 + 단순 ID(planner/pm/designer/architect/frontend/backend/security/qa)로 재배치
- Orchestrator 페르소나 신규 작성 (`.claude/agents/orchestrator.md`)
- AGENTS.md v1.0 발효
- .codex/config.toml 작성
- 핵심 추적 문서 6종 초안: PROJECT_MAP / DECISION_LOG / HANDOFF / SKILLS_INVENTORY / SWARM_LEDGER (이 문서) / ASSUMPTIONS

### Skill 사용
- (M0 단계라 skill 시스템 미가동. M0-5에서 가동 시작 예정)

### 신규 결정
- **D-001**: 9 agent + archive 4명 옵션 채용 정책
- **D-002**: skill 설치는 보안 심사 후만 허용
- **D-003**: 기술 스택 잠정 결정을 M1에서 재검증 (3개 후보 평가 → ADR-0001)
- **D-004**: 기획 SSOT(REVIEW_QA, SERVICE_REVIEW_QA, 23개 v0.3) read-only 보존

### 미해결 / 다음 사이클 권고
- M0-5: skill 저장소 clone + 보안 심사 (git/인터넷 가용성 확인 필요)
- M0-5: project 전용 skill 4개(handoff-writer / harness-auditor / domain-modeler / report-reviewer) 생성 시점 결정
- M0-6: orchestrator 첫 rollup 작성 + M0 게이트 서명 결정
- M1 진입 준비 (PRD / domain / stack matrix)

### Blocker
- 외부 git clone 가능 여부가 M0-5에서 확인되어야 다음 단계 진행 명확화

### 명시적 보류
- worktrees/* 디렉토리는 M2 본격 병렬 진입 시 생성 (현재는 단일 트리 작업으로 충분)
- apps/packages/infra 내부 구조는 M1/M2 산출물에서 채워짐

---

## 형식 가이드 (다음 작성자용)

각 일자 블록은 다음 섹션을 포함한다.

- 활동 요약 (3-7 bullet)
- Skill 사용 (역할별 / skill별 사용 횟수)
- 신규 결정 (D-NNN / ADR-NNNN / CC-NN 갱신)
- 미해결 / 다음 사이클 권고
- Blocker
- 명시적 보류 (의도적으로 안 한 것 + 사유)

새 일자는 위에 추가. 과거 ledger는 절대 수정하지 않고 누적.

## 2026-05-08 — Day 6 M2-S6 W10-W11 (Payment + Account + Settings + Report + useLesson)

### 활동 요약
- backend: revenuecat-webhook (CC2-08 매핑 + 멱등) + delete-account (30일 SLA + RC alias)
- frontend + designer: paywall (Honest 톤 4 disclosures) + settings (5 섹션) + report (5 카테고리)
- frontend + analytics: purchases.ts (RC wrapper + analytics 이벤트 CC2-22)
- frontend: useLesson hook + 게스트 머지 트리거
- legal Specialist: paywall disclosure + delete-account 절차 검토
- security: RC alias 삭제 + audit_log 검토

### Skill 사용 (강제 점검 통과)
- backend: TDD / root-cause-tracing / prompt-engineering
- frontend: humanizer / theme-factory / frontend-design / taste-skill
- designer: theme-factory / frontend-design / canvas-design / brand-guidelines
- analytics: prompt-engineering / root-cause-tracing
- legal: content-research-writer / humanizer
- security: (review)
- orchestrator: (점검)

### 산출 통계 (~1,200줄)
- Edge Functions: ~410줄 (revenuecat-webhook 250 + delete-account 160)
- Mobile lib: ~210줄 (purchases.ts)
- Mobile 화면: ~470줄 (paywall 230 + settings 170 + report 130)
- Mobile hook: ~120줄 (useLesson)

### 주요 결정 적용
- CC-09 / CC3-05 결제 + grace
- CC-11 계정 삭제 30일 SLA
- CC2-06 인증 사용자만 결제
- CC2-08 status enum 9개 매핑
- CC2-22 analytics 이벤트
- Q-PL-NEW-005 가족 공유 사전 고지

### 신규 Risk
- R-18 RC webhook 0-5초 지연 (purchases.ts에서 customerInfo 직접 조회로 대응)
- R-19 Magic Link Universal Link/App Link 검증 (M2-S7)
- R-20 pg_cron Free tier (M2-S7 모니터링)

### 다음 사이클
- M2-S7 (W12) E2E 시연 + Apple/Google 실 통합 + Magic Link deep link + Push 알림 + 게스트 SQLite + cron-hard-delete + M2 게이트 서명

## 2026-05-08 — Day 7 M2-S7 W12 + ★ M2 게이트 통과 ★

### 활동 요약
- backend: cron-hard-delete (계정 30일 SLA + 결제 비식별화 sha256)
- frontend + designer: lesson/complete.tsx (Steady 톤, 폭죽 없음)
- frontend: authProviders.ts (Apple iOS/Android + Google) + auth/callback.tsx (deep link + 머지 트리거)
- frontend: guestStore.ts (expo-sqlite + SecureStore queue) + notifications.ts (학습 리마인더)
- devops: AASA + assetlinks.json (deep link 검증 — R-19)
- orchestrator: M2 게이트 검증 + rollup + HANDOFF 갱신 + 서명

### Skill 사용 (강제 점검 통과)
- backend: TDD / root-cause-tracing / prompt-engineering
- frontend: humanizer / theme-factory / frontend-design / taste-skill
- designer: theme-factory / frontend-design / canvas-design / brand-guidelines
- devops: changelog-generator / file-organizer / using-git-worktrees
- orchestrator: (점검)

### 산출 (~1,100줄)
- cron-hard-delete: ~150줄
- lesson/complete.tsx: ~110줄
- authProviders.ts: ~140줄
- auth/callback.tsx: ~140줄
- guestStore.ts: ~190줄
- notifications.ts: ~80줄
- AASA + assetlinks: ~50줄
- M2 게이트 rollup: ~330줄

### M2 종료 통계
- M2 sprint: 7개 (S1-S7)
- 신규 파일: 약 60개
- 신규 코드/문서: 약 7,000줄
- ADR: ADR-0001/0002/0004/0005 Accepted
- D-NN: D-007/008/009
- 87 golden case 정의: ✅ (실 yaml 작성은 M3)
- 5층 하네스: alpha 단계 가동

### M2 게이트 통과 (★)
- DoD 7항목 모두 충족
- Skill 사용 점검 통과 (9 agent)
- Context 기록 14+
- ADR 인덱스 4 Accepted
- HANDOFF.md M2 completed / M3 ready

### 다음 사이클
- M3 (W13-W14) Harness Hardening
- 첫 작업: ADR-0003 Harness 도구 선택 + 87 golden case yaml + evaluation runner
- Specialist 활성화: analytics 본격 활동 (M3 W12 트리거 도래)
