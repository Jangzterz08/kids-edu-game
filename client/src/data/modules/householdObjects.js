const items = [
  { slug: 'chair',   word: 'Chair',   emoji: '🪑', img: 'household/chair.webp' },
  { slug: 'table',   word: 'Table',   emoji: '🪴', img: 'household/table.webp' },
  { slug: 'bed',     word: 'Bed',     emoji: '🛏️', img: 'household/bed.webp' },
  { slug: 'door',    word: 'Door',    emoji: '🚪', img: 'household/door.webp' },
  { slug: 'window',  word: 'Window',  emoji: '🪟', img: 'household/window.webp' },
  { slug: 'lamp',    word: 'Lamp',    emoji: '💡', img: 'household/lamp.webp' },
  { slug: 'sofa',    word: 'Sofa',    emoji: '🛋️', img: 'household/sofa.webp' },
  { slug: 'fridge',  word: 'Fridge',  emoji: '🧊', img: 'household/fridge.webp' },
];

export const householdObjectsModule = {
  slug: 'household',
  title: 'Around the House',
  iconEmoji: '🏠',
  sortOrder: 8,
  color: '#FF9800',
  bgGradient: 'linear-gradient(135deg, #FF9800 0%, #FFCC80 100%)',
  games: ['matching', 'quiz'],
  lessons: items.map((item, i) => ({
    slug: item.slug,
    title: item.word,
    word: item.word,
    emoji: item.emoji,
    sortOrder: i + 1,
    imageFile: item.img,
    audioFile: `household/${item.slug}.mp3`,
    traceTemplate: null,
    quizOptions: [{ word: item.word, imageFile: item.img, correct: true }],
    matchingPairs: [
      { id: `${item.slug}-img`, type: 'image', content: item.img },
      { id: `${item.slug}-img`, type: 'word',  content: item.word },
    ],
  })),
};
