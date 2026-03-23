import { useState, useMemo } from 'react';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryMatchGame({ lessons, onComplete }) {
  const lesson = lessons[0]; // MemoryMatch uses first lesson's pairs

  const cards = useMemo(() => {
    if (!lesson?.pairs) return [];
    return shuffle(
      lesson.pairs.flatMap((pair, i) => [
        { id: `${i}-a`, pairId: i, emoji: pair[0] },
        { id: `${i}-b`, pairId: i, emoji: pair[1] },
      ])
    );
  }, []);

  const [flipped, setFlipped]         = useState([]);   // indices of currently face-up cards
  const [matched, setMatched]         = useState([]);   // pairIds of matched pairs
  const [justMatched, setJustMatched] = useState(null); // pairId briefly set for bounce animation
  const [attempts, setAttempts]       = useState(0);
  const [locked, setLocked]           = useState(false); // blocks taps during 900ms mismatch window

  function handleFlip(idx) {
    if (locked) return;
    if (flipped.includes(idx)) return;
    if (matched.includes(cards[idx].pairId)) return;

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setLocked(true);
      setAttempts(a => a + 1);

      const cardA = cards[newFlipped[0]];
      const cardB = cards[newFlipped[1]];

      if (cardA.pairId === cardB.pairId) {
        // Match!
        const newMatched = [...matched, cardA.pairId];
        setMatched(newMatched);
        setJustMatched(cardA.pairId);
        setTimeout(() => setJustMatched(null), 600);
        setFlipped([]);
        setLocked(false);

        if (newMatched.length === (lesson?.pairs?.length ?? 6)) {
          const extra = Math.max(0, attempts + 1 - (lesson?.pairs?.length ?? 6));
          const score = Math.max(0, 100 - extra * 8);
          setTimeout(() => onComplete(score), 700);
        }
      } else {
        // Mismatch — flip back after 900ms
        setTimeout(() => { setFlipped([]); setLocked(false); }, 900);
      }
    }
  }

  function isFlipped(idx) {
    return flipped.includes(idx) || matched.includes(cards[idx].pairId);
  }
  function isMatched(idx) {
    return matched.includes(cards[idx].pairId);
  }
  function isJustMatched(idx) {
    return justMatched !== null && cards[idx].pairId === justMatched;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Match the pairs! 🧠</h2>
      <p style={styles.sub}>Attempts: {attempts}</p>
      <div style={styles.grid}>
        {cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => handleFlip(i)}
            style={styles.cardOuter}
            aria-label={isFlipped(i) ? card.emoji : 'Hidden card'}
          >
            <div
              style={{
                ...styles.cardInner,
                transform: isFlipped(i) ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front face (card back — shows "?" when not flipped) */}
              <div
                style={{
                  ...styles.cardFace,
                  ...styles.cardFront,
                  ...(isMatched(i) ? styles.cardMatched : {}),
                  animation: isJustMatched(i) ? 'match-bounce 0.55s ease' : 'none',
                }}
              >
                {isMatched(i)
                  ? <span style={styles.cardEmoji}>{card.emoji}</span>
                  : <span style={styles.cardQuestion}>?</span>
                }
              </div>
              {/* Back face (emoji — revealed on flip) */}
              <div
                style={{
                  ...styles.cardFace,
                  ...styles.cardBack,
                  ...(isMatched(i) ? styles.cardMatched : {}),
                }}
              >
                <span style={styles.cardEmoji}>{card.emoji}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 12px',
    maxWidth: 640,
    margin: '0 auto',
  },
  title: {
    fontSize: 'var(--font-lg)',
    fontWeight: 900,
    textAlign: 'center',
    marginBottom: 4,
    color: '#fff',
    textShadow: '0 2px 10px rgba(0,80,120,0.4)',
  },
  sub: {
    textAlign: 'center',
    color: '#fff',
    marginBottom: 8,
    fontWeight: 700,
    textShadow: '0 1px 6px rgba(0,80,120,0.3)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--space-sm)',
    maxWidth: 320,
    width: '100%',
  },
  cardOuter: {
    perspective: 600,
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    aspectRatio: '1',
  },
  cardInner: {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.4s ease',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: 'var(--card-radius)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFront: {
    background: 'var(--btn-blue-base)',
    boxShadow: '0 8px 0 var(--btn-blue-shade)',
  },
  cardBack: {
    background: 'var(--glass-bg)',
    border: '2px solid rgba(255,255,255,0.7)',
    transform: 'rotateY(180deg)',
  },
  cardMatched: {
    background: 'var(--btn-green-base)',
    border: '2px solid #fff',
    boxShadow: '0 0 24px rgba(16,185,129,0.5)',
  },
  cardQuestion: {
    fontSize: 28,
    fontWeight: 600,
    color: '#fff',
  },
  cardEmoji: {
    fontSize: 36,
    filter: 'drop-shadow(0 4px 8px rgba(0,80,120,0.2))',
  },
};
