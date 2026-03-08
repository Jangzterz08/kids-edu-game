import { useState, useMemo } from 'react';
import { speakWord } from '../../lib/sound';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchingGame({ lessons, onComplete }) {
  // Use first 6 lessons for matching (12 cards total)
  const subset = lessons.slice(0, 6);

  const cards = useMemo(() => shuffle(
    subset.flatMap(l => [
      { uid: `${l.slug}-img`, pairId: l.slug, type: 'image', content: l.imageFile, label: l.word, emoji: l.emoji },
      { uid: `${l.slug}-word`, pairId: l.slug, type: 'word', content: l.word, label: l.word },
    ])
  ), []);

  const [flipped, setFlipped]         = useState([]);  // indices
  const [matched, setMatched]         = useState([]);  // pairIds
  const [justMatched, setJustMatched] = useState(null); // pairId briefly set on match
  const [attempts, setAttempts]       = useState(0);
  const [locked, setLocked]           = useState(false);
  const [imgErrors, setImgErrors]     = useState({});

  function handleFlip(idx) {
    if (locked) return;
    if (flipped.includes(idx)) return;
    if (matched.includes(cards[idx].pairId)) return;

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setLocked(true);
      setAttempts(a => a + 1);
      const [a, b] = newFlipped.map(i => cards[i]);
      if (a.pairId === b.pairId) {
        speakWord(a.label);
        const newMatched = [...matched, a.pairId];
        setMatched(newMatched);
        setJustMatched(a.pairId);
        setTimeout(() => setJustMatched(null), 600);
        setFlipped([]);
        setLocked(false);
        if (newMatched.length === subset.length) {
          const extra = Math.max(0, attempts + 1 - subset.length);
          const score = Math.max(0, 100 - extra * 8);
          setTimeout(() => onComplete(score), 700);
        }
      } else {
        setTimeout(() => { setFlipped([]); setLocked(false); }, 900);
      }
    }
  }

  function isFlipped(idx) { return flipped.includes(idx) || matched.includes(cards[idx].pairId); }
  function isMatched(idx) { return matched.includes(cards[idx].pairId); }
  function isJustMatched(idx) { return justMatched && cards[idx].pairId === justMatched; }

  function renderCardContent(card) {
    if (card.type === 'word') {
      return <span style={styles.cardWord}>{card.content}</span>;
    }
    // image card
    if (!imgErrors[card.uid] && card.content) {
      return (
        <img
          src={`/assets/images/${card.content}`}
          alt={card.label}
          style={styles.cardImg}
          onError={() => setImgErrors(prev => ({ ...prev, [card.uid]: true }))}
        />
      );
    }
    // fallback: emoji or first letter
    return <span style={styles.cardEmoji}>{card.emoji || card.label[0]}</span>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Match the pairs! 🃏</h2>
      <p style={styles.sub}>Attempts: {attempts}</p>
      <div style={styles.grid}>
        {cards.map((card, i) => (
          <button
            key={card.uid}
            onClick={() => handleFlip(i)}
            style={{
              ...styles.card,
              ...(isFlipped(i) ? styles.cardFlipped : {}),
              ...(isMatched(i) ? styles.cardMatched : {}),
              animation: isJustMatched(i) ? 'match-bounce 0.55s ease' : 'none',
            }}
          >
            {isFlipped(i) ? renderCardContent(card) : <span style={styles.cardBack}>?</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 'var(--space-xl)', maxWidth: 560, margin: '0 auto' },
  title: { fontSize: 'var(--font-lg)', fontWeight: 900, textAlign: 'center', marginBottom: 8 },
  sub: { textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 24, fontWeight: 700 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  card: {
    aspect: '1', height: 110, borderRadius: 18, border: 'none',
    background: 'var(--accent-blue)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.2s, background 0.2s',
    boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
  },
  cardFlipped: { background: 'var(--bg-surface)', border: '3px solid var(--accent-blue)' },
  cardMatched: { background: '#E8F5E9', border: '3px solid var(--success)' },
  cardBack: { fontSize: 'var(--font-xl)', color: '#fff', fontWeight: 900 },
  cardImg: { width: 64, height: 64, objectFit: 'contain' },
  cardEmoji: { fontSize: 44 },
  cardWord: { fontSize: 'var(--font-sm)', fontWeight: 900, textAlign: 'center', padding: 4 },
};
