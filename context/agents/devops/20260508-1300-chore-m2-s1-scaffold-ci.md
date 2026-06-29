# M2-S1-04/05 — devops 활성화 + Scaffold + CI 골격

- **Agent**: devops (Specialist, D-009로 정식 활동 시작)
- **Commit SHA**: m2-s1-c4
- **Branch / Worktree**: chore/m2-s1-bootstrap-devops / (M2-S1 단일 트리)
- **작업 목표**: pnpm workspaces 설정 + apps/packages/infra scaffold + EAS 환경 분리 + GitHub Actions PR check
- **변경된 파일**:
  - `package.json` (root, pnpm workspaces)
  - `pnpm-workspace.yaml`
  - `apps/mobile/package.json` + `apps/mobile/README.md`
  - `apps/api/README.md`
  - `packages/contracts/package.json` + `packages/contracts/src/index.ts` + 4 인터페이스 stub + 1 enum (CC2-08 status)
  - `packages/design-tokens/package.json` + `packages/design-tokens/src/index.ts`
  - `infra/supabase/README.md`
  - `infra/eas/eas.json` (3 profile: development / preview / production, 3 번들 ID)
  - `.github/workflows/pr-check.yml` (lint + type + test + secret scan + context check)
  - `.github/workflows/eas-build.yml` (manual trigger)
- **사용한 Skill**: changelog-generator (예정 — 첫 commit 시) · file-organizer (디렉토리 구조 정리) · using-git-worktrees(가이드, M2-S2부터 worktree 분기)
- **내린 결정**:
  1. **pnpm workspaces** 채택 — RN/Expo + Edge Functions + 공유 packages 단일 의존성 트리
  2. **번들 ID 분리**: com.dash2zero.dev / .staging / .app (CC2-21 + Q-OPS-NEW-006)
  3. **PR check 5 job**: lint+type / contracts test / mobile test / secret scan (gitleaks) / context record check
  4. **Phased Rollout halt trigger** (CC3-08)는 M5 진입 시 별도 워크플로
- **리스크 / 후속 작업**:
  - **CC2-21 키 백업** — 1Password Emergency Kit 설정 W5 종료까지
  - Apple Developer 계정 + Google Play Console + RevenueCat owner 계정 emergency contact 지정 — D-42 직전 (legal과 협업)
  - EAS Secrets 관리 — Supabase URL/키, RC API 키, Firebase 설정 — M2-S2 진입 시
- **의존성 / blocker**: Supabase 3 프로젝트 생성 — backend가 W5 종료까지 진행 (D-009 협업)
- **다음 추천 액션**: 
  1. M2-S2 진입 시 worktrees/{role}/ 13개 활성화 (orchestrator 결정)
  2. CC2-21 키 백업 절차 매뉴얼 작성 (`docs/runbooks/SECURITY_REVIEW.md` 추가)
