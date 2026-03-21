import { useState, useMemo, useEffect } from 'react';
import { speakWord } from '../../lib/sound';

export default function PatternGame({ lessons, onComplete }) {
  // Filter only the pattern lessons
  const patternLessons = useMemo(() => lessons.filter(l => l.gameType === 'pattern'), [lessons]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts]       = useState(0);
  const [mistakes, setMistakes]       = useState(0);
  const [solved, setSolved]           = useState(false);
  const [locked, setLocked]           = useState(false);
  const [wrongIndexes, setWrongIndexes] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => speakWord('What comes next?'), 350);
    return () => clearTimeout(t);
  }, [currentIndex]);

  if (patternLessons.length === 0) {
    return <div>No pattern data available.</div>;
  }

  const currentPattern = patternLessons[currentIndex];

  function handleOptionClick(opt, idx) {
    if (locked || solved) return;
    setAttempts(a => a + 1);

    if (opt.correct) {
      setSolved(true);
      setLocked(true);
      speakWord('Great job!');
      
      setTimeout(() => {
        if (currentIndex < patternLessons.length - 1) {
          setCurrentIndex(i => i + 1);
          setSolved(false);
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
      speakWord('Oops! Try again!');
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.titleRow}>
        <h2 style={styles.title}>What comes next? 🌊</h2>
        <button style={styles.speakerBtn} onClick={() => speakWord('What comes next?')} aria-label="Repeat question">🔊</button>
      </div>
      
      {/* Pattern Display */}
      <div style={styles.patternBox}>
        {currentPattern.sequence.map((item, idx) => {
          const isQuestionMark = item === '?';
          return (
            <div 
              key={idx} 
              style={{
                ...styles.sequenceItem,
                ...(isQuestionMark ? styles.questionMarkBox : {}),
                ...(isQuestionMark && solved ? styles.solvedBox : {})
              }}
            >
              {isQuestionMark && solved 
                ? currentPattern.options.find(o => o.correct).emoji 
                : item}
            </div>
          );
        })}
      </div>

      <div style={styles.prompt}>Choose the missing piece:</div>

      {/* Options */}
      <div style={styles.optionsBox}>
        {currentPattern.options.map((opt, idx) => {
          const isWrong = wrongIndexes.includes(idx);
          const isCorrectAndSolved = solved && opt.correct;
          
          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(opt, idx)}
              disabled={isWrong || locked}
              style={{
                ...styles.optionButton,
                ...(isWrong ? styles.optionWrong : {}),
                ...(isCorrectAndSolved ? styles.optionCorrect : {}),
                animation: isCorrectAndSolved ? 'match-bounce 0.5s ease' : isWrong ? 'shake 0.4s ease' : 'none'
              }}
            >
              {opt.emoji}
            </button>
          );
        })}
      </div>
      
      {/* Progress indicator */}
      <div style={styles.progress}>
        {currentIndex + 1} / {patternLessons.length}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '8px 12px', maxWidth: 640, margin: '0 auto', alignItems: 'center', boxSizing: 'border-box' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flex: '0 0 auto' },
  title: { fontSize: 'var(--font-lg)', fontWeight: 900, textAlign: 'center', margin: 0, color: '#fff', textShadow: '0 2px 10px rgba(0,80,120,0.4)' },
  speakerBtn: { background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.5)', borderRadius: 12, fontSize: 22, cursor: 'pointer', padding: '4px 8px', flexShrink: 0 },

  patternBox: {
    display: 'flex', gap: 12, padding: '16px 20px',
    background: 'var(--glass-bg)', borderRadius: 24,
    border: '2px solid var(--glass-border)',
    boxShadow: 'var(--glass-shadow)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    marginBottom: 16, flex: '0 0 auto',
    flexWrap: 'wrap', justifyContent: 'center'
  },
  sequenceItem: {
    width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 56,
  },
  questionMarkBox: {
    background: 'rgba(59,191,232,0.15)', borderRadius: 20,
    border: '3px dashed rgba(255,255,255,0.7)',
    color: '#0A4A6E', fontSize: 44,
  },
  solvedBox: {
    background: 'var(--btn-green-base)', border: 'none',
    boxShadow: '0 0 20px rgba(16,185,129,0.5)'
  },

  prompt: { fontSize: 'var(--font-base)', fontWeight: 700, color: '#fff', marginBottom: 12, textShadow: '0 1px 6px rgba(0,80,120,0.3)', flex: '0 0 auto' },
  optionsBox: { display: 'flex', gap: 16, justifyContent: 'center', flex: '1 1 0', overflowY: 'auto', minHeight: 0, alignItems: 'flex-start', flexWrap: 'wrap' },
  optionButton: {
    width: 100, height: 100, borderRadius: 28, border: 'none',
    background: 'var(--btn-blue-base)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60,
    boxShadow: '0 6px 0 var(--btn-blue-shade), 0 10px 20px rgba(0,80,120,0.25)',
    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  optionWrong: {
    background: '#aaa', boxShadow: '0 4px 0 #888', transform: 'translateY(2px)', opacity: 0.5, cursor: 'not-allowed'
  },
  optionCorrect: {
    background: 'var(--btn-green-base)', boxShadow: '0 0 24px rgba(16,185,129,0.5)', transform: 'translateY(4px) scale(1.1)'
  },

  progress: {
    marginTop: 12, fontSize: 16, fontWeight: 700, color: '#fff',
    background: 'rgba(255,255,255,0.25)', padding: '6px 16px', borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.4)', flex: '0 0 auto',
  }
};
