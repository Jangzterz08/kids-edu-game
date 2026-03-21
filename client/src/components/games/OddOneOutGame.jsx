import { useState, useMemo, useEffect } from 'react';
import { speakWord } from '../../lib/sound';

export default function OddOneOutGame({ lessons, onComplete }) {
  const oddOutLessons = useMemo(() => lessons.filter(l => l.gameType === 'oddOneOut'), [lessons]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts]       = useState(0);
  const [mistakes, setMistakes]       = useState(0);
  const [locked, setLocked]           = useState(false);
  const [wrongIndexes, setWrongIndexes] = useState([]);
  const [solvedIndex, setSolvedIndex] = useState(null);

  const currentLevel = oddOutLessons[currentIndex];

  useEffect(() => {
    const question = currentLevel?.question || 'Which one is different?';
    const t = setTimeout(() => speakWord(question), 350);
    return () => clearTimeout(t);
  }, [currentIndex]);

  if (oddOutLessons.length === 0) {
    return <div>No odd-one-out data available.</div>;
  }

  function handleItemClick(opt, idx) {
    if (locked) return;
    setAttempts(a => a + 1);

    if (opt.correct) {
      setSolvedIndex(idx);
      setLocked(true);
      speakWord('Correct!'); // Or positive chime
      
      setTimeout(() => {
        if (currentIndex < oddOutLessons.length - 1) {
          setCurrentIndex(i => i + 1);
          setSolvedIndex(null);
          setLocked(false);
          setWrongIndexes([]);
        } else {
          // Calculate final score
          const score = Math.max(0, 100 - (mistakes * 10));
          onComplete(score);
        }
      }, 1500);

    } else {
      setMistakes(m => m + 1);
      setWrongIndexes(prev => [...prev, idx]);
      speakWord('Try again');
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.titleRow}>
        <h2 style={styles.title}>{currentLevel.question || 'Which one is different? 🦀'}</h2>
        <button style={styles.speakerBtn} onClick={() => speakWord(currentLevel.question || 'Which one is different?')} aria-label="Repeat question">🔊</button>
      </div>
      
      <div style={styles.grid}>
        {currentLevel.items.map((opt, idx) => {
          const isWrong = wrongIndexes.includes(idx);
          const isCorrect = solvedIndex === idx;
          const isOtherFade = solvedIndex !== null && solvedIndex !== idx;
          
          return (
            <button
              key={idx}
              onClick={() => handleItemClick(opt, idx)}
              disabled={isWrong || locked || isOtherFade}
              style={{
                ...styles.itemCard,
                ...(isWrong ? styles.itemWrong : {}),
                ...(isCorrect ? styles.itemCorrect : {}),
                ...(isOtherFade ? styles.itemFade : {}),
                animation: isCorrect ? 'match-bounce 0.5s ease' : isWrong ? 'shake 0.4s ease' : 'none'
              }}
            >
              {opt.emoji}
            </button>
          );
        })}
      </div>
      
      {/* Progress indicator */}
      <div style={styles.progress}>
        {currentIndex + 1} / {oddOutLessons.length}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '8px 12px', maxWidth: 640, margin: '0 auto', alignItems: 'center', boxSizing: 'border-box' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flex: '0 0 auto' },
  title: { fontSize: 'var(--font-lg)', fontWeight: 900, textAlign: 'center', margin: 0, color: '#fff', textShadow: '0 2px 10px rgba(0,80,120,0.4)' },
  speakerBtn: { background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.5)', borderRadius: 12, fontSize: 22, cursor: 'pointer', padding: '4px 8px', flexShrink: 0 },

  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16,
    padding: '16px',
    background: 'var(--glass-bg)', borderRadius: 32,
    border: '2px solid var(--glass-border)',
    boxShadow: 'var(--glass-shadow)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    marginBottom: 16, flex: '1 1 0', overflowY: 'auto', minHeight: 0,
    alignContent: 'start', width: '100%',
  },

  itemCard: {
    width: '100%', maxWidth: 130, height: 130, borderRadius: 28, border: 'none',
    background: 'var(--btn-blue-base)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72,
    boxShadow: '0 8px 0 var(--btn-blue-shade), 0 10px 20px rgba(0,80,120,0.25)',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  itemWrong: {
    background: '#aaa', boxShadow: '0 4px 0 #888', transform: 'translateY(4px)', opacity: 0.5, cursor: 'not-allowed'
  },
  itemCorrect: {
    background: 'var(--btn-green-base)', boxShadow: '0 0 32px rgba(16,185,129,0.5)', transform: 'scale(1.15) translateY(-8px)',
    zIndex: 10
  },
  itemFade: {
    opacity: 0.3, transform: 'scale(0.9)'
  },

  progress: {
    marginTop: 8, fontSize: 16, fontWeight: 700, color: '#fff',
    background: 'rgba(255,255,255,0.25)', padding: '6px 16px', borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.4)', flex: '0 0 auto',
  }
};
