import { useState, useMemo } from 'react';
import { speakWord } from '../../lib/sound';

export default function OddOneOutGame({ lessons, onComplete }) {
  const oddOutLessons = useMemo(() => lessons.filter(l => l.gameType === 'oddOneOut'), [lessons]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts]       = useState(0);
  const [mistakes, setMistakes]       = useState(0);
  const [locked, setLocked]           = useState(false);
  const [wrongIndexes, setWrongIndexes] = useState([]);
  const [solvedIndex, setSolvedIndex] = useState(null);

  if (oddOutLessons.length === 0) {
    return <div>No odd-one-out data available.</div>;
  }

  const currentLevel = oddOutLessons[currentIndex];

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
      <h2 style={styles.title}>Which one is different? 🕵️‍♂️</h2>
      
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
  container: { padding: 'var(--space-xl)', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  title: { fontSize: 'var(--font-lg)', fontWeight: 900, textAlign: 'center', marginBottom: 40, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' },
  
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24,
    padding: '32px',
    background: 'var(--glass-bg)', borderRadius: 32,
    border: '2px solid rgba(255,255,255,0.4)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    marginBottom: 40
  },
  
  itemCard: {
    width: 120, height: 120, borderRadius: 24, border: 'none',
    background: 'var(--btn-blue-base)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64,
    boxShadow: '0 8px 0 var(--btn-blue-shade), 0 10px 20px rgba(0, 0, 0, 0.4)',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  itemWrong: { 
    background: '#888', boxShadow: '0 4px 0 #555', transform: 'translateY(4px)', opacity: 0.5, cursor: 'not-allowed'
  },
  itemCorrect: {
    background: 'var(--btn-green-base)', boxShadow: '0 0 40px var(--btn-green-shade)', transform: 'scale(1.15) translateY(-8px)',
    zIndex: 10
  },
  itemFade: {
    opacity: 0.3, transform: 'scale(0.9)'
  },
  
  progress: {
    marginTop: 20, fontSize: 16, fontWeight: 800, color: 'var(--text-muted)',
    background: 'rgba(0,0,0,0.2)', padding: '6px 16px', borderRadius: 20
  }
};
