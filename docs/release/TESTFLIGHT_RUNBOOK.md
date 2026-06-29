# dash2zero · TestFlight 업로드 런북

- **작성**: orchestrator (Owner 요청 "apple flight 올려서 테스트" 대응)
- **작성일**: 2026-06-29
- **목표**: iOS 앱을 EAS로 빌드 → TestFlight 내부 테스트 배포
- **전제**: Expo managed workflow (네이티브 프로젝트 없음), EAS Build/Submit 사용

---

## 0. 한 줄 결론

코드측 빌드 블로커 3건은 **본 사이클에 해소 완료**. 남은 것은 **Owner 전용 영역**(Apple Developer 계정 + production secrets)뿐이며, 이는 swarm이 대행 불가하다.

---

## 1. 본 사이클 처리 완료 (orchestrator)

| # | 블로커 | 처리 |
|---|---|---|
| 1 | 앱 에셋 누락 (`app.json`이 참조하는 icon/splash 파일 부재 → 빌드 즉시 실패) | `scripts/gen-placeholder-assets.js`로 브랜드(K-pop Bold) placeholder 4종 생성: `apps/mobile/assets/{icon,adaptive-icon,splash,favicon}.png`. 모두 유효 PNG·1024² 아이콘 알파 없음(iOS 요건 충족). **정식 디자인 에셋 확보 시 동일 파일명 교체** |
| 3 | `eas.json` 위치 (`infra/eas/`에만 있어 EAS CLI가 못 읽음) | `apps/mobile/eas.json` 생성(앱 루트). `infra/eas/eas.json`은 D-009 SSOT 사본으로 동기 유지 |
| 4 | **`package.json` main 엔트리 깨짐** (`"main": "index.ts"` — 파일 부재 → 실행 실패) | `"main": "expo-router/entry"`로 수정 |
| 5 | **Firebase가 Expo plugin/plist 없이 의존에 포함** (EAS 빌드 실패 + 개인용엔 무의미) | `src/lib/analytics.ts`를 시그니처 보존 no-op 스텁으로 교체 + `package.json`에서 `@react-native-firebase/*` 3종 제거. 호출부 7개 파일 무수정 동작. **GA 복원 절차는 §3** |

> 참고: `app.json`의 `extra.eas.projectId`는 여전히 `"TBD-EAS-PROJECT-ID"` — 아래 2단계 `eas init` 실행 시 Owner 계정의 실 projectId로 **자동 치환**되므로 수동 편집 불필요.

### 빌드 readiness 점검 메모
- `tsc --noEmit` 결과 타입오류 다수 존재하나 **EAS 빌드 블로커 아님** — Metro+Babel은 타입을 제거하고 번들링하며 `tsc`를 실행하지 않음.
- 단, 잠재 버그성 항목 발견 (별도 backlog 권고): 분석 이벤트명 `lesson_shared` / `learning_motivation_changed`가 `@dash2zero/contracts`의 이벤트 union에 미등록 → 호출부 타입 불일치. 이벤트가 silently drop될 수 있으므로 GA 전 contracts taxonomy 정합 점검 권고.

---

## 2. Owner 전용 잔여 절차 (swarm 대행 불가)

### 2.1 사전 준비 (1회성)
- [ ] **Apple Developer Program 가입** ($99/yr) — 결제·법인/개인 주체 확정 (D-42 게이트와 동일)
- [ ] **App Store Connect에서 앱 레코드 생성** — Bundle ID `com.dash2zero.app`, 이름 dash2zero
- [ ] Apple Paid Apps Agreement 수락 (구독 테스트 시 필수)
- [ ] `eas.json`의 `submit.production.ios` TBD 3종 치환: `appleId`, `ascAppId`, `appleTeamId` (또는 `eas submit` 대화형 입력)

### 2.2 EAS 프로젝트 연결 (1회성)
```bash
cd apps/mobile
npm i -g eas-cli           # 또는 pnpm
eas login                  # Owner Expo 계정
eas init                   # → extra.eas.projectId 자동 기입 (TBD 치환)
```

### 2.3 환경변수 등록 (EAS env / Secrets)
앱은 `Constants.expoConfig.extra` 또는 `EXPO_PUBLIC_*` 환경변수에서 설정을 읽는다 (`src/lib/supabase.ts`, `purchases.ts`, `authProviders.ts`). 개인용 빌드 최소 구성:

- [ ] **Supabase** (로그인·SRS 동기화에 필요): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` — 무료 티어 프로젝트 1개 생성 + 마이그레이션 적용. anon key는 공개 키라 `eas.json`의 production `env`에 직접 넣어도 무방.
  - 게스트 모드(`guestStore` + `expo-sqlite`)로 로그인 없이 로컬 사용도 일부 가능 — 동기화/계정 기능만 제한.
- [ ] **RevenueCat** (Premium 잠금 해제용, 선택): `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`. 미설정 시 코드가 빈 문자열로 폴백 — 결제는 비활성이나 앱은 동작. 혼자 쓰면 Premium 콘텐츠는 별도 처리 권고.
- [ ] **Firebase**: **불필요** — analytics no-op 스텁으로 제거됨 (§1 #5).
- 상세 항목은 `docs/23_deployment_checklist.md §4` 대조

### 2.4 빌드 → TestFlight 업로드
```bash
# iOS store-distribution 빌드 (서명은 EAS가 관리: eas credentials)
eas build --profile production --platform ios

# 빌드 성공 후 TestFlight 제출
eas submit --profile production --platform ios
```
- `production` 프로파일 = store distribution → TestFlight/App Store용. **`preview`는 ad-hoc internal이라 TestFlight 불가.**
- 빌드 시 Apple 서명 자격증명을 EAS가 자동 생성/관리하도록 위임 가능 (`eas credentials`).

### 2.5 TestFlight 내부 테스트
- [ ] App Store Connect → TestFlight → 내부 테스터 그룹에 빌드 할당
- [ ] 수출 규정: `ITSAppUsesNonExemptEncryption:false` 이미 선언됨 → 추가 입력 불필요
- [ ] 내부 테스터는 심사 없이 즉시 / 외부 테스터는 Beta App Review 필요

---

## 3. GA 출시와의 관계
- TestFlight 내부 테스트는 **D-42 결제 게이트 완료 전에도 가능** (구독 실결제 테스트만 Paid Apps Agreement 필요).
- 정식 App Store 출시(GA)는 `docs/23_deployment_checklist.md`의 P0 보류조건 전부 해소 후 진행.
- 본 런북은 "내부 dogfooding 시작"이 목표이며 GA 게이트 16조건과는 별개 트랙.
