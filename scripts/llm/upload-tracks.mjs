#!/usr/bin/env node
/**
 * upload-tracks — 병합된 트랙/예문 JSON을 Supabase Storage(images 버킷)에 업로드.
 *
 * 실행 전 env 필요(gen-examples 돌릴 때와 동일):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * 업로드 대상(공개 버킷 images/):
 *   track-topik.json, track-kiip.json  → 앱 getTrack (뜻 g 반영)
 *   track-examples.json                → 앱 getTrackExamples (예문/예시어)
 *
 * 앱은 Storage에서 실시간 로드하므로 재빌드 없이 반영됨.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const S = (f) => path.join(ROOT, "sources", f);

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) {
  console.error("✗ env 필요: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const FILES = ["track-topik.json", "track-kiip.json", "track-examples.json"];

for (const f of FILES) {
  const body = fs.readFileSync(S(f)); // 바이트 그대로 → 한글 보존
  try {
    const r = await fetch(`${SB_URL}/storage/v1/object/images/${f}`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        "cache-control": "no-cache",
        "x-upsert": "true",
      },
      body,
    });
    console.log(`${r.ok ? "✅" : "✗"} ${f} — ${r.status}${r.ok ? "" : " " + (await r.text())}`);
  } catch (e) {
    console.log(`✗ ${f} — ${e.message}`);
  }
}
