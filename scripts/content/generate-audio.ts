/**
 * Audio Generator — Google Cloud TTS Neural2 (ADR-0005)
 *
 * Usage:
 *   pnpm tsx scripts/content/generate-audio.ts <input.yaml> <output-dir>
 *
 * Input: starter-pack-candidates.yaml
 * Output:
 *   <output-dir>/{word_id}-word.mp3   — Korean word pronunciation
 *   <output-dir>/{word_id}-example.mp3 — example sentence
 *   <output-dir>/manifest.json         — { audio_id, word_id, kind, audio_hash, voice_id }
 *
 * 비용 추정 (ADR-0005):
 *   60 단어 + 60 예문 = 120 audio × 평균 30 chars = 3,600 chars
 *   Google Neural2 $16/1M chars → ~$0.06 (실제 약 $0.05-0.10)
 *
 * 책임 agent: devops + learning (W8 첫 작업)
 *
 * 환경변수:
 *   GOOGLE_APPLICATION_CREDENTIALS — service account JSON 경로
 *   GOOGLE_CLOUD_PROJECT_ID
 *
 * 사후 작업:
 *   1. 검수자 audio QC (한국어 원어민)
 *   2. Supabase Storage upload (storageProvider 어댑터)
 *   3. content_manifest publish (next migration)
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { parse } from "yaml";

// Google Cloud TTS client는 실제 실행 시 import:
//   import textToSpeech from "@google-cloud/text-to-speech";
//   const client = new textToSpeech.TextToSpeechClient();

interface CandidateWord {
  word_id: string;
  korean: string;
  example_ko?: string;
}

interface CandidateFile {
  pack_id: string;
  words: CandidateWord[];
}

interface ManifestEntry {
  audio_id: string;
  word_id: string;
  kind: "word" | "example";
  audio_path: string;
  audio_hash: string;
  voice_id: string;
  provider: string;
  text: string;
  created_at: string;
}

const VOICE_ID = "ko-KR-Neural2-A"; // ADR-0005 1차 단일 화자
const PROVIDER = "google_neural2";

async function synthesize(text: string): Promise<Buffer> {
  // 실제 구현 (Google Cloud TTS 라이브러리 설치 후):
  //
  // const [response] = await client.synthesizeSpeech({
  //   input: { text },
  //   voice: { languageCode: "ko-KR", name: VOICE_ID },
  //   audioConfig: { audioEncoding: "MP3", speakingRate: 1.0, pitch: 0 },
  // });
  // return response.audioContent as Buffer;

  // M2-S4 stub: zero-byte buffer (Google 키 발급 후 교체)
  console.warn(`[stub] Would synthesize: ${text}`);
  return Buffer.from(`[stub-audio for "${text}"]`, "utf-8");
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

async function main() {
  const [inputPath, outputDir] = process.argv.slice(2);
  if (!inputPath || !outputDir) {
    console.error("Usage: tsx generate-audio.ts <input.yaml> <output-dir>");
    process.exit(1);
  }

  const yamlText = readFileSync(inputPath, "utf-8");
  const data: CandidateFile = parse(yamlText);
  mkdirSync(outputDir, { recursive: true });

  const manifest: ManifestEntry[] = [];

  for (const word of data.words) {
    // 단어 audio
    const wordBuf = await synthesize(word.korean);
    const wordHash = sha256(wordBuf);
    const wordFile = `${word.word_id}-word.mp3`;
    writeFileSync(join(outputDir, wordFile), wordBuf);
    manifest.push({
      audio_id: `a-${word.word_id}-word`,
      word_id: word.word_id,
      kind: "word",
      audio_path: wordFile,
      audio_hash: wordHash,
      voice_id: VOICE_ID,
      provider: PROVIDER,
      text: word.korean,
      created_at: new Date().toISOString(),
    });

    // 예문 audio
    if (word.example_ko) {
      const exBuf = await synthesize(word.example_ko);
      const exHash = sha256(exBuf);
      const exFile = `${word.word_id}-example.mp3`;
      writeFileSync(join(outputDir, exFile), exBuf);
      manifest.push({
        audio_id: `a-${word.word_id}-example`,
        word_id: word.word_id,
        kind: "example",
        audio_path: exFile,
        audio_hash: exHash,
        voice_id: VOICE_ID,
        provider: PROVIDER,
        text: word.example_ko,
        created_at: new Date().toISOString(),
      });
    }
  }

  writeFileSync(join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`Generated ${manifest.length} audio files for ${data.words.length} words.`);
  console.log(`Manifest: ${join(outputDir, "manifest.json")}`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Owner QC — sample 5-10 files");
  console.log("  2. External reviewer — pronunciation pass/fail");
  console.log("  3. Upload to Supabase Storage (audio_assets bucket)");
  console.log("  4. content_manifest publish (next migration)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
