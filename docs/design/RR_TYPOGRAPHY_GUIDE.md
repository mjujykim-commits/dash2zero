# RR (Romanization) Typography Guide — RN Mapping

> 문서 상태: v1.0 (M3 W15)
> 작성: designer (senior UX/UI), 2026-05-11 23:00
> 후속: UX-NEW-001 ("32 글자 ellipsis" 결정)
> 상위: `docs/brand/THEME_DECISIONS.md` §4, `packages/design-tokens/src/typography.ts`

---

## 0. 배경

UX-NEW-001 결정 — RR(Revised Romanization)이 32자를 초과하면 ellipsis 처리. 그러나 RN 매핑 (`numberOfLines`, `ellipsizeMode`) 가이드 부재였음 (W14 readiness §3.2). 본 문서가 그 갭을 메운다.

---

## 1. RR 토큰 (재확인)

```ts
"text.romanization": {
  fontSize: 14,
  lineHeight: 20,
  weight: "400",
  family: "Inter",
}
```

색: `text.muted` (#A1A1AA light / #71717A dark).
의도: 한글 단어/예문의 **보조** 정보. 시각 위계 3순위 (한글 > gloss > RR).

---

## 2. RN 매핑 권고

### 2.1 단어 카드 RR (lesson/[wordId].tsx — `STUB_WORD.romanization`)

```tsx
<Text
  numberOfLines={1}
  ellipsizeMode="tail"
  style={{
    fontSize: typeScale["text.romanization"].fontSize,
    lineHeight: typeScale["text.romanization"].lineHeight,
    color: lightColors["text.muted"],
    textAlign: "center",
    maxWidth: 280, // SE 320pt - space.5*2
  }}
>
  {romanization}
</Text>
```

핵심:
- `numberOfLines={1}` — 한 줄 강제
- `ellipsizeMode="tail"` — 뒤쪽 ... 처리 (head/middle 금지: 발음 첫음절이 잘리면 가치 0)
- `maxWidth: 280` — SE 320pt 카드 안에서 양옆 padding 고려 (320 - space.5*2 = 280)

### 2.2 예문 RR (있는 경우)

- 예문 RR은 **2줄 허용** (`numberOfLines={2}`).
- 사유: 예문은 단어보다 정보 밀도 우선. 단, 3줄 이상은 ellipsis tail.

```tsx
<Text numberOfLines={2} ellipsizeMode="tail" ...>
  {exampleRomanization}
</Text>
```

### 2.3 quiz 옵션 내 RR

- quiz 옵션은 한글만 표시 (현재 `lesson/[wordId].tsx` line 192). RR 추가 **금지** — 4지선다 인지 부담 증가.
- 사용자가 한글을 읽지 못해 옵션 구분이 어려운 경우는 hear stage에서 audio 재생으로 보완.

---

## 3. SE 320pt 카드 fit 검증 (ASCII)

### 3.1 현재 카드 (notice stage, RR 미표시)

```
+--------------------------------+    320pt
|         (top space.10 = 40)    |
|                                |
|         사 과                   |    44pt height
|                                |
|         [▶ audio 44]           |
|                                |
+--------------------------------+
horizontal: padding space.5(20) + content 280 + space.5(20)
```

OK — fit 여유.

### 3.2 meaning stage (RR 1줄 + gloss + ko example + en example)

```
+--------------------------------+    320pt
|         (top space.10 = 40)    |
|         Card 2 of 5            |   13/18  + 8 margin
|         1 of 4                 |   13/18  + 24 margin
|                                |
|         사 과                   |   44/52
|                                + 16 margin
|         [▶ audio 44]           |
|                                + 24 margin
|         sa-gwa                 |   14/20  numberOfLines=1 ellipsizeMode=tail
|                                + 12 margin
|         apple                  |   18/26
|                                + 24 margin
|       사과 주세요.              |   18 (한글)
|       Apple, please.           |   16 italic
|                                |
|        [Continue 56h]          |   bottom CTA
+--------------------------------+
```

세로 합 (top to CTA):
- 40 (paddingTop) + 18 + 8 + 18 + 24 + 52 + 16 + 44 + 24 + 20 + 12 + 26 + 24 + 26 + 26 + 24 + 56 + 24 (paddingBottom)
- = **460pt** content height

SE 화면 높이 568pt 중 status bar 20 + safe top 0 (SE는 노치 없음) = 가용 ~548pt.
- 460 < 548 → **fit OK** (스크롤 불요).

긴 RR 케이스 (e.g. "ttwi-eo-ga-myeon-seo" 21자) → 1줄 ellipsis로 동일 14/20 유지 → 위 합 동일.

### 3.3 retrieve stage (quiz 4 options)

```
+--------------------------------+    320pt
|         (top space.10 = 40)    |
|         Card 2 of 5            |   18 + 8
|         1 of 4                 |   18 + 24
|                                |
|         사 과                   |   44/52
|                                + 16
|         [▶ audio 44]           |
|                                + 32
|     Which one is "apple"?      |   18/26 heading.sm + 16
|                                |
|     [ 사과 ]                    |   56h + 12
|     [ 바나나 ]                   |   56h + 12
|     [ 물 ]                      |   56h + 12
|     [ 커피 ]                    |   56h + 12
|                                |
|        [Submit 56h]            |
+--------------------------------+
```

세로 합: 40 + 18 + 8 + 18 + 24 + 52 + 16 + 44 + 32 + 26 + 16 + (56+12)*4 + 56 + 24 = **626pt**

**SE 568 < 626 → 스크롤 발생** (현재 ScrollView로 감싸져 있음 — W14 readiness §1.7 caveat).

권고: retrieve stage에서는 audio 버튼을 **hide** 또는 **size 32**로 축소. 학습 단계상 retrieve는 audio 없이 시각만으로 변별이 목적.

```
저감 후: 626 - 44(audio) - 32(audio margin) - 32(quiz heading 부분 흡수) = ~518pt → fit OK
```

이 결정은 frontend agent에 전달 필요. **자율 결정**: retrieve stage audio 버튼은 표시하되 size 32로 축소, margin space.4 (16) 적용.

---

## 4. 한국어 RR 길이 분포 (참고)

| RR 길이 (자) | 비율 (가설, M3 starter pack 기준) | 처리 |
|---|---|---|
| 1~10 | 70% | 1줄 fit, ellipsis 미발동 |
| 11~20 | 25% | 1줄 fit, ellipsis 미발동 |
| 21~32 | 4% | 1줄 fit (Inter 14pt 기준 280pt에 ~32자 들어감) |
| 33+ | 1% | ellipsis tail 발동 |

**ellipsis 발동 시 사용자 영향**: 매우 적음. RR은 보조 정보이며, 발음은 audio가 1차. ellipsis는 시각 일관성 우선.

---

## 5. 다국어 ellipsis (i18n)

- 한국어 UI 1차 언어 결정 시 (현재 미정 — REVIEW_QA designer 섹션 질문):
  - RR 자체는 영문이므로 변경 없음.
  - 단어 자체가 영문 표기 ("apple")인 경우 위 RR과 동일 패턴 적용 (`numberOfLines={1}`).
- 일본어 UI 시 — 별도 추가 검토 (M5+).

---

## 6. accessibility

- `accessibilityLabel` 에 ellipsis가 있더라도 **전체 RR**을 부여 (시각만 자르고 음성은 전체 읽기).

```tsx
<Text
  numberOfLines={1}
  ellipsizeMode="tail"
  accessibilityLabel={fullRomanization}
  ...
>
  {fullRomanization}
</Text>
```

- 동적 글자 크기 100%~120% 범위에서 SE 320pt에 1줄 fit 유지. 130% 이상은 자연 스크롤 허용.

---

## 7. 검증 체크리스트 (frontend handoff)

- [ ] `lesson/[wordId].tsx` line 125-133 (RR Text) 에 `numberOfLines={1} ellipsizeMode="tail" maxWidth={280}` 적용
- [ ] `accessibilityLabel` 에 풀 RR 문자열
- [ ] retrieve stage audio 버튼 size 32 (또는 hide) 결정 후 적용 — SE fit 확보
- [ ] 32자 초과 RR 더미 데이터로 시각 회귀 확인
- [ ] 다크 적용 후 `text.muted` (#71717A) 가독성 확인

---

## 8. 변경 이력

| 일자 | 버전 | 변경 |
|---|---|---|
| 2026-05-11 | v1.0 | 초안 (designer agent, M3 W15) |
