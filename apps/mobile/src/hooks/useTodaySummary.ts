/**
 * useTodaySummary — Home 화면 데이터
 *
 * Edge Function `get_today_summary` RPC 호출 후 swr 패턴.
 * 게스트 사용자는 로컬 SQLite에서 직접 계산 (Task #83 — CC-04 정합).
 *
 * 무료 한도 정책 (D-018 / 06_feature_spec §authenticated_free):
 *   - 인증 free / guest 공통: 일일 3 신규 단어
 *   - Premium 분기는 server 측 SSOT에서 결정 (게스트는 항상 free 한도)
 */

import { useCallback, useEffect, useState } from "react";
import { fetchTodaySummary, type TodaySummary } from "@/src/lib/api";
import { supabase } from "@/src/lib/supabase";
import { computeGuestTodaySummary } from "@/src/lib/guestStore";

/** D-018 / authenticated_free 정합 — 게스트는 free 한도 동일. */
const GUEST_FREE_DAILY_NEW = 3;

export interface UseTodaySummaryResult {
  data: TodaySummary | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTodaySummary(): UseTodaySummaryResult {
  const [data, setData] = useState<TodaySummary | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchSeed, setRefetchSeed] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;

        if (!userId) {
          // Guest mode — guestStore SQLite 집계 (Task #83)
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
          const summary = await computeGuestTodaySummary(tz, GUEST_FREE_DAILY_NEW);
          if (!cancelled) {
            setData({
              new_words_remaining: summary.new_words_remaining,
              reviews_due: summary.reviews_due,
              streak_days: summary.streak_days,
              mastered_count: summary.mastered_count,
              is_premium: false,
            });
            setLoading(false);
          }
          return;
        }

        const summary = await fetchTodaySummary(userId);
        if (!cancelled) {
          setData(summary);
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
  }, [refetchSeed]);

  const refetch = useCallback(() => setRefetchSeed((s) => s + 1), []);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
