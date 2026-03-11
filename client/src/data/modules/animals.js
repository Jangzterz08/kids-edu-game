const items = [
  { slug: 'dog',      word: 'Dog',      emoji: '🐶', img: 'animals/dog.webp',      sound: '🐕 Woof!' },
  { slug: 'cat',      word: 'Cat',      emoji: '🐱', img: 'animals/cat.webp',      sound: '🐈 Meow!' },
  { slug: 'cow',      word: 'Cow',      emoji: '🐮', img: 'animals/cow.webp',      sound: '🐄 Moo!' },
  { slug: 'elephant', word: 'Elephant', emoji: '🐘', img: 'animals/elephant.webp', sound: '🐘 Trumpet!' },
  { slug: 'lion',     word: 'Lion',     emoji: '🦁', img: 'animals/lion.webp',     sound: '🦁 Roar!' },
  { slug: 'monkey',   word: 'Monkey',   emoji: '🐵', img: 'animals/monkey.webp',   sound: '🐒 Ooh!' },
  { slug: 'rabbit',   word: 'Rabbit',   emoji: '🐰', img: 'animals/rabbit.webp',   sound: '🐇 Squeak!' },
  { slug: 'duck',     word: 'Duck',     emoji: '🦆', img: 'animals/duck.webp',     sound: '🦆 Quack!' },
  { slug: 'fish',     word: 'Fish',     emoji: '🐟', img: 'animals/fish.webp',     sound: '🐟 Splash!' },
  { slug: 'bird',     word: 'Bird',     emoji: '🐦', img: 'animals/bird.webp',     sound: '🐦 Tweet!' },
];

export const animalsModule = {
  slug: 'animals',
  title: 'Animals',
  iconEmoji: '🐾',
  sortOrder: 5,
  color: '#4CAF50',
  bgGradient: 'linear-gradient(135deg, #4CAF50 0%, #A8E6CF 100%)',
  games: ['matching', 'quiz', 'spelling', 'phonics'],
  lessons: items.map((item, i) => ({
    slug: item.slug,
    title: item.word,
    word: item.word,
    emoji: item.emoji,
    animalSound: item.sound,
    sortOrder: i + 1,
    imageFile: item.img,
    audioFile: `animals/${item.slug}.mp3`,
    traceTemplate: null,
    quizOptions: [{ word: item.word, imageFile: item.img, correct: true }],
    matchingPairs: [
      { id: `${item.slug}-img`,   type: 'image', content: item.img },
      { id: `${item.slug}-img`,   type: 'word',  content: item.word },
    ],
  })),
};
