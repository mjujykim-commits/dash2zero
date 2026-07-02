/**
 * vocab — 670 어휘(뜻/발음 퀴즈용)를 content-manifest에서 로드 + 발음 URL.
 *
 * 각 단어: word_id / korean / romanization / gloss. 발음은 public 버킷 word/{word_id}.mp3.
 */

import { fetchContentManifest } from "./api";
import { SUPABASE_URL } from "./supabase";

export interface VocabWord {
  word_id: string;
  korean: string;
  romanization: string;
  gloss: string;
}

export interface VocabPack {
  pack_id: string;
  name: string;
  words: VocabWord[];
}

let cache: VocabWord[] | null = null;
let packCache: VocabPack[] | null = null;

/** 팩(주제)별로 묶은 어휘. 카테고리 선택 UI용. 단어 중복은 팩 간 유지(첫 등장 팩 기준 dedup). */
export async function getVocabPacks(): Promise<VocabPack[]> {
  if (packCache) return packCache;
  const manifest = await fetchContentManifest(0);
  const seen = new Set<string>();
  const packs: VocabPack[] = [];
  for (const p of manifest?.packs ?? []) {
    const words: VocabWord[] = [];
    for (const w of p.words) {
      if (seen.has(w.word_id)) continue;
      seen.add(w.word_id);
      words.push({
        word_id: w.word_id,
        korean: w.korean,
        romanization: w.romanization,
        gloss: w.gloss_short || w.gloss,
      });
    }
    if (words.length) packs.push({ pack_id: p.pack_id, name: p.name, words });
  }
  packCache = packs;
  return packs;
}

export async function getVocab(): Promise<VocabWord[]> {
  if (cache) return cache;
  const packs = await getVocabPacks();
  cache = packs.flatMap((p) => p.words);
  return cache;
}

export function vocabAudioUri(wordId: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/audio/word/${wordId}.mp3`;
}
