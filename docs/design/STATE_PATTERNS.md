# State Patterns — 5 States × 4 Core Screens

> 문서 상태: v1.0 (M3 W15)
> 작성: designer (senior UX/UI), 2026-05-11 23:00
> 톤: **Steady** (Honest, no fireworks, no big illustrations)
> 토큰: `packages/design-tokens/src/states.ts` (`stateTokens`, `stateLayout`)

---

## 0. 핵심 원칙 (Steady 톤)

| 금지 | 권장 |
|---|---|
| 폭죽/축하 모션 (M3 W14 quiz feedback에서 이미 색만 변경 결정) | 색 + 아이콘 + 1줄 텍스트 |
| 큰 일러스트 (200×200+ SVG/이미지) | 24~32px 단일 stroke 아이콘 |
| 감정 강한 카피 ("Oops!", "Great!", "Yay!") | 사실 진술 ("Couldn't load this lesson") |
| 느낌표 / 이모지 | 마침표로 끝나는 평서문 |
| spinner + skeleton 동시 사용 | skeleton만 |
| modal/alert로 error 표시 | inline 또는 fullscreen state |

dash2zero "Quiet/Honest" 브랜드 일관 — `docs/brand/THEME_DECISIONS.md` §0.

---

## 1. 5 상태 정의

| 상태 | 의미 | 트리거 |
|---|---|---|
| **idle** | 정상 (기본) | 데이터 fetch 성공, 사용자 입력 대기 |
| **empty** | 정상 + 표시할 데이터 없음 | total=0, chain N=0, mastered 0개 등 |
| **loading** | 데이터 fetch 진행 중 | mount 직후, refetch, retry |
| **error** | 데이터 fetch 실패 (서버/클라이언트 오류) | 네트워크 OK + 5xx, 4xx 또는 클라이언트 예외 |
| **offline** | 네트워크 disconnect | NetInfo isConnected=false |

**구분 원칙**:
- empty ≠ error: empty는 정상 결과. 사용자 책임 없음. 색은 muted/neutral.
- offline ≠ error: offline은 환경 상태. 사용자가 복원 시 자동 재시도.

---

## 2. 4 핵심 화면 × 5 상태 매트릭스

| 화면 | idle | empty | loading | error | offline |
|---|---|---|---|---|---|
| **home** | Today + Streak + CTA | "All caught up" + secondary CTA | skeleton 2 row | "Couldn't load today" + retry | "No connection" + auto retry |
| **lesson** | 카드 4 stage | "Nothing to learn right now" + Back | 카드 skeleton 3 line | "Couldn't load this lesson" + retry | "Audio unavailable offline" + skip CTA |
| **paywall** | plan list + Subscribe | "Pricing not available" + retry | plan card skeleton 2 | "Purchase failed" + retry | "No connection" |
| **settings** | account list | (해당 없음) | list skeleton 4 | inline banner "Couldn't load account" + Retry | inline banner "Some options need internet" |

토큰 값은 `packages/design-tokens/src/states.ts` 참조.

---

## 3. Layout 사양

### 3.1 Fullscreen state (empty / error / offline)

```
+----------------------------------+
|                                  |
|                                  |
|                                  |
|             [icon]               | <- 24-32px, single stroke, muted/warning/danger
|                                  |
|         Headline (22)            | <- text.heading.md, primary
|                                  |
|       Body line 1 (16)           | <- text.body, secondary
|       Body line 2 if needed      |
|                                  |
|       [ Action ] (56h)           | <- secondary 또는 primary, 1개만
|                                  |
+----------------------------------+
```

수치 (`stateLayout.fullscreen`):
- horizontal padding: `space.5` (20)
- icon → headline: `space.4` (16)
- headline → body: `space.2` (8)
- body → CTA: `space.6` (24)
- align: center, vertical center
- maxBodyWidth: 280pt (SE 320pt 안에서 양 옆 여백)

### 3.2 Loading (skeleton)

- spinner **금지** (skeleton 만으로 진행 인지)
- pulse 애니메이션: opacity 0.5 → 1.0, 1200ms ease-in-out, infinite
- background: `surface.muted` 토큰 (light/dark 자동 전환)
- radius: 8
- 화면별 skeleton 형태는 토큰 `stateTokens[screen].loading.skeleton` 참조

예 (lesson):

```
+----------------------------------+
|        ____________ (44h)        |   <- word 자리
|        ______ (14h)              |   <- RR 자리
|                                  |
|     [____________] (56h)         |   <- button 자리
+----------------------------------+
```

### 3.3 Inline Banner (settings)

- 상단 SafeArea 바로 아래 1줄 banner
- height: 44pt (24 icon + 12 text + 8 padding)
- bg: `surface.muted`, radius 8
- icon (24, warning/muted) + text + 우측 끝에 ghost button "Retry"
- error/offline은 fullscreen 전환하지 않음 (사용자가 다른 settings 항목은 계속 사용 가능)

---

## 4. 마이크로카피 (Steady 톤)

### 4.1 Headline 가이드

| 상태 | 가이드 |
|---|---|
| empty | 사실 + 차분함 ("Nothing to learn right now") |
| error | 책임 분명 + 차분함 ("Couldn't load this lesson" — 시스템 책임) |
| offline | 환경 진술 ("No connection") |

### 4.2 Body 가이드

- 1~2줄, 16/24
- 사용자가 다음에 할 수 있는 일 또는 기다리면 되는 시간 안내
- 기술 용어 회피 ("network error", "5xx", "timeout" 금지)
- 한국어 i18n 시 "~요"체 (정중)

### 4.3 CTA 라벨

| 의미 | 영문 | 한글 |
|---|---|---|
| 재시도 | `Try again` | `다시 시도` |
| 홈 복귀 | `Back to Home` | `홈으로` |
| 보조 액션 | `View Mastered` | `암기한 단어 보기` |
| 무시 | `Continue without audio` | `오디오 없이 계속` |

원칙: 동사 우선, 1~3 단어, 마침표 없음.

### 4.4 금지 카피 예

| 금지 | 대체 |
|---|---|
| `Oops! Something went wrong.` | `Couldn't load this lesson.` |
| `Yay! You did it!` | (그냥 결과 표시. 별도 카피 없음) |
| `Network error: ENETUNREACH` | `No connection.` |
| `Loading... please wait...` | (skeleton만) |

---

## 5. 색상 가이드

| 상태 | icon 색 토큰 | 의도 |
|---|---|---|
| empty | `text.muted` | 중립, 정보성 |
| loading | (icon 없음) | skeleton bg `surface.muted` |
| error | `semantic.warning` (#F59E0B) | 주의, 시스템 책임 |
| error (purchase 등 사용자 영향 큰 경우) | `semantic.danger` (#DC2626) | 결제 실패 등 |
| offline | `text.muted` | 환경 진술, 비난 회피 |

원칙: 색만으로 구분 금지. 항상 icon + text + 색 3중.

---

## 6. 다크 모드 정합

- 모든 토큰은 light/dark 양쪽 정의됨 (`packages/design-tokens/src/colors.ts`).
- skeleton bg `surface.muted`: light #F4F4F2 / dark #27272A — 둘 다 `surface.bg` 대비 인지 가능.
- semantic.warning: light #F59E0B / dark #FBBF24 — dark 보정 적용됨.
- 본 문서의 디자인은 다크 적용 결정 (DARK_MODE_ADOPTION_MATRIX) 후 자동으로 다크 호환.

---

## 7. 접근성

- icon은 항상 `accessibilityLabel` 부여 (예: "warning icon")
- skeleton은 `accessibilityRole="progressbar"` + `accessibilityLabel="Loading"`
- screen reader는 fullscreen state 진입 시 headline 자동 읽기 (`accessibilityLiveRegion="polite"` Android, `accessibilityViewIsModal` iOS)
- 동적 글자 크기 120%까지 fullscreen state CTA 여전히 56pt 표시

---

## 8. 구현 체크리스트 (frontend handoff)

각 4 화면 × 5 상태 = **17건** (settings.empty 제외) 모두:
- [ ] `stateTokens[screen][kind]` 토큰 import
- [ ] icon 컴포넌트 (lucide-react-native 권장)
- [ ] 한글/영문 i18n 키 placeholder
- [ ] 다크 적용 후 시각 회귀 (DARK_MODE_ADOPTION_MATRIX §4 체크리스트)
- [ ] reduce motion 시 skeleton pulse 정지 (opacity 1.0 고정)

---

## 9. 변경 이력

| 일자 | 버전 | 변경 |
|---|---|---|
| 2026-05-11 | v1.0 | 초안 (designer agent, M3 W15) |
