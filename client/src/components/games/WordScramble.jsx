import { useState, useEffect, useRef } from 'react';
import { speakWord } from '../../lib/sound';

const TILE_COLORS = ['#FF6B9D', '#54A0FF', '#5F27CD', '#10AC84', '#FF9F43', '#EE5A24', '#26C6DA', '#A29BFE'];

function shuffleLetters(word) {
  const upper = word.toUpperCase();
  const tiles = upper.split('').map((letter, i) => ({ id: i, letter }));
  // Fisher-Yates shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  // If same order as original, shuffle again (especially for 3-letter words)
  const same = tiles.every((t, i) => t.letter === upper[i]);
  if (same && tiles.length > 2) return shuffleLetters(word);
  return tiles;
}

function pickRounds(lessons) {
  const eligible = lessons.filter(l => l.word && l.word.length >= 3 && l.word.length <= 10);
  const pool = eligible.length > 0 ? eligible : lessons;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(5, pool.length));
}

export default function WordScramble({ lessons, onComplete }) {
  const rounds = useRef(pickRounds(lessons));
  const [roundIdx, setRoundIdx] = useState(0);
  const [available, setAvailable] = useState([]);
  const [answer, setAnswer] = useState([]);
  const [status, setStatus] = useState(null); // null | 'correct' | 'wrong'
  const [correctCount, setCorrectCount] = useState(0);

  const lesson = rounds.current[roundIdx];

  useEffect(() => {
    if (!lesson) return;
    setAvailable(shuffleLetters(lesson.word));
    setAnswer([]);
    setStatus(null);
    const t = setTimeout(() => speakWord(lesson.word), 350);
    return () => clearTimeout(t);
  }, [roundIdx]);

  function placeLetter(tile) {
    if (status) return;
    const newAnswer = [...answer, tile];
    setAvailable(prev => prev.filter(t => t.id !== tile.id));
    setAnswer(newAnswer);

    if (newAnswer.length === lesson.word.length) {
      const formed = newAnswer.map(t => t.letter).join('');
      if (formed === lesson.word.toUpperCase()) {
        setStatus('correct');
        speakWord('Correct!');
        const next = correctCount + 1;
        setTimeout(() => {
          if (roundIdx + 1 < rounds.current.length) {
            setRoundIdx(i => i + 1);
            setCorrectCount(next);
          } else {
            onComplete(Math.round((next / rounds.current.length) * 100));
          }
        }, 1200);
      } else {
        setStatus('wrong');
        speakWord('Try again!');
        setTimeout(() => {
          setAvailable(shuffleLetters(lesson.word));
          setAnswer([]);
          setStatus(null);
        }, 900);
      }
    }
  }

  function removeLetter(tile) {
    if (status) return;
    setAnswer(prev => prev.filter(t => t.id !== tile.id));
    setAvailable(prev => [...prev, tile]);
  }

  if (!lesson) return null;

  const total = rounds.current.length;

  return (
    <div style={styles.container}>
      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${(roundIdx / total) * 100}%` }} />
      </div>

      <div style={styles.card}>
        <div style={styles.roundLabel}>{roundIdx + 1} / {total}</div>

        {/* Emoji hint */}
        <div style={styles.emojiWrap}>
          <span style={styles.emoji}>{lesson.emoji || '❓'}</span>
        </div>

        <div style={styles.prompt}>Spell this word! Tap the letters in order.</div>

        {/* Answer slots */}
        <div style={styles.answerRow}>
          {lesson.word.toUpperCase().split('').map((_, i) => {
            const tile = answer[i];
            const color = tile ? TILE_COLORS[tile.id % TILE_COLORS.length] : null;
            return (
              <div
                key={i}
                style={{
                  ...styles.slot,
                  ...(tile ? {
                    border: `2.5px solid ${color}`,
                    background: color + '22',
                    color: '#0A4A6E',
                    cursor: 'pointer',
                  } : {}),
                  ...(tile && status === 'correct' ? { border: '2.5px solid #10AC84', background: '#ECFDF5' } : {}),
                  ...(tile && status === 'wrong' ? { border: '2.5px solid #EE5A24', background: '#FFF5F0' } : {}),
                }}
                onClick={() => tile && removeLetter(tile)}
              >
                {tile?.letter}
              </div>
            );
          })}
        </div>

        {/* Feedback */}
        {status && (
          <div style={{ ...styles.feedback, color: status === 'correct' ? '#10AC84' : '#EE5A24' }}>
            {status === 'correct' ? '⭐ Correct!' : '❌ Try again!'}
          </div>
        )}

        {/* Scrambled letter tiles */}
        <div style={styles.tilesRow}>
          {available.map(tile => (
            <button
              key={tile.id}
              style={{
                ...styles.tile,
                background: TILE_COLORS[tile.id % TILE_COLORS.length],
                opacity: status ? 0.6 : 1,
                transform: status === 'wrong' ? 'translateX(-3px)' : '',
              }}
              onClick={() => placeLetter(tile)}
              disabled={!!status}
            >
              {tile.letter}
            </button>
          ))}
        </div>

        <button style={styles.speakBtn} onClick={() => speakWord(lesson.word)}>
          🔊 Hear the word
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '0 16px 24px', maxWidth: 560, margin: '0 auto' },
  progressBar: {
    height: 6, borderRadius: 999,
    background: 'rgba(255,255,255,0.2)',
    margin: '12px 0 20px', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 999,
    background: 'linear-gradient(90deg, #FF6B9D, #54A0FF)',
    transition: 'width 0.4s ease',
  },
  card: {
    background: 'rgba(255,255,255,0.94)',
    borderRadius: 28, padding: '24px 20px 28px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
  },
  roundLabel: { fontSize: 13, fontWeight: 700, color: '#5B9CB8', letterSpacing: 1 },
  emojiWrap: {
    width: 96, height: 96, borderRadius: 24,
    background: 'linear-gradient(135deg, #f0f4ff, #e8f0fe)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  emoji: { fontSize: 56 },
  prompt: { fontSize: 15, fontWeight: 600, color: '#0A4A6E', textAlign: 'center' },
  answerRow: {
    display: 'flex', gap: 8, flexWrap: 'wrap',
    justifyContent: 'center', minHeight: 52,
  },
  slot: {
    width: 44, height: 52, borderRadius: 12,
    border: '2.5px dashed #CBD5E1',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 800,
    transition: 'all 0.15s',
    background: 'rgba(248,250,255,0.8)',
  },
  feedback: { fontSize: 20, fontWeight: 800, letterSpacing: 0.5 },
  tilesRow: {
    display: 'flex', gap: 10, flexWrap: 'wrap',
    justifyContent: 'center', minHeight: 58,
  },
  tile: {
    width: 50, height: 58, borderRadius: 14,
    border: 'none', color: '#fff',
    fontSize: 22, fontWeight: 900,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    transition: 'transform 0.1s, opacity 0.15s',
  },
  speakBtn: {
    marginTop: 4,
    background: 'rgba(59,191,232,0.12)',
    border: '1.5px solid rgba(59,191,232,0.4)',
    borderRadius: 12, padding: '8px 20px',
    color: '#0A4A6E', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
};
