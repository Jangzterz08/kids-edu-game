const items = [
  { slug: 'grains',      word: 'Grains',      emoji: '🌾', img: 'food/grains.webp',      tip: 'Eat lots of grains every day: bread, rice, pasta' },
  { slug: 'vegetables',  word: 'Vegetables',  emoji: '🥦', img: 'food/vegetables.webp',  tip: 'Eat colorful vegetables to stay healthy' },
  { slug: 'fruits',      word: 'Fruits',      emoji: '🍎', img: 'food/fruits.webp',       tip: 'Fruits give you vitamins and energy' },
  { slug: 'dairy',       word: 'Dairy',       emoji: '🥛', img: 'food/dairy.webp',        tip: 'Milk and cheese make your bones strong' },
  { slug: 'protein',     word: 'Protein',     emoji: '🥩', img: 'food/protein.webp',      tip: 'Protein helps you grow big and strong' },
  { slug: 'water',       word: 'Water',       emoji: '💧', img: 'food/water.webp',        tip: 'Drink water every day to stay hydrated' },
  { slug: 'sweets',      word: 'Sweets',      emoji: '🍬', img: 'food/sweets.webp',       tip: 'Sweets are okay sometimes — just not too much!' },
];

export const foodPyramidModule = {
  slug: 'food-pyramid',
  title: 'Food Pyramid',
  iconEmoji: '🥗',
  sortOrder: 9,
  color: '#43A047',
  bgGradient: 'linear-gradient(135deg, #43A047 0%, #A5D6A7 100%)',
  games: ['matching', 'quiz'],
  lessons: items.map((item, i) => ({
    slug: item.slug,
    title: item.word,
    word: item.word,
    emoji: item.emoji,
    tip: item.tip,
    sortOrder: i + 1,
    imageFile: item.img,
    audioFile: `food/${item.slug}.mp3`,
    traceTemplate: null,
    quizOptions: [{ word: item.word, imageFile: item.img, correct: true }],
    matchingPairs: [
      { id: `${item.slug}-img`, type: 'image', content: item.img },
      { id: `${item.slug}-img`, type: 'word',  content: item.word },
    ],
  })),
};
