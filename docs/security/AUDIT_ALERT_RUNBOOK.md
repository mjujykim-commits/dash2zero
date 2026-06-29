# audit_log Alert Runbook

- **Author**: security agent (Senior Security & Privacy Specialist)
- **Date**: 2026-05-11 (M3 W15 — paper mode)
- **Status**: 설계만 — 실 webhook URL 미등록 (M5 이연, orchestrator 결정)
- **Related**:
  - `infra/supabase/migrations/0004_audit_triggers.sql` (trigger + dispatch)
  - `.github/workflows/security-alert-stub.yml` (manual dispatch only)
  - `fixtures/adversarial/rls/RLS-ADV-001~009.yaml` (위반 패턴 출처)
  - `docs/adr/ADR-0004-rls-policies.md`

---

## 0. 개요

audit_log AFTER INSERT trigger가 위반 시도를 분류하여 Slack #security 채널로 alert 발송.
**현재 W15는 paper 모드 — webhook URL이 NULL이면 trigger no-op**, dedup row만 유지.
M5에 `vault.create_secret('SLACK_SECURITY_WEBHOOK', ...)` + GitHub Secrets 등록 시 자동 활성화.

---

## 1. 핵심 원칙

1. **PII 평문 금지**: actor user_id는 `audit_actor_hash()` 로 sha256 8자 prefix만 (예: `usr_a1b2c3d4`). 이메일/이름/IP 절대 포함 금지.
2. **dedup 5분 윈도**: `(actor_hash, table, action)` 키. 동일 패턴 연속 시도는 최초 1건만 alert, 윈도 종료 시 hit_count 동봉.
3. **chain 무결성 우선**: pg_net.http_post 실패해도 audit_log INSERT 자체는 성공해야 함 (try/catch).
4. **무한 재귀 방지**: alert 발송 자체는 audit_log에 기록 안 함 — alert-of-alert 방지.
5. **GDPR 72h 통지 산정**: P0 alert 시각이 침해 인지 시각 — UTC + KST 병기.

---

## 2. Top 3 alert 우선순위 (security agent 자율 결정)

본 우선순위는 W15 readiness §10에서 도출 → trigger의 `audit_classify_severity()` 함수에 그대로 매핑.

### P0 — 즉시 page (단 1회도 production 발생 시 대응)

| Pattern | 위반 | 근거 | 대응 SLA |
|---|---|---|---|
| **P0-1: self-entitlement upsert** | authenticated 사용자가 본인 `subscription_entitlements` row에 INSERT/UPDATE/DELETE 시도 (RLS-ADV-003) | 결제 우회 = 매출 직접 손실 + RC SoT 신뢰 붕괴 | 5분 내 1차 확인, 30분 내 RC dashboard 대조 |
| **P0-2: audit_log 직접 write** | 사용자가 audit_log에 INSERT/UPDATE/DELETE 시도 (RLS-ADV-004) | Repudiation = 사후 추적 불가 + GDPR 72h 통지 산정 근거 소실 | 5분 내 1차 확인, 시도 자체를 별도 chain에 기록 |

**P0 대응 단계**:
1. (T+5min) Slack alert 확인 → user_id hash로 production user 식별 (DB에서 `WHERE substring(encode(digest(user_id::text, 'sha256'), 'hex'), 1, 8) = '<hash>'`)
2. (T+15min) RevenueCat dashboard에서 해당 user의 subscription 상태 대조 (P0-1 only). 매출 데이터에 부정 grant 흔적 있는지 audit_log SELECT.
3. (T+30min) 부정 confirmed 시 service_role로 강제 status 정정 + 관련 audit_log row 보존 (DELETE 금지).
4. (T+72h) GDPR 침해 통지 의무 판단 — 영향받은 사용자 수 × PII 노출 범위. 단순 시도 차단(row 0건 영향)은 통지 의무 없음. 실제 데이터 변경 발생 시에만 의무 발생.
5. R-XX issue 생성 → root-cause 분석 → mitigation PR.

### P1 — 5분 dedup, 채널 통지

| Pattern | 위반 | 대응 SLA |
|---|---|---|
| **P1-1: cross-user PII read** | 다른 user의 profiles / user_word_states / learning_attempts / learning_sessions / daily_usage / content_reports SELECT 시도 (RLS-ADV-001/008) | 다음 영업일 검토 — JOIN 실수 false positive 가능성 있어 패턴 누적 후 분석 |
| **P1-2: anon write 시도** | anon이 INSERT 가능 테이블 외(learning_attempts / user_word_states / subscription_entitlements 등)에 INSERT 시도 (RLS-ADV-002) | 다음 영업일 검토 — 봇/스크레이퍼 정찰 가능성, 패턴 분석 후 IP 차단 검토 |

**P1 대응 단계**:
1. (T+1day) Slack thread reply 확인 → 동일 actor의 hit_count 확인 (5분 윈도 내 누적 시도 횟수).
2. 단발(hit_count=1)은 false positive 후보 → 추적만. 연속(hit_count > 5) 또는 24h 내 재발은 봇/공격 의심.
3. 패턴 누적 시 actor hash 역추적(가능한 user_id 목록 grep) → 계정 잠금 검토.

---

## 3. P2 (일배치 요약) — trigger 내 즉시 발송 안 함

| Pattern | 위반 | 처리 |
|---|---|---|
| starter 외 pack/audio anon read 시도 (RLS-ADV-005) | tier 우회 시도, 단발 무해 | 일배치 18:00 KST digest |
| expired entitlement → premium audio 접근 (RLS-ADV-006) | 만료 후 권한 유지 시도 | 일배치 |
| learning_attempts UPDATE 시도 (RLS-ADV-007) | append-only 위반, 차단됨 | 일배치 |
| account_deletion completed_at 셀프 갱신 (RLS-ADV-009) | 데이터 무결성 시도, 차단됨 | 일배치 |

**일배치 작업** (별도 nightly job, M5):
- audit_log에서 지난 24h `severity='P2'` 시도 집계 → Slack #security thread 1건 게시
- 형식: `[P2 digest 2026-05-12] tier-bypass 12건, append-only-violation 3건, completed_at-tamper 0건`

---

## 4. 페이로드 구조 (PII-free)

```json
{
  "severity": "P0",
  "pattern_id": "RLS-ADV-003",
  "actor": "usr_a1b2c3d4",
  "table": "subscription_entitlements",
  "attempted_action": "rls_violation_attempt",
  "blocked_by": "default-deny (no INSERT policy)",
  "timestamp_utc": "2026-05-11T13:25:30Z",
  "timestamp_kst": "2026-05-11 22:25",
  "runbook_url": "https://github.com/<org>/dash2zero/blob/main/docs/security/AUDIT_ALERT_RUNBOOK.md#P0"
}
```

**금지 필드**: 이메일 / 이름 / 전화번호 / IP / device_id 평문 / RevenueCat customer_id / 결제 카드 마스킹 정보 / JWT.

---

## 5. dedup 동작

```
T+0    user1이 RLS-ADV-001 시도 → audit_log insert → trigger fire
       dedup_key = sha256('usr_a1b2c3d4:user_word_states:rls_violation_attempt')
       dedup row 신규 → alert 발송 (P1)
T+30s  user1이 동일 시도 반복 → trigger fire → dedup row 윈도 내 → hit_count++, alert skip
T+5min  cleanup이 1시간 윈도 적용 (윈도 외)
T+5m1s 동일 시도 → 신규 alert 발송 가능 (alert 본문에 "지난 5분 hit_count=N" 동봉은 M5 enhancement)
```

`audit_alert_dedup` 테이블의 `last_seen_at + 1h` 이전 row는 `audit_alert_dedup_cleanup()` cron으로 삭제 (M5 pg_cron 등록).

---

## 6. M5 활성화 절차

1. Slack workspace에서 #security private 채널 incoming webhook 발급.
2. GitHub repo Settings → Secrets → Actions → New: `SLACK_SECURITY_WEBHOOK`.
3. Supabase Vault: `SELECT vault.create_secret('SLACK_SECURITY_WEBHOOK', '<URL>');` (동일 URL).
4. `0004_audit_triggers.sql`의 trigger는 자동 활성화 (vault에서 URL을 읽음).
5. `.github/workflows/security-alert-stub.yml` workflow_dispatch (mode=live, severity=P0)로 dry-run 1회.
6. P0/P1 fixture 1건씩 인위적으로 audit_log INSERT → Slack 수신 확인.
7. pg_cron 등록: `SELECT cron.schedule('audit-alert-dedup-cleanup', '0 * * * *', 'SELECT audit_alert_dedup_cleanup();');`
8. Slack 채널 retention 30일 이하 설정 (PII hash라도 누적 시 행동 패턴 추론 가능 — 데이터 최소화).
9. 본 runbook의 "Status: paper" → "Status: live" 갱신 + 활성화 일자 기록.

---

## 7. 운영자(향후) 권한 분리

- alert 채널은 1인 개발자(본인) DM 동시 — page 보장
- M5 운영자(외주 CS) 추가 시: support role JWT는 audit_log SELECT만 (INSERT/UPDATE 불가). #security 채널 access는 본인만.
- 페이로드의 `runbook_url`은 GitHub repo private 권한 필요 — 외주 access 시 별도 mirror 검토.

---

## 8. False positive 처리

- P1-1 cross-user read의 false positive 케이스: 정상 JOIN(`user_word_states JOIN words`)이 RLS row hide로 0건 반환되었을 때 → 클라이언트 코드 버그가 다른 user_id를 조회한 경우. 패턴 분석 시 동일 endpoint + 동일 timestamp 패턴 감지 시 코드 버그 의심.
- 처리: 24h 내 동일 actor의 hit_count > 50이면 코드 버그 의심 issue 생성, 봇 의심은 IP 분석.

---

## 9. PII 평문 절대 금지 — 검증

trigger의 `audit_actor_hash()` + 페이로드 빌드 단계에서 raw `NEW.actor` 사용 금지를 코드 리뷰 강제:
- `apps/api/edge-functions/_shared/audit.ts` emit 코드에서도 user_id 평문이 actor 컬럼에 들어가지 않도록 (`'user:' || hash` 형식만 허용)
- M5 초기에 grep guard CI rule 추가: `git grep -E "actor.*=.*user_id[^']" -- 'apps/api/**'` 실패 시 PR 차단 (R-27 mitigation 일부)

---

**끝.**
