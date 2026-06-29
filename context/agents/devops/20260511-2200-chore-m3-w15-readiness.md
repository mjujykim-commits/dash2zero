# M3-W15 — devops readiness 자가 진단 + cron/alert/baseline 운영 가이드 초안

- **Agent**: devops (Senior DevOps / Release Engineer)
- **Commit SHA**: m3-w15-c0 (readiness, no code change)
- **Branch / Worktree**: chore/m3-w15-devops-readiness / worktrees/devops/
- **작성일**: 2026-05-11 22:00 KST
- **선행 산출물**: `context/rollups/20260511-M3-W14-evaluators-and-ci.md` §9 (W15 큐), §6 (cron 활성화 시점), §10 (Slack alert)
- **사용한 Skill**: file-organizer (workflows/secrets 위치 분류) · root-cause-tracing (cron 활성화 순서 파급 분석) · changelog-generator (W14→W15 diff)

---

## 1. W15 devops readiness 12항목 자가 진단

| # | 항목 | 현재 상태 | W15 게이트 | 책임 / 의존 |
|---|---|---|---|---|
| 01 | `eval-on-pr.yml` 4 job strict 통과율 | W14 commit 이후 첫 PR에서 grace window 모니터 필요 | 첫 5 PR 100% green or 1 retry로 통과 | devops |
| 02 | `eval-nightly.yml` cron 활성화 | manual dispatch only (line 8 주석) | RLS evaluator 머지 → 24h 시범 → cron 주석 해제 | security(evaluator) → devops(cron) |
| 03 | RLS evaluator 코드 도착 | 미도착 (W15 1차) | scripts/eval/rls.ts + runner.ts 라우팅 + `pnpm eval:rls --strict` 통과 | security + backend |
| 04 | RLS adversarial 9 case skip 해소 | skip 상태 | evaluator 머지 후 nightly 첫 run에서 0 skip | security |
| 05 | audit_log Slack #security webhook 연결 | 미연결 | webhook URL secret 등록 + 송신 경로 합의 + dry-run 1회 | security + devops |
| 06 | GitHub Actions secret 정합 (RC, Supabase, Slack, Sentry) | 부분 (Supabase URL/키, RC 일부) | secret 인벤토리 1차 정리 + EAS Secrets와 sync 표 | devops |
| 07 | baseline metrics 수집 환경 결정 | 미결정 (R-baseline) | 환경 1개 확정 + dashboard URL 발급 | analytics + devops |
| 08 | Crashlytics / Sentry 임계값 | placeholder | crash-free sessions ≥ 99.0% 알람 + Slack 라우팅 | devops |
| 09 | Phased rollout halt trigger (CC3-08) | M5 예정 | W15에는 작성 안 함, 메모만 유지 | devops (M5) |
| 10 | EAS Build 무료 티어 잔량 모니터 | 측정 안 함 | 월 30 build 한도 vs 실 사용 dashboard | devops |
| 11 | 키스토어/서명 백업 (CC2-21) | 1Password Emergency Kit 절차 미작성 | runbook 1쪽 + dry-run 복원 1회 | devops + legal |
| 12 | context/SWARM_LEDGER 갱신 자동화 | 수동 | W15에는 수동 유지, M3 종료 후 hook 검토 | orchestrator |

---

## 2. eval-nightly.yml cron 활성화 안전 순서

활성화 순서를 어기면 nightly가 매일 빨갛게 켜져 알람 피로 + on-call 신뢰 잠식. 다음 순서를 강제한다.

1. **(security+backend)** `scripts/eval/rls.ts` 작성 + `scripts/eval/runner.ts` category dispatch 라우팅 + `pnpm eval:rls`가 로컬에서 9 adversarial fixture 모두 PASS.
2. **(devops)** PR에서 manual `workflow_dispatch`로 `eval-nightly.yml`을 1회 수동 실행 → 0 skip, 0 fail 확인 (이때까지는 cron 주석 유지).
3. **(devops)** 24시간 동안 별도 푸시 없이 manual dispatch 1~2회 추가 → 결정성(flake) 확인. RLS는 DB 의존이라 pg_test_role/supatest 환경 부팅 시간 변동 가능 → 평균 + p95 wall time 기록.
4. **(devops)** `eval-nightly.yml` line 8-9 cron 주석 해제, KST 02:00 (UTC 17:00) 유지. PR 1건으로만 변경, reviewer는 security.
5. **(devops)** cron 활성화 후 첫 3일은 매일 09:00 결과 수동 확인 (Slack #ci-status 봇 미설정 상태 가정).
6. **롤백 트리거**: 3일 내 2회 이상 fail → cron 즉시 재주석 + R-23 재오픈 + security에 root-cause 요청.

차단: 1번이 미완 상태에서 cron만 키면 매일 fail. **금지**.

---

## 3. Slack #security webhook 운영 가이드 초안

### 3.1 Secret 저장 위치

| 후보 | 장점 | 단점 | 추천 |
|---|---|---|---|
| GitHub Actions secret (`SLACK_SECURITY_WEBHOOK`) | CI 알림(예: nightly fail)에는 즉시 사용 | DB trigger 발화 시 GitHub Actions에서 polling 필요 → 지연 | CI 채널만 |
| Supabase Edge Function secret (`supabase secrets set`) | DB trigger / pg_net에서 직접 호출 가능, 실시간 | rotation 주기 별도 운영 | **운영 채널 (audit_log 위반 송신)** |
| Vault / 1Password Connect | 중앙화 | 1인 운영 부담 + 추가 SaaS 비용 | M4 이후 검토 |

**결정**: webhook 1개 URL을 두 위치에 동시 등록 (GitHub `SLACK_SECURITY_WEBHOOK` + Supabase secret `SLACK_SECURITY_WEBHOOK`). rotation 시 두 곳 동시 갱신 — runbook에 명시.

### 3.2 송신 경로 비교 (audit_log 위반 alert)

| 경로 | 구조 | 지연 | 1인 운영 부담 | 비고 |
|---|---|---|---|---|
| **A. pgaudit + log polling** | pgaudit 로그 → Supabase log drain → 외부 파서 → Slack | 분 단위 | 높음 (drain + 파서 운영) | 거부. M4 이후. |
| **B. AFTER INSERT trigger on audit_log + pg_net.http_post** | trigger가 webhook 직접 호출 | 초 단위 | 낮음 (trigger 1개 + secret 1개) | **추천** |
| **C. Edge Function relay (audit_log → realtime → function → Slack)** | realtime subscribe + function | 1~3초 | 중 (function 추가 배포) | B가 실패하면 fallback |

**결정 (W15 추천)**: 경로 B. `0004_audit_triggers.sql` (M2-S3에서 작성된 audit triggers)에 `notify_security_violation()` trigger function 1개 추가, 위반 카테고리(`event_type IN ('rls_denied','self_entitlement_attempt','signature_invalid')`)만 필터링하여 pg_net으로 webhook POST. payload 스키마는 security가 정의 (event_type / user_id_hash / table_name / occurred_at / severity). secret은 `vault.secrets`에서 lookup.

### 3.3 운영 가드

- **중복 발화 방지**: 동일 user_id + event_type 5분 내 1회만 송신 (trigger 내부 dedupe table).
- **PII 차단**: payload는 user_id 원문 금지, sha256(user_id+salt) prefix 8자만.
- **dry-run**: 첫 1주는 #security-test 채널로 라우팅, 7일 noise 측정 후 #security 승격.
- **kill switch**: `vault.secrets`의 webhook URL을 빈 문자열로 만들면 trigger가 noop (trigger function 내부에 if check).

차단: M2-S3에서 약속된 `0004_audit_triggers.sql`이 실제 머지되었는지 W15 시작 전 backend에 확인 필요.

---

## 4. baseline metrics 수집 환경 옵션

수집 대상: Day-3 retention / Day-1 streak 유지율 / lesson_complete_rate / paywall_view_to_purchase (W14 rollup §9).

| 옵션 | 모집단 | 데이터 신호 | 1인 운영 부담 | 출시 영향 |
|---|---|---|---|---|
| **A. Internal dogfood (개발자 1~3명)** | 매우 작음 | 행동 신호 거의 없음 (paywall_view 0건 가능) | 낮음 | 없음 | 
| **B. Closed beta (TestFlight 외부 + Play Closed Track, 30~50명)** | 중간 | 4 metric 모두 의미 있는 신호 가능, paywall 노출 의사결정은 sandbox 필요 | 중 (모집 + ToS + 베타 NDA) | M3 종료 직후 출시에 직접 기여 |
| **C. Supabase staging 합성 트래픽 + RC sandbox** | 0 (합성) | retention/streak 합성 가능, paywall conversion은 의미 없음 (sandbox 결제) | 낮음 | 없음 |
| **D. B + C 하이브리드** | 30~50 + 합성 | 4 metric 모두 + 합성으로 부족분 보완 | 중상 | 가장 유용 |

**추천 (1인 운영 + W15~W16 14일 윈도우)**: **B (Closed beta) 우선, C는 보강용**. 사유:
- A는 paywall_view_to_purchase에서 0/0 = NaN. M3 게이트 baseline으로 부적합.
- C 단독은 retention 합성이 가설에 의존 (실제 사용자 곡선과 괴리) → M3 게이트 신뢰도 낮음.
- B는 모집 부담 있으나 W15 시작 시점에서 TestFlight 외부 링크 1개 + Play Closed Track 1개로 가능. 30명 도달이 어려우면 합성(C)으로 paywall만 보완.

**W15 첫 액션** (devops): 
1. TestFlight 외부 테스터 그룹 1개 생성 (App Store Connect, Apple 계정 필요).
2. Play Console Closed Testing track 1개 생성, opt-in URL 발급.
3. Supabase **staging** 환경에 분석 이벤트 sink 활성화 (prod와 분리, 베타 사용자만 staging 쓰지 않도록 Q&A 필요 — 아래 질문 참조).

**중요한 결정 미정**: 베타 사용자가 staging Supabase로 가는가, prod로 가는가? prod로 가면 baseline 측정값이 정식 출시 후 수치와 직결, staging이면 환경 차이 노이즈. → 아래 §6에 P0 질문으로 등록.

---

## 5. 차단 / 의존성 요약

| 항목 | 차단 / 의존 | 해소 책임 |
|---|---|---|
| cron 활성화 | RLS evaluator 머지 (W15 1차) | security + backend |
| Slack alert 송신 (경로 B) | `0004_audit_triggers.sql` 존재 + pg_net extension 활성화 + vault.secrets 사용 가능 | backend (사전 확인) |
| Slack webhook URL | #security 채널 owner 승인 + URL 발급 | orchestrator → user(승인) |
| baseline 환경 결정 (B vs B+C) | 베타 사용자 → prod or staging Supabase 결정 | analytics + product (user 의사결정) |
| TestFlight 외부 그룹 | Apple Developer 계정 active 상태, 베타 약관 동의 | legal + devops |
| Play Closed Testing | Play Console 계정 + 결제 프로필 | devops |
| EAS Build 무료 티어 | M3 W15 빌드 횟수 예측 → 30/월 초과 시 결제 plan 의사결정 | devops + user |

---

## 6. devops가 user/orchestrator에 보내는 질문 (REVIEW_QA.md DevOps/배포 섹션 등록 예정)

- **Q-OPS-W15-001 (P0)**: Closed beta 사용자는 prod Supabase에 접속하는가, staging에 접속하는가? baseline 14d 측정값이 출시 후 수치와 동일 의미를 갖기 위해서는 prod 권장. 그러나 RC sandbox와 운영 결제가 섞이는 위험 → 권장: prod Supabase + RC sandbox 사용자 segment 분리 + audit_log에 `is_beta_tester` flag.
- **Q-OPS-W15-002 (P0)**: Slack webhook URL은 user가 직접 #security 채널에 발급해 주는가, 아니면 임시로 #security-test 채널을 devops가 1주 운영 후 승격? 추천: 후자.
- **Q-OPS-W15-003 (P1)**: pg_net extension이 prod Supabase 프로젝트에 활성화되어 있는가? backend 확인 요청.
- **Q-OPS-W15-004 (P1)**: 베타 모집 채널 (지인 / X / Reddit r/Korean / Discord)? 30~50명 14일 윈도우 모집 가능성?
- **Q-OPS-W15-005 (P2)**: M3 W16 종료 후 phased rollout 첫 % (10% 권장) 결정 시점은?

---

## 7. 다음 추천 액션

1. (devops, 즉시) `eval-nightly.yml` cron 활성화 PR을 W15 1차 commit 직후가 아닌, RLS evaluator 머지 + manual dispatch 24h 검증 후로 일정 못박기. orchestrator HANDOFF에 명시 요청.
2. (devops, 즉시) backend에 `0004_audit_triggers.sql` 머지 상태 + pg_net extension 상태 1줄 답 요청.
3. (devops, W15 D+1) `docs/runbooks/SECURITY_REVIEW.md`에 webhook secret rotation 절차 추가 (별도 commit).
4. (devops + orchestrator) baseline 환경 결정 미정 → user에게 Q-OPS-W15-001 송부.
5. (devops, W15 D+3) EAS Build 사용량 dashboard 1줄 (월 사용/한도) — 무료 티어 초과 조기 경보.
