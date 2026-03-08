const nums = [
  { n: '0', word: 'Zero',  emoji: '0️⃣', img: 'numbers/zero.webp' },
  { n: '1', word: 'One',   emoji: '1️⃣', img: 'numbers/one.webp' },
  { n: '2', word: 'Two',   emoji: '2️⃣', img: 'numbers/two.webp' },
  { n: '3', word: 'Three', emoji: '3️⃣', img: 'numbers/three.webp' },
  { n: '4', word: 'Four',  emoji: '4️⃣', img: 'numbers/four.webp' },
  { n: '5', word: 'Five',  emoji: '5️⃣', img: 'numbers/five.webp' },
  { n: '6', word: 'Six',   emoji: '6️⃣', img: 'numbers/six.webp' },
  { n: '7', word: 'Seven', emoji: '7️⃣', img: 'numbers/seven.webp' },
  { n: '8', word: 'Eight', emoji: '8️⃣', img: 'numbers/eight.webp' },
  { n: '9', word: 'Nine',  emoji: '9️⃣', img: 'numbers/nine.webp' },
];

export const numbersModule = {
  slug: 'numbers',
  title: 'Numbers',
  iconEmoji: '🔢',
  sortOrder: 2,
  color: '#4ECDC4',
  bgGradient: 'linear-gradient(135deg, #4ECDC4 0%, #A8E6CF 100%)',
  games: ['matching', 'tracing', 'quiz'],
  lessons: nums.map((item, i) => ({
    slug: `number-${item.n}`,
    title: item.word,
    word: item.word,
    numeral: item.n,
    emoji: item.emoji,
    sortOrder: i + 1,
    imageFile: item.img,
    audioFile: `numbers/${item.word.toLowerCase()}.mp3`,
    traceTemplate: `traces/number-${item.n}.svg`,
    quizOptions: [
      { word: item.word, imageFile: item.img, correct: true },
    ],
    matchingPairs: [
      { id: `n${item.n}-img`, type: 'image', content: item.img },
      { id: `n${item.n}-img`, type: 'word',  content: item.n },
    ],
  })),
};
