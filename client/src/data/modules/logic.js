export const logicModule = {
  slug: 'logic',
  title: 'Logic & Patterns',
  iconEmoji: '🧩',
  color: '#8B5CF6',
  bgGradient: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
  category: 'logic',
  ageFiltered: true,
  games: ['matching', 'pattern', 'oddOneOut', 'trueFalse', 'sort', 'memoryMatch'],
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

    // ─── TrueFalse — ages 4-6 ───
    {
      slug: 'tf-red-apple-46',
      word: 'Red Apple',
      emoji: '🍎',
      gameType: 'trueFalse',
      ageGroup: '4-6',
      claim: 'Is this red?',
      claimEmoji: '🍎',
      correct: true,
    },
    {
      slug: 'tf-cat-animal-46',
      word: 'Cat Animal',
      emoji: '🐱',
      gameType: 'trueFalse',
      ageGroup: '4-6',
      claim: 'Is this an animal?',
      claimEmoji: '🐱',
      correct: true,
    },
    {
      slug: 'tf-fish-fly-46',
      word: 'Fish Fly',
      emoji: '🐟',
      gameType: 'trueFalse',
      ageGroup: '4-6',
      claim: 'Can this fly?',
      claimEmoji: '🐟',
      correct: false,
    },

    // ─── TrueFalse — ages 6-8 ───
    {
      slug: 'tf-sun-star-68',
      word: 'Sun Star',
      emoji: '☀️',
      gameType: 'trueFalse',
      ageGroup: '6-8',
      claim: 'The sun is a star',
      correct: true,
    },
    {
      slug: 'tf-fish-fly-68',
      word: 'Fish Fly',
      emoji: '🐟',
      gameType: 'trueFalse',
      ageGroup: '6-8',
      claim: 'Fish can fly',
      correct: false,
    },
    {
      slug: 'tf-earth-round-68',
      word: 'Earth Round',
      emoji: '🌍',
      gameType: 'trueFalse',
      ageGroup: '6-8',
      claim: 'The Earth is round',
      correct: true,
    },

    // ─── Sort — ages 4-6 (3 items each) ───
    {
      slug: 'sort-size-animals-46',
      word: 'Animal Size',
      emoji: '🐘',
      gameType: 'sort',
      ageGroup: '4-6',
      prompt: 'Smallest to biggest!',
      items: [
        { emoji: '🐜', label: 'Ant', renderSize: 24 },
        { emoji: '🐱', label: 'Cat', renderSize: 48 },
        { emoji: '🐘', label: 'Elephant', renderSize: 80 },
      ],
    },
    {
      slug: 'sort-size-fruits-46',
      word: 'Fruit Size',
      emoji: '🍉',
      gameType: 'sort',
      ageGroup: '4-6',
      prompt: 'Smallest to biggest!',
      items: [
        { emoji: '🫐', label: 'Blueberry', renderSize: 20 },
        { emoji: '🍎', label: 'Apple', renderSize: 44 },
        { emoji: '🍉', label: 'Watermelon', renderSize: 72 },
      ],
    },
    {
      slug: 'sort-size-balls-46',
      word: 'Ball Size',
      emoji: '⚽',
      gameType: 'sort',
      ageGroup: '4-6',
      prompt: 'Smallest to biggest!',
      items: [
        { emoji: '🏓', label: 'Ping Pong', renderSize: 22 },
        { emoji: '⚽', label: 'Soccer', renderSize: 48 },
        { emoji: '🏀', label: 'Basketball', renderSize: 68 },
      ],
    },

    // ─── Sort — ages 6-8 (4-5 items each) ───
    {
      slug: 'sort-size-transport-68',
      word: 'Transport Size',
      emoji: '🚂',
      gameType: 'sort',
      ageGroup: '6-8',
      prompt: 'Smallest to biggest!',
      items: [
        { emoji: '🛴', label: 'Scooter', renderSize: 24 },
        { emoji: '🚗', label: 'Car', renderSize: 40 },
        { emoji: '🚌', label: 'Bus', renderSize: 56 },
        { emoji: '🚂', label: 'Train', renderSize: 72 },
      ],
    },
    {
      slug: 'sort-size-buildings-68',
      word: 'Building Size',
      emoji: '🏰',
      gameType: 'sort',
      ageGroup: '6-8',
      prompt: 'Smallest to biggest!',
      items: [
        { emoji: '🏠', label: 'House', renderSize: 28 },
        { emoji: '🏢', label: 'Office', renderSize: 44 },
        { emoji: '🏰', label: 'Castle', renderSize: 60 },
        { emoji: '🗼', label: 'Tower', renderSize: 76 },
      ],
    },
    {
      slug: 'sort-size-space-68',
      word: 'Space Size',
      emoji: '🪐',
      gameType: 'sort',
      ageGroup: '6-8',
      prompt: 'Smallest to biggest!',
      items: [
        { emoji: '🌑', label: 'Moon', renderSize: 20 },
        { emoji: '🌍', label: 'Earth', renderSize: 36 },
        { emoji: '🪐', label: 'Saturn', renderSize: 52 },
        { emoji: '☀️', label: 'Sun', renderSize: 68 },
        { emoji: '⭐', label: 'Big Star', renderSize: 80 },
      ],
    },

    // ─── MemoryMatch (no age group needed) ───
    {
      slug: 'memory-animals-1',
      word: 'Animals',
      emoji: '🐶',
      gameType: 'memoryMatch',
      pairs: [
        ['🐶', '🐶'], ['🐱', '🐱'], ['🐰', '🐰'],
        ['🐻', '🐻'], ['🦊', '🦊'], ['🐸', '🐸'],
      ],
    },
    {
      slug: 'memory-food-1',
      word: 'Food',
      emoji: '🍕',
      gameType: 'memoryMatch',
      pairs: [
        ['🍕', '🍕'], ['🍔', '🍔'], ['🌮', '🌮'],
        ['🍩', '🍩'], ['🍦', '🍦'], ['🧁', '🧁'],
      ],
    },
    {
      slug: 'memory-nature-1',
      word: 'Nature',
      emoji: '🌺',
      gameType: 'memoryMatch',
      pairs: [
        ['🌺', '🌺'], ['🌻', '🌻'], ['🍀', '🍀'],
        ['🌈', '🌈'], ['🦋', '🦋'], ['🐝', '🐝'],
      ],
    },
    {
      slug: 'memory-vehicles-1',
      word: 'Vehicles',
      emoji: '🚗',
      gameType: 'memoryMatch',
      pairs: [
        ['🚗', '🚗'], ['🚌', '🚌'], ['🚂', '🚂'],
        ['✈️', '✈️'], ['🚀', '🚀'], ['🛳️', '🛳️'],
      ],
    },
    {
      slug: 'memory-sports-1',
      word: 'Sports',
      emoji: '⚽',
      gameType: 'memoryMatch',
      pairs: [
        ['⚽', '⚽'], ['🏀', '🏀'], ['🎾', '🎾'],
        ['🏈', '🏈'], ['⚾', '⚾'], ['🏐', '🏐'],
      ],
    },
    {
      slug: 'memory-weather-1',
      word: 'Weather',
      emoji: '🌧️',
      gameType: 'memoryMatch',
      pairs: [
        ['☀️', '☀️'], ['🌧️', '🌧️'], ['⛈️', '⛈️'],
        ['🌈', '🌈'], ['❄️', '❄️'], ['🌪️', '🌪️'],
      ],
    },
  ],
};
