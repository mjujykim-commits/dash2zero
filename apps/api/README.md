# @dash2zero/api

dash2zero 백엔드 — Supabase Edge Functions + Postgres + RLS.

> 상태: M2-S1 scaffold. 실제 Edge Functions 구현은 M2-S2~S6.
> 책임 agent: `backend`

## 구조

```
apps/api/
├── edge-functions/
│   ├── revenuecat-webhook/   # POST /webhooks/revenuecat (CC2-08, CC3-05)
│   ├── merge-guest/          # POST /account/merge-guest (CC2-04)
│   ├── srs-transition/       # POST /learning/attempts (CC2-10)
│   ├── delete-account/       # POST /account/delete (C-11, 30일 SLA)
│   ├── content-manifest/     # GET /content/manifest (CC2-15)
│   └── audio-signed-url/     # POST /audio/signed-url (CC3-04, premium TTL 6h)
├── shared/                   # 공통 helpers (auth, audit_log)
└── README.md
```

## 의존성

Supabase Edge Functions는 Deno 런타임. `import_map.json` 기반.

## 마이그레이션 / RLS

DB schema는 `infra/supabase/migrations/`에서 관리:

- `0001_init.sql` — 13 테이블 + index (M2-S2)
- `0002_rls.sql` — RLS 정책 (ADR-0004 그대로, M2-S2)
- `0003_seeds.sql` — 개발용 seed (M2-S2)

## 환경

- dev — 로컬 Supabase CLI
- staging — Supabase 별도 프로젝트
- prod — Supabase 별도 프로젝트 (D-009 devops 책임)

## SSOT 참조

- ERD: `../../docs/architecture/DOMAIN_MODEL.md`
- API spec: `../../docs/08_api_spec.md` v0.3
- ADR-0004 RLS: `../../docs/adr/ADR-0004-rls-policies.md`
