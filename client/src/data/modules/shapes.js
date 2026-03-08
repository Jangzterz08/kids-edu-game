const items = [
  { slug: 'circle',    word: 'Circle',    emoji: '⭕', img: 'shapes/circle.webp',    color: '#FF5252' },
  { slug: 'square',    word: 'Square',    emoji: '🟥', img: 'shapes/square.webp',    color: '#2979FF' },
  { slug: 'triangle',  word: 'Triangle',  emoji: '🔺', img: 'shapes/triangle.webp',  color: '#FF9800' },
  { slug: 'rectangle', word: 'Rectangle', emoji: '▬',  img: 'shapes/rectangle.webp', color: '#9C27B0' },
  { slug: 'star',      word: 'Star',      emoji: '⭐', img: 'shapes/star.webp',      color: '#FFD600' },
  { slug: 'heart',     word: 'Heart',     emoji: '❤️', img: 'shapes/heart.webp',     color: '#E91E8C' },
  { slug: 'diamond',   word: 'Diamond',   emoji: '💎', img: 'shapes/diamond.webp',   color: '#26C6DA' },
  { slug: 'oval',      word: 'Oval',      emoji: '🥚', img: 'shapes/oval.webp',      color: '#4CAF50' },
];

export const shapesModule = {
  slug: 'shapes',
  title: 'Shapes',
  iconEmoji: '🔷',
  sortOrder: 3,
  color: '#FF9800',
  bgGradient: 'linear-gradient(135deg, #FF9800 0%, #FFE082 100%)',
  games: ['matching', 'tracing', 'quiz'],
  lessons: items.map((item, i) => ({
    slug: item.slug,
    title: item.word,
    word: item.word,
    emoji: item.emoji,
    shapeColor: item.color,
    sortOrder: i + 1,
    imageFile: item.img,
    audioFile: `shapes/${item.slug}.mp3`,
    traceTemplate: `traces/shape-${item.slug}.svg`,
    quizOptions: [{ word: item.word, imageFile: item.img, correct: true }],
    matchingPairs: [
      { id: `${item.slug}-img`, type: 'image', content: item.img },
      { id: `${item.slug}-img`, type: 'word',  content: item.word },
    ],
  })),
};
