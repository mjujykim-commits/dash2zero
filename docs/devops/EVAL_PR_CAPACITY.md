# Eval-on-PR 4 Job 병렬 Wall Time 측정 가이드 (M3 W15)

> 책임: **devops** · 협업: **pm** (W15 부하 +40% 우려 raise)
> 작성일: 2026-05-11
> 목적: 향후 5개 evaluator로 확장 시 전체 PR check ≤ **10분** 유지 가능 여부 검증

---

## 0. 배경 / 문제

- 현재 `eval-on-pr.yml` 4 job (srs / payment / privacy / content) 병렬 strict.
- W15 진입 시 RLS evaluator 도입 예정 → 5번째 job 후보 (단, 본 워크플로 vs `eval-nightly` 분리 정책 결정 필요)
- pm 우려: W15 부하 +40% → 각 PR마다 evaluator 실행 시간 증가 → CI 큐 적체 → 1인 운영자 대기 시간
- 1인 개발자 GitHub Actions 무료 티어: 월 2,000 분(public) / private repo는 plan에 따라 다름. PR 1건당 4 job 병렬 = wall time만 청구되나, 동시 실행 다수 시 큐 대기 발생 가능

---

## 1. 측정 목표 (4 job 현재 + 1 job 추가 시나리오)

| 시나리오 | 목표 | 임계 |
|---|---|---|
| 4 job 병렬 wall time (현재) | < 5 min | 8 min |
| 4 job 병렬 critical path (가장 느린 job) | < 4 min | 6 min |
| 5 job 병렬 wall time (RLS 추가 가정) | < 7 min | 10 min |
| 5 job 병렬 critical path | < 6 min | 8 min |
| 동시 PR 3건 (concurrency 큐 영향) | 추가 대기 < 2 min/PR | 5 min |

> 임계 초과 시 액션: ① job 분할 (RLS는 nightly로) ② evaluator 내부 fixture 병렬화 ③ pnpm install 캐시 재검토 ④ runner upgrade (paid plan)

---

## 2. 측정 절차

### 2.1 baseline 측정 (현재 4 job)

다음 시점의 PR 5건을 샘플로:
1. PR head 머지 직전 commit SHA
2. Actions UI에서 각 job별 다음 분 단위 기록:
   - `Setup pnpm + Node` (a)
   - `pnpm install --frozen-lockfile` (b)
   - `pnpm eval:<cat> -- --strict` (c)
   - 전체 job duration (d) = a + b + c + overhead
3. PR 전체 wall time = max(d_srs, d_payment, d_privacy, d_content) — 병렬

| PR | SHA | srs | payment | privacy | content | wall (max) |
|---|---|---:|---:|---:|---:|---:|
| #__ | __ | __ min | __ min | __ min | __ min | __ min |
| ... | | | | | | |
| **avg** | | | | | | |
| **p95** | | | | | | |

기록 위치: 본 문서 §6 표에 매 측정 시점 추가 (commit log).

### 2.2 5 job 시나리오 (RLS 추가 가정)

RLS evaluator를 PR opt-in label `run-rls-adversarial`로 가정:
- label 없을 때: 4 job 그대로 (baseline)
- label 있을 때: 5 job 병렬 → critical path 변화 측정

**중요**: RLS는 local Supabase docker 의존 → install 시간이 다른 4 job보다 길 가능성 높음. RLS job critical path 가설 = 6~8 min.

→ pm 우려 대응: RLS는 PR 단계에 강제 진입 **금지**, opt-in label 또는 nightly-only 권장. 본 가이드 §4 결정 트리 참조.

### 2.3 동시 PR 영향 측정

- 동일 시각 PR 3건 push → Actions 큐 wait time 기록
- `eval-on-pr.yml`의 `concurrency.group` = `eval-${{ github.ref }}` → 동일 ref만 cancel-in-progress. **다른 PR은 큐 대기**
- 무료 티어 동시 실행 한도 (개인 plan: 보통 20 동시 job) → 4 job × 5 PR = 20, 6 PR부터 대기

---

## 3. 측정 도구 / 명령

### 3.1 GitHub CLI 기반 자동 수집

```bash
# 최근 30개 eval-on-pr.yml 실행 시간 수집
gh run list --workflow=eval-on-pr.yml --limit=30 --json databaseId,headSha,startedAt,updatedAt,status,conclusion,name \
  | jq -r '.[] | [.databaseId, .headSha[0:7], .startedAt, .updatedAt, .conclusion] | @csv' \
  > eval-pr-runs.csv

# 각 run의 job별 시간
gh run view <RUN_ID> --json jobs \
  | jq -r '.jobs[] | [.name, .startedAt, .completedAt, .conclusion] | @csv'
```

### 3.2 측정 cadence

- W15 sprint 종료 직전 (D-5): baseline 5건 샘플 수집
- M3 게이트 직전: 추가 5건 샘플 (drift 확인)
- 5 evaluator 시나리오 결정 시점에 동시 PR 3건 강제 실험 (의도적 push)

---

## 4. 결정 트리 — 5번째 evaluator 처리

```
RLS evaluator strict 통과 + nightly 24h flake 측정 완료
│
├─ avg wall time delta (4→5 job) < 2 min ?
│  ├─ YES → eval-on-pr.yml에 5번째 job 추가 (paths 트리거 신중)
│  └─ NO  → ↓
│
├─ critical path RLS job < 8 min ?
│  ├─ YES → PR opt-in label `run-rls-adversarial` (selective)
│  └─ NO  → nightly-only (eval-nightly.yml). PR에서 절대 강제 X
│
└─ 1인 운영 무료 티어 월 사용량 70% 초과 ?
   ├─ YES → nightly만 + paid plan 검토
   └─ NO  → opt-in label 운영 가능
```

**W15 권장**: nightly-only 시작, M5 진입 시 PR opt-in label 검토. 4 job strict는 그대로 유지.

---

## 5. 최적화 옵션 (임계 초과 시)

| 옵션 | 효과 | 비용 |
|---|---|---|
| `actions/cache` for `~/.pnpm-store` | install 시간 30~50% 감소 | 캐시 키 관리 |
| evaluator 내부 fixture 병렬 (vitest worker pool) | 단일 job critical path 감소 | 코드 변경 |
| job matrix split (큰 evaluator를 sub-job 분할) | critical path 감소, billing minute 증가 | 무료 티어 압박 |
| `paths-ignore` 정밀화 (docs only PR 제외) | 불필요 실행 제거 | 현재 paths 명시로 부분 대응 |
| GitHub Pro / Team plan upgrade | 동시 실행 한도 증가 | 월 $4~$21 |
| self-hosted runner (1인 PC) | 무제한, 빠름 | PC 가동 의존, 1인 단일 장애점 |

W15 권장: actions/cache + paths-ignore 정밀화 우선. self-hosted는 1인 단일 장애점 위험으로 비권장.

---

## 6. 측정 기록 표 (commit 누적)

| 측정일 | 트리거 | 4 job avg | 4 job p95 | 5 job avg | 5 job p95 | 비고 |
|---|---|---:|---:|---:|---:|---|
| 2026-05-__ | W15 baseline 5건 | __ | __ | n/a | n/a | TBD |
| 2026-05-__ | 5 evaluator 가정 (label opt-in) | __ | __ | __ | __ | TBD |
| ... | | | | | | |

> 각 측정마다 commit. drift > 1 min 시 root-cause commit 메시지 명시.

---

## 7. pm 우려 해소 (W15 +40% 부하)

| 우려 | 대응 |
|---|---|
| 매 PR마다 4 job 강제 → 1인 대기 시간 ↑ | paths 정밀화로 docs/context PR 제외 (이미 적용). 추가로 `if: contains(...)` 가드 검토 |
| RLS 추가 시 5 job → wall time 폭증 | nightly-only 우선. PR opt-in은 §4 결정 트리 통과 후 |
| 무료 티어 분 한도 초과 | 본 측정으로 월 사용량 추정. 70% 초과 시 paid plan 의사결정 |
| PR review 사이클 지연 | critical path 6 min 임계 강제. 초과 시 즉시 §5 옵션 적용 |

---

## 8. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-11 | 초안 — 측정 절차 + 결정 트리 + pm 우려 대응 | devops |
