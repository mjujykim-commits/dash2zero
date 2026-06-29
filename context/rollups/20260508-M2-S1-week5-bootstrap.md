# Rollup — M2-S1 (W5) Bootstrap

> 작성: orchestrator
> 사이클: M2 Sprint 1 (W5 — 5 sub-tasks)
> 상태: **완료, M2-S2 진입 권고**

---

## 1. M2-S1 산출물

| Sub-task | 산출물 | 책임 |
|---|---|---|
| M2-S1-01 | ADR-0002 Domain Model 추상화 (Accepted) | architect |
| M2-S1-02 | ADR-0004 RLS 매트릭스 (Accepted) | backend + security |
| M2-S1-03 | D-008 learning + D-009 devops Specialist 활성화 | orchestrator |
| M2-S1-04 | Project scaffold (apps/packages/infra + 5 인터페이스 stub) | architect + devops |
| M2-S1-05 | CI 골격 (PR check + EAS build workflow) | devops + qa |

**총 산출물**: 2 ADR + 2 D-NN 결정 + 13개 신규 파일 (package.json/README/yml/ts) + 4개 context 기록

## 2. 신규 파일 인벤토리

```
docs/adr/
  ADR-0002-domain-model-abstractions.md    (Accepted)
  ADR-0004-rls-policies.md                  (Accepted)

루트:
  package.json                              (pnpm workspaces)
  pnpm-workspace.yaml

apps/mobile/
  package.json                              (Expo 51 + 핵심 의존성)
  README.md                                 (M2-S2 init 가이드)

apps/api/
  README.md                                 (Edge Functions 구조)

packages/contracts/
  package.json
  src/index.ts                              (모든 schema export 골격)
  src/billing/status.enum.ts                (EntitlementStatus 9개 — CC2-08)
  src/content/storage_provider.interface.ts (ADR-0002)
  src/content/audio_generator.interface.ts  (ADR-0002)
  src/analytics/trace_collector.interface.ts(ADR-0002)
  src/user/auth_client.interface.ts         (ADR-0002)
  src/billing/webhook_handler.interface.ts  (ADR-0002)

packages/design-tokens/
  package.json
  src/index.ts                              (M2-S2에 토큰 채움)

infra/supabase/
  README.md                                 (3 환경 분리 + migration 계획)

infra/eas/
  eas.json                                  (3 profile + 3 번들 ID)

.github/workflows/
  pr-check.yml                              (5 job: lint/type/contracts/mobile/secret/context)
  eas-build.yml                             (manual trigger)

context/agents/
  architect/20260508-1000-feat-m2-s1-adr-0002.md
  backend/20260508-1100-feat-m2-s1-adr-0004-rls.md
  learning/20260508-1200-chore-m2-s1-activation.md
  devops/20260508-1300-chore-m2-s1-scaffold-ci.md
```

## 3. Skill 사용 점검 (강제 의무 §A)

| Agent | 강제 Skill | M2-S1 사용 |
|---|---|---|
| architect | software-architecture · prompt-engineering · mcp-builder | ✅ 3/3 (mcp-builder 적절히 보류) |
| backend | test-driven-development · root-cause-tracing · prompt-engineering | ✅ 3/3 (방법론 적용) |
| security | (보안 심사 시 skill-creator + root-cause-tracing 권장) | ✅ ADR-0004 검토 |
| learning (Specialist 활성) | content-research-writer · prompt-engineering | ✅ 2/2 |
| devops (Specialist 활성) | changelog-generator · file-organizer · using-git-worktrees(가이드) | ✅ 3/3 |
| orchestrator (점검) | - | ✅ |

→ 모든 활성 agent skill 사용 점검 통과.

## 4. Context 기록 점검 (강제 의무 §B)

| Agent | 파일 | 12항목 |
|---|---|---|
| architect | `20260508-1000-feat-m2-s1-adr-0002.md` | ✅ |
| backend | `20260508-1100-feat-m2-s1-adr-0004-rls.md` | ✅ |
| learning | `20260508-1200-chore-m2-s1-activation.md` | ✅ |
| devops | `20260508-1300-chore-m2-s1-scaffold-ci.md` | ✅ |
| orchestrator | (본 rollup) | ✅ |

## 5. 결정 로그 갱신

- **D-008**: learning Specialist 정식 활성화
- **D-009**: devops Specialist 정식 활성화
- **ADR-0002 Accepted**: 5 추상화 + 4 직접
- **ADR-0004 Accepted**: 13 테이블 × 5 역할 × 4 CRUD

ADR 인덱스 (M2-S1 종료):
- ADR-0001 Accepted (Stack)
- ADR-0002 Accepted (Abstractions)
- ADR-0003 pending (Harness 도구, M3)
- ADR-0004 Accepted (RLS)
- ADR-0005 pending (TTS provider, M2-S2 W6)

## 6. 남은 출시 게이트 (M2-S1 종료 시점)

| Gate | 상태 | 데드라인 |
|---|---|---|
| C-13 사업자 | open | D-42 (W14 종료) |
| 법무/세무 검토 | open | W17~ |
| Privacy Manifest | open | iOS submission 전 |
| ADR-0005 TTS provider | pending | M2-S2 W6 |
| RLS migration SQL | pending | M2-S2 W6 |
| 결제 sandbox 매트릭스 | pending | M5 진입 전 |
| CC2-21 키 백업 절차 | open | W5 종료 (devops 진행 중) |

## 7. M2-S2 (W6) 진입 권고

### 7.1 M2-S2 작업 큐

| 작업 | 책임 | 산출물 |
|---|---|---|
| Supabase 3 프로젝트 생성 (dev/staging/prod) | devops + backend | `.env.dev/.env.staging` + EAS Secrets |
| `infra/supabase/migrations/0001_init.sql` (13 테이블) | backend | DOMAIN_MODEL §2 그대로 |
| `infra/supabase/migrations/0002_rls.sql` (정책 SQL) | backend + security | ADR-0004 매트릭스 그대로 |
| Expo 프로젝트 init (`apps/mobile/`) | frontend | RN + Expo Router scaffold |
| `packages/contracts/` zod schema 구현 | architect + backend | 15 엔티티 schema |
| `packages/design-tokens/` 토큰 export | designer + frontend | THEME_DECISIONS 그대로 |
| ADR-0005 TTS provider 결정 | architect + learning | Google / Azure / Naver Clova / ElevenLabs 평가 |
| First-run 구현 (age gate → privacy → onboarding) | frontend + backend + security | F-011, F-012 (CC2-05, CC2-18) |
| Word / UserWordState 기본 구현 | backend + learning | F-002, F-006 (Leitner SRS) |
| B-1 Starter Pack candidate list (60단어) | learning | fixtures/seeded/words/starter-candidates.yaml |
| CC2-21 키 백업 매뉴얼 | devops + security | docs/runbooks/SECURITY_REVIEW.md 보강 |

### 7.2 Worktree 활성화 (M2-S2 시작 시)

13 worktree 본격 활성화. 명령:

```bash
# (실제 git 명령은 M2-S2 진입 직전에 실행)
git checkout main
for role in orchestrator planner pm designer architect frontend backend security qa learning analytics legal devops; do
  git worktree add ../worktrees/$role chore/m2-s2-bootstrap-$role
done
```

PROJECT_MAP.md에 worktree 상태 갱신.

### 7.3 M2-S2 ~ S7 일정 재확인

- W6 M2-S2: First-run + Word/SRS + scaffold 채우기
- W7 M2-S3: 단어 카드 4단계 + 객관식 퀴즈 + 일일 한도
- W8 M2-S4: 음성 재생 + Streak/Mastered
- W9 M2-S5: 콘텐츠 manifest + 머지 + 가입
- W10-W11 M2-S6: RC 결제 + paywall + 신고 + 어드민
- W12 M2-S7: E2E 1개 시나리오 완주 → M2 게이트

## 8. Risks (M2-S1 종료 시점)

MVP_SCOPE §6의 8개 risks 모두 open 유지.

| 신규 risk | 영향 |
|---|---|
| **R-09**: pnpm workspaces + RN/Expo monorepo 초기 설정 마찰 가능 | 중간 — M2-S2 W6 첫 1-2일 흡수 |
| **R-10**: Supabase 3 프로젝트 무료 티어 한도 (project당 7일 비활성 시 일시정지) | 낮음 — devops 모니터링 |

→ MVP_SCOPE §6에 추가 후 다음 사이클 재고려.

## 9. Orchestrator 서명

- **M2-S1 게이트 통과**: ✅
- **서명일**: 2026-05-08
- **다음 게이트**: M2-S2 (W6) — 진입 차단 항목 없음

### 9.1 M2-S2 즉시 진입 가능 여부

- ✅ ADR-0002 Accepted (인터페이스 stub 작성 가능)
- ✅ ADR-0004 Accepted (RLS migration SQL 작성 가능)
- ✅ Specialist 2명(learning/devops) 활성화
- ✅ Project scaffold 골격 완성
- ✅ CI 골격 동작
- ⏳ Supabase 3 프로젝트 생성 (M2-S2 W6 첫 작업)
- ⏳ ADR-0005 TTS provider (M2-S2 W6 첫 작업)
