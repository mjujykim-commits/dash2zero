/**
 * 그림(이모지) 퀴즈용 단어 목록 — 구체 명사 한글 ↔ 이모지 매핑.
 *
 * Picture Quiz(app/picture-quiz.tsx)에서 사용. 백엔드/콘텐츠 DB와 독립(자체 완결형).
 * 이모지는 라이선스 free(유니코드) — "오픈소스 그림" 요건 충족. 구체 명사만(추상어 제외).
 *
 * 카테고리별로 묶음 — 같은 카테고리 내에서 distractor를 뽑으면 난이도 적정(과하게 쉽지 않게).
 */

export interface EmojiWord {
  korean: string;
  gloss: string;
  emoji: string;
  category: "food" | "animal" | "vehicle" | "nature" | "object" | "body";
}

export const EMOJI_WORDS: EmojiWord[] = [
  // 음식
  { korean: "사과", gloss: "apple", emoji: "🍎", category: "food" },
  { korean: "바나나", gloss: "banana", emoji: "🍌", category: "food" },
  { korean: "수박", gloss: "watermelon", emoji: "🍉", category: "food" },
  { korean: "딸기", gloss: "strawberry", emoji: "🍓", category: "food" },
  { korean: "포도", gloss: "grapes", emoji: "🍇", category: "food" },
  { korean: "빵", gloss: "bread", emoji: "🍞", category: "food" },
  { korean: "밥", gloss: "rice", emoji: "🍚", category: "food" },
  { korean: "라면", gloss: "ramen", emoji: "🍜", category: "food" },
  { korean: "피자", gloss: "pizza", emoji: "🍕", category: "food" },
  { korean: "치킨", gloss: "chicken", emoji: "🍗", category: "food" },
  { korean: "커피", gloss: "coffee", emoji: "☕", category: "food" },
  { korean: "우유", gloss: "milk", emoji: "🥛", category: "food" },
  { korean: "계란", gloss: "egg", emoji: "🥚", category: "food" },
  { korean: "물", gloss: "water", emoji: "💧", category: "food" },

  // 동물
  { korean: "개", gloss: "dog", emoji: "🐶", category: "animal" },
  { korean: "고양이", gloss: "cat", emoji: "🐱", category: "animal" },
  { korean: "토끼", gloss: "rabbit", emoji: "🐰", category: "animal" },
  { korean: "곰", gloss: "bear", emoji: "🐻", category: "animal" },
  { korean: "호랑이", gloss: "tiger", emoji: "🐯", category: "animal" },
  { korean: "돼지", gloss: "pig", emoji: "🐷", category: "animal" },
  { korean: "말", gloss: "horse", emoji: "🐴", category: "animal" },
  { korean: "닭", gloss: "chicken (animal)", emoji: "🐔", category: "animal" },
  { korean: "물고기", gloss: "fish", emoji: "🐟", category: "animal" },
  { korean: "새", gloss: "bird", emoji: "🐦", category: "animal" },

  // 탈것
  { korean: "비행기", gloss: "airplane", emoji: "✈️", category: "vehicle" },
  { korean: "기차", gloss: "train", emoji: "🚆", category: "vehicle" },
  { korean: "버스", gloss: "bus", emoji: "🚌", category: "vehicle" },
  { korean: "택시", gloss: "taxi", emoji: "🚕", category: "vehicle" },
  { korean: "자동차", gloss: "car", emoji: "🚗", category: "vehicle" },
  { korean: "자전거", gloss: "bicycle", emoji: "🚲", category: "vehicle" },
  { korean: "배", gloss: "ship", emoji: "🚢", category: "vehicle" },

  // 자연·날씨
  { korean: "해", gloss: "sun", emoji: "☀️", category: "nature" },
  { korean: "달", gloss: "moon", emoji: "🌙", category: "nature" },
  { korean: "별", gloss: "star", emoji: "⭐", category: "nature" },
  { korean: "비", gloss: "rain", emoji: "🌧️", category: "nature" },
  { korean: "눈", gloss: "snow", emoji: "❄️", category: "nature" },
  { korean: "구름", gloss: "cloud", emoji: "☁️", category: "nature" },
  { korean: "무지개", gloss: "rainbow", emoji: "🌈", category: "nature" },
  { korean: "꽃", gloss: "flower", emoji: "🌸", category: "nature" },
  { korean: "나무", gloss: "tree", emoji: "🌳", category: "nature" },
  { korean: "산", gloss: "mountain", emoji: "⛰️", category: "nature" },
  { korean: "바다", gloss: "sea", emoji: "🌊", category: "nature" },
  { korean: "불", gloss: "fire", emoji: "🔥", category: "nature" },

  // 사물
  { korean: "책", gloss: "book", emoji: "📖", category: "object" },
  { korean: "시계", gloss: "clock", emoji: "⏰", category: "object" },
  { korean: "집", gloss: "house", emoji: "🏠", category: "object" },
  { korean: "학교", gloss: "school", emoji: "🏫", category: "object" },
  { korean: "가방", gloss: "bag", emoji: "🎒", category: "object" },
  { korean: "돈", gloss: "money", emoji: "💰", category: "object" },
  { korean: "열쇠", gloss: "key", emoji: "🔑", category: "object" },
  { korean: "우산", gloss: "umbrella", emoji: "☂️", category: "object" },
  { korean: "선물", gloss: "gift", emoji: "🎁", category: "object" },
  { korean: "카메라", gloss: "camera", emoji: "📷", category: "object" },
  { korean: "전화", gloss: "phone", emoji: "📱", category: "object" },
];
