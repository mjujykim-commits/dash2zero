# W17 Motion Work Order — Designer Sign-off

> **FROM:** Lead Designer (dash2zero Design System)
> **TO:** Swarm Coding Orchestrator (via mju.jykim@gmail.com)
> **DATE:** 2026-06-01 (M4 W17 D-6)
> **RE:** swarm-handoff/01-WORK-ORDER.md P0 5건 마감 보고 회신
> **회신 양식:** **[1] Full Sign-off** — 2개 검증 게이트 + 3개 설계 결정 기록 첨부

---

## 결론 (한 줄)

> **P0 5건 전부 visual sign-off 부여.** 구현이 reference 스펙을 능가했고
> (haptic 통합, reduce-motion blink fallback, Shimmer 판단), 일관 규칙 5조 +
> 4-rule merge gate 검증을 신뢰함. design system review §06 P0 status를
> `[x]`로 갱신 완료.

나는 보고서만 읽지 않고 **8개 컴포넌트 + lesson 통합 코드를 직접 검토**했다.
아래는 그 검토 기록이다.

---

## 1. 직접 검토한 파일 (보고서 교차검증)

| 파일 | 검토 결과 |
|---|---|
| `packages/design-tokens/src/motion.ts` | ✅ duration 9키 + easing 5종 + rnEasing 정확. **MOTION_TOKENS 동기 alias로 D-023~D-027 봉인 컴포넌트 호환 유지** — 깔끔한 처리. |
| `StageReveal.tsx` | ✅ setValue 초기화 → in-flight 안전. reduce 시 `transform: []`. 정확. |
| `MorphingKoreanWord.tsx` | ✅ scale 보간(0.875) + translateY(-16). a11y `accessibilityLanguage="ko"` 보존. |
| `QuizOption.tsx` | ✅ 카드 본체 scale 없음, ✓/✕ icon 한정 spring. **reduce 시 shake→opacity blink 200ms×2까지 구현** (reference엔 없던 강화). haptic Light/Success/Warning 통합. |
| `AudioButton.tsx` | ✅ ring expansion + shadow pulse + conic spinner. AUDIO_* 토큰화(사이클 Q)로 인라인 numeric 제거. |
| `NeonButton.tsx` | ✅ Ripple 다중 동시 + cleanup. glow brighten interpolate(0.55→0.85). |
| `app/lesson/[wordId].tsx` | ✅ 4개 컴포넌트 전부 실제 통합 확인. skeleton이 **실제 레이아웃 형태**(hero word/gloss/examples/CTA)를 모사 — STATE_PATTERNS 정합. |
| `app/home.tsx` | ✅ useDelayedLoading(150) 적용. |

**보고서와 실제 코드 간 불일치 0건.** 신뢰함.

---

## 2. 디자이너 검토 포인트 회신 (보고서 §5)

### A-1. QuizOption 카드 본체 shake 360ms — DESIGN_DIRECTION §9.2 정합?

**승인.** §9.2의 "정답/오답은 색 + glow만, scale 불가(흐름 차단)"은
**Quiet 시절 규칙**이고, scale을 금지한 이유는 카드가 커졌다 작아지며
**다음 액션을 가리는 것**을 막기 위함이었다. 현재 구현은:

- scale이 아니라 **translateX ±6px shake** — 레이아웃 점유 면적 불변, 다음
  CTA를 가리지 않음.
- 360ms로 종료 후 즉시 정지 — 차단성 없음.
- 내 Work Order §4.2(2)가 명시적으로 처방한 모션.

→ **§9.2의 의도(흐름 차단 금지)는 지켜졌고, 문구(scale 금지)는 D-022 +
Work Order로 의도적으로 갱신됨.** DECISION_LOG D-029에 "§9.2 scale-금지
조항은 translateX shake에 적용되지 않음 — 면적 불변·비차단" 한 줄 근거를
남길 것. designer 승인 근거로 인용 가능.

### A-2. MorphingKoreanWord scale 0.875 (≈56px) — 너무 작아 보이는가?

**조건부 승인 — 검증 게이트 1.** 0.875 기본값 유지를 승인하되, base가
`scale.word`(useResponsiveScale)라서 **iPhone SE(320pt)에서는 이미 축소된
값에 0.875가 곱해진다.** SE에서 Meaning 단계 한글이 **시각 44px 미만으로
떨어지면** 학습 가독성(한글 hero 원칙)이 깨진다.

→ **게이트:** 보고서 §5C에 이미 약속된 SE 스크린샷 검수에서 Meaning 단계
한글 글자 실측. **≥44px이면 그대로 ship.** <44px이면 tier-1-5 scale을
0.875 → **0.90으로 상향**(≈58px, translateY는 -14로 미세 조정). Work
Order §3.5의 "base 72 / scale 0.78" 대안은 **불필요** — 그건 렌더 선명도
이슈였고 크기 이슈엔 scale 직접 조정이 맞다.

### A-3. StageReveal stagger 누적이 user-perceived advance 1s까지?

**우려는 계산 착오. 변경 불필요.** stagger 지연은 `delayIndex × 60ms`이지
`240ms × index`가 아니다. 실측:

```
Meaning 단계 4개 텍스트: 시작 0 / 60 / 120 / 180ms, 각 +240ms
  → 마지막 요소 완료 = 180 + 240 = 420ms  (1s 아님)
Retrieve 4 옵션: 동일 = 420ms
```

420ms는 "단계가 살아 등장한다"는 체감을 주기에 **이상적인 구간**이다.
60ms는 유지할 것. (참고: meaning→retrieve 전환 시 meaning 블록 StageReveal은
stageKey(`${cursor}-rr` 등)가 불변이라 **재발화하지 않음** — 옵션만 stagger.
설계대로 정확히 동작.)

---

## 3. 디자이너 결정 (보고서 §5B 절충안)

### B-1. Shimmer 본체 — D-024 translateX gradient sweep 유지 vs §6 cosine pulse

**D-024 translateX sweep 유지를 적극 승인.** 솔직히 말하면 **그쪽이 더
프리미엄**이다. 내 Work Order §6의 cosine opacity pulse는 구현 단순성을
위한 fallback이었고, 실제 고급 스켈레톤(예: 대형 SNS 피드 로딩)은 모두
gradient sweep 방식이다. 사용자 옵션 A 결정이 옳았다. **재교체 불필요.**

### B-2. PulseOverlay — ChoiceCard 폐기 후 사용처 0

**M4 동안 보존, M5 cleanup에서 삭제.** 게이트 진입 직전(D-6)에 파일을
지우는 churn은 위험 대비 실익이 없다. `@deprecated` 헤더만 PulseOverlay에도
추가하고(ChoiceCard와 동일 처리), M5 정리 사이클에서 ChoiceCard +
PulseOverlay + 미사용 MOTION_TOKENS legacy alias를 **한 번에** 제거할 것.
M5 backlog에 `CLEANUP-MOTION-LEGACY` 항목으로 등록 권고.

---

## 4. 신규 백로그 (이번 sign-off와 무관 — 별도 제기)

검토 중 발견한 **학습 설계 이슈** 1건 — 모션 Work Order 범위 밖이므로
이번 P0 sign-off를 막지 않으나, 별도 티켓으로 남긴다.

> **[NEW] 오답 시 정답 미하이라이트.** 현재 retrieve 단계 state 로직은
> 사용자가 **오답을 고르면** 그 옵션만 `incorrect`로 표시되고 **정답
> 옵션은 `default`로 남는다.** 학습자가 "그럼 정답이 뭐였지?"를 시각적으로
> 못 받는다. gloss 텍스트로 의미는 보이지만, 정답 카드 자체를 success로
> 함께 밝혀주는 것이 인출 학습(retrieval practice)의 표준이다.
>
> → 제안: `submitted && isCorrectOpt`이면 선택 여부와 무관하게 `correct`
> 상태 부여(단, ✓ spring은 사용자가 고른 카드에만, 정답 카드는 glow만).
> **M5 학습 품질 라운드**에서 learning agent + designer 공동 검토.
> 본 변경은 PRD §4 인출 루프 정합성에 영향 → DECISION 등록 대상.

---

## 5. 종료 게이트 상태

| 게이트 | 상태 |
|---|---|
| §1 일관 규칙 5조 | ✅ designer 확인 |
| 4-rule merge gate | ✅ designer 확인 |
| §11 컨텍스트 기록 (D-028/D-029/R-M4-04) | ✅ 확인 |
| **검증 게이트 1 — SE 한글 ≥44px** | ⏳ **CI/Owner 스크린샷 검수 대기** (§2 A-2) |
| 검증 게이트 2 — reduce-motion ON 실기 3매 | ⏳ CI/Owner 대기 (보고서 §5C) |
| pnpm type-check / test / eval:srs | ⏳ CI 대기 |

→ **위 2개 검증 게이트는 re-work이 아니라 확인 절차다.** designer visual
sign-off는 **지금 부여**하며, SE 게이트에서 한글 <44px이 나오는 경우에만
§2 A-2의 scale 0.90 조정을 적용하면 된다(별도 재승인 불요 — 사전 승인함).

---

## 6. design system 측 갱신 완료

- `review/index.html` §06 우선순위 로드맵 P0 lane → 5건 모두 `[x] 완료
  (D-028/D-029, 2026-05-27)`로 갱신.
- 본 메모를 `handoff/W17-DESIGNER-SIGNOFF.md`로 보관.

---

## 7. P1 진행 (보고서 §7 [4] 항목 회신)

**진행 승인 — 단, 의존성 ADR을 P1 dispatch보다 먼저.** M5 W19 entry
사전(2026-06-02 R-M5-01 reconfirm 시점)에 다음을 요청한다:

1. **`react-native-reanimated` 도입 ADR** — P1의 pull-to-refresh + toast
   가 제스처/레이아웃 애니메이션을 요구. 현재 `Animated`(legacy)로 PTR을
   구현하면 JS 스레드 부담. Reanimated 도입 vs `Animated` 유지의 trade-off를
   ADR로 봉인한 뒤 P1 착수.
2. P1 항목 사전 분해 — counter / badge pop+flicker / PTR / sheet / toast.

준비되면 design system 측에서 **P1 Work Order 패키지**를 동일 포맷
(work order + 라이브 데모 + reference 구현)으로 발행하겠다.

---

> **sign-off 서명:** Lead Designer, dash2zero Design System · 2026-06-01
> 추가 논의는 design system 프로젝트에서.
