# Changelog

dash2zero의 외부 가시 변경 (앱 사용자, 베타 테스터, 외부 인수 팀에게 영향이 있는 변경)을 추적한다.

> 형식: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 준수
> 갱신 책임: orchestrator (각 마일스톤 종료 시 일괄, changelog-generator skill로 보강 가능)
> 의도: 본 파일은 **외부 가시 변경만** 기록. 내부 운영 (CI 워크플로 / 테스트 fixture / SSOT 갱신 등)은 SWARM_LEDGER + 각 agent context 기록 참조

---

## [Unreleased] — M3 W15~W16 (2026-05-11 ~ 2026-05-25)

> **상태**: 진행 중 (M3 게이트 검증 sprint)
> **GA 일자**: 2026-06-15 월 또는 2026-06-22 일 (사용자 R-M5-01 응답 결과에 따라 분기)

### Added (외부 가시)

- **결제 흐름 (M2 완료, W15 Cycle A 정합 검증)**: RevenueCat + Apple/Google IAP 연동, Restore 지원, 가족공유 비활성화 (legal docs/13 §5.1 4-variant paywall lock 봉인)
- **무료 한도 (M2)**: starter pack 3 신규 단어/일 + 30 복습/일 (RLS daily_limit 정책 활성)
- **다국어 지원 (M3 W15)**: SRS state는 locale 변경에 영향 받지 않음 (SRS-045 i18n golden 검증)
- **접근성 (M3 W15 신설)**: VoiceOver/TalkBack stage 변화 announce, Dynamic Type 200% (AX5) 카드 fit, 색약 대응 (icon + 텍스트 ascending color) — SRS-048/049/050 a11y golden

### Changed (외부 가시)

- **lesson chain UX (W15)**: STUB 단일 카드 → 실 N-카드 chain (기본 3, 최대 10). "Card N of M" 텍스트 표시 (R-28 closed candidacy)
- **paywall sign-in 흐름 (W15)**: 게스트 paywall 진입 시 sign-in 요구를 별도 단계로 분리 (`paywall_signin_required` 이벤트 emit) — funnel 정확도 향상
- **Premium 가격 정합성 (D-018, 2026-05-13)**: 사업계획서 v0.1 가설 $1.99/mo · $14.99/yr → **$4.99/mo · $49.99/yr** 변경. 사용자 명시 결정 "싸구려 인식 회피" + qa StoreKit Configuration placeholder 정합. 경쟁사 (Memrise $8.49, LingoDeer $14.99) 대비 진입가 positioning
- **Paywall UI 가격 fallback 정합 (2026-05-13, 사용자 mockup 검토 발견 사항)**: `apps/mobile/app/paywall.tsx` + `src/lib/purchases.ts` 코드 9 lines fallback 가격 갱신 ($1.99/$14.99 → $4.99/$49.99), Annual Save badge `37%` → `16%`. D-018 봉인 후 잔존 코드 정합 완료. 운영 setup(`docs/runbooks/BOOTSTRAP_INFRA.md` RC Products 등록) + 봉인 SSOT 5건(PRD §1, USER_JOURNEYS J-003, ASSUMPTIONS A-002/A-403, DESIGN_DIRECTION mockup + 통화, THEME_DECISIONS Screenshot 5) 동시 갱신
- **콘텐츠 본격 확장 — D-019 봉인 (2026-05-13)**: 사용자 명시 "MVP 수준 초과 → 실제 제품수준" 결정 반영. Starter Pack 60 (free, 기존) + **Core Pack 180** (premium, K-pop 60 + K-drama 60 + Travel 60 — onboarding 4 카테고리 정합) + **Premium Pack 1 — 100단어 초안** (paywall "300+ words" promise의 1/3) = **누적 340단어 작성**. 다음 사이클에 premium pack +200 추가하여 540단어 도달 예정. CONTENT_QUALITY_POLICY (8 quality gate + 검수 워크플로 6단계 + 외부 검수자 모집 정책) 봉인
- **Premium Pack 1 batch 2 완료 (2026-05-14)**: w-pr-101 ~ w-pr-300 (+200단어) — 색깔·형태 10 + 양·정도 10 + 방향·위치 10 + 빈도 부사 8 + 접속사 10 + 의류·소품 12 + 신체·동작 10 + 시제·결과 10 + 사람·관계 확장 12 + 표현 강화 8 + 자연·풍경 10 + 동물 8 + 사물·일반 10 + 동작 동사 확장 12 + 음식 확장 10 + 비즈니스·계약 10 + 상태 형용사 10 + 정도·강조 8 + 일상 행위 12 + 학습·교육 10 = 200단어. **누적 540단어** 도달, paywall "Premium pack — 300+ words" promise 충족 + 여유 240. R-D019-1 해소 (w-pr-081 운동 → 체력, 영구 키 정책 정합)
- **콘텐츠 상호 검증 (D-020 봉인 + 1차 cross-review, 2026-05-14)**: 사용자 명시 "또 다른 QA 인력 고용 + 상호검증" 결정 반영. qa agent에 콘텐츠 검수 책임 정식 추가 (`AGENTS.md §4` content-research-writer skill 활성) + `CONTENT_QUALITY_POLICY.md §2` 검수 워크플로 6→7단계 확장 (Step 2.5 qa cross-review 신설). **540단어 1차 cross-review에서 P0 12건 + P1 6건 발견·즉시 해소** — G-07 자기참조 distractor 1건 (w-pr-212 고양이→토끼) + CC2-15 영구 키 충돌 11건 (연습/눈/영수증/청소/공항/추천/감사합니다/좋아요/주문/화장실/사진) + G-04 gloss long-form 3건 + re-entry marker 3건. 자동 재검증 0 violations 확인. R-01 mitigation medium→medium (외부 검수자 모집 실패 시 qa 100% fallback)
- **Monthly Pack 첫 release 사전 작성 (2026-05-14, paywall "Monthly 50 new words" promise 충족)**: `fixtures/seeded/words/monthly-pack-2026-06.yaml` (신규 50단어) — 봄·초여름 시즌 10 + 가정의 달(어린이날/어버이날/스승의 날) 8 + 한국 명절(설날/추석/떡국/송편/한복/세배/차례) 8 + SNS·디지털(인스타/유튜브/틱톡/카톡/이모티콘/팔로워/인플루언서/챌린지) 10 + 일상 응용 + 슬랭(가성비/핫플/진심/멋지다 등) 14. CEFR B1-B2 / TOPIK II 초반. release_at: 2026-06-15 (GA W20). **누적 콘텐츠 540 → 590 단어**. 영구 키 충돌 0 + G-07 자기참조 0 자동 검증
- **R-01 외부 검수자 모집 자산 3채널 사전 작성 (2026-05-14)**: `context/rollups/20260514-R-01-reviewer-recruitment-assets.md` — Reddit r/Korean 영문 모집글 + Upwork 채용 공고 + 지인 채널 EN/KR 메시지 템플릿 + sample 10단어 review 양식 + PM 송출 일정 권고 + 비용 추정 ($200-810 USD 또는 ₩240,000-810,000) + D-020 dual-track 활용 권고. 사용자가 직접 게시 시점 대기
- **D-022 K-pop Bold 디자인 방향 채택 (2026-05-18, 사용자 명시 결정)**: 사용자 명시 "디자인이 전혀 stunning 하지 않은 것 같아요" → Quiet/Steady 철학 폐기, **K-pop Bold** 채택. 그라데이션 multi-stop (purple→pink→orange) + neon accent (cyan/pink/lime) + 한글 hero typography (Noto Sans KR Black 88px) + glass morphism. **13 화면 v2-stunning HTML mockup** (`docs/screens/v2-stunning/01~13.html`) 작성 — Welcome / Age Gate / Privacy Choices / Onboarding / Home / Lesson Notice/Meaning/Retrieve/Complete / Paywall / Sign-in / Settings / Report. 사용자 검수 "와우!! stunning합니다! 완전 대 만족!" 승인. **Production tokens 갱신** — `packages/design-tokens/src/colors.ts` (dark-first + 6 neon + 6 gradient + 7 glow) + `typography.ts` (hero scales: text.hero.ko 88, text.word 64→hero, text.display 36, text.hero.success 120). **DESIGN_DIRECTION.md §6 톤 키워드** Quiet/Honest/Spacious/Steady/Respectful → **Bold/Neon/Honest/Confident/Focused** (Honest 유지: Apple §3.1.2(a) disclosure 정합). **THEME_DECISIONS.md §1/2/5/7** 전면 갱신 (Color + Gradient + Glow + Hero Typography + Glass Card + Motion 강화 + reduce motion fallback). frontend .tsx 13 화면 적용은 차기 사이클
- **D-023 ~ D-027 W16 Premium Motion v1.1 + v1.2 완성 (2026-05-21~22, 외부 Lead Designer Sign-off)**: Motion System Spec v1.0(웹 기준) → **v1.1(React Native + Expo 호환)** 디자이너 직접 재작성 (Q-MOTION 5 decisions: scale+opacity 그림자 모사 / expo-linear-gradient shimmer / Expo Router slide_from_right / expo-haptics Success·Warning·Light / Reduce Motion 150ms fade). **MOTION_TOKENS** `packages/design-tokens/src/motion.ts` 봉인 (EASE_BOUNCE/DECELERATE/EXIT + DURATION_QUICK/NORMAL/SLOW + SHAKE/PULSE/SHIMMER/PRESSED 상수). **13 화면 motion 100% 적용** — primary CTA(NeonButton — Haptic Light + scale 0.96 EASE_BOUNCE) + page transition(slide_from_right) + 보조 인터랙티브 (onboarding 4 chip + privacy-choices 2 switch + sign-in 2 btn + settings row 다수 + reminder chip 4 + report 5 chip + lesson ChoiceCard + paywall PlanCard + lesson Complete Share). **신규 컴포넌트 5건**: ChoiceCard(scale+shake+haptic+PulseOverlay) + Shimmer(loop translateX 1.6s) + PulseOverlay(scale 0→2.2 + opacity 0.4→0 450ms) + JellySwitch(thumb translateX + jellyScale 4-seg sequence) + BottomSheet(translateY 24→0 + scale 0.96→1 + opacity 0→1 300ms EASE_DECELERATE). **Global Haptic Feedback toggle** (Apple HIG 정합) — `apps/mobile/src/lib/haptics.ts` wrapper + SecureStore `profile_haptic_enabled` + Settings "SOUND & HAPTICS" 섹션 신규. **4-rule Merge Gate** (GPU/Lifecycle/Timing/Skeleton) 전 컴포넌트 cross-validate PASS. **외부 Lead Designer Sign-off** 수신 (DESIGN_REVIEW_W16_MOTION.md "APPROVED with High Honors") + **Hybrid Delegation Policy** 거버넌스 봉인 (`AGENTS.md §8.4`, D-026): orchestrator 직접 작성 권장 영역 vs sub-agent spawn 강제 영역 분리
- **D-028 motion token 확장 + Work Order P0-0/P0-3/P0-4/P0-5 (2026-05-27)**: 외부 Lead Designer swarm-handoff/01-WORK-ORDER.md drop-in 적용. `packages/design-tokens/src/motion.ts`에 **duration 9키** (tap 80 / fast 150 / base 200 / stage 240 / spring 320 / sheet 360 / slow 300 / progress 600 / count 900) + **easing 5종** (out / in / inOut / spring / shake) + **rnEasing** (RN Easing.bezier 매핑) 신규 export. AudioButton 전용 token (AUDIO_RING_DURATION 1400 / AUDIO_SPINNER_DURATION 900 / AUDIO_PULSE_HALF 700) 추가. 기존 MOTION_TOKENS 동기 alias 보존 (D-023~D-027 봉인 컴포넌트 8건 import 호환). **NeonButton Ripple sub-component + glow brighten interpolate**, **useDelayedLoading(150ms) hook + home/lesson 적용**, **AudioButton 신규 컴포넌트** (playing ring expansion + shadow pulse + loading conic spinner + reduce-motion 정적 border) — Work Order §1 5조 (토큰 강제 · native driver · reduce-motion default · 정답/오답 모션 정합) 모두 PASS. `packages/design-tokens/test/motion.spec.ts` 신규 (Work Order §2.3 정합)
- **D-029 Work Order P0-1 + P0-2 완성 — Work Order P0 5건 100% 마감 (2026-06-01)**: (1) **StageReveal + MorphingKoreanWord 신규 컴포넌트 2건** — lesson Notice→Hear→Meaning→Retrieve 4단계 시그니처 모션. StageReveal(opacity + translateY 8→0 + 60ms stagger × delayIndex, motion.stage 240ms), MorphingKoreanWord(한글 hero를 단계별 scale 1↔0.875 + translateY 0↔-16로 morph). lesson [wordId].tsx 통합: 한글 hero(Notice/Hear=hero, Meaning/Retrieve=tier-1-5) + RR/gloss/example_ko/example_en 4개 stagger + Quiz 4 옵션 stagger. (2) **QuizOption 신규 + ChoiceCard 폐기** (사용자 옵션 A, "ChoiceCard 광기 → QuizOption 완전 교체") — 카드 본체 모션 없음 (DESIGN_DIRECTION §9.2 정합), ✓/✕ icon spring scale 0.4→1.0 (140ms 지연 + motion.spring 320ms), 오답 시 카드 ±6px 5-segment shake 360ms, reduce-motion blink fallback. D-024 haptic Light/Success/Warning 통합. (3) **Sprint risk R-M4-04 등록** (Work Order §11 (2) 의무): lesson stage 전환 latency 모니터링 책임. 4-rule Merge Gate 4건 모두 PASS
- **D-030~D-036 M5 W18+W19 P1 완성 — Reanimated 도입 + 신규 컴포넌트 5건 + dark-pattern 거리두기 + 인출 학습 정합 (2026-06-02~05)**: (1) **D-030 W17 Designer Full Sign-off** (보고서 vs 코드 불일치 0건). (2) **D-031 Lesson abandon confirm 거절 봉인** — DESIGN_DIRECTION §2.1 + §7.2 dark-pattern 영구 거리두기. ConfirmSheet 활용처 Delete account 단일화. (3) **D-032 인출 학습 정합 (L-M5-001)** — QuizOption State 4→5 (`correct-passive` 신규). 오답 선택 시 정답 카드 자동 노출 (glow만, haptic 없음). Karpicke & Roediger 2008 / Pyc & Rawson 2009 / Hattie & Timperley 2007 정합. (4) **D-033 react-native-reanimated 도입 Accepted** (ADR-0009). babel.config.js plugin 마지막 위치 + package.json v3.10. 기존 D-022~D-029 봉인 8 컴포넌트는 Animated legacy 영구 유지. (5) **D-034 P1.2 Toast 시스템** — Reanimated 첫 사용처. ToastProvider + useToast hook + 3-tier 우선순위 (error/user-action/system) + max 3 stack + persistent 분기 (action 있는 error는 auto-dismiss 금지). _layout.tsx mount + Settings/Privacy 5 사용처 통합 (sync/restore/reminder/analytics/crash). 차단성 결제 에러는 Alert 유지 (Designer Q-3 가드). (6) **D-035 P1.5 ConfirmSheet (Delete account 단일화)** — BottomSheet wrapper, destructive Pressable danger solid (정직/명세 톤), Settings handleDeleteAccount Alert→ConfirmSheet 교체. (7) **D-036 P1.4 PullToRefresh** — Reanimated useAnimatedScrollHandler worklet + runOnJS + Reduce Motion 보강. M6 droppable (Designer Q-2 정합), 60fps Profiler 첨부 sign-off 조건, 사용처 통합 별도. (8) **추가 P1.1 NumberCounter** (Animated) — Lesson Complete의 "{N} words nailed." 0→N 카운트업 (motion.count 900ms). (9) **추가 P1.3 StreakBadge** (Animated) — Home streak ≥ 1일 mount + pop entry + 무한 flame flicker. streak 증가 감지 logic (사이클 KK W18 한계 해소). (10) **Motion legacy cleanup** — ChoiceCard + PulseOverlay 파일 삭제 (사용처 0). (11) **신규 ADR-0009 Accepted + WORKLET_GUIDE C1~C8 정합** — Toast + PTR 모두 PASS. (12) **외부 Lead Designer 협업**: P1 Work Order 수신 → W18+W19 sign-off 요청 발송 → 회신 대기. 4-rule Merge Gate 전 컴포넌트 cross-validate + Rule 5 (Reanimated worklet 전용) 신규 강제

### Deprecated

- **`word_mastered` / `word_weakened` 이벤트 (M3 W16 제거 예정)**: `srs_mastered_reached` / `srs_mastered_lost` / `srs_weak_flagged` 3종으로 교체. v0.3에서는 alias 발화 후 M3 W16 제거 (analytics taxonomy §3.4)

### Removed

- (M3 종료 시점 추가 예정)

### Fixed

- (M3 종료 시점 추가 예정)

### Security

- **audit_log alert (W15 stub 모드 + Cycle B dev 검증)**: 보안 위반 시 trigger → security_alerts 테이블 INSERT + Slack stub. 실 webhook URL은 M5 W19 활성화 (D-011 봉인)

---

## [M2 완료] — 2026-05-08 (Thin Vertical Slice)

### Added

- **앱 골격**: React Native + Expo + TypeScript, Expo Router
- **인증**: Apple Sign In + Google Sign In + Email magic link (비밀번호 제외, C-03)
- **데이터 백엔드**: Supabase (Postgres / Auth / Storage / Edge Functions / RLS, C-02)
- **결제**: RevenueCat + Apple/Google IAP, 무료 체험 없음 (C-09)
- **SRS 시스템**: 자체 Leitner 5단계, 1/3/7/14/30일 (C-08)
- **분석**: Firebase Analytics + Crashlytics, IDFA 미사용 (C-12)
- **TTS**: Google Cloud Neural2 한국어 (ADR-0005)
- **출시 국가**: US/CA/UK/AU/NZ (EU 미출시, C-10)
- **일일 리셋**: 사용자 로컬 04:00 (C-17)
- **UI 언어**: en-US 단일 (공식본, C-18)

### Changed

- (M2 진입 시 v0.3 봉인 기획서를 swarm coding 산출물로 인계)

---

## [M1 완료] — 2026-05-07 ~ 2026-05-08 (Product+Architecture+Stack)

### Added (산출물)

- PRD (`docs/product/PRD.md`)
- USER_JOURNEYS (`docs/product/USER_JOURNEYS.md`)
- MVP_SCOPE + Non-Goals (`docs/product/MVP_SCOPE.md`)
- DOMAIN_MODEL (`docs/architecture/DOMAIN_MODEL.md`)
- STACK_OPTIONS_MATRIX + DECISION + EVOLUTION_PLAN (3개 후보 평가 → 후보 A Lean 채택, ADR-0001)
- DESIGN_DIRECTION + THEME_DECISIONS (`docs/brand/`)
- 본 CHANGELOG가 빠져있던 시점

### Decided (ADR)

- **ADR-0001 Accepted**: Stack Decision — 후보 A (Lean / Managed / Serverless-first)
- **ADR-0002 Accepted**: Domain Model 경계면 추상화 (5+4)
- **ADR-0003 Accepted**: Custom runner + Firebase (Langfuse 보류)
- **ADR-0004 Accepted**: RLS 정책 매트릭스 (13 테이블 × 5 역할 × 4 CRUD)
- **ADR-0005 Accepted**: TTS Google Cloud Neural2 (Clova 대비 86.3% vs 82.9%)

---

## [M0 완료] — 2026-05-07 (Bootstrap)

### Added

- 프로젝트 디렉토리 구조
- 13명 agent 페르소나 (Core 9 + Specialist 4)
- AGENTS.md (헌장 v1.0)
- .codex/config.toml (Codex/Agent 설정)
- 핵심 추적 문서 6종: PROJECT_MAP / DECISION_LOG / HANDOFF / SKILLS_INVENTORY / SWARM_LEDGER / ASSUMPTIONS
- Skill 저장소 11개 승인 (3 repos / low risk all)
- M0 rollup

---

## 사전 양식 (M3 W15 Cycle B 직후 사전 작성)

> **M4 ~ GA 외부 가시 변경 예고** — 실 출시 후 본 섹션을 [Unreleased]로 이동

### M4 W17~W18 (2026-05-26 ~ 2026-06-08) 예고

#### Added (예정)

- E2E suite Phase 0 (Maestro 메인 + Detox 결제+a11y, P0 첫 3건)
- RLS hybrid 실측 검증 (pg_test_role + EXISTS / status enum / period_ends_at)
- DSR 모듈 (account_deletion soft_deleted_at 보존 + cancel 명시적 API)
- Privacy Manifest evaluator (iOS submission 차단 해소)

#### Decided (예정)

- ADR-0007 Accepted (Baseline 저장소 3-source) — W16 직전 작성 가능
- ADR-0008 Accepted (Secret 회전 정책) — M4 W17 작성

### M5 W19~W20 (2026-06-09 ~ 2026-06-22) 예고

#### Added (예정 — 외부 사용자 가시)

- **베타 사용자 모집**: 30명 (Reddit + Discord + 지인) — R-M5-01 §3 응답 결과 반영
- **약관 / 개인정보처리방침 정식본** (effective date 2026-06-09)
- **Slack alert live mode** (실 webhook URL 활성, stub → live)
- **C-13 사업자 등록 + 통신판매업 + RC payout** 활성
- **GA 출시**: Apple App Store + Google Play Store production track

---

## 갱신 정책

본 파일은 다음 시점에 갱신:

1. **매 마일스톤 종료** (M3 / M4 / M5 / GA): 해당 마일스톤 동안 발생한 외부 가시 변경 인벤토리
2. **이벤트 taxonomy 변경**: Deprecated 표기 + alias 발화 기간 + 제거 시점 명시
3. **결제 / 환불 정책 변경**: legal docs/13 + apps/mobile paywall variant lock 갱신 시
4. **데이터 처리 정책 변경**: privacy_policy material change (legal docs/16 §16 분기 기준)
5. **외부 API 호환성 변경**: backend API breaking change 발생 시 (v0.x 단계 minor bump)

내부 변경(CI 워크플로 / 테스트 fixture / SSOT 갱신 / risk register)은 본 파일 대상 아님 — SWARM_LEDGER + 각 agent context 참조.

---

## 변경 이력 (본 파일)

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-12 | CHANGELOG 신규 작성 — M0/M1/M2 완료 시점 외부 가시 변경 retroactive 인벤토리 + M3 [Unreleased] 표기 + M4~GA 예고 사전 양식 | orchestrator |
