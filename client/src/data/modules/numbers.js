const nums = [
  { n: '0', word: 'Zero',  emoji: '0️⃣' },
  { n: '1', word: 'One',   emoji: '1️⃣' },
  { n: '2', word: 'Two',   emoji: '2️⃣' },
  { n: '3', word: 'Three', emoji: '3️⃣' },
  { n: '4', word: 'Four',  emoji: '4️⃣' },
  { n: '5', word: 'Five',  emoji: '5️⃣' },
  { n: '6', word: 'Six',   emoji: '6️⃣' },
  { n: '7', word: 'Seven', emoji: '7️⃣' },
  { n: '8', word: 'Eight', emoji: '8️⃣' },
  { n: '9', word: 'Nine',  emoji: '9️⃣' },
];

export const numbersModule = {
  slug: 'numbers',
  title: 'Numbers',
  iconEmoji: '🔢',
  sortOrder: 2,
  color: '#4ECDC4',
  bgGradient: 'linear-gradient(135deg, #4ECDC4 0%, #A8E6CF 100%)',
  games: ['matching', 'tracing', 'quiz', 'phonics'],
  lessons: nums.map((item, i) => ({
    slug: `number-${item.n}`,
    title: item.word,
    word: item.word,
    numeral: item.n,
    emoji: item.emoji,
    dotCount: parseInt(item.n, 10),
    sortOrder: i + 1,
    audioFile: `numbers/${item.word.toLowerCase()}.mp3`,
    traceTemplate: `traces/number-${item.n}.svg`,
    quizOptions: [
      { word: item.word, dotCount: parseInt(item.n, 10), correct: true },
    ],
    matchingPairs: [
      { id: `n${item.n}-dots`, type: 'dots', content: parseInt(item.n, 10) },
      { id: `n${item.n}-dots`, type: 'word', content: item.n },
    ],
  })),
};
