# dash2zero UI 효과음 (SFX) — 음원 수급 가이드

이 폴더는 **UI 효과음**(버튼 톡, 정답 띠링, 완료 팡파레 등) 전용입니다.
**단어 발음 음원과 무관**합니다 (발음은 Google TTS → Supabase storage, ADR-0005).

## 사운드 컨셉 — **미니멀 고급(minimal / premium)**
절제·세련. 소프트 글래스 탭, 청량한 단음 벨, 부드러운 신스 ("비싼 앱" 느낌, iOS 시스템음급 정제).
짧게(<300ms, 완료/마스터만 더 길게), 볼륨 낮게(0.5~0.6). 과장·귀여움·8-bit 회피.
정답=절제된 상승 단음, 오답=아주 부드러운 하강. **모든 SFX를 같은 음색 패밀리(한 팩)에서 선별**해 일관성 유지.

## 받을 곳 (CC0/상업무료 우선)
1. **Kenney — https://kenney.nl/assets/interface-sounds** (CC0, 출처표기 불필요) ⭐ 1순위
   - "Interface Sounds", "UI Audio", "Music Jingles" 팩 추천
2. **Pixabay Sound Effects — https://pixabay.com/sound-effects/** (상업무료, 표기불필요)
   - 검색어는 아래 표의 `source` 열 참고
3. Freesound — **CC0 표시 파일만** (CC-BY는 출처표기 의무 → 가급적 회피)

## 필요한 파일 목록
파일명은 아래 key와 동일하게 저장하면 좋습니다 (예: `tap.mp3`). 포맷은 `.mp3` 또는 `.m4a` 권장(iOS/Android 공통, 용량 작음).

| key | 언제 울리나 | 성격 | 길이 |
|---|---|---|---|
| `tap` | 1차 버튼 press | 밝고 산뜻한 "톡" | ≤200ms |
| `tap_soft` | 보조 탭(chip/row) | tap 약한 버전 | ≤200ms |
| `select` | 퀴즈 옵션 선택 | 가벼운 "핍/팝" | ≤250ms |
| `toggle` | 스위치 on/off | 말랑한 토글 | ≤250ms |
| `stage_advance` | 레슨 단계 전환 | 상승 스와이프 | ≤350ms |
| `correct` | 정답 | 밝게 상승하는 벨/마림바 | ≤400ms |
| `incorrect` | 오답 | 부드러운 하강(좌절감 X) | ≤350ms |
| `reveal` | 정답 카드 노출 | 부드러운 shimmer | ≤400ms |
| `count_tick` | 숫자 카운트업 | 아주 짧은 "틱" | ≤120ms |
| `complete` | 레슨 완료 | **화려한 팡파레(메인 보상)** | ≤1200ms |
| `streak` | 연속일 +1 | 상승 "차밍" | ≤600ms |
| `mastered` | SRS 마스터 달성 | 반짝 보상음 | ≤900ms |
| `toast` | 토스트 등장 | 미묘한 "팝" | ≤200ms |
| `refresh` | 당겨서 새로고침 | 짧은 스와이프/팝 | ≤300ms |
| `error` | 차단성 에러 | 정중한 경고(날카롭지 않게) | ≤400ms |

> 전부 다 받을 필요는 없습니다. **우선순위 5개**부터: `tap`, `select`, `correct`, `incorrect`, `complete`.

## 연결 방법 (2단계)
1. 받은 파일을 이 폴더(`apps/mobile/assets/sfx/`)에 저장.
2. `apps/mobile/src/lib/sounds.manifest.ts`의 `SFX_ASSETS`에 require 1줄 추가:
   ```ts
   export const SFX_ASSETS: Partial<Record<SfxKey, number>> = {
     tap: require("../../assets/sfx/tap.mp3"),
     select: require("../../assets/sfx/select.mp3"),
     correct: require("../../assets/sfx/correct.mp3"),
     incorrect: require("../../assets/sfx/incorrect.mp3"),
     complete: require("../../assets/sfx/complete.mp3"),
   };
   ```
   → 등록 즉시 해당 사운드가 활성화됩니다 (코드 호출부는 이미 연결됨).

## 라이선스 기록 의무
받은 파일의 출처/라이선스를 `ATTRIBUTIONS.md`에 기록하세요 (CC0라도 추적용).
