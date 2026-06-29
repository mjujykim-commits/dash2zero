# dash2zero — Stack Options Matrix

> 작성: architect agent (M1, 2026-05-07)
> 협업 입력: pm (운영 부담 평가), planner (서비스 성격 분류), security (규제/감사)
> 목적: **고정 스택 금지 — 3개 후보를 정량/정성 평가 후 STACK_DECISION으로 봉인** (사용자 지시 §9)
> Skill 사용: software-architecture · prompt-engineering · mcp-builder (보류)

---

## 1. 서비스 기술 성격 분류 (사용자 지시 §9-1)

PRD + 사업계획서 + v0.3 기획서 기반 평가.

| 평가 축 | dash2zero MVP | 등급 |
|---|---|---|
| 출시 속도 중요도 | 20주 baseline (CC2-14) | **매우 높음** |
| 운영 인력 수준 | 1인 개발자 (A-101 주 20시간) | **매우 낮음** |
| DevOps 역량 | 1인, 풀타임 미투입 가정 | **낮음** |
| 예상 동시 사용자 (DAU) | 베타 30명 → 첫해 1k 가정 (A-202) | **낮음** |
| 요청 패턴 | request-response (실시간 SRS / IAP) + manifest fetch (배치성) | **혼합** |
| 데이터 민감도 | 학습 진도 + 결제 영수증 (PII 일부) | **중간** |
| 규제/감사 | UK GDPR + COPPA + 한국 사업자 (잠정) | **중간** |
| AI 추론 비용/빈도 | TTS 사전 생성만 (런타임 LLM 없음) | **낮음** |
| 멀티테넌시 | B2C, 단일 테넌트 | **불필요** |
| 배포 지역 | US/CA/UK/AU/NZ (글로벌 5국) | **글로벌** |
| 장애 허용도 | 학습/결제 핵심, 단 99.5% crash-free 목표 | **중간** |
| Latency 요구 | 음성 재생 < 200ms 캐시 hit, API < 1s | **중간** |
| 예산 제약 | 1인 부트스트랩 (월 ~$50 인프라 상한 가정) | **매우 엄격** |
| Vendor lock-in 허용 | M3까지 허용, post-MVP 재검토 (D-003) | **중간** |
| 향후 B2B/Enterprise | post-MVP 검토, MVP에서는 미고려 | **낮음** |
| 외부 연동 복잡도 | RC + Apple/Google IAP + TTS provider | **중간** |
| 백오피스/어드민 | Supabase Studio + 운영 시트 (CC2-15: 50단어 batch) | **낮음** |
| 파일/미디어 처리량 | 음성 ~600 파일 × 사용자 캐시 (egress 주요) | **낮음~중간** |
| Background job 복잡도 | 30일 hard-delete cron / RC webhook 처리 | **낮음** |
| Observability 필요도 | crash + funnel + 87 golden + (선택) trace | **중간** |

### 1.1 분류 결론

**dash2zero MVP는 "Lean / Managed / Single Founder" 영역에 명확히 위치**한다.

→ 후보 A (Lean / MVP / Serverless-Managed)가 가장 자연스러우나, 후보 B/C와 정량 비교 후 봉인.

---

## 2. 후보 A — Lean / MVP / Serverless-Managed

### 2.1 구성

| 영역 | 도구 |
|---|---|
| Mobile | React Native + Expo + TypeScript + Expo Router |
| Build/Submit | EAS Build + EAS Submit + EAS Update (OTA) |
| Backend / Auth / DB / Storage | **Supabase** (Postgres + Auth + Storage + Edge Functions + RLS) |
| 결제 | RevenueCat + Apple/Google IAP |
| 분석 / Crash | Firebase Analytics + Crashlytics |
| TTS | Google Cloud TTS Neural 또는 Azure Speech (사전 생성 → Storage) |
| Notification | Expo Notifications (FCM/APNs 추상화) |
| CI/CD | GitHub Actions (무료 티어) + EAS |
| Tracing (선택, M3) | Langfuse cloud free tier |

### 2.2 적합성

✅ 1인 운영, 빠른 출시, 낮은 비용, 검증된 잠정 결정 (REVIEW_QA 단계에서 합의)
⚠️ Vendor lock-in (Supabase + Firebase 양 vendor), Storage egress 비용 시 부담 (A-203)

### 2.3 월 비용 추정 (DAU 100 기준)

| 항목 | 비용 |
|---|---|
| Supabase Free → Pro | $0 → $25/mo (DAU 1k 도달 시 — A-202) |
| Firebase Spark | $0 (Crashlytics + Analytics 무료) |
| RevenueCat | $0 ($2.5K MTR 무료, 그 후 1%) |
| Google TTS 600 파일 1회 생성 | ~$10 (A-205) |
| Storage egress | DAU 1k까지 $0~5 |
| EAS Build | 무료 30 builds/mo (충분) |
| GitHub Actions | 무료 |
| **합계 (MVP)** | **~$0~25/mo** |

---

## 3. 후보 B — Balanced / Growth / Managed Platform

### 3.1 구성

| 영역 | 도구 |
|---|---|
| Mobile | React Native + Expo (ejected if needed) |
| Backend | Node.js + Fastify or NestJS, 자체 구현 |
| 호스팅 | Render or Fly.io or Railway (managed PaaS) |
| Database | Managed Postgres (Neon / Supabase DB만 / Render Postgres) |
| Cache / Queue | Upstash Redis (free tier) |
| Background worker | 같은 PaaS 또는 Inngest |
| Storage | Cloudflare R2 + Workers |
| Auth | 자체 (NextAuth-style) 또는 Clerk |
| 결제 | RevenueCat + IAP |
| 분석 / Crash | Sentry (free tier) + PostHog (self-host or cloud) |
| TTS | Google Cloud TTS |
| Notification | FCM/APNs 직접 + node-pushnotifications |

### 3.2 적합성

✅ 더 명확한 layer 분리, vendor 다변화로 lock-in 감소
⚠️ 운영 컴포넌트 수 ≥7개 (Orchestrator §1 "1인 운영 5개 권고" 위반)
⚠️ 자체 백엔드 코드 작성/배포/관제 부담 증가
⚠️ 출시 일정 6-8주 추가 가능성 (A-102 위반 리스크)

### 3.3 월 비용 추정 (DAU 100)

| 항목 | 비용 |
|---|---|
| Render starter | $7-25/mo |
| Neon free → pro | $0-19/mo |
| Upstash Redis free | $0 |
| Cloudflare R2 | $0 (무료 tier 충분) |
| Sentry team | $26/mo |
| PostHog cloud | $0 (1M events 무료) |
| TTS | ~$10 |
| **합계** | **~$50-90/mo** |

---

## 4. 후보 C — Scale / Regulated / Enterprise-Ready

### 4.1 구성

| 영역 | 도구 |
|---|---|
| Mobile | RN bare 또는 native (Swift/Kotlin) |
| Backend | Node.js / Go / Rust on AWS ECS Fargate or EKS |
| Network | VPC + IAM + WAF + Secrets Manager + KMS |
| Database | RDS Postgres Multi-AZ + RDS Proxy |
| Cache / Queue | ElastiCache Redis + SQS |
| Storage | S3 + CloudFront + Origin Shield |
| Auth | Cognito or Auth0 enterprise |
| 결제 | RevenueCat + Stripe (B2B 가능) |
| 분석 | Datadog + Honeycomb + OpenTelemetry |
| TTS | AWS Polly Neural |
| Notification | SNS / Pinpoint |
| CI/CD | GitHub Actions + ArgoCD or CodePipeline |
| IaC | Terraform |

### 4.2 적합성

❌ 1인 운영 불가능
❌ 출시 속도 매우 느림 (3-6개월 추가)
❌ 월 비용 $500+
✅ 단, B2B/Enterprise 출시 시 필수 — post-MVP에서 재검토

### 4.3 월 비용 추정 (DAU 100)

| 항목 | 비용 |
|---|---|
| ECS Fargate | $50-100/mo |
| RDS db.t4g.small Multi-AZ | $60-100/mo |
| ElastiCache | $30/mo |
| CloudFront + S3 | $20/mo |
| Datadog | $15-30/host |
| Cognito MAU 50k | $0 |
| **합계** | **~$200-400/mo** (DAU 100, 부하 작아도 인프라 고정비) |

---

## 5. 정량 평가 매트릭스 (사용자 지시 §9-3, 15개 축)

각 항목 0-10 점수 (10이 최고). dash2zero MVP의 우선순위 가중치 적용.

| 평가 축 | 가중치 | 후보 A (Lean) | 후보 B (Balanced) | 후보 C (Scale) |
|---|---:|---:|---:|---:|
| 구현 속도 | 10 | **9** | 6 | 2 |
| 초기 개발 생산성 | 9 | **9** | 7 | 4 |
| 초기 비용 | 10 | **10** | 7 | 2 |
| 운영 복잡도 | 10 | **9** | 5 | 2 |
| 확장성 | 5 | 5 | 7 | **9** |
| 장애 대응 난이도 | 7 | **8** | 6 | 4 (1인 환경에서) |
| 보안 적합성 | 8 | 7 | 7 | **9** |
| 규제 적합성 (UK GDPR, COPPA) | 8 | **8** (Supabase EU/US 선택) | 8 | **9** |
| 관측성 도입 난이도 | 6 | 7 | **8** | 6 |
| AI 워크로드 적합성 | 3 | 7 | 7 | 7 (모두 동등 — TTS 사전생성) |
| 데이터 모델 복잡도 대응력 | 6 | 7 | 8 | **9** |
| 팀 숙련도 적합성 (1인 개발자) | 10 | **9** | 6 | 2 |
| 벤더락인 | 6 | 5 | **8** | 7 |
| 마이그레이션 비용 | 5 | 6 | 7 | **8** |
| 향후 enterprise 전환 적합성 | 4 | 5 | **7** | **10** |

### 5.1 가중 합계

```
가중치 합계: 107

후보 A 가중점수:
  9×10 + 9×9 + 10×10 + 9×10 + 5×5 + 8×7 + 7×8 + 8×8 + 7×6 + 7×3 + 7×6 + 9×10 + 5×6 + 6×5 + 5×4
= 90 + 81 + 100 + 90 + 25 + 56 + 56 + 64 + 42 + 21 + 42 + 90 + 30 + 30 + 20
= 837 / 1070 = 78.2%

후보 B 가중점수:
= 60 + 63 + 70 + 50 + 35 + 42 + 56 + 64 + 48 + 21 + 48 + 60 + 48 + 35 + 28
= 728 / 1070 = 68.0%

후보 C 가중점수:
= 20 + 36 + 20 + 20 + 45 + 28 + 72 + 72 + 36 + 21 + 54 + 20 + 42 + 40 + 40
= 566 / 1070 = 52.9%
```

### 5.2 결과

| 후보 | 가중점수 | 결론 |
|---|---:|---|
| **A. Lean** | **78.2%** | **최적** — MVP 우선순위(속도 + 비용 + 1인 운영)에 압도적 |
| B. Balanced | 68.0% | 차선 — Lean의 vendor lock-in이 문제될 때 |
| C. Scale | 52.9% | 부적합 — post-MVP B2B 진입 시 재검토 |

---

## 6. 정성적 트레이드오프 (정량으로 안 잡히는 부분)

### 6.1 후보 A의 위험 — Vendor Lock-in

**위험:**
- Supabase + Firebase 두 vendor에 깊이 의존
- 가격 인상 / 서비스 종료 시 큰 마이그레이션 비용
- Auth/RLS/Storage/Edge Functions 4영역 동시 락인

**완화책 (M1 잠정 채택):**
- Domain Model의 Contract Layer에서 인터페이스 추상화 (CC2-11 — `auth/storage/queue` 등 9개 경계면)
- ADR-0002로 추상화 범위 봉인
- M3에서 Langfuse 도입 시 trace는 별도 vendor 분리

**탈출 트리거 (STACK_EVOLUTION_PLAN에 정의):**
- DAU 1k 시 Supabase Pro $25/mo + 비용 시뮬 재검토
- DAU 10k 시 또는 EU 데이터 거주자 발생 시 후보 B로 마이그레이션 검토
- Enterprise 고객 발생 시 후보 C로

### 6.2 후보 B의 적합성 — 단계적 진화 경로

후보 A의 다음 단계로 자연스럽게 진화 가능. 후보 A의 Supabase Postgres → Neon으로 옮기면서 자체 백엔드 추가 패턴.

### 6.3 후보 C의 부적합성 — MVP 단계

1인 개발자가 ECS/Terraform/Datadog 운영 불가능. M5 출시 후 enterprise 고객 발생 시 별도 ADR로 진입.

---

## 7. 보류된 결정

| 항목 | 결정 시점 |
|---|---|
| 후보 A 안에서 TTS provider 선택 (Google / Azure / Naver Clova / ElevenLabs) | M2 첫 콘텐츠 생성 시 (Q-PM-NEW-003) |
| Langfuse 도입 시점 (M3 후반 vs M5) | M3 진입 시점 (ADR-0003) |
| 후보 A → B 마이그레이션 트리거 정량값 | STACK_EVOLUTION_PLAN.md (M1 차순) |

---

## 8. 권고 — STACK_DECISION 입력

**후보 A (Lean / Managed) 선택 권고**:

1. 정량 78.2%로 압도적 1위
2. 1인 개발자 + 20주 일정 + 월 $25 이하 비용에 부합
3. Vendor lock-in은 Contract Layer 추상화 + 마이그레이션 트리거로 완화
4. 후보 B로의 진화 경로 명확

**최종 결정은 STACK_DECISION.md + ADR-0001로 봉인** (orchestrator 승인 필요).

---

## 9. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M1-6 v1.0 — 3 후보 정량(15축 가중) + 정성 평가, 후보 A 권고 (78.2% vs 68% vs 53%) | architect |
