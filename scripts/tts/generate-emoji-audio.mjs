#!/usr/bin/env node
/**
 * Study(사전) 모드용 발음 음원 — EMOJI_WORDS(그림 퀴즈 단어)의 한글 발음.
 *
 * edge-tts(무료) → Supabase Storage 버킷 "audio"의 emoji/{korean}.mp3 (public).
 * 앱(study 화면)은 ${SUPABASE_URL}/storage/v1/object/public/audio/emoji/{encodeURIComponent(korean)}.mp3
 * 를 expo-av로 재생. audio_assets 테이블은 쓰지 않음(파일만).
 *
 * env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 사용: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/tts/generate-emoji-audio.mjs
 * 멱등: 이미 있는 파일은 skip.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const EMOJI_FILE = path.join(ROOT, "apps", "mobile", "src", "lib", "emojiWords.ts");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "d2z-emoji-tts-"));

const BUCKET = "audio";
const VOICE = "ko-KR-SunHiNeural";
const CONCURRENCY = 4;

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("❌ SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 필요"); process.exit(1); }
const auth = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// EMOJI_WORDS의 korean 값 추출
const src = fs.readFileSync(EMOJI_FILE, "utf8");
const koreans = [...src.matchAll(/korean: "([^"]+)"/g)].map((m) => m[1]);
const uniq = [...new Set(koreans)];
console.log(`대상 ${uniq.length} 단어 (voice=${VOICE})`);

async function ensureBucket() {
  const r = await fetch(`${URL}/storage/v1/bucket`, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (r.ok) return;
  const t = await r.text();
  if (!/already exists|Duplicate/i.test(t)) console.warn(`⚠️ 버킷: ${r.status} ${t.slice(0, 100)}`);
}

// Supabase 스토리지 키는 유니코드 불가 → encodeURIComponent의 %제거(=UTF-8 hex, ASCII).
// 앱(study.tsx)도 동일하게 계산해서 같은 URL을 만든다.
const keyFor = (korean) => `emoji/${encodeURIComponent(korean).replace(/%/g, "")}.mp3`;

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
  const p = keyFor(korean);
  if (await exists(korean)) return "skip";
  const local = path.join(TMP, `${encodeURIComponent(korean).replace(/%/g, "")}.mp3`);
  try { await synth(korean, local); } catch { await new Promise((r) => setTimeout(r, 700)); await synth(korean, local); }
  const buf = fs.readFileSync(local);
  const up = await fetch(`${URL}/storage/v1/object/${BUCKET}/${p}`, {
    method: "POST", headers: { ...auth, "Content-Type": "audio/mpeg", "x-upsert": "true" }, body: buf,
  });
  if (!up.ok) throw new Error(`upload ${up.status}: ${(await up.text()).slice(0, 120)}`);
  fs.unlinkSync(local);
  return "done";
}

await ensureBucket();
let done = 0, skip = 0, fail = 0, i = 0;
async function worker() {
  while (i < uniq.length) {
    const k = uniq[i++];
    try { (await one(k)) === "skip" ? skip++ : done++; }
    catch (e) { fail++; console.warn(`⚠️ ${k}: ${String(e.message || e).slice(0, 100)}`); }
    const n = done + skip + fail;
    if (n % 50 === 0) console.log(`  ...${n}/${uniq.length} (done ${done}, skip ${skip}, fail ${fail})`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
console.log(`\n✅ 완료 — 생성 ${done} / skip ${skip} / 실패 ${fail} (총 ${uniq.length})`);
if (fail) process.exitCode = 1;
