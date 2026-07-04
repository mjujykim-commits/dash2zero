#!/usr/bin/env node
/**
 * v3 소싱 결과 통합.
 *  - emoji_photos_v2 (371) → images/photo/{hex}.jpg 덮어쓰기 + photos-manifest.json
 *  - photos_batch1  (175) → images/track/{hex}.jpg 추가       + track-photos.json
 *
 * env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const SRC = path.join(ROOT, "sources");

const URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("❌ env 필요"); process.exit(1); }
const auth = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const hex = (k) => encodeURIComponent(k).replace(/%/g, "");

function parseCSV(t) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else { if (c === '"') q = true; else if (c === ",") { row.push(cur); cur = ""; } else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; } else if (c === "\r") {} else cur += c; } }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
function readCSV(f) {
  const rows = parseCSV(fs.readFileSync(f, "utf8").replace(/^﻿/, ""));
  const h = rows[0].map((x) => x.trim()); const idx = Object.fromEntries(h.map((x, i) => [x, i]));
  return rows.slice(1).filter((r) => r[0]).map((r) => Object.fromEntries(h.map((x, i) => [x, r[idx[x]]])));
}
async function loadManifest(key) {
  const r = await fetch(`${URL}/storage/v1/object/public/images/${key}?t=${Date.now()}`);
  if (r.ok) { try { return await r.json(); } catch { return {}; } }
  return {};
}
async function saveManifest(key, m) {
  const up = await fetch(`${URL}/storage/v1/object/images/${key}`, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json", "cache-control": "no-cache", "x-upsert": "true" }, body: JSON.stringify(m),
  });
  if (!up.ok) console.warn(`⚠️ manifest ${key} ${up.status}`);
}

async function integrate({ folder, csv, ns, manifestKey, credit }) {
  const dir = path.join(SRC, folder);
  const rows = readCSV(path.join(SRC, csv));
  const manifest = await loadManifest(manifestKey);
  const before = Object.keys(manifest).length;
  console.log(`\n[${folder}] CSV ${rows.length}, 기존 manifest ${before}`);

  let done = 0, skip = 0, fail = 0, i = 0;
  async function worker() {
    while (i < rows.length) {
      const r = rows[i++];
      const file = path.join(dir, r.filename || "");
      if (!r.filename || !fs.existsSync(file)) { skip++; continue; }
      try {
        const buf = fs.readFileSync(file);
        const up = await fetch(`${URL}/storage/v1/object/images/${ns}/${hex(r.korean)}.jpg`, {
          method: "POST", headers: { ...auth, "Content-Type": "image/jpeg", "x-upsert": "true" }, body: buf,
        });
        if (!up.ok) throw new Error("up " + up.status);
        manifest[r.korean] = credit(r);
        done++;
        if (done % 50 === 0) { await saveManifest(manifestKey, manifest); console.log(`  ${done + skip + fail}/${rows.length} (done ${done}, skip ${skip}, fail ${fail})`); }
      } catch (e) { fail++; if (fail <= 10) console.log("  ✗ " + r.korean + ": " + e.message); }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  await saveManifest(manifestKey, manifest);
  console.log(`  ✅ done ${done} / skip ${skip} / fail ${fail} / manifest ${before}→${Object.keys(manifest).length}`);
}

async function main() {
  // 이모지 Photo Quiz — Pexels 크레딧 스키마에 매핑(+source)
  await integrate({
    folder: "emoji_photos_v2", csv: "emoji_credits_v2.csv", ns: "photo", manifestKey: "photos-manifest.json",
    credit: (r) => ({ photographer: r.author || "Pixabay", photographer_url: r.source_url || "", pexels_url: r.source_url || "", avg_color: "", source: r.source || "Pixabay" }),
  });
  // 트랙 Photo Quiz — {author, source, title} 스키마
  await integrate({
    folder: "photos_batch1", csv: "credits_batch1.csv", ns: "track", manifestKey: "track-photos.json",
    credit: (r) => ({ author: r.author || "", source: r.source || "Pixabay", title: r.image_title || "" }),
  });
}
main().catch((e) => { console.error("❌", e); process.exit(1); });
