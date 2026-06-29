# Backend submit-attempt 응답 정합 검토 보고서

- **상태**: 분석 완료 (M4 W17 D-6, orchestrator 자율 사이클 X)
- **작성일**: 2026-06-01
- **출처**: Task #82-b (D-029 사이클 R) "M4: chain 내 mastered 누적 계산" 후속 메모
- **관련 SoT**:
  - `apps/api/edge-functions/submit-attempt/index.ts`
  - `apps/mobile/src/lib/api.ts` `SubmitAttemptResponse`
  - `apps/mobile/app/lesson/[wordId].tsx` `masteredInChainRef`
  - DECISION_LOG D-029

---

## 0. 한 줄 요약

**기능상 정합 OK + Edge case 회귀 위험 1건** — 정상 흐름에서 frontend client-side `masteredInChainRef` 카운트는 정확하지만, retry queue / app kill / background timeout 시 ref 소실로 부정확 카운트 가능. SSOT 정합 강화를 위한 backend 보강 1건 권고 (M5 또는 M4 W17 잔여 진입).

---

## 1. 현재 구조 분석

### 1.1 Backend (`submit-attempt/index.ts` L228-253)

단일 attempt 단위로 `srs_events` 배열 반환:

```typescript
const srsEvents: string[] = [];
if (next.stage === 5 && prevStage !== 5) srsEvents.push("srs_mastered_reached");
if (prevMastered && !next.mastered_at) srsEvents.push("srs_mastered_lost");
if (!prevWeak && next.weak)             srsEvents.push("srs_weak_flagged");
```

→ **카드 1장 단위 이벤트만** 반환. Chain 누적 정보 없음.

### 1.2 Frontend (`lesson/[wordId].tsx` D-029)

```typescript
const masteredInChainRef = useRef(0);

// auth path: srs_events 응답 처리 시
events.forEach((ev) => {
  if (ev === "srs_mastered_reached") {
    masteredInChainRef.current += 1; // ← client-side 누적
  }
});

// guest path: 동일 logic
if (next.stage === 5 && before.stage !== 5) {
  masteredInChainRef.current += 1;
}

// chain 완료 시 lesson/complete params로 전달
router.replace({
  pathname: "/lesson/complete",
  params: { ..., mastered: String(masteredInChainRef.current) },
});
```

→ **client-side 누적** — 응답을 받아야 +1.

---

## 2. 정합성 평가 — 정상 흐름 vs Edge Case

### 2.1 정상 흐름 (PASS ✅)

1. 카드 1장 submit → response.srs_events 수신 → ref +1
2. 800ms 후 advance() → 다음 카드
3. chain 끝 → params.mastered 정확

**정합성 100%** — server SSOT 결과에 의존, frontend는 transport-side 카운트만 수행.

### 2.2 Edge Case 회귀 위험 (FAIL ⚠️)

**Case A — Retry queue (offline 또는 server error)**
- submit-attempt 호출 실패 → catch에서 `enqueueRetryAttempt(requestPayload)` 적재
- response 미수신 → `srs_events` 미감지 → `masteredInChainRef` 미증가
- 다음 카드 진행은 그대로 (frontend는 client-side SRS 추정만)
- chain 완료 시 mastered 부정확 (실제 +1이어야 하는데 +0)
- **나중에 retry queue flush 시 server는 정확히 처리하지만 frontend 카운트는 영구 손실**

**Case B — App kill 또는 background timeout**
- lesson 진행 중 사용자가 카드 2장 정답 → ref = 2
- 사용자 background → 5분 timeout → lesson_abandoned 발화
- 다음 진입 시 ref = 0 (useRef 초기화)
- 사용자가 chain 재진입 시 mastered 카운트 무효

**Case C — guest 모드 (서버 미경유)**
- guest 응답이 없으니 frontend가 `applySrsTransition` 결과로 직접 +1
- 정확하지만 backend SSOT가 아님 → 가입 직후 머지 시점 정합 검증 필요

---

## 3. 회귀 위험도 정량 평가

| Case | 발생 빈도 | 영향 | 위험도 |
|---|---|---|---|
| A. Retry queue (offline) | 낮음 (정상 사용자) ~ 중간 (지하철/비행기 사용자) | mastered 카운트 -1 (visual feedback만, learning 본질 영향 X) | Low |
| B. App kill / background timeout | 낮음 (5분 timeout) | 카운트 무효 → Lesson Complete 화면 "0 mastered" 표시 가능 | Medium |
| C. Guest 모드 | 모든 guest 사용자 | client-side leitner 결과에 의존 → 가입 후 merge 시점에 server SSOT 정합 (Task #82-b 시점 보강 완료) | Low |

**종합**: Case B가 가장 우려되나 발생 빈도 낮고 영향은 Lesson Complete UI 표시만. **functional 정합은 유지**, learning 본질에 영향 없음.

---

## 4. 권고 — 보강 옵션 3건

### 옵션 A (낮은 비용 · 권장) — Backend `chain_context` 응답 확장

`SubmitAttemptResponse`에 `chain_mastered_so_far` 필드 추가:

```typescript
export interface SubmitAttemptResponse {
  // 기존 fields...
  srs_events?: Array<"srs_mastered_reached" | ...>;
  // 신규
  chain_mastered_so_far?: number; // 본 user의 본 chain에서 누적 mastered (요청에 chain_id 포함 시)
}
```

요청에도 `chain_id` 추가:
```typescript
export interface SubmitAttemptRequest {
  // 기존 fields...
  chain_id?: string; // lesson 진입 시 frontend가 client_attempt_id pattern으로 생성
}
```

Backend는 user_id + chain_id로 `attempts` 테이블에서 누적 mastered 집계. 응답 시 정확값 반환.

**장점**: client-side ref 의존 제거, Case A/B 모두 해소
**단점**: SQL 집계 1회 추가 (성능 영향 미미), schema 변경

### 옵션 B (중간 비용) — frontend SecureStore 누적 + chain_id

`masteredInChainRef`를 SecureStore에 영구 저장 + chain_id로 키 관리:

```typescript
// 사이클 시작 시
const chainId = await getOrCreateChainId();
await persistChainMastered(chainId, 0);

// 카드별 응답 처리 시
const next = await getChainMastered(chainId) + 1;
await persistChainMastered(chainId, next);
```

**장점**: backend 변경 없음, Case B 해소
**단점**: SecureStore I/O 카드별 발생, Case A는 미해소

### 옵션 C (high 비용 · 비권장) — 신규 `lesson_completed` RPC

별도 RPC로 chain 완료 시점 일괄 집계 + Edge Function 추가. M4 W17 entry preview 의도와 정합하나 비용 vs 효과 측면 비효율.

---

## 5. 권고 결정 (Owner 결정 필요)

### 5.1 우선순위 평가

| 항목 | 평가 |
|---|---|
| 학습 본질 영향 | 0 (mastered 카운트 부정확은 visual UI만, SRS 알고리즘은 server SSOT 사용) |
| 사용자 체감 영향 | Low (Case B의 "0 mastered" 표시는 일부 사용자에게 헷갈림 가능) |
| Backend 작업 비용 | 옵션 A: 0.5 인-day (schema + SQL 집계) |
| Frontend 작업 비용 | 옵션 B: 0.3 인-day (SecureStore I/O) |

### 5.2 권고

**옵션 A 채택 권고 — M5 W18 entry 시 backend dispatch**.

근거:
- 사용자 체감 영향 Low이지만 SSOT 정합 차원에서 본질적 해결
- M5 W18 P1 (Number counter / Toast / Badge pop 등)이 모두 frontend라 backend 작업이 병렬 가능
- 옵션 B는 client-side 누적의 다른 형태 — 근본 해결 아님

### 5.3 대안: 현 상태 유지 (보강 없음)

- 정상 흐름 정합 OK + Edge case 영향 Low → **M5 P1과 함께 backlog만 등록하고 GA 이후 검토** 가능
- Owner 결정에 따름

---

## 6. 만약 옵션 A 채택 시 작업 분해

| # | 작업 | 책임 | 예상 시간 |
|---|---|---|---|
| 1 | `packages/contracts/src/`에 `chain_id` + `chain_mastered_so_far` 타입 추가 (또는 api.ts 직접) | architect or backend | 0.05 인-day |
| 2 | `apps/api/edge-functions/submit-attempt/index.ts` 응답에 `chain_mastered_so_far` 추가. SQL: `SELECT COUNT(*) FROM attempts WHERE user_id=$1 AND chain_id=$2 AND result_stage=5 AND result_mastered_first=true` | backend (sub-agent dispatch — D-026 §B 영역) | 0.3 인-day |
| 3 | `apps/mobile/src/lib/api.ts` `SubmitAttemptResponse` 타입 확장 + chain_id 요청 시 포함 | frontend | 0.1 인-day |
| 4 | `apps/mobile/app/lesson/[wordId].tsx`: useEffect로 chainId 생성 + `masteredInChainRef` → `response.chain_mastered_so_far` 직접 사용 | frontend | 0.1 인-day |
| 5 | guest 모드: chain_id 미사용, 기존 client-side leitner 유지 (변경 없음) | — | 0 |
| 6 | __tests__ + eval:srs 회귀 검증 | qa | 0.2 인-day |
| 7 | D-NNN 봉인 (chain SSOT 정합) | orchestrator | 0.05 인-day |
| | **합계** | | **~0.8 인-day** |

---

## 7. 사용자 결정 요청

| Q | 결정 사항 |
|---|---|
| Q-1 | 옵션 A (backend 보강) / B (frontend SecureStore) / C (별도 RPC) / D (현 상태 유지) 중 선택? |
| Q-2 | 만약 옵션 A: M5 W18 entry 시 backend dispatch 진입 vs M5 P1 종료 후 cycle? |
| Q-3 | 작업 진행 시 Hybrid Policy 정합 (§B 비즈니스 데이터 흐름 = sub-agent dispatch) — backend agent spawn 권고? |

---

## 8. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-06-01 | 분석 + 권고서 작성 (orchestrator) — Edge case 회귀 위험 식별 + 옵션 3건 + 작업 분해 + 사용자 결정 사항 3건 |
