/**
 * useWordProgress — 사용자 학습 진행 상황 (mastered + weak words)
 *
 * 게스트: 로컬 SQLite `guest_uws` query
 * 인증: RPC `get_word_progress` (M4 W17 backend 신설 예정 — 현재는 stub fallback)
 *
 * 진입처: app/progress.tsx (Settings → "Your progress")
 *
 * 책임 agent: frontend + backend (RPC 신설 시점에 정합)
 */

import { useCallback, useEffect, useState } from "react";
import * as SQLite from "expo-sqlite";

import { fetchContentManifest, type ContentManifestResponse } from "@/src/lib/api";
import { supabase } from "@/src/lib/supabase";

export interface WordProgressItem {
  word_id: string;
  korean: string;
  romanization: string;
  gloss: string;
  stage: 1 | 2 | 3 | 4 | 5;
  weak: boolean;
  mastered_at: string | null;
  last_attempt_at: string | null;
}

export interface UseWordProgressResult {
  mastered: WordProgressItem[];
  weak: WordProgressItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface GuestUwsRow {
  word_id: string;
  stage: number;
  weak: number;
  last_attempt_at: string | null;
  mastered_at: string | null;
}

/**
 * 게스트 SQLite query — 직접 join 불가 (manifest는 client API에서만 옴) → in-memory join.
 */
async function loadGuestProgress(): Promise<WordProgressItem[]> {
  const db = await SQLite.openDatabaseAsync("dash2zero-guest.db");
  const rows = await db.getAllAsync<GuestUwsRow>(
    `SELECT word_id, stage, weak, last_attempt_at, mastered_at
       FROM guest_uws
      WHERE last_attempt_at IS NOT NULL
      ORDER BY last_attempt_at DESC`
  );

  // manifest와 join (in-memory)
  const manifest = await fetchContentManifest(0).catch(() => null);
  const wordMap = new Map<string, ContentManifestResponse["packs"][number]["words"][number]>();
  for (const pack of manifest?.packs ?? []) {
    for (const w of pack.words) wordMap.set(w.word_id, w);
  }

  return rows
    .map((r) => {
      const w = wordMap.get(r.word_id);
      if (!w) return null; // manifest에서 사라진 단어 (retired) — 표시 제외
      return {
        word_id: r.word_id,
        korean: w.korean,
        romanization: w.romanization,
        gloss: w.gloss,
        stage: (r.stage as 1 | 2 | 3 | 4 | 5) ?? 1,
        weak: r.weak === 1,
        mastered_at: r.mastered_at,
        last_attempt_at: r.last_attempt_at,
      } satisfies WordProgressItem;
    })
    .filter((x): x is WordProgressItem => x !== null);
}

/**
 * 인증 사용자 — get_word_progress RPC.
 * M4 W17 신설 예정. 현재는 빈 결과 stub.
 */
async function loadAuthProgress(_userId: string): Promise<WordProgressItem[]> {
  try {
    const { data, error } = await supabase.rpc("get_word_progress");
    if (error) throw error;
    if (!Array.isArray(data)) return [];
    return data.map((row: WordProgressItem & { last_attempt_at?: string | null }) => ({
      word_id: row.word_id,
      korean: row.korean,
      romanization: row.romanization,
      gloss: row.gloss,
      stage: row.stage,
      weak: row.weak,
      mastered_at: row.mastered_at,
      last_attempt_at: row.last_attempt_at ?? null,
    }));
  } catch {
    // RPC 미구현 (M4 이전) — 빈 배열 fallback. 사용자에게 "Sign in to see progress" 표기는 호출자 책임 외.
    return [];
  }
}

export function useWordProgress(): UseWordProgressResult {
  const [items, setItems] = useState<WordProgressItem[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user.id;
        const list = userId
          ? await loadAuthProgress(userId)
          : await loadGuestProgress();
        if (!cancelled) {
          setItems(list);
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
  }, [seed]);

  const refetch = useCallback(() => setSeed((s) => s + 1), []);

  const mastered = items.filter((x) => x.stage === 5 && !x.weak);
  const weak = items.filter((x) => x.weak);

  return { mastered, weak, isLoading, error, refetch };
}
