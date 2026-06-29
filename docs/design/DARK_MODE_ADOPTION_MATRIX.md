# Dark Mode Adoption Matrix

> 문서 상태: v1.0 (M3 W15)
> 작성: designer (senior UX/UI), 2026-05-11 23:00
> 상위: `docs/10_design_system.md` §3, `docs/brand/THEME_DECISIONS.md` §1.2
> 토큰: `packages/design-tokens/src/colors.ts` (`darkColors` export 확인 완료 line 32)

---

## 0. 요약

- **현재**: 13 화면 중 0건이 다크 적용. 모든 화면 `lightColors` 하드코드.
- **packages/design-tokens**: `darkColors` 정의 + `getColor(token, scheme)` helper 모두 export 활성화 상태 (index.ts `export * from "./colors"`).
- **누락**: `useColorScheme()` 어댑터 (RN), 화면별 `colors = scheme === 'dark' ? darkColors : lightColors` 패턴.
- **결정 (designer 자율)**: M4 W17 진입 직전(W16 말)에 **paywall / settings / onboarding** 우선 적용. lesson은 학습 가독성 영향 큰 화면이므로 M4 W18 이후 별도 회귀.

---

## 1. 13 화면 × Light/Dark 적용 매트릭스

| # | 화면 | 파일 | Light | Dark | 우선순위 | 비고 |
|---|---|---|---|---|---|---|
| 1 | _layout | `app/_layout.tsx` | OK | NONE | P0 | scheme provider/context 진입점 |
| 2 | index (boot) | `app/index.tsx` | OK | NONE | P2 | redirect만, 시각 영향 적음 |
| 3 | age-gate | `app/age-gate.tsx` | OK | NONE | P1 | 신규 사용자 첫 접점 |
| 4 | privacy-choices | `app/privacy-choices.tsx` | OK | NONE | P1 | 동의 화면, 다크 시인성 중요 |
| 5 | onboarding | `app/onboarding.tsx` | OK | NONE | **P0** | 첫인상 — designer 우선 권고 |
| 6 | home | `app/home.tsx` | OK | NONE | P1 | 한글 단어 노출 거의 없음, 다크 적합 |
| 7 | lesson/[wordId] | `app/lesson/[wordId].tsx` | OK | NONE | P2 | 한글 가독성 회귀 위험, 별도 시간 필요 |
| 8 | lesson/complete | `app/lesson/complete.tsx` | OK | NONE | P2 | mastered 시각 큰 ✓ 회귀 위험 |
| 9 | paywall | `app/paywall.tsx` | OK | NONE | **P0** | 야간 결제 빈도 높음 (가설) |
| 10 | auth/sign-in | `app/auth/sign-in.tsx` | OK | NONE | P1 | OAuth provider 버튼 다크 디자인 가이드 필요 |
| 11 | auth/callback | `app/auth/callback.tsx` | OK | NONE | P2 | 짧은 로딩만 |
| 12 | settings | `app/settings.tsx` | OK | NONE | **P0** | OS scheme 추종 옵션 자체가 여기 위치 |
| 13 | report/[wordId] | `app/report/[wordId].tsx` | OK | NONE | P1 | 단어 신고, 텍스트 폼 위주 |

---

## 2. W17 M4 진입 전 적용 우선순위 (designer 자율 결정)

### 2.1 P0 — W16 말까지 적용 (3개)

1. **settings** — OS scheme 추종 토글이 위치할 화면. 자기 자신이 다크를 지원하지 않으면 토글 무의미.
2. **onboarding** — 신규 사용자 첫 인상. 야간 OS dark 사용자가 light flash를 경험하면 즉시 이탈 가능 (가설).
3. **paywall** — 결제 의사결정 시점. 야간 사용자 (PM 9시~AM 1시 가설) 비율 높음. 다크 적합하면 trust 상승 가능.

### 2.2 P1 — M4 W17~W18 (5개)

home, age-gate, privacy-choices, sign-in, report/[wordId].

### 2.3 P2 — M4 W19 이후 또는 M5 (5개)

lesson/[wordId], lesson/complete, _layout 내 deep, index, auth/callback.

**lesson 화면을 P2로 둔 사유**:
- 한글 word card는 `korean.glyph` 토큰 (light #0F172A → dark #F4F4F2). dark에서 contrast 14:1+ 유지되나 **글자 굵기 광학 인지** 차이로 가독성 회귀 위험.
- 다크 적용 후 별도 사용자 테스트 (n=5 영어권 학습자) 필요.
- M3-M4 baseline 측정 기간 중 변경 시 lesson_complete_rate 측정 노이즈 야기. baseline 종료(W18-W19) 후 적용.

---

## 3. 시스템 추종 규칙 (designer 결정)

### 3.1 MVP (M4 진입 시점)
- **default**: OS color scheme 추종 (`useColorScheme()`).
- **사용자 override**: settings 화면에 `Appearance: Auto / Light / Dark` 3-option list. 기본 Auto.
- **persistence**: AsyncStorage `app.appearance` ('auto'|'light'|'dark').
- **즉시 반영**: 변경 시 reload 없이 적용 (React Context provider).

### 3.2 RN useColorScheme 어댑터 (frontend 협업 권고 시그니처)

```ts
// packages/design-tokens 내가 아닌 apps/mobile/src/theme/ThemeProvider.tsx 권고
import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from '@dash2zero/design-tokens';

export function useColors() {
  const sys = useColorScheme(); // 'light' | 'dark' | null
  const userPref = useUserAppearance(); // 'auto' | 'light' | 'dark'
  const scheme = userPref === 'auto' ? (sys ?? 'light') : userPref;
  return { colors: scheme === 'dark' ? darkColors : lightColors, scheme };
}
```

화면 내 사용:

```ts
const { colors } = useColors();
<View style={{ backgroundColor: colors['surface.bg'] }} />
```

이 결정은 frontend agent에 위임 (구현 시그니처는 권고). designer는 토큰 키 일관성만 보증.

---

## 4. 다크 적용 시 시각 회귀 체크리스트 (각 화면)

- [ ] `surface.bg` / `surface.card` 분리가 다크에서도 인지되는가 (#0A0A0B vs #18181B 대비 차)
- [ ] `border.subtle` (#27272A) 가 dark surface 위에서 보이는가 — 안 보이면 분리 시각 단서 (간격/elevation)로 보강
- [ ] `brand.primary` (#60A5FA) 위 `text.inverse` (#18181B) — primary 버튼 텍스트 대비 검증 필요 (light에선 white/blue, dark에선 black/lightblue)
- [ ] semantic 색 (success/danger) 다크 보정 후 색약 사용자 시뮬레이션 통과
- [ ] shadow → `dark.s1` / `dark.s2` 사용 (light shadow는 dark에서 무효)
- [ ] 한글 word `korean.glyph` 다크 (#F4F4F2) — bold 700 인지 가독성

---

## 5. 토큰 export 활성화 확인

`packages/design-tokens/src/index.ts`:

```ts
export * from "./colors"; // line 10 - darkColors 자동 포함
```

`packages/design-tokens/src/colors.ts`:

```ts
export const darkColors = { ... } as const; // line 32 - export 활성화 확인됨
export function getColor(token: ColorToken, scheme: ColorScheme = "light"): string // line 55
```

**결론**: darkColors export는 이미 활성화. 별도 코드 변경 불요. 본 문서로 적용 결정만 명시.

---

## 6. 변경 이력

| 일자 | 버전 | 변경 |
|---|---|---|
| 2026-05-11 | v1.0 | 초안 (designer agent, M3 W15) |
