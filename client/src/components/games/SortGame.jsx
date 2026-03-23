import { useState, useMemo } from 'react';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SortGame({ lessons, onComplete }) {
  const lesson = lessons[0]; // Sort uses first lesson
  const correctOrder = lesson.items; // items array IS the correct order
  const shuffled = useMemo(() => shuffle([...lesson.items]), []);

  const [order, setOrder] = useState(shuffled);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState(null);

  function handleItemTap(idx) {
    if (checked) return; // no interaction after reveal
    if (selectedIdx === null) {
      // Phase 1: select
      setSelectedIdx(idx);
    } else if (selectedIdx === idx) {
      // Deselect same item
      setSelectedIdx(null);
    } else {
      // Phase 2: swap selected with tapped
      const newOrder = [...order];
      [newOrder[selectedIdx], newOrder[idx]] = [newOrder[idx], newOrder[selectedIdx]];
      setOrder(newOrder);
      setSelectedIdx(null);
    }
  }

  function handleCheck() {
    // Compute results: compare each item in order to correctOrder[i]
    const newResults = order.map((item, i) => item.emoji === correctOrder[i].emoji);
    setResults(newResults);
    setChecked(true);

    const correctCount = newResults.filter(Boolean).length;
    const score = Math.round((correctCount / correctOrder.length) * 100);

    // Show results for ~1.5s, then call onComplete after 700ms delay
    setTimeout(() => onComplete(score), 1500 + 700);
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.prompt}>{lesson.prompt}</h2>
      <div style={styles.itemRow}>
        {order.map((item, i) => (
          <button
            key={item.emoji + i}
            onClick={() => handleItemTap(i)}
            style={{
              ...styles.item,
              ...(selectedIdx === i ? styles.itemSelected : {}),
              ...(checked && results[i] ? styles.itemCorrect : {}),
              ...(checked && !results[i] ? styles.itemWrong : {}),
              animation: checked && results && !results[i] ? 'shake 0.5s ease' : 'none',
            }}
          >
            <span style={{ fontSize: item.renderSize + 'px', lineHeight: 1 }}>{item.emoji}</span>
          </button>
        ))}
      </div>
      {!checked && (
        <button onClick={handleCheck} className="kid-btn" style={styles.checkBtn}>
          Check ✓
        </button>
      )}
      {checked && results && (
        <div style={{ ...styles.resultText, animation: 'slide-up 0.3s ease' }}>
          {results.every(r => r)
            ? <span style={styles.perfect}>Perfect! 🎉</span>
            : <span>{results.filter(r => r).length} / {results.length} correct!</span>
          }
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--space-lg)',
    touchAction: 'none',
  },
  prompt: {
    fontSize: 'var(--font-md)',
    fontWeight: 600,
    textAlign: 'center',
    color: '#fff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    marginBottom: 'var(--space-lg)',
  },
  itemRow: {
    display: 'flex',
    gap: 'var(--space-md)',
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    marginBottom: 'var(--space-lg)',
  },
  item: {
    minWidth: 64,
    minHeight: 64,
    padding: 'var(--space-sm)',
    borderRadius: 'var(--card-radius)',
    border: '2px solid var(--glass-border)',
    background: 'var(--glass-bg)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  itemSelected: {
    borderColor: 'var(--accent-cyan)',
    boxShadow: '0 0 0 3px var(--accent-cyan)',
    transform: 'scale(1.05)',
  },
  itemCorrect: {
    background: 'var(--btn-green-base)',
    borderColor: 'var(--btn-green-base)',
  },
  itemWrong: {
    background: 'var(--accent-red)',
    borderColor: 'var(--accent-red)',
  },
  checkBtn: {
    marginTop: 'var(--space-lg)',
    minWidth: 160,
  },
  resultText: {
    fontSize: 'var(--font-md)',
    fontWeight: 600,
    color: '#fff',
    textAlign: 'center',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  perfect: {
    animation: 'wiggle 0.6s ease',
  },
};
