# Audit Alert — Secret 등록 가이드 (M3 W15 → M5 활성화)

> 책임: **devops** · 협업: **security**
> 작성일: 2026-05-11 (M3 W15)
> 활성화 시점: **M5** (orchestrator 결정: "Slack webhook URL은 M5 이연, W15는 trigger + workflow stub만")
> SoT: `infra/supabase/migrations/0004_audit_triggers.sql` (security가 작성 중) + `.github/workflows/security-alert-stub.yml`

---

## 0. 요지

audit_log 위반 alert 송신 경로(security readiness §3.2 경로 B = AFTER INSERT trigger + pg_net)에 필요한 secret 인벤토리, 저장 위치, 등록 절차, rotation 정책, kill switch.

W15에는 **secret 미등록 / kill switch ON**. M5 활성화 시 본 가이드 단계 1~6 순차 실행.

---

## 1. Secret 인벤토리

| Secret 이름 | 저장 위치 | 용도 | M3 W15 | M5 |
|---|---|---|:---:|:---:|
| `SLACK_SECURITY_WEBHOOK` | **GitHub Actions secret** | CI 알림 (eval-nightly fail, security-alert-stub 발화 검증) | 미등록 | 등록 |
| `SLACK_SECURITY_WEBHOOK` | **Supabase `vault.secrets`** | DB trigger (`notify_security_violation()`) → pg_net.http_post | 미등록 | 등록 |
| `AUDIT_ALERT_DEDUP_SALT` | **Supabase `vault.secrets`** | user_id hash (sha256(user_id || salt) prefix 8자) PII 차단 | 미등록 | 등록 |
| `AUDIT_ALERT_KILL_SWITCH` | **Supabase `vault.secrets`** | trigger function 내부 if check — 빈 문자열이면 noop | (빈 문자열) | (활성 시 'on') |

> **결정 (devops 자율)**: webhook URL을 GitHub + Supabase **두 곳에 동일 값** 등록. 사유: CI 발화 채널과 DB 발화 채널이 분리되어 있어 단일 위치 보관 시 한쪽 사용 불가. rotation 시 두 곳 동시 갱신 — §5 절차 강제.

---

## 2. 저장 위치 의사결정 (devops 자율)

### 2.1 GitHub Actions secret

- 경로: GitHub repo → Settings → Secrets and variables → Actions → New repository secret
- 접근: workflow 내 `${{ secrets.SLACK_SECURITY_WEBHOOK }}`
- 적합: CI 발화(`security-alert-stub.yml` dispatch, `eval-nightly` fail 시 차후 알림)
- 부적합: DB trigger에서 polling 필요 → 지연 분 단위

### 2.2 Supabase `vault.secrets`

- 경로: Supabase Studio → Database → Vault → New secret (또는 `supabase secrets set`)
- 접근: SQL에서 `vault.read_secret('SLACK_SECURITY_WEBHOOK')`
- 적합: DB trigger / pg_net 직접 호출 → 초 단위 발화
- 부적합: GitHub Actions에서 직접 접근 불가 (Edge Function 경유 필요)

### 2.3 양쪽 권고 사유

| 시나리오 | 사용 위치 |
|---|---|
| audit_log INSERT → 위반 즉시 Slack | Supabase vault (경로 B) |
| eval-nightly fail → 다음날 Slack 통지 | GitHub Actions secret |
| security-alert-stub.yml dry-run | GitHub Actions secret |

---

## 3. 등록 절차 (M5 활성화 시)

### 단계 1 — Slack #security 채널 owner 승인

- [ ] orchestrator → user 승인: "Slack #security 채널에 incoming webhook 1개 발급"
- [ ] 첫 1주는 `#security-test` 임시 채널 (security readiness §3.3 dry-run 정책)
- [ ] webhook URL 발급 (Slack App → Incoming Webhooks → New)

### 단계 2 — GitHub Actions secret 등록

- [ ] repo Settings → Secrets and variables → Actions
- [ ] New secret: `SLACK_SECURITY_WEBHOOK` = `https://hooks.slack.com/...`
- [ ] **확인**: Actions 환경 secret이 아닌 repository secret (전체 workflow 접근)
- [ ] 등록 직후 `security-alert-stub.yml` manual dispatch 1회 → Slack 수신 확인

### 단계 3 — Supabase vault.secrets 등록

```bash
# CLI 사용 시
supabase secrets set SLACK_SECURITY_WEBHOOK="https://hooks.slack.com/..."
supabase secrets set AUDIT_ALERT_DEDUP_SALT="<32바이트 random hex>"
supabase secrets set AUDIT_ALERT_KILL_SWITCH="off"   # M5 활성화 직전에 "on"
```

또는 Supabase Studio → Vault → New secret 으로 동일 등록.

- [ ] DEDUP_SALT는 **prod / staging 분리** (서로 다른 값). 노출 시 user_id rainbow 방지
- [ ] KILL_SWITCH = "off" 등록 (활성화 시 "on" 변경)

### 단계 4 — 0004_audit_triggers.sql 정합 확인

security가 작성한 trigger function이 다음 contract 충족 확인:

```sql
-- 정합 contract (W15 stub 단계에서 합의)
CREATE OR REPLACE FUNCTION notify_security_violation()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  kill_switch TEXT;
  salt TEXT;
  user_hash TEXT;
BEGIN
  SELECT vault.read_secret('AUDIT_ALERT_KILL_SWITCH') INTO kill_switch;
  IF kill_switch IS NULL OR kill_switch <> 'on' THEN
    RETURN NEW;  -- noop (W15 ~ M5 진입 전)
  END IF;

  -- 위반 카테고리만 필터 (P0/P1)
  IF NEW.event_type NOT IN ('rls_denied', 'self_entitlement_attempt', 'signature_invalid', 'audit_self_tamper') THEN
    RETURN NEW;
  END IF;

  -- dedup (5분 윈도) — security readiness §10 dedup 규칙
  -- (별도 dedup 테이블 또는 advisory lock 사용)
  ...

  SELECT vault.read_secret('SLACK_SECURITY_WEBHOOK') INTO webhook_url;
  SELECT vault.read_secret('AUDIT_ALERT_DEDUP_SALT') INTO salt;
  user_hash := substr(encode(digest(NEW.user_id::text || salt, 'sha256'), 'hex'), 1, 8);

  PERFORM net.http_post(
    url := webhook_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'severity', NEW.severity,
      'pattern_id', NEW.pattern_id,
      'actor', 'usr_' || user_hash,   -- PII 차단 (security §10)
      'table', NEW.table_name,
      'attempted_action', NEW.action,
      'blocked_by', NEW.policy_name,
      'timestamp', NEW.occurred_at,
      'runbook_url', 'https://github.com/.../infra/alerts/README.md'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] `pg_net` extension 활성화 확인 (`SELECT * FROM pg_extension WHERE extname='pg_net';`)
- [ ] `vault` extension 활성화 확인
- [ ] trigger SECURITY DEFINER 권한 검토 (security)

### 단계 5 — Dry-run (kill switch off 상태에서 PERFORM 경로만 검증)

- [ ] staging Supabase에서 audit_log 위반 row 1건 수동 INSERT (service_role)
- [ ] trigger function이 호출되었으나 KILL_SWITCH='off'로 RETURN NEW 했음을 로그 확인
- [ ] KILL_SWITCH='on' 임시 변경 → 동일 INSERT → Slack 수신 확인 → 즉시 'off' 복귀
- [ ] PII 누출 없는지 payload 검사 (user_id 평문 0건)

### 단계 6 — Production 활성화 (M5 게이트 후)

- [ ] M5 게이트 통과 + closed beta 30~50명 모집 완료
- [ ] prod Supabase vault에도 secret 등록 (staging과 다른 값 — DEDUP_SALT만 분리)
- [ ] KILL_SWITCH='on' 으로 변경
- [ ] 첫 24시간 #security-test 채널 모니터 (false positive 측정)
- [ ] 7일 후 #security 본 채널로 라우팅 변경 (webhook URL 교체)

---

## 4. Kill switch (긴급 차단)

| 상황 | 액션 |
|---|---|
| Slack 채널 폭주 / spam | `supabase secrets set AUDIT_ALERT_KILL_SWITCH="off"` 즉시 |
| webhook URL 노출 의심 | URL rotation (§5) + KILL_SWITCH off 동시 |
| DB load 급증 (trigger 호출 폭주) | KILL_SWITCH off → 원인 분석 후 dedup 윈도 조정 |

kill switch 변경은 trigger function이 **다음 호출**에서 즉시 반영 (vault read는 매 호출마다). 별도 deploy 불필요.

---

## 5. Rotation 정책

| Secret | 주기 | 사유 |
|---|---|---|
| `SLACK_SECURITY_WEBHOOK` | 분기 1회 (Q1/Q2/Q3/Q4 첫 월요일) | repo 권한자 + Slack admin 노출 위험 분산 |
| `AUDIT_ALERT_DEDUP_SALT` | 6개월 1회 | rainbow 공격 윈도 단축. 변경 시 dedup 윈도 동안 중복 alert 가능 (수용) |
| `AUDIT_ALERT_KILL_SWITCH` | rotation 무관 | 운영 toggle |

**Rotation 절차 (webhook 기준)**:
1. Slack에서 신규 webhook 발급 (이전 URL과 동일 채널)
2. 신규 URL을 GitHub Actions secret 갱신
3. 신규 URL을 Supabase vault.secrets 갱신
4. 24시간 모니터 → 이상 없으면 이전 webhook revoke
5. 본 가이드 §5 표에 rotation 일자 기록

---

## 6. 1인 운영 단일 장애점 대비

- **secret 백업**: 1Password Vault `dash2zero / security / audit-alert` 항목에 webhook URL + DEDUP_SALT 저장 (Emergency Kit 절차에 포함)
- **rotation 알람**: Calendar 분기 1회 reminder (devops 본인). 자동화는 M5 이후
- **Slack admin 백업**: 본인 외 1명에게 channel admin 부여 (orchestrator 승인 필요)

---

## 7. 의존성

| 항목 | 상태 | 책임 | 마감 |
|---|---|---|---|
| `0004_audit_triggers.sql` 머지 | W15 작업 중 | security | M3 종료 전 |
| `.github/workflows/security-alert-stub.yml` 머지 | W15 작업 중 | security + devops | M3 종료 전 |
| `pg_net` extension prod 활성화 확인 | 미확인 | backend | M5 D-7 |
| `vault` extension prod 활성화 확인 | 미확인 | backend | M5 D-7 |
| Slack #security 채널 + webhook 발급 | 미발급 | orchestrator → user | M5 D-7 |
| 1Password Vault 보관 | 미설정 | devops | M5 D-3 |

---

## 8. REVIEW_QA 연계 질문

- **Q-OPS-W15-002 (P0)** Slack webhook URL은 user 직접 #security 채널 발급인가, 임시 #security-test 1주 운영 후 승격인가? (devops readiness §6)
- **Q-OPS-W15-003 (P1)** pg_net / vault extension prod 활성화 상태 (backend 확인 요청)
- **Q-OPS-NEW-009 (P2)** 야간/주말 P0 장애 알림 채널 강화 (REVIEW_QA §9.4.12)

---

## 9. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-11 | 초안 — secret 인벤토리 4개 + 6단계 활성화 절차 + kill switch + rotation | devops |
