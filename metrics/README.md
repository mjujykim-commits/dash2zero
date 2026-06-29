# metrics/ — Baseline Storage (ADR-0007)

> 봉인 정책: `docs/adr/ADR-0007-baseline-storage.md`
> 적재 도구: `scripts/baseline/run.ts` (nightly cron)
> 검증 도구: `scripts/baseline/check-thresholds.ts` (weekly)
> PRD threshold: `docs/product/PRD.md §8.2` (D-013)

---

## 구조

```
metrics/
├── README.md                    # 본 문서
├── daily/                       # nightly snapshot (1 file/day)
│   └── YYYY-MM-DD.json
└── weekly/                      # check-thresholds 출력
    └── YYYY-MM-DD-to-YYYY-MM-DD.md
```

---

## 적재 흐름

1. **nightly cron** (`scripts/baseline/run.ts`):
   - Supabase staging의 `vw_baseline_*` view 실행
   - synthetic seed 결과 적재
   - dogfood Owner 활동 신호 적재
   - 결과를 `metrics/daily/YYYY-MM-DD.json`에 commit (3-source label 포함, ADR-0007 §2)

2. **weekly check** (`scripts/baseline/check-thresholds.ts`):
   - 최근 7일 snapshot median 계산
   - PRD §8.2 4 KPI band와 비교
   - `metrics/weekly/YYYY-MM-DD-to-YYYY-MM-DD.md` markdown 출력
   - exit code: 0 (green) / 1 (yellow, strict) / 2 (red)

---

## M3 게이트 #4 조건 (`docs/harness/M3_GATE_V2_DASHBOARD.md` §1)

- 14d snapshot 누적 (2026-05-12~2026-05-25, Day-0~Day-13)
- 3-source 신호 모두 적재 확인 (`source` 필드)
- ≥7일 적재가 모든 source에서 PASS

---

## 본 디렉터리의 git 정책 (ADR-0007 §1)

- `metrics/daily/*.json` — git에 commit. 1MB/year 미만 누적 예상
- `metrics/weekly/*.md` — git에 commit. PR review 흐름에 노출
- M5 시점 real-user 데이터 진입 시 본 정책 재검토 (Reversal Trigger R-3)

---

## 본 디렉터리가 현재 비어 있는 이유

W16 D-2 (2026-05-20) 시점에 본 README + ADR-0007 draft + check-thresholds.ts 스켈레톤이 먼저 commit. 실 snapshot 적재는 devops가 nightly cron 가동한 후 Day-0~Day-13 누적 (W15 Cycle C → W16 D-1~D-7).
