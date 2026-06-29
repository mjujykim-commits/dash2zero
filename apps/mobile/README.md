# @dash2zero/mobile

dash2zero 모바일 앱 — React Native + Expo + TypeScript.

> 상태: M2-S1 scaffold (package.json만 작성). 실제 Expo init은 M2-S2 (W6) 진입 시.
> 책임 agent: `frontend`

## 빠른 시작

M2-S2 진입 시 다음 절차:

```bash
# 1. (W6 시작 시 1회) Expo 프로젝트 init
cd apps/mobile
npx create-expo-app@latest . --template blank-typescript

# 2. 의존성 설치
pnpm install

# 3. dev server
pnpm start
```

## 핵심 의존성

- `expo` 51 — RN runtime
- `expo-router` 3.5 — 파일 기반 라우팅
- `expo-av` — 음성 재생 (TTS audio)
- `expo-sqlite` — 게스트 모드 로컬 SRS 상태
- `expo-notifications` — 푸시 알림
- `@supabase/supabase-js` — 백엔드 SDK
- `react-native-purchases` — RevenueCat
- `@react-native-firebase/*` — Analytics + Crashlytics

## 구조 (M2-S2 진입 시 채워짐)

```
apps/mobile/
├── app/                   # Expo Router 파일 기반 라우팅
│   ├── _layout.tsx
│   ├── index.tsx          # Welcome / Age gate
│   ├── onboarding.tsx
│   ├── home.tsx           # Today
│   ├── lesson/
│   │   ├── start.tsx
│   │   ├── [wordId].tsx   # Notice → Hear → Meaning → Retrieve
│   │   └── complete.tsx
│   ├── paywall.tsx
│   └── settings/
├── src/
│   ├── lib/               # SDK 어댑터 (auth, storage, audio, trace, webhook handler — ADR-0002)
│   ├── srs/               # SRS 엔진 (CC2-10, CC3-05)
│   ├── store/             # Zustand or Context (게스트 + 인증 사용자)
│   └── hooks/
├── assets/                # 폰트 (Noto Sans KR + Inter), 이미지
└── app.json               # Expo 설정 (M2-S2)
```

## SSOT 참조

- 헌장: `../../AGENTS.md`
- PRD: `../../docs/product/PRD.md`
- Domain Model: `../../docs/architecture/DOMAIN_MODEL.md`
- Stack Decision (ADR-0001): `../../docs/adr/ADR-0001-stack-decision.md`
- Design Tokens (M2-S2 export): `../../packages/design-tokens/`
