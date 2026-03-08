import { useState, useMemo, useEffect } from 'react';
import { buildQuizOptions } from '../../data/index';
import { speakWord } from '../../lib/sound';

export default function QuizGame({ moduleSlug, lessons, onComplete }) {
  const [qIdx, setQIdx]           = useState(0);
  const [selected, setSelected]   = useState(null);
  const [correct, setCorrect]     = useState(0);
  const [shake, setShake]         = useState(null);
  const [sparkle, setSparkle]     = useState(false);
  const [imgErrors, setImgErrors] = useState({});

  const questions = useMemo(() => lessons.map(l => ({
    lesson: l,
    options: buildQuizOptions(moduleSlug, l.slug),
  })), [moduleSlug, lessons]);

  const q = questions[qIdx];

  // Auto-speak question word whenever it changes
  useEffect(() => {
    if (!q) return;
    const t = setTimeout(() => speakWord(`Find… ${q.lesson.word}`), 300);
    return () => clearTimeout(t);
  }, [qIdx]);

  if (!q) return null;

  function handleSelect(option) {
    if (selected) return;
    setSelected(option);
    if (option.correct) {
      speakWord('Correct!');
      setCorrect(c => c + 1);
      setSparkle(true);
      setTimeout(() => setSparkle(false), 700);
      setTimeout(advance, 900);
    } else {
      speakWord('Try again!');
      setShake(option.word);
      setTimeout(() => setShake(null), 500);
      setTimeout(advance, 1400);
    }
  }

  function advance() {
    setSelected(null);
    if (qIdx < questions.length - 1) {
      setQIdx(i => i + 1);
    } else {
      const score = Math.round((correct / questions.length) * 100);
      onComplete(score);
    }
  }

  function getOptionStyle(opt) {
    let bg = 'var(--bg-surface-alt)';
    if (selected) {
      if (opt.correct) bg = 'var(--success)';
      else if (selected?.word === opt.word) bg = 'var(--error)';
    }
    return {
      ...styles.option,
      background: bg,
      color: selected && (opt.correct || selected.word === opt.word) ? '#fff' : 'var(--text-primary)',
      animation: shake === opt.word ? 'shake 0.4s ease' : 'none',
    };
  }

  return (
    <div style={styles.container}>
      <div style={styles.progress}>{qIdx + 1} / {questions.length}</div>

      {/* Sparkle burst on correct */}
      {sparkle && (
        <div style={styles.sparkleWrap}>
          {['✨','⭐','🌟','💫'].map((e, i) => (
            <span
              key={i}
              style={{
                ...styles.sparkleItem,
                '--tx': `${Math.round(Math.cos(i * Math.PI / 2) * 50)}px`,
                '--ty': `${Math.round(Math.sin(i * Math.PI / 2) * 50)}px`,
                '--rot': `${i * 90}deg`,
                animationDelay: `${i * 50}ms`,
                fontSize: 32,
              }}
            >{e}</span>
          ))}
        </div>
      )}

      {/* Question with tap-to-repeat speaker */}
      <div style={styles.questionRow}>
        <h2 style={styles.question}>Which one is <strong>{q.lesson.word}</strong>?</h2>
        <button style={styles.speakBtn} onClick={() => speakWord(q.lesson.word)} title="Hear the word">
          🔊
        </button>
      </div>

      <div style={styles.grid}>
        {q.options.map(opt => {
          const key = `${opt.word}-${qIdx}`;
          const showEmoji = imgErrors[key] || !opt.imageFile;
          return (
            <button
              key={opt.word}
              style={getOptionStyle(opt)}
              onClick={() => handleSelect(opt)}

            >
              {!showEmoji ? (
                <img
                  src={`/assets/images/${opt.imageFile}`}
                  alt={opt.word}
                  style={styles.img}
                  onError={() => setImgErrors(prev => ({ ...prev, [key]: true }))}
                />
              ) : (
                <span style={styles.fallbackEmoji}>{opt.emoji || opt.word[0]}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 'var(--space-xl)', maxWidth: 600, margin: '0 auto', position: 'relative' },
  sparkleWrap: { position: 'absolute', top: 80, left: '50%', width: 0, height: 0, pointerEvents: 'none', zIndex: 10 },
  sparkleItem: { position: 'absolute', top: '50%', left: '50%', lineHeight: 1, animation: 'burst-out 0.7s ease-out forwards' },
  progress: { textAlign: 'center', fontSize: 'var(--font-base)', color: 'var(--text-secondary)', marginBottom: 8 },
  questionRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 },
  question: { fontSize: 'var(--font-lg)', fontWeight: 800, textAlign: 'center', margin: 0 },
  speakBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 28, lineHeight: 1, padding: 4, borderRadius: 8,
    flexShrink: 0,
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  option: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    padding: 16, borderRadius: 24, border: 'none', cursor: 'pointer',
    transition: 'background 0.2s, transform 0.12s',
    boxShadow: 'var(--shadow-card)', minHeight: 160,
    justifyContent: 'center',
  },
  img: { width: 80, height: 80, objectFit: 'contain' },
  fallbackEmoji: { fontSize: 56 },
};
