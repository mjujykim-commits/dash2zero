# dash2zero · P1 Motion Rollout · Swarm Handoff (M5 W18–W19)

> **수신:** dash2zero swarm coding 팀
> **발신:** Design System / Lead Designer
> **전제:** W17 P0 Full Sign-off(D-030) 완료 · ADR-0009 Conditional Accept · WORKLET_GUIDE Draft

W17 패키지와 동일 구조. **단, 발주에 5건의 협의 결정이 포함**되며 그중
2건은 dash2zero 권고를 거절/수정했다 — `01-WORK-ORDER.md §0`을 **반드시
먼저** 읽을 것.

```
swarm-handoff-p1/
├── README.md                          ← 지금 이 파일
├── 01-WORK-ORDER.md                   ← ★ §0 결정 5건부터 읽기
├── 02-DESIGN-REVIEW/                  ← 라이브 데모 (§4.3 counter/toast/badge · §4.4 PTR/sheet)
│   ├── index.html
│   ├── review.css · lab.js · colors_and_type.css
└── 03-REFERENCE/components/
    ├── NumberCounter.tsx    (P1.1 · Animated)
    ├── Toast.tsx            (P1.2 · Reanimated · Provider+hook 포함)
    ├── StreakBadge.tsx      (P1.3 · Animated)
    ├── PullToRefresh.tsx    (P1.4 · Reanimated · droppable)
    └── ConfirmSheet.tsx     (P1.5 · 기존 BottomSheet 재사용)
```

## 발주 결정 요약 (상세는 §0)

| Q | 결정 |
|---|---|
| Q-1 발행 | ✅ W18 entry 전 발행 완료 |
| Q-2 우선순위 | ⚠️ PTR 강등(droppable, W19 마지막) |
| Q-3 Toast 정책 | ⚠️ 수정 — action error는 auto-dismiss 금지 |
| Q-4 Modal 활용처 | ❌ Lesson abandon 거절(도구 톤 보존), ✅ Delete account만 |
| Q-5 Rule 5 | ✅ 승인 |

## 착수 순서

1. **W18 D-1** — ADR-0009 Accepted 봉인 + Reanimated install + `01-WORK-ORDER.md §8` 회귀 검증.
2. **W18** — P1.1 counter(Animated) ∥ P1.2 toast(Reanimated) → P1.3 badge(Animated).
3. **W19** — P1.5 confirm sheet(Animated) → P1.4 PTR(Reanimated, 압박 시 M6 이월).

디스패치 프롬프트는 `01-WORK-ORDER.md §11`. worklet PR은 WORKLET_GUIDE §9 C1~C8 첨부.
