const items = [
  { slug: 'monday',    word: 'Monday',    emoji: '🌙', img: 'days/monday.webp' },
  { slug: 'tuesday',   word: 'Tuesday',   emoji: '🔥', img: 'days/tuesday.webp' },
  { slug: 'wednesday', word: 'Wednesday', emoji: '💧', img: 'days/wednesday.webp' },
  { slug: 'thursday',  word: 'Thursday',  emoji: '⚡', img: 'days/thursday.webp' },
  { slug: 'friday',    word: 'Friday',    emoji: '🎉', img: 'days/friday.webp' },
  { slug: 'saturday',  word: 'Saturday',  emoji: '⭐', img: 'days/saturday.webp' },
  { slug: 'sunday',    word: 'Sunday',    emoji: '☀️', img: 'days/sunday.webp' },
];

export const daysOfWeekModule = {
  slug: 'days-of-week',
  title: 'Days of the Week',
  iconEmoji: '📅',
  sortOrder: 12,
  color: '#FF9F43',
  bgGradient: 'linear-gradient(135deg, #FF9F43 0%, #EE5A24 100%)',
  games: ['matching', 'quiz', 'spelling'],
  lessons: items.map((item, i) => ({
    slug: item.slug,
    title: item.word,
    word: item.word,
    emoji: item.emoji,
    sortOrder: i + 1,
    imageFile: item.img,
    audioFile: `days/${item.slug}.mp3`,
    traceTemplate: null,
    quizOptions: [{ word: item.word, imageFile: item.img, correct: true }],
    matchingPairs: [
      { id: `${item.slug}-img`, type: 'image', content: item.img },
      { id: `${item.slug}-word`, type: 'word', content: item.word },
    ],
  })),
};
