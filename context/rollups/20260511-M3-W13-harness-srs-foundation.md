# Rollup — M3 W13 Harness 기초 (Custom Runner + SRS Evaluator + Golden 대표 7건)

> 작성: orchestrator
> 사이클: M3 W13 (Harness Hardening 첫 sprint)
> 상태: **완료, M3 W14 진입 권고 (Payment/Privacy/Content 평가기 확장)**

---

## 1. W13 산출물

| Sub-task | 산출물 | 책임 agent |
|---|---|---|
| M3-W13-01 | `docs/adr/ADR-0003-harness-tool.md` (Accepted) — Custom runner + Firebase, Langfuse 보류 | architect + analytics |
| M3-W13-02 | `fixtures/golden/srs/` 7건 (대표 case) + `README.md` (배포 계획) | analytics + qa |
| M3-W13-03 | `scripts/eval/runner.ts` + `scripts/eval/srs.ts` + `scripts/eval/srs.spec.ts` + package.json `eval` / `eval:srs` 스크립트 | analytics + backend |
| M3-W13-04 | 본 rollup + SWARM_LEDGER 갱신 | orchestrator |

**신규 파일**: 9개

## 2. 대표 SRS Golden 7건 분포

| ID | Category | 검증 결정 / 조항 |
|---|---|---|
| SRS-001 | stage_correct | stage 1 정답 → stage 2, next_due +3 |
| SRS-005 | mastered_reached | stage 4 정답 → stage 5, mastered_at 기록, +30일 |
| SRS-013 | stage_incorrect | stage 1 오답 → max(1, 0) = stage 1 (floor 보호) |
| SRS-022 | same_cycle_double_wrong | CC3-05 같은 cycle 2연속 오답 → stage 1 + weak |
| SRS-026 | mastered_protection | CC3-05 Mastered 1회 오답 → stage 4 보호 강하 |
| SRS-029 | cycle_boundary | CC-17 / CC3-08 04:00 경계 — 다른 cycle로 판정 (same-cycle 아님) |
| SRS-047 | daily_limit | CC2-07 무료 일 3 신규 한도 → 4번째 거부 (HTTP 429 + paywall_required) |

W13에서 7건 작성, W14에서 43건 추가 → SRS 총 50건 목표.

## 3. Evaluator 설계 요약

### 3.1 runner.ts
- CLI: `pnpm eval` 또는 `pnpm eval:srs` / `--category=srs|payment|privacy|content|rls|all` / `--strict`
- YAML 디렉토리 자동 수집 (`fixtures/golden/{category}/*.yaml`, `fixtures/adversarial/{rls,...}/*.yaml`)
- 결과 매트릭스 출력 + exit code (0=pass, 1=fail)
- `--strict` 시 skip도 실패 처리 (CI에서 차단)

### 3.2 srs.ts evaluator
- SoT: `apps/api/edge-functions/_shared/srs.ts` (Edge Function 실제 동작 정합)
- `daily_limit` category는 별도 정책 시뮬레이션 (CC2-07: 무료 3 신규 / 30 review 한도)
- 일반 SRS는 `applySrs(state, attempt)` 호출 → expected 비교
- `next_due_at`은 일수 기준 ±1일 허용 (04:00 경계 반올림 흡수)

### 3.3 정합성 보장
- `mobile/src/srs/leitner.ts` (vitest로 12 case 통과) ↔ `_shared/srs.ts` (evaluator SoT) 매 sprint review에서 diff 점검
- M3 W14 또는 M3 종료 시 esm 빌드로 단일 source 통합 검토 (R-12)

## 4. Skill 사용 점검

| Agent | 강제 Skill | 사용 |
|---|---|---|
| analytics | prompt-engineering · root-cause-tracing | ✅ 7 case 설계 + evaluator diff 메시지 |
| architect | prompt-engineering | ✅ ADR-0003 평가 매트릭스 |
| backend | TDD · root-cause-tracing | ✅ srs.spec.ts (YAML fixtures 자동 회귀) |
| qa | (review) | ✅ 7 case 카테고리 분배 검증 |
| orchestrator | (점검) | ✅ |

## 5. 결정 / ADR 적용

- **ADR-0003 Accepted** — Custom runner + Firebase Analytics + Crashlytics (M3 phase). Langfuse는 LLM 호출 도입 시점에 재평가 (M4 또는 launch 후).
- **CC2-07** (무료 한도 정책) → daily_limit evaluator stub
- **CC3-05** (same-cycle / Mastered 보호) → SRS-022, SRS-026 검증 가능
- **CC-17 / CC3-08** (04:00 경계) → SRS-029 검증 가능
- **R-12** (mobile ↔ Edge SRS sibling copy) → evaluator가 `_shared` SoT 채택, drift 자동 검출

## 6. M3 진행률

| W | 작업 | 상태 |
|---|---|---|
| **W13** | Harness foundation (runner + SRS evaluator + 7 golden) | ✅ 완료 |
| W14 | Payment 15 + Privacy 11 + Content 11 golden + 평가기 3종 + adversarial fixtures | ⏳ 다음 |
| W15 | Baseline metrics 14-day 수집 + CI 통합 (PR halt on fail) | pending |
| W16 | Mastered/Weak measurement events (Q-DA-DOC-007) + M3 게이트 검증 | pending |

## 7. Risks 갱신

| ID | 리스크 | 변동 |
|---|---|---|
| R-12 | mobile ↔ Edge SRS sibling copy drift | **부분 해소** — evaluator가 `_shared`를 SoT로 사용, 기존 leitner.ts unit test가 mobile 측 검증. drift 발생 시 W14에 esm 통합 |
| R-21 신규 | next_due_at 검증 ±1일 허용으로 fine-grained bug 누락 가능 | 낮음 — boundary case는 별도 명시 (SRS-029) |
| R-22 신규 | Payment evaluator는 RC sandbox 의존 — CI에서 실행 불가 시 nightly로 옮길 가능성 | 중간 — W14에서 결정 |

## 8. M3 W14 (다음 sprint) 작업 큐

| 작업 | 책임 |
|---|---|
| Payment 15 golden YAML + evaluator (RC webhook 시뮬레이션) | backend + analytics |
| Privacy 11 golden YAML + evaluator (소비자 권리 응답 + IDFA off + KOPPA 차단) | legal + analytics |
| Content 11 golden YAML + evaluator (Starter Pack 60단어 메타 검증) | content + analytics |
| Adversarial fixtures (`fixtures/adversarial/{rls,payment,privacy}/`) | security + qa |
| GitHub Action `eval-on-pr.yml` — PR마다 `pnpm eval --strict` | devops |
| Mastered/Weak measurement event emit (analytics.ts) | analytics |
| SRS 43건 추가 (남은 시나리오) | analytics + qa |

## 9. Orchestrator 서명

- **M3-W13 게이트 통과**: ✅
- **서명일**: 2026-05-11
- **다음 게이트**: M3-W14 진입 — 차단 항목 없음
- **M3 종료 목표**: W16 — 87 golden + 5 evaluator + CI 통합 + baseline metrics 14-day 수집 완료 시 M4 (Security+QA) 진입
