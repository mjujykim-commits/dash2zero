/**
 * photos — Photo Quiz용 실사진(Pexels) URL + 저작자 크레딧 로더.
 *
 * 사진은 Supabase Storage 버킷 "images"의 photo/{hexkey}.jpg (public).
 * 저작자 크레딧(Pexels 필수 표기)은 images/photos-manifest.json 에 { korean: {...} } 형태.
 * hexkey = encodeURIComponent(korean).replace(/%/g,"") — 발음 음원과 동일 규칙.
 */

import { SUPABASE_URL } from "./supabase";

export interface PhotoCredit {
  photographer: string;
  photographer_url: string;
  pexels_url: string;
  avg_color?: string;
}

const MANIFEST_URL = `${SUPABASE_URL}/storage/v1/object/public/images/photos-manifest.json`;

let cache: Record<string, PhotoCredit> | null = null;

/** 사진이 준비된 단어 목록 + 크레딧. 실패 시 {} (사진 퀴즈 비어보임). */
export async function getPhotoManifest(): Promise<Record<string, PhotoCredit>> {
  if (cache) return cache;
  try {
    const r = await fetch(`${MANIFEST_URL}?t=${Date.now()}`);
    if (!r.ok) return (cache = {});
    cache = (await r.json()) as Record<string, PhotoCredit>;
  } catch {
    cache = {};
  }
  return cache;
}

export function photoUri(korean: string): string {
  const key = encodeURIComponent(korean).replace(/%/g, "");
  return `${SUPABASE_URL}/storage/v1/object/public/images/photo/${key}.jpg`;
}
