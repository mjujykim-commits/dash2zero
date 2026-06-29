# dash2zero · 무료 사이드로드 런북 ($99 없이 iPhone 독립 설치)

- **작성**: orchestrator · 2026-06-29
- **대상 상황**: Owner = Windows 11 + iPhone + **Mac 잠깐 접근 가능** + Apple Developer Program 미가입
- **전략**: Mac 창에서 **IPA를 한 번** 굽고 → 평소엔 **Windows의 AltStore**가 7일마다 자동 재서명
- **계정**: 무료 Apple ID만 있으면 됨 ($99 불필요)

> 코드측은 이미 빌드 가능 상태(에셋/엔트리/Firebase/Apple로그인 정리 완료). 본 문서는 "무료로 폰에 올리는" 절차.

---

## 0. 무료 서명의 제약 (먼저 인지)
- **7일 만료**: 무료 인증서는 7일마다 만료 → 재서명 필요. AltStore가 자동화(아래 3단계).
- **앱 3개 한도**: 무료 계정은 동시에 3개까지 사이드로드.
- **일부 기능 제한**: Push 알림 등 일부 capability 불가. dash2zero는 게스트 모드 학습이 핵심이라 영향 적음.
- 결제(RevenueCat)는 키 미설정 시 "미구독"으로 동작 → Starter 60단어 + 게스트 학습은 정상.

---

## 1. [Mac 창에서] IPA 한 번 굽기

Mac에 Node 18+, Xcode(무료), CocoaPods 설치되어 있다고 가정. 저장소를 Mac으로 복사 후:

```bash
cd apps/mobile
npm install
npx expo prebuild --platform ios       # 네이티브 ios/ 프로젝트 생성
```

Xcode로 빌드:
1. `ios/dash2zero.xcworkspace` 를 Xcode로 연다.
2. 좌측 TARGETS → **Signing & Capabilities** → "Automatically manage signing" 체크 →
   **Team**에 본인 무료 Apple ID 추가/선택 (Personal Team).
3. Bundle Identifier가 충돌하면 유니크하게 변경 (예: `com.<본인>.dash2zero`).
4. 상단 기기 선택을 **"Any iOS Device (arm64)"** 로.
5. 메뉴 **Product → Archive** (또는 ⌘B 빌드).

IPA 패키징 (Archive 대신 빌드만 했다면):
1. 빌드 산출 `.app` 위치: `~/Library/Developer/Xcode/DerivedData/.../Build/Products/Debug-iphoneos/dash2zero.app`
2. `Payload` 폴더를 만들어 그 안에 `dash2zero.app` 복사 → `Payload` 폴더를 zip → 확장자를 `.ipa`로 변경.
```bash
mkdir Payload && cp -R /path/to/dash2zero.app Payload/
zip -r dash2zero.ipa Payload
```
3. 이 `dash2zero.ipa`를 Windows PC로 옮긴다 (USB/클라우드).

> 대안(즉시 설치): 아이폰을 Mac에 연결하고 `npx expo run:ios --device` 하면 바로 설치된다(7일).
> 단 7일 후 재설치하려면 다시 Mac이 필요 → Mac이 "잠깐"이면 아래 AltStore 경로 권장.

---

## 2. 백엔드 연결 (선택, 단 콘텐츠가 보이려면 필요)
앱이 단어를 보여주려면 Supabase 백엔드가 떠 있어야 한다 → `docs/release/BACKEND_SETUP.md` 참고.
- prebuild **전에** `apps/mobile/eas.json` 또는 `.env`에 `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY`를 넣고 빌드.
- 백엔드 없이 빌드하면 앱은 켜지지만 첫 단어가 안 나온다(빈 상태). 순서: 먼저 백엔드 → 그다음 빌드.

---

## 3. [Windows에서] AltStore로 설치 + 7일 자동 갱신

1. **AltServer (Windows)** 설치: https://altstore.io → AltServer 다운로드.
   - Apple의 **iTunes**와 **iCloud**(둘 다 *Apple 사이트* 버전, Microsoft Store 버전 아님) 설치 필요.
2. 아이폰을 USB로 연결 → AltServer 트레이 아이콘 → **Install AltStore** → 무료 Apple ID 로그인.
3. 아이폰 **설정 → 일반 → VPN 및 기기 관리**에서 본인 Apple ID 개발자 앱 **신뢰**.
4. 아이폰의 **AltStore 앱** → `+` → 1단계에서 만든 `dash2zero.ipa` 선택 → 설치.
5. **자동 갱신**: PC의 AltServer가 켜져 있고 아이폰이 같은 WiFi에 주기적으로 접속하면
   AltStore가 7일 만료 전에 **백그라운드 재서명**한다. (며칠에 한 번 PC를 켜두면 유지)

> 대안 툴: **Sideloadly** (https://sideloadly.io) — IPA + 무료 Apple ID로 설치. 단 자동 갱신 없음(7일마다 수동 재설치). 자동 갱신 원하면 AltStore.

---

## 4. 동작 확인
- [ ] 앱 실행 → 온보딩 → Home 첫 단어 (백엔드 떠 있어야 함)
- [ ] Lesson 루프 + 효과음(음원 넣었으면) + 발음(TTS 했으면)
- [ ] 7일 뒤 AltStore가 자동 갱신했는지 (앱이 여전히 열리면 OK)

## 5. 한계 / 업그레이드 트리거
- AltStore 자동 갱신은 PC+WiFi 의존 → 여행 등으로 오래 PC를 못 켜면 만료될 수 있음.
- 이게 불편해지면 그때 $99 가입 → TestFlight(`docs/release/TESTFLIGHT_RUNBOOK.md`)로 전환하면
  90일 유효 + PC 불필요. 정식 출시에도 어차피 필요.
