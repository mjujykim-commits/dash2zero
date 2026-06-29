# Supabase Infrastructure

> 책임 agent: `backend` + `devops` (환경 분리)
> 상태: M2-S1 scaffold. 실제 migration / RLS 작성은 M2-S2 (W6).

## 환경 분리 (D-009)

| 환경 | Supabase 프로젝트 | 용도 |
|---|---|---|
| dev | dash2zero-dev (Free tier) | 로컬 개발자 + Edge Functions 단위 테스트 |
| staging | dash2zero-staging (Free tier) | 베타 직전 통합 테스트 + RC sandbox |
| prod | dash2zero-prod (Pro tier 예정 — DAU 1k 도달 시) | 정식 출시 |

번들 ID 분리:
- dev: `com.dash2zero.dev`
- staging: `com.dash2zero.staging`
- prod: `com.dash2zero.app`

## Migration 파일 (M2-S2 작성 예정)

| 파일 | 내용 | 작성 시점 |
|---|---|---|
| `migrations/0001_init.sql` | 13 테이블 + 인덱스 (DOMAIN_MODEL §2) | M2-S2 W6 |
| `migrations/0002_rls.sql` | RLS 정책 (ADR-0004 13×5×4 매트릭스) | M2-S2 W6 |
| `migrations/0003_seeds.sql` | 개발용 seed (Starter Pack 60단어 placeholder) | M2-S2 W7 |
| `migrations/0004_audit_triggers.sql` | audit_log triggers | M2-S3 W7 |

## Seeds

| 파일 | 내용 |
|---|---|
| `seeds/dev-users.sql` | 테스트 사용자 5명 |
| `seeds/golden-words.yaml` | SRS golden case 50개 입력 (M3) |

## SSOT 참조

- DOMAIN_MODEL: `../../docs/architecture/DOMAIN_MODEL.md`
- ADR-0004 RLS: `../../docs/adr/ADR-0004-rls-policies.md`
