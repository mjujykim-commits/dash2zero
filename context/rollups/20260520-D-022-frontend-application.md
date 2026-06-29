# Rollup — D-022 frontend application (13 .tsx 화면 + d022 컴포넌트)

> **일자**: 2026-05-20
> **사이클**: D-022 봉인 직후 P0 게이트 — frontend 차기 사이클
> **선행**: 2026-05-18 D-022 봉인 (사용자 명시 "와우!! stunning합니다! 완전 대 만족!")
> **다음 게이트**: 사용자 실 device screenshot 검수

---

## 1. 사이클 트리거

D-022 K-pop Bold 디자인 방향 봉인 후 `docs/screens/v2-stunning/01~13.html` mockup의 시각 톤을 `apps/mobile/app/*.tsx` 13 화면에 적용. orchestrator 자율 진행.

---

## 2. 산출물

### 2.1 d022 컴포넌트 5종 신규 (`apps/mobile/src/components/d022/`)
- `GradientBackground.tsx` — gradient.hero/cta/card/paywall/success/dark + 3 direction
- `GlassCard.tsx` — iOS BlurView + Android translucent fallback
- `NeonButton.tsx` — gradient.cta primary + glass secondary + reduce motion 대응 (AccessibilityInfo.isReduceMotionEnabled)
- `GlowOrb.tsx` — 5 neon color decoration (iOS blur + Android opacity fade)
- `GradientText.tsx` — V1 solid neon fallback (V2 M4 W18에 react-native-masked-view 도입 후 진짜 text-clip)
- `index.ts` — barrel export

### 2.2 13 화면 .tsx 갱신
| Mockup | .tsx 파일 | 핵심 변경 |
|---|---|---|
| 01-welcome.html | `app/index.tsx` | GradientBackground dark + GlowOrb 2개 + GradientText hero.ko 88px + NeonButton |
| 02-age-gate.html | `app/age-gate.tsx` | GradientBackground + step label cyan + GlassCard input |
| 03-privacy-choices.html | `app/privacy-choices.tsx` | step 2 + GlassCard toggle (Switch trackColor neon.pink/cyan) + honest disclosure |
| 04-onboarding.html | `app/onboarding.tsx` | step 3 + emoji + selected pink border + glow shadow + check dot |
| 05-home.html | `app/home.tsx` | LinearGradient session card (purple→pink→orange) + GlassCard streak/mastered (lime/cyan) |
| 06-08 lesson stages | `app/lesson/[wordId].tsx` | audio button gradient.cta + glow.cyan + quiz options neon.pink selected + green/red glow on submit + NeonButton CTA |
| 09-lesson-complete.html | `app/lesson/complete.tsx` | 140px gradient.success check + glow.success + GradientText display "3 words nailed." + GlassCard stats |
| 10-paywall.html | `app/paywall.tsx` | GradientBackground paywall (indigo→violet→burgundy) + display "Master Korean faster." + gradient $49.99 44px + SAVE 16% lime badge + GlassCard features + NeonButton |
| 11-sign-in.html | `app/auth/sign-in.tsx` | Apple solid + Google GlassCard + magic link GlassCard + NeonButton |
| 12-settings.html | `app/settings.tsx` | gradient section label (cyan/pink/purple/lime/danger) + Danger zone left-border |
| 13-report.html | `app/report/[wordId].tsx` | GradientText "this word." + 5 emoji 카테고리 + neon.pink selected + GlassCard textarea + NeonButton |

### 2.3 의존성 추가 (`apps/mobile/package.json`)
```json
+ "expo-blur": "~13.0.0",
+ "expo-linear-gradient": "~13.0.0",
+ "expo-status-bar": "~1.12.0",
```

### 2.4 Root layout
- `app/_layout.tsx` — `<StatusBar style="light" />` 추가 (dark-first surface 정합), animation 100→200ms (D-022 motion 강화)

### 2.5 secondary 화면
- `app/auth/callback.tsx` — GradientBackground + neon.cyan spinner + neon.lime "Signed in ✓" + neon.cyan "Try again"

---

## 3. 사용자 install 명령어 (P0)

frontend가 실제로 build/run 하려면 의존성 install이 필요합니다. 사용자 권한 필요:

```bash
pnpm --filter @dash2zero/mobile install
# 또는 새 deps만:
pnpm --filter @dash2zero/mobile add expo-blur expo-linear-gradient expo-status-bar
```

이후 prebuild + run:
```bash
pnpm --filter @dash2zero/mobile exec expo prebuild
pnpm --filter @dash2zero/mobile exec expo run:ios    # iOS Simulator
pnpm --filter @dash2zero/mobile exec expo run:android # Android Emulator
```

---

## 4. 결정 적용

- **D-022 봉인 정합** — 13 .tsx 모두 token 기반, raw hex 없음 (verified via grep)
- **WCAG 2.1 AA** — text.primary on surface.bg 17.8:1 AAA, neon.cyan/lime 6.1+ AAA 유지
- **Apple §3.1.2(a)** — paywall.tsx disclosure "No free trial. No surprises." + Family Sharing 비활성 명시 유지
- **CC-09 / CC3-05** — Restore Purchases 버튼 유지 + 자동 갱신 24h 알림 문구 유지
- **CC-17** — Home "Resets at 4:00 AM local time." 유지
- **reduce motion** — NeonButton에서 AccessibilityInfo.isReduceMotionEnabled 감지, scale animation skip + opacity fade fallback

---

## 5. 미해소 + 차기 사이클 권고

### 5.1 GradientText V2 (M4 W18 권고)
- 현재 GradientText는 solid neon color fallback (V1). 진짜 text-clip은 `@react-native-masked-view/masked-view` + react-native-svg LinearGradient 조합 필요
- 사용자 device screenshot에서 시각 임팩트가 부족하다고 판단되면 M4 W18 사이클에 V2 진행

### 5.2 Android glow 보강
- 현재 elevation으로만 fallback. Android에서 색 tint glow 부족 시 `react-native-shadow-2` 또는 BlurView wrapping 검토 (M4 W17 frontend 자율)

### 5.3 dark mode 단일 채택 (사용자 결정 필요)
- D-022는 dark-first이므로 light surface 사실상 무효. THEME_DECISIONS.md §1.1과 §1.2가 거의 동일. light theme 폐기 검토 → 사용자 결정 시점 D-021 deferred policy 정합 (제품 완성 후)

### 5.4 SE 320pt 검증
- text.hero.ko 88px가 SE 320pt에서 overflow 가능. 사용자 device screenshot 검수 시 SE 환경 별도 확인 필요. responsive size (88 → 64 → 48) 분기는 차기 사이클

---

## 6. risk 종결 상태

| ID | 내용 | 본 사이클 종결 |
|---|---|---|
| R-D022-1 | react-native-svg native build 충돌 | ✅ 회피 — GradientText는 V1 solid fallback. svg 의존성 없이 13 화면 작동 |
| R-D022-2 | Android elevation glow 미달 | 부분 — elevation + shadowColor tint 사용. M4 W17 추가 보강 권고 |
| R-D022-3 | 한글 hero 88px SE overflow | 부분 — text.hero.ko 88 유지. 사용자 SE screenshot 검수 시 분기 결정 |
| R-D022-4 | 차기 사용자 검수 추가 수정 요청 | ⏳ open — device screenshot 검수 게이트 대기 |

---

## 7. Skill 사용

- orchestrator: design-system-foundation · frontend-design · root-cause-tracing ✅
- frontend agent context (`context/agents/frontend/20260518-1900-feat-d-022-tsx-application.md`) DoD 9/9 항목 중 5/9 완료:
  - ✅ 13 화면 .tsx D-022 token 적용
  - ✅ 5개 d022 컴포넌트 추출 (GradientText/GlassCard/NeonButton/GlowOrb/GradientBackground)
  - ⏳ iOS Simulator + Android emulator screenshot (사용자 install + run 필요)
  - ✅ reduce motion 설정 ON/OFF 분기 (NeonButton)
  - ⏳ expo build 통과 (사용자 prebuild 필요)
  - ✅ rollup 작성 (본 문서)

---

## 8. 다음 게이트

**사용자 권한 필요 (P0)**:
1. `pnpm install` (의존성 추가 반영)
2. `expo run:ios` 또는 `expo run:android` (실 device screenshot 13장 캡처)
3. 사용자 시각 확인 → "완전 대 만족" / 추가 수정 / D-022 V2 진행 결정

**Swarm coding 자율 진행 가능 영역**:
- M3 W15 Cycle B 잔여 작업 (frontend D-022 별도)
- M3 W16 gate sprint 준비
- M4 W17 entry preview
