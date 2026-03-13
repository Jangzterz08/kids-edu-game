import { useState, useMemo } from 'react';
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
      speakWord('Correct!'); // Or a specific positive chime
      
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
      speakWord('Try again');
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>What comes next? 🤔</h2>
      
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
  container: { padding: 'var(--space-xl)', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  title: { fontSize: 'var(--font-lg)', fontWeight: 900, textAlign: 'center', marginBottom: 32, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' },
  
  patternBox: {
    display: 'flex', gap: 16, padding: '24px 32px',
    background: 'var(--glass-bg)', borderRadius: 24,
    border: '2px solid rgba(255,255,255,0.4)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    marginBottom: 40,
    flexWrap: 'wrap', justifyContent: 'center'
  },
  sequenceItem: {
    width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 48, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))'
  },
  questionMarkBox: {
    background: 'rgba(0,0,0,0.2)', borderRadius: 16,
    border: '3px dashed rgba(255,255,255,0.5)',
    color: 'rgba(255,255,255,0.8)', fontSize: 40
  },
  solvedBox: {
    background: 'var(--btn-green-base)', border: 'none',
    boxShadow: '0 0 20px var(--btn-green-shade)'
  },
  
  prompt: { fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 16, textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  optionsBox: { display: 'flex', gap: 20, justifyContent: 'center' },
  optionButton: {
    width: 80, height: 80, borderRadius: 24, border: 'none',
    background: 'var(--btn-blue-base)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48,
    boxShadow: '0 6px 0 var(--btn-blue-shade), 0 10px 20px rgba(0, 0, 0, 0.4)',
    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  optionWrong: { 
    background: '#888', boxShadow: '0 4px 0 #555', transform: 'translateY(2px)', opacity: 0.5, cursor: 'not-allowed'
  },
  optionCorrect: {
    background: 'var(--btn-green-base)', boxShadow: '0 0 30px var(--btn-green-shade)', transform: 'translateY(4px) scale(1.1)'
  },
  
  progress: {
    marginTop: 40, fontSize: 16, fontWeight: 800, color: 'var(--text-muted)',
    background: 'rgba(0,0,0,0.2)', padding: '6px 16px', borderRadius: 20
  }
};
