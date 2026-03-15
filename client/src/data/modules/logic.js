export const logicModule = {
  slug: 'logic',
  title: 'Logic & Patterns',
  iconEmoji: '🧩',
  color: '#8B5CF6',
  bgGradient: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
  category: 'logic',
  games: ['matching', 'pattern', 'oddOneOut'],
  lessons: [

    // ─── 6 familiar concept lessons (MatchingGame uses first 6) ───
    // Simple, familiar objects every 3-4 year old knows
    {
      slug: 'logic-sun',
      word: 'Sun',
      emoji: '☀️',
      imageFile: null,
    },
    {
      slug: 'logic-moon',
      word: 'Moon',
      emoji: '🌙',
      imageFile: null,
    },
    {
      slug: 'logic-star',
      word: 'Star',
      emoji: '⭐',
      imageFile: null,
    },
    {
      slug: 'logic-heart',
      word: 'Heart',
      emoji: '❤️',
      imageFile: null,
    },
    {
      slug: 'logic-flower',
      word: 'Flower',
      emoji: '🌸',
      imageFile: null,
    },
    {
      slug: 'logic-apple',
      word: 'Apple',
      emoji: '🍎',
      imageFile: null,
    },

    // ─── Simple AB Patterns ───
    // Short (3 items + ?) — only 2 things repeating, very predictable
    {
      slug: 'pattern-sun-moon',
      word: 'Sun & Moon',
      emoji: '☀️',
      gameType: 'pattern',
      sequence: ['☀️', '🌙', '☀️', '?'],
      options: [
        { emoji: '🌙', correct: true  },
        { emoji: '☀️', correct: false },
        { emoji: '⭐', correct: false },
      ],
    },
    {
      slug: 'pattern-cat-dog',
      word: 'Cat & Dog',
      emoji: '🐱',
      gameType: 'pattern',
      sequence: ['🐱', '🐶', '🐱', '?'],
      options: [
        { emoji: '🐶', correct: true  },
        { emoji: '🐱', correct: false },
        { emoji: '🐸', correct: false },
      ],
    },
    {
      slug: 'pattern-apple-banana',
      word: 'Apple & Banana',
      emoji: '🍌',
      gameType: 'pattern',
      sequence: ['🍎', '🍌', '🍎', '?'],
      options: [
        { emoji: '🍌', correct: true  },
        { emoji: '🍎', correct: false },
        { emoji: '🍇', correct: false },
      ],
    },
    {
      slug: 'pattern-red-blue',
      word: 'Red & Blue',
      emoji: '🔵',
      gameType: 'pattern',
      sequence: ['🔴', '🔵', '🔴', '?'],
      options: [
        { emoji: '🔵', correct: true  },
        { emoji: '🔴', correct: false },
        { emoji: '🟡', correct: false },
      ],
    },

    // ─── Odd One Out — visual, no reading/reasoning needed ───
    // "Which one is different?" — purely by looking
    {
      slug: 'odd-out-not-animal',
      word: 'Not an Animal',
      emoji: '🚗',
      gameType: 'oddOneOut',
      question: 'Which one is NOT an animal? 🐾',
      items: [
        { emoji: '🐶', correct: false },
        { emoji: '🐱', correct: false },
        { emoji: '🚗', correct: true  },  // car — not an animal
        { emoji: '🐰', correct: false },
      ],
    },
    {
      slug: 'odd-out-color',
      word: 'Different Color',
      emoji: '🟡',
      gameType: 'oddOneOut',
      question: 'Which one is a different color? 🎨',
      items: [
        { emoji: '🔴', correct: false },
        { emoji: '🔴', correct: false },
        { emoji: '🟡', correct: true  },  // yellow — different
        { emoji: '🔴', correct: false },
      ],
    },
    {
      slug: 'odd-out-not-fruit',
      word: 'Not a Fruit',
      emoji: '🚌',
      gameType: 'oddOneOut',
      question: 'Which one is NOT a fruit? 🍓',
      items: [
        { emoji: '🍎', correct: false },
        { emoji: '🍌', correct: false },
        { emoji: '🍇', correct: false },
        { emoji: '🚌', correct: true  },  // bus — not a fruit
      ],
    },
    {
      slug: 'odd-out-not-same',
      word: 'Different Shape',
      emoji: '⭐',
      gameType: 'oddOneOut',
      question: 'Which one is different? 👀',
      items: [
        { emoji: '🐱', correct: false },
        { emoji: '🐱', correct: false },
        { emoji: '⭐', correct: true  },  // star — totally different
        { emoji: '🐱', correct: false },
      ],
    },
  ],
};
