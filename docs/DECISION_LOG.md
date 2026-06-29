# dash2zero — Decision Log (통합 의사결정 로그)

> 목적: 기획 단계 결정(REVIEW_QA, SERVICE_REVIEW_QA)을 swarm coding 단계로 승계하면서 새로 추가되는 결정을 한 곳에 누적
> 갱신 책임: orchestrator (모든 agent의 결정을 통합 승계)
> SSOT 우선순위: 이 문서 > SERVICE_REVIEW_QA §8 > REVIEW_QA §5 > 23개 v0.3 기획서

---

## 1. 결정 ID 체계

| 접두 | 의미 | 예시 |
|---|---|---|
| C-NN | 사업계획서 1차 라운드 결정 (REVIEW_QA §5) | C-13 |
| CC2-NN | 23개 기획서 통합 리뷰 결정 | CC2-09 |
| CC3-NN | 미니 라운드 결정 | CC3-05 |
| B-NN | 출시 차단급 결정 | B-07 |
| **D-NNN** | **swarm coding 단계 신규 결정** | D-001 |
| ADR-NNNN | 되돌리기 어려운 결정 (별도 ADR 문서) | ADR-0001 |

새 결정은 D-NNN 또는 ADR-NNNN으로 기록.

## 2. 기획 단계 결정 승계 (요약)

상세는 `SERVICE_REVIEW_QA.md §8`과 `REVIEW_QA.md §5` 참조. 핵심 만 발췌.

### 2.1 기술 스택 (잠정)

| 항목 | 결정 | 근거 |
|---|---|---|
| Mobile | React Native + Expo + TypeScript, Expo Router, EAS Build/Submit | C-01 |
| Backend | Supabase (Postgres / Auth / Storage / Edge Functions / RLS) | C-02 |
| Auth | Apple Sign In + Google Sign In + Email magic link, 비밀번호 제외 | C-03 |
| Game/Speech | TTS (Neural, Korean), Supabase Storage + 앱 캐시 | C-05, C-06 |
| Payment | RevenueCat + Apple/Google IAP, 무료 체험 없음, Restore 필수, 가족공유 비활성 | C-09 |
| Analytics | Firebase Analytics + Crashlytics, IDFA 미사용, 비필수 분석 동의 | C-12 |
| SRS | 자체 Leitner 5단계, 1/3/7/14/30일 | C-08 |
| 출시 국가 | US/CA/UK/AU/NZ (EU 미출시) | C-10 |
| 일일 리셋 | 사용자 로컬 04:00 | C-17 |
| UI 언어 | en-US 단일 (공식본) | C-18 |

> **주의**: 위는 기획 단계 잠정 결정. swarm coding M1에서 STACK_OPTIONS_MATRIX → STACK_DECISION → STACK_EVOLUTION_PLAN으로 **재검증 후 ADR-0001 발효**. 재검증에서 변경 시 본 문서 갱신.

### 2.2 일정

- 16주 구현 baseline + 4주 운영/심사/버퍼 = **20주** (CC2-14)
- C-13(사업자) 데드라인: D-42 (베타 출시 4주 전, CC2-16 / CC3 결정)
- M1 ~ M5 swarm coding 게이트는 위 20주 안에 매핑 필요 — M1 첫 사이클에서 PM이 매핑

### 2.3 보류된 잠정 결정

| ID | 항목 | 임시 가정 | 확정 데드라인 |
|---|---|---|---|
| C-13 | 사업자/결제 수령 주체 | 한국 개인사업자 + 통신판매업 신고 예정 (`<TBD-C-13: 한국 개인사업자 가정>`) | **M5 entry (D-012로 분류 — M5 이전 출시 차단 항목 = 제품 완성 후 처리)** |
| - | 법무/세무 검토 | 베타 직전 | 출시 직전 (M5 sprint 내 legal 일괄 처리) |

## 3. Swarm coding 단계 신규 결정 (D-NNN)

### D-001: Swarm coding 9 agent 팀 구성 + archive 4명 옵션 채용 정책

- **일자**: 2026-05-07
- **결정자**: orchestrator
- **결정**: 사용자 지시에 따라 9명 핵심 + archive 4명(learning-design-expert, data-analytics-senior, payments-legal-specialist, devops-release-senior) 옵션 채용
- **사유**: 기획 검토 단계에서 검증된 페르소나 재활용으로 일관성 확보
- **영향 받는 문서**: `AGENTS.md §1`, `.codex/config.toml [team]`
- **롤백 비용**: 낮음 (페르소나 정의 변경)

### D-002: Skill 설치는 보안 심사 후 .agents/skills/로만 복사

- **일자**: 2026-05-07
- **결정자**: orchestrator + security
- **결정**: 외부 skill 저장소는 `.vendor/agent-skills/`에 clone, security 심사 후 승인된 것만 `.agents/skills/`로 복사
- **사유**: 무단 코드 실행 방지 + 라이선스 추적
- **영향 받는 문서**: `AGENTS.md §4`, `docs/skills/SKILLS_INVENTORY.md`, `docs/runbooks/SECURITY_REVIEW.md`
- **롤백 비용**: 낮음

### D-003: 기술 스택 잠정 확정을 swarm coding M1에서 재검증

- **일자**: 2026-05-07
- **결정자**: orchestrator
- **결정**: 기획 단계의 RN+Expo / Supabase / RevenueCat / Firebase 결정은 잠정. M1 STACK_OPTIONS_MATRIX에서 3개 후보(Lean / Balanced / Scale) 재평가 후 STACK_DECISION + ADR-0001로 봉인
- **사유**: 사용자 지시(§9 "고정 스택 금지 — 분석→옵션→선택→문서화→진화 계획")
- **영향 받는 문서**: `docs/architecture/STACK_*`, `docs/adr/ADR-0001-stack-decision.md`
- **롤백 비용**: M1 단계라 낮음. M2 진입 후 변경 비용은 급격히 증가

### D-008: learning Specialist 정식 활성화 (M2-S1, W5)

- **일자**: 2026-05-08
- **결정자**: orchestrator (M2 진입 트리거)
- **결정**: `learning` agent를 M2-S1 (W5)부터 정식 활동 시작
- **활동 범위 (1차, M2-M3)**:
  1. **B-1 Starter Pack 60단어 검수** (W5-W7) — CC2-15 50단어 batch 정책의 첫 적용
  2. **SRS 정확성 자문** (W6-W8) — backend의 `applySrsTransition` 구현 검증
  3. **콘텐츠 품질 검수표 작성** (W5) — CC2-11 정량 기준 (필수 필드/한글 표기/RR 일치/gloss 1-5단어/예문 신규 학습 포인트 1개/금지 표현/distractor 중복/오디오 매칭)
  4. **외부 한국어 원어민 검수자 1명 모집 시도** (W4-W5) — CC3-07 결정대로 published 콘텐츠는 작성자/검수자 분리. R-01 리스크 완화 1차 행동
- **활동 위치**: 
  - `worktrees/learning/` (M2-S1 W5에 활성화)
  - `context/agents/learning/`
  - `fixtures/seeded/words/` (B-1 Starter Pack)
- **다음 활성화 예정**: M5 콘텐츠 검수 본격 운영
- **롤백 비용**: 낮음

### D-010: Baseline metrics 수집 환경 — Supabase staging + synthetic seed + 1인 dogfood (D-baseline-env 봉인)

- **일자**: 2026-05-11
- **결정자**: orchestrator (사용자 자율 결정 권한 위임)
- **결정**: M3 baseline metrics 14-day 수집은 **운영 사용자 모집 회피** 결정에 따라 다음 구성으로 진행
  - **Source 1**: Supabase staging 환경 (devops가 `apps/mobile` dev 빌드와 연동된 staging 프로젝트 활용)
  - **Source 2**: synthetic seed (devops 작성 `scripts/seed/synthetic-baseline.ts` — 14-day 활동 패턴 시뮬레이션 user 100명, lesson_complete / paywall_view / streak 이벤트 분포 포함)
  - **Source 3**: 1인 dogfood 1 계정 (Owner 본인 실사용, real signal 검증용 mini control)
- **M3 게이트 조건 변경**: 기존 "real-user baseline 14-day 수집 완료" → **"하네스 수집 파이프 동작 검증 + synthetic seed로 KPI snapshot 14-day cron 가동 + 1인 dogfood 신호 비교 가능 상태"**
- **Real-user baseline은 M5로 이연**: 베타 사용자 모집 후 본격 수집. M3는 파이프 검증, M5는 신호 검증으로 책임 분리
- **사유**: 사용자 명시 — "운영 blocker(사업자 등록 등)는 무시, 완벽한 제품 개발에만 몰두". real-user 모집은 운영 trace이고 그 시작은 사업자/약관/결제 정책 확정 의존. 제품 측은 수집 파이프와 평가 logic이 핵심
- **영향 받는 문서**: `docs/HANDOFF.md` §4 (M3 게이트 조건), `docs/harness/BASELINE_METRICS.md` (analytics 작성 시 본 결정 반영), `scripts/seed/synthetic-baseline.ts` (devops 신규)
- **롤백 비용**: 낮음. M5에서 real-user 데이터 수집 시 동일 KPI 파이프 재사용

### D-011: Slack alert 채널 — webhook stub만 W15에 작성, 실 URL 연결은 M5 (D-slack-alert 봉인)

- **일자**: 2026-05-11
- **결정자**: orchestrator (사용자 자율 결정 권한 위임)
- **결정**: W15-06 audit_log 위반 alert는 다음 분리
  - **W15에 작성**: `audit_log` Postgres trigger + GitHub Actions workflow stub(`.github/workflows/security-alert.yml`) + console.log + DB `security_alerts` 테이블 적재
  - **M5로 이연**: 실 Slack #security webhook URL 발급(운영 계정 필요) 및 secret 연결, on-call 회전 정책
- **회귀 catch 보장**: console + DB 적재 + nightly evaluator 통합으로 W15 시점에서도 RLS violation / signature_invalid / age_bypass_attempt는 즉시 감지 + git history로 추적 가능
- **사유**: 실 webhook URL은 Slack workspace 소유자 권한과 운영 채널 정책 의존 — 운영 blocker. 제품 측 alert 로직은 stub로도 회귀 검증 충분
- **영향 받는 문서**: `docs/security/ALERT_RUNBOOK.md` (security 작성 시 stub 모드 명시), `.github/workflows/security-alert.yml` (devops 신규 stub)
- **롤백 비용**: 낮음. M5에서 webhook URL 1줄 secret 추가로 활성화

### D-012: C-13(사업자/결제 수령 주체) M5 이전 출시 차단 항목으로 분류 — 제품 완성 후 처리 (D-c13-business 봉인)

- **일자**: 2026-05-11
- **결정자**: orchestrator (사용자 자율 결정 권한 위임)
- **결정**: 기획 단계 보류 결정 C-13(한국 개인사업자 가정, D-42 데드라인)을 **M5 이전 출시 차단 항목 = 제품 완성 후 처리**로 명시 분류
  - M3/M4 동안 사업자 등록, 통신판매업 신고, 결제 수령 계좌, RevenueCat 발행자 정보 등록은 진행하지 않음
  - 제품 코드 측에서는 RevenueCat 키와 결제 정책 검증을 placeholder/sandbox로만 구현 (M2 완료 산출물에서 이미 진행 중)
  - M5 진입 시 (Beta Handoff sprint) legal agent가 C-13 + 약관/개인정보처리방침/결제 정책을 일괄 처리
- **사유**: 사용자 명시 — "운영 blocker(사업자 등록 등)는 무시, 완벽한 제품 개발에만 몰두"
- **영향 받는 문서**: §2.3 보류된 잠정 결정 표 갱신 (C-13 처리 시점 = "M5 entry"), `docs/HANDOFF.md` (M5 게이트 진입 직전 legal 활성화 트리거), `AGENTS.md §1` legal activation_triggers 갱신은 M4 종료 시점에
- **롤백 비용**: 매우 낮음. 사업자 등록은 1~2주, 결제 정책은 legal 1 sprint로 처리 가능

### D-013: PRD thresholds (lesson_complete_rate / Day-3 retention 등) — planner 자율 결정 (D-prd-thresholds 봉인)

- **일자**: 2026-05-11
- **결정자**: orchestrator (사용자 자율 결정 권한 위임 → planner 자율)
- **결정**: PRD §성공지표 4개 KPI threshold 값(lesson_complete_rate / Day-3 retention / streak Day-1 유지율 / paywall_view_to_purchase)는 **planner가 industry benchmark + dash2zero 목표를 종합하여 자율 결정**. orchestrator는 결과 commit에 승인 표시만
- **planner 결정 산출물 위치**: `docs/product/PRD.md §성공지표` 또는 `docs/harness/BASELINE_METRICS.md §threshold` (planner 선택)
- **승인 기준**: 4개 KPI 각각 출처(industry benchmark URL 또는 raw 데이터 / dash2zero 가정 근거) 1줄 이상 명시 + 측정 윈도우 명시 + green/yellow/red band 정의
- **사유**: threshold 결정은 planner의 핵심 책임 영역. orchestrator가 임의 값 부여하면 산출물 ownership 침범
- **영향 받는 문서**: `docs/product/PRD.md`, `docs/harness/BASELINE_METRICS.md`
- **롤백 비용**: 낮음. 14-day 수집 후 실제 데이터로 재조정 가능
- **검증 (W15 Cycle A, 2026-05-12)**: planner가 PRD §8에 4 KPI band(Target/Minimum) commit 완료 — D-3 retention 35/25%, Day-1 streak 60/45%, lesson_complete_rate 75/60% (learning agent 권고 정합), paywall_view_to_purchase 4/2%. 출처/근거 1줄 이상 충족. **승인.**

### D-014: RLS adversarial ID 충돌 해소 — security 005~009 우선, backend 010~013 재배치

- **일자**: 2026-05-12 (W15 Cycle A 통합)
- **결정자**: orchestrator
- **배경**: dispatch v2 직후 security와 backend가 모두 RLS-ADV-006~009 슬롯을 점유. security 작성분 5건(STRIDE 매트릭스 cover)과 backend 작성분 4건(evaluator 분기 cover) 모두 의미가 다르고 보존 가치 있음
- **결정**:
  1. security가 먼저 점유한 005~009 그대로 유지 (anon-non-starter-pack-read / expired-entitlement-premium-audio / attempts-update-append-only / cross-user-content-reports-read / deletion-completed-self-update)
  2. backend가 작성한 4건을 010~013으로 rename (service-role-positive / cross-user-attempt-insert / uws-direct-update / deletion-after-completed)
  3. fixtures/adversarial/rls/README.md 분포표를 9건 → 13건으로 갱신
  4. 신규 시나리오는 014부터 사용
- **사유**: 두 트랙(보안 위협 모델 + evaluator 분기)이 상호 보완. STRIDE 5/6 cover (security) + 분류기 6 라벨 cover (backend) → 합산 13건이 매트릭스 hot spot 정확히 cover
- **영향 받는 파일**: `fixtures/adversarial/rls/RLS-ADV-006~009-*.yaml` (security 5건 유지) + `fixtures/adversarial/rls/RLS-ADV-010~013-*.yaml` (backend rename) + `fixtures/adversarial/rls/README.md` (분포 갱신)
- **롤백 비용**: 낮음 — rename + README 갱신만, evaluator 코드 영향 없음 (id 필드만 변경)

### D-016: R-28 risk ID 충돌 해소 — designer 우선, security 시드 신뢰성을 R-33으로 reroute

- **일자**: 2026-05-12 (RISK_REGISTER 작성 시 발견)
- **결정자**: orchestrator
- **배경**: designer가 M2-S6 lesson chain 구현 시점에 R-28(lesson chain STUB → 실 fetch) 등록. security가 W15 RLS_EVALUATOR_HYBRID_PLAN §134에서 R-28(시드 신뢰성)을 신규 등록 의도로 작성. 같은 ID로 두 의미 사용
- **결정**: designer R-28(lesson chain) ID 유지(먼저 등록 + 이미 Cycle B closed candidacy). security가 작성한 "시드 데이터 신뢰성" risk를 **R-33**으로 reroute
- **영향 받는 파일**: `docs/risk/RISK_REGISTER.md` §2.1 R-33 등재 / `docs/security/RLS_EVALUATOR_HYBRID_PLAN.md` §134 ID 갱신 권고 (W16 architect ADR-0007 작성 시 함께 갱신)
- **롤백 비용**: 낮음 — ID 변경만, 의미/내용 변경 없음

### D-022: K-pop Bold 디자인 방향 채택 — Quiet/Steady 철학 부분 폐기

- **일자**: 2026-05-18
- **결정자**: 사용자 (mju.jykim@gmail.com) 명시 결정 — "디자인이 전혀 stunning 하지 않은 것 같아요"
- **배경**: HTML mockup 13 화면 첫 검토 후 사용자 시각적 임팩트 부족 평가. 기존 디자인 철학(`docs/brand/DESIGN_DIRECTION.md §6`)의 5 키워드 (Quiet · Honest · Spacious · Steady · Respectful) 중 일부가 시각적 평범함의 원인
- **결정**: 디자인 방향 K-pop Bold로 전환
  1. **Color**: 그라데이션 multi-stop (purple → pink → orange) + neon accent (cyan / electric pink / lime)
  2. **Typography**: 한글 hero element (Noto Sans KR Black, 80~120px), Inter Bold/Black 영문
  3. **Motion**: ease-out 300~500ms, fade + scale + slide. Reduce motion 시 fade only
  4. **Shadow / Glow**: neon glow, multi-layer shadow
  5. **Imagery**: K-pop 시각 언어 (네온/그라데이션/한글 typography 강조). 사진/일러스트 hero element 옵션
- **유지 (Quiet 철학 부분 보존)**:
  - Honest 마이크로카피 ("Limited offer" 같은 유도 문구 회피)
  - 받침 변화 audio_qc 정확성
  - 학습 카드 가독성 (lesson 화면은 한글 vivid + 학습 집중 균형)
- **폐기 (Quiet 철학 부분 폐기)**:
  - "폭죽/큰 일러스트/감정 카피/이모지 금지" → vivid CTA + 한글 hero typography 허용
  - "그라데이션 최소화" → 다중 stop 그라데이션 적극 사용
  - "skeleton만, spinner 금지" → 핵심 transition (lesson chain advance, paywall subscribe success) animation 추가
- **사유**:
  1. Target 사용자 (K-pop / K-drama / Travel cohort) 시각적 기대치 정합 — 경쟁사 (Duolingo, Memrise) 대비 K-pop appeal 강화
  2. D-018 Premium $4.99/$49.99 가격 정합 — 사용자가 premium positioning 인식 가능한 시각적 깊이 필요
  3. M5 베타 모집 + Apple App Store featured 가능성 — stunning UI는 ASO + viral 효과
  4. 사용자 명시 결정 우선 (orchestrator 자율 영역 외)
- **영향 받는 SSOT 11건+**:
  - `docs/brand/DESIGN_DIRECTION.md §6` 톤 5 키워드 재정의
  - `docs/brand/THEME_DECISIONS.md §1~4` color/typography/motion 갱신
  - `packages/design-tokens/src/colors.ts` 신규 color palette (또는 colors-kpop.ts 추가)
  - `packages/design-tokens/src/typography.ts` 한글 hero scale 추가
  - `packages/design-tokens/src/motion.ts` ease curve + duration 갱신
  - `docs/screens/v2-stunning/` 신규 디렉토리 — 13 화면 mockup 재작성 (본 사이클 3 화면 시안)
  - `apps/mobile/app/*.tsx` 13 화면 코드 갱신 (frontend 후속 작업, M3 W15 sprint 추가 작업 또는 M4 W17)
  - `docs/design/STATE_PATTERNS.md` 5상태 톤 재검토
  - `docs/design/LESSON_CHAIN_PATTERN.md` transition 80→300ms 갱신
  - `CHANGELOG.md` — 외부 가시 변경 (사용자 직접 보는 UI 영역)
  - `SWARM_LEDGER.md` D-022 entry
- **본 사이클 작업 범위 (완료, 2026-05-18 갱신)**:
  - ✅ D-022 봉인 + 영향 SSOT 갱신
  - ✅ `docs/screens/v2-stunning/` **13 화면 전체** HTML mockup 작성 (Welcome/Age Gate/Privacy/Onboarding/Home/Lesson Notice/Meaning/Retrieve/Complete/Paywall/Sign-in/Settings/Report) + index.html + tokens-kpop-bold.css
  - ✅ 사용자 시각 확인 — "와우!! stunning합니다! 완전 대 만족!" 13 화면 전체 + production tokens 적용 명시 승인
  - ✅ `packages/design-tokens/src/colors.ts` 갱신 (dark-first + 6 neon + 6 gradient + 7 glow)
  - ✅ `packages/design-tokens/src/typography.ts` 갱신 (hero scales: 88/120/64/36/11)
  - ✅ `docs/brand/DESIGN_DIRECTION.md` §6 갱신 (Bold/Neon/Honest/Confident/Focused)
  - ✅ `docs/brand/THEME_DECISIONS.md` §1/2/5/7 + §11 변경 이력 갱신
  - ✅ `CHANGELOG.md` + `SWARM_LEDGER.md` + `docs/PROJECT_MAP.md` D-022 entry
  - **차기 사이클**: frontend agent 13 .tsx 화면에 D-022 token 적용 (~1 사이클)
- **롤백 비용**: medium → high (시각 자산 + 코드 변경 다수). 사용자 명시 결정 우선 + 시안 사용자 확인 후 전체 적용 완료
- **연계 결정**:
  - DESIGN_DIRECTION 철학 변경 → designer agent 작업 재개
  - frontend 13 화면 코드 변경 (M3 W15 Cycle B 추가 또는 M4 W17 작업 큐)
  - D-018 가격 정합 유지 ($4.99 시각적 premium 강화)

### D-021: 운영 blocker 일괄 "제품 완성 후" 이연 — D-012 강화

- **일자**: 2026-05-15
- **결정자**: 사용자 (mju.jykim@gmail.com) 명시 결정 — "네 그 결정은 뒤로 미루겠습니다. 제품이 완성되면 합시다."
- **배경**: 비즈니스 진행 상태 답변(2026-05-14) 후 orchestrator P0 권고 2건 (C-13 사업자 등록 이번 주 시작 + R-01 외부 검수자 모집 게시)에 대한 사용자 명시 응답
- **결정**: 다음 운영 blocker 모두 **"제품 완성 후"로 이연**. D-012 (C-13 M5 entry 이연)를 강화·확대.

| 항목 | 기존 (D-012) | 신 결정 (D-021) |
|---|---|---|
| C-13 사업자 등록 / 통신판매업 | M5 entry reconfirm (6/2) | 제품 완성 후 (사용자 reconfirm 시점) |
| RC Publisher 등록 + 결제 수령 계좌 | M5 entry | 제품 완성 후 |
| R-01 외부 한국어 원어민 검수자 모집 | M3 W16 ~ M4 W17 가속 | 제품 완성 후 (qa 100% fallback 정식 활성) |
| Slack workspace + 실 webhook URL | M5 entry (D-011) | 제품 완성 후 |
| 베타 모집 채널 / 인원 / SLA | M5 W19-B1 (R-M5-01 §3) | 제품 완성 후 |
| App Store / Play 운영 metadata 본 출시 정보 | M5 W19-O4 | 제품 완성 후 |

- **"제품 완성"의 정의 (orchestrator 자율 잠정)**:
  - 1차 정의: **M5 베타 종료 시점 (~2026-06-15)** 또는 사용자가 GA 출시 결정 시점
  - 2차 정의 옵션 (사용자 명시 결정 시): GA 출시 후 안정화 (post-GA 14일)
  - 본 정의는 사용자가 명시 변경하지 않으면 1차 정의 유지

- **사용자 의도 해석**:
  1. 비즈니스 / 운영 결정에 시간 쓰지 않고 **제품 개발에 몰두**하겠다는 의도
  2. swarm coding 팀이 자율로 진행 가능한 영역은 모두 진행
  3. 운영 blocker는 제품이 충분히 완성되어 사용자가 "이제 운영 시작"이라고 결정할 수 있는 시점에 처리

- **사유**:
  1. 사용자 caps reservation: "운영 blocker 무시, 제품 완성에 몰두" (D-012 봉인 시 명시)와 일관
  2. 베타 단계 sandbox-only 운영 가능 (사업자 등록 없이도 Apple TestFlight Internal + Play Internal Testing 활용)
  3. 콘텐츠 외부 검수는 D-020 qa cross-review 정책으로 형식·정합성 100% 처리 + 베타 사용자 retroactive 피드백으로 자연성 보완 가능
  4. 1인 개발자 캐파 보호 (R-06) + 제품 완성도 우선

- **비즈니스 영향**:
  - **베타 (M5 W19) sandbox-only 운영**: 실 매출 0, 사용자 행동 신호만 수집. paid release는 GA 시점 이후 결정
  - **R-01 외부 검수 deferred**: D-020 qa 100% fallback 정식 활성. 베타 사용자 피드백으로 retroactive 검수
  - **GA 일자 변동**:
    - 사용자가 5/15~6/8 사이 C-13 시작 시 → GA 6/15 월 또는 6/22 일 가능
    - 사용자가 GA 직후 (6/15 이후) C-13 시작 시 → paid release는 C-13 완료 후 (lead time 1~2주)
    - 사용자가 GA 후에도 C-13 미시작 → free-only GA + 사용자 결정 후 paid update
  - **R-M5-01 PM 알림 (6/2)**: deadline 변경. PM은 사용자 호출 시점에만 reconfirm 알림 송출
  - **Break-even 일정**: GA paid release 시점부터 카운트 (C-13 결정 시점 의존)

- **swarm coding 팀 영향**:
  - learning + qa: D-020 cross-review로 콘텐츠 quality 100% 처리 (R-01 외부 검수 deferred 정책 적용)
  - frontend + backend: 베타 sandbox-only 운영 정합 (paid release 분기 보존)
  - legal: 약관 / 개인정보처리방침 정식본은 제품 완성 후 진행
  - devops: Slack alert stub 모드 유지 (실 webhook URL 등록은 제품 완성 후)
  - pm: 6/2 R-M5-01 알림 → "사용자 호출 시점" 알림으로 변경

- **영향 받는 SSOT 9건**:
  - `docs/DECISION_LOG.md` — D-021 봉인 + D-012 cross-reference
  - `docs/risk/RISK_REGISTER.md` — R-01 mitigation 갱신 + R-02 처리 시점 변경 + R-M5-01 deadline 변경
  - `docs/learning/CONTENT_QUALITY_POLICY.md §2 Step 2` — 외부 검수자 deferred 표기
  - `context/rollups/20260512-R-M5-01-user-reconfirm-template.md` — PM 송출 deadline 변경 (6/2 → 사용자 호출 시점)
  - `context/rollups/20260514-R-01-reviewer-recruitment-assets.md` — deferred 표기
  - `docs/pm/W15_SPRINT_BOARD.md` — M5 entry reconfirm 일정 갱신
  - `context/rollups/20260512-M5-entry-preview-dispatch.md` — W19-O1/O2/O3/B1 시점 변경
  - `CHANGELOG.md` — 외부 가시 변경 없음 (운영 정책 변경, 내부)
  - `SWARM_LEDGER.md` D-021 entry

- **롤백 비용**: 낮음 — 정책 변경만, 코드/콘텐츠 영향 없음. 사용자가 "지금부터 운영 시작"이라고 결정하면 D-022로 즉시 활성

- **연계 결정**:
  - D-012 (C-13 M5 entry 이연) 강화·확대
  - D-011 (Slack webhook stub) 유지·연장
  - D-020 (qa cross-review) — 본 결정의 mitigation 기반
  - R-M5-01 (사용자 reconfirm 3건) — deadline 변경

### D-020: 콘텐츠 상호 검증 정책 봉인 — qa agent 콘텐츠 검수 책임 추가 (learning ↔ qa cross-review)

- **일자**: 2026-05-14
- **결정자**: 사용자 (mju.jykim@gmail.com) 명시 결정 — orchestrator 진행
- **사용자 의도**: "검수는 또 다른 QA 인력을 고용해서 진행해주세요. 상호검증 부탁드립니다."
- **결정**:
  1. **qa agent에 콘텐츠 검수 책임 정식 추가** — AGENTS.md §4 qa skill 영역 확장. 기존 evaluator/E2E test 책임 + 콘텐츠 G-01~G-10 검수
  2. **learning ↔ qa 상호 검증 워크플로 활성** — learning이 작성한 콘텐츠 batch를 qa가 검수 + qa 발견 사항을 learning이 confirm/response
  3. **CONTENT_QUALITY_POLICY §2 검수 워크플로 6단계 확장 → 7단계** — Step 2.5에 "qa agent cross-review" 신설 (외부 한국어 원어민 검수 + 영어 검수 + qa 내부 검수 = 3-source dual-track)
  4. **외부 검수자(R-01) dual-track 유지** — qa 내부 검수는 형식·정합성·기술 측면 / 외부 원어민은 자연성·문화 측면. 상호 보완
- **승인 기준 (qa 검수자 게이트)**:
  - 540 단어 100% G-01/G-02/G-04 자동 검증
  - sampling 30% G-05 i+1 / G-09 금지·민감 / distractor 중복 검사
  - 위반 발견 시 P0/P1/P2 분류 후 learning에게 회신 요청
  - learning은 P0 즉시 수정, P1 1주 안에 처리, P2 M4 W17 batch 처리
- **사유**:
  1. **사용자 명시 결정**: 외부 검수자 모집 lead time(R-01)을 기다리지 않고 즉시 cross-review 가능
  2. **swarm coding 팀 자체 캐파 활용**: qa agent는 이미 evaluator/golden case 검증 역량 보유 — 콘텐츠 G-01~G-10 검수에 자연 fit
  3. **R-01 mitigation 강화**: 외부 검수자 모집 실패 시 qa 100% fallback 가능 (외부 $500 예산 외 추가 비용 0)
  4. **품질 보장 layer 추가**: 내부(qa, 기술) + 외부(원어민, 자연성) = dual quality assurance → MVP 수준 초과 "실제 제품수준" 충족 가속
- **영향 받는 SSOT**:
  - `AGENTS.md §1.1 + §4` qa skill 확장
  - `docs/learning/CONTENT_QUALITY_POLICY.md §2` 검수 워크플로 7단계 (Step 2.5 신설)
  - `docs/risk/RISK_REGISTER.md` R-01 mitigation 강화 (dual-track 명시)
  - `context/agents/qa/20260514-XXXX-feat-content-cross-review.md` (신규)
  - `context/agents/learning/20260514-XXXX-feat-qa-cross-review-response.md` (신규)
- **롤백 비용**: 낮음 — 정책 변경만, 콘텐츠 데이터 변경 없음
- **연계**: D-019 (콘텐츠 quality 정책) + R-01 (외부 검수자 모집)

### D-019: 콘텐츠 제품수준 quality 정책 봉인 — MVP candidate 수준 초과 → "실제 제품수준" 목표

- **일자**: 2026-05-13
- **결정자**: 사용자 (mju.jykim@gmail.com) 명시 결정 — orchestrator 진행
- **사용자 결정 의도**: "교육 콘텐츠가 많아야 합니다. MVP 수준을 넘어서 실제 제품수준으로 나오게 orchestrator가 잘 신경써 주시기를 부탁드립니다."
- **결정**:
  1. **콘텐츠 범위 확장 (paywall promise 충족)**:
     - Starter Pack: 60 단어 (free) — 기존 candidate v1.0 quality 보강
     - **Core Pack**: 180 단어 (premium, K-pop 60 + K-drama 60 + Travel 60 — onboarding 4 카테고리 정합)
     - **Premium Pack 1**: 300 단어 (premium, paywall "Premium pack — 300+ words" promise 충족)
     - Monthly Pack: 50 단어 × N (post-GA monthly release)
  2. **Quality gate 8건 정량화** — `docs/learning/CONTENT_QUALITY_POLICY.md` 봉인
  3. **검수 워크플로 6단계 강제** — 외부 한국어 원어민 검수 필수 (CC3-07)
  4. **외부 검수자 모집 (R-01)** — M3 W16~M4 W17 안에 1~2명 확정
  5. **콘텐츠 작성 책임**: learning agent (lead) + orchestrator (quality gate 통합 승인)
- **봉인 정책 (제품수준 정량 기준, MVP candidate 초과 항목)**:
  - **gloss**: 1-5 단어 + slash 형식 통일 (예: "I (formal)" 허용, "there is / I have" 형식 통일)
  - **example_ko**: i+1 (학습 어휘 ≥ 80%, 신규 ≤ 1) + 자연스러운 한국어 (한국어 원어민 검수 통과)
  - **example_en**: 자연스러운 영어 번역 (literal 번역 회피, 영어권 사용자 readability 우선)
  - **distractor**: cosine 의미 거리 0.30-0.70 (CTN-009 fixture 활성화, M4 W17 evaluator)
  - **audio**: Google Cloud Neural2 한국어 (ko-KR-Neural2-A 또는 -C 권고), 22kHz mono, peak -3dB, 받침 변화 단어 별도 audio QA
  - **빈도 기반성**: starter+core+premium 모두 한국어 빈도 사전 (국립국어원 또는 KO-COW)에서 상위 3000 단어 우선 (베타 사용자 실 사용 가능성)
  - **금지/민감 표현**: 정치/종교/성/폭력/혐오 표현 0건 (1차 5개국 Apple/Google 정책 정합)
- **사유**:
  1. **사용자 명시 의도**: "MVP 수준 초과 → 실제 제품수준"
  2. **D-018 가격 정합**: Premium $4.99/mo는 사용자가 "진지한 학습자"로 인식해야 가치 매칭 → 콘텐츠 quality가 가격 신뢰성 결정
  3. **paywall promise 충족**: paywall에 명시된 "Premium pack — 300+ words", "Monthly 50 new words"는 실제로 제공되어야 함 (광고법 §4 표시 광고 정합)
  4. **베타 사용자 검증**: 30명 베타가 14d KPI(lesson_complete_rate ≥ 60%, paywall_view_to_purchase ≥ 2%) 달성하려면 콘텐츠가 실제 학습 가치 제공
  5. **R-01 mitigation**: 외부 검수자 모집은 CC3-07 정책. 미해소 시 PM self-review fallback (24h SLA 위반 risk)
- **영향 받는 SSOT 11건**:
  - `docs/learning/CONTENT_QUALITY_POLICY.md` (신규 SoT)
  - `docs/03_learning_methodology_curriculum.md` (콘텐츠 범위 확장 명시)
  - `docs/04_content_operations.md` (검수 워크플로 6단계)
  - `fixtures/seeded/words/starter-pack-candidates.yaml` (R-01 진척 표기 + 받침 변화 audio note)
  - `fixtures/seeded/words/core-pack-kpop.yaml` (신규)
  - `fixtures/seeded/words/core-pack-kdrama.yaml` (신규)
  - `fixtures/seeded/words/core-pack-travel.yaml` (신규)
  - `fixtures/seeded/words/premium-pack-1.yaml` (신규)
  - `docs/01_business_plan.md` §9 콘텐츠 전략 (범위 확장)
  - `docs/risk/RISK_REGISTER.md` R-01 mitigation 갱신
  - `CHANGELOG.md` [Unreleased] M3 W15 보강
- **누적 콘텐츠 (D-019 완료 시 목표)**:
  - Starter (free): 60 단어
  - Core (premium): 180 단어 (K-pop 60 + K-drama 60 + Travel 60)
  - Premium Pack 1 (premium): 300 단어 (TOPIK 1-2, 일상 확장) — 본 사이클 100건 초안, 다음 사이클 보강
  - **누적**: starter 60 + core 180 + premium 100 = **340 단어** (paywall promise "300+" 정합, 다음 사이클 +200으로 500+ 도달)
- **롤백 비용**: medium — 콘텐츠 quality는 출시 후 회수 불가. 출시 전에 quality gate 통과 강제

### D-018: Premium 가격 정합성 결정 — $4.99/mo · $49.99/yr 채택 (사업계획서 $1.99 대비 2.5배 인상)

- **일자**: 2026-05-13
- **결정자**: 사용자 (mju.jykim@gmail.com) 명시 결정 — orchestrator AskUserQuestion 응답
- **배경**: 사업계획서 v0.1 §10.2(2026-05-07)에 Premium Monthly $1.99 / Premium Annual $14.99 가설 명시. qa context(W15, M4 E2E_SUITE_PLAN §5.2)에서 StoreKit Configuration placeholder로 premium_monthly $4.99 / premium_annual $49.99 기록. M4 entry preview dispatch v0(W17-Q1)에 qa placeholder 그대로 반영 → 사업계획서와 정합성 충돌
- **결정**: **Premium Monthly $4.99/mo + Premium Annual $49.99/yr** 채택 (qa placeholder 채택, 사업계획서 v0.1 §10.2 갱신)
- **사용자 결정 근거** (명시 의도):
  - "처음부터 싸구려로 인식되어서는 안된다"
  - $1.99/mo는 "충동 결제 가능한 낮은 가격대"였으나 premium positioning 부족
  - $4.99/mo는 사업계획서 대비 2.5배 인상 + qa placeholder와 정합 = 즉시 적용 가능
  - 경쟁사 (Duolingo Super $14, LingoDeer $14.99, Memrise $8.49, Babbel $13.95) 대비 여전히 낮은 진입가
  - 1인 운영 가능 + 사용자가 "premium 진입가"로 인식 가능한 균형점
- **연 구독 할인율**: $49.99 / ($4.99 × 12) = 16.5% 할인 (월 환산 $4.17/mo)
- **영향 받는 SSOT 9건**:
  - `docs/01_business_plan.md` §10.2 가격표 + §14 비용/수익 가정
  - `docs/risk/RISK_REGISTER.md` Q-W15-pricing resolved 추가
  - `CHANGELOG.md` [Unreleased] M3 W15 보강
  - `docs/product/PRD.md` §8.2 paywall_view_to_purchase threshold 영향 평가
  - `context/rollups/20260512-R-M5-01-user-reconfirm-template.md` §1.4 결제 흐름 가격 명시
  - `context/rollups/20260512-M5-entry-preview-dispatch.md` W19-O6 결제 dry-run 가격 명시
  - `docs/DECISION_RISK_ADR_MATRIX.md` §5.3 예상 D-NNN 봉인 표 (D-019/D-020 shift)
  - `SWARM_LEDGER.md` D-018 entry
  - 본 DECISION_LOG §5 변경 이력
- **연계 결정**:
  - D-019 ADR-0007 봉인 → W16-02 시점 (2026-05-22 목)
  - D-020 ADR-0008 봉인 → M4 W17-S1 시점 (2026-05-26~27)
- **롤백 비용**: medium — 출시 후 가격 인하는 정책상 가능하나 인상은 사용자 신뢰 손실. M5 베타 14d KPI(paywall_view_to_purchase) 측정 후 GA 직전 한 번 더 reconfirm 가능
- **재조정 정책 (사업계획서 §14.3 준수)**:
  - 유료 전환율 낮지만 사용성 지표 좋으면 → **가격보다 무료 한도 조정 우선**
  - 리텐션 낮으면 → 가격이 아니라 제품 가치 개선 우선
  - 연간 플랜 비중 낮으면 → 연간 가격 또는 혜택 조정 ($49.99 → $44.99 또는 추가 단어 pack 무료 등)
  - 콘텐츠 확장 전 가격 인상 신중 (starter 60 → core 180 → topik 진입 후)

### D-017: R-29 risk ID 충돌 해소 — orchestrator 우선, security JWT 만료를 R-34로 reroute

- **일자**: 2026-05-12 (RISK_REGISTER 작성 시 발견)
- **결정자**: orchestrator
- **배경**: orchestrator가 Cycle A Dashboard §4에서 R-29(Phase 2 backend SRS module 본 구현 이전) 등록. security가 W15 RLS_EVALUATOR_HYBRID_PLAN §135에서 R-29(pg_test_role JWT 만료)를 신규 등록 의도로 작성. 같은 ID로 두 의미 사용
- **결정**: orchestrator R-29(Phase 2 ADR-0006) ID 유지(먼저 등록 + M4 W17 closed 예정). security가 작성한 "pg_test_role JWT 만료" risk를 **R-34**로 reroute
- **영향 받는 파일**: `docs/risk/RISK_REGISTER.md` §2.1 R-34 등재 / `docs/security/RLS_EVALUATOR_HYBRID_PLAN.md` §135 ID 갱신 권고
- **롤백 비용**: 낮음 — ID 변경만

### D-015: SRS golden ID 충돌 해소 — analytics 051~053 우선, learning 056~060 재배치

- **일자**: 2026-05-12 (W15 Cycle A 통합)
- **결정자**: orchestrator
- **배경**: dispatch v2 직후 analytics(W15-04 lead)와 learning(content + threshold 책임)이 모두 SRS-051~055 ID 슬롯에 fixture 작성. 의미가 일부 겹치지만(interruption/dormant) 단언 형태는 완전히 다름
- **결정**:
  1. analytics가 점유한 SRS-051/052/053(slug 형식 파일, stage_correct/mastered_protection enum 흡수) 유지 — dispatch plan v2 §2에서 SRS golden lead 명시
  2. learning이 호출자 직접 지시로 작성한 SRS-051~055 5건을 SRS-056~060으로 rename
     - SRS-056: interruption-client-attempt-idempotent (멱등성 409)
     - SRS-057: dormant-14day-weak-priority (14일 dormant + weak 우선)
     - SRS-058: audio-mismatch-invalidate (report 시 stage 강하 무효)
     - SRS-059: same-session-repeat (단일 세션 중복 시 1회 갱신)
     - SRS-060: weak-clear-one-correct (1회 정답 = weak clear 봉인)
  3. `scripts/eval/srs.ts` SrsCase.category union에 5개 enum 추가 작업은 backend가 W16 D1까지 활성화 (현재는 fixture만 봉인, evaluator strict는 W16 이후)
  4. SRS golden 누적 = 57건 (analytics 22 + qa 6 + learning 5 + daily_limit 4 + W14 잔여 20)
- **사유**: dispatch plan v2에서 analytics가 SRS lead로 명시되었으므로 점유 우선권. learning 작성분도 의미가 다른 별도 시나리오라 보존 가치 있음
- **영향 받는 파일**: `fixtures/golden/srs/SRS-056~060-*.yaml` (learning rename) + `fixtures/golden/srs/README.md` (분포 + W15 Cycle A 절 갱신) + `scripts/eval/srs.ts` (W16 enum 활성화 작업 큐)
- **연계 작업 큐 (W16)**: backend가 `applySrs` 외 5개 evaluator 분기 함수 작성 + 060 weak_clear는 정답 1회 시 weak=false 단언
- **롤백 비용**: 낮음 — rename + README + ADR-0006(SRS module) 분리 시 자연스럽게 합류

### D-009: devops Specialist 정식 활성화 (M2-S1, W5)

- **일자**: 2026-05-08
- **결정자**: orchestrator (M2 진입 트리거)
- **결정**: `devops` agent를 M2-S1 (W5)부터 정식 활동 시작
- **활동 범위 (1차, M2)**:
  1. **EAS 환경 분리** (W5) — dev/staging/prod 번들 ID 분리 (com.dash2zero.dev/staging/app), 아이콘 배지
  2. **GitHub Actions CI 골격** (W5) — PR check (lint + type + unit test), main protect rule
  3. **Supabase 프로젝트 3환경** (W5-W6) — dev/staging/prod 분리, secret 관리
  4. **EAS Build 무료 티어 운영** (W5+) — 30 builds/mo 모니터링
  5. **모니터링 alert 채널** (W6+) — Owner 모바일 알림 (CC3-02 SLA 준수)
  6. **인증서/키 백업 절차** (W5) — CC2-21 dead man's switch + 1Password Emergency Kit 설정
- **활동 위치**:
  - `worktrees/devops/` (M2-S1 W5에 활성화)
  - `context/agents/devops/`
  - `infra/eas/`, `infra/supabase-deploy/`, `scripts/release/`
  - `.github/workflows/`
- **다음 활성화 예정**: M5 ASO/배포/릴리스 게이트
- **롤백 비용**: 낮음

### D-007: ADR-0001 승인 — 후보 A (Lean) 채택 봉인

- **일자**: 2026-05-07
- **결정자**: orchestrator (M1 사이클 3 게이트)
- **결정**: ADR-0001-stack-decision.md를 **Accepted**로 발효. 후보 A (Lean / Managed / Serverless-first) 봉인
- **승인 근거**:
  1. STACK_OPTIONS_MATRIX 가중 평가 78.2% (B 68.0% / C 52.9%) — 압도적
  2. STACK_DECISION §3 정성 5가지 우선순위 모두 충족
  3. STACK_EVOLUTION_PLAN의 4 phase 진화 경로 + 정량 트리거 정의 완료
  4. Vendor lock-in 위험은 9개 경계면 추상화 + 마이그레이션 트리거로 완화 (수용 가능)
- **영향 받는 문서**: 모든 후속 산출물의 SSOT가 됨
- **롤백 비용**: 매우 높음 (M2 진입 후), 본 ADR의 Reversal Trigger 도달 시에만 갱신
- **검증 시점**: M2 W12 / M3 W14 / M5 W18 / 출시 +30일 / 출시 +90일

### D-006: analytics agent 정식 활동 시작 (M3 사전 활성화)

- **일자**: 2026-05-07
- **결정자**: orchestrator (PM 옵션 C 선택)
- **결정**: `analytics` agent를 M3 트리거 도래 전에 정식 활동 시작. 첫 산출물은 평가 시나리오 윤곽(`docs/harness/EVALUATION_SCENARIOS.md`)
- **사유**:
  1. 하네스 5층 구조에서 Evaluation Layer / Observability Layer는 analytics가 주 책임
  2. PM/architect의 하네스 문서가 analytics가 정의한 시나리오에 의존
  3. M3에서 평가 시나리오 정의를 처음부터 시작하면 측정-구현 사이 지연 발생
- **활동 범위 (1차)**: 
  - SRS golden case 50개 윤곽 (learning과 협업 — learning은 standby 유지)
  - 결제 state matrix 9개 회귀 시나리오
  - Privacy/consent evaluation 4개 케이스
  - Content manifest validation 3개 케이스
- **활동 위치**: `docs/harness/EVALUATION_SCENARIOS.md`, context 기록은 `context/agents/analytics/`
- **다음 활성화 예정**: M3 진입 시 본격 evaluation runner 구현
- **롤백 비용**: 낮음. 시나리오 정의는 도구 선택과 무관

### D-005: Specialist 4명 사전 채용 (archive → active)

- **일자**: 2026-05-07
- **결정자**: orchestrator (PM 요청)
- **결정**: archive에 보존된 4명을 정식 swarm coding 팀으로 사전 채용. 활성 13명 체제 (Core 9 + Specialist 4) 운영
- **사유**:
  1. 마일스톤 도달 시 즉시 활성화 가능 (lead time 0)
  2. M1 도메인 자문(`learning`), M3 이벤트 택소노미(`analytics`)는 조기 합류가 산출물 품질에 직접 영향
  3. PM 요청 — "일을 안시키더라도 미리 구성"
- **이름 단순화**: archive 원본은 그대로 보존, active는 단순 ID로 변경
  - `learning-design-expert` → `learning`
  - `data-analytics-senior` → `analytics`
  - `payments-legal-specialist` → `legal`
  - `devops-release-senior` → `devops`
- **활동 트리거** (.codex/config.toml [team.activation_triggers]):
  - `learning`: M1 도메인 자문 / M2 SRS 검증 / M5 콘텐츠 검수
  - `analytics`: M3 이벤트 택소노미 / 하네스 evaluation 정의
  - `legal`: C-13 사업자 확정 후 D-42 약관/결제 정책 검토
  - `devops`: M2 CI/CD bootstrap / M5 ASO/배포 게이트
- **항시 standby 의미**: 페르소나 정의는 `.claude/agents/`에 활성, 실제 작업 지시는 트리거 마일스톤 도달 시 Orchestrator가 부여. 활동 내역은 다른 9명과 동일하게 `context/agents/{learning|analytics|legal|devops}/`에 기록
- **영향 받는 문서**: `AGENTS.md §1`, `.codex/config.toml [team]`, `docs/PROJECT_MAP.md`, `docs/HANDOFF.md`
- **롤백 비용**: 낮음. archive 원본 보존 중이므로 언제든 active 디렉토리에서 제거 가능

### D-004: 기획 검토 SSOT 보존 정책

- **일자**: 2026-05-07
- **결정자**: orchestrator
- **결정**: REVIEW_QA.md, SERVICE_REVIEW_QA.md, 23개 v0.3 기획서는 swarm coding 단계에서 **read-only 참조 SSOT**로 유지. swarm 단계 결정은 본 DECISION_LOG 또는 ADR로만 기록
- **사유**: 결정 이력 추적성 + 기획 봉인 무결성
- **영향 받는 문서**: 모든 swarm coding 산출물
- **롤백 비용**: 낮음 (정책)

## 4. ADR 인덱스

| ID | 제목 | 상태 | 일자 |
|---|---|---|---|
| ADR-0001 | Stack Decision (Lean / Managed) | **Accepted** | 2026-05-07 |
| ADR-0002 | Domain Model 경계면 추상화 범위 (5 추상화 + 4 직접) | **Accepted** | 2026-05-08 |
| ADR-0003 | Harness 도구 선택 (Langfuse vs Phoenix vs etc.) | pending (M3) | - |
| ADR-0004 | RLS 정책 매트릭스 (13 테이블 × 5 역할 × 4 CRUD) | **Accepted** | 2026-05-08 |
| ADR-0005 | TTS provider 선택 (Google Cloud Neural2) | **Accepted** | 2026-05-08 |
| ADR-0006 | SRS 공유 패키지 (`packages/srs-core` — architect 자율 결정으로 명칭 변경) | **Accepted (W15 Cycle A 봉인 권고, orchestrator)** | 2026-05-11 |
| ADR-0007 | Baseline 저장소 (synthetic seed + staging + dogfood 3-source + aggregate-only + source 우선순위 + R4 reversal) | **Accepted** (orchestrator pre-draft 2026-05-20 W16 D-2 → architect 회람 5건 권고 D-3 → 권고 반영 + 봉인 D-3 후반) | 2026-05-21 (Accepted) |
| ADR-0008 | Secret 회전 정책 (Slack webhook + EAS / Supabase keys) | pending (M4 W17 이연) | - |
| ADR-0009 | react-native-reanimated 도입 (M5 P1 PTR/Toast 진입 사전) | **Accepted** (orchestrator pre-draft 2026-06-01 → 회람 의견 11건 통합 → D-033 봉인 2026-06-02 W18 D-1 사전 진입) | 2026-06-02 (Accepted) |

ADR이 추가되면 `docs/adr/`에 파일 생성 후 본 인덱스 갱신.

## 5. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M0-4 DECISION_LOG 초안 + D-001~D-004 swarm 단계 신규 결정 4건 | orchestrator |
| 2026-05-07 | D-005 추가 — Specialist 4명 사전 채용 (Core 9 + Specialist 4 = 활성 13명) | orchestrator |
| 2026-05-07 | D-006 추가 — analytics 정식 활동 시작 + EVALUATION_SCENARIOS 87 case 윤곽 | orchestrator |
| 2026-05-07 | D-007 추가 — ADR-0001 Accepted, 후보 A 봉인 | orchestrator |
| 2026-05-08 | D-008 추가 — learning Specialist 정식 활성화 (M2-S1 W5) | orchestrator |
| 2026-05-08 | D-009 추가 — devops Specialist 정식 활성화 (M2-S1 W5) | orchestrator |
| 2026-05-08 | ADR-0002 Accepted — Domain Model 추상화 범위 (5+4) | orchestrator |
| 2026-05-08 | ADR-0004 Accepted — RLS 매트릭스 (13×5×4) | orchestrator |
| 2026-05-08 | ADR-0005 Accepted — TTS Google Cloud Neural2 (86.3% vs 82.9% Clova) | orchestrator |
| 2026-05-11 | D-010~D-013 4건 봉인 (baseline-env / slack-alert / c13-business / prd-thresholds) — 사용자 자율 결정 권한 위임 사이클 | orchestrator |
| 2026-05-11 | ADR 인덱스에 ADR-0006/0007/0008 pending 등재 (게이트 정의: 0006 W15 architect, 0007 W16 D-010 후, 0008 M4 W17 이연) | orchestrator |
| 2026-05-11 | C-13 보류 표 갱신 — D-012로 M5 entry 분류 (제품 완성 후 처리) | orchestrator |
| 2026-05-12 | W15 Cycle A 통합 — D-014 RLS adversarial ID 충돌 해소 (security 005~009 우선, backend 010~013) + D-015 SRS golden ID 충돌 해소 (analytics 051~053 우선, learning 056~060) + D-013 PRD threshold 4 KPI 승인 + ADR-0006 Accepted (packages/srs-core, architect Option A 채택) | orchestrator |
| 2026-05-12 | RISK_REGISTER 신규 SoT 작성 + D-016 R-28 충돌 해소 (designer 우선, security 시드 신뢰성 → R-33) + D-017 R-29 충돌 해소 (orchestrator 우선, security JWT 만료 → R-34) | orchestrator |
| 2026-05-13 | D-018 Premium 가격 정합성 결정 — $4.99/mo · $49.99/yr 채택 (사용자 명시 결정, 사업계획서 $1.99 vs qa $4.99 충돌 해소, "싸구려 인식 회피" 의도 반영, 사업계획서 §10.2 + 8개 SSOT 갱신) | 사용자 + orchestrator |
| 2026-05-13 | D-019 콘텐츠 제품수준 quality 정책 봉인 — Core 180 (K-pop/K-drama/Travel) + Premium Pack 300 작성 + 8 quality gate 정량 + 검수 워크플로 6단계 + R-01 외부 검수자 모집 가속 (사용자 명시 "MVP 수준 초과") | 사용자 + orchestrator |
| 2026-05-14 | D-020 콘텐츠 상호 검증 정책 봉인 — qa agent에 콘텐츠 검수 책임 추가 + learning↔qa cross-review + 외부 검수자(R-01) dual-track 유지 (사용자 명시 "또 다른 QA 인력 고용 + 상호검증") | 사용자 + orchestrator |
| 2026-05-15 | D-021 운영 blocker 일괄 "제품 완성 후" 이연 — D-012 강화·확대. C-13/R-01/Slack/베타 모집/스토어 운영 모두 deferred. qa 100% fallback 정식 활성. 사용자 명시 "그 결정은 뒤로 미루겠습니다, 제품 완성되면 합시다" | 사용자 + orchestrator |
| 2026-05-18 | D-022 K-pop Bold 디자인 방향 채택 — Quiet/Steady 철학 부분 폐기. 그라데이션 + neon + 한글 hero typography. 사용자 mockup 검토 후 "디자인이 전혀 stunning 하지 않은 것 같아요" 평가 반영. 핵심 3 화면 시안 작성 후 전체 적용 결정 | 사용자 + orchestrator |
| 2026-05-21 | D-023 Premium Motion System v1.1 RN 호환 봉인 — 외부 Lead Designer가 v1.0(웹 기준)을 v1.1(React Native + Expo)로 전면 재작성. Q-MOTION 5 decisions: (1) 그림자 변경 = scale 0.96 + opacity 0.6배 모사 (60fps 보장), (2) shimmer = expo-linear-gradient 표준, (3) page transition = Expo Router slide_from_right, (4) 햅틱 = expo-haptics 시각+물리 진동 (Success/Warning/Light), (5) Reduce Motion = 150ms opacity fade 대체. MOTION_TOKENS는 packages/design-tokens/src/motion.ts에 봉인 (기존 Quiet/Steady tokens는 @deprecated 유지). frontend/qa/security 3 agent 위임 진입. 4-rule Merge Gate 적용 예정 (transform/opacity only · dynamic class lifecycle equivalent · MOTION_TOKENS 일관 · shimmer skeleton) | 외부 designer + 사용자 + orchestrator |
| 2026-05-21 | ADR-0007 Accepted 봉인 (W16 D-3 후반 D-4 사전 진입) — architect 회람 5건 권고를 본문 §1/§2/§3/§5/§6에 반영: (1) §1 aggregate-only 원칙 (PII PK 절대 금지), (2) §2 source 우선순위 4-tier (staging > real-user M5 > synthetic CI 검증용 > dogfood sanity), (3) §3 byte-identical seed 검증 unit test 필수, (4) §5 weekly check-thresholds → GitHub Action gh pr comment 통합, (5) §6 R4 추가 (synthetic 분포가 KPI target과 50%+ 괴리 시 fast-path seed 재조정). Q-ADR-0007-1/2/3 3건 모두 결정 완료. M3 게이트 #4 (3-source baseline 14d) 충족 조건 봉인 | architect + orchestrator |
| 2026-05-22 | D-024 Motion v1.1 후속 Sprint Polish 봉인 — 외부 Lead Designer DESIGN_REVIEW_W16_MOTION.md (W16 D-3 발행, APPROVED with High Honors) + 디렉티브 v1.2 수신. 3 Task 완료: (1) Pulse Ripple 컴포넌트 (PulseOverlay — Animated.parallel scale 0→2.2 + opacity 0.4→0, 450ms EASE_DECELERATE, ChoiceCard success 시점 통합, card에 overflow:hidden), (2) Global Haptic toggle (lib/haptics.ts wrapper — hapticImpact/hapticNotification + initHaptics/setHapticEnabledGlobal, SecureStore profile_haptic_enabled, in-memory cache로 60fps 정합, 5 호출처 전부 마이그레이션, Settings "SOUND & HAPTICS" 섹션 신규), (3) JellySwitch 컴포넌트 (RN Switch 대신 custom Pressable — thumb translateX + jellyScale 4-seg sequence 1→1.15→0.95→1.05→1, accessibilityRole switch 보존). 디자이너 권고 AsyncStorage → SecureStore 일관성 채택. 디자이너 본문에는 frontend/qa 위임 표기였으나 stream timeout 경험으로 in-context orchestrator 직접 작성 (cold spawn 비용 회피). QA MTC-A.4 (Pulse 60fps) + MTC-D.4 (Reduce Motion fallback) + MTC-F.1~F.3 (Haptic toggle OFF/ON/Jelly) 추가 | 외부 designer + orchestrator |
| 2026-05-22 | D-025 Motion Sheet — BottomSheet 컴포넌트 봉인 (디자이너 권고 §3 Category B P2 마지막 1건) — Motion v1.1 §3 정합: RN 내장 Modal API + Animated.parallel (translateY 24→0 + scale 0.96→1 + opacity 0→1 + backdrop opacity, 300ms DURATION_NORMAL + EASE_DECELERATE enter). Exit motion 180ms DURATION_QUICK + EASE_EXIT, Rule 2 정합 .start callback에서 setMounted(false) → Modal unmount. Reduce Motion fallback (translateY/scale 차단, opacity fade 150ms only). a11y backdrop tap + Android Back onRequestClose. 현재 codebase에 modal 사용처 0건 — 디자이너 의도 보존 + 미래 사용 대비 (Settings destructive confirm / Subscription tier 변경 / Lesson abandon confirm 등 M4 W17+ 후보). QA MTC-G.1~G.4 추가. **디자이너 권고 P0/P1/P2 (Motion v1.1 + DESIGN_REVIEW W16) 100% 완료** | 외부 designer + orchestrator |
| 2026-05-22 | D-026 Hybrid Delegation Policy 봉인 — 외부 Lead Designer가 orchestrator의 honest disclosure (사이클 G stream timeout 보고) + tactical override (사이클 L/M orchestrator 직접 작성)에 대해 **공식 거버넌스 결정** 발행. 향후 agent 분업 패턴 hybrid 모델 채택: **(A) Orchestrator 직접 작성 권장 영역** = 모션 토큰 수정 / UI StyleSheet 연동 / 마이크로 인터랙션 클래스·속성 바인딩 / 애니메이션 콜백 cleanup / 단순 버그 픽스 / 디자이너 피드백 반영. **(B) Sub-agent (frontend/qa/security) spawn 강제 영역** = 신규 코어 화면 도입 (Thin Vertical Slice 신설) / 복잡한 외부 API 레이어 설계 / 비즈니스 데이터 흐름 설계 / Harness 테스트 스위트 대규모 구축. 본 정책은 13 agent 모두 준수. 핵심 원칙: "최종 사용자 체감 퀄리티(Deliverable)의 수호" > 기계적 프로세스 준수 | 외부 designer (선언) + orchestrator (집행) |
| 2026-05-22 | D-027 W16 Premium Motion v1.2 **Final Sign-off** — 외부 Lead Designer가 8/8 motion requirement (13 화면 motion + 4-rule Merge Gate + Skeleton + Page Transition + Pulse Ripple + Settings Haptic toggle + Jelly Toggle + BottomSheet)에 대해 structurally verified 확인 + W16 Premium Motion branch merge 권한 부여. 4-rule Merge Gate cross-validate 완료 (사이클 J/K/L/M 누적). Task #62~#94 (frontend Motion 적용 + Skeleton + 보조 인터랙티브 + 디자이너 권고 7건) close 권고 — 모두 이미 completed 상태. Task #95~#99 (Pulse / Haptic toggle / Jelly / QA / BottomSheet) 추가 완료. **dash2zero 사용감 고도화 단계 완전 마감** | 외부 designer (Sign-off) + orchestrator (집행 봉인) |
| 2026-05-27 | D-028 Work Order W17 Cycle Q (P0-0/P0-3/P0-4/P0-5) 봉인 — 외부 Lead Designer의 swarm-handoff/01-WORK-ORDER.md (2026-05-26 발행) 5건 중 4건 처리: (1) **P0-0 motion.ts drop-in 적용** — duration 8키(tap/fast/base/stage/spring/sheet/slow/progress/count) + easing.spring/shake + rnEasing(RN Easing.bezier 매핑) 신규 export. 기존 MOTION_TOKENS는 동기화된 alias로 보존 (D-023~D-027 봉인 컴포넌트 8건 import 호환). (2) **P0-3 NeonButton ripple + glow brighten** — Ripple sub-component (Animated.parallel scale 0→1 + opacity 0.5→0, motion.progress 600ms), 다중 ripple 동시 + onDone cleanup 보장 (메모리 누수 vector 0). shadowOpacity interpolate(0.55→0.85, useNativeDriver:false 사유 주석) glow brighten on press. Reduce Motion 시 ripple 비활성. (3) **P0-4 useDelayedLoading(150ms) 신규 hook** + home/lesson 적용 — 짧은 fetch 깜빡임 회피. Shimmer 본체는 D-024 봉인 유지 (사용자 결정 옵션 A). (4) **P0-5 AudioButton 신규 컴포넌트** — playing 시 ringScale 1→1.5 + ringOpacity 0.8→0 (1400ms loop) + shadowPulse interpolate(24→34, useNativeDriver:false 사유), loading 시 conic spinner 900ms rotate, error 시 ! icon. Reduce Motion 정적 border. lesson screen의 inline LinearGradient를 AudioButton으로 교체. Work Order §1 5조 (토큰 강제·rnEasing·reduce-motion default·useNativeDriver 우선·정답/오답 모션 정합) 모두 PASS. P0-1/P0-2는 사이클 R로 이월 (변경량 큼 + ChoiceCard 광기/QuizOption 교체는 별도 사이클) | 외부 designer + orchestrator |
| 2026-06-01 | D-029 Work Order W17 Cycle R (P0-1 + P0-2) 봉인 — Work Order P0 5건 **100% 완료**. (1) **P0-1 StageReveal + MorphingKoreanWord** 신규 컴포넌트 2건. StageReveal: stageKey 변경 시 setValue 초기화 후 Animated.parallel(opacity 0→1 + translateY 8→0, duration["motion.stage"] 240ms, rnEasing.out, 60ms × delayIndex stagger) — reduce-motion 시 translateY 비활성. MorphingKoreanWord: tier="hero"|"tier-1-5" 분기 → scale 1↔0.875 + translateY 0↔-16, useNativeDriver:true (Work Order §3.5 위험 인지 — fontSize layout 속성이라 scale 보간). lesson [wordId].tsx에 통합: 한글 hero(Notice/Hear=hero, Meaning/Retrieve=tier-1-5) + RR/gloss/example_ko/example_en 4개 StageReveal stagger (delayIndex 0~3) + Quiz 4 옵션 stagger (i=0~3). (2) **P0-2 QuizOption 신규 + ChoiceCard 폐기** (사용자 결정 옵션 A, 2026-05-27): 카드 본체에 모션 적용 안 함 (DESIGN_DIRECTION §9.2 정합), ✓/✕ icon 한정 spring scale 0.4→1.0 + opacity 0→1 (140ms 지연, duration["motion.spring"] 320ms, rnEasing.spring). 오답 시 카드 본체 ±6px 5-segment shake 360ms (motion.sheet 정합), reduce-motion 시 opacity blink 200ms × 2. D-024 haptic 통합 보존 (Light press / Success correct / Warning wrong). ChoiceCard.tsx에 @deprecated 헤더 + d022/index.ts export 제외, PulseOverlay는 별도 활용 가능성 유지하되 사용처 0 (M5 정리 후보). (3) **Sprint risk R-M4-04 등록** (Work Order §11 (2)): lesson stage 전환 latency 변화 — analytics가 lesson_completed.duration_sec p50/p95 모니터링, baseline 대비 +0~+400ms 이내 (Work Order §3.4 기준). 4-rule Merge Gate 전체 cross-validate PASS (Rule 1: 모두 transform/opacity + useNativeDriver:true / Rule 2: stageKey reset + sequence cleanup / Rule 3: duration/rnEasing 토큰만 / Rule 4: skeleton 무관). **Work Order P0-0~P0-5 5건 100% + §1 5조 + §11 (1)(2)(3) 컨텍스트 의무 모두 충족** | 외부 designer + orchestrator |
| 2026-06-02 | D-032 인출 학습 표준 정합 — 오답 시 정답 미하이라이트 봉인 (L-M5-001, W18 D-2 사전 진입) — 외부 Lead Designer W17 sign-off §4 신규 백로그 진행. learning 검증 통과 (Karpicke & Roediger 2008 "The Critical Importance of Retrieval for Learning" / Pyc & Rawson 2009 "Testing the retrieval effort hypothesis" / Hattie & Timperley 2007 "The Power of Feedback"). **PRD §4 인출 루프 갱신 권고**: 오답 시 사용자 선택 카드 = error + 정답 카드 = correct-passive (glow만, ✓ icon 없음, haptic 없음). **QuizOption State union 4→5 확장** (`"correct-passive"` 신규). lesson [wordId].tsx state 계산 분기 추가: `!isSelected && isCorrectOpt → "correct-passive"`. Haptic 미발화 정합 (D-024 — 사용자 입력 아니므로). Reduce Motion 추가 분기 불요 (시각만, 모션 없음). Sliding 배경: D-031이 P1 Modal 활용처 거절 봉인 선점 → 본 결정 사전 분해 문서의 D-031 예약을 D-032로 sliding. 작업 분량 0.2 인-day (frontend 단독, planner PRD 갱신 별도) | learning + designer + orchestrator |
| 2026-06-05 | D-036 P1.4 PullToRefresh (Reanimated, M6 droppable) 컴포넌트 봉인 — **`apps/mobile/src/components/d022/PullToRefresh.tsx` 신규** — useAnimatedScrollHandler worklet (onScroll/onEndDrag/onMomentumEnd) + useSharedValue (scrollY, triggered) + runOnJS(fireRefresh). THRESHOLD 80px (Work Order §6 본문 명시값, raw 잔존). useAnimatedStyle indicator (opacity + translateY + rotate) — Reduce Motion 시 rotate 차단 (Designer 권고). worklet 체크리스트 C1~C8 모두 PASS. **Designer Q-2 결정 정합 (M6 droppable)**: Home의 useFocusEffect refetch가 이미 있어 PTR 시급성 낮음. W19 마지막 dispatch + 일정 압박 시 M6 이월 가능. **GA(6/15·6/22)를 PTR로 늦추지 말 것** (Designer 명시). **sign-off 조건**: 60fps Profiler 첨부 (R-M4-04 + ADR-0009 R3 monitoring 연동). **사용처 통합은 별도 사이클** (Home stats refetch 후보, Owner 결정 필요). progress 화면은 M6 검토 (Designer §10 명시). 본 봉인은 컴포넌트 정의만 — `d022/index.ts` PullToRefresh export 추가 | orchestrator |
| 2026-06-04 | D-035 P1.5 ConfirmSheet (Delete account 단일화) 봉인 — Designer Q-4 결정 (D-031) 정합: P1.5 활용처는 Delete account 1건만. **`apps/mobile/src/components/d022/ConfirmSheet.tsx` 신규** — 기존 BottomSheet (D-025) wrapper, Animated, Reanimated 불요. 신규 모션 컴포넌트 아닌 활용 작업. **destructive primary는 NeonButton gradient 대신 danger solid Pressable** (DESIGN_DIRECTION §3.2 "destructive action은 정직/명세 톤" 정합). Cancel은 NeonButton variant="secondary" 그대로. D-024 hapticImpact("light") on confirm. **`apps/mobile/app/settings.tsx` 통합**: handleDeleteAccount의 Alert.alert(2단계 Alert: 확인 → 성공/실패 Alert)를 ConfirmSheet로 교체 + 결과는 user-action toast / 실패는 persistent error toast + Retry action. **Lesson abandon confirm 추가 금지** (D-031 정합 영구). Subscription manage modal도 거절 (paywall/store 이동 유지). 2단계 확인 (checkbox "I understand") 추가는 M6 검토 (사이클 외) | orchestrator |
| 2026-06-04 | D-034 P1.2 Toast 시스템 봉인 — Reanimated 첫 사용처 + Provider/hook 패턴 (W18 D-4) — `apps/mobile/src/components/d022/Toast.tsx` 신규: ToastItem(Reanimated worklet, useSharedValue translateY + opacity, motion.sheet 360ms EASE_OUT enter + motion.fast EASE_IN exit, runOnJS dismiss) + ToastProvider(max 3 stack + queue 대기) + useToast hook (context). 3-tier 우선순위 (system/user-action 3s queue, error 5s 또는 persistent). **Designer Q-3 정합 보존**: (1) **action 있는 error는 auto-dismiss 금지** (수동 dismiss까지 persistent — Purchase failed Retry 같은 복구 경로 보존), (2) **차단성 결제 에러는 Alert 유지 vs actionable error는 persistent toast** — Settings handleSyncNow의 catch에서 persistent toast 채택 (Retry action 동반). WORKLET_GUIDE C1~C8 모두 정합 + Rule 5 (worklet transform/opacity only) PASS + D-024 hapticNotification("warning") 통합. `_layout.tsx` ToastProvider mount (children wrap). Settings handleSyncNow 사용처 통합 (성공 = user-action toast / 실패 = persistent error toast with Retry action). 후속 사용처 (privacy 동의 결과 / reminder permission grant / restore purchases 등)은 별도 사이클 | orchestrator |
| 2026-06-02 | D-033 react-native-reanimated 도입 Accepted 봉인 — ADR-0009 (회람 의견 11건 통합 Conditional Accept) → **W18 D-1 사전 진입 시점 Accepted 봉인**. (1) `apps/mobile/package.json`에 `react-native-reanimated: ~3.10.0` 추가, (2) `apps/mobile/babel.config.js` plugins 배열 **마지막**에 `react-native-reanimated/plugin` 추가 (WORKLET_GUIDE §4.1 정합), (3) Q-ADR-0009-1 "never (legacy 영구 유지)" 정합 — D-022~D-029 봉인된 Animated 컴포넌트 8건 재작업 회피. **Owner 액션 필요**: `pnpm install` 후 `expo start --clear` (cache 무효화) + 회귀 검증 (기존 컴포넌트 8건 visual diff 0건 확인). 회귀 발견 시 R1 reversal trigger 검토. M5 P1 PTR + Toast dispatch 진입 인프라 완성 | orchestrator |
| 2026-06-02 | D-031 P1 Modal 활용처 — Lesson abandon confirm 거절 봉인 (dark-pattern 거리두기) — 외부 Lead Designer P1 Work Order 회신 (`docs/handoff/W18-DESIGNER-P1-RESPONSE.md` Q-4) **타협 불가 결정**: `DESIGN_DIRECTION §2.1` "가입/푸시 강요 회피, 도구 톤" + `§7.2` Duolingo 거리두기 정합으로 **Lesson abandon confirm modal 영구 거절**. 사유: "나가려는 사용자를 모달로 붙잡는 것은 정확히 그 dark-pattern. dash2zero의 약속(3분 만에 가볍게 들어왔다 나가는 도구)을 깬다. 이탈 retention은 streak + 옵트인 reminder로 풀 문제." 기존 자동 `lesson_abandoned` 이벤트 발화는 유지 (분석은 하되 막지는 않음). **P1.5 ConfirmSheet 활용처는 Delete account confirm 단일화** (파괴적·비가역 작업만 정당). Subscription manage는 기존 paywall/store 이동 유지(모달 불요). **본 결정은 learning agent가 retention 강화 위해 abandon-confirm을 재요청할 때 인용할 근거** — D-031을 인용 후 streak/reminder 방향으로 redirect. **사전 ID 충돌 해소**: L-M5-001 (오답 시 정답 미하이라이트) 사전 draft의 "D-031 봉인 예정"은 본 봉인으로 인해 **D-032로 sliding** (사전 분해 문서 갱신 동행) | 외부 designer (Q-4 거절) + orchestrator (봉인 집행) |
| 2026-06-01 | D-030 W17 Work Order Designer Full Sign-off + 회신 결정 5건 봉인 — 외부 Lead Designer가 8개 컴포넌트 + lesson 통합 코드를 직접 교차검증 후 **Full Sign-off** 부여 (보고서와 실제 코드 불일치 0건). 결정 사항: (1) **A-1 carry-forward 결정**: QuizOption 카드 본체 translateX shake 360ms는 DESIGN_DIRECTION §9.2 "scale-금지" 조항과 무관 — §9.2의 의도(흐름 차단 금지)는 카드가 커졌다 작아지는 scale을 금지한 것이고, translateX는 점유 면적 불변이라 다음 CTA 미가림. D-022 + Work Order로 의도적 갱신됨. (2) **A-2 사전 승인 fallback**: iPhone SE 320pt에서 MorphingKoreanWord tier-1-5 한글이 <44px이면 scale 0.875→0.90 + translateY -16→-14 상향 (재승인 불요, MorphingKoreanWord.tsx 헤더에 명시). Work Order §3.5 "base 72/scale 0.78"은 불필요 — 그건 렌더 선명도 이슈. (3) **A-3 변경 불필요**: StageReveal stagger 누적은 240ms × index가 아닌 (delayIndex × 60) + 240 = 420ms로 계산. user-perceived advance 1s 우려는 계산 착오. 60ms 유지. (4) **B-1 Shimmer 결정 확정**: D-024 translateX gradient sweep 유지 (사용자 옵션 A 정합). 디자이너 평가 "더 프리미엄". Work Order §6 cosine pulse 미채택 확정. (5) **B-2 PulseOverlay M4 보존**: ChoiceCard 폐기 후 사용처 0이지만 M4 D-6 churn 회피. @deprecated 헤더만 추가 + M5 cleanup 사이클에 일괄 제거 (ChoiceCard + PulseOverlay + MOTION_TOKENS legacy alias). 신규 backlog: **L-M5-001 오답 시 정답 미하이라이트** (PRD §4 인출 루프 정합성 영향, learning + designer 공동 검토, DECISION 등록 대상) — `docs/backlog/M5_LEARNING_QUALITY.md` 신규. P1 진행 승인 + **ADR-0009 react-native-reanimated 도입 결정** 사전 draft 작성 (P1 dispatch 전 architect/designer/frontend 회람 → M5 W18 entry 시 Accepted) | 외부 designer (Sign-off) + orchestrator (집행 봉인) |
