#!/usr/bin/env node
/**
 * 2차 소싱 이미지(Pixabay CDN) → 우리 Supabase Storage로 재호스팅(임시 CDN 만료 대비).
 *
 * 입력: sources/final_sourcing_result_2nd.csv (image_url 있는 행만)
 * 저장: images/track/{hex(korean)}.jpg (emoji Photo Quiz의 photo/ 와 분리 → 충돌 방지)
 * 매니페스트: images/track-photos.json  { korean: {author, source, title} }
 *
 * env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 멱등/재개: manifest에 있고 파일도 있으면 skip.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const CSV = path.join(ROOT, "sources", "final_sourcing_result_2nd.csv");

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("❌ SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 필요"); process.exit(1); }
const auth = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const BUCKET = "images";
const MANIFEST_KEY = "track-photos.json";
const CONCURRENCY = 6;

function parseCSV(t) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else { if (c === '"') q = true; else if (c === ",") { row.push(cur); cur = ""; } else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; } else if (c === "\r") { /*skip*/ } else cur += c; }
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const raw = fs.readFileSync(CSV, "utf8").replace(/^﻿/, "");
const rows = parseCSV(raw);
const h = rows[0].map((x) => x.trim());
const idx = Object.fromEntries(h.map((x, i) => [x, i]));
const items = rows.slice(1)
  .filter((r) => r[0] && (r[idx.image_url] || "").trim())
  .map((r) => ({
    korean: r[idx.korean], url: r[idx.image_url].trim(),
    author: r[idx.image_author] || "", source: r[idx.image_source] || "Pixabay", title: r[idx.image_title] || "",
  }));
// 같은 korean 중복 제거(첫 개)
const seen = new Set();
const uniq = items.filter((it) => (seen.has(it.korean) ? false : seen.add(it.korean)));
console.log(`이미지 대상 ${uniq.length} 단어`);

const hexKey = (korean) => encodeURIComponent(korean).replace(/%/g, "");
const objKey = (korean) => `track/${hexKey(korean)}.jpg`;

async function loadManifest() {
  const r = await fetch(`${URL}/storage/v1/object/public/${BUCKET}/${MANIFEST_KEY}?t=${Date.now()}`);
  if (r.ok) { try { return await r.json(); } catch { return {}; } }
  return {};
}
async function saveManifest(m) {
  const up = await fetch(`${URL}/storage/v1/object/${BUCKET}/${MANIFEST_KEY}`, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json", "cache-control": "no-cache", "x-upsert": "true" },
    body: JSON.stringify(m),
  });
  if (!up.ok) console.warn(`⚠️ manifest ${up.status}`);
}
async function fileExists(korean) {
  const r = await fetch(`${URL}/storage/v1/object/public/${BUCKET}/${objKey(korean)}`, { method: "HEAD" });
  return r.ok;
}

async function main() {
  const manifest = await loadManifest();
  console.log(`기존 manifest ${Object.keys(manifest).length}`);
  let done = 0, skip = 0, fail = 0, i = 0, sinceSave = 0;

  async function worker() {
    while (i < uniq.length) {
      const it = uniq[i++];
      try {
        if (manifest[it.korean] && (await fileExists(it.korean))) { skip++; continue; }
        const res = await fetch(it.url);
        if (!res.ok) { fail++; continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 1000) { fail++; continue; }
        const up = await fetch(`${URL}/storage/v1/object/${BUCKET}/${objKey(it.korean)}`, {
          method: "POST", headers: { ...auth, "Content-Type": "image/jpeg", "x-upsert": "true" }, body: buf,
        });
        if (!up.ok) { fail++; continue; }
        manifest[it.korean] = { author: it.author, source: it.source, title: it.title };
        done++; sinceSave++;
      } catch { fail++; }
      const total = done + skip + fail;
      if (sinceSave >= 40) { sinceSave = 0; await saveManifest(manifest); }
      if (total % 100 === 0) console.log(`  ${total}/${uniq.length} (done ${done}, skip ${skip}, fail ${fail})`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await saveManifest(manifest);
  console.log(`\n✅ 완료 — 신규 ${done} / skip ${skip} / 실패 ${fail} / manifest ${Object.keys(manifest).length}`);
}
main().catch((e) => { console.error("❌", e); process.exit(1); });
