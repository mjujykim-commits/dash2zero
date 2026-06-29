# P1 Work Order — 발주 회신 (W18-P1-WORK-ORDER-REQUEST 응답)

> **FROM:** Lead Designer (dash2zero Design System)
> **TO:** Swarm Coding Orchestrator (via mju.jykim@gmail.com)
> **DATE:** 2026-06-02 (M5 W18 entry D-6 / R-M5-01 reconfirm 시점)
> **회신 양식:** **[A] Full P1 발주** — dash2zero §1 우선순위 부분 수정 + §3 협의 4건 답신
> **원본 위치**: `dash2zero Design System/260601/dash2zero Design System/swarm-handoff-p1/04-DESIGNER-RESPONSE.md`
> **orchestrator 보관 사본 (본 파일)**: 회신 결정의 SoT — D-031 봉인 + W18 dispatch 갱신 근거

---

## 결론

**P1 Work Order 패키지 발행 완료** — `swarm-handoff-p1/` (work order + 라이브
데모 + reference 5건), W18 entry(6/8) 전 도착. ADR-0009 + WORKLET_GUIDE 사전
준비가 탁월했고, P1 reference 코드는 worklet 가이드 C1~C8을 그대로 따랐다.

협의 5건 중 **3건 수용, 2건 수정/거절**. 아래가 그 판단이다.

---

## Q-1 · 발행 시점 → ✅ 완료

W18 entry 전 발행. 일정 슬립 없음. dispatch 순서는 dash2zero §1.1 권고
그대로(W18 단순 3건 / W19 Reanimated 항목) 채택.

## Q-2 · 우선순위 → ⚠️ PTR 강등

Counter(P1.1)·Toast(P1.2)·Badge(P1.3) 동의. **PTR(P1.4)를 droppable로 강등**한다:

- Home은 이미 `useFocusEffect`로 focus마다 refetch한다. PTR은 동일 동작의
  **수동 트리거 중복**이고, 추가하는 건 Reanimated 의존성 표면뿐이다.
- dash2zero 스스로도 §1에서 "시급성 낮음"이라 평가했다 — 동의하고 한 발 더
  나가, **W19 일정 압박 시 주저없이 M6로 이월**하라. GA(6/15·6/22)를 PTR
  때문에 늦추지 말 것.

Counter를 P1.1로 유지하는 데 동의 — Lesson Complete의 카운트업은 retention에
직접 닿는 유일한 "감정적 모먼트"다. 단 §3.3대로 **그 1곳만** 활성.

## Q-3 · Toast 우선순위 정책 → ⚠️ 1건 수정 후 승인

3-tier(error/user-action/system) + max 3 stack 채택. **수정 1건:**

> **action을 가진 error toast는 auto-dismiss 금지** — 수동 dismiss까지 유지.
> 예: "Purchase failed — Retry"가 5초 후 사라지면 사용자가 복구 경로를 잃는다.
> reference `Toast.tsx`에 `persistent` 분기로 반영함.

추가 가드: **결제 실패 같은 차단성 에러는 toast가 아니라 기존 `Alert` 유지.**
toast는 비차단 피드백(sync 완료, 토글 결과)에 한정. 사용자가 반드시 인지해야
하는 결제/삭제 결과는 모달성으로.

## Q-4 · Modal 활용처 → ❌ Lesson abandon 거절

- ✅ **Delete account confirm 채택** — 파괴적·비가역 작업의 확인 시트는 정당.
- ❌ **Lesson abandon confirm 거절.** 이건 타협하지 않는다.

> `DESIGN_DIRECTION §2.1`은 "가입 강요 / 푸시 강요"를 명시적으로 회피하고,
> §7.2는 Duolingo의 "푸시 강요"를 거리두기 대상으로 못박았다. **학습 중
> 이탈하려는 사용자를 모달로 붙잡는 것은 정확히 그 dark-pattern이다.**
> dash2zero의 약속은 "3분 만에 가볍게 들어왔다 나가는 도구"다. 나가려는
> 순간 마찰을 거는 건 그 약속을 깬다.
>
> 이탈 retention은 **streak 설계 + (옵트인) reminder**로 풀 문제지, 모달
> 마찰로 풀 문제가 아니다. 기존 자동 `lesson_abandoned` emit은 유지 — 분석은
> 하되 막지는 않는다.

→ **P1.5 활용처는 Delete account 1건만.** Subscription manage는 기존
paywall/store 이동 유지(모달 불요). 이 결정을 **D-NNN으로 봉인** 권고 —
learning agent가 retention 위해 재요청할 때 인용할 근거.

## Q-5 · Rule 5 (worklet layout 금지) → ✅ 승인

`01-WORK-ORDER.md §1`에 6번째 조로 추가. WORKLET_GUIDE C1~C8과 연결.

---

## 추가 — 엔진 분리 확인 (ADR-0009 정합)

reference 구현이 ADR-0009 "신규 P1만 Reanimated, 기존 8건 Animated 영구
유지"를 정확히 따랐는지 검증함:

| 컴포넌트 | 엔진 | 정합 |
|---|---|---|
| NumberCounter / StreakBadge / ConfirmSheet | Animated | ✅ 단순 보간·기존 재사용 |
| Toast / PullToRefresh | Reanimated | ✅ queue·제스처 60fps |

ConfirmSheet가 D-025 BottomSheet를 재사용하므로 **P1.5는 신규 모션
컴포넌트가 아니라 활용 작업** — Reanimated 불요. 정합.

---

## 반영 완료 (design system 측)

- `swarm-handoff-p1/` 패키지 발행 (work order + 데모 + reference 5건).
- `handoff/W18-P1-WORK-ORDER.md` 보관.
- review §06 P1 lane은 DoD 통과 후 `[x]` 갱신 예정(현재 dispatch 단계).

---

## 다음 게이트

W18 D-1 회귀 검증(`§8`) 통과 → Reanimated 항목 착수. W18 종료 시 counter/
toast/badge sign-off 요청, W19 종료 시 PTR/confirm sheet sign-off 요청
받겠다. **PTR은 60fps Profiler 수치를 sign-off 요청에 첨부**할 것(R3 연동).

> — Lead Designer, dash2zero Design System · 2026-06-02
