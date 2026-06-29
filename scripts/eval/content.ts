/**
 * Content Evaluator — dash2zero harness (ADR-0003)
 *
 * 분류:
 *   - starter_meta: Starter Pack 60단어 각 word의 필수 필드 존재 (korean / romanization / gloss / example_ko / example_en / distractors_candidate ≥ 3)
 *   - starter_count: pack 합계가 정확히 60단어
 *   - distractors_unique: distractors_candidate가 word 자체를 포함하지 않고 중복도 없음
 *   - audio_length: audio_length_sec 범위 (0.5~2.5s) — Starter Pack TTS 결과 검증 (CC3-07)
 *   - retire_410: retired_at != null인 word_id fetch 시 410 Gone (CC2-15 + Q-CO-DOC-003)
 *   - report_5_categories: 신고 카테고리는 5개 한정 (incorrect / inappropriate / audio_broken / typo / other)
 *
 * 정합성: fixtures/seeded/words/starter-pack-candidates.yaml + DB words 테이블 schema
 * 책임 agent: content + analytics
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

export interface ContentCase {
  id: string;
  description: string;
  category:
    | "starter_meta"
    | "starter_count"
    | "distractors_unique"
    | "audio_length"
    | "retire_410"
    | "report_5_categories";
  input: {
    pack_path?: string;
    word_id?: string;
    audio_length_sec?: number;
    retired_at?: string | null;
    report_category?: string;
  };
  expected: {
    all_words_valid?: boolean;
    word_count?: number;
    distractors_clean?: boolean;
    audio_in_range?: boolean;
    http_status?: number;
    category_allowed?: boolean;
  };
}

export interface EvalResult {
  pass: boolean;
  diff: string[];
}

const REQUIRED_WORD_FIELDS = [
  "word_id", "korean", "romanization", "gloss",
  "example_ko", "example_en", "distractors_candidate",
];
const AUDIO_MIN_SEC = 0.5;
const AUDIO_MAX_SEC = 2.5;
const ALLOWED_REPORT_CATEGORIES = new Set([
  "incorrect", "inappropriate", "audio_broken", "typo", "other",
]);

function check(field: string, actual: unknown, expected: unknown, diff: string[]): void {
  if (expected === undefined) return;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    diff.push(`${field}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
  }
}

interface StarterPack {
  pack_id: string;
  target_count: number;
  words: Array<Record<string, unknown>>;
}

function loadPack(path: string): StarterPack {
  const raw = readFileSync(join(process.cwd(), path), "utf-8");
  return parseYaml(raw) as StarterPack;
}

export function evaluateContentCase(c: ContentCase): EvalResult {
  const diff: string[] = [];
  const i = c.input;

  switch (c.category) {
    case "starter_meta": {
      if (!i.pack_path) {
        diff.push("pack_path required");
        break;
      }
      const pack = loadPack(i.pack_path);
      const allValid = pack.words.every((w) =>
        REQUIRED_WORD_FIELDS.every((field) => {
          const v = w[field];
          if (v === undefined || v === null || v === "") return false;
          if (field === "distractors_candidate") {
            return Array.isArray(v) && (v as unknown[]).length >= 3;
          }
          return true;
        })
      );
      check("all_words_valid", allValid, c.expected.all_words_valid, diff);
      break;
    }

    case "starter_count": {
      if (!i.pack_path) {
        diff.push("pack_path required");
        break;
      }
      const pack = loadPack(i.pack_path);
      check("word_count", pack.words.length, c.expected.word_count, diff);
      break;
    }

    case "distractors_unique": {
      if (!i.pack_path) {
        diff.push("pack_path required");
        break;
      }
      const pack = loadPack(i.pack_path);
      const clean = pack.words.every((w) => {
        const distractors = (w.distractors_candidate as string[] | undefined) ?? [];
        const korean = w.korean as string;
        // 1. 자신을 distractor에 포함하면 안 됨
        if (distractors.includes(korean)) return false;
        // 2. distractors 사이 중복 없음
        return new Set(distractors).size === distractors.length;
      });
      check("distractors_clean", clean, c.expected.distractors_clean, diff);
      break;
    }

    case "audio_length": {
      if (typeof i.audio_length_sec !== "number") {
        diff.push("audio_length_sec required");
        break;
      }
      const inRange =
        i.audio_length_sec >= AUDIO_MIN_SEC && i.audio_length_sec <= AUDIO_MAX_SEC;
      check("audio_in_range", inRange, c.expected.audio_in_range, diff);
      break;
    }

    case "retire_410": {
      const httpStatus = i.retired_at ? 410 : 200;
      check("http_status", httpStatus, c.expected.http_status, diff);
      break;
    }

    case "report_5_categories": {
      const allowed = i.report_category
        ? ALLOWED_REPORT_CATEGORIES.has(i.report_category)
        : false;
      check("category_allowed", allowed, c.expected.category_allowed, diff);
      break;
    }
  }

  return { pass: diff.length === 0, diff };
}
