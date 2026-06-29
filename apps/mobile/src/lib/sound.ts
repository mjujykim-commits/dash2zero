/**
 * Global SFX manager — UI 효과음 재생 단일 진입점 (haptics.ts와 동일 패턴, D-024 정합).
 *
 * 역할:
 *   - expo-av로 짧은 one-shot 효과음 재생. 직접 import 금지 — 이 wrapper만 사용.
 *   - 사용자가 Settings에서 끄면 모든 호출 no-op (SecureStore 영구, profile.getSfxEnabled).
 *   - 등록(SFX_ASSETS)된 key만 preload·재생. 미등록 key는 조용히 무시 → 음원 미수급에도 빌드/런타임 안전.
 *   - 모듈 단위 in-memory cache로 호출 시점 SecureStore 읽기 회피 (60fps 정합).
 *
 * 사용:
 *   import { initSound, playSfx, setSfxEnabledGlobal } from "@/src/lib/sound";
 *   await initSound();                 // _layout launch 시점 1회 (haptics와 함께)
 *   void playSfx("tap");               // 버튼 press
 *   void playSfx("correct");           // 정답 (hapticNotification("success")와 병행)
 *   await setSfxEnabledGlobal(false);  // Settings toggle off
 *
 * 햅틱과의 관계: 효과음은 햅틱을 "대체"가 아니라 "보강". 정답 시 correct 사운드 + success 햅틱 동시.
 * 접근성: Reduce Motion과 무관(소리는 모션 아님). 청각 과민 사용자를 위해 토글 제공이 충분(Apple HIG).
 */

import { Audio } from "expo-av";
import { getSfxEnabled, setSfxEnabled } from "@/src/lib/profile";
import { SFX_ASSETS, type SfxKey } from "@/src/lib/sounds.manifest";

let enabled = true;
let initialized = false;

// key → 로드된 Audio.Sound (preload). 미로드/미등록 key는 Map에 없음.
const pool = new Map<SfxKey, Audio.Sound>();

/**
 * App launch 시 호출. (1) 사용자 토글 적재 (2) 등록 음원 preload.
 *
 * 오디오 모드: 의도적으로 setAudioModeAsync를 호출하지 않는다. 전역 오디오 모드는
 * audio.ts(initAudio, playsInSilentModeIOS:true — 발음이 무음 스위치를 우회해야 함, Q-FE-NEW-003)가
 * 단일 소유한다. SFX가 별도로 모드를 설정하면 실행 순서에 따라 발음 설정을 덮어쓰는 버그가 발생.
 * 따라서 SFX는 전역 모드를 상속(무음 스위치에서도 재생). 청각 과민 사용자는 Settings 토글로 차단.
 */
export async function initSound(): Promise<void> {
  try {
    enabled = await getSfxEnabled();
  } catch {
    enabled = true; // 기본 활성
  }

  // 등록된 음원만 preload (없으면 빈 루프 → no-op)
  await Promise.all(
    (Object.keys(SFX_ASSETS) as SfxKey[]).map(async (key) => {
      const mod = SFX_ASSETS[key];
      if (mod == null) return;
      try {
        const { sound } = await Audio.Sound.createAsync(mod, { volume: 0.7 });
        pool.set(key, sound);
      } catch {
        // 개별 음원 로드 실패는 무시 (해당 key만 무음)
      }
    })
  );

  initialized = true;
}

/** 현재 in-memory 활성 여부. UI 표시용 (SecureStore 비동기 회피). */
export function isSfxEnabled(): boolean {
  return enabled;
}

/** Settings toggle 변경 시 호출. SecureStore 저장 + in-memory 동기. */
export async function setSfxEnabledGlobal(next: boolean): Promise<void> {
  enabled = next;
  await setSfxEnabled(next);
}

/**
 * 효과음 재생 — enabled=false이거나 음원 미등록 시 즉시 no-op.
 * replayAsync로 빠른 재트리거(연타) 지원. 실패는 조용히 무시.
 */
export function playSfx(key: SfxKey): Promise<void> {
  if (!enabled) return Promise.resolve();
  const sound = pool.get(key);
  if (!sound) return Promise.resolve(); // 미등록/미로드 → 무음
  return sound.replayAsync().then(() => undefined).catch(() => undefined);
}

/** 앱 종료/언마운트 시 자원 해제 (선택적). */
export async function unloadSound(): Promise<void> {
  await Promise.all([...pool.values()].map((s) => s.unloadAsync().catch(() => undefined)));
  pool.clear();
  initialized = false;
}
