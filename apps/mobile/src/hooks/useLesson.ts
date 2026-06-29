/**
 * useLesson — 단어 lesson 데이터 (실 fetch + offline cache)
 *
 * 데이터 흐름:
 *   1. content-manifest fetch (게스트도 가능, free pack)
 *   2. word_id로 실제 lesson chain (3~10 단어) 구성 — designer R-28 (M3 W15)
 *   3. distractors는 같은 pack 내에서 무작위 3개 (chain 내 다른 단어 우선 활용)
 *
 * 책임 agent: frontend
 *
 * R-28 (designer 권고, 2026-05-11):
 *   기존 STUB_WORD 단일 카드만 동작 → baseline lesson_complete_rate 측정 무의미.
 *   chain으로 교체. complete 화면 진입은 chain 마지막 카드 후에만.
 *
 * 알려진 한계 (M2-S7 보강):
 *   - 게스트 모드 SQLite 캐시 미구현 (현재는 매 fetch)
 *   - signed URL 만료 시 자동 재요청 미구현
 *   - chain 길이 결정은 MVP 휴리스틱 (entry word + 같은 pack 다음 N개) — 실 SRS scheduler는 M4
 */

import { useEffect, useState } from "react";
import { fetchContentManifest, fetchAudioUrls, type ContentManifestResponse } from "@/src/lib/api";

export interface LessonWord {
  word_id: string;
  pack_id: string;
  korean: string;
  romanization: string;
  gloss: string;
  example_ko: string | null;
  example_en: string | null;
  audio_url_word: string | null;
  audio_url_example: string | null;
  options_for_quiz: string[]; // [정답, distractor1, distractor2, distractor3] (shuffle은 화면에서)
  is_new_word: boolean;
}

export interface UseLessonResult {
  /** chain 전체 */
  chain: LessonWord[];
  /** 현재 카드 (편의용) */
  word: LessonWord | null;
  /** 현재 인덱스 (0-based) */
  cursor: number;
  /** chain 길이 */
  total: number;
  /** 다음 카드로 진행. 마지막이면 false 반환. */
  advance: () => boolean;
  /** 마지막 카드 여부 */
  isLast: boolean;
  isLoading: boolean;
  error: Error | null;
}

// 단순 in-memory 캐시 — 같은 manifest 재요청 회피
let manifestCache: ContentManifestResponse | null = null;

/** chain 길이 휴리스틱 (R-28 baseline 측정용 — MVP).
 *  Premium scheduler는 M4. */
const DEFAULT_CHAIN_LENGTH = 3; // PRD §4 "신규 3단어 루프" 기본
const MAX_CHAIN_LENGTH = 15; // PRD: 무료 10 / premium up to 15 — 안전 상한

export function useLesson(wordId: string | undefined, chainLength: number = DEFAULT_CHAIN_LENGTH): UseLessonResult {
  const [chain, setChain] = useState<LessonWord[]>([]);
  const [cursor, setCursor] = useState(0);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!wordId) {
      setChain([]);
      setCursor(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      setCursor(0);
      try {
        const manifest =
          manifestCache ?? (await fetchContentManifest(0));
        if (manifest) manifestCache = manifest;

        // entry word가 속한 pack 찾기 + chain 구성
        let entryPack: ContentManifestResponse["packs"][number] | null = null;
        let entryIdx = -1;

        for (const pack of manifest?.packs ?? []) {
          const idx = pack.words.findIndex((w) => w.word_id === wordId);
          if (idx >= 0) {
            entryPack = pack;
            entryIdx = idx;
            break;
          }
        }

        if (!entryPack || entryIdx < 0) throw new Error("word_not_found");

        // chain = entry word부터 같은 pack에서 순서대로 N개 (pack 끝이면 wrap 안 함, 짧아도 OK)
        const desired = Math.min(Math.max(1, chainLength), MAX_CHAIN_LENGTH);
        const slice = entryPack.words.slice(entryIdx, entryIdx + desired);

        // distractor pool — chain 외 같은 pack 단어들 (chain 내부 단어로 distractor 만들지 않음)
        const distractorPool = entryPack.words.filter(
          (w) => !slice.some((s) => s.word_id === w.word_id)
        );

        const built: LessonWord[] = slice.map((found) => {
          const shuffled = [...distractorPool].sort(() => Math.random() - 0.5).slice(0, 3);
          return {
            word_id: found.word_id,
            pack_id: entryPack!.pack_id,
            korean: found.korean,
            romanization: found.romanization,
            gloss: found.gloss,
            example_ko: found.example_ko,
            example_en: found.example_en,
            audio_url_word: null,
            audio_url_example: null,
            options_for_quiz: [found.korean, ...shuffled.map((w) => w.korean)],
            is_new_word: true,
          };
        });

        // audio URL fetch — chain 전체 한 번에 (네트워크 round-trip 절약)
        const audioIds = built.flatMap((w) => [`a-${w.word_id}-word`, `a-${w.word_id}-example`]);
        try {
          const audioRes = await fetchAudioUrls(audioIds);
          for (const w of built) {
            w.audio_url_word = audioRes.urls[`a-${w.word_id}-word`]?.url ?? null;
            w.audio_url_example = audioRes.urls[`a-${w.word_id}-example`]?.url ?? null;
          }
        } catch {
          // audio 실패는 lesson 차단하지 않음 (수동 재생 기본 — CC2-25)
        }

        if (!cancelled) {
          setChain(built);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }
    void run();

    return () => {
      cancelled = true;
    };
  }, [wordId, chainLength]);

  const word = chain[cursor] ?? null;
  const total = chain.length;
  const isLast = total > 0 && cursor === total - 1;

  function advance(): boolean {
    if (cursor < total - 1) {
      setCursor((c) => c + 1);
      return true;
    }
    return false;
  }

  return { chain, word, cursor, total, advance, isLast, isLoading, error };
}

/** 게스트 머지 트리거 — 가입 직후 호출 */
export async function triggerGuestMergeIfNeeded(deviceInstallId: string, guestAttempts: any[]): Promise<void> {
  if (!guestAttempts.length) return;
  const { mergeGuestData } = await import("@/src/lib/api");
  try {
    const result = await mergeGuestData({
      device_install_id: deviceInstallId,
      guest_attempts: guestAttempts.map((a) => ({
        client_attempt_id: a.client_attempt_id,
        word_id: a.word_id,
        correct: a.correct,
        question_template_id: a.question_template_id ?? null,
        content_version_at_attempt: a.content_version_at_attempt,
        occurred_at: a.occurred_at,
      })),
    });
    console.log(`[merge] ${result.merged_attempts} attempts, ${result.conflicts.length} conflicts`);
  } catch (err) {
    console.warn("[merge] failed:", err);
  }
}
