#!/usr/bin/env node
/**
 * 콘텐츠 seed (PostgREST 벌크 upsert) — db push 대용량 마이그레이션이 부분적용된 케이스의 신뢰성 대안.
 *
 * fixtures 590단어를 PostgREST로 직접 upsert(merge-duplicates). 각 테이블 POST가 독립 요청이라
 * 거대한 단일 트랜잭션/타임아웃 이슈 없이 확실히 적재되고, 단계마다 검증 가능.
 *
 * 사용 (service_role 키 필요 — RLS 우회):
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/seed/seed-via-rest.mjs
 *
 * 멱등: PK 충돌 시 merge(덮어쓰기). 재실행 안전.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseAllPacks } from "../lib/parse-fixtures.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const FIX_DIR = path.join(ROOT, "fixtures", "seeded", "words");
const LOCALE = "en-US";
const FREE_SAMPLE_COUNT = 10;
const CHUNK = 500;

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("❌ SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 환경변수 필요"); process.exit(1); }

const glossShort = (g) => {
  const n = (g || "").replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  const w = n.split(" ");
  return (w.length > 5 ? w.slice(0, 5).join(" ") : n) || g;
};

async function upsert(table, rows, onConflict) {
  if (!rows.length) return;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const q = onConflict ? `?on_conflict=${onConflict}` : "";
    const res = await fetch(`${URL}/rest/v1/${table}${q}`, {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${table} upsert 실패 (${res.status}): ${t.slice(0, 300)}`);
    }
  }
  console.log(`  ✓ ${table}: ${rows.length} upsert`);
}

async function count(table) {
  const res = await fetch(`${URL}/rest/v1/${table}?select=*`, {
    method: "HEAD",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "count=exact", Range: "0-0" },
  });
  const cr = res.headers.get("content-range") || "";
  return cr.split("/")[1] || "?";
}

const { packs, koreanToWordId, totalWords } = parseAllPacks(FIX_DIR);
console.log(`파싱: ${packs.length} packs / ${totalWords} words`);

// 행 빌드
const wordPacks = packs.map((p) => ({ pack_id: p.pack_id, name: p.name, tier: p.tier, monthly_release_at: p.monthly_release_at || null, version: 1 }));
const words = [], translations = [], members = [], distractors = [], manifests = [];
packs.forEach((p, pi) => {
  p.words.forEach((w, i) => {
    words.push({ word_id: w.word_id, korean: w.korean, romanization: w.romanization, content_version: 1 });
    translations.push({ word_id: w.word_id, locale: LOCALE, gloss: w.gloss, gloss_short: glossShort(w.gloss), example_ko: w.example_ko || null, example_en: w.example_en || null, content_version: 1 });
    members.push({ pack_id: p.pack_id, word_id: w.word_id, sort_order: i, is_free_sample: p.tier === "premium" && i < FREE_SAMPLE_COUNT });
  });
  manifests.push({ manifest_version: pi + 1, pack_id: p.pack_id, pack_version: 1, content_hash: `seed-${p.pack_id}`, words_diff: {} });
});
const distSeen = new Set();
for (const p of packs) for (const w of p.words) {
  for (const ko of (Array.isArray(w.distractors_candidate) ? w.distractors_candidate : [])) {
    const did = koreanToWordId.get(ko);
    if (!did || did === w.word_id) continue;
    const k = `${w.word_id}|${did}`;
    if (distSeen.has(k)) continue;
    distSeen.add(k);
    distractors.push({ word_id: w.word_id, distractor_word_id: did, distance_score: 0.5, content_version: 1 });
  }
}

console.log("upsert 시작 (의존성 순서)...");
await upsert("word_packs", wordPacks, "pack_id");
await upsert("words", words, "word_id");
await upsert("word_translations", translations, "word_id,locale");
await upsert("word_pack_members", members, "pack_id,word_id");
await upsert("distractors", distractors, "word_id,distractor_word_id");
await upsert("content_manifests", manifests, "manifest_version");

console.log("\n=== 최종 행 수 검증 ===");
for (const t of ["word_packs", "words", "word_translations", "word_pack_members", "distractors", "content_manifests"]) {
  console.log(`  ${t}: ${await count(t)}`);
}
console.log("✅ 완료");
