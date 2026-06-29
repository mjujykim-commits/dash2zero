# ADR-0005 — TTS Provider Selection

- **상태**: **Accepted**
- **결정일**: 2026-05-08
- **작성**: architect agent + learning agent
- **승인**: orchestrator
- **마일스톤**: M2-S2 (W6)
- **관련 문서**: ADR-0001 (Stack) / ADR-0002 (Abstractions, AudioGenerator) / DOMAIN_MODEL.md / SERVICE_REVIEW_QA CC2-05 / Q-PM-NEW-003

---

## Context

CC-05 결정: "MVP 음성은 상업적 이용 가능한 한국어 Neural TTS로 제작. 원어민 녹음은 MVP 제외." 단 provider는 미정. ADR-0002에서 `AudioGenerator` 인터페이스로 추상화하여 교체 가능.

평가 대상 4개 provider — Google Cloud TTS / Azure Speech / Naver Clova / ElevenLabs.

평가 축: 한국어 자연성 / 한 글자당 비용 / 라이선스(상업/재배포) / 음성 다양성 / 일관성 / 설정 부담.

---

## Decision

> **MVP는 Google Cloud Text-to-Speech (Neural2 / WaveNet 한국어)를 채택한다.**

화자: `ko-KR-Neural2-A` (여성) 단일 화자 1차. M3 후 `ko-KR-Neural2-C` (남성) 추가 검토.

---

## Provider 평가

### 평가 매트릭스

| 평가 축 | 가중치 | Google Cloud TTS | Azure Speech | Naver Clova | ElevenLabs |
|---|---:|---:|---:|---:|---:|
| 한국어 자연성 (Neural 모델) | 9 | **9** | 8 | **9** | 7 |
| 한 글자당 비용 ($/1M chars) | 8 | **$16 (Neural2)** ⇒ 8 | $16 ⇒ 8 | $5-15 ⇒ **9** | $300+ ⇒ 1 |
| 상업적 사용권 / 재배포 | 10 | **명확 (Apache+TOS)** ⇒ 9 | **명확 (TOS)** ⇒ 9 | 명확 ⇒ 8 | 명확 (Pro+) ⇒ 8 |
| 음성 다양성 (한국어 voice 수) | 5 | 7 (Neural2 + WaveNet 6+) | 7 (Neural 6+) | **9 (Premium 8+)** | 5 |
| 일관성 (재생성 시 동일성) | 7 | **9** | 8 | 8 | 6 (variation 가능) |
| 설정 부담 (1인 운영) | 7 | **9** (`@google-cloud/text-to-speech`) | 7 (Azure SDK) | 6 (한국 결제 수단) | **9** (REST API simple) |
| Storage (사전 생성 호환) | 5 | **9** (mp3/wav) | 9 | 9 | 9 |
| 글로벌 가용성 | 4 | **9** | 9 | 6 (한국 우선) | 8 |
| 발음 정확성 (받침/연음) | 8 | **8** | 8 | **9** | 6 |
| MVP 제작 1회 비용 | 7 | **~$10 (600 audio, 평균 30 chars)** ⇒ 9 | ~$10 ⇒ 9 | ~$5 ⇒ 9 | ~$200 ⇒ 2 |

### 가중 합계

```
가중치 합계: 70

Google:    9×9 + 8×8 + 9×10 + 7×5 + 9×7 + 9×7 + 9×5 + 9×4 + 8×8 + 9×7
         = 81+64+90+35+63+63+45+36+64+63 = 604 / 700 = 86.3%

Azure:     8×9 + 8×8 + 9×10 + 7×5 + 8×7 + 7×7 + 9×5 + 9×4 + 8×8 + 9×7
         = 72+64+90+35+56+49+45+36+64+63 = 574 / 700 = 82.0%

Clova:     9×9 + 9×8 + 8×10 + 9×5 + 8×7 + 6×7 + 9×5 + 6×4 + 9×8 + 9×7
         = 81+72+80+45+56+42+45+24+72+63 = 580 / 700 = 82.9%

ElevenLabs: 7×9 + 1×8 + 8×10 + 5×5 + 6×7 + 9×7 + 9×5 + 8×4 + 6×8 + 2×7
          = 63+8+80+25+42+63+45+32+48+14 = 420 / 700 = 60.0%
```

### 결과

| Provider | 점수 | 결론 |
|---|---:|---|
| **Google Cloud TTS** | **86.3%** | **채택** |
| Naver Clova | 82.9% | 차선 — 한국 결제 수단 + 한국어 발음 정확성 우수, 단 1인 운영 부담 |
| Azure Speech | 82.0% | 백업 옵션 |
| ElevenLabs | 60.0% | 부적합 — MVP 비용($200+) 과다, 일관성 부족 |

---

## Rationale

### Google 선택 이유

1. **한국어 Neural2 자연성 수준 높음** (영어권 학습자에게 인지 가능한 한국어 발음)
2. **상업 라이선스 명확** — Google Cloud TOS 그대로, 재배포 가능 (Storage에 사전 생성 후 앱 캐시)
3. **MVP 비용 ~$10** (Starter Pack 60단어 + 예문 = ~600 audio × 평균 30자 = 18K chars 첫 1회)
4. **1인 운영 친화** — `@google-cloud/text-to-speech` SDK + Service Account JSON 1개로 충분
5. **글로벌 가용성** — 5개국 어디서 운영해도 동일 SLA

### Naver Clova가 차선인 이유 (수치 근소)

- 한국어 발음 정확성 / 음성 다양성은 더 우수
- 단 한국 사업자 등록 필요 (C-13 미확정 상태에서 결제 위험)
- API SDK가 npm 표준 미흡 — 1인 운영 부담

### ElevenLabs 거부 이유

- 1M chars당 $300+ — MVP 60단어 × 매월 50팩 × 2년 운영 시 비용 $1,000+ 누적
- 일관성 (variation 옵션이 학습 콘텐츠에 부적합)

---

## 구현 결정

### Voice 선택

- **MVP 1차**: `ko-KR-Neural2-A` (여성, 평균 발화 속도)
- **단어 음성**: 기본 속도 1.0x
- **예문 음성**: 1.0x + 0.85x slow 2종 (학습자 친화)
- **M3 검토**: `ko-KR-Neural2-C` (남성) 추가 — 일부 단어/예문은 다화자 노출

### Audio 생성 워크플로우 (B-1 batch부터)

```
1. 단어 list (yaml) 작성 — learning
2. Google TTS API 호출 — `scripts/content/generate-audio.ts`
   - 텍스트 → mp3 buffer
   - SHA256 hash 계산
3. Supabase Storage upload (audio_assets 테이블 record + path)
4. 검수자 audio QC (한국어 원어민) — 발음 명확성 / 받침 / 띄어 읽기
5. 통과 시 audio_assets.tier = 'free' 또는 'premium' 설정 + content_manifest publish
```

### Audio 메타데이터 (audio_assets 테이블)

CC2-08 status enum과 별도 — audio_assets에 다음 컬럼:

```
audio_assets:
  id, word_id (FK), kind (word|example), provider ('google_neural2'),
  voice_id ('ko-KR-Neural2-A'), audio_url (Supabase Storage path),
  audio_hash (SHA256, cache key), tier (free|premium), license ('google_tos'),
  created_at, retired_at
```

### 비용 모니터링

- Google Cloud Billing alert: 월 $20 도달 시 Owner 알림 (예상 ~$10)
- 매월 50단어 batch 추가 시 ~$2-3 비용 증가 예상
- 누적 1년 비용 예상 $50-80

---

## Consequences

### Positive

- 한국어 자연성과 비용의 균형
- 1인 운영 부담 최소
- AudioGenerator 인터페이스 추상화로 향후 교체 가능

### Negative

- Google Cloud account dependency (API key + service account JSON)
- 발음 정확성에서 Naver Clova 대비 약간 열세 (받침/연음)
- 비용 곡선이 단어 수에 비례 — 1만 단어 도달 시 ~$200/년 추가

### Neutral

- audio_assets.provider 컬럼이 'google_neural2' 고정 — 후속 교체 시 별도 row + content_version bump

---

## Alternatives Considered

### Naver Clova (차선 — 점수 82.9%)

- 거부: 한국 결제 수단 + 1인 운영 부담. C-13 사업자 확정 후 재검토 가능.

### Azure Speech

- 거부: Google과 동률 수준 비용/품질. Microsoft 클라우드 학습 비용 추가.

### ElevenLabs

- 거부: 비용 과다, 일관성 부족.

### 사람 녹음 (CC-05에서 이미 거부)

- MVP 단계 시간 / 비용 제약으로 부적합. Phase 3 검토.

---

## Validation

| 시점 | 검증 |
|---|---|
| M2-S2 W6 | Google Cloud TTS API 키 발급 + 단어 5개 샘플 생성 + Owner QC |
| M2-S2 W7 | Starter Pack 60단어 (B-1) 생성 + 검수자 audio QC |
| M3 W13 | 87 golden case의 content 11 case에 audio_hash 검증 포함 |
| M5 베타 | 사용자 발음 만족도 정성 피드백 (N=30) |

---

## Reversal Triggers

- Google Cloud TTS 가격 인상 ≥ 50%
- 한국어 자연성에 대한 사용자 부정 피드백 ≥ 30%
- C-13 한국 사업자 확정 후 Naver Clova 비용 우위 발생
- 사람 녹음 도입 결정 (Phase 3 후)

---

## References

- ADR-0001 — Stack Decision
- ADR-0002 — AudioGenerator 인터페이스 추상화
- DOMAIN_MODEL.md §2.2 — AudioAsset entity
- CC-05 (REVIEW_QA §5) — TTS 채택
- Q-PM-NEW-003 — provider 평가 요구

---

## Change Log

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-08 | M2-S2 v1.0 — Google Cloud TTS Neural2 채택 (86.3% vs Clova 82.9% / Azure 82.0% / ElevenLabs 60.0%) | architect + learning |
