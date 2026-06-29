# ADR-0007 — Baseline Metrics Storage (`metrics/daily/` git + 3-source)

- **상태**: **Accepted** (W16 D-3 architect 권고 5건 본문 반영 + 봉인)
- **작성일**: 2026-05-20 (W16 D-2 orchestrator pre-draft) / 2026-05-21 architect 회람 + 봉인 (W16 D-3, D-4 사전 진입)
- **작성**: orchestrator (pre-draft) → architect (회람 5건 권고) → orchestrator (본문 반영 + 봉인)
- **승인**: orchestrator (2026-05-21, W16 D-3 후반 D-4 사전 진입)
- **마일스톤**: M3 W16 — M3 게이트 #4 (baseline 3-source 14d) 완전 충족 조건
- **관련 문서**: D-010 (baseline 정책 봉인 / 2026-05-12) / `docs/observability/BASELINE_METRICS.md` / `scripts/baseline/queries.sql` / `scripts/baseline/run.ts` / `scripts/seed/synthetic-baseline.ts` / Q-W15-1 / Q-W15-2 / `context/rollups/20260512-M3-W16-gate-sprint-plan.md` §W16-02
- **Skill 사용**: `software-architecture` · `prompt-engineering`

---

## Context

D-010 (2026-05-12)에서 baseline metrics 3-source 정책 봉인:
1. **Supabase staging** (`vw_baseline_*` view) — 실 staging 적재 데이터
2. **Synthetic seed** (`scripts/seed/synthetic-baseline.ts`) — 결정적 PRNG, 200 user, 14d cohort
3. **1인 dogfood** — Owner 계정 lesson 활동 신호

M3 게이트 #4 충족 조건: **14d snapshot 누적 + 3-source 신호 적재 확인**.

D-010에서 미해소된 항목 2건:
- **Q-W15-1**: synthetic seed의 결정성 보장 방법 (다른 환경에서 같은 seed가 같은 분포 생성 가능한가?)
- **Q-W15-2**: dogfood vs synthetic 라벨링 정책 (실 사용자 데이터와 어떻게 구분하는가?)

추가로 W16 진입 시점에서 결정해야 할 사항:
- **저장소**: `metrics/daily/*.json`을 git에 commit할 것인가, 별도 DB(예: Supabase metrics 테이블)에 저장할 것인가?
- **threshold check 위치**: PRD §8.2 4 KPI band와의 비교 로직을 어디에 둘 것인가?
- **Reversal Trigger**: 3-source 중 1개가 fail하면 어떻게 대응할 것인가?

---

## Decision (Draft)

### 1. 저장소: `metrics/daily/` git 디렉터리

```
metrics/
├── daily/
│   ├── 2026-05-12.json   # Day-0 (W15 baseline 시작일)
│   ├── 2026-05-13.json   # Day-1
│   ├── ...
│   └── 2026-05-25.json   # Day-13 (M3 게이트 검증 마지막날)
└── weekly/
    └── 2026-05-19-to-2026-05-25.md   # W16 weekly summary
```

**근거**:
- 1인 개발자 운영 가능성: 별도 DB는 운영 부담 (백업/마이그레이션/access control). git은 free + diff 추적 + PR review 가능
- M3 종료 시점 14건만 → 누적 storage 부담 미미 (~1MB/year)
- baseline drift 추적이 PR diff로 자연스럽게 노출 → "왜 D1 retention이 떨어졌나" 같은 질문에 git blame이 즉시 답
- M5/M6 시점 real-user 데이터 도입 시 별도 테이블 추가 검토 (본 ADR 외)

**Aggregate-only 원칙 (architect 권고 1, 2026-05-21)**:
- `metrics/daily/*.json`은 **aggregate 통계만** 저장한다. user_id / attempt_id / device_install_id / 기타 PK·식별자는 **절대 포함 금지**.
- 허용 필드 예시: count, sum, p50/p95, retention rate, cohort size (anonymous bucket).
- 금지 필드 예시: per-user histogram (PII), session id, IP, location.
- 본 원칙은 M5 real-user 데이터 진입 시 git PII commit 우려를 사전 차단. 위반 시 §6 Reversal Trigger R3로 즉시 진입.

### 2. 3-source 라벨링 (Q-W15-2 해소)

각 baseline snapshot JSON에 `source` 필드 추가:
```json
{
  "computed_at": "2026-05-20T07:00:00Z",
  "source": "synthetic_seed_v1",
  "seed": "dash2zero-baseline-2026-05",
  "is_dogfood": false,
  "summary": { ... },
  "breakdowns": { ... }
}
```

| `source` 값 | 의미 | M3 게이트 #4 신호 |
|---|---|---|
| `staging_supabase` | staging vw_baseline_* view 결과 | ✅ 충족 |
| `synthetic_seed_v1` | scripts/seed/synthetic-baseline.ts 결과 | ✅ 충족 |
| `dogfood_owner` | 1인 dogfood Owner 활동 (is_dogfood=true 컬럼) | ✅ 충족 |

3개 source 신호가 모두 14d 중 ≥7일 적재되면 M3 게이트 #4 PASS. 1~6일 적재면 CONDITIONAL.

**Source 비교 우선순위 (architect 권고 2, 2026-05-21)**:

PRD §8.2 KPI 비교 기준은 다음 우선순위로 채택한다 (동일 14d에 다중 source 적재 시):

| 우선순위 | Source | 채택 시점 | 용도 |
|---|---|---|---|
| 1 | `staging_supabase` | M3 (현재) | 실 staging 적재 데이터 — PRD §8.2 KPI 1차 기준 |
| 2 | `real_user_production` | M5 이후 (`is_dogfood = FALSE`) | M5 도입 후 KPI 최종 기준으로 staging 대체 |
| 3 | `synthetic_seed_v1` | 항상 (CI 재현성 검증용) | KPI 비교 기준 **아님** — synthetic은 회귀 검증·CI green 신호 |
| 4 | `dogfood_owner` | 항상 (sanity check) | KPI 비교 기준 **아님** — Owner 신호 누락 = monitoring alert 트리거 |

근거: synthetic은 통계 분포가 의도적으로 만들어진 것이므로 KPI 결정 기준이 될 수 없다. dogfood는 N=1 신호이므로 KPI band 비교에 통계적 의미가 부족하다. M3 시점에는 staging 단독 채택, M5 이후 real-user로 자연스럽게 전환.

### 3. Synthetic seed 결정성 (Q-W15-1 해소)

`synthetic-baseline.ts`의 PRNG:
- `seed = process.env.BASELINE_SEED ?? "dash2zero-baseline-2026-05"` (env가 없으면 default seed)
- xorshift32 또는 mulberry32 결정적 PRNG (Math.random 회피 — 환경 비결정성)
- seed는 snapshot JSON의 `seed` 필드에 박제

검증: 같은 seed로 두 환경에서 실행 → snapshot JSON의 user-level events가 byte-identical (CI에서 한 번 단위 테스트로 검증).

**CI 단위 테스트 명시 (architect 권고 3, 2026-05-21)**:

`scripts/seed/__tests__/synthetic-baseline.spec.ts` (또는 동등 위치)에 다음 검증 케이스를 **반드시 1건 포함**한다:

```typescript
it("synthetic-baseline produces byte-identical output for same seed", () => {
  const seed = "dash2zero-baseline-2026-05";
  const run1 = generateSyntheticBaseline({ seed, userCount: 200, days: 14 });
  const run2 = generateSyntheticBaseline({ seed, userCount: 200, days: 14 });
  expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
});
```

본 테스트가 통과해야 M3 게이트 #4 evidence로 채택 가능. CI gate green 조건 = 본 테스트 + check-thresholds red 없음.

Seed 변경 시 (Q-ADR-0007-1 결정 적용 — 분기 경계 변경) 본 테스트의 expected seed 값을 갱신 + 본 ADR §3에 seed 이력 한 줄 추가 (새 ADR 작성 불필요).

### 4. `is_dogfood` 컬럼 (M5 권고)

Q-W15-2 후속: 실 사용자 데이터 진입 시 dogfood 신호를 분리하기 위해 다음 컬럼을 M5 마이그레이션에 포함:

```sql
ALTER TABLE attempts ADD COLUMN is_dogfood BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE lesson_completions ADD COLUMN is_dogfood BOOLEAN NOT NULL DEFAULT FALSE;
```

`vw_baseline_*` view는 `WHERE is_dogfood = FALSE OR source_label = 'dogfood'`로 분기 가능.

M3 시점에는 컬럼 없음 — synthetic + staging만으로 14d 적재. dogfood 신호는 M3 게이트 #4 evidence로 staging 적재 신호와 동일 취급.

### 5. Threshold check 위치

`scripts/baseline/check-thresholds.ts` 신규 (본 ADR과 함께 D-5 작성):
- 입력: `metrics/daily/*.json` 최근 N건 (default 7)
- 비교: `docs/product/PRD.md §8.2` 4 KPI band (Target / Minimum / Yellow / Red)
- 출력: `metrics/weekly/YYYY-MM-DD-to-YYYY-MM-DD.md` markdown summary + exit code (0 = green, 1 = yellow, 2 = red — CI gate용)

**제약**: threshold check는 baseline runner와 **분리** (D-010 §3 명시). runner는 데이터 적재만, threshold check는 별도 호출. CI gate가 필요하면 별도 wrapper.

**GitHub Action PR comment 통합 (architect 권고 4, 2026-05-21)**:

weekly check-thresholds 실행 → 결과 markdown을 **PR description에 자동 embed**한다:

```yaml
# .github/workflows/weekly-baseline.yml (개요)
- name: Run check-thresholds
  run: pnpm tsx scripts/baseline/check-thresholds.ts --weekly --output metrics/weekly/{date-range}.md
- name: Comment PR with summary
  run: gh pr comment ${{ github.event.pull_request.number }} --body-file metrics/weekly/{date-range}.md
```

근거: 1인 운영 부담을 ~5분/주로 압축. 사람이 PR review 시 별도 markdown 파일을 열지 않아도 됨 — 한 화면에서 KPI band 통과/yellow/red를 즉시 판단. orchestrator weekly review의 단일 진입점.

yellow 항목은 markdown 별도 섹션 `## ⚠️ Yellow (watch)`로 분리 표시 — Q-ADR-0007-3 결정(red만 CI fail) 정합. yellow는 fail이 아니지만 사람 인지 강제.

### 6. Reversal Trigger

다음 중 하나라도 충족되면 본 ADR을 갱신 (Reversal → 새 ADR 작성):

- **R1**: 3-source 중 1개가 14d 중 ≥3일 fail (staging connectivity / synthetic 결정성 깨짐 / dogfood 신호 0) → 누락 source의 alternative 또는 폐기 결정
- **R2**: `metrics/daily/` git 누적이 100건 (≈3.5개월) 초과 시 별도 DB 마이그레이션 검토 (storage drift)
- **R3**: real-user 14d 데이터 (M5 이후) 적재 시점에 본 정책 재검토 — `is_dogfood` 컬럼 활성화 + view 분기 + §1 aggregate-only 원칙 위반 우려 시 git commit 중단
- **R4 (architect 권고 5, 2026-05-21)**: synthetic seed 분포가 PRD §8.2 KPI band의 yellow/red 임계값과 너무 멀어 baseline 의미 상실 시 (`abs(predicted - target) > 50%`) → seed 재조정 필요. 이 경우 본 ADR 갱신 없이 §3에 seed 이력 1줄 추가 + Owner 명시 동의 (분기 경계 변경 정책 Q-ADR-0007-1과 별개의 fast-path)

---

## Consequences

### 긍정
- 1인 개발자 운영 가능성 최대화 (git만으로 baseline 추적)
- baseline drift가 PR review 흐름에 자연스럽게 노출
- synthetic seed 결정성 → CI 재현성 보장
- threshold check 분리 → baseline runner의 책임 명확 (적재만)

### 부정
- git repo 크기 증가 (~1MB/year, M5에서 5MB/year 예상)
- real-user 데이터 진입 시 git에 commit하는 것이 부적절 — M5 시점에 본 ADR 갱신 필요
- 3-source 정합성 자동 모니터링 부재 — 1인 dogfood 누락은 사람이 체크해야 함 (cron alert 검토 권고)

### 운영 부담
- nightly cron 1회 (baseline runner) + weekly 1회 (check-thresholds) — devops가 이미 W15 설계
- 사람 검토 부담: 매주 weekly summary PR review (~5분)

---

## Open Questions (D-3 architect 회람 → D-4 final 결정)

- [x] **Q-ADR-0007-1**: synthetic seed 변경 정책 → **결정**: "fixed forever per quarter, 변경 시 새 seed name". 근거: M3 14d baseline은 단일 seed로 충분, M5 real-user 데이터 진입 시 seed 변경 부담 회피. 분기 경계(03/06/09/12)에서 `dash2zero-baseline-{YYYY}-{MM}` naming convention. 변경 시 새 ADR 필요 없이 본 ADR §3에 seed 이력 추가.
- [x] **Q-ADR-0007-2**: `metrics/daily/` PR review 정책 → **결정**: "auto-merge with weekly orchestrator review". 근거: 매일 review는 1인 운영 부담 과다, 14d 누적 시점에서 weekly summary PR 1건만 orchestrator가 review. nightly cron이 자동 PR 생성(`baseline/2026-05-21` branch) → CI green이면 auto-merge. M3 게이트 #4 evidence는 weekly markdown.
- [x] **Q-ADR-0007-3**: check-thresholds CI gate 강도 → **결정**: "red만 CI fail, yellow는 warn comment". 근거: PRD §8.2 yellow는 "관찰 필요"이지 "rollout halt"가 아님 (CC3-08 rollout halt 임계값과 별개). red는 PRD §8.2 Minimum 미달 → 즉시 차단. weekly summary markdown에 yellow 항목을 별도 섹션으로 노출하면 사람 review에서 확실히 잡힘.

---

## Architect 회람 이력 (2026-05-21 / W16 D-3)

architect 회람에서 제기된 권고 5건은 모두 본문 §1/§2/§3/§5/§6에 반영 완료 후 본 ADR을 Accepted 봉인 (D-3 후반에 D-4 사전 진입).

| 권고 # | 적용 위치 | 반영 요약 |
|---|---|---|
| 1 | §1 (저장소) | "Aggregate-only 원칙" 추가 — PII PK·식별자 git commit 금지 |
| 2 | §2 (라벨링) | "Source 비교 우선순위" 4-tier 추가 — staging > real-user > synthetic(CI) > dogfood(sanity) |
| 3 | §3 (synthetic seed) | "CI 단위 테스트" 필수 케이스 명시 — byte-identical 검증 |
| 4 | §5 (threshold check) | "GitHub Action PR comment" 통합 — weekly markdown 자동 embed |
| 5 | §6 (Reversal Trigger) | R4 추가 — synthetic 분포가 KPI target과 50%+ 괴리 시 fast-path 재조정 |

운영 부담 우려 (architect 추가 의견): 14d 누적 PR 한 번에 review 시 부담 → orchestrator 일정에 daily PR이 D-7 직전까지 closed 상태 유지 명시 (이미 `docs/harness/M3_GATE_V2_DASHBOARD.md` §6에 반영).

---

## 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-20 | Draft 작성 (W16 D-2 orchestrator pre-draft) | orchestrator |
| 2026-05-21 | architect 회람 의견 5건 반영 (W16 D-3) — Conditional Accept | architect |
| 2026-05-21 | 권고 5건 본문 §1/§2/§3/§5/§6 반영 + Accepted 봉인 (D-4 사전 진입) | orchestrator |
