import { useState, useEffect } from 'react';
import { speakWord } from '../../lib/sound';

export default function TrueFalseGame({ lessons, onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(null); // null | 'correct' | 'wrong'
  const [disabled, setDisabled] = useState(false);
  const [scores, setScores] = useState([]);

  const lesson = lessons?.[currentIdx];

  // Auto-speak the claim when lesson changes
  useEffect(() => {
    if (lesson?.claim) speakWord(lesson.claim);
  }, [currentIdx]);

  if (!lessons || lessons.length === 0) {
    return (
      <div style={styles.container}>
        <p style={styles.emptyText}>
          No activities yet for your age group. More coming soon! 🌊
        </p>
      </div>
    );
  }

  function handleAnswer(userChoice) {
    if (disabled) return;
    setDisabled(true);

    const isCorrect = userChoice === lesson.correct;
    const score = isCorrect ? 100 : 0;
    const newAnswered = isCorrect ? 'correct' : 'wrong';
    setAnswered(newAnswered);

    const allScores = [...scores, score];

    setTimeout(() => {
      const nextIdx = currentIdx + 1;
      if (nextIdx < lessons.length) {
        setScores(allScores);
        setCurrentIdx(nextIdx);
        setAnswered(null);
        setDisabled(false);
      } else {
        const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
        setTimeout(() => onComplete(avgScore), 700);
      }
    }, 1500);
  }

  // Determine button styles based on feedback state
  function getTrueStyle() {
    if (!answered) return styles.btn;
    if (answered === 'correct' && lesson.correct === true) {
      return { ...styles.btn, ...styles.btnCorrect, animation: 'pop-correct 0.55s ease' };
    }
    if (answered === 'wrong' && lesson.correct === true) {
      // Correct answer was True — highlight it green
      return { ...styles.btn, ...styles.btnCorrect };
    }
    if (answered === 'wrong' && lesson.correct === false) {
      // User tapped True but correct was False — shake red
      return { ...styles.btn, ...styles.btnWrong, animation: 'shake 0.5s ease' };
    }
    return styles.btn;
  }

  function getFalseStyle() {
    if (!answered) return styles.btn;
    if (answered === 'correct' && lesson.correct === false) {
      return { ...styles.btn, ...styles.btnCorrect, animation: 'pop-correct 0.55s ease' };
    }
    if (answered === 'wrong' && lesson.correct === false) {
      // Correct answer was False — highlight it green
      return { ...styles.btn, ...styles.btnCorrect };
    }
    if (answered === 'wrong' && lesson.correct === true) {
      // User tapped False but correct was True — shake red
      return { ...styles.btn, ...styles.btnWrong, animation: 'shake 0.5s ease' };
    }
    return styles.btn;
  }

  const btnPointerEvents = disabled ? 'none' : 'auto';

  return (
    <div style={styles.container}>
      {/* Claim area */}
      {lesson.claimEmoji ? (
        <div style={styles.claimEmoji}>{lesson.claimEmoji}</div>
      ) : (
        <div style={styles.claimText}>{lesson.claim}</div>
      )}

      {/* Replay button */}
      <button
        onClick={() => speakWord(lesson.claim)}
        aria-label="Replay"
        style={styles.replayBtn}
      >
        🔊
      </button>

      {/* True button */}
      <button
        onClick={() => handleAnswer(true)}
        style={{ ...getTrueStyle(), pointerEvents: btnPointerEvents }}
      >
        True ✓
      </button>

      {/* False button */}
      <button
        onClick={() => handleAnswer(false)}
        style={{ ...getFalseStyle(), pointerEvents: btnPointerEvents }}
      >
        False ✗
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--space-lg)',
    maxWidth: 360,
    margin: '0 auto',
    gap: 'var(--space-md)',
  },
  claimEmoji: {
    fontSize: '64px',
    textAlign: 'center',
    filter: 'drop-shadow(0 4px 8px rgba(0,80,120,0.2))',
    marginBottom: 'var(--space-md)',
  },
  claimText: {
    fontSize: 'var(--font-md)',
    fontWeight: 600,
    textAlign: 'center',
    color: '#fff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    marginBottom: 'var(--space-md)',
  },
  replayBtn: {
    background: 'var(--glass-bg)',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '50%',
    width: 48,
    height: 48,
    cursor: 'pointer',
    fontSize: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    width: '100%',
    minHeight: 'var(--btn-height)',
    borderRadius: 'var(--btn-radius)',
    border: 'none',
    fontSize: 'var(--font-md)',
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    background: 'var(--btn-blue-base)',
    boxShadow: '0 8px 0 var(--btn-blue-shade)',
    transition: 'all 0.2s ease',
  },
  btnCorrect: {
    background: 'var(--btn-green-base)',
    boxShadow: '0 0 24px rgba(16,185,129,0.5)',
  },
  btnWrong: {
    background: 'var(--accent-red)',
    boxShadow: '0 0 24px rgba(239,68,68,0.5)',
  },
  emptyText: {
    fontSize: 'var(--font-md)',
    fontWeight: 600,
    textAlign: 'center',
    color: '#fff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
};
