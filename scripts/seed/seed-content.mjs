#!/usr/bin/env node
/**
 * 콘텐츠 seed 생성기 (의존성 0) — fixtures YAML → 멱등 SQL
 *
 * 목적: fixtures/seeded/words/*.yaml 의 590단어를 Supabase DB(0001~0004 마이그레이션 적용 후)에
 *       적재하는 단일 SQL 파일을 생성한다. content-manifest Edge Function이 단어를 반환하려면
 *       words / word_translations / word_packs / word_pack_members / distractors / content_manifests가
 *       모두 채워져야 한다 (특히 content_manifests가 비면 함수가 빈 packs를 반환).
 *
 * 사용:
 *   node scripts/seed/seed-content.mjs
 *   → infra/supabase/seed/0010_content_seed.sql 생성
 *   → Supabase SQL Editor에 붙여넣거나: supabase db execute --file infra/supabase/seed/0010_content_seed.sql
 *
 * 설계 노트:
 *   - tier 매핑: starter→starter, core/monthly/premium→premium (pack_tier_enum은 2종뿐).
 *   - gloss_short: fixtures에 없음 → gloss에서 괄호주석 제거 + 최대 5단어로 파생.
 *   - distractors_candidate(한국어 문자열) → 전역 korean→word_id 맵으로 해석, 미해석은 skip.
 *     임베딩 파이프라인 부재 → distance_score는 상수 0.50 placeholder (개인 빌드 충분, GA 전 재계산 권고).
 *   - is_free_sample: premium 계열 pack의 앞 10단어 true (CC3-01 free preview pool). starter는 전체 무료라 무관.
 *   - 멱등: 전부 ON CONFLICT ... DO UPDATE/NOTHING.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseAllPacks, tierMap } from "../lib/parse-fixtures.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const FIX_DIR = path.join(ROOT, "fixtures", "seeded", "words");
const OUT_DIR = path.join(ROOT, "infra", "supabase", "seed");
const OUT_FILE = path.join(OUT_DIR, "0010_content_seed.sql");
const LOCALE = "en-US";
const FREE_SAMPLE_COUNT = 10;

// ---- SQL 헬퍼 ----
const q = (v) => (v == null || v === "" ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
function glossShort(gloss) {
  const noParen = gloss.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  const words = noParen.split(" ");
  return (words.length > 5 ? words.slice(0, 5).join(" ") : noParen) || gloss;
}

// ---- 파싱 (공용 파서) ----
const { packs, koreanToWordId, totalWords } = parseAllPacks(FIX_DIR);

// ---- SQL 생성 ----
const L = [];
L.push("-- dash2zero 콘텐츠 seed (자동 생성: scripts/seed/seed-content.mjs)");
L.push(`-- 생성 대상: ${packs.length} packs, ${totalWords} words, locale=${LOCALE}`);
L.push("-- 전제: 0001~0004 마이그레이션 적용 완료. 멱등(ON CONFLICT) — 재실행 안전.");
L.push("BEGIN;");
L.push("");

// 1) word_packs
L.push("-- 1. word_packs");
for (const p of packs) {
  L.push(
    `INSERT INTO word_packs (pack_id, name, tier, monthly_release_at, version) VALUES ` +
    `(${q(p.pack_id)}, ${q(p.name)}, ${q(tierMap(p.tierRaw))}, ${p.monthly_release_at ? q(p.monthly_release_at) : "NULL"}, 1) ` +
    `ON CONFLICT (pack_id) DO UPDATE SET name=EXCLUDED.name, tier=EXCLUDED.tier, monthly_release_at=EXCLUDED.monthly_release_at;`
  );
}
L.push("");

// 2) words + 3) word_translations + 4) word_pack_members
L.push("-- 2. words / 3. word_translations / 4. word_pack_members");
for (const p of packs) {
  p.words.forEach((w, i) => {
    L.push(
      `INSERT INTO words (word_id, korean, romanization, content_version) VALUES ` +
      `(${q(w.word_id)}, ${q(w.korean)}, ${q(w.romanization)}, 1) ON CONFLICT (word_id) DO UPDATE SET korean=EXCLUDED.korean, romanization=EXCLUDED.romanization;`
    );
    L.push(
      `INSERT INTO word_translations (word_id, locale, gloss, gloss_short, example_ko, example_en, content_version) VALUES ` +
      `(${q(w.word_id)}, ${q(LOCALE)}, ${q(w.gloss)}, ${q(glossShort(w.gloss || ""))}, ${q(w.example_ko)}, ${q(w.example_en)}, 1) ` +
      `ON CONFLICT (word_id, locale) DO UPDATE SET gloss=EXCLUDED.gloss, gloss_short=EXCLUDED.gloss_short, example_ko=EXCLUDED.example_ko, example_en=EXCLUDED.example_en;`
    );
    const isFree = tierMap(p.tierRaw) === "premium" && i < FREE_SAMPLE_COUNT;
    L.push(
      `INSERT INTO word_pack_members (pack_id, word_id, sort_order, is_free_sample) VALUES ` +
      `(${q(p.pack_id)}, ${q(w.word_id)}, ${i}, ${isFree ? "TRUE" : "FALSE"}) ` +
      `ON CONFLICT (pack_id, word_id) DO UPDATE SET sort_order=EXCLUDED.sort_order, is_free_sample=EXCLUDED.is_free_sample;`
    );
  });
}
L.push("");

// 5) distractors (한국어 candidate → word_id 해석)
L.push("-- 5. distractors (distance_score=0.50 placeholder — 임베딩 부재, GA 전 재계산 권고)");
let distRows = 0, distSkipped = 0;
for (const p of packs) {
  for (const w of p.words) {
    const cands = Array.isArray(w.distractors_candidate) ? w.distractors_candidate : [];
    for (const ko of cands) {
      const did = koreanToWordId.get(ko);
      if (!did || did === w.word_id) { distSkipped++; continue; }
      L.push(
        `INSERT INTO distractors (word_id, distractor_word_id, distance_score, content_version) VALUES ` +
        `(${q(w.word_id)}, ${q(did)}, 0.50, 1) ON CONFLICT (word_id, distractor_word_id) DO NOTHING;`
      );
      distRows++;
    }
  }
}
L.push("");

// 6) content_manifests (1 row/pack — 없으면 content-manifest 함수가 빈 packs 반환)
L.push("-- 6. content_manifests (Edge Function이 단어를 반환하기 위한 필수 버전 행)");
packs.forEach((p, idx) => {
  L.push(
    `INSERT INTO content_manifests (manifest_version, pack_id, pack_version, content_hash, words_diff) VALUES ` +
    `(${idx + 1}, ${q(p.pack_id)}, 1, ${q("seed-" + p.pack_id)}, '{}'::jsonb) ` +
    `ON CONFLICT (manifest_version) DO UPDATE SET pack_id=EXCLUDED.pack_id, pack_version=EXCLUDED.pack_version, content_hash=EXCLUDED.content_hash;`
  );
});
L.push("");
L.push("COMMIT;");
L.push("");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, L.join("\n"), "utf8");

console.log(`✅ seed SQL 생성: ${path.relative(ROOT, OUT_FILE)}`);
console.log(`   packs=${packs.length}  words=${totalWords}  distractors=${distRows} (skip ${distSkipped})  manifests=${packs.length}`);
console.log(`   packs 상세: ${packs.map((p) => `${p.pack_id}(${p.words.length},${tierMap(p.tierRaw)})`).join(", ")}`);
