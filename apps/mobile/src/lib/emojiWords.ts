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

  // === 추가 (2026-06-30) ===
  // 음식
  { korean: "오렌지", gloss: "orange", emoji: "🍊", category: "food" },
  { korean: "레몬", gloss: "lemon", emoji: "🍋", category: "food" },
  { korean: "토마토", gloss: "tomato", emoji: "🍅", category: "food" },
  { korean: "당근", gloss: "carrot", emoji: "🥕", category: "food" },
  { korean: "옥수수", gloss: "corn", emoji: "🌽", category: "food" },
  { korean: "감자", gloss: "potato", emoji: "🥔", category: "food" },
  { korean: "버섯", gloss: "mushroom", emoji: "🍄", category: "food" },
  { korean: "햄버거", gloss: "hamburger", emoji: "🍔", category: "food" },
  { korean: "핫도그", gloss: "hot dog", emoji: "🌭", category: "food" },
  { korean: "아이스크림", gloss: "ice cream", emoji: "🍦", category: "food" },
  { korean: "케이크", gloss: "cake", emoji: "🍰", category: "food" },
  { korean: "초콜릿", gloss: "chocolate", emoji: "🍫", category: "food" },
  { korean: "쿠키", gloss: "cookie", emoji: "🍪", category: "food" },
  { korean: "도넛", gloss: "donut", emoji: "🍩", category: "food" },
  { korean: "치즈", gloss: "cheese", emoji: "🧀", category: "food" },
  { korean: "꿀", gloss: "honey", emoji: "🍯", category: "food" },
  { korean: "녹차", gloss: "green tea", emoji: "🍵", category: "food" },
  { korean: "와인", gloss: "wine", emoji: "🍷", category: "food" },
  { korean: "맥주", gloss: "beer", emoji: "🍺", category: "food" },

  // 동물
  { korean: "사자", gloss: "lion", emoji: "🦁", category: "animal" },
  { korean: "코끼리", gloss: "elephant", emoji: "🐘", category: "animal" },
  { korean: "원숭이", gloss: "monkey", emoji: "🐵", category: "animal" },
  { korean: "기린", gloss: "giraffe", emoji: "🦒", category: "animal" },
  { korean: "판다", gloss: "panda", emoji: "🐼", category: "animal" },
  { korean: "쥐", gloss: "mouse", emoji: "🐭", category: "animal" },
  { korean: "양", gloss: "sheep", emoji: "🐑", category: "animal" },
  { korean: "뱀", gloss: "snake", emoji: "🐍", category: "animal" },
  { korean: "거북이", gloss: "turtle", emoji: "🐢", category: "animal" },
  { korean: "개구리", gloss: "frog", emoji: "🐸", category: "animal" },
  { korean: "나비", gloss: "butterfly", emoji: "🦋", category: "animal" },
  { korean: "벌", gloss: "bee", emoji: "🐝", category: "animal" },
  { korean: "문어", gloss: "octopus", emoji: "🐙", category: "animal" },
  { korean: "고래", gloss: "whale", emoji: "🐳", category: "animal" },
  { korean: "펭귄", gloss: "penguin", emoji: "🐧", category: "animal" },
  { korean: "오리", gloss: "duck", emoji: "🦆", category: "animal" },
  { korean: "부엉이", gloss: "owl", emoji: "🦉", category: "animal" },
  { korean: "상어", gloss: "shark", emoji: "🦈", category: "animal" },

  // 탈것
  { korean: "트럭", gloss: "truck", emoji: "🚚", category: "vehicle" },
  { korean: "오토바이", gloss: "motorcycle", emoji: "🏍️", category: "vehicle" },
  { korean: "헬리콥터", gloss: "helicopter", emoji: "🚁", category: "vehicle" },
  { korean: "로켓", gloss: "rocket", emoji: "🚀", category: "vehicle" },
  { korean: "구급차", gloss: "ambulance", emoji: "🚑", category: "vehicle" },
  { korean: "경찰차", gloss: "police car", emoji: "🚓", category: "vehicle" },

  // 자연
  { korean: "번개", gloss: "lightning", emoji: "⚡", category: "nature" },
  { korean: "눈사람", gloss: "snowman", emoji: "⛄", category: "nature" },
  { korean: "지구", gloss: "earth", emoji: "🌍", category: "nature" },
  { korean: "화산", gloss: "volcano", emoji: "🌋", category: "nature" },
  { korean: "선인장", gloss: "cactus", emoji: "🌵", category: "nature" },
  { korean: "단풍", gloss: "autumn leaf", emoji: "🍁", category: "nature" },
  { korean: "야자수", gloss: "palm tree", emoji: "🌴", category: "nature" },
  { korean: "잎", gloss: "leaf", emoji: "🍃", category: "nature" },

  // 사물
  { korean: "컴퓨터", gloss: "computer", emoji: "💻", category: "object" },
  { korean: "텔레비전", gloss: "television", emoji: "📺", category: "object" },
  { korean: "신발", gloss: "shoes", emoji: "👟", category: "object" },
  { korean: "모자", gloss: "hat", emoji: "🧢", category: "object" },
  { korean: "안경", gloss: "glasses", emoji: "👓", category: "object" },
  { korean: "옷", gloss: "clothes", emoji: "👕", category: "object" },
  { korean: "바지", gloss: "pants", emoji: "👖", category: "object" },
  { korean: "양말", gloss: "socks", emoji: "🧦", category: "object" },
  { korean: "침대", gloss: "bed", emoji: "🛏️", category: "object" },
  { korean: "의자", gloss: "chair", emoji: "🪑", category: "object" },
  { korean: "문", gloss: "door", emoji: "🚪", category: "object" },
  { korean: "풍선", gloss: "balloon", emoji: "🎈", category: "object" },
  { korean: "공", gloss: "ball", emoji: "⚽", category: "object" },
  { korean: "연필", gloss: "pencil", emoji: "✏️", category: "object" },
  { korean: "가위", gloss: "scissors", emoji: "✂️", category: "object" },
  { korean: "지도", gloss: "map", emoji: "🗺️", category: "object" },
  { korean: "편지", gloss: "letter", emoji: "✉️", category: "object" },
  { korean: "약", gloss: "medicine", emoji: "💊", category: "object" },
  { korean: "비누", gloss: "soap", emoji: "🧼", category: "object" },

  // 신체
  { korean: "손", gloss: "hand", emoji: "✋", category: "body" },
  { korean: "발", gloss: "foot", emoji: "🦶", category: "body" },
  { korean: "입", gloss: "mouth", emoji: "👄", category: "body" },
  { korean: "귀", gloss: "ear", emoji: "👂", category: "body" },
  { korean: "코", gloss: "nose", emoji: "👃", category: "body" },
  { korean: "심장", gloss: "heart", emoji: "🫀", category: "body" },
  { korean: "뇌", gloss: "brain", emoji: "🧠", category: "body" },
];
