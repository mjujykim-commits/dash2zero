/**
 * useEntryWord — lesson 진입 word_id 해석
 *
 * Home "Start →" 버튼이 어떤 word_id로 lesson chain을 시작할지 결정.
 *
 * MVP 정책 (PRD §4 + USER_JOURNEYS J-002):
 *   - 신규 사용자: free pack(starter) 첫 단어
 *   - 진행 중인 사용자: SecureStore last_completed_word_id 다음 단어 (Task #82-c)
 *   - free pack 끝까지 완료한 경우: 다시 첫 단어로 복귀 (M4 SRS scheduler에서 due review로 교체)
 *
 * 본 hook은 content manifest를 fetch하여 first word_id를 client-side로 결정.
 * 향후 (M4): server `get_next_words` RPC가 SRS scheduler 결과를 반환하면 그것으로 교체.
 *
 * 책임 agent: frontend
 */

import { useEffect, useState } from "react";
import { fetchContentManifest, type ContentManifestResponse } from "@/src/lib/api";
import { getLastCompletedWordId } from "@/src/lib/profile";

// 단순 in-memory 캐시 — useLesson과 별도 (api transport 캐시는 의도적으로 hook 외부 유지)
let manifestCache: ContentManifestResponse | null = null;

export interface UseEntryWordResult {
  wordId: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useEntryWord(): UseEntryWordResult {
  const [wordId, setWordId] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const manifest = manifestCache ?? (await fetchContentManifest(0));
        if (manifest) manifestCache = manifest;

        // 신규 사용자 (M3 MVP): free pack(tier=starter) 첫 단어
        const freePack = (manifest?.packs ?? []).find((p) => p.tier === "starter");
        const words = freePack?.words ?? [];

        // SecureStore의 last_completed_word_id 다음 단어로 시작 (Task #82-c)
        const lastId = await getLastCompletedWordId();
        let next: { word_id: string } | undefined;
        if (lastId) {
          const idx = words.findIndex((w) => w.word_id === lastId);
          if (idx >= 0 && idx + 1 < words.length) {
            next = words[idx + 1];
          }
          // 마지막 단어를 이미 끝낸 경우 또는 lastId가 manifest에 없는 경우 — 첫 단어로 폴백
        }
        if (!next) next = words[0];

        if (!cancelled) {
          setWordId(next?.word_id ?? null);
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
  }, []);

  return { wordId, isLoading, error };
}
