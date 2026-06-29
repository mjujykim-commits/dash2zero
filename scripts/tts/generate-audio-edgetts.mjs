#!/usr/bin/env node
/**
 * 발음 음원 생성 — Microsoft edge-tts(무료, 키 불필요) → Supabase Storage + audio_assets
 *
 * Google Cloud TTS(ADR-0005) 대안: 개인 빌드용. edge-tts는 신용카드/API키 없이 고품질
 * 한국어 신경망 음성(ko-KR-SunHiNeural)을 제공. 상업 GA 시 ADR-0005 Google으로 교체 가능
 * (audio_assets 행만 재생성하면 됨).
 *
 * 선행: python -m pip install edge-tts
 * env:  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * 사용:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/tts/generate-audio-edgetts.mjs
 *   ... --limit 60        # 일부만 (테스트)
 *   ... --pack starter-001
 *   ... --examples        # 예문 음원도
 *   ... --force           # 기존 것도 재생성
 *
 * 멱등: audio_assets에 이미 있는 audio_id는 skip(재합성 방지). --force로 재생성.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseAllPacks } from "../lib/parse-fixtures.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const FIX_DIR = path.join(ROOT, "fixtures", "seeded", "words");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "d2z-tts-"));

const BUCKET = "audio";
const VOICE = "ko-KR-SunHiNeural";
const PROVIDER = "microsoft_edge_tts";
const CONCURRENCY = 4;

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("❌ SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 필요"); process.exit(1); }

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const OPT = { examples: has("--examples"), force: has("--force"), limit: val("--limit") ? +val("--limit") : Infinity, pack: val("--pack") };

const auth = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function ensureBucket() {
  const r = await fetch(`${URL}/storage/v1/bucket`, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (r.ok) { console.log(`버킷 "${BUCKET}" 생성(public)`); return; }
  const t = await r.text();
  if (/already exists|Duplicate/i.test(t)) return; // 이미 있음 OK
  console.warn(`⚠️ 버킷 생성 응답: ${r.status} ${t.slice(0, 120)}`);
}

async function loadExisting() {
  if (OPT.force) return new Set();
  const ids = new Set();
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${URL}/rest/v1/audio_assets?select=audio_id`, { headers: { ...auth, Range: `${from}-${from + 999}` } });
    if (!r.ok) break;
    const rows = await r.json();
    rows.forEach((x) => ids.add(x.audio_id));
    if (rows.length < 1000) break;
  }
  return ids;
}

// edge-tts로 텍스트 → mp3 파일
function synth(text, outFile) {
  return new Promise((resolve, reject) => {
    const p = spawn("python", ["-m", "edge_tts", "--voice", VOICE, "--text", text, "--write-media", outFile], { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 && fs.existsSync(outFile) ? resolve() : reject(new Error(err.slice(0, 200) || `exit ${code}`))));
    p.on("error", reject);
  });
}

async function uploadAndRecord(job, existing) {
  const audioId = `a-${job.word_id}-${job.kind}`;
  if (existing.has(audioId)) return "skip";
  const storagePath = `${job.kind}/${job.word_id}.mp3`;
  const local = path.join(TMP, `${job.word_id}-${job.kind}.mp3`);

  // 합성 (1회 재시도)
  try { await synth(job.text, local); }
  catch { await new Promise((r) => setTimeout(r, 800)); await synth(job.text, local); }

  const buf = fs.readFileSync(local);
  const hash = crypto.createHash("sha256").update(buf).digest("hex");

  // 업로드 (x-upsert)
  const up = await fetch(`${URL}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: "POST", headers: { ...auth, "Content-Type": "audio/mpeg", "x-upsert": "true" }, body: buf,
  });
  if (!up.ok) throw new Error(`upload ${up.status}: ${(await up.text()).slice(0, 150)}`);

  // audio_assets upsert
  const ins = await fetch(`${URL}/rest/v1/audio_assets?on_conflict=audio_id`, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ audio_id: audioId, word_id: job.word_id, kind: job.kind, provider: PROVIDER, voice_id: VOICE, audio_url: storagePath, audio_hash: hash, tier: job.tier, license: "microsoft_tos" }),
  });
  if (!ins.ok) throw new Error(`audio_assets ${ins.status}: ${(await ins.text()).slice(0, 150)}`);
  fs.unlinkSync(local);
  return "done";
}

// 잡 목록
const { packs } = parseAllPacks(FIX_DIR);
const sel = OPT.pack ? packs.filter((p) => p.pack_id === OPT.pack) : packs;
const jobs = [];
for (const p of sel) {
  const tier = p.tier === "starter" ? "free" : "premium";
  for (const w of p.words) {
    if (w.korean) jobs.push({ word_id: w.word_id, kind: "word", text: w.korean, tier });
    if (OPT.examples && w.example_ko) jobs.push({ word_id: w.word_id, kind: "example", text: w.example_ko, tier });
  }
}
const targets = jobs.slice(0, OPT.limit);

console.log(`대상 ${targets.length} jobs (voice=${VOICE})`);
await ensureBucket();
const existing = await loadExisting();

let done = 0, skip = 0, fail = 0, i = 0;
async function worker() {
  while (i < targets.length) {
    const job = targets[i++];
    try {
      const r = await uploadAndRecord(job, existing);
      r === "skip" ? skip++ : done++;
    } catch (e) { fail++; console.warn(`⚠️ ${job.word_id}/${job.kind}: ${String(e.message || e).slice(0, 120)}`); }
    const n = done + skip + fail;
    if (n % 50 === 0) console.log(`  ...${n}/${targets.length} (done ${done}, skip ${skip}, fail ${fail})`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
console.log(`\n✅ 완료 — 생성 ${done} / skip ${skip} / 실패 ${fail} (총 ${targets.length})`);
if (fail) process.exitCode = 1;
