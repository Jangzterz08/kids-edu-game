const items = [
  { slug: 'sunny',   word: 'Sunny',   emoji: '☀️',  img: 'weather/sunny.webp' },
  { slug: 'rainy',   word: 'Rainy',   emoji: '🌧️', img: 'weather/rainy.webp' },
  { slug: 'cloudy',  word: 'Cloudy',  emoji: '☁️',  img: 'weather/cloudy.webp' },
  { slug: 'snowy',   word: 'Snowy',   emoji: '❄️',  img: 'weather/snowy.webp' },
  { slug: 'windy',   word: 'Windy',   emoji: '💨',  img: 'weather/windy.webp' },
  { slug: 'stormy',  word: 'Stormy',  emoji: '⛈️',  img: 'weather/stormy.webp' },
  { slug: 'rainbow', word: 'Rainbow', emoji: '🌈',  img: 'weather/rainbow.webp' },
  { slug: 'foggy',   word: 'Foggy',   emoji: '🌫️', img: 'weather/foggy.webp' },
];

export const weatherModule = {
  slug: 'weather',
  title: 'Weather',
  iconEmoji: '⛅',
  sortOrder: 11,
  color: '#54A0FF',
  bgGradient: 'linear-gradient(135deg, #54A0FF 0%, #5F27CD 100%)',
  games: ['matching', 'quiz', 'spelling'],
  lessons: items.map((item, i) => ({
    slug: item.slug,
    title: item.word,
    word: item.word,
    emoji: item.emoji,
    sortOrder: i + 1,
    imageFile: item.img,
    audioFile: `weather/${item.slug}.mp3`,
    traceTemplate: null,
    quizOptions: [{ word: item.word, imageFile: item.img, correct: true }],
    matchingPairs: [
      { id: `${item.slug}-img`, type: 'image', content: item.img },
      { id: `${item.slug}-word`, type: 'word', content: item.word },
    ],
  })),
};
