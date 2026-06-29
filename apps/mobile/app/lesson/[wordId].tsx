/**
 * Word Lesson — 4단계 (Notice → Hear → Meaning → Retrieve) × N 카드 chain
 *
 * Source of Truth:
 *   - DESIGN_DIRECTION §4: 정보 밀도 + 인터랙션 패턴
 *   - THEME_DECISIONS §4: SE 320pt 카드 레이아웃
 *   - CC2-25: 한글 최상위, 단일 컬럼, 하단 고정 CTA, 오디오 수동 재생 기본
 *   - PRD §4: 4단계 학습 루프, 신규 3단어 chain
 *   - USER_JOURNEYS J-001: 첫 학습 흐름
 *
 * M3 W15 갱신 (frontend):
 *   1. R-28 — STUB_WORD 단일 카드 → 실 lesson chain (3~10) 동작 (designer 권고)
 *   2. submitAttempt 응답 후 server SSoT 기준 SRS milestone emit (mastered/weak)
 *   3. PII (한글/RR/gloss) emit attrs 송신 금지
 *   4. lesson_abandoned 시 reason 명시 (designer R-28: 무료 한도 vs 사용자 이탈 구분)
 *
 * 책임 agent: frontend + designer (UI 안정성) + analytics (event 정합)
 */

import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, AppState, Pressable, ScrollView, Text, View } from "react-native";
import { lightColors, spacing, typeScale } from "@dash2zero/design-tokens";
import * as Crypto from "expo-crypto";
import { useLesson } from "@/src/hooks/useLesson";
import { submitAttempt } from "@/src/lib/api";
import {
  emitSrsMasteredLost,
  emitSrsMasteredReached,
  emitSrsWeakFlagged,
  logEvent,
  type SrsEventBaseProps,
} from "@/src/lib/analytics";
import { applySrsTransition, initialUserWordState, localDay04 } from "@/src/srs/leitner";
import { playAudio, stopAudio, prefetchAudio, clearAudioCache, type AudioState } from "@/src/lib/audio";
import { recordGuestAttempt, applyGuestSrs, bumpGuestDailyUsage } from "@/src/lib/guestStore";
import { enqueueRetryAttempt } from "@/src/lib/attemptQueue";
import { setLastCompletedWordId } from "@/src/lib/profile";
import { supabase } from "@/src/lib/supabase";
import { useResponsiveScale } from "@/src/hooks/useResponsiveScale";
import { useDelayedLoading } from "@/src/hooks/useDelayedLoading";
import {
  NeonButton,
  Shimmer,
  AudioButton,
  StageReveal,
  MorphingKoreanWord,
  QuizOption,
} from "@/src/components/d022";

type Stage = "notice" | "hear" | "meaning" | "retrieve";

const STAGE_ORDER: Stage[] = ["notice", "hear", "meaning", "retrieve"];

/** 단순 stage snapshot — server 응답 직전 client 추정. 정합 검증은 evaluator (SRS-051~). */
interface ClientSnapshot {
  stage: 1 | 2 | 3 | 4 | 5;
  weak: boolean;
  last_attempt_correct: boolean | null;
  last_attempt_at: Date | null;
}

const INITIAL_SNAPSHOT: ClientSnapshot = {
  stage: 1,
  weak: false,
  last_attempt_correct: null,
  last_attempt_at: null,
};

export default function WordLesson() {
  const params = useLocalSearchParams<{ wordId: string; chain?: string }>();
  const entryWordId = params.wordId;
  const chainLengthParam = params.chain ? Math.max(1, Math.min(15, Number(params.chain) || 3)) : undefined;
  const scale = useResponsiveScale();

  const { word, chain, cursor, total, advance, isLast, isLoading, error } = useLesson(entryWordId, chainLengthParam);

  const [stage, setStage] = useState<Stage>("notice");
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const [limitHint, setLimitHint] = useState<string | null>(null);

  // Quiz options를 카드별 1회만 shuffle — 정답이 첫 위치 고정되는 cheat 회피 (CC2-25 + R-28 정합)
  const shuffledOptions = useMemo(() => {
    if (!word) return [];
    return [...word.options_for_quiz].sort(() => Math.random() - 0.5);
  }, [word?.word_id]);

  // Per-card client snapshot (신규 단어 가정 — 실 fetch는 user_word_state까지 미통합, M4)
  const snapshotRef = useRef<ClientSnapshot>({ ...INITIAL_SNAPSHOT });

  // lesson_started — chain 진입 시 1회
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current && total > 0) {
      startedRef.current = true;
      void logEvent("lesson_started", {
        entry_word_id: entryWordId,
        chain_length: total,
      });
    }
  }, [entryWordId, total]);

  // lesson_abandoned — 백그라운드 5분 timeout (REVIEW_QA 1283-1285), 또는 manual back unmount
  // cursor/total은 ref로 추적 (stale closure 방지).
  const completedRef = useRef(false);
  const enteredAtRef = useRef(Date.now());
  const progressRef = useRef({ cursor: 0, total: 0 });
  // chain 내 stage 5 신규 도달 횟수 — Lesson Complete의 Mastered stat에 표시 (Task #82-b)
  const masteredInChainRef = useRef(0);
  // chain의 마지막 완료 word_id — useEntryWord에서 다음 학습 시작점으로 사용 (Task #82-c)
  const lastCompletedWordIdRef = useRef<string | null>(null);
  useEffect(() => {
    progressRef.current = { cursor, total };
  }, [cursor, total]);

  useEffect(() => {
    let bgTimer: ReturnType<typeof setTimeout> | null = null;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        bgTimer = setTimeout(() => {
          if (!completedRef.current) {
            void logEvent("lesson_abandoned", {
              reason: "background_timeout",
              cursor: progressRef.current.cursor,
              total: progressRef.current.total,
              duration_sec: Math.round((Date.now() - enteredAtRef.current) / 1000),
            });
            completedRef.current = true; // 중복 방지
          }
        }, 5 * 60 * 1000);
      } else if (state === "active" && bgTimer) {
        clearTimeout(bgTimer);
        bgTimer = null;
      }
    });
    return () => {
      if (bgTimer) clearTimeout(bgTimer);
      sub.remove();
      // unmount 시 미완료면 manual_back으로 분류 (designer R-28)
      if (!completedRef.current) {
        void logEvent("lesson_abandoned", {
          reason: "manual_back",
          cursor: progressRef.current.cursor,
          total: progressRef.current.total,
          duration_sec: Math.round((Date.now() - enteredAtRef.current) / 1000),
        });
      }
    };
  }, []);

  // 카드 전환 시 stage / 선택 초기화
  useEffect(() => {
    setStage("notice");
    setSelected(null);
    setSubmitted(false);
    snapshotRef.current = { ...INITIAL_SNAPSHOT };
  }, [cursor]);

  // 현재 카드 audio 즉시 prefetch (Hear 진입 latency 0) + 다음 카드 백그라운드 prefetch
  useEffect(() => {
    const current = chain[cursor];
    const next = chain[cursor + 1];
    if (current?.audio_url_word) {
      void prefetchAudio(current.audio_url_word);
    }
    if (next?.audio_url_word) {
      void prefetchAudio(next.audio_url_word);
    }
  }, [cursor, chain]);

  // chain unmount 시 audio cache 정리 — 메모리 보호
  useEffect(() => {
    return () => {
      void clearAudioCache();
    };
  }, []);

  function nextStage() {
    const idx = STAGE_ORDER.indexOf(stage);
    if (idx < STAGE_ORDER.length - 1) {
      setStage(STAGE_ORDER[idx + 1]!);
    }
  }

  async function playWordAudio() {
    if (!word?.audio_url_word) {
      // audio 없으면 stage 전환만 (Notice → Hear) — CC2-25 graceful fallback
      if (stage === "notice") setStage("hear");
      return;
    }
    setAudioState("loading");
    const res = await playAudio(word.audio_url_word);
    setAudioState(res.state);
    if (res.state !== "error" && stage === "notice") {
      setStage("hear");
    }
  }

  // Hear stage 진입 시 자동 재생 1회 (UX-NEW-006)
  useEffect(() => {
    if (stage === "hear" && word?.audio_url_word) {
      void (async () => {
        setAudioState("loading");
        const res = await playAudio(word.audio_url_word!);
        setAudioState(res.state);
      })();
    }
  }, [stage, word?.audio_url_word]);

  // unmount / 카드 전환 시 audio 중단
  useEffect(() => {
    return () => {
      void stopAudio();
    };
  }, [cursor]);

  async function handleSubmit() {
    if (!selected || !word || submitting) return;
    setSubmitted(true);
    setSubmitting(true);

    const correct = selected === word.korean;
    const occurred_at = new Date();
    const before = snapshotRef.current;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    // 게스트/인증 분기 (CC-04 + R-19 + USER_JOURNEYS J-002)
    const { data: sessionData } = await supabase.auth.getSession();
    const isAuthenticated = !!sessionData.session;

    // client_attempt_id를 호출 전에 고정 — retry queue가 같은 ID로 재시도 (idempotent)
    const clientAttemptId = Crypto.randomUUID();
    const requestPayload = {
      client_attempt_id: clientAttemptId,
      word_id: word.word_id,
      correct,
      content_version_at_attempt: 1, // M4: manifest current_version 결합
      occurred_at,
    };

    try {
      if (isAuthenticated) {
        // 인증 사용자: 서버 SSOT — submit-attempt Edge Function
        const res = await submitAttempt(requestPayload);

        const baseProps: SrsEventBaseProps = {
          word_id: word.word_id,
          pack_id: word.pack_id,
          triggered_by: word.is_new_word ? "lesson" : "review",
          local_day: localDay04(occurred_at, tz),
          stage_before: before.stage,
          stage_after: res.state.stage as 1 | 2 | 3 | 4 | 5,
          weak_before: before.weak,
          weak_after: res.state.weak,
          same_cycle: false,
        };

        const events = res.srs_events ?? [];
        for (const ev of events) {
          if (ev === "srs_mastered_reached") {
            masteredInChainRef.current += 1;
            await emitSrsMasteredReached(baseProps);
          } else if (ev === "srs_mastered_lost") await emitSrsMasteredLost(baseProps);
          else if (ev === "srs_weak_flagged") await emitSrsWeakFlagged(baseProps);
        }
        lastCompletedWordIdRef.current = word.word_id;

        if (res.paywall_required) {
          completedRef.current = true;
          void logEvent("lesson_abandoned", {
            reason: "free_limit_reached",
            cursor,
            total,
            duration_sec: Math.round((Date.now() - enteredAtRef.current) / 1000),
          });
          // 결제 성공 시 lesson에 복귀할 수 있도록 return_to 전달
          router.replace(`/paywall?return_to=${encodeURIComponent(`/lesson/${word.word_id}`)}`);
          return;
        }

        // daily_usage 기반 inline hint — 무료 한도 도달 직전 사용자에게 미리 알림 (conversion 강화)
        const used = res.daily_usage.new_words;
        const limit = res.daily_usage.limit_new_words;
        if (limit && used >= limit) {
          setLimitHint(`All ${limit} free words used today. Upgrade for 15.`);
        } else if (limit && used >= limit - 1) {
          setLimitHint(`1 free word left today.`);
        } else {
          setLimitHint(null);
        }

        snapshotRef.current = {
          stage: res.state.stage as 1 | 2 | 3 | 4 | 5,
          weak: res.state.weak,
          last_attempt_correct: correct,
          last_attempt_at: occurred_at,
        };
      } else {
        // 게스트 사용자: 로컬 SQLite + SecureStore (CC-04). 가입 시 머지 트리거.
        await recordGuestAttempt(word.word_id, correct, 1);

        // 게스트 일일 사용량 카운터 — 신규/리뷰 구분하여 home summary와 정합 (Task #83)
        const isFirstAttempt = before.last_attempt_at == null;
        await bumpGuestDailyUsage(
          isFirstAttempt ? "new_word_started" : "review_completed",
          tz,
        ).catch((e) => console.warn("[lesson] bumpGuestDailyUsage failed:", e));

        // 게스트 SRS 전이 계산 (client-side, leitner.applySrsTransition)
        const inputState =
          before.last_attempt_at == null
            ? initialUserWordState(occurred_at, tz)
            : {
                stage: before.stage,
                weak: before.weak,
                correct_count: 0, // 게스트 누적은 guestStore에서 관리
                incorrect_count: 0,
                last_attempt_at: before.last_attempt_at,
                last_attempt_correct: before.last_attempt_correct,
                next_due_at: occurred_at,
                mastered_at: null,
              };

        const next = applySrsTransition(inputState, { correct, occurred_at, timezone: tz });

        await applyGuestSrs(
          word.word_id,
          next.stage,
          next.weak,
          correct,
          occurred_at.toISOString(),
          next.next_due_at.toISOString(),
          1
        );

        // 게스트 milestone emit — server 권장 이벤트와 동일 schema (analytics는 동의 후만 발화)
        const stageReachedMastered = next.stage === 5 && before.stage !== 5;
        const stageLostMastered = before.stage === 5 && next.stage !== 5;
        const weakFlagged = !before.weak && next.weak;
        if (stageReachedMastered || stageLostMastered || weakFlagged) {
          const baseProps: SrsEventBaseProps = {
            word_id: word.word_id,
            pack_id: word.pack_id,
            triggered_by: word.is_new_word ? "lesson" : "review",
            local_day: localDay04(occurred_at, tz),
            stage_before: before.stage,
            stage_after: next.stage,
            weak_before: before.weak,
            weak_after: next.weak,
            same_cycle: false,
          };
          if (stageReachedMastered) {
            masteredInChainRef.current += 1;
            await emitSrsMasteredReached(baseProps);
          }
          if (stageLostMastered) await emitSrsMasteredLost(baseProps);
          if (weakFlagged) await emitSrsWeakFlagged(baseProps);
        }
        lastCompletedWordIdRef.current = word.word_id;

        snapshotRef.current = {
          stage: next.stage,
          weak: next.weak,
          last_attempt_correct: correct,
          last_attempt_at: occurred_at,
        };
      }
    } catch (err) {
      console.warn("[lesson] submit failed:", err);
      // 인증 사용자: SecureStore retry queue에 적재 (client_attempt_id stable → server idempotent)
      // 게스트: guestStore가 이미 적재 — sign-in 시 머지로 처리
      if (isAuthenticated) {
        try {
          await enqueueRetryAttempt(requestPayload);
        } catch (enqueueErr) {
          console.warn("[lesson] enqueue failed:", enqueueErr);
        }
      }
    } finally {
      setSubmitting(false);
    }

    // 800ms 후 다음 카드 또는 완료
    setTimeout(() => {
      if (!advance()) {
        // chain 마지막 — complete 화면
        completedRef.current = true;
        const masteredCount = masteredInChainRef.current;
        void logEvent("lesson_completed", {
          chain_length: total,
          duration_sec: Math.round((Date.now() - enteredAtRef.current) / 1000),
          mastered_in_chain: masteredCount,
        });
        // 다음 학습 시작점 저장 (Task #82-c) — 마지막 카드의 word_id를 기준점으로 SecureStore에 기록
        if (lastCompletedWordIdRef.current) {
          void setLastCompletedWordId(lastCompletedWordIdRef.current).catch((err) =>
            console.warn("[lesson] setLastCompletedWordId failed:", err),
          );
        }
        // 게스트 일일 lesson_completed 카운트 (Task #83 — home retention 정합)
        if (!isAuthenticated) {
          void bumpGuestDailyUsage("lesson_completed", tz).catch(() => undefined);
        }
        router.replace({
          pathname: "/lesson/complete",
          params: { completed: String(total), mastered: String(masteredCount) },
        });
      }
    }, 800);
  }

  // 로딩 — Work Order P0-4 (D-028) 정합: useDelayedLoading(150) — 짧은 fetch 깜빡임 회피
  const showLessonSkeleton = useDelayedLoading(isLoading);
  if (isLoading && showLessonSkeleton) {
    return (
      <View style={{ flex: 1, backgroundColor: lightColors["surface.bg"], padding: spacing["space.5"], paddingTop: spacing["space.12"] }}>
        {/* Top bar placeholders */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing["space.6"] }}>
          <Shimmer width={50} height={14} borderRadius={6} />
          <Shimmer width={90} height={14} borderRadius={6} />
          <Shimmer width={18} height={14} borderRadius={6} />
        </View>
        {/* Stage label */}
        <Shimmer width={80} height={11} borderRadius={5} style={{ marginTop: spacing["space.6"] }} />
        {/* Hero word */}
        <Shimmer width="70%" height={64} borderRadius={12} style={{ marginTop: spacing["space.5"] }} />
        {/* Gloss */}
        <Shimmer width="50%" height={20} borderRadius={6} style={{ marginTop: spacing["space.4"] }} />
        {/* Examples */}
        <Shimmer width="90%" height={16} borderRadius={6} style={{ marginTop: spacing["space.8"] }} />
        <Shimmer width="80%" height={16} borderRadius={6} style={{ marginTop: spacing["space.2"] }} />
        <View style={{ flex: 1 }} />
        {/* CTA */}
        <Shimmer height={56} borderRadius={14} />
      </View>
    );
  }

  // 에러 / 빈 chain
  if (error || !word) {
    return (
      <View style={{ flex: 1, backgroundColor: lightColors["surface.bg"], padding: spacing["space.5"], justifyContent: "center" }}>
        <Text style={{ fontSize: typeScale["text.body"].fontSize, color: lightColors["text.primary"], textAlign: "center" }}>
          Couldn't load lesson. Please try again.
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing["space.6"], alignSelf: "center" }}>
          <Text style={{ color: lightColors["neon.cyan"], fontWeight: "600" }}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const isLastStage = stage === "retrieve";

  return (
    <View style={{ flex: 1, backgroundColor: lightColors["surface.bg"] }}>
      {/* Top bar — Card progress + Report entry (CC2-15) */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing["space.5"],
          paddingTop: spacing["space.10"],
          paddingBottom: spacing["space.3"],
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Text style={{ color: lightColors["neon.cyan"], fontWeight: "600", fontSize: typeScale["text.body"].fontSize }}>
            ←
          </Text>
        </Pressable>
        <Text style={{ fontSize: typeScale["text.caption"].fontSize, color: lightColors["text.muted"] }}>
          Card {cursor + 1} of {total}
        </Text>
        <Pressable
          onPress={() => router.push(`/report/${encodeURIComponent(word.word_id)}`)}
          accessibilityLabel="Report this word"
          hitSlop={8}
        >
          <Text style={{ color: lightColors["text.muted"], fontSize: 20 }}>⚐</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing["space.5"], paddingTop: spacing["space.2"] }}>

        {/* Stage indicator (within card) */}
        <Text
          style={{
            fontSize: typeScale["text.caption"].fontSize,
            color: lightColors["text.muted"],
            textAlign: "center",
            marginBottom: spacing["space.6"],
          }}
        >
          Step {STAGE_ORDER.indexOf(stage) + 1} of {STAGE_ORDER.length}
        </Text>

        {/* Daily limit hint (D-018 conversion + CC-09 honest disclosure 정합) */}
        {limitHint && (
          <Pressable
            onPress={() => router.push(`/paywall?return_to=${encodeURIComponent(`/lesson/${word.word_id}`)}`)}
            accessibilityLabel="Upgrade to Premium"
            style={{
              alignSelf: "center",
              paddingHorizontal: spacing["space.4"],
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: "rgba(236,72,153,0.12)",
              borderWidth: 1,
              borderColor: lightColors["neon.pink"],
              marginBottom: spacing["space.5"],
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: lightColors["neon.pink"] }}>
              {limitHint}
            </Text>
          </Pressable>
        )}

        {/* 한글 hero — Work Order P0-1 (D-029): MorphingKoreanWord
           * Notice/Hear: tier="hero" (원본 크기)
           * Meaning/Retrieve: tier="tier-1-5" (scale 0.875, translateY -16 — 위쪽 후퇴) */}
        <MorphingKoreanWord
          tier={stage === "notice" || stage === "hear" ? "hero" : "tier-1-5"}
          style={{
            fontSize: scale.word,
            lineHeight: scale.word,
            fontWeight: typeScale["text.word"].weight,
            fontFamily: typeScale["text.word"].family,
            color: lightColors["korean.glyph"],
            textAlign: "center",
            marginBottom: spacing["space.4"],
          }}
        >
          {word.korean}
        </MorphingKoreanWord>

        {/* Audio button — Work Order P0-5 (D-028): AudioButton 컴포넌트 + ring expansion + pulse */}
        {(stage === "notice" || stage === "hear" || stage === "meaning") && (
          <View style={{ marginBottom: spacing["space.6"] }}>
            <AudioButton
              state={audioState}
              onPress={playWordAudio}
              accessibilityLabel={`Play pronunciation for ${word.korean}`}
            />
          </View>
        )}

        {/* Meaning 단계: RR + gloss + example — Work Order P0-1 (D-029) StageReveal stagger
           * 60ms × delayIndex 지연으로 fade-up 등장. stageKey는 cursor 변경 시 새 카드 entrance 재실행 */}
        {(stage === "meaning" || stage === "retrieve") && (
          <View style={{ alignItems: "center" }}>
            <StageReveal stageKey={`${cursor}-rr`} delayIndex={0}>
              <Text
                style={{
                  fontSize: typeScale["text.romanization"].fontSize,
                  color: lightColors["text.muted"],
                  marginBottom: spacing["space.3"],
                  textAlign: "center",
                }}
              >
                {word.romanization}
              </Text>
            </StageReveal>
            <StageReveal stageKey={`${cursor}-gloss`} delayIndex={1}>
              <Text
                style={{
                  fontSize: typeScale["text.gloss"].fontSize,
                  lineHeight: typeScale["text.gloss"].lineHeight,
                  color: lightColors["text.primary"],
                  marginBottom: spacing["space.6"],
                  textAlign: "center",
                }}
              >
                {word.gloss}
              </Text>
            </StageReveal>
            {word.example_ko && (
              <StageReveal stageKey={`${cursor}-ex-ko`} delayIndex={2}>
                <Text
                  accessibilityLanguage="ko"
                  style={{ fontSize: 18, color: lightColors["text.primary"], textAlign: "center" }}
                >
                  {word.example_ko}
                </Text>
              </StageReveal>
            )}
            {word.example_en && (
              <StageReveal stageKey={`${cursor}-ex-en`} delayIndex={3}>
                <Text
                  style={{
                    fontSize: 16,
                    color: lightColors["text.secondary"],
                    fontStyle: "italic",
                    marginTop: spacing["space.1"],
                    textAlign: "center",
                  }}
                >
                  {word.example_en}
                </Text>
              </StageReveal>
            )}
          </View>
        )}

        {/* Retrieve 단계: 객관식 4지선다 */}
        {stage === "retrieve" && (
          <View style={{ marginTop: spacing["space.8"] }}>
            <Text
              style={{
                fontSize: typeScale["text.heading.sm"].fontSize,
                fontWeight: typeScale["text.heading.sm"].weight,
                marginBottom: spacing["space.4"],
                textAlign: "center",
              }}
            >
              Which one is "{word.gloss}"?
            </Text>
            {/* Work Order P0-2 (D-029): ChoiceCard → QuizOption 완전 교체
               * - 카드 본체 shake (오답) + ✓/✕ icon spring scale-in
               * - Haptic Success/Warning/Light 내장
               * - 정/오답 판정 + 800ms 후 advance는 lesson screen 책임 유지
               * - StageReveal stagger 60ms × i — Work Order §3.2 (3) */}
            {shuffledOptions.map((opt, i) => {
              const isCorrectOpt = opt === word.korean;
              const isSelected = selected === opt;
              // L-M5-001 (D-032 봉인 2026-06-02): 오답 선택 시 정답 카드를 "correct-passive"로 노출
              // — Karpicke & Roediger 2008 인출 학습 표준 정합. 정답 카드는 glow만, ✓ icon/haptic 없음.
              const state = !submitted
                ? isSelected
                  ? "selected"
                  : "default"
                : isSelected
                  ? isCorrectOpt
                    ? "correct"
                    : "incorrect"
                  : isCorrectOpt
                    ? "correct-passive"
                    : "default";
              return (
                <StageReveal key={opt} stageKey={`${cursor}-opt-${i}`} delayIndex={i}>
                  <QuizOption
                    label={opt}
                    state={state}
                    onPress={() => !submitted && setSelected(opt)}
                    disabled={submitted}
                  />
                </StageReveal>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom fixed CTA */}
      <View
        style={{
          paddingHorizontal: spacing["space.5"],
          paddingBottom: spacing["space.6"],
          paddingTop: spacing["space.4"],
          backgroundColor: lightColors["surface.bg"],
        }}
      >
        <NeonButton
          label={isLastStage ? (submitting ? "Submitting…" : isLast ? "Finish" : "Next card →") : "Continue"}
          onPress={isLastStage ? handleSubmit : nextStage}
          disabled={(isLastStage && !selected) || submitting}
        />
      </View>
    </View>
  );
}


