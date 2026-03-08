const items = [
  { slug: 'head',   word: 'Head',   emoji: '🙂', img: 'body/head.webp' },
  { slug: 'eyes',   word: 'Eyes',   emoji: '👀', img: 'body/eyes.webp' },
  { slug: 'ears',   word: 'Ears',   emoji: '👂', img: 'body/ears.webp' },
  { slug: 'nose',   word: 'Nose',   emoji: '👃', img: 'body/nose.webp' },
  { slug: 'mouth',  word: 'Mouth',  emoji: '👄', img: 'body/mouth.webp' },
  { slug: 'hands',  word: 'Hands',  emoji: '🙌', img: 'body/hands.webp' },
  { slug: 'feet',   word: 'Feet',   emoji: '🦶', img: 'body/feet.webp' },
  { slug: 'belly',  word: 'Belly',  emoji: '🫃', img: 'body/belly.webp' },
];

export const bodyPartsModule = {
  slug: 'body-parts',
  title: 'Body Parts',
  iconEmoji: '🫀',
  sortOrder: 6,
  color: '#26C6DA',
  bgGradient: 'linear-gradient(135deg, #26C6DA 0%, #80DEEA 100%)',
  games: ['matching', 'quiz'],
  lessons: items.map((item, i) => ({
    slug: item.slug,
    title: item.word,
    word: item.word,
    emoji: item.emoji,
    sortOrder: i + 1,
    imageFile: item.img,
    audioFile: `body/${item.slug}.mp3`,
    traceTemplate: null,
    quizOptions: [{ word: item.word, imageFile: item.img, correct: true }],
    matchingPairs: [
      { id: `${item.slug}-img`, type: 'image', content: item.img },
      { id: `${item.slug}-img`, type: 'word',  content: item.word },
    ],
  })),
};
