import { useState, useMemo, useEffect } from 'react';
import { speakWord } from '../../lib/sound';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a set of letter tiles: correct letters + random distractors */
function buildTiles(word) {
  const letters = word.toUpperCase().split('');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const extras   = shuffle(alphabet.filter(c => !letters.includes(c))).slice(0, Math.max(2, 6 - letters.length));
  return shuffle([...letters, ...extras].map((l, i) => ({ id: i, letter: l, used: false })));
}

const ROUNDS = 5; // words per game session

export default function SpellingGame({ lessons, onComplete }) {
  const queue = useMemo(() => shuffle(lessons).slice(0, Math.min(ROUNDS, lessons.length)), []);
  const [wordIdx, setWordIdx]   = useState(0);
  const [tiles, setTiles]       = useState(() => buildTiles(queue[0]?.word || ''));
  const [typed, setTyped]       = useState([]); // { id, letter }
  const [status, setStatus]     = useState(null); // 'correct' | 'wrong'
  const [correct, setCorrect]   = useState(0);
  const [imgError, setImgError] = useState(false);

  const lesson = queue[wordIdx];
  const target  = lesson?.word?.toUpperCase() || '';

  // Speak word on mount and on lesson change
  useEffect(() => {
    if (!lesson) return;
    const t = setTimeout(() => speakWord(lesson.word), 400);
    return () => clearTimeout(t);
  }, [wordIdx]);

  function handleTileTap(tile) {
    if (status || tile.used) return;
    const newTyped = [...typed, tile];
    setTyped(newTyped);
    setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, used: true } : t));

    // Check if enough letters typed
    if (newTyped.length === target.length) {
      const attempt = newTyped.map(t => t.letter).join('');
      if (attempt === target) {
        setStatus('correct');
        setCorrect(c => c + 1);
        speakWord('Correct!');
        setTimeout(advance, 1000);
      } else {
        setStatus('wrong');
        speakWord('Try again!');
        setTimeout(() => {
          setTyped([]);
          setTiles(buildTiles(lesson.word));
          setStatus(null);
        }, 800);
      }
    }
  }

  function handleBackspace() {
    if (status || typed.length === 0) return;
    const last = typed[typed.length - 1];
    setTiles(prev => prev.map(t => t.id === last.id ? { ...t, used: false } : t));
    setTyped(prev => prev.slice(0, -1));
  }

  function advance() {
    if (wordIdx < queue.length - 1) {
      const next = wordIdx + 1;
      setWordIdx(next);
      setTiles(buildTiles(queue[next].word));
      setTyped([]);
      setStatus(null);
      setImgError(false);
    } else {
      const score = Math.round((correct / queue.length) * 100);
      onComplete(score);
    }
  }

  if (!lesson) return null;

  const answerBg = status === 'correct' ? 'var(--btn-green-base)' : status === 'wrong' ? 'var(--accent-red)' : 'var(--glass-bg)';

  return (
    <div style={styles.container}>
      {/* Progress */}
      <div style={styles.progress}>{wordIdx + 1} / {queue.length}</div>

      {/* Word image / emoji */}
      <div style={styles.pictureCard}>
        {!imgError && lesson.imageFile ? (
          <img
            src={`/assets/images/${lesson.imageFile}`}
            alt={lesson.word}
            style={styles.img}
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={styles.emoji}>{lesson.emoji || '❓'}</span>
        )}
        {/* ALL CAPS label so kids can match the letters they see */}
        <p style={styles.wordLabel}>{lesson.word.toUpperCase()}</p>
        <button style={styles.speakBtn} onClick={() => speakWord(lesson.word)} aria-label={`Hear ${lesson.word}`}>🔊</button>
      </div>

      {/* Answer slots */}
      <div style={{ ...styles.answerRow, background: answerBg, animation: status === 'wrong' ? 'shake 0.4s ease' : 'none' }}>
        {Array.from({ length: target.length }).map((_, i) => (
          <div key={i} style={styles.slot}>
            <span style={styles.slotLetter}>{typed[i]?.letter || ''}</span>
          </div>
        ))}
        {typed.length > 0 && !status && (
          <button style={styles.backBtn} onClick={handleBackspace}>⌫</button>
        )}
      </div>

      {/* Tile keyboard */}
      <div style={styles.tileGrid}>
        {tiles.map(tile => (
          <button
            key={tile.id}
            onClick={() => handleTileTap(tile)}
            disabled={tile.used || !!status}
            style={{ 
              ...styles.tile, 
              opacity: tile.used ? 0.2 : 1,
              transform: tile.used ? 'translateY(6px) scale(0.95)' : 'translateY(0)',
              boxShadow: tile.used ? '0 0px 0 var(--btn-blue-shade), 0 5px 10px rgba(0,0,0,0.2)' : styles.tile.boxShadow
            }}
          >
            {tile.letter}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 'var(--space-xl)', maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' },
  progress:  { fontSize: 'var(--font-base)', color: 'var(--text-secondary)', fontWeight: 800, alignSelf: 'flex-start', textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  pictureCard: {
    position: 'relative',
    background: 'var(--glass-bg)', borderRadius: '36px',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.4)', width: '100%', maxWidth: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 240, paddingTop: 16, paddingLeft: 16, paddingRight: 16, paddingBottom: 80,
  },
  img:      { width: 180, height: 180, objectFit: 'contain', filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.4))' },
  emoji:    { fontSize: 130, lineHeight: 1, filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.4))' },
  wordLabel: {
    position: 'absolute', bottom: 32, left: 0, right: 0, textAlign: 'center',
    fontSize: 'var(--font-xl)', fontWeight: 900, color: '#fff',
    letterSpacing: 6, margin: 0, textShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },
  speakBtn: {
    position: 'absolute', bottom: 12, right: 12,
    background: 'var(--accent-yellow)', border: 'none',
    borderRadius: '50%', width: 50, height: 50,
    fontSize: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)', transition: 'transform 0.2s',
  },
  answerRow: {
    display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center',
    padding: '16px 24px', borderRadius: 28, minWidth: 220, flexWrap: 'wrap',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', position: 'relative',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
  },
  slot: {
    width: 64, height: 72, border: 'none',
    borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.15)', boxShadow: 'inset 0 6px 12px rgba(0,0,0,0.2)',
  },
  slotLetter: { fontSize: 40, fontWeight: 900, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.5)' },
  backBtn: {
    background: 'none', border: 'none', fontSize: 36, cursor: 'pointer',
    color: '#fff', marginLeft: 8, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
  },
  tileGrid: {
    display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', maxWidth: 420,
  },
  tile: {
    width: 76, height: 76, borderRadius: 24, border: 'none',
    background: 'var(--btn-blue-base)', color: '#fff',
    fontSize: 36, fontWeight: 900,
    boxShadow: '0 8px 0 var(--btn-blue-shade), 0 15px 25px rgba(0,0,0,0.3)',
    cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
};
