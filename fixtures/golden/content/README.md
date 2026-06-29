# Content Golden Cases (D-008 + CC2-15 + CC3-07)

> 위치: `fixtures/golden/content/*.yaml`
> 평가: `pnpm eval --category=content`
> 정합성 SoT: `fixtures/seeded/words/starter-pack-candidates.yaml`

## 분포 (11건 + 학습 도메인 보강 3건 = 14건)

| ID prefix | Category | 건수 | 작성 sprint |
|---|---|---|---|
| CON | starter_meta | 1 | W14-1차 |
| CON | starter_count | 1 | W14-1차 |
| CON | distractors_unique | 1 | W14-1차 |
| CON | audio_length (in / under / over) | 3 | W14-1차/2차 |
| CON | retire_410 (retired / active) | 2 | W14-1차 |
| CON | report_5_categories (incorrect / typo / spam-fail) | 3 | W14-1차/2차 |
| **CON 소계** | | **11** | |
| CTN | distractor_semantic_distance (M4 deferred) | 1 | W15 보강 (learning) |
| CTN | romanization_rr_batchim (RR spot check) | 1 | W15 보강 (learning) |
| CTN | pack_manifest_cache_invalidation | 1 | W15 보강 (learning) |
| **CTN 소계** | | **3** | |
| **총** | | **14** | |

## ID prefix 규약

- `CON-NNN`: content evaluator가 자동 검증하는 정량 case (W14 schema 적용)
- `CTN-NNN`: learning 도메인 보강 case (W15 신규). 일부는 M4 evaluator 활성화 대기 (CTN-009)

## 진행 현황 (2026-05-11)

| Sprint | 누적 | 작성 ID |
|---|---:|---|
| W14 1차 | 8 | CON-001/002/003/004/005/006/007/008 |
| W14 2차 | 11 | + CON-009/010/011 |
| W15 보강 | 14 | + CTN-009/010/011 (learning 도메인) |

## CTN evaluator status

| ID | evaluator | 비고 |
|---|---|---|
| CTN-009 | deferred to M4 | embedding (text-embedding-3-small) + cosine 임계 0.30~0.85 — yaml schema만 봉인 |
| CTN-010 | active (W15) | RR romanization 6단어 spot check — content evaluator schema 확장 필요 (rule check) |
| CTN-011 | active (W15) | manifest etag + cache invalidation + user progress preservation 통합 case |
