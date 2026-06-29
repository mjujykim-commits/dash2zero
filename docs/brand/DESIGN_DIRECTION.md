# dash2zero — Design Direction

> 작성: designer agent (M1, 2026-05-08)
> 협업 입력: planner (PRD §4 학습 루프), pm (USER_JOURNEYS), architect (Domain Model § 5층 매핑), frontend (구현 가능성 검토)
> 상위 SSOT: 사업계획서 §6.3, PRD.md, 10_design_system.md v0.3, 11_ux_writing_guide.md v0.3
> Skill 사용 (강제): theme-factory · frontend-design · canvas-design · brand-guidelines

---

## 1. 한 줄 디자인 정의

> **차분한 학습 도구. 게임이 아니라 도구. 한글이 주인공, UI는 무대.**

dash2zero는 Duolingo 같은 게임화 강조도, Anki 같은 기능 폭발도 아니다. **사용자가 한글 단어를 또렷이 보고, 발음을 또렷이 듣고, 다시 꺼내는 행위에 집중하게 만드는 도구**다.

---

## 2. 첫 인상 — 3분 안에 사용자가 느껴야 하는 것

| 순간 | 사용자 인지 | 시각 표현 |
|---|---|---|
| 앱 아이콘 본 순간 (스토어/홈) | "한국어 학습 앱 같다" | 한글 글자(예: 가/0) 또는 미니멀한 dash2zero 로고 — 게임/엔터테인먼트 톤 회피 |
| 스플래시 / 첫 화면 | "광고/팝업이 없네" | 단일 색 배경 + 짧은 한글 문장 1줄 |
| Age gate (CC2-14) | "13세 미만은 안 된다는 게 명확하다" | neutral 톤, 게임화 없음 |
| Privacy choices (CC2-18) | "내가 통제할 수 있구나" | toggle UI, default OFF 명시, 글자만으로 결정 가능 |
| Onboarding | "한국어 학습 동기를 묻는다" | 4 카테고리(K-pop / K-drama / 여행 / 기타) — 시각적 부담 최소 |
| Home (Today's words) | "오늘 할 게 명확하다, 부담 없다" | "Today: 3 new + 7 reviews" 한 줄 + 한 개의 큰 CTA |
| 첫 단어 카드 (Notice) | "와, 한글이 진짜 크다. 외국어처럼 안 무섭다" | text.word 44px Noto Sans KR Bold, 카드 가운데 |

### 2.1 회피하는 첫 인상 (의도적 거리두기)

| 회피 | 이유 |
|---|---|
| 게임 캐릭터 / 마스코트 | dash2zero는 게임이 아닌 도구 |
| 화려한 그라디언트 / 네온 | 학습 집중 방해 |
| 푸시 알림 강요 / 가입 강요 | first-run에서 가입 강제 안 함 (게스트 모드) |
| 별 / 트로피 / 레벨업 폭죽 | streak는 보여주지만 "능동 인출 정답"에 묶여야 (CC2-16 결정) |
| 배너 광고 / 인앱 프로모션 | MVP에서는 결제 외 광고 없음 |

---

## 3. 신뢰감의 종류 (Trust Type)

사용자 지시 §12 "분석형 / 창작형 / 운영형 / 자동화형 / 개인형 / 엔터프라이즈형 톤" 중 dash2zero는 **개인형 도구 (Personal Tool)** + **운영형 신뢰 (Operational Trust)** 의 혼합.

### 3.1 개인형 도구 (Primary)

- 매일 짧게 쓰는 도구 — Notion / Bear / Things 와 같은 개인 생산성 톤
- 시각적 dependable: 매일 같은 자리에 같은 컴포넌트
- "내 도구"라는 소유감 — Settings에서 토글 가능한 항목 다수

### 3.2 운영형 신뢰 (Secondary)

- 결제 / 환불 / 계정 삭제 / Privacy 같은 까다로운 영역에서 **명확함과 정중함**
- 마케팅 톤이 아닌 **명세서 톤**: "Your subscription will renew on Jun 8"
- Owner 모바일 알림 (CC3-02) 같은 운영 측면도 사용자에게 신뢰감 줌

### 3.3 회피하는 톤

- **엔터프라이즈형** — B2B SaaS dashboard 톤. dash2zero는 개인용
- **창작형** — Dribbble/Figma 같은 창작 도구 톤. 학습은 입력 중심
- **분석형** — 데이터 dashboard 톤. 학습 진도는 단순 표시

---

## 4. 정보 밀도와 인터랙션 패턴

### 4.1 정보 밀도 — "한 화면에 한 가지" 원칙

CC2-25 결정 그대로:

- 단일 컬럼 (SE 320pt 폭 기준)
- 하단 고정 CTA (한 번에 하나의 다음 액션)
- 한글 단어가 시각 위계 최상위
- romanization은 펼치기 / 보조 영역
- 영어 의미는 카드 하위 영역

### 4.2 인터랙션 패턴

| 영역 | 패턴 | 사유 |
|---|---|---|
| Word card | tap → 다음 단계 | 4단계(Notice→Hear→Meaning→Retrieve) 진행 |
| Audio button | tap → 재생 (수동 기본 — CC3-04) | 무음 모드 / 헤드폰 미연결 fallback 안전 |
| Quiz (Retrieve) | tap → 4 옵션 중 1 선택 → 즉시 피드백 | 객관식 4지선다 (CC2-11 distractor 정량 룰) |
| Streak / Mastered | static 표시 | 폭죽 / 모달 / 사운드 없음 — 학습 흐름 방해 회피 |
| Paywall | tap → IAP 시트 | 모달 풀스크린 + Restore 버튼 + 가족공유 미지원 사전 고지 |
| Settings | flat list (계정 / 구독 / 알림 / 언어 / 삭제) | 깊은 탐색 없음 |

### 4.3 클릭 카운트 (3분 약속 검증)

J-001 첫 학습:

```
Welcome → Age gate (1 tap) → Privacy choices (2-4 tap) → Onboarding (1-2 tap) → Home → Lesson Start (1 tap)
→ [Word 1: Notice → Hear → Meaning → Retrieve] (4 tap) × 3 단어 = 12 tap
→ Lesson Complete (1 tap) → Home

총 ~22 tap, 3분 안에 완료 가능 (단어당 ~12초 + 화면 전환)
```

---

## 5. 한글 / RR / 영어 시각 위계 (CC2-25 핵심)

### 5.1 위계 원칙

```
   ┌─────────────────────────────┐
   │                             │
   │       사과                   │  ← Tier 1: 한글 (text.word 44px Bold)
   │                             │
   │       sa-gwa                │  ← Tier 2: RR (text.romanization 16px Regular muted)
   │                             │
   │       apple                 │  ← Tier 2: 영어 의미 (text.gloss 18px Regular)
   │                             │
   │       사과 주세요.           │  ← Tier 3: 예문 (text.example 16px, 펼치기)
   │       Apple, please.        │
   │                             │
   │  [▶ Listen]                 │  ← Audio (44×44 터치 타깃, 수동 재생)
   │                             │
   ├─────────────────────────────┤
   │  [Continue]                 │  ← CTA (하단 고정, 56px 높이)
   └─────────────────────────────┘
```

### 5.2 단계별 노출 차이

| 단계 | 노출 항목 |
|---|---|
| Notice | 한글만 (다른 텍스트 hidden) |
| Hear | 한글 + audio 버튼 강조 (한 번 자동 재생 가능) |
| Meaning | 한글 + RR + 영어 의미 + 예문 (펼침) |
| Retrieve | 한글 또는 영어 prompt + 4 옵션 (객관식) |

### 5.3 RR 표기 규칙 (CC2-25 + LD-DOC-003 결정 입력)

- RR (Revised Romanization) 표준 (M1 보강 또는 M2-S2 결정)
- "발음 변화 vs 표기" 룰은 v0.3 03_learning_methodology에 위임
- 사용자가 Settings에서 RR 표시 ON/OFF 토글 가능 (default ON)

---

## 6. 톤 키워드 (D-022 봉인 2026-05-18 — K-pop Bold)

> **2026-05-18 갱신**: 사용자 명시 결정 "디자인이 stunning 하지 않다" 반영 → 기존 Quiet/Steady 폐기, K-pop Bold 채택. Honest 톤만 유지.

브랜드 보이스의 5가지 키워드.

1. **Bold** — 한글이 hero element. 임팩트 있는 typography (Noto Sans KR Black 88px). 색채 vivid
2. **Neon** — 그라데이션 multi-stop (purple → pink → orange) + glow + glass morphism
3. **Honest** — 결제 / 한도 / Privacy를 숨기지 않는다 (Apple §3.1.2(a) 정합, Quiet 일부 유지)
4. **Confident** — "Master Korean faster." / "Down to zero friction." — 자신 있는 영문 카피
5. **Focused** — 학습 카드는 vivid이되 한글 가독성 우선 (lesson 화면은 dark + 한글 hero)

### 6.1 시각 언어 (D-022)

- **그라데이션**: 그라데이션 사용 적극. multi-stop hero (purple → pink → orange), CTA (cyan → pink), paywall (deep indigo → violet → burgundy)
- **Neon glow**: 핵심 CTA + 한글 hero에 glow (24px / 48px 2-layer)
- **Glass morphism**: badge / disclosure / stat cards
- **한글 hero typography**: 88px black, gradient text, line-height 0.95
- **Motion**: ease-out 200-300ms, fade + translateY(-2px on hover). reduce motion 시 fade only

### 6.2 톤 적용 예시 (D-022)

| 화면 | 키워드 | 카피 + 시각 예 |
|---|---|---|
| Welcome | Bold + Confident | 한글 "안녕하세요" 88px gradient + "Down to zero friction." + neon CTA |
| Lesson Complete | Bold | 120px glow check + "3 words nailed." gradient text |
| 무료 한도 / Paywall | Honest + Bold | "Master Korean faster." 42px display + "No free trial. No surprises." disclosure (강요 없음) |
| Streak 유지 | Bold | "🔥 5 day streak" 라임 글로우 badge |
| Streak 끊김 | Honest | "Streak reset to 0." (Bold 없이 단순 표시 유지) |

### 6.3 유지 (Quiet 철학 부분 보존)

- **Honest disclosure** (paywall) — "Limited offer" 같은 유도 문구 회피
- **학습 카드 가독성** (lesson Notice/Meaning/Retrieve 화면) — 한글이 hero지만 visual noise는 학습 집중 방해 안 함
- **dark mode 일관** — bright 화면 회피, lesson 화면 어두운 배경 유지

### 6.4 폐기 (Quiet 철학 일부 폐기, D-022 봉인)

- ❌ "폭죽/큰 일러스트/감정 카피/이모지 금지" → ⚡ 🔥 💡 💫 적극 사용
- ❌ "그라데이션 최소화" → multi-stop 그라데이션 적극 사용
- ❌ "skeleton만, spinner 금지" → 핵심 transition (lesson chain / paywall subscribe) animation 추가
- ❌ "Steady — 깜짝 변화 없음" → motion ease-out + scale + glow 적용

---

## 7. 인스피레이션 / 거리두기 (Reference)

### 7.1 영감 받는 곳 (with reference)

| 제품 | 무엇을 배우는가 |
|---|---|
| Things (Cultured Code) | 단순함, 한 화면에 한 작업, 미니멀 카드 |
| Bear notes | 타이포그래피 중심, 색 절제, 글이 주인공 |
| Anki (mobile) | 학습 카드의 본질 — 단어/뜻/예문이 핵심, 장식 최소 |
| iA Writer | 폰트와 간격으로 신뢰 — 도구가 사라지고 콘텐츠만 남음 |

### 7.2 거리두기 (회피)

| 제품 | 무엇을 피하는가 |
|---|---|
| Duolingo | 폭죽 / 캐릭터 / 게임화 / 푸시 강요 |
| Memrise | 영상 클립 중심 / 시각 정보 과다 |
| Drops | 일러스트 비중 큼 — dash2zero는 텍스트 중심 |
| LingoDeer | 강의 콘텐츠 중심 — dash2zero는 단어 인출 중심 |

---

## 8. 핵심 화면 인상

### 8.1 Home

```
┌─────────────────────────────┐
│                             │
│   Today                     │  small caption
│   3 new · 7 reviews         │  large numbers, single line
│                             │
│   ─────                     │
│                             │
│   Streak  5 days            │  understated
│   Mastered  12              │
│                             │
│                             │
│  [Start →]                  │  bottom CTA, only one
│                             │
└─────────────────────────────┘
```

- 풀스크린 모달, 메뉴 / 탭 / 알림 점 없음 (clean)
- "Start" 외 다른 CTA 없음
- 04:00 리셋 직후라면 fresh count

### 8.2 Lesson Start → Word Card → Lesson Complete

```
[Lesson Start]
┌────────────────┐
│ Word 1 of 3    │
│                │
│   사과          │  Notice
│                │
│  [Tap to hear] │
└────────────────┘

[Quiz / Retrieve]
┌────────────────┐
│ apple = ?      │
│                │
│ ○ 사과          │
│ ○ 바나나        │
│ ○ 물            │
│ ○ 커피          │
│                │
│ [Submit]       │
└────────────────┘

[Lesson Complete]
┌────────────────┐
│                │
│   ✓ Done.      │
│                │
│   3 of 3       │
│   Streak 6     │
│                │
│ [Home]         │
└────────────────┘
```

### 8.3 Paywall

```
┌─────────────────────────────┐
│                             │
│   Premium                   │
│                             │
│   $4.99 / month             │
│   $49.99 / year (save 16%)  │
│                             │
│   What you get:             │
│   • 15 new words / day      │
│   • Unlimited reviews       │
│   • Premium pack 300        │
│   • Monthly 50 new words    │
│                             │
│   No free trial.            │
│   No family sharing.        │
│                             │
│  [Subscribe]                │
│  [Restore Purchases]        │
│                             │
└─────────────────────────────┘
```

---

## 9. 모션 철학

### 9.1 원칙

- **150ms 이하** — 사용자가 "기다리는 느낌" 없게
- **Easing**: ease-out (자연스러운 정착)
- **Hero motion 없음** — 학습 흐름 깰만한 화면 전환 회피
- **Bounce / spring 없음** — 도구 톤 유지

### 9.2 사용 케이스

| 상황 | 모션 |
|---|---|
| 화면 전환 | fade 100ms 또는 push 200ms |
| 카드 단계 진행 (Notice → Hear) | reveal 80ms (밑에서 위로 페이드) |
| 정답 / 오답 피드백 | 색만 변경 (모션 없음) |
| Audio 재생 중 | 미니멀 progress bar |
| Streak 갱신 | 숫자만 변경 (애니메이션 없음) |

---

## 10. 접근성 / 다국어 / 디바이스

### 10.1 접근성 (WCAG 2.1 AA)

- 색 대비 4.5:1 이상 (본문) / 3:1 이상 (large text)
- 모든 button / link / toggle에 accessibilityLabel
- VoiceOver / TalkBack: 한글 부분 lang="ko", 영문 lang="en"
- Dynamic Type 지원 (200% 확대 시 단어 카드 가로 스크롤 또는 줄바꿈)
- 색약: 정답/오답 표시는 색 + 아이콘 둘 다 (이중 인코딩)

### 10.2 다국어

- MVP: en-US 단일 (UI 언어, CC-18)
- 한글 콘텐츠는 단어/예문 영역만
- ICU MessageFormat 적용 (단복수: "1 day" vs "2 days")
- 통화: $4.99 (US, D-018 봉인) → 약 £3.99 (UK), CAD/AUD/NZD 자동 표시 (Apple Tier 5 / Google 국가별 자동 환산)

### 10.3 디바이스

- 최소: iPhone SE 1세대 (320pt 폭) — CC2-16
- 최대: iPad (M2까지 폰 only, 태블릿은 post-MVP)
- 노치 / 홈바: Safe Area 자동 처리
- 가로 모드: 미지원 (M2까지 세로 only)
- 다크 모드: M2까지 light only, 다크 토큰 미리 정의 (THEME_DECISIONS §1.2)

---

## 11. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-08 | M1-13 v1.0 — 첫 인상 / 신뢰감 / 정보 밀도 / 시각 위계 / 톤 5 키워드 / 인스피레이션 / 핵심 화면 / 모션 / 접근성 정의 | designer |
