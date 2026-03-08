const items = [
  { slug: 'please',    word: 'Please',    emoji: '🙏', img: 'manners/please.webp',   tip: 'Always say please when asking for something' },
  { slug: 'thank-you', word: 'Thank You', emoji: '😊', img: 'manners/thankyou.webp', tip: 'Say thank you when someone helps you' },
  { slug: 'sorry',     word: 'Sorry',     emoji: '😔', img: 'manners/sorry.webp',    tip: 'Say sorry when you make a mistake' },
  { slug: 'share',     word: 'Share',     emoji: '🤝', img: 'manners/share.webp',    tip: 'Share your toys with friends' },
  { slug: 'listen',    word: 'Listen',    emoji: '👂', img: 'manners/listen.webp',   tip: 'Listen when others are talking' },
  { slug: 'help',      word: 'Help',      emoji: '🦸', img: 'manners/help.webp',     tip: 'Help others when they need it' },
  { slug: 'greet',     word: 'Hello',     emoji: '👋', img: 'manners/hello.webp',    tip: 'Always greet people nicely' },
];

export const mannersModule = {
  slug: 'manners',
  title: 'Good Manners',
  iconEmoji: '🤝',
  sortOrder: 7,
  color: '#9C27B0',
  bgGradient: 'linear-gradient(135deg, #9C27B0 0%, #CE93D8 100%)',
  games: ['matching', 'quiz'],
  lessons: items.map((item, i) => ({
    slug: item.slug,
    title: item.word,
    word: item.word,
    emoji: item.emoji,
    tip: item.tip,
    sortOrder: i + 1,
    imageFile: item.img,
    audioFile: `manners/${item.slug}.mp3`,
    traceTemplate: null,
    quizOptions: [{ word: item.word, imageFile: item.img, correct: true }],
    matchingPairs: [
      { id: `${item.slug}-img`, type: 'image', content: item.img },
      { id: `${item.slug}-img`, type: 'word',  content: item.word },
    ],
  })),
};
