# M3 W15 Designer — R-28 + Dark Mode + 5상태 + RR 가이드

- **Agent**: designer (senior UX/UI)
- **Date**: 2026-05-11 23:00
- **Cycle**: M3 W15 실작업 (readiness 22:00 후속)
- **사용자 권한**: 자율 결정, 제품 개발 몰두
- **선행 문서**: `context/agents/designer/20260511-2200-chore-m3-w15-readiness.md`

---

## 1. 작업 요약 (4건 산출)

### 1.1 LESSON_CHAIN_PATTERN (R-28 / frontend 협업)
- 파일: `docs/design/LESSON_CHAIN_PATTERN.md` (신규)
- 내용: chain 진행 표시 ("Card N of M"), card transition (80ms fade + 200ms slide opacity, ease-out), complete 진입 조건 (마지막 카드 submit + 800ms), reduce motion 처리
- paywall_signin_required 안내 컴포넌트 (`PaywallSignInNotice`) 사양 — Subscribe 버튼 위 1줄 inline notice, `text.caption` + `text.secondary`, 영문 "Sign in required to subscribe." / 한글 "구매 전 가입이 필요해요."
- 마이크로카피 Honest 톤 자율 결정 — 느낌형/명령형 회피, 마침표 평서문

### 1.2 DARK_MODE_ADOPTION_MATRIX (P1)
- 파일: `docs/design/DARK_MODE_ADOPTION_MATRIX.md` (신규)
- 13 화면 × light/dark 적용 상태 표
- W17 M4 진입 전 P0 우선순위 (designer 자율): **settings / onboarding / paywall**
- lesson을 P2로 둔 사유: 한글 가독성 회귀 위험, baseline 측정 노이즈 회피
- darkColors export는 이미 `packages/design-tokens/src/colors.ts:32` + index.ts `export *`로 활성화 — 별도 코드 변경 불요 확인
- `useColorScheme()` 어댑터 시그니처 권고 (frontend 위임)

### 1.3 5상태 토큰 + STATE_PATTERNS (P0)
- 파일: `packages/design-tokens/src/states.ts` (신규)
- 파일: `docs/design/STATE_PATTERNS.md` (신규)
- 파일: `packages/design-tokens/src/index.ts` (export 추가)
- 5상태 (empty/loading/error/offline/idle) × 4핵심 화면 (home/lesson/paywall/settings) = 17건 정의 (settings.empty 제외)
- Steady 톤 — 폭죽/큰 일러스트/감정 카피/느낌표/이모지 금지
- skeleton만 사용 (spinner 금지), inline banner는 settings 전용
- 자율 결정한 토큰 값:
  - icon size 32 (fullscreen) / 24 (banner)
  - skeleton pulse 1200ms ease-in-out, opacity 0.5→1.0
  - maxBodyWidth 280pt (SE fit)
  - error 색은 `semantic.warning` (시스템 책임), purchase 실패만 `semantic.danger`

### 1.4 RR_TYPOGRAPHY_GUIDE (UX-NEW-001 후속)
- 파일: `docs/design/RR_TYPOGRAPHY_GUIDE.md` (신규)
- RN 매핑: `numberOfLines={1} ellipsizeMode="tail" maxWidth={280}`
- 예문 RR은 2줄 허용
- SE 320pt 카드 fit 검증 (ASCII): notice/meaning fit OK, **retrieve stage는 626pt → 568pt 초과 → 스크롤 발생 또는 audio 버튼 size 32로 축소 필요** (자율 권고: size 32 + margin space.4)
- accessibilityLabel은 ellipsis 없이 풀 RR 부여

---

## 2. frontend agent 의존 인계 사항

| 인계 항목 | 위치 | 상태 |
|---|---|---|
| chain `Card N of M` 표시 위치/스펙 | LESSON_CHAIN_PATTERN §2 | 인계 완료 |
| transition 80/200 ease-out | LESSON_CHAIN_PATTERN §3 | 인계 완료 |
| complete 진입 조건 | LESSON_CHAIN_PATTERN §4 | 인계 완료 |
| PaywallSignInNotice 컴포넌트 위치 | LESSON_CHAIN_PATTERN §5 | 인계 완료, frontend가 구현 |
| `paywall_signin_required` emit 시점 (analytics와 별개로 designer 의견: tap 시 1회) | LESSON_CHAIN_PATTERN §5.4 | 인계 완료 |
| 5상태 토큰 import | states.ts | 인계 완료 |
| RN ellipsis 적용 | RR_TYPOGRAPHY_GUIDE §2 | 인계 완료 |
| retrieve stage audio size 32 권고 | RR_TYPOGRAPHY_GUIDE §3.3 | 인계 완료, frontend 결정 |
| useColorScheme 어댑터 (M4 W17 입력) | DARK_MODE_ADOPTION_MATRIX §3.2 | 인계 완료 |

---

## 3. analytics agent 인계

- baseline 측정 시 `paywall_signin_required` event는 **사용자 tap 직후 redirect 직전** 1회 emit (designer 권고). 본 컴포넌트가 단순히 mount되는 시점에는 emit하지 않음 — funnel 정확도.

---

## 4. 자율 결정 요약

| 결정 | 사유 |
|---|---|
| 5상태 icon 색: empty=muted, error=warning, offline=muted | empty/offline은 사용자 책임 회피 — 색이 비난조 안 되도록 |
| skeleton pulse 1200ms | 너무 빠르면 산만, 너무 느리면 멈춘 듯 — 1.2s steady |
| 다크 P0: settings/onboarding/paywall, P2: lesson | lesson은 한글 가독성 별도 검증 필요 |
| chain "Card N of M" 텍스트 only (progress bar 금지) | 게임화 회피 (Honest 톤) |
| chain N=1도 표시 | 측정 일관성 |
| Honest 마이크로카피 ("Sign in required to subscribe.") | 1줄, 평서문, 마침표 |
| retrieve audio size 32 권고 | SE fit 확보 |
| MVP appearance default = OS 추종 (Auto) | iOS/Android 양쪽 사용자 기본값 |

---

## 5. 후속 (M4 진입)

- W17 진입 직전 `useColorScheme()` 어댑터 frontend 구현 검수
- W17~W18: P1 다크 적용 5화면 (home, age-gate, privacy-choices, sign-in, report)
- W19+: lesson 다크 적용 사용자 테스트 (n=5 영어권)
- 5상태 토큰의 i18n 키 (`home.empty.headline` 등) 실제 i18n 라이브러리 결정 후 string 등록 — analytics agent가 1차 언어 결정 의존

---

## 6. 산출물 파일 경로 (호출자 확인용)

- `docs/design/LESSON_CHAIN_PATTERN.md` (신규)
- `docs/design/DARK_MODE_ADOPTION_MATRIX.md` (신규)
- `docs/design/STATE_PATTERNS.md` (신규)
- `docs/design/RR_TYPOGRAPHY_GUIDE.md` (신규)
- `packages/design-tokens/src/states.ts` (신규)
- `packages/design-tokens/src/index.ts` (states export 1줄 추가)
- `context/agents/designer/20260511-2300-feat-m3-w15-r28-darkmode-states.md` (본 문서)

---

## 7. 서명

- designer (senior UX/UI), 2026-05-11 23:00
- 다음 designer 사이클 트리거: frontend lesson chain 구현 review 요청 또는 M4 W17 진입
