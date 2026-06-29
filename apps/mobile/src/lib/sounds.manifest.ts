/**
 * SFX 카탈로그 (UI 효과음) — dash2zero "톡톡 튀는 고급" 사운드 설계
 *
 * ⚠️ 발음 음원(단어 읽기)과 무관. 이 파일은 버튼/퀴즈/완료 등 UI 효과음 전용.
 *    발음은 Google TTS(ADR-0005)로 생성 → Supabase storage.
 *
 * 사운드 personality — **미니멀 고급(minimal / premium)**:
 *   - 절제되고 세련된 one-shot. 짧고(<300ms 권장) 깨끗한 톤. 과장/귀여움/레트로 8-bit 회피.
 *   - 소프트 글래스 탭, 청량한 단음 벨, 부드러운 신스 — "비싼 앱" 느낌(iOS 시스템음급 정제).
 *   - 정답은 절제된 상승 단음, 오답은 아주 부드러운 하강(비-징벌적, D-031/032 정합).
 *   - 볼륨은 햅틱 보조 수준으로 낮게(0.5~0.6). 완료/마스터도 화려함보다 "우아한 마무리".
 *   - 일관성 우선: 모든 SFX가 같은 음색 패밀리(같은 악기/리버브)로 들리도록 한 팩에서 선별 권고.
 *
 * 라이선스 정책 (상업 출시 대비):
 *   - Kenney(CC0) 우선 — 출처표기 불필요. Pixabay(상업무료, 표기불필요) 차선.
 *   - Freesound는 CC0 표시 파일만. CC-BY는 ATTRIBUTIONS.md 등재 의무 → 가급적 회피.
 *   - 받은 파일 출처/라이선스는 apps/mobile/assets/sfx/ATTRIBUTIONS.md에 기록.
 *
 * 빌드 안전:
 *   - 실제 음원 파일이 없어도 빌드 OK. SFX_ASSETS에 등재된 key만 재생되고,
 *     미등재 key는 sound.ts에서 조용히 no-op (Metro가 없는 파일을 require하지 않음).
 *   - 음원을 받으면 (1) assets/sfx/에 파일 저장 → (2) 아래 SFX_ASSETS에 require 1줄 추가.
 */

export type SfxKey =
  // --- 기본 인터랙션 ---
  | "tap"            // 1차 버튼 press (NeonButton 등) — 짧고 산뜻한 "톡"
  | "tap_soft"       // 보조/미묘한 탭 (chip, row) — tap보다 약하게
  | "select"         // 퀴즈 옵션/칩 선택 — 가벼운 "핍/팝"
  | "toggle"         // 스위치 on/off (JellySwitch) — 말랑한 토글음
  // --- 학습 루프 ---
  | "stage_advance"  // lesson 단계 전환 (Notice→Hear→Meaning→Retrieve) — 상승 스와이프
  | "correct"        // 정답 — 밝고 상승하는 벨/마림바 "띠링"
  | "incorrect"      // 오답 — 부드러운 하강 (비-징벌적, 좌절감 X)
  | "reveal"         // 정답 카드 자동 노출 (correct-passive, glow) — 부드러운 "샤랑"
  | "count_tick"     // NumberCounter 카운트업 틱 — 아주 짧은 "틱" (반복 재생)
  // --- 보상/마일스톤 ---
  | "complete"       // lesson 완료 팡파레 — 가장 화려, 톡톡+고급 (메인 보상)
  | "streak"         // StreakBadge pop (연속일 +1) — 상승 "차밍"
  | "mastered"       // SRS stage 5 첫 달성 — 반짝이는 보상음
  // --- 시스템 ---
  | "toast"          // Toast 등장 — 아주 미묘한 "팝"
  | "refresh"        // PullToRefresh 트리거 — 짧은 "스와이프/팝"
  | "error";         // 차단성 에러 (Alert) — 정중한 경고음 (날카롭지 않게)

export interface SfxSpec {
  key: SfxKey;
  /** 사운드 성격 — 음원 선별/검수 기준 */
  character: string;
  /** 길이 가이드(ms) — 초과 시 후보 제외 */
  maxMs: number;
  /** 동시 다발 재생 가능 여부 (예: 빠른 연타) */
  overlap: boolean;
  /** 추천 출처 검색어 (Kenney/Pixabay) */
  source: string;
}

/** 검수/소싱 기준표 — 음원 받을 때 이 character에 맞는지 대조. */
export const SFX_SPECS: Record<SfxKey, SfxSpec> = {
  tap:           { key: "tap",           character: "소프트 글래스 탭 — 절제·청량, 저음 둔탁 회피", maxMs: 150, overlap: true,  source: "Kenney 'Interface Sounds' (subtle click); Pixabay 'minimal ui tap clean'" },
  tap_soft:      { key: "tap_soft",      character: "tap의 더 여린 버전 — 보조 요소용", maxMs: 150, overlap: true,  source: "Pixabay 'soft subtle tap minimal'" },
  select:        { key: "select",        character: "단정한 선택 확정음 — 짧은 청음", maxMs: 180, overlap: true,  source: "Pixabay 'minimal select ui clean'; Kenney select" },
  toggle:        { key: "toggle",        character: "깔끔한 토글 클릭 — 군더더기 없이", maxMs: 180, overlap: false, source: "Pixabay 'switch toggle minimal clean'" },
  stage_advance: { key: "stage_advance", character: "아주 부드러운 전환 휘프 — 거의 숨소리 수준", maxMs: 280, overlap: false, source: "Pixabay 'soft subtle whoosh ui minimal'" },
  correct:       { key: "correct",       character: "절제된 상승 단음 벨 — 우아한 확인음", maxMs: 300, overlap: false, source: "Pixabay 'soft clean correct chime minimal bell'" },
  incorrect:     { key: "incorrect",     character: "아주 부드러운 하강 단음 — 정중, 좌절감 X (D-032)", maxMs: 280, overlap: false, source: "Pixabay 'soft gentle incorrect minimal'" },
  reveal:        { key: "reveal",        character: "여린 글래스 shimmer — 정답 노출, 은은하게", maxMs: 320, overlap: false, source: "Pixabay 'soft glass shimmer subtle'" },
  count_tick:    { key: "count_tick",    character: "아주 짧고 여린 '틱' — 숫자 증가, 반복", maxMs: 90,  overlap: true,  source: "Pixabay 'soft tick minimal'; Kenney tick" },
  complete:      { key: "complete",      character: "우아한 마무리 단·화음 — 화려함보다 정제된 만족감 (메인 보상)", maxMs: 900, overlap: false, source: "Pixabay 'elegant minimal success soft chord'" },
  streak:        { key: "streak",        character: "절제된 상승 2~3음 — 연속일 보상, 은은하게", maxMs: 500, overlap: false, source: "Pixabay 'soft level up minimal subtle'" },
  mastered:      { key: "mastered",      character: "맑은 단음 + 여린 잔향 — 마스터 달성", maxMs: 700, overlap: false, source: "Pixabay 'clean achievement soft bell minimal'" },
  toast:         { key: "toast",         character: "거의 안 들릴 만큼 미묘한 청음 — 알림 등장", maxMs: 150, overlap: true,  source: "Pixabay 'subtle notification soft minimal'" },
  refresh:       { key: "refresh",       character: "짧고 부드러운 휘프 — 당겨서 새로고침", maxMs: 250, overlap: false, source: "Pixabay 'soft refresh whoosh minimal'" },
  error:         { key: "error",         character: "정중한 저자극 경고 — 날카롭지 않게", maxMs: 350, overlap: false, source: "Pixabay 'soft gentle error notice minimal'" },
};

/**
 * 실제 음원 모듈 등록처 — 빌드 안전.
 *
 * 파일을 받으면 아래에 require 1줄씩 추가한다. 예:
 *   tap: require("../../assets/sfx/tap.mp3"),
 *
 * 등재되지 않은 key는 sound.ts에서 자동 no-op (앱 정상 동작, 해당 사운드만 무음).
 * 현재는 음원 미수급 상태 → 의도적으로 비어 있음.
 */
export const SFX_ASSETS: Partial<Record<SfxKey, number>> = {
  // Kenney 'Interface Sounds' (CC0) — ogg→mp3 변환, 2026-06-29. 출처: assets/sfx/ATTRIBUTIONS.md
  // 매핑은 "미니멀 고급" + 같은 음색 패밀리 기준 선별. 마음에 안 들면 mp3만 교체하면 됨.
  tap: require("../../assets/sfx/tap.mp3"),                 // glass_001
  tap_soft: require("../../assets/sfx/tap_soft.mp3"),       // glass_003
  select: require("../../assets/sfx/select.mp3"),           // select_001
  toggle: require("../../assets/sfx/toggle.mp3"),           // toggle_001
  stage_advance: require("../../assets/sfx/stage_advance.mp3"), // scroll_001
  correct: require("../../assets/sfx/correct.mp3"),         // confirmation_001
  incorrect: require("../../assets/sfx/incorrect.mp3"),     // error_003
  reveal: require("../../assets/sfx/reveal.mp3"),           // glass_006
  count_tick: require("../../assets/sfx/count_tick.mp3"),   // tick_001
  complete: require("../../assets/sfx/complete.mp3"),       // confirmation_004
  streak: require("../../assets/sfx/streak.mp3"),           // maximize_001
  mastered: require("../../assets/sfx/mastered.mp3"),       // pluck_001
  toast: require("../../assets/sfx/toast.mp3"),             // select_005
  refresh: require("../../assets/sfx/refresh.mp3"),         // scroll_003
  error: require("../../assets/sfx/error.mp3"),             // error_006
};
