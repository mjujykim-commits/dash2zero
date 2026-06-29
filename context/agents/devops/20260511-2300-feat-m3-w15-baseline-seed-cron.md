# M3-W15 — synthetic baseline seed + eval-nightly cron 준비 + audit alert secret + capacity 가이드

- **Agent**: devops (Senior DevOps / Release Engineer)
- **Commit SHA**: m3-w15-c1 (W15 1차 실작업)
- **Branch / Worktree**: feat/m3-w15-devops / worktrees/devops/
- **작성일**: 2026-05-11 23:00 KST
- **선행**: `context/agents/devops/20260511-2200-chore-m3-w15-readiness.md` (readiness)
- **Orchestrator 결정 적용**:
  - "baseline 수집은 Supabase staging + synthetic seed + 1인 dogfood, real-user는 M5 이연"
  - "Slack webhook URL은 M5 이연, W15는 trigger + workflow stub만"
  - "사용자: 운영 blocker 무시, 제품 개발 몰두"
- **사용한 Skill**: file-organizer (scripts/seed/ + docs/devops/ 신규 디렉토리 분류) · root-cause-tracing (cron 활성화 6단계 순서 파급) · changelog-generator (W15 작업 4종 차분)

---

## 1. 산출물 (W15 1차)

| # | 파일 | LoC | 용도 |
|---:|---|---:|---|
| 1 | `scripts/seed/synthetic-baseline.ts` | ~360 | Supabase staging 14d cohort 합성 seed (200 user 기본). prod 가드 + 멱등 + 결정적 PRNG |
| 2 | `scripts/seed/README.md` | ~150 | 사용법 + 분포 가설 + dogfood 1 계정 절차 |
| 3 | `.github/workflows/eval-nightly.yml` | (수정) | unskip 조건 주석 명시 + timeout-minutes:15 + wall time 기록 step |
| 4 | `.github/workflows/README.md` | ~120 | cron 활성화 6단계 체크리스트 (단계 1~6) |
| 5 | `docs/devops/AUDIT_ALERT_SECRETS.md` | ~210 | secret 인벤토리 4개 + 6단계 활성화 + kill switch + rotation |
| 6 | `docs/devops/EVAL_PR_CAPACITY.md` | ~170 | 4 job wall time 측정 + 5 evaluator 결정 트리 + pm 우려 대응 |
| 7 | 본 context 파일 | (이) | |

총 ~1,000줄 신규 + workflow 1건 수정.

---

## 2. 작업별 결정 / 자율 판단

### 2.1 Synthetic seed 분포 (devops 자율)

| 단계 | 비율 | 근거 |
|---|---:|---|
| lesson_started of signup | 100% | 정의상 onboarding 직후 |
| lesson_completed of started (D0) | 65% | 학습 앱 D0 completion band 60-70% |
| word_mastered of completed | 40% | stage 5 도달은 누적 필요 — 보수적 |
| paywall_viewed of started | 30% | lesson 3회 또는 7일차 trigger |
| purchase of paywall | 4% | free→paid 글로벌 band 2-6% 중간 |
| D1 retention | 65% | M3 baseline 가설 |
| D3 retention | 40% | 게이트 핵심 |
| D7 retention | 22% | 보조 |
| D1 streak (complete) | 50% | streak 유지 |

**경고**: 가설값. M3 게이트 결정에 합성 수치 직접 사용 금지. 합성은 **파이프라인 정상성** 검증용. real-user는 M5.

분포 변경 시 commit 메시지에 `[seed-dist]` prefix.

### 2.2 Secret 저장 위치 (devops 자율)

GitHub Actions secret + Supabase vault.secrets **양쪽 등록**. 사유:
- CI 발화 (`security-alert-stub.yml`, `eval-nightly` fail 알림) → GitHub
- DB trigger 발화 (`notify_security_violation()`) → Supabase vault (pg_net 직접 호출, 초 단위)
- 단일 위치 보관 시 한쪽 사용 불가

Rotation 시 양쪽 동시 갱신 강제 (§5 절차). 1Password Vault 백업 1건 추가.

### 2.3 Cron 활성화 조건 (devops 자율)

6단계 체크리스트 강제:
1. RLS evaluator 코드 머지
2. 로컬 9/9 PASS
3. GitHub manual dispatch 1회 PASS
4. **24h flake 측정 (3회 dispatch, 0 flake)** — devops 자율 결정 핵심
5. cron 주석 해제 PR (reviewer=security)
6. 활성화 후 첫 3일 09:00 모니터, 2회 fail 시 즉시 재주석

flake 측정에서 1건 발생 시 5회 추가 보강 (0/5 통과). 임계 wall time p95 = 10 min (timeout-minutes:15와 정합).

---

## 3. 의존성 / 정합성 점검

| 의존 | 상태 | 비고 |
|---|---|---|
| analytics `scripts/baseline/queries.sql` view | **미도착** (W15 작업 중) | seed README §6에 컬럼 contract 명시. mismatch 발생 시 fail-fast |
| security `infra/supabase/migrations/0004_audit_triggers.sql` | **미도착** (W15 작업 중) | AUDIT_ALERT_SECRETS.md §3 단계 4에 trigger function contract 명시 |
| security `.github/workflows/security-alert-stub.yml` | **미도착** (W15 작업 중) | workflow README 표에 stub 등록 |
| `pg_net` / `vault` extension prod 활성화 | 미확인 | backend ping 필요 (Q-OPS-W15-003) |
| `paywall_events` 테이블 | 미존재 가능성 | seed에서 soft-skip 처리 (`chunkedInsertSoft`) |

**즉시 ping 필요**:
- analytics: baseline view PR 머지 시 본 seed로 동작 확인 가능. README §6 컬럼 contract 검토 요청.
- security: 0004_audit_triggers.sql trigger function이 본 가이드 §3 단계 4 contract와 정합한지 cross-review.
- backend: pg_net / vault extension prod 활성화 상태 1줄 답.

---

## 4. 변경된/신규 파일

```
scripts/seed/
  synthetic-baseline.ts                   (신규)
  README.md                               (신규)
.github/workflows/
  eval-nightly.yml                        (수정)
  README.md                               (신규)
docs/devops/
  AUDIT_ALERT_SECRETS.md                  (신규)
  EVAL_PR_CAPACITY.md                     (신규)
context/agents/devops/
  20260511-2300-feat-m3-w15-baseline-seed-cron.md  (본 파일)
```

---

## 5. 사용 Skill / 페르소나

- Senior DevOps / Release Engineer (system) — "배포가 두려우면 자주 못 배포한다"
- file-organizer — `scripts/seed/`, `docs/devops/` 신규 디렉토리 위치 결정 (기존 `infra/`와 분리: seed는 dev tool, infra는 runtime)
- root-cause-tracing — cron 활성화 순서 위반 시 알람 피로 → 신뢰 잠식 → 1인 운영 가장 비싼 실패 chain 분석
- changelog-generator — W14→W15 4 작업 차분 정리

---

## 6. 자가 평가

- **즉시 실행 가능**: synthetic seed (analytics view 도착 시 즉시 검증 가능)
- **차단 / 의존**: alert stub은 security의 `0004_audit_triggers.sql` + workflow stub 도착 후 contract cross-check
- **W15 sprint 종료 (5/18 가정) 산출물 예측**:
  - synthetic seed staging 1회 실행 + analytics view 통과 확인
  - eval-nightly 6단계 체크리스트 단계 1~3까지 진입 (RLS evaluator 머지 의존)
  - audit alert는 stub 단계로 commit 완료 (M5 이연 — orchestrator 결정 준수)
  - eval-on-pr 4 job baseline 측정 5건 수집

---

## 7. 다음 추천 액션

1. **(devops, W15 D-1)** synthetic seed staging 1회 dry-run + 실 삽입 — analytics view 머지 직후
2. **(devops, W15 D-2)** RLS evaluator 머지 후 cron 6단계 단계 2 (로컬 PASS) 진입
3. **(devops + security, W15 D-3)** AUDIT_ALERT_SECRETS.md §3 단계 4 trigger contract cross-review
4. **(devops, W15 D-5)** eval-on-pr.yml baseline 5건 측정 → EVAL_PR_CAPACITY.md §6 표 갱신
5. **(devops + analytics, W15 D-5)** seed README §6 contract와 baseline view SQL 정합 1건 commit

---

## 8. REVIEW_QA 신규 등록 (DevOps/배포 섹션)

본 sprint에서 새로 raise된 질문 (기존 readiness §6의 Q-OPS-W15-001~005 외):

- **Q-OPS-W15-006 (P1)** synthetic seed의 분포 가설 (D1=65% / D3=40% 등)이 M5 closed beta 실측치와 비교했을 때 cohort decay 곡선 어긋남 임계 (예: ±20%)는? 임계 초과 시 분포 재추정 정책.
- **Q-OPS-W15-007 (P2)** dogfood 1 계정의 user_id를 analytics view에서 제외할 cohort 식별 방식 — `display_name LIKE 'dogfood/%'` vs 별도 `is_dogfood` 컬럼? 후자 권고 (M5 boolean 컬럼 추가 검토).
- **Q-OPS-W15-008 (P2)** GitHub Actions 무료 티어 월 분 한도 초과 시 paid plan 의사결정 trigger 임계 (70% 권고)는?

orchestrator가 REVIEW_QA.md DevOps/배포 섹션에 일괄 등록 권고.
