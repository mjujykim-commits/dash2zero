# M3 W15 Designer Readiness — 자가 진단 (12항목)

- **Agent**: designer (senior UX/UI)
- **Date**: 2026-05-11 22:00
- **Cycle**: M3 W15 진입 직전 (W14 evaluators+CI 완료)
- **Direct work in W15**: 매우 적음 (없음에 가까움). 본 문서는 baseline metrics 신뢰도 보증과 M4 진입 준비 점검 목적.

참조: `context/rollups/20260511-M3-W14-evaluators-and-ci.md` §9, `docs/10_design_system.md`, `docs/brand/THEME_DECISIONS.md`, `packages/design-tokens/src/`, `apps/mobile/app/`.

---

## 1. 자가 진단 12항목

| # | 항목 | 상태 | 메모 |
|---|---|---|---|
| 1 | 디자인 토큰 SSOT 동기화 (THEME_DECISIONS ↔ packages/design-tokens) | OK | colors/typography/spacing/components/motion 5 모듈 모두 export. `TOKENS_VERSION 0.2.0-m2s2` 확인. |
| 2 | 다크 토큰 정의 → 화면 적용 | GAP | `darkColors` 패키지엔 있으나 `apps/mobile/app/**/*.tsx`에 `useColorScheme`/`darkColors` import 0건 — 모든 화면이 `lightColors` 하드코드. 측정엔 무관(MVP), M4 전 문서화 필요. |
| 3 | baseline 측정 노출 화면 디자인 안정성 (home / paywall / lesson / lesson/complete) | OK with caveats | 4 화면 모두 한 번 이상 검토됨. 잠재 측정 왜곡 요소는 §2 참조. |
| 4 | RR(romanization) 줄바꿈 UX-NEW-001 후속 | PARTIAL | THEME_DECISIONS §4 "32 글자 ellipsis" 결정은 있으나 `lesson/[wordId].tsx`에 `numberOfLines`/`ellipsizeMode` 미구현. starter pack 단어 모두 짧아 즉시 회귀는 없지만 W15 frontend가 실제 fetch로 교체할 때 대응 필요. |
| 5 | 한글 폰트 적용 검증 | UNCONFIRMED | `text.word` family는 토큰 정의되어 있으나 EAS Build에 Noto Sans KR 서브셋 실제 번들 여부는 frontend에 확인 필요. system fallback이면 광학 매칭(1:0.92) 깨짐. |
| 6 | 광학 매칭 (한글 ↔ 영문 사이즈) | OK | text.word 44 / text.gloss 18 / text.romanization 14 — 시각 위계 명확. lesson/complete의 "✓ 64px"는 토큰 미사용 hardcode (낮은 위험). |
| 7 | SE 320pt overflow | OK with caveats | lesson 화면이 ScrollView로 감싸져 있어 SE에서 카드가 밀려 스크롤 발생 가능 → 측정값 lesson_complete_rate에는 영향 없으나 "한 화면" 원칙(CC2-25) 위반 잠재. |
| 8 | Audio 버튼 상태(idle/loading/playing/error) | GAP | components.audio.button.states 토큰엔 4 state 정의, 실제 lesson/[wordId].tsx에는 ▶ 단일 표시. M3에서 audio 미구현이라 측정엔 무관. |
| 9 | Quiz 정답/오답 시각 피드백 | OK | submitted 시 borderColor만 변경 (모션 없음, DESIGN_DIRECTION §9 준수). 색만으로 구분하지 않음 원칙에 대비 미흡 — 색 + 아이콘/텍스트 권장 (10_design_system §7.4). |
| 10 | Privacy choices / Age gate 기본 컴포넌트 | OK | privacy-choices.tsx, age-gate.tsx 분리 화면 존재. 토큰 컴포넌트화는 미완(직접 구현체). |
| 11 | Paywall view→purchase 측정 신뢰도 | RISK | §2.1 참조. plan 토글, sign-in 강제 redirect, restore 동선이 view 이벤트와 purchase 사이에 latency를 만들 수 있음. |
| 12 | Mastered/Weak event emit이 UI에 미치는 영향 (W15 frontend) | LOW | lesson 종료 시 logEvent 추가는 화면 변경 없음. lesson/complete의 mastered 카운트 업데이트만 데이터 변경. UI 변경 없음 확인. |

---

## 2. baseline metrics 측정 신뢰도 위협 후보 (Top 3)

### 2.1 paywall_view_to_purchase 저하 — sign-in 강제 redirect (HIGH)
- `apps/mobile/app/paywall.tsx:31-39` — guest 사용자가 Subscribe 누르면 `/auth/sign-in?return_to=/paywall`로 redirect, **purchase 호출 전**에 funnel break.
- `paywall_viewed`은 mount에서 emit (line 27), 그 후 sign-in으로 이탈하면 `view→purchase` 비율이 비정상적으로 낮게 측정됨.
- **권장 (측정 단계)**: analytics가 `paywall_signin_required` 중간 이벤트를 emit해 funnel 단계 분리. 디자인 변경은 없음.

### 2.2 lesson_complete_rate 측정 — STUB 데이터로 인한 인공 100% (HIGH)
- `lesson/[wordId].tsx`이 STUB_WORD 1개 단어로만 동작. 실제 세션은 보통 3~10 단어 카드 chain인데 측정 환경에서 1 카드만 통과하면 complete_rate = 100%.
- W15 frontend의 deep link / Mastered emit 작업이 실제 fetch 교체와 동반되지 않으면 baseline이 무의미해짐.
- **권장**: analytics + frontend가 baseline 14d 시작 전, lesson chain이 실제 N>1 단어로 동작하는지 확인. 그렇지 않으면 baseline을 `lesson_card_complete_rate`로 재정의.

### 2.3 home Start 버튼 disabled 상태 misclick → bounce 측정 왜곡 (MED)
- `home.tsx:104-115` total=0이면 disabled, 색만 변경 (border.subtle). disabled 시 "All caught up" 텍스트 + 동일 56px 높이 → 사용자가 tap 시도 → 무반응 → 이탈로 측정될 수 있음.
- 04:00 reset 직후 신규 가입자는 total>0이지만, 같은 날 두 번째 방문 사용자는 total=0 빈도 높음.
- **권장**: disabled 상태에서도 secondary action(예: "Open Settings" / "View Mastered") 노출. 단, M4 이후 변경.

---

## 3. M4 전 디자인 시스템 문서화 갭 (Top 3)

### 3.1 다크 모드 적용 화면 매트릭스 부재 (P1)
- `darkColors` 토큰은 packages에 있으나 어떤 화면에 언제 적용할지 결정 없음. 모든 13 화면이 `lightColors` 하드코드.
- M4 진입 전 `docs/10_design_system.md §3`에 "MVP는 light 강제, post-MVP에서 system color scheme 추종" 같은 결정 명시 필요. `useColorScheme()` 어댑터 누락도 명시.

### 3.2 RR 줄바꿈/ellipsis 정책의 구현 가이드 부재 (P1)
- UX-NEW-001 결정 ("32자 ellipsis")만 있고 `numberOfLines={1} ellipsizeMode="tail"` 같은 RN 매핑 가이드 없음.
- `text.romanization` 토큰에 `maxChars: 32` 또는 컴포넌트 wrapper 권장사항 추가 필요.

### 3.3 빈 상태 / 로딩 / 에러 / 오프라인 상태 디자인 누락 (P0)
- 10_design_system §8 레이아웃 표에 상태별 디자인 부재. paywall offering=null일 때 가격 fallback 문자열만 ($1.99/month) 노출, 에러 상태 시각 패턴 없음. lesson audio loading/error 시각 없음.
- M4 게이트 (Security+QA) 진입 전 5 상태 (empty/loading/error/offline/success) × 4 핵심 화면 = 20 상태 디자인 토큰화 필요.

---

## 4. M3 W15 즉시 수정 권고 (UX 결함 카테고리)

| 카테고리 | 위치 | 권장 |
|---|---|---|
| 광학 매칭 | lesson/complete.tsx:38-45 ✓ 64px hardcode | 토큰 `text.heading.xl` 신설 또는 icon 사용. **W15 미진행** (측정 무관). |
| 카드 fit | lesson/[wordId].tsx ScrollView | SE 320pt 실측 후 한 화면 fit 검증 — frontend가 deep link 작업 시 동반 점검 요청. |
| 대비 | quiz disabled state | submitted=true 후 비선택 옵션의 대비 검증 (text.muted on surface.card 3.6:1, large text only). 정답을 disabled 색만으로 구분하지 않음 원칙 위반 가능. **W15 점검만, 수정은 M4**. |
| 색만으로 구분 | quiz correct/incorrect (lesson/[wordId].tsx:170-176) | check/x 아이콘 추가 권장 (10_design_system §9). 색약 사용자 차단. **W15 점검만**. |

---

## 5. 차단 / 의존성

- **차단 없음** — W15에 designer 직접 산출물 없음.
- **의존**: frontend가 W15에 deep link / Mastered emit 작업 시, lesson 화면 props 시그니처 변경되면 designer review 필요. 사전 스캔 결과 UI 변경 없는 것으로 판단됨 (logEvent + router.push만 추가 예상).
- **monitor**: analytics가 baseline 14d 시작 시 §2 3개 funnel 위험을 사전 인지하도록 orchestrator 통보 필요.

---

## 6. W15 designer 작업 큐

| 작업 | 우선순위 | 예상 사이클 |
|---|---|---|
| 본 readiness 문서 commit | P0 | 즉시 (본 commit) |
| §3 디자인 시스템 갭 3건을 `docs/REVIEW_QA.md` 디자이너 섹션에 질문으로 등록 | P1 | W15 내 |
| §2 측정 위험 3건을 analytics agent에 사전 통보 (HANDOFF) | P1 | W15 baseline 시작 전 |
| 다크 모드 적용 결정 ADR 초안 (M4 입력) | P2 | W16 또는 M4 W17 |
| 5상태 × 4화면 = 20 상태 디자인 토큰화 | P0 (M4) | M4 W17-W18 |

---

## 7. Skill 사용 (점검 사이클이라 가벼움)

- **frontend-design**: SE 320pt fit 점검 (mental walk-through)
- **theme-factory**: 다크 토큰 ↔ 화면 적용 갭 식별
- **brand-guidelines**: dash2zero "Quiet/Honest" 톤이 paywall disclosures 박스에 잘 유지됨 확인

## 8. 서명

- designer (senior UX/UI), 2026-05-11 22:00
- 다음 designer 사이클 트리거: M4 진입 (W17) 또는 RR 줄바꿈 회귀 발견 시
