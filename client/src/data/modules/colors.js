const items = [
  { slug: 'color-red',    word: 'Red',    emoji: '🔴', hex: '#FF5252', img: 'colors/red.webp' },
  { slug: 'color-blue',   word: 'Blue',   emoji: '🔵', hex: '#2979FF', img: 'colors/blue.webp' },
  { slug: 'color-yellow', word: 'Yellow', emoji: '🟡', hex: '#FFD600', img: 'colors/yellow.webp' },
  { slug: 'color-green',  word: 'Green',  emoji: '🟢', hex: '#4CAF50', img: 'colors/green.webp' },
  { slug: 'color-orange', word: 'Orange', emoji: '🟠', hex: '#FF9800', img: 'colors/orange.webp' },
  { slug: 'color-purple', word: 'Purple', emoji: '🟣', hex: '#9C27B0', img: 'colors/purple.webp' },
  { slug: 'color-pink',   word: 'Pink',   emoji: '🩷', hex: '#E91E8C', img: 'colors/pink.webp' },
  { slug: 'color-brown',  word: 'Brown',  emoji: '🟤', hex: '#795548', img: 'colors/brown.webp' },
  { slug: 'color-black',  word: 'Black',  emoji: '⬛', hex: '#212121', img: 'colors/black.webp' },
  { slug: 'color-white',  word: 'White',  emoji: '⬜', hex: '#FAFAFA', img: 'colors/white.webp' },
];

export const colorsModule = {
  slug: 'colors',
  title: 'Colors',
  iconEmoji: '🎨',
  sortOrder: 4,
  color: '#E91E8C',
  bgGradient: 'linear-gradient(135deg, #E91E8C 0%, #FF9800 100%)',
  games: ['matching', 'quiz', 'spelling'],
  lessons: items.map((item, i) => ({
    slug: item.slug,
    title: item.word,
    word: item.word,
    emoji: item.emoji,
    hexValue: item.hex,
    sortOrder: i + 1,
    imageFile: item.img,
    audioFile: `colors/${item.word.toLowerCase()}.mp3`,
    traceTemplate: null,
    quizOptions: [{ word: item.word, imageFile: item.img, emoji: item.emoji, correct: true }],
    matchingPairs: [
      { id: `${item.slug}-img`, type: 'color', content: item.hex },
      { id: `${item.slug}-img`, type: 'word',  content: item.word },
    ],
  })),
};
