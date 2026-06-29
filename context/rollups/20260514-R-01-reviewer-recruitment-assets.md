# R-01 External Reviewer Recruitment Assets — 3 Channels Ready for Send

> 작성: orchestrator (자율 진행 사이클)
> 작성일: 2026-05-14
> 목적: R-01 (콘텐츠 검수자 모집) mitigation. 590단어 콘텐츠 외부 검수.
> 사용 시점: 사용자가 직접 게시 (Reddit / Upwork / 지인 채널). PM이 작성 (CC3-07 모집 책임)
> 정책: `docs/learning/CONTENT_QUALITY_POLICY.md §3` 모집 채널 5종 + D-020 dual-track
> 비용: 외부 검수자 시간당 $20-30 권고. 590단어 = 약 18-27 시간. 예상 $400-800 (1명 100% 검수 기준)

---

## 0. 배경 (모집 글에 사용할 context)

- **앱**: dash2zero — 영어권 사용자를 위한 한국어 단어 학습 모바일 앱 (3분 lesson + Leitner SRS)
- **콘텐츠 규모**: starter 60 (free) + core 180 (K-pop/K-drama/Travel) + premium 300 + monthly 50 = **590 단어**
- **품질 정책**: 8 quality gate (G-01~G-10), 자세히 `CONTENT_QUALITY_POLICY.md`
- **검수 범위 (외부 검수자)**: 자연성·문화·받침 변화 (G-03 RR / G-06 영어 / 받침 audio_qc)
- **검수 범위 (내부 qa)**: 형식·정합성 이미 100% 처리 완료 (G-01/G-02/G-04/G-07/CC2-15)

---

## 1. Reddit r/Korean 영문 모집 글 (단일 post)

> 게시: https://www.reddit.com/r/Korean/ — flair "Resources" 또는 "Discussion"
> 권고 길이: 300-500단어 (Reddit guidelines)
> 권고 게시 시간: 평일 09:00 KST (US EST 평일 저녁, Reddit Korean community active time)

**Title**:
```
[Paid] Looking for Korean native speakers to review vocab content for a learning app (590 words, ~$400-800)
```

**Body**:
```markdown
Hi r/Korean!

I'm building **dash2zero**, a minimal Korean vocabulary learning app for English speakers (3-min daily lessons, Leitner spaced repetition). We're launching beta in June 2026.

I'm looking for **1-2 Korean native reviewers** to check our vocabulary content before launch.

### Scope
- **590 Korean words** across 5 packs:
  - Starter 60 (basic survival Korean)
  - Core 180 (K-pop 60 + K-drama 60 + Travel 60 categories)
  - Premium 300 (daily life expansion, B1-B2 level)
  - Monthly 50 (first monthly release: spring + Korean culture + SNS slang)
- Each word has: Korean text, RR romanization, English gloss, Korean example, English translation, 3 distractors
- ~35 words with 받침 발음 변화 (sound changes) — these need extra attention

### What you'd review
- **Naturalness**: Is the example_ko natural Korean? Would a real Korean person say this?
- **Romanization (RR)**: Is the pronunciation guide accurate, including 받침 sound changes?
- **Frequency**: Are these the words that actually appear in K-pop lyrics / K-dramas / daily life?
- **Cultural context**: Anything that needs a culture note? (e.g., 오빠/언니 fan usage, 재벌 drama trope)
- **Prohibited/sensitive**: Any politics/religion/sex/violence/discrimination content I missed?

I've already done internal technical QA (자기참조 distractor 1건, 영구 키 충돌 11건, gloss form 6건 모두 fix 완료). So you can focus on the language side.

### Logistics
- **Compensation**: $20-30/hour USD (depends on your experience)
- **Estimated time**: 18-27 hours for 100% review, or sampling 30% (8-10 hours) if preferred
- **Tools**: Either GitHub PR with line comments, or Google Docs review — your call
- **Timeline**: 1-2 weeks (we want to finish before June 9, beta launch)
- **Payment**: PayPal / wire transfer / Korean bank account — let me know what works

### Preferred background
- Korean native speaker (서울/표준어 preferred for audio QC)
- Comfortable with English (we'll communicate in English)
- Bonus: language teaching or translation experience
- Bonus: familiarity with K-pop, K-drama, or Korean culture (for context notes)

If interested, please DM me with:
1. Short intro (where you're from, language background)
2. Your hourly rate
3. Approximate availability over the next 2 weeks
4. (Optional) Any sample review work or relevant experience

Happy to share a sample of the content (~10 words) before you commit, so you can estimate the workload.

Thanks!
```

---

## 2. Upwork 채용 공고 영문

> 게시: https://www.upwork.com/ — Job category: "Translation & Localization Services > Language Tutoring & Coaching"
> 권고: Fixed Price $400-600 또는 Hourly $25/hr × 20시간 cap

**Title**:
```
Korean Native Speaker — Review 590 Vocabulary Words for Language Learning App (Beta Launch)
```

**Job Description**:
```markdown
## Project Overview

We're launching **dash2zero**, a Korean vocabulary learning app for English speakers, in June 2026. Before launch, we need a Korean native speaker to review our content for naturalness, accuracy, and cultural appropriateness.

## Scope

590 Korean words across 5 vocabulary packs:
- Starter 60 (A0-A1, basic survival)
- Core 180 (A1-A2, K-pop / K-drama / Travel)
- Premium 300 (A2-B1, daily life)
- Monthly Pack June 50 (B1-B2, spring + Korean culture + SNS slang)

Each word includes:
- Korean text (with NFC normalization)
- Revised Romanization (with 받침 변화 reflected for learners)
- English gloss (1-5 words)
- Korean example sentence (i+1 vocabulary rule)
- English translation
- 3 distractor candidates (for multiple choice)

## What You'll Do

1. **Read each word entry** (YAML format provided)
2. **Flag issues**:
   - Is the example_ko natural and grammatical?
   - Is the RR pronunciation accurate, especially for 받침 발음 변화 words?
   - Is the English gloss accurate? (1-5 words rule)
   - Is the English translation natural?
   - Any cultural notes needed (slang, K-pop fan terms, 재벌 drama trope)?
3. **Provide written feedback** in Google Docs or GitHub PR comments
4. **Estimated time**: 18-27 hours (or 8-10 hours for 30% sampling)

## What I'll Provide

- All 590 words in well-structured YAML
- Quality policy reference (`CONTENT_QUALITY_POLICY.md`)
- Internal QA results (technical issues already fixed, you focus on language)
- Clear examples of issue categories

## Ideal Candidate

- ✅ Korean native speaker (Seoul/standard preferred)
- ✅ Comfortable reading and writing in English
- ✅ Detail-oriented (you'll catch what AI misses)
- ✅ Available for 1-2 weeks starting late May 2026

Bonus:
- Language teaching or translation experience
- Familiar with K-pop fandom terminology / K-drama tropes
- Translation/localization portfolio

## Deliverable

A structured review document with:
- List of issues found, organized by severity (P0/P1/P2)
- Suggested corrections for each
- Cultural notes for any words that need context

## Timeline

- Start: ASAP (this week)
- Deliverable: 2 weeks from start
- Beta launch: 2026-06-09

## Budget

$400-$800 USD (Fixed Price)
- $400 for 30% sampling (~10 hours)
- $600 for 100% standard review (~20 hours)
- $800 for 100% review + cultural notes (~27 hours)

Please propose what works for you.

## How to Apply

In your proposal, tell me:
1. Your Korean background (born/raised? Educated?)
2. English proficiency
3. Any relevant experience (teaching, translation, content review)
4. Preferred scope (sampling vs full)
5. Estimated start date and duration

I'd like to send you a sample of 10 words to review before we commit — should take ~30 minutes for you to do. Mention if you're open to that.

Looking forward to working with you!
```

---

## 3. 지인 채널 EN/KR 메시지 템플릿

> 사용: 사용자(mju.jykim@gmail.com)의 지인 한국어 교사 / 대학원생 / 번역가 네트워크
> 양식: 카톡 / 이메일 / SMS 직접 전송
> 비용: 시급 협의 (보통 시간당 ₩25,000-35,000) 또는 사례 (₩300,000~₩500,000 전체)

### 3.1 한국어 메시지 (지인 / 한국어 교사 / 번역가)

```
안녕하세요 [이름]님,

오랜만이에요!
제가 요즘 dash2zero라는 한국어 학습 모바일 앱을 만들고 있는데
6월 베타 출시 전에 콘텐츠 검수를 도와주실 분을 찾고 있어요.

검수 내용:
- 590개 한국어 단어 (starter 60 + core 180 + premium 300 + monthly 50)
- 각 단어마다 한글, 로마자 표기, 영어 뜻, 예문 한국어/영어, distractor
- 한국어 표현 자연스러운지 / 받침 발음 변화 표기 OK 한지 / 영어 번역 어색하지 않은지

시간:
- 100% 검수: 약 18~27시간
- 30% 샘플링: 약 8~10시간 (제가 직접 추리는 거 + AI 1차 검수 후 확인)

사례:
- 시간당 ₩25,000~35,000 또는 전체 ₩300,000~500,000 (협의)
- PayPal / 계좌이체 가능

도구:
- Google Docs 코멘트 또는 GitHub PR (편하신 거)

기간:
- 2주 (5월 말 시작 → 6월 8일까지)

혹시 시간 되시면 답장 주세요!
샘플 10단어 먼저 보내드릴 수도 있어요 (30분 정도 걸려요).
검수 안 하실 수도 있어요, 부담 없이 답장 주세요 😊

감사합니다,
JY (mju.jykim@gmail.com)
```

### 3.2 영문 메시지 (영어권 한국어 교사 / 대학원생)

```
Hi [Name],

Hope you're doing well! Long time.

I'm building a Korean vocabulary learning app (dash2zero) for English speakers, launching beta in June 2026.

Before launch, I'd love to have a native Korean speaker review my vocabulary content for naturalness and accuracy. Wondering if you (or anyone you know) might be interested?

The scope:
- 590 Korean words across 5 vocabulary packs (Starter, Core K-pop/K-drama/Travel, Premium, Monthly)
- Each word has Korean text + RR romanization + English gloss + example sentences + distractors
- I need help with naturalness check, 받침 변화 audio guidance, English translation review, cultural notes

Time estimate:
- ~20 hours for full review, or 8-10 hours for sampling
- 1-2 weeks timeline

Compensation:
- $20-30/hour USD or a fixed amount (whatever works for you)
- I'm flexible on payment method

Tools:
- Google Docs comments or GitHub PR (your preference)

I've already done internal technical QA so all the format/consistency issues are fixed. You'd be focused purely on the language side.

Happy to send you a 10-word sample so you can see what it looks like — takes about 30 mins. No pressure, just let me know if you're interested or know someone who might be.

Thanks!
JY
```

---

## 4. Sample 10 단어 제공 양식 (모집 응답자에게 첨부)

응답자 1차 review 가능하도록 sample 10단어 발송 (yaml 형식 + review 양식):

### 4.1 Sample 단어 (다양한 quality gate 포함)

```yaml
# Sample 10 words — please review naturalness, RR accuracy, English translation
# Categories represented: starter (1), core K-pop (2), core K-drama (2), core Travel (2), premium (2), monthly (1)
# Including 4 words with 받침 발음 변화 (mark with [받침] tag)

- { word_id: "w-st-001", korean: "안녕하세요", romanization: "an-nyeong-ha-se-yo", gloss: "hello (formal)", example_ko: "안녕하세요!", example_en: "Hello!" }
- { word_id: "w-kp-009", korean: "콘서트", romanization: "kon-seo-teu", gloss: "concert", example_ko: "콘서트 갈 거예요.", example_en: "I'm going to a concert." }
- { word_id: "w-kp-034", korean: "좋아해요", romanization: "jo-a-hae-yo", gloss: "I like (you)", example_ko: "이 노래 좋아해요.", example_en: "I like this song." }  # [받침]
- { word_id: "w-kd-013", korean: "사랑해", romanization: "sa-rang-hae", gloss: "I love you (casual)", example_ko: "사랑해.", example_en: "I love you." }
- { word_id: "w-kd-051", korean: "재벌", romanization: "jae-beol", gloss: "chaebol / conglomerate heir", example_ko: "재벌 3세예요.", example_en: "He's a 3rd-gen chaebol." }
- { word_id: "w-tv-044", korean: "깎아 주세요", romanization: "kkak-a-ju-se-yo", gloss: "please discount", example_ko: "조금만 깎아 주세요.", example_en: "A little discount, please." }  # [받침]
- { word_id: "w-tv-052", korean: "길을 잃었어요", romanization: "gi-reul-i-reo-sseo-yo", gloss: "I'm lost", example_ko: "길을 잃었어요.", example_en: "I'm lost." }  # [받침]
- { word_id: "w-pr-038", korean: "그리워요", romanization: "geu-ri-wo-yo", gloss: "I miss (someone/something)", example_ko: "친구가 그리워요.", example_en: "I miss my friend." }
- { word_id: "w-pr-043", korean: "가성비", romanization: "ga-seong-bi", gloss: "value for money", example_ko: "가성비 좋아요.", example_en: "Good value for the price." }
- { word_id: "w-mo-044", korean: "핫플", romanization: "hat-peul", gloss: "hot spot (trendy)", example_ko: "여기 요즘 핫플이에요.", example_en: "This is the hot spot lately." }  # [받침]
```

### 4.2 Review 양식 (응답자에게 첨부)

```markdown
# Sample Review — please fill in for each word

## Word 1: 안녕하세요 (an-nyeong-ha-se-yo)
- Korean naturalness: ☐ Natural ☐ Awkward (suggest fix: ____)
- RR accuracy: ☐ OK ☐ Wrong (correct: ____)
- English gloss accurate: ☐ Yes ☐ No (correct: ____)
- Example natural: ☐ Yes ☐ Awkward (better example: ____)
- Cultural note needed: ☐ No ☐ Yes (note: ____)

(repeat for words 2-10)

## Overall feedback
- Approximate time spent: ___ minutes
- Confidence in full 590-word review at this rate: ☐ Yes ☐ Maybe ☐ No
- Preferred scope: ☐ 100% review ☐ 30% sampling ☐ Other (specify)
- Notes / concerns: ____
```

---

## 5. PM 송출 일정 권고 (자율 결정)

| 단계 | 일자 | 액션 | 책임 |
|---|---|---|---|
| 1 | 2026-05-15 (목) | 사용자에게 본 3 자산 검토 요청 (필요 시 tone 조정) | orchestrator → 사용자 |
| 2 | 2026-05-16 (금) | Reddit r/Korean + Upwork 동시 게시 + 지인 채널 메시지 송출 | 사용자 |
| 3 | 2026-05-17 (토) ~ 5/19 (월) | 응답 수신 + sample 10 단어 검토 발송 | PM |
| 4 | 2026-05-20 (화) ~ 5/22 (목) | sample review 응답 수신 + 후보 1-2명 선정 | PM + 사용자 결정 |
| 5 | 2026-05-23 (금) ~ 6/06 (토) | 본 검수 시작 (590 단어, 또는 sampling) | 외부 검수자 |
| 6 | 2026-06-07 (일) ~ 6/08 (월) | 결과 수신 + learning agent retroactive 수정 | learning + qa |
| 7 | 2026-06-09 (월) | M5 W19 베타 entry 진입 (콘텐츠 외부 검수 완료) | swarm coding 팀 |

---

## 6. 비용 추정 + 결제 방식

### 6.1 비용

| 옵션 | 시간 | 시급 / 사례 | 총액 |
|---|---|---|---|
| 100% review (US/UK 응답자) | 20-27h | $25-30/hr | $500-810 |
| 30% sampling (US/UK) | 8-10h | $25-30/hr | $200-300 |
| 100% review (한국 지인) | 20-27h | ₩30,000/hr | ₩600,000-810,000 (~$450-610) |
| 30% sampling (한국 지인) | 8-10h | ₩30,000/hr | ₩240,000-300,000 (~$180-225) |

### 6.2 결제 방식

- Upwork: 자동 (Upwork escrow + 시간 추적)
- Reddit: PayPal / Wise / 은행 송금 — 응답자 협의
- 지인: 계좌이체 / 카톡 송금 / PayPal

### 6.3 사용자 결제 책임

- R-M5-01 §1 사업자 등록 진행 중일 경우 사업자 계좌로 정식 invoice 발급 가능 (세무 정합)
- 베타 launch 전 비용은 개인 사업자 비용 (사업자 등록 후) 또는 개인 비용으로 처리

---

## 7. D-020 dual-track 활용 권고

내부 qa cross-review가 이미 590단어 형식·정합성 100% 처리. 외부 검수자에게 명시:

> "All technical/format issues already resolved by internal QA (자기참조 distractor / 영구 키 충돌 / gloss form 모두 fix 완료). Please focus purely on **language naturalness, 받침 변화, and cultural context**."

→ 외부 검수자 작업 효율 30-40% 향상 예상 (반복 noise 0).

---

## 8. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-14 | 신규 작성 — R-01 모집 3채널 자산 (Reddit + Upwork + 지인) + sample 10단어 + 일정 + 비용 추정 + D-020 활용 권고 |
