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

export function trackPhotoUri(korean: string): string {
  const key = encodeURIComponent(korean).replace(/%/g, "");
  return `${SUPABASE_URL}/storage/v1/object/public/images/track/${key}.jpg`;
}

export interface TrackPhotoCredit { author: string; source: string; title: string; quiz?: boolean }

export interface TrackExample {
  examples: { ko: string; en: string }[];
  sentence: { ko: string; en: string } | null;
}

// 문맥 빈칸(cloze) 학습용: 한국어 문장에서 blank(표면형)를 가리고 채우기
export interface TrackCloze {
  blank: string; // 한국어 문장에서 가릴 정답 표면형
  ko: string; // 한국어 문장(정답 포함)
  en: string; // 영어 번역
  situation?: string; // 상황(영어, 선택)
  distractors?: string[]; // 큐레이션 오답(한국어 표면형, 선택) — 없으면 풀에서 생성
}

let photoCache: Record<string, TrackPhotoCredit> | null = null;
let exampleCache: Record<string, TrackExample> | null = null;
let clozeCache: Record<string, TrackCloze> | null = null;

/** 문맥 빈칸 학습 데이터 (korean → cloze). 아직 없으면 {}. */
export async function getTrackCloze(): Promise<Record<string, TrackCloze>> {
  if (clozeCache) return clozeCache;
  try {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/public/images/track-cloze.json?t=${Date.now()}`);
    clozeCache = r.ok ? ((await r.json()) as Record<string, TrackCloze>) : {};
  } catch {
    clozeCache = {};
  }
  return clozeCache;
}

/** 단어별 예시어/예문 (Study 학습 보조). 아직 생성 전이면 {}. */
export async function getTrackExamples(): Promise<Record<string, TrackExample>> {
  if (exampleCache) return exampleCache;
  try {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/public/images/track-examples.json?t=${Date.now()}`);
    exampleCache = r.ok ? ((await r.json()) as Record<string, TrackExample>) : {};
  } catch {
    exampleCache = {};
  }
  return exampleCache;
}

/** 사진이 있는 단어(korean) → 크레딧. 실패 시 {}. */
export async function getTrackPhotos(): Promise<Record<string, TrackPhotoCredit>> {
  if (photoCache) return photoCache;
  try {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/public/images/track-photos.json?t=${Date.now()}`);
    photoCache = r.ok ? ((await r.json()) as Record<string, TrackPhotoCredit>) : {};
  } catch {
    photoCache = {};
  }
  return photoCache;
}
