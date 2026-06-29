# dash2zero · Motion System Rollout · Swarm Handoff Package

> **수신:** dash2zero swarm coding 팀 (orchestrator → frontend/designer/qa)
> **발신:** Design System / Senior Designer
> **목적:** D-022 시각 시스템을 **모션 시스템**으로 확장하기 위한 단일 dispatch 패키지
> **유효 기간:** M4 W17 (2026-05-26 ~ 2026-06-01)

---

## 이 패키지에 들어 있는 것

```
swarm-handoff/
├── README.md                          ← 지금 읽고 있는 파일
├── 01-WORK-ORDER.md                   ← ★ 가장 먼저 읽을 것 (12개 섹션 work order)
│
├── 02-DESIGN-REVIEW/                  ← 왜 이 작업이 필요한지 — 라이브 데모로 검증
│   ├── index.html                     (브라우저로 열어보세요)
│   ├── review.css
│   ├── lab.js
│   └── colors_and_type.css
│
└── 03-REFERENCE/                      ← 그대로 가져다 쓸 수 있는 reference 구현
    ├── motion.ts                       drop-in replacement for packages/design-tokens/src/motion.ts
    └── components/
        ├── StageReveal.tsx             P0-1 lesson stage 시그니처 모션
        ├── MorphingKoreanWord.tsx      P0-1 한글 글자 크기/위치 변화
        ├── QuizOption.tsx              P0-2 정답·오답 리액션 강화
        ├── NeonButton.tsx              P0-3 ripple + hover lift + glow brighten
        ├── Skeleton.tsx                P0-4 shimmer loading + useDelayedLoading 훅
        └── AudioButton.tsx             P0-5 playing pulse + ring expansion
```

---

## 작업 순서 (orchestrator dispatch 권고)

1. **사전 검토 (15분)**
   - 본 README + `01-WORK-ORDER.md §0–§2` 필독.
   - `02-DESIGN-REVIEW/index.html`을 브라우저로 열어 P0 5건이 어떻게 동작해야
     하는지 시각적으로 확인. 모든 데모는 클릭/드래그 가능.
2. **선행 merge (P0-0)**
   - `03-REFERENCE/motion.ts` 를 `packages/design-tokens/src/motion.ts` 로 교체.
   - 이름 변경 sweep: `motion.fast (80ms)` → `motion.tap`, `motion.medium (200ms)` → `motion.base`.
3. **병렬 dispatch (P0-2, P0-3, P0-4, P0-5)** — 4개 worktree 동시 작업 가능.
   - 각 컴포넌트의 reference 구현은 `03-REFERENCE/components/*.tsx` 에 있음.
4. **순차 dispatch (P0-1)** — Lesson stage 시그니처 모션.
   - `apps/mobile/app/lesson/[wordId].tsx` 변경량이 가장 크고 conflict 위험이
     있어 단일 worktree에서 진행 권고.
5. **QA sweep**
   - `01-WORK-ORDER.md §8 Definition of Done` 체크리스트 전체 수행.
   - 적대 케이스 (double-tap · fast-cycle · background timeout · iOS SE)
     집중 검수.

상세 dispatch 프롬프트는 `01-WORK-ORDER.md §12`에 있음 — orchestrator 가 그대로 paste 사용.

---

## 산출물 사용 규칙

- `03-REFERENCE/` 안의 `.tsx` 는 **reference 구현**이지 보장된 동작이 아님.
  frontend agent의 typecheck + 시뮬레이터 검수가 always last word.
- `motion.ts` 는 drop-in 의도지만 기존 `motion.fast` 사용처와의 이름 충돌
  존재 — designer가 PR에서 1:1 sweep 검토.
- reduce-motion fallback 경로는 **모든** reference 컴포넌트에 내장됨. 제거
  금지.

---

## 본 패키지 외 의존성

- `react-native`, `expo-linear-gradient` — 이미 dependency.
- 신규 dependency 없음 (Reanimated 등). P1에서 pull-to-refresh가 도입될 때
  의존성 추가 여부를 별도 ADR로 결정.

---

## 컨텍스트 기록 의무

`AGENTS.md §5.4` 정책 — `01-WORK-ORDER.md §11` 그대로 따를 것:

1. `CHANGELOG.md` 에 "motion token 확장" 한 줄 추가.
2. Sprint risk 등록: P0-1 lesson stage transition의 user-perceived latency
   변화. owner=frontend, mitigation=analytics의 `lesson_completed.duration_sec`
   p50/p95 모니터링.
3. PR description에 사용한 skill (theme-factory / frontend-design) 명시.

---

## 종료 게이트

다음을 모두 만족하면 M4 W17 종료 및 design system 프로젝트 review 문서
§06 우선순위 로드맵 P0 5건의 status를 `[x]`로 업데이트:

- `01-WORK-ORDER.md §8` DoD 체크박스 전부 [x]
- qa agent 적대 케이스 0건
- designer visual sign-off
- iPhone SE + iPhone 15 Pro + reduce-motion ON 스크린샷 3매 (각 P0)

실패 시 `R-M4-NN` sprint risk 등록 후 사용자(mju.jykim@gmail.com)에게
보고.

---

## 질문 / 변경 요청

본 패키지 발신 design system 프로젝트 owner와 협의. 패키지 내 파일을
직접 수정하기보다는 design system 프로젝트에서 재생성 받는 것을 권고
(향후 P1/P2 dispatch와 일관성 유지).
