import { useState, useMemo } from 'react';
import { speakWord } from '../../lib/sound';
import DotGrid from '../ui/DotGrid';

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
    subset.flatMap(l => {
      // Use the pre-calculated matchingPairs if available, else standard image/word.
      if (l.matchingPairs && l.matchingPairs.length === 2) {
        return l.matchingPairs.map(p => ({
          uid: `${p.id}-${p.type}-${Math.random()}`, pairId: l.slug, type: p.type, content: p.content, label: l.word, emoji: l.emoji
        }));
      }
      return [
        { uid: `${l.slug}-img`, pairId: l.slug, type: 'image', content: l.imageFile, label: l.word, emoji: l.emoji },
        { uid: `${l.slug}-word`, pairId: l.slug, type: 'word', content: l.word, label: l.word },
      ];
    })
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

    // Speak the word when a text-only card is revealed so pre-readers can hear it
    if (cards[idx].type === 'word') {
      speakWord(cards[idx].label);
    }

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
    if (card.type === 'dots') {
      return (
        <div style={styles.dotsWrap}>
          <DotGrid count={card.content} />
        </div>
      );
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
  container: { padding: 'var(--space-xl)', maxWidth: 640, margin: '0 auto' },
  title: { fontSize: 'var(--font-lg)', fontWeight: 900, textAlign: 'center', marginBottom: 8, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' },
  sub: { textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 24, fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  card: {
    aspect: '1', height: 120, borderRadius: 24, border: 'none',
    background: 'var(--btn-blue-base)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    boxShadow: '0 8px 0 var(--btn-blue-shade), 0 15px 25px rgba(0, 0, 0, 0.4)',
  },
  cardFlipped: { 
    background: 'var(--glass-bg)', border: '2px solid rgba(255,255,255,0.6)', 
    boxShadow: '0 0 20px rgba(255,255,255,0.2), 0 10px 20px rgba(0,0,0,0.4)', 
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    transform: 'translateY(6px)'
  },
  cardMatched: { 
    background: 'var(--btn-green-base)', border: '2px solid #fff',
    boxShadow: '0 0 30px var(--btn-green-shade)',
    transform: 'translateY(8px)'
  },
  cardBack: { fontSize: 'var(--font-2xl)', color: '#fff', fontWeight: 900, textShadow: '0 4px 8px rgba(0,0,0,0.5)' },
  cardImg: { width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))' },
  cardEmoji: { fontSize: 64, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))' },
  cardWord: { fontSize: 'var(--font-base)', fontWeight: 900, textAlign: 'center', padding: 8, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  dotsWrap: { transform: 'scale(0.6)' },
};
