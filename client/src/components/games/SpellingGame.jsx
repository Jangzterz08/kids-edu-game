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

  const answerBg = status === 'correct' ? 'var(--success)' : status === 'wrong' ? 'var(--error)' : 'var(--bg-surface-alt)';

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
        <button style={styles.speakBtn} onClick={() => speakWord(lesson.word)}>🔊</button>
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
            style={{ ...styles.tile, opacity: tile.used ? 0.25 : 1 }}
          >
            {tile.letter}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 'var(--space-xl)', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' },
  progress:  { fontSize: 'var(--font-base)', color: 'var(--text-secondary)', fontWeight: 700, alignSelf: 'flex-start' },
  pictureCard: {
    position: 'relative',
    background: 'var(--bg-surface)', borderRadius: 'var(--card-radius)',
    boxShadow: 'var(--shadow-card)', width: '100%', maxWidth: 280,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 200, padding: 16,
  },
  img:      { width: 160, height: 160, objectFit: 'contain' },
  emoji:    { fontSize: 100, lineHeight: 1 },
  speakBtn: { position: 'absolute', bottom: 12, right: 12, background: 'none', border: 'none', fontSize: 28, cursor: 'pointer' },
  answerRow: {
    display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
    padding: '12px 20px', borderRadius: 20, minWidth: 200, flexWrap: 'wrap',
    transition: 'background 0.25s',
    position: 'relative',
  },
  slot: {
    width: 44, height: 52, border: '3px solid var(--text-muted)',
    borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-surface)',
  },
  slotLetter: { fontSize: 'var(--font-lg)', fontWeight: 900, color: 'var(--text-primary)' },
  backBtn: {
    background: 'none', border: 'none', fontSize: 24, cursor: 'pointer',
    color: 'var(--text-secondary)', marginLeft: 4,
  },
  tileGrid: {
    display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 380,
  },
  tile: {
    width: 56, height: 56, borderRadius: 14, border: 'none',
    background: 'var(--accent-purple)', color: '#fff',
    fontSize: 'var(--font-lg)', fontWeight: 900,
    boxShadow: '0 4px 0 rgba(0,0,0,0.2)',
    cursor: 'pointer', transition: 'opacity 0.15s, transform 0.1s',
    active: { transform: 'translateY(2px)', boxShadow: '0 2px 0 rgba(0,0,0,0.2)' },
  },
};
