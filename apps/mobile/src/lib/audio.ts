/**
 * Audio playback — expo-av wrapper (FE-DOC-003 / Q-FE-NEW-003)
 *
 * 결정 사항:
 *   - iOS AVAudioSession: playsInSilentModeIOS = true (학습 발음은 무음 모드 우회 — Q-FE-NEW-003)
 *   - 자동 재생: Hear 단계 진입 시 1회 자동 (UX-NEW-006), 그 외는 수동 (CC2-25)
 *   - 무음 스위치 우회 사유: 한국어 발음 학습이 본질
 *   - LRU 캐시: 100MB 상한 (FE-NEW-004), 미구현 시 expo-av 기본 동작
 *
 * 책임 agent: frontend
 *
 * M2-S5 진입 시 보강:
 *   - signed URL 갱신 흐름 (Q-FE-NEW-005)
 *   - 오프라인 prefetch (CC-16)
 */

import { Audio, AVPlaybackStatus } from "expo-av";

let currentSound: Audio.Sound | null = null;
let isInitialized = false;

// ============================================================================
// Prefetch cache (FE-NEW-004 1차 — 메모리 기반, LRU 미적용)
// ============================================================================

const PREFETCH_LIMIT = 6; // chain 1~10 카드 중 다음 2~3 카드 cover. 메모리 ~6MB 가정 (audio ~1MB)

interface CachedSound {
  uri: string;
  sound: Audio.Sound;
  loadedAt: number;
}

const prefetchCache = new Map<string, CachedSound>();

async function evictIfFull() {
  if (prefetchCache.size <= PREFETCH_LIMIT) return;
  // LRU: 가장 오래된 항목 unload
  const sorted = [...prefetchCache.entries()].sort((a, b) => a[1].loadedAt - b[1].loadedAt);
  const [oldestUri, oldest] = sorted[0]!;
  prefetchCache.delete(oldestUri);
  await oldest.sound.unloadAsync().catch(() => undefined);
}

/**
 * audio를 미리 메모리로 load. play 호출 시점에 latency 0 보장.
 * 같은 uri를 중복 prefetch 하면 첫 호출만 유효 (early return).
 */
export async function prefetchAudio(uri: string): Promise<void> {
  if (!uri) return;
  if (prefetchCache.has(uri)) return;

  if (!isInitialized) await initAudio();

  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false, volume: 1.0 }
    );
    prefetchCache.set(uri, { uri, sound, loadedAt: Date.now() });
    await evictIfFull();
  } catch {
    // prefetch 실패는 silent — play 시점에 다시 시도
  }
}

/**
 * 모든 prefetch 캐시 unload. lesson chain 종료 시 호출 권고.
 */
export async function clearAudioCache(): Promise<void> {
  for (const [, cached] of prefetchCache) {
    await cached.sound.unloadAsync().catch(() => undefined);
  }
  prefetchCache.clear();
}

/**
 * AVAudioSession / AudioFocus 정책 적용. 앱 시작 시 1회 호출.
 *
 * iOS playsInSilentModeIOS = true:
 *   - 무음 스위치 켜진 상태에서도 학습 발음 재생 (Q-FE-NEW-003 결정)
 *   - 백그라운드 음악과 ducking 처리 (다른 앱 일시 정지)
 */
export async function initAudio(): Promise<void> {
  if (isInitialized) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    interruptionModeIOS: 1, // INTERRUPTION_MODE_IOS_DUCK_OTHERS
    interruptionModeAndroid: 1, // INTERRUPTION_MODE_ANDROID_DUCK_OTHERS
    staysActiveInBackground: false,
    allowsRecordingIOS: false,
  });
  isInitialized = true;
}

export type AudioState = "idle" | "loading" | "playing" | "error";

export interface PlayResult {
  state: AudioState;
  errorMessage?: string;
}

/**
 * 단일 sound 재생. 이전 재생 중이면 중단 후 새로 재생.
 *
 * @param uri — Supabase Storage signed URL 또는 public URL
 * @returns Promise<PlayResult>
 */
export async function playAudio(uri: string): Promise<PlayResult> {
  if (!isInitialized) {
    await initAudio();
  }

  try {
    // 이전 sound 중단 (현재 재생 중인 sound만 stop. prefetch cache는 보존)
    if (currentSound) {
      await currentSound.stopAsync().catch(() => undefined);
      // currentSound가 prefetch cache 항목이면 unload하지 않음 (재사용)
      const isCached = [...prefetchCache.values()].some((c) => c.sound === currentSound);
      if (!isCached) {
        await currentSound.unloadAsync().catch(() => undefined);
      }
      currentSound = null;
    }

    // Cache hit — 즉시 재생 (latency 0)
    const cached = prefetchCache.get(uri);
    if (cached) {
      await cached.sound.setPositionAsync(0).catch(() => undefined);
      await cached.sound.playAsync();
      cached.sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          // prefetch cache는 finish 후 보존 (반복 재생 가능)
          cached.sound.setOnPlaybackStatusUpdate(null);
        }
      });
      currentSound = cached.sound;
      return { state: "playing" };
    }

    // Cache miss — 즉시 load + play
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 },
      (status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => undefined);
          if (currentSound === sound) currentSound = null;
        }
      },
    );
    currentSound = sound;
    return { state: "playing" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "audio_load_failed";
    return { state: "error", errorMessage: msg };
  }
}

export async function stopAudio(): Promise<void> {
  if (currentSound) {
    await currentSound.stopAsync().catch(() => undefined);
    // prefetch cache 항목이면 unload 회피 (다음 재생에 재사용)
    const isCached = [...prefetchCache.values()].some((c) => c.sound === currentSound);
    if (!isCached) {
      await currentSound.unloadAsync().catch(() => undefined);
    }
    currentSound = null;
  }
}
