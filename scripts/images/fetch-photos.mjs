#!/usr/bin/env node
/**
 * Photo Quiz용 실사진 수집 — EMOJI_WORDS(구체 명사)의 영어 gloss로 Pexels 검색.
 *
 * Pexels(무료) → 사진 1장 → Supabase Storage 버킷 "images"의 photo/{hexkey}.jpg (public).
 * 저작자 표기(Pexels 필수)는 images/photos-manifest.json 에 누적 저장 → 앱이 로드해 크레딧 표시.
 *
 * 앱: ${SUPABASE_URL}/storage/v1/object/public/images/photo/{encodeURIComponent(korean).replace(/%/g,"")}.jpg
 *
 * env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PEXELS_API_KEY
 * 멱등: 파일+크레딧 모두 있으면 skip. 레이트리밋(시간당 200) 근접 시 안전 종료(재실행으로 이어서).
 *
 * 사용: node -r dotenv scripts/images/fetch-photos.mjs   (아래처럼 env 주입)
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... PEXELS_API_KEY=... node scripts/images/fetch-photos.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const EMOJI_FILE = path.join(ROOT, "apps", "mobile", "src", "lib", "emojiWords.ts");

// scripts/.env.local 에서 PEXELS_API_KEY 자동 로드(있으면)
const ENV_LOCAL = path.join(ROOT, "scripts", ".env.local");
if (fs.existsSync(ENV_LOCAL)) {
  for (const line of fs.readFileSync(ENV_LOCAL, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEXELS = process.env.PEXELS_API_KEY;
if (!URL || !KEY) { console.error("❌ SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 필요"); process.exit(1); }
if (!PEXELS) { console.error("❌ PEXELS_API_KEY 필요 (scripts/.env.local)"); process.exit(1); }
const auth = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const BUCKET = "images";
const MANIFEST_KEY = "photos-manifest.json";
const MAX_PER_RUN = 500; // 실측 레이트리밋 여유 큼(24k+) → 전량 1회 완주 가능

// EMOJI_WORDS 파싱: korean/gloss/category
const src = fs.readFileSync(EMOJI_FILE, "utf8");
const words = [...src.matchAll(/\{ korean: "([^"]+)", gloss: "([^"]+)", emoji: "[^"]+", category: "([^"]+)" \}/g)]
  .map((m) => ({ korean: m[1], gloss: m[2], category: m[3] }));
// 중복 korean 제거
const seen = new Set();
const uniq = words.filter((w) => (seen.has(w.korean) ? false : seen.add(w.korean)));
console.log(`대상 ${uniq.length} 단어`);

const hexKey = (korean) => encodeURIComponent(korean).replace(/%/g, "");
const objKey = (korean) => `photo/${hexKey(korean)}.jpg`;

async function ensureBucket() {
  const r = await fetch(`${URL}/storage/v1/bucket`, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (r.ok) return;
  const t = await r.text();
  if (!/already exists|Duplicate/i.test(t)) console.warn(`⚠️ 버킷: ${r.status} ${t.slice(0, 120)}`);
}

async function loadManifest() {
  const r = await fetch(`${URL}/storage/v1/object/public/${BUCKET}/${MANIFEST_KEY}`);
  if (r.ok) { try { return await r.json(); } catch { return {}; } }
  return {};
}
async function saveManifest(manifest) {
  const up = await fetch(`${URL}/storage/v1/object/${BUCKET}/${MANIFEST_KEY}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json", "cache-control": "no-cache", "x-upsert": "true" },
    body: JSON.stringify(manifest),
  });
  if (!up.ok) console.warn(`⚠️ manifest 저장 ${up.status}: ${(await up.text()).slice(0, 120)}`);
}

async function fileExists(korean) {
  const r = await fetch(`${URL}/storage/v1/object/public/${BUCKET}/${objKey(korean)}`, { method: "HEAD" });
  return r.ok;
}

let rateRemaining = Infinity;
async function pexelsSearchOnce(query, square) {
  const q = encodeURIComponent(query);
  const orient = square ? "&orientation=square" : "";
  const r = await fetch(`https://api.pexels.com/v1/search?query=${q}&per_page=1${orient}`, {
    headers: { Authorization: PEXELS },
  });
  const rem = r.headers.get("x-ratelimit-remaining");
  if (rem != null) rateRemaining = parseInt(rem, 10);
  if (r.status === 429) throw new Error("RATE_LIMIT");
  if (!r.ok) throw new Error(`pexels ${r.status}`);
  const j = await r.json();
  return j.photos?.[0] ?? null;
}
// 503 등 일시 오류 최대 2회 재시도(429는 즉시 전파). 정사각형 결과 없으면 방향 제약 없이 폴백.
async function pexelsSearch(query) {
  for (let attempt = 0; ; attempt++) {
    try {
      const photo = await pexelsSearchOnce(query, true);
      if (photo) return photo;
      return await pexelsSearchOnce(query, false);
    } catch (e) {
      if (e.message === "RATE_LIMIT" || attempt >= 2) throw e;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
}

async function uploadPhoto(korean, buf) {
  const up = await fetch(`${URL}/storage/v1/object/${BUCKET}/${objKey(korean)}`, {
    method: "POST", headers: { ...auth, "Content-Type": "image/jpeg", "x-upsert": "true" }, body: buf,
  });
  if (!up.ok) throw new Error(`upload ${up.status}: ${(await up.text()).slice(0, 120)}`);
}

async function main() {
  await ensureBucket();
  const manifest = await loadManifest();
  console.log(`기존 manifest 크레딧 ${Object.keys(manifest).length}개`);

  let done = 0, skip = 0, fail = 0, processed = 0;
  for (const w of uniq) {
    if (processed >= MAX_PER_RUN) { console.log(`\n⏸  이번 실행 한도(${MAX_PER_RUN}) 도달 — 1시간 뒤 재실행으로 이어집니다.`); break; }
    if (manifest[w.korean] && (await fileExists(w.korean))) { skip++; continue; }
    processed++;
    try {
      const photo = await pexelsSearch(w.gloss);
      if (!photo) { fail++; console.log(`  ✗ ${w.korean}(${w.gloss}) — 검색결과 없음`); continue; }
      const imgR = await fetch(photo.src.large);
      if (!imgR.ok) { fail++; continue; }
      const buf = Buffer.from(await imgR.arrayBuffer());
      await uploadPhoto(w.korean, buf);
      manifest[w.korean] = {
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
        pexels_url: photo.url,
        avg_color: photo.avg_color,
      };
      done++;
      if (done % 20 === 0) { await saveManifest(manifest); console.log(`  ${done + skip}/${uniq.length} (done ${done}, skip ${skip}, fail ${fail}, rate남음 ${rateRemaining})`); }
    } catch (e) {
      if (e.message === "RATE_LIMIT") { console.log(`\n⏸  Pexels 레이트리밋 도달 — 저장 후 종료(1시간 뒤 재실행).`); break; }
      fail++; console.log(`  ✗ ${w.korean}: ${e.message}`);
    }
  }
  await saveManifest(manifest);
  const total = Object.keys(manifest).length;
  console.log(`\n✅ 실행 종료 — 신규 ${done} / skip ${skip} / 실패 ${fail} / 누적 크레딧 ${total}/${uniq.length}`);
  if (total < uniq.length) console.log(`   남은 ${uniq.length - total}개는 재실행 시 이어서 수집됩니다.`);
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
