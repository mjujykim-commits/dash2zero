# dash2zero — Infrastructure Bootstrap Runbook

> 책임 agent: devops (D-009) + backend
> 시점: M2-S5 (W9) 첫 작업
> 본 문서는 **외부 cloud 작업** (Supabase / Google Cloud / RevenueCat / Apple Developer / Google Play / Firebase) 절차서.
> 코드 외 작업이라 본 runbook 따라 1인 PM이 직접 수행.

---

## 1. Supabase 3 프로젝트 (D-009 W5 결정 — Free tier 시작)

### 1.1 프로젝트 생성

| 환경 | 프로젝트명 | Region | Plan |
|---|---|---|---|
| dev | `dash2zero-dev` | us-east-1 (북미 우선) | Free |
| staging | `dash2zero-staging` | us-east-1 | Free |
| prod | `dash2zero-prod` | us-east-1 (M5에서 Pro 전환) | Free → Pro |

> **Region 선택 사유** (SEC-DOC-004): 1차 출시 5개국이 북미·UK·AU·NZ. UK GDPR DPA는 Supabase 표준 SCC + UK IDTA 자동 적용 (Supabase 공식 문서). 트래픽 패턴상 US East가 평균 latency 최저.

### 1.2 각 프로젝트마다 수행

```bash
# 1. supabase CLI 로그인 (1회)
supabase login

# 2. dev/staging/prod 별 link
supabase link --project-ref <PROJECT_REF>

# 3. migration apply (0001 → 0002 → 0003 순)
supabase db push

# 4. seed (개발 환경만)
psql $SUPABASE_DB_URL -f infra/supabase/seeds/dev-users.sql
```

### 1.3 환경 변수 (EAS Secrets로 주입)

| Key | dev | staging | prod |
|---|---|---|---|
| `SUPABASE_URL` | https://dash2zero-dev.supabase.co | https://dash2zero-staging.supabase.co | https://dash2zero-prod.supabase.co |
| `SUPABASE_ANON_KEY` | (Settings → API) | ditto | ditto |
| `SUPABASE_SERVICE_ROLE_KEY` | **NEVER in client bundle** — Edge Functions secret only | ditto | ditto |

```bash
# EAS Secrets 등록 (D-009 책임)
eas secret:create --name SUPABASE_URL_DEV --value "https://dash2zero-dev.supabase.co"
eas secret:create --name SUPABASE_ANON_KEY_DEV --value "..."
# ... (staging, prod 동일)
```

### 1.4 Storage bucket 설정

```sql
-- audio bucket (CC3-04: free public, premium private signed URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', false);  -- private 기본

-- Storage RLS — anon free tier audio 접근 허용 (audio_assets.tier 매칭은 Edge Function이 처리)
CREATE POLICY "audio_anon_read_free" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'audio');  -- 단순화 — 실제 tier 필터는 Edge Function
```

---

## 2. Google Cloud TTS (ADR-0005)

### 2.1 프로젝트 생성

```
프로젝트명: dash2zero-tts
Billing account: <Owner 신용카드>
APIs: Cloud Text-to-Speech API enable
```

### 2.2 Service Account

```
Service Account: tts-generator
역할: Cloud Text-to-Speech User
Key 형식: JSON (다운로드 후 1Password 저장 — CC2-21)
```

### 2.3 Audio 생성 실행

```bash
# 환경 변수 export
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/dash2zero-tts-sa.json

# Starter Pack 60 audio 생성 (Owner local에서 1회)
pnpm tsx scripts/content/generate-audio.ts \
  fixtures/seeded/words/starter-pack-candidates.yaml \
  /tmp/dash2zero-audio/starter-001
```

### 2.4 비용 모니터링

- Billing alert: 월 $20 도달 시 Owner email
- 예상 비용 (ADR-0005): 60 단어 + 60 예문 = 120 audio × ~30 chars = 3,600 chars × $16/1M = **~$0.06** (실제 약 $0.05-0.10)

---

## 3. RevenueCat (CC-09)

### 3.1 프로젝트 생성

```
앱: dash2zero (iOS + Android 동시 등록)
Apple Bundle ID: com.dash2zero.app
Google Package: com.dash2zero.app
```

### 3.2 Products 등록

```
Subscription Group: dash2zero_premium

Products (D-018 봉인 2026-05-13):
  - premium_monthly   ($4.99 / month)   # Apple Tier 5
  - premium_annual    ($49.99 / year)   # Apple Tier 50, ~16% off

Entitlement:
  - premium  (둘 다 grant)
```

### 3.3 Webhook 설정 (CC2-08, M2-S6에 사용)

```
Webhook URL: https://<supabase-prod>.supabase.co/functions/v1/revenuecat-webhook
Authorization: Bearer <secret> (RevenueCat → Edge Function 검증)
Events: 모두 (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE, REFUND, REVOKE, TRANSFER, PRODUCT_CHANGE)
```

### 3.4 환경 분리

- **Sandbox**: RC sandbox + Apple/Google sandbox tester
- **Production**: RC production (출시 직전 활성화)

---

## 4. Apple Developer / Google Play

### 4.1 Apple Developer (D-008/D-009/CC2-21)

- **계정**: 개인 / 법인 결정은 C-13 사업자 확정 후 (D-42 전)
- **Team ID**: 1Password 저장
- **App Store Connect**:
  - App: dash2zero
  - Bundle: com.dash2zero.app
  - In-App Purchase: premium_monthly / premium_annual (RC와 매핑)
  - Privacy Nutrition Label: M4에서 작성
  - Age Rating: 4+ (CC2-05 13세 차단으로 4+ 가능)
  - Territory: US/CA/UK/AU/NZ만 (CC2-20 EU 명시 제외)

### 4.2 Google Play Console

- 비슷한 절차. Data Safety Form은 M4에서.

---

## 5. Firebase (CC2-12)

### 5.1 프로젝트 생성

```
dash2zero-dev / dash2zero-staging / dash2zero-prod
```

각 프로젝트에 iOS + Android 앱 등록.

### 5.2 Analytics + Crashlytics

- Firebase Spark plan (무료) 시작
- BigQuery export: **disabled** (CC2-23, DAU 1k 도달 시 활성)
- IDFA 미사용: SDK 초기화 옵션 `automaticScreenReportingEnabled=false`

---

## 6. 1Password Emergency Kit (CC2-21 / CC3-21)

### 6.1 보관할 secrets

| 항목 | 위치 | 백업 |
|---|---|---|
| Apple Team ID + App-specific password | 1Password | Yes |
| Google Play service account JSON | 1Password | Yes |
| Apple distribution cert (`.p12`) + password | 1Password (encrypted attachment) | Yes |
| Android upload keystore (`.jks`) | 1Password | Yes |
| RevenueCat API keys | 1Password | Yes |
| Supabase service_role keys (3환경) | 1Password | Yes |
| Google Cloud TTS service account JSON | 1Password | Yes |
| Firebase admin SDK JSON | 1Password | Yes |
| EAS Owner password | 1Password | Yes |

### 6.2 Dead Man's Switch

- 6개월 미접속 시 emergency contact 1명에게 자동 vault 공유
- Emergency contact: TBD (Owner 가족 또는 법무대리인 — D-42 결정)

---

## 7. 검수자 계약 (R-01 / CC3-07)

### 7.1 모집 채널 (W4-W5에 시작)

- Reddit r/Korean — 한국어 교육 경험 원어민
- Discord 한국어 학습 커뮤니티
- 지인 추천

### 7.2 계약 템플릿 (legal Specialist standby — D-42에 정식 검토)

```
역할: dash2zero 한국어 콘텐츠 검수자 (contractor)
업무 범위:
  - 매월 약 50단어 검수 (gloss 정확성 / 예문 자연성 / RR 표기 / distractor 적합성)
  - 단어당 평균 5-10분 (총 5-8시간/월)
보수: 단어당 $X (협의)
계약 기간: 월 단위 갱신, 30일 사전 통지로 종료
NDA: dash2zero 콘텐츠 작업 비공개
시작 시점: M2-S5 W9 — Starter Pack 60단어 첫 검수
```

법무 검토 (D-42 trigger): 한국 사업자 가정 시 통신판매업과 무관 (콘텐츠 외주). 미국/영국 등 해외 검수자 시 1099-NEC / IR35 규정 검토 필요.

---

## 8. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-08 | M2-S5 W9 v1.0 초안 — Supabase 3 프로젝트 + TTS + RC + Apple/Google + Firebase + 1Password + 검수자 계약 | devops + backend |
