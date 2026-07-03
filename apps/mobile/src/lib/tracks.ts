/**
 * tracks — TOPIK/KIIP 시험대비 어휘 데이터 (Storage 호스팅 JSON).
 *
 * 트랙별 파일: images/track-{topik|kiip}.json (레벨 → 단어[{k,g,r}]).
 * 발음 음성은 audio/vocab/{hex(korean)}.mp3 (generate-vocab-audio.mjs 생성).
 */

import { SUPABASE_URL } from "./supabase";

export interface TrackWord {
  k: string; // korean
  g: string; // gloss_en
  r: string; // romanization
}
export interface TrackLevel {
  key: string;
  badge?: string; // 뱃지 표기(초급/중급/고급, 1단계…)
  label: string;
  words: TrackWord[];
}
export interface TrackData {
  version: number;
  track: string;
  name: string;
  subtitle: string;
  levels: TrackLevel[];
}

export type TrackId = "topik" | "kiip";

const cache: Partial<Record<TrackId, TrackData>> = {};

export async function getTrack(track: TrackId): Promise<TrackData> {
  const hit = cache[track];
  if (hit) return hit;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/public/images/track-${track}.json`);
  if (!res.ok) throw new Error(`track ${track} ${res.status}`);
  const data = (await res.json()) as TrackData;
  cache[track] = data;
  return data;
}

export function trackAudioUri(korean: string): string {
  const key = encodeURIComponent(korean).replace(/%/g, "");
  return `${SUPABASE_URL}/storage/v1/object/public/audio/vocab/${key}.mp3`;
}
