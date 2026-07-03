#!/usr/bin/env node
/**
 * TOPIK/KIIP 어휘 발음 음성 생성 — 한글 기준(트랙 공유, 동음이의 dedup).
 *
 * edge-tts(무료) → Supabase Storage 버킷 "audio"의 vocab/{hexkey}.mp3 (public).
 * 앱은 ${SUPABASE_URL}/storage/v1/object/public/audio/vocab/{encodeURIComponent(korean).replace(/%/g,"")}.mp3 재생.
 *
 * 대상: sources/image_mapping.json 의 고유 한글(6,701).
 * env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 멱등: 이미 있는 파일 skip → 재실행하면 이어서(재개).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const SRC = path.join(ROOT, "sources", "image_mapping.json");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "d2z-vocab-tts-"));

const BUCKET = "audio";
const VOICE = "ko-KR-SunHiNeural";
const CONCURRENCY = 4;

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("❌ SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 필요"); process.exit(1); }
const auth = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const koreans = [...new Set(JSON.parse(fs.readFileSync(SRC, "utf8")).map((w) => w.korean))];
console.log(`대상 ${koreans.length} 단어 (voice=${VOICE})`);

const keyFor = (korean) => `vocab/${encodeURIComponent(korean).replace(/%/g, "")}.mp3`;

async function ensureBucket() {
  const r = await fetch(`${URL}/storage/v1/bucket`, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (r.ok) return;
  const t = await r.text();
  if (!/already exists|Duplicate/i.test(t)) console.warn(`⚠️ 버킷: ${r.status} ${t.slice(0, 100)}`);
}

async function exists(korean) {
  const r = await fetch(`${URL}/storage/v1/object/public/${BUCKET}/${keyFor(korean)}`, { method: "HEAD" });
  return r.ok;
}

function synth(text, outFile) {
  return new Promise((resolve, reject) => {
    const p = spawn("python", ["-m", "edge_tts", "--voice", VOICE, "--text", text, "--write-media", outFile], { stdio: ["ignore", "ignore", "pipe"] });
    let err = ""; p.stderr.on("data", (d) => (err += d));
    p.on("close", (c) => (c === 0 && fs.existsSync(outFile) ? resolve() : reject(new Error(err.slice(0, 150) || `exit ${c}`))));
    p.on("error", reject);
  });
}

async function one(korean) {
  if (await exists(korean)) return "skip";
  const local = path.join(TMP, `${encodeURIComponent(korean).replace(/%/g, "")}.mp3`);
  try { await synth(korean, local); } catch { await new Promise((r) => setTimeout(r, 700)); await synth(korean, local); }
  const buf = fs.readFileSync(local);
  const up = await fetch(`${URL}/storage/v1/object/${BUCKET}/${keyFor(korean)}`, {
    method: "POST", headers: { ...auth, "Content-Type": "audio/mpeg", "x-upsert": "true" }, body: buf,
  });
  if (!up.ok) throw new Error(`upload ${up.status}: ${(await up.text()).slice(0, 120)}`);
  fs.unlinkSync(local);
  return "done";
}

async function main() {
  await ensureBucket();
  let done = 0, skip = 0, fail = 0, i = 0;
  async function worker() {
    while (i < koreans.length) {
      const idx = i++;
      const ko = koreans[idx];
      try {
        const r = await one(ko);
        if (r === "skip") skip++; else done++;
      } catch (e) { fail++; if (fail <= 20) console.log(`  ✗ ${ko}: ${e.message}`); }
      const total = done + skip + fail;
      if (total % 100 === 0) console.log(`  ${total}/${koreans.length} (done ${done}, skip ${skip}, fail ${fail})`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\n✅ 완료 — 생성 ${done} / skip ${skip} / 실패 ${fail} (총 ${koreans.length})`);
  try { fs.rmdirSync(TMP, { recursive: true }); } catch {}
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
