const items = [
  { slug: 'happy',     word: 'Happy',     emoji: '😊', img: 'emotions/happy.webp' },
  { slug: 'sad',       word: 'Sad',       emoji: '😢', img: 'emotions/sad.webp' },
  { slug: 'angry',     word: 'Angry',     emoji: '😠', img: 'emotions/angry.webp' },
  { slug: 'scared',    word: 'Scared',    emoji: '😨', img: 'emotions/scared.webp' },
  { slug: 'surprised', word: 'Surprised', emoji: '😲', img: 'emotions/surprised.webp' },
  { slug: 'excited',   word: 'Excited',   emoji: '🤩', img: 'emotions/excited.webp' },
  { slug: 'tired',     word: 'Tired',     emoji: '😴', img: 'emotions/tired.webp' },
  { slug: 'silly',     word: 'Silly',     emoji: '😜', img: 'emotions/silly.webp' },
];

export const emotionsModule = {
  slug: 'emotions',
  title: 'Emotions',
  iconEmoji: '😊',
  sortOrder: 10,
  color: '#FF6B9D',
  bgGradient: 'linear-gradient(135deg, #FF6B9D 0%, #FECA57 100%)',
  games: ['matching', 'quiz', 'spelling'],
  lessons: items.map((item, i) => ({
    slug: item.slug,
    title: item.word,
    word: item.word,
    emoji: item.emoji,
    sortOrder: i + 1,
    imageFile: item.img,
    audioFile: `emotions/${item.slug}.mp3`,
    traceTemplate: null,
    quizOptions: [{ word: item.word, imageFile: item.img, correct: true }],
    matchingPairs: [
      { id: `${item.slug}-img`, type: 'image', content: item.img },
      { id: `${item.slug}-word`, type: 'word', content: item.word },
    ],
  })),
};
