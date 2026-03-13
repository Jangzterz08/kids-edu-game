export const logicModule = {
  slug: 'logic',
  title: 'Logic & Patterns',
  iconEmoji: '🧩',
  category: 'logic',
  games: ['pattern', 'oddOneOut', 'matching'],
  lessons: [
    // --- Pattern Sequences ---
    {
      slug: 'pattern-shapes',
      word: 'Shape Pattern',
      emoji: '🔁',
      gameType: 'pattern',
      sequence: ['🔴', '🟦', '🔴', '?'],
      options: [
        { emoji: '🟦', correct: true },
        { emoji: '🔴', correct: false },
        { emoji: '⭐', correct: false }
      ]
    },
    {
      slug: 'pattern-animals',
      word: 'Animal Pattern',
      emoji: '🔁',
      gameType: 'pattern',
      sequence: ['🐶', '🐱', '🐱', '🐶', '🐱', '?'],
      options: [
        { emoji: '🐱', correct: true },
        { emoji: '🐶', correct: false },
        { emoji: '🐸', correct: false }
      ]
    },
    {
      slug: 'pattern-fruit',
      word: 'Fruit Pattern',
      emoji: '🔁',
      gameType: 'pattern',
      sequence: ['🍎', '🍌', '🍌', '🍎', '🍌', '?'],
      options: [
        { emoji: '🍌', correct: true },
        { emoji: '🍎', correct: false },
        { emoji: '🍇', correct: false }
      ]
    },

    // --- Odd One Out ---
    {
      slug: 'odd-out-transport',
      word: 'Which is different?',
      emoji: '❓',
      gameType: 'oddOneOut',
      items: [
        { emoji: '🚗', correct: false },
        { emoji: '🚌', correct: false },
        { emoji: '✈️', correct: true }, // Not a road vehicle
        { emoji: '🚕', correct: false }
      ]
    },
    {
      slug: 'odd-out-animals',
      word: 'Which is different?',
      emoji: '❓',
      gameType: 'oddOneOut',
      items: [
        { emoji: '🐶', correct: false },
        { emoji: '🐱', correct: false },
        { emoji: '🍎', correct: true }, // Not an animal
        { emoji: '🐰', correct: false }
      ]
    },
    {
      slug: 'odd-out-colors',
      word: 'Which is different?',
      emoji: '❓',
      gameType: 'oddOneOut',
      items: [
        { emoji: '🔴', correct: false },
        { emoji: '🍎', correct: false },
        { emoji: '🍓', correct: false },
        { emoji: '🍌', correct: true } // Yellow, rest are red
      ]
    },

    // --- Matching Pairs (for matching game) ---
    {
      slug: 'logic-match-1',
      word: 'Match Pairs',
      emoji: '🧩',
      matchingPairs: [
        { id: '1', type: 'image', content: 'puzzle-piece' },
        { id: '1', type: 'image', content: 'puzzle-piece' }
      ]
    },
    {
      slug: 'logic-match-2',
      word: 'Match Shapes',
      emoji: '🟦',
      matchingPairs: [
        { id: '2', type: 'word', content: 'Square' },
        { id: '2', type: 'word', content: 'Square' }
      ]
    }
  ]
};
