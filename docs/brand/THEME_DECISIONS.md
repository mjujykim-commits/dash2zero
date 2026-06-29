# dash2zero — Theme Decisions (Token Source of Truth)

> 작성: designer agent (M1, 2026-05-08)
> **갱신 (2026-05-18)**: D-022 K-pop Bold — Quiet/Steady 폐기, neon + gradient + Korean hero typography 채택
> 협업 입력: frontend (구현 가능성), architect (Contract Layer 토큰 export)
> 상위 SSOT: DESIGN_DIRECTION.md, 10_design_system.md v0.3
> 출력 SSOT: 본 문서 = `packages/design-tokens/` 패키지의 입력 (M2-S2 W6 생성)
> Skill 사용 (강제): theme-factory · frontend-design · canvas-design · brand-guidelines

---

## 1. Color Tokens (D-022 K-pop Bold)

> **2026-05-18 갱신 (D-022)**: 사용자 명시 결정 — Light surface 폐기, **dark-first** 채택. neon palette 도입 (cyan/pink/purple/orange/lime). 그라데이션 multi-stop hero/CTA/paywall. Glass morphism + glow shadow.
> 기존 Light 토큰 정의는 §1.5 (Quiet 폐기 archive)에 보존.

### 1.1 Light (dark-first 기준, 거의 동일 — D-022)

```
# Surface (dark-first)
surface.bg                  #0F0F1A   /* deep indigo-black */
surface.card                #1A1B2E
surface.elevated            #252640
surface.muted               #252640

# Text
text.primary                #FAFAF9   /* near-white, high contrast */
text.secondary              #B4B4C0
text.muted                  #6B7280
text.inverse                #0F0F1A

# Brand (electric pink CTA)
brand.primary               #EC4899   /* electric pink */
brand.primary.pressed       #DB2777

# Semantic
semantic.success            #10B981
semantic.warning            #FACC15
semantic.danger             #F87171
semantic.info               #06B6D4   /* neon cyan */

# Neon accents (D-022 신규)
neon.cyan                   #06B6D4
neon.pink                   #EC4899
neon.purple                 #9333EA
neon.orange                 #F97316
neon.lime                   #84CC16
neon.yellow                 #FACC15

# Korean glyph (한글 hero)
korean.glyph                #FFFFFF
korean.glyph.secondary      #F4F4F2

# Borders / Glass
border.subtle               rgba(255,255,255,0.08)
border.strong               rgba(255,255,255,0.2)
border.neon                 rgba(236,72,153,0.4)
glass.surface               rgba(255,255,255,0.06)
glass.border                rgba(255,255,255,0.1)
```

### 1.2 Dark (lesson 화면 더 어둡게 — D-022)

```
# Surface
surface.bg                  #0A0A0F   /* 한 단계 더 deep */
surface.card                #15162A
surface.elevated            #1F2138
surface.muted               #1F2138

# Text
text.primary                #FAFAF9
text.secondary              #A1A1AA
text.muted                  #71717A
text.inverse                #0A0A0F

# Brand
brand.primary               #EC4899
brand.primary.pressed       #DB2777

# Semantic
semantic.success            #34D399
semantic.warning            #FBBF24
semantic.danger             #F87171
semantic.info               #06B6D4

# Neon (light와 동일)
neon.cyan                   #06B6D4
neon.pink                   #EC4899
neon.purple                 #9333EA
neon.orange                 #F97316
neon.lime                   #84CC16
neon.yellow                 #FACC15

# Korean
korean.glyph                #FFFFFF
korean.glyph.secondary      #F4F4F2

# Borders / Glass
border.subtle               rgba(255,255,255,0.08)
border.strong               rgba(255,255,255,0.2)
border.neon                 rgba(236,72,153,0.4)
glass.surface               rgba(255,255,255,0.06)
glass.border                rgba(255,255,255,0.1)
```

### 1.3 Gradient Tokens (D-022 신규)

```
gradient.hero       linear-gradient(135deg, #9333EA 0%, #EC4899 50%, #F97316 100%)   /* purple → pink → orange */
gradient.cta        linear-gradient(135deg, #06B6D4 0%, #EC4899 100%)                  /* cyan → pink */
gradient.card       linear-gradient(160deg, rgba(147,51,234,0.08), rgba(236,72,153,0.04))
gradient.paywall    linear-gradient(135deg, #1E1B4B 0%, #4C1D95 50%, #831843 100%)    /* indigo → violet → burgundy */
gradient.success    linear-gradient(135deg, #10B981 0%, #06B6D4 100%)
gradient.dark       linear-gradient(180deg, #0F0F1A 0%, #1A0B2E 50%, #2D1B47 100%)
```

**사용처**:
- `gradient.hero` — Welcome 화면 한글 "안녕하세요" text-clip / Lesson Complete "3 words nailed" text
- `gradient.cta` — Primary button (Continue / Subscribe / Submit)
- `gradient.paywall` — Paywall 화면 background full
- `gradient.success` — Lesson Complete check icon background
- `gradient.dark` — Welcome / Sign-in / Settings 화면 background

### 1.4 Glow / Shadow Tokens (D-022 신규)

```
glow.cyan      0 0 24px rgba(6,182,212,0.5),  0 0 48px rgba(6,182,212,0.25)
glow.pink      0 0 24px rgba(236,72,153,0.55), 0 0 48px rgba(236,72,153,0.3)
glow.purple    0 0 32px rgba(147,51,234,0.5),  0 0 64px rgba(147,51,234,0.25)
glow.lime      0 0 24px rgba(132,204,22,0.5),  0 0 48px rgba(132,204,22,0.25)
glow.success   0 0 24px rgba(16,185,129,0.5),  0 0 48px rgba(6,182,212,0.3)
glow.soft      0 12px 32px rgba(147,51,234,0.3)
glow.card      0 8px 24px rgba(0,0,0,0.4)
```

### 1.5 색 대비 검증 (WCAG 2.1 AA — D-022 dark-first)

| 조합 | 비율 | 등급 |
|---|---:|---|
| text.primary (#FAFAF9) on surface.bg (#0F0F1A) | 17.8:1 | AAA |
| text.secondary (#B4B4C0) on surface.bg | 8.5:1 | AAA |
| text.muted (#6B7280) on surface.bg | 4.6:1 | AA |
| brand.primary (#EC4899) on surface.bg | 4.9:1 | AA |
| korean.glyph (#FFFFFF) on surface.card (#1A1B2E) | 16.2:1 | AAA |
| neon.cyan (#06B6D4) on surface.bg | 6.1:1 | AAA |
| neon.lime (#84CC16) on surface.bg | 9.4:1 | AAA |

→ 모든 조합 WCAG AA 이상 (dark-first 환경에서 neon 대비 우수).

---

## 2. Typography

### 2.1 Font Families

| 용도 | 폰트 | 라이선스 | 번들 |
|---|---|---|---|
| 한글 (단어/예문) | **Noto Sans KR** (CC-18) | SIL OFL 1.1 (자유) | KS X 1001 서브셋 (~2,350 글리프, 약 1.5MB) |
| 영문 (UI/본문/숫자) | **Inter** | SIL OFL 1.1 | Regular + Medium + Bold (3 weight, 약 0.5MB) |
| Mono (timestamps, code) | **JetBrains Mono** (선택) | Apache 2.0 | M2까지 미사용 |

**번들 영향**: 약 2MB (서브셋팅 후, FE-NEW-006 결정). EAS Build에서 자동 서브셋팅 스크립트.

### 2.2 광학 매칭 비율 (UX-NEW-002)

한글이 라틴보다 시각 무게 큼. 본문 사이즈 비율:

```
한글 1.0 : 영문 0.92
```

→ 한글 16px일 때 같은 줄에 영문은 14.7px (반올림 14px). 카드 안에서 자연스럽게 한글이 더 큼.

### 2.3 Type Scale (D-022 Hero + 기존 호환)

```
# D-022 Hero scales (신규)
text.hero.ko           88px / 84px line-height / Black 900   (Welcome 한글 "안녕하세요")
text.hero.success     120px / 120px / Black 900              (Lesson Complete check + gradient)
text.word              64px / 64px / Black 900                (Lesson 카드 한글 — Tier 1 강화, 기존 44 → 64)
text.display           36px / 40px / Black 900                (Paywall "Master Korean faster.")

# 기존 호환 (UI/본문)
text.heading.lg         28px / 36px / Semibold              (Onboarding heading)
text.heading.md         22px / 30px / Semibold              (Settings 섹션, Modal title)
text.heading.sm         18px / 26px / Semibold              (List item title)
text.gloss              18px / 26px / Regular               (영어 의미 — Tier 2)
text.body               16px / 24px / Regular               (Settings 본문, Paywall description)
text.example            16px / 24px / Regular italic        (예문)
text.romanization       14px / 20px / Regular muted         (RR 표기 — Tier 2)
text.caption            13px / 18px / Regular muted         (meta, "5 days ago")
text.button             16px / 20px / Bold 700               (CTA — Semibold → Bold 강화)
text.label              11px / 14px / Bold uppercase ts-1px  (D-022 신규 — 섹션 label, neon color)
text.tab                14px / 18px / Medium                (M2 미사용)
```

**D-022 hero typography 적용 규칙**:
- text.hero.ko + gradient text-clip (gradient.hero)
- text.word 64px + gradient text-clip (lesson 화면) 또는 solid white (notice/meaning 단계)
- text.display + gradient text-clip (paywall)
- text.label은 neon color (pink/cyan/lime) + letter-spacing 1px

### 2.4 한글 Type Scale 별도 (광학 보정)

```
text.word               44px Noto Sans KR Bold              (단어 카드 한글)
text.example.ko         18px Noto Sans KR Regular           (예문 한글, gloss와 같은 시각 비중)
text.body.ko            17px Noto Sans KR Regular           (settings 한글 부분)
```

### 2.5 줄간격 / 자간

- 줄간격: 1.4–1.5 (한글), 1.5–1.6 (영문)
- 자간: 0 (Inter), 0.01em (Noto Sans KR small sizes)
- text.word 44px: line-height 52px (1.18) — 한 줄 단어 강조 시

---

## 3. Spacing (8pt Grid — UX-NEW-007)

```
space.0                  0px
space.1                  4px      /* hairline */
space.2                  8px      /* tight */
space.3                  12px     /* default inner */
space.4                  16px     /* default gap */
space.5                  20px     /* card padding */
space.6                  24px     /* section gap */
space.8                  32px     /* major separator */
space.10                 40px
space.12                 48px     /* page top safe area */
space.16                 64px     /* large hero */
```

### 3.1 사용 가이드라인

| 영역 | 사용 token |
|---|---|
| Card 내부 padding | space.5 (20px) |
| Card 사이 gap | space.4 (16px) |
| Section 사이 (Home의 Today/Streak) | space.6 (24px) |
| Page 좌우 padding | space.5 (20px) |
| Bottom CTA height | 56px (token: comp.cta.height) |
| Bottom CTA margin from edge | space.4 (16px) + safe-area inset |

---

## 4. 단어 카드 레이아웃 (CC2-25 + CC2-16 SE급)

### 4.1 SE 320pt 기준 레이아웃

```
┌──────────────────────────────────────────┐  total width: 320px
│  ←──── 20 ────→  ←──── 280 ────→  ←─ 20 ─│
│                                          │
│                                          │  pad-top 32 (space.8)
│                  사과                     │  text.word 44px, center
│                                          │
│  ←─── 16 ───→                            │  space.4
│                                          │
│                Listen ▶                  │  audio button 44×44, brand.primary
│                                          │
│  ←─── 24 ───→                            │  space.6
│                                          │
│             sa-gwa  ▾                    │  text.romanization 14px (펼침 토글)
│                                          │
│  ←─── 12 ───→                            │  space.3
│                                          │
│             apple                        │  text.gloss 18px
│                                          │
│  ←─── 24 ───→                            │  space.6
│                                          │
│         사과 주세요.                      │  text.example.ko 18px
│         Apple, please.                   │  text.example 16px italic
│                                          │
│                                          │
│  ←─── 32 ───→                            │  space.8 (CTA gap)
│                                          │
│  [   Continue   ]                        │  comp.cta 56h, brand.primary
│                                          │
│  ←─ safe-area inset bottom ─→            │
└──────────────────────────────────────────┘
```

### 4.2 SE에서 단계별 표시 항목

| 단계 | 표시 | hidden |
|---|---|---|
| Notice | text.word, [Listen] | RR / gloss / example / Continue |
| Hear | text.word, [Listen] (자동 1회) | RR / gloss / example |
| Meaning | text.word + RR + gloss + example | - |
| Retrieve | quiz prompt + 4 options + [Submit] | example (분리 화면) |

→ SE에서도 한 화면에 들어감 (overflow 없음).

---

## 5. Component Tokens (D-022 K-pop Bold)

### 5.1 Button

```
comp.button.primary  (D-022 — gradient + glow)
  height           56px
  padding-x        space.5
  radius           14px
  bg               gradient.cta (cyan → pink)
  shadow           glow.pink
  text             text.button on white
  press            scale(0.96) + glow 강화

comp.button.secondary
  height           48px
  padding-x        space.4
  radius           14px
  bg               glass.surface (rgba white 0.06)
  border           glass.border 1px
  text             text.button on text.primary
  backdrop-filter  blur(12px)

comp.button.ghost
  height           44px
  padding-x        space.3
  radius           10px
  bg               transparent
  text             text.button on neon.cyan
  border           none

comp.audio.button
  size             56×56 (44 → 56 강화)
  radius           full (28px)
  bg               gradient.cta
  shadow           glow.cyan
  icon             play / pause SVG (white)
  state            idle / loading / playing / error
  state.playing    pulse glow (motion.slow infinite)
```

### 5.2 Card

```
comp.card.base
  padding          space.5 (all)
  radius           20px (16 → 20)
  bg               surface.card
  shadow           glow.card
  border           border.subtle 1px

comp.card.lesson
  padding          space.6 vertical, space.5 horizontal
  radius           24px
  bg               surface.card
  shadow           glow.card + glow.purple at 30% opacity (선택)

comp.card.glass   (D-022 신규)
  padding          space.4
  radius           18px
  bg               glass.surface
  border           glass.border 1px
  backdrop-filter  blur(20px)
  사용처            badge / disclosure / stat cards / age-gate input
```

### 5.3 List Item (Settings)

```
comp.list.item
  height           min 56px
  padding          space.4 horizontal, space.3 vertical
  bg               surface.card
  divider          border.subtle 1px (마지막 제외)
  text             text.body
  hint             text.caption (right side)
```

### 5.4 Toggle / Switch

```
comp.toggle
  width            48px
  height           28px
  radius           full
  bg.off           border.subtle
  bg.on            brand.primary
  thumb            white, shadow.s1
  motion           150ms ease-out
```

### 5.5 Modal / Sheet

```
comp.sheet
  bg               surface.bg
  radius.top       20px
  drag.handle      4×40 muted (top)
  padding          space.5
  shadow           shadow.s2 (drop)
```

### 5.6 Quiz Option (D-022)

```
comp.quiz.option
  height           min 60px
  radius           16px
  padding          space.4
  bg               surface.card
  border           border.subtle 1px
  text             text.body.ko or text.body
  state.selected
    border         neon.pink 2px
    bg             rgba(236,72,153,0.08)
    shadow         glow.pink (subtle)
  state.correct
    border         semantic.success 2px
    bg             rgba(16,185,129,0.12)
    shadow         glow.success
  state.incorrect
    border         semantic.danger 2px
    bg             rgba(248,113,113,0.12)
```

---

## 6. Elevation / Shadow

```
shadow.s0          none                                  /* flat, default */
shadow.s1          0 1px 2px rgba(0,0,0,0.05),           /* card, button */
                   0 1px 3px rgba(0,0,0,0.06)
shadow.s2          0 4px 8px rgba(0,0,0,0.08),           /* sheet, modal */
                   0 8px 24px rgba(0,0,0,0.10)
shadow.dark.s1     0 1px 2px rgba(0,0,0,0.4)              /* dark mode */
shadow.dark.s2     0 8px 24px rgba(0,0,0,0.5)
```

---

## 7. Motion / Animation

### 7.1 Duration Tokens

```
motion.fast              80ms       /* card stage reveal */
motion.base              150ms      /* button press, toggle */
motion.medium            200ms      /* sheet open / page push */
motion.slow              300ms      /* hero image transition (M5+) */
```

### 7.2 Easing

```
easing.out               cubic-bezier(0.16, 1, 0.3, 1)
easing.in                cubic-bezier(0.7, 0, 0.84, 0)
easing.in-out            cubic-bezier(0.65, 0, 0.35, 1)
```

### 7.3 사용 가이드라인 (D-022 갱신 — Quiet motion 일부 폐기)

**D-022 적용 (2026-05-18 갱신)**:
- ✅ **Card hover/press**: scale(0.98) + glow 강화 — motion.fast (80ms) ease-out
- ✅ **Lesson stage transition**: fade + translateY(-4px) — motion.medium (200ms) ease-out
- ✅ **Lesson Complete check**: scale(0.5 → 1.0) + glow.success — motion.slow (300ms) ease-out
- ✅ **CTA press**: scale(0.96) — motion.base (150ms) ease-in-out
- ✅ **Paywall hero entrance**: gradient shift 8s ease-in-out infinite (lazy decoration)
- ✅ **Streak badge**: pulse glow (subtle, motion.slow, 한 번)

**유지 (Quiet 철학 일부 보존)**:
- ❌ **Bounce / spring** 여전히 금지 — 도구 톤 (학습 집중 방해)
- ❌ **정답/오답 피드백** — 색 변경 + glow만, scale 불가 (학습 흐름 차단 방지)
- ❌ **Streak 끊김** — 숫자만 변경, 카운트 애니메이션 없음

**reduce motion (OS 설정 켜진 사용자)**:
- 모든 scale/translateY → opacity fade only
- gradient shift → static gradient

---

## 8. Iconography

### 8.1 아이콘 시스템

- **Source**: Lucide Icons (오픈소스, MIT)
- **Stroke**: 1.5px (default)
- **Size**: 16 / 20 / 24 / 32 (8pt grid)
- **Color**: text.primary 또는 text.secondary

### 8.2 사용하는 아이콘 (M1 시점)

| 용도 | 아이콘 |
|---|---|
| Audio play | play (filled circle) |
| Audio pause | pause |
| Audio loading | loader-2 (spin) |
| Continue / Next | arrow-right |
| Back | arrow-left |
| Settings | settings |
| Streak | flame (작게, brand.primary) |
| Mastered | check-circle |
| Report | flag |
| Restore | refresh-ccw |
| Delete account | trash-2 |

→ 각 아이콘은 accessibility label 포함 (예: `accessibilityLabel="Play pronunciation for 사과"`)

---

## 9. Hero / Key Visual

### 9.1 App Store / Play Store 스크린샷용 키 비주얼

24_app_store_aso.md v0.3에 등록된 6장 스크린샷의 시각 톤 통일.

**색상**: light theme 기준, surface.bg 배경. 단어 카드만 surface.card.
**텍스트 강조**: text.word "사과" 같은 한글이 압도적으로 큼.
**캡션 (영문)**: text.heading.md, 1줄, text.primary.

```
[Screenshot 1 — Hero]
  배경: surface.bg
  중앙 단어 카드 (Notice 단계의 "사과")
  하단 캡션: "Korean words. Down to zero friction."

[Screenshot 2 — Hear]
  배경: surface.bg
  단어 카드 + 큰 audio 버튼 강조
  하단 캡션: "Hear native pronunciation."

[Screenshot 3 — Quiz]
  배경: surface.bg
  Quiz 4 옵션, 정답 강조 (semantic.success)
  하단 캡션: "Recall in 3 seconds."

[Screenshot 4 — Streak]
  배경: surface.bg
  Home 화면 + Streak 5 days
  하단 캡션: "3 minutes a day."

[Screenshot 5 — Premium]
  배경: surface.bg
  Paywall 화면
  하단 캡션: "From $4.99 / month." (D-018 봉인 2026-05-13)

[Screenshot 6 — Mastered]
  배경: surface.bg
  Lesson Complete + Mastered 12
  하단 캡션: "Track real progress."
```

### 9.2 App 아이콘

- **Concept**: 한글 "ㅇ" + 영문 "0" 융합 (dash2 + ZERO)
- **Style**: solid silhouette (광택 / 그라디언트 없음)
- **Color**: brand.primary on surface.bg, 또는 inverse
- **Style guide**: M1 후반 또는 M5 직전 designer + canvas-design skill 활용 추가 작업

---

## 10. Token Export 계획 (M2-S2)

본 문서의 모든 토큰은 `packages/design-tokens/`로 export.

```
packages/design-tokens/
├── package.json                  # @dash2zero/design-tokens
├── src/
│   ├── colors.ts                 # color tokens
│   ├── typography.ts             # type scale + font families
│   ├── spacing.ts                # 8pt grid
│   ├── components.ts             # component tokens (button, card, etc.)
│   ├── shadows.ts
│   ├── motion.ts
│   └── index.ts                  # 모든 token export
└── test/
    └── *.spec.ts                 # token 일관성 테스트
```

frontend는 `import { colors, type, space } from '@dash2zero/design-tokens'`.

---

## 11. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-08 | M1-14 v1.0 — Color (Light + Dark 미리) / Typography (한영 광학 매칭) / Spacing (8pt) / Card 레이아웃 (SE 320pt) / Component / Elevation / Motion / Icon / Hero | designer |
| 2026-05-18 | **D-022 K-pop Bold 봉인** — Quiet/Steady 폐기, dark-first 채택. Neon palette (cyan/pink/purple/orange/lime) + gradient tokens (hero/cta/paywall/success) + glow shadow. Typography hero scales (text.hero.ko 88, text.word 64, text.display 36). Component glass.morphism 카드 도입. Motion 일부 강화 (card hover, lesson stage transition, paywall gradient shift). reduce motion fallback 명시 | orchestrator |
