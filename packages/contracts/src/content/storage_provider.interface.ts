/**
 * StorageProvider — Storage URL 추상화 (ADR-0002)
 *
 * 현재 구현: Supabase Storage (M2-S2)
 * 교체 가능 후보 (Phase 2+): Cloudflare R2, S3 + CloudFront
 * 교체 트리거: Storage egress > 100GB/mo (STACK_EVOLUTION_PLAN §3.2)
 */

export interface StorageProvider {
  /** Public bucket의 영구 URL (Starter Pack audio 등) */
  getPublicUrl(path: string): string;

  /** Private bucket의 단기 signed URL (Premium audio, TTL 6h — CC3-04) */
  getSignedUrl(path: string, ttlSec: number): Promise<string>;

  /** 업로드 (운영자 전용 — service_role) */
  upload(path: string, data: Blob | Uint8Array, contentType: string): Promise<{ path: string; hash: string }>;

  /** 파일 존재 확인 */
  exists(path: string): Promise<boolean>;
}
