#!/usr/bin/env node
/**
 * 발음 음원 생성 + 업로드 — Google Cloud TTS → Supabase Storage + audio_assets (ADR-0005)
 *
 * ⚠️ UI 효과음(SFX)과 무관. 이 스크립트는 단어 "발음" 음원 전용.
 *
 * 무엇을 하나:
 *   1. fixtures 590단어를 읽어 각 korean(단어)을 ko-KR-Neural2-A 음성으로 mp3 합성.
 *   2. Supabase Storage 버킷 "audio"에 word/{word_id}.mp3 로 업로드.
 *   3. audio_assets 행 upsert (audio_url=경로, audio_hash=sha256, tier=free|premium).
 *   --examples 플래그 시 example_ko도 example/{word_id}.mp3 로 추가 생성.
 *
 * 사전 준비 (Owner):
 *   1) Google Cloud 프로젝트 + Text-to-Speech API 활성화 + 서비스계정 JSON 키 발급.
 *   2) 의존성 설치:  npm i @google-cloud/text-to-speech @supabase/supabase-js
 *   3) 환경변수:
 *        export GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcp-key.json
 *        export SUPABASE_URL=https://xxxx.supabase.co
 *        export SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service_role (Storage 쓰기·insert 권한)
 *   (Windows PowerShell:  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\key.json"  등)
 *
 * 실행:
 *   node scripts/tts/generate-audio.mjs            # 590 word 음원 생성·업로드 (~$10, 멱등)
 *   node scripts/tts/generate-audio.mjs --examples # 예문 음원도 추가 (~2배 비용)
 *   node scripts/tts/generate-audio.mjs --limit 5  # 5개만 (테스트)
 *   node scripts/tts/generate-audio.mjs --pack starter-001  # 특정 pack만
 *   node scripts/tts/generate-audio.mjs --force    # 기존 것도 재생성(덮어쓰기)
 *   node scripts/tts/generate-audio.mjs --dry-run  # API 호출 없이 대상만 출력
 *
 * 멱등: 기본은 audio_assets에 이미 있는 audio_id를 건너뛴다(TTS 재과금 방지). --force로 재생성.
 *
 * 비용 가늠: Neural2 $16/1M chars. 단어 평균 ~6자 → 590단어 ≈ 4k chars ≈ $0.07.
 *   (예문 포함 시도 평균 ~20자라 여전히 ~$0.30. ADR-0005의 ~$10은 넉넉한 상한.)
 *
 * 버킷 공개 정책: 본 스크립트는 "audio" 버킷을 public으로 생성한다(개인 빌드 단순화).
 *   audio-signed-url 함수의 premium signed-URL 게이팅은 private 버킷 전제이므로,
 *   상업 출시 시에는 버킷을 private로 전환하고 free 음원 제공 방식을 재검토할 것 (TODO: GA).
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseAllPacks } from "../lib/parse-fixtures.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const FIX_DIR = path.join(ROOT, "fixtures", "seeded", "words");

const BUCKET = "audio";
const VOICE = "ko-KR-Neural2-A";
const LANG = "ko-KR";
const SPEAKING_RATE = 0.95; // 학습자용 약간 천천히

// ---- 인자 ----
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const OPT = {
  examples: has("--examples"),
  force: has("--force"),
  dryRun: has("--dry-run"),
  limit: val("--limit") ? parseInt(val("--limit"), 10) : Infinity,
  pack: val("--pack"),
};

function reqEnv(name) {
  const v = process.env[name];
  if (!v && !OPT.dryRun) { console.error(`❌ 환경변수 ${name} 필요`); process.exit(1); }
  return v;
}

// ---- 대상 목록 구성 ----
const { packs, totalWords } = parseAllPacks(FIX_DIR);
const selectedPacks = OPT.pack ? packs.filter((p) => p.pack_id === OPT.pack) : packs;
if (OPT.pack && selectedPacks.length === 0) { console.error(`❌ pack 없음: ${OPT.pack}`); process.exit(1); }

/** 생성 작업 목록: {word_id, kind, text, tier} */
const jobs = [];
for (const p of selectedPacks) {
  const tier = p.tier === "starter" ? "free" : "premium"; // audio_tier_enum
  for (const w of p.words) {
    if (w.korean) jobs.push({ word_id: w.word_id, kind: "word", text: w.korean, tier });
    if (OPT.examples && w.example_ko) jobs.push({ word_id: w.word_id, kind: "example", text: w.example_ko, tier });
  }
}
const targetJobs = jobs.slice(0, OPT.limit);

console.log(`대상: ${selectedPacks.length} packs / ${totalWords} words → ${jobs.length} jobs` +
  `${OPT.limit !== Infinity ? ` (limit ${OPT.limit})` : ""}${OPT.examples ? " [+examples]" : ""}`);

if (OPT.dryRun) {
  for (const j of targetJobs.slice(0, 20)) console.log(`  [dry] ${j.kind}/${j.word_id}.mp3  tier=${j.tier}  "${j.text}"`);
  if (targetJobs.length > 20) console.log(`  ... +${targetJobs.length - 20} more`);
  console.log("dry-run 종료 (API 호출 없음).");
  process.exit(0);
}

// ---- 클라이언트 (동적 import — 의존성 미설치 시 친절한 안내) ----
const SUPABASE_URL = reqEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = reqEnv("SUPABASE_SERVICE_ROLE_KEY");
reqEnv("GOOGLE_APPLICATION_CREDENTIALS");

let ttsClient, supabase;
try {
  const { default: textToSpeech } = await import("@google-cloud/text-to-speech");
  const { createClient } = await import("@supabase/supabase-js");
  ttsClient = new textToSpeech.TextToSpeechClient();
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
} catch (e) {
  console.error("❌ 의존성 미설치. 실행: npm i @google-cloud/text-to-speech @supabase/supabase-js");
  console.error(String(e?.message || e));
  process.exit(1);
}

// ---- 버킷 보장 (public) ----
async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message)) {
    console.error(`❌ 버킷 생성 실패: ${error.message}`); process.exit(1);
  }
  console.log(`버킷 "${BUCKET}" 생성(public).`);
}

// ---- 기존 audio_assets 조회 (멱등 skip용) ----
async function loadExistingIds() {
  if (OPT.force) return new Set();
  const ids = new Set();
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from("audio_assets").select("audio_id").range(from, from + pageSize - 1);
    if (error) { console.warn(`⚠️ 기존 조회 실패(무시): ${error.message}`); break; }
    data.forEach((r) => ids.add(r.audio_id));
    if (!data || data.length < pageSize) break;
  }
  return ids;
}

async function synthesize(text) {
  const [resp] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: { languageCode: LANG, name: VOICE },
    audioConfig: { audioEncoding: "MP3", speakingRate: SPEAKING_RATE },
  });
  return Buffer.from(resp.audioContent, "binary");
}

async function run() {
  await ensureBucket();
  const existing = await loadExistingIds();

  let done = 0, skipped = 0, failed = 0;
  for (const j of targetJobs) {
    const audioId = `a-${j.word_id}-${j.kind}`;
    const storagePath = `${j.kind}/${j.word_id}.mp3`;
    if (existing.has(audioId)) { skipped++; continue; }
    try {
      const buf = await synthesize(j.text);
      const hash = crypto.createHash("sha256").update(buf).digest("hex");
      const up = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
        contentType: "audio/mpeg", upsert: true,
      });
      if (up.error) throw new Error(`upload: ${up.error.message}`);
      const ins = await supabase.from("audio_assets").upsert({
        audio_id: audioId,
        word_id: j.word_id,
        kind: j.kind,
        provider: "google_neural2",
        voice_id: VOICE,
        audio_url: storagePath,
        audio_hash: hash,
        tier: j.tier,
        license: "google_tos",
      }, { onConflict: "audio_id" });
      if (ins.error) throw new Error(`audio_assets: ${ins.error.message}`);
      done++;
      if (done % 25 === 0) console.log(`  ...${done} 생성 (skip ${skipped}, fail ${failed})`);
    } catch (e) {
      failed++;
      console.warn(`⚠️ 실패 ${audioId}: ${String(e?.message || e)}`);
    }
  }
  console.log(`\n✅ 완료 — 생성 ${done} / 건너뜀 ${skipped} / 실패 ${failed} (총 ${targetJobs.length})`);
  if (failed > 0) process.exitCode = 1;
}

await run();
