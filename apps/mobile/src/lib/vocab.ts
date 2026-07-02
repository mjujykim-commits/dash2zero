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

let cache: VocabWord[] | null = null;

export async function getVocab(): Promise<VocabWord[]> {
  if (cache) return cache;
  const manifest = await fetchContentManifest(0);
  const seen = new Set<string>();
  const words: VocabWord[] = [];
  for (const p of manifest?.packs ?? []) {
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
  }
  cache = words;
  return words;
}

export function vocabAudioUri(wordId: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/audio/word/${wordId}.mp3`;
}
