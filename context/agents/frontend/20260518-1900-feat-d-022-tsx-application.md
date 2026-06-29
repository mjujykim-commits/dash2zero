# Frontend agent context — D-022 13 .tsx 화면 적용 (2026-05-18)

> **수신**: frontend agent (다음 활성 사이클)
> **발신**: orchestrator
> **유형**: feat (D-022 K-pop Bold 13 화면 .tsx 적용)
> **선행 조건**: D-022 봉인 완료 (사용자 명시 승인 "완전 대 만족"), production tokens 갱신 완료

---

## 1. 작업 목표

`docs/screens/v2-stunning/` 13 HTML mockup의 시각 톤을 `apps/mobile/app/*.tsx` 13 화면에 동일 token으로 적용. 1 사이클 (~1~2시간) 예상.

---

## 2. 입력 산출물

### 2.1 Source of truth (이미 갱신됨)
- `packages/design-tokens/src/colors.ts` — lightColors / darkColors / gradients / glows export
- `packages/design-tokens/src/typography.ts` — hero scales export
- `docs/brand/THEME_DECISIONS.md` §1~7 — token spec
- `docs/screens/v2-stunning/assets/tokens-kpop-bold.css` — CSS variable 1:1 매핑 (참조용)

### 2.2 시각 reference
- `docs/screens/v2-stunning/01~13.html` — 각 화면 mockup
- `docs/screens/v2-stunning/index.html` — 13 화면 트리 + flow

---

## 3. 의존성 추가 (P0 — 작업 시작 전)

native 환경에서 D-022를 구현하려면 다음 라이브러리 추가:

```bash
pnpm --filter @dash2zero/mobile add expo-linear-gradient expo-blur
pnpm --filter @dash2zero/mobile add react-native-svg
```

| 라이브러리 | 용도 | 화면 |
|---|---|---|
| `expo-linear-gradient` | gradient.hero / gradient.cta / gradient.paywall 배경 | 모든 화면 |
| `expo-blur` | glass morphism backdrop-filter | 02/03/05/07/11/13 |
| `react-native-svg` (또는 `react-native-masked-view`) | gradient text-clip | 01/09/10 |

기존 의존성 (expo-router, expo, react-native)과 호환 — Expo SDK 51 정합 확인.

---

## 4. 13 화면 적용 체크리스트

각 화면별로 (1) container background gradient, (2) hero text gradient/glow, (3) CTA gradient button, (4) glass card 적용:

### P0 화면 (사용자 first impression)
- [ ] `apps/mobile/app/welcome.tsx` — gradient.dark bg + glow-orb decoration (cyan/pink) + text.hero.ko 88px "안녕하세요" gradient.hero text-clip + btn-primary gradient.cta + glow.pink
- [ ] `apps/mobile/app/paywall.tsx` — gradient.paywall bg (deep indigo→violet→burgundy) + text.display "Master Korean faster." gradient.hero text-clip + $49.99 60px gradient.hero text-clip + SAVE 16% floating badge gradient.cta + glow.pink CTA
- [ ] `apps/mobile/app/(tabs)/index.tsx` (home) — gradient.dark bg + gradient.card "Your session" card + glass card stats (3 columns) + lime streak badge + glow.lime

### P1 화면 (학습 흐름)
- [ ] `apps/mobile/app/lesson/[id].tsx` (또는 stages별 컴포넌트) — surface.bg + text.word 64px (gradient.hero text-clip on Welcome→Notice transition, solid white on Meaning/Retrieve) + audio button 56×56 gradient.cta + glow.cyan + progress bar gradient.cta
- [ ] `apps/mobile/app/lesson/complete.tsx` — text.hero.success 120px gradient.success + glow.success + text.display "3 words nailed." gradient.hero text-clip
- [ ] `apps/mobile/app/(auth)/onboarding.tsx` — 4 category card (border gradient.hero on selected) + glass card

### P2 화면 (auth + settings + report)
- [ ] `apps/mobile/app/(auth)/sign-in.tsx` — Apple/Google glass card buttons + magic link
- [ ] `apps/mobile/app/(auth)/age-gate.tsx` — glass-morphism date input + step indicator
- [ ] `apps/mobile/app/(auth)/privacy.tsx` — neon toggle (track gradient.cta on enabled)
- [ ] `apps/mobile/app/(tabs)/settings.tsx` — flat list + text.label gradient color + Danger zone (semantic.danger border)
- [ ] `apps/mobile/app/report/[wordId].tsx` — 5 카테고리 emoji + card.selected (border neon.pink + glow.pink subtle)

---

## 5. 컴포넌트 추출 권고 (designer 제안)

13 화면에서 반복되는 패턴을 컴포넌트화하여 일관성 + 유지보수성 확보:

```typescript
// apps/mobile/src/components/d022/
- <GradientText>      // gradient text-clip — react-native-svg 또는 masked-view 기반
- <GlassCard>         // backdrop-blur + glass.surface bg + glass.border
- <NeonButton>        // expo-linear-gradient bg + shadow (iOS) / elevation (Android) + scale press
- <GlowOrb>           // 화면 decoration용 absolute-position blur circle
- <GradientBackground>// expo-linear-gradient full-screen wrapper
```

각 컴포넌트는 `<rule>` style props (gradient: keyof gradients, glow?: keyof glows) 받음.

---

## 6. accessibility 검증 (필수)

D-022는 시각 효과가 강하므로 다음 항목 추가 QA:

- [ ] `reduce motion` OS 설정 켜진 경우 모든 scale/translate animation → opacity fade only
- [ ] VoiceOver/TalkBack — gradient text도 정상 읽힘 (accessibilityLabel 명시)
- [ ] Dynamic Type 200% — text.hero.ko 88px가 화면 overflow 없이 fit (자동 축소)
- [ ] 색약 대응 — semantic.success/danger 색 변경 + glow 양쪽으로 시각 신호 이중화
- [ ] WCAG AA 검증 — 본 context §1.5 (THEME_DECISIONS.md §1.5) 표 7 조합 실 device에서 확인

---

## 7. 작업 완료 정의 (DoD)

- [ ] 13 화면 .tsx 모두 D-022 token 적용
- [ ] 4~5개 d022 컴포넌트 추출 + Storybook (옵션, 본 사이클 외)
- [ ] iOS Simulator + Android emulator screenshot 13장 캡처 후 v2-stunning HTML과 시각 일치 확인
- [ ] reduce motion 설정 ON/OFF에서 모두 자연스럽게 동작
- [ ] expo build 통과 (`./node_modules/.bin/expo prebuild` + EAS build local)
- [ ] context/rollups/20260519-d-022-frontend-application.md 작성

---

## 8. risk + 대응

| Risk | Mitigation |
|---|---|
| `react-native-svg` build 충돌 (Expo prebuild) | masked-view 라이브러리로 fallback. 또는 gradient text를 image 자산으로 (Welcome 화면만) |
| Android elevation으로 glow shadow 미달 | shadow color + offset 2~3 layer 합성, 또는 BlurView wrapping |
| `expo-blur` Android intensity 약함 | translucent surface + border + drop-shadow 조합으로 glass 효과 보강 |
| 한글 hero 88px가 SE 320pt에서 overflow | text.word.responsive 신설 (88 → 64 → 48) viewport 분기 |

---

## 9. 시작 시점

frontend agent가 본 context를 읽는 즉시 시작 가능. designer agent의 P0 컴포넌트 spec이 필요한 경우 designer/20260518-1800-feat-d-022-kpop-bold-handover.md 참조 후 합의.

orchestrator는 frontend 사이클 완료 후 rollup 검토 + 사용자 시각 확인 단계로 게이트 닫음.
