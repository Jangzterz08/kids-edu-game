import { useState, useMemo, useEffect } from 'react';
import { buildQuizOptions } from '../../data/index';
import { speakWord } from '../../lib/sound';
import DotGrid from '../ui/DotGrid';

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
    let bg = 'var(--glass-bg)';
    let border = '1px solid var(--glass-border)';
    let shadow = '0 8px 24px rgba(0,0,0,0.3)';

    if (selected) {
      if (opt.correct) {
        bg = 'var(--btn-green-base)';
        border = '1px solid #fff';
        shadow = '0 0 20px var(--btn-green-shade)';
      } else if (selected?.word === opt.word) {
        bg = 'var(--accent-red)';
        border = '1px solid #fff';
        shadow = '0 0 20px var(--accent-red)';
      }
    }
    return {
      ...styles.option,
      background: bg,
      border,
      boxShadow: shadow,
      color: '#fff',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
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
        {q.options.map((opt, i) => {
          const key = `${opt.word}-${qIdx}-${i}`;
          
          let content;
          if (opt.dotCount !== undefined) {
            content = <DotGrid count={opt.dotCount} />;
          } else if (!imgErrors[key] && opt.imageFile) {
            content = (
              <img
                src={`/assets/images/${opt.imageFile}`}
                alt={opt.word}
                style={styles.img}
                onError={() => setImgErrors(prev => ({ ...prev, [key]: true }))}
              />
            );
          } else {
            content = <span style={styles.fallbackEmoji}>{opt.emoji || opt.word[0]}</span>;
          }

          return (
            <button
              key={key}
              style={getOptionStyle(opt)}
              onClick={() => handleSelect(opt)}

            >
              {content}
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
  sparkleItem: { position: 'absolute', top: '50%', left: '50%', lineHeight: 1, animation: 'burst-out 0.7s ease-out forwards', filter: 'drop-shadow(0 0 8px #FFF)' },
  progress: { textAlign: 'center', fontSize: 'var(--font-base)', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  questionRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 },
  question: { fontSize: 'var(--font-lg)', fontWeight: 800, textAlign: 'center', margin: 0, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' },
  speakBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 32, lineHeight: 1, padding: 4, borderRadius: 8,
    flexShrink: 0, filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.4))',
    transition: 'transform 0.2s'
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  option: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    padding: 24, borderRadius: 28, cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    minHeight: 180, justifyContent: 'center',
  },
  img: { width: 90, height: 90, objectFit: 'contain', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.4))' },
  fallbackEmoji: { fontSize: 64, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.4))' },
};
