/**
 * AudioGenerator — TTS provider 추상화 (ADR-0002)
 *
 * 현재 구현: M2-S2 W6에 결정 (ADR-0005). 후보: Google TTS / Azure Speech / Naver Clova / ElevenLabs
 * 교체 가능: provider 변경 시 audio_assets.provider 컬럼만 변경
 */

export interface Voice {
  voiceId: string;
  lang: "ko";
  gender?: "male" | "female";
  age?: "child" | "adult";
  description?: string;
}

export interface GeneratedAudio {
  audioBuffer: Uint8Array;
  durationMs: number;
  format: "mp3" | "wav";
  hash: string; // SHA256 of audioBuffer (cache invalidation)
}

export interface AudioGenerator {
  generate(text: string, voiceId: string, lang: "ko"): Promise<GeneratedAudio>;
  listVoices(lang: "ko"): Promise<Voice[]>;
  /** provider 식별자 (audio_assets.provider 컬럼) */
  readonly providerId: string;
}
