import { useState, useEffect, useMemo } from 'react';
import { speakWord } from '../../lib/sound';

// ── Helpers ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  const groups = word.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 1;
  // silent trailing 'e' (e.g. "cake" → 1, "apple" stays 2)
  if (word.endsWith('e') && !word.endsWith('le') && count > 1) count--;
  return Math.max(1, Math.min(4, count));
}

function buildQuestions(lessons) {
  const pool = shuffle(lessons);

  // 3 beginning-sound questions + 2 syllable questions = 5 rounds
  const beginningTargets = pool.slice(0, 3);
  const syllableTargets  = pool.slice(3, 5);

  const beginningQs = beginningTargets.map(target => {
    const targetLetter = target.word[0].toUpperCase();
    const distractors = shuffle(
      lessons.filter(l => l.word[0].toUpperCase() !== targetLetter && l.slug !== target.slug)
    ).slice(0, 3);
    return {
      type: 'beginning',
      letter: targetLetter,
      target,
      options: shuffle([target, ...distractors]),
    };
  });

  const syllableQs = syllableTargets.map(target => {
    const correct = countSyllables(target.word);
    // Generate 3 unique wrong counts
    const all = [1, 2, 3, 4].filter(n => n !== correct);
    const wrongs = shuffle(all).slice(0, 2);
    return {
      type: 'syllable',
      target,
      correct,
      choices: shuffle([correct, ...wrongs]),
    };
  });

  return [...beginningQs, ...syllableQs];
}

// ── Component ──────────────────────────────────────────────────────────────

const TOTAL_ROUNDS = 5;

export default function PhonicsGame({ lessons, onComplete }) {
  const questions = useMemo(() => buildQuestions(lessons), []);
  const [idx, setIdx]         = useState(0);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect]  = useState(0);
  const [imgErrors, setImgErrors] = useState({});

  const q = questions[idx];

  useEffect(() => {
    if (!q) return;
    const t = setTimeout(() => {
      if (q.type === 'beginning') speakWord(`Which one starts with the letter ${q.letter}?`);
      else speakWord(`How many syllables in ${q.target.word}?`);
    }, 350);
    return () => clearTimeout(t);
  }, [idx]);

  function handleAnswer(isCorrect, feedbackLabel) {
    if (selected !== null) return;
    setSelected(feedbackLabel);
    if (isCorrect) {
      speakWord('Great job!');
      setCorrect(c => c + 1);
    } else {
      speakWord('Not quite!');
    }
    setTimeout(() => {
      setSelected(null);
      if (idx < questions.length - 1) {
        setIdx(i => i + 1);
      } else {
        const score = Math.round(((correct + (isCorrect ? 1 : 0)) / questions.length) * 100);
        onComplete(score);
      }
    }, 1000);
  }

  if (!q) return null;

  return (
    <div style={styles.container}>
      {/* Progress dots */}
      <div style={styles.dots}>
        {questions.map((_, i) => (
          <div key={i} style={{
            ...styles.dot,
            background: i < idx ? 'var(--accent-blue)' : i === idx ? 'var(--accent-blue)' : 'var(--text-muted)',
            opacity: i < idx ? 0.4 : 1,
          }} />
        ))}
      </div>

      {/* Mode tag */}
      <div style={styles.modeTag}>
        {q.type === 'beginning' ? '🔤 Beginning Sound' : '👏 Syllables'}
      </div>

      {q.type === 'beginning' ? (
        <BeginningRound
          q={q}
          selected={selected}
          imgErrors={imgErrors}
          onImgError={k => setImgErrors(p => ({ ...p, [k]: true }))}
          onAnswer={handleAnswer}
          onSpeak={() => speakWord(`Which one starts with the letter ${q.letter}?`)}
        />
      ) : (
        <SyllableRound
          q={q}
          selected={selected}
          imgErrors={imgErrors}
          onImgError={k => setImgErrors(p => ({ ...p, [k]: true }))}
          onAnswer={handleAnswer}
          onSpeak={() => speakWord(`${q.target.word}`)}
        />
      )}
    </div>
  );
}

// ── Beginning Sound Round ──────────────────────────────────────────────────

function BeginningRound({ q, selected, imgErrors, onImgError, onAnswer, onSpeak }) {
  return (
    <>
      <div style={styles.questionRow}>
        <h2 style={styles.question}>
          Which one starts with <span style={styles.letterHighlight}>/{q.letter}/</span>?
        </h2>
        <button style={styles.speakBtn} onClick={onSpeak}>🔊</button>
      </div>

      <div style={styles.grid4}>
        {q.options.map(opt => {
          const isTarget = opt.slug === q.target.slug;
          const isSelected = selected === opt.slug;
          let bg = 'var(--glass-bg)';
          let border = '1px solid var(--glass-border)';
          let shadow = '0 12px 30px rgba(0,0,0,0.3)';
          
          if (selected) {
            if (isTarget) {
              bg = 'var(--btn-green-base)';
              border = '1px solid #fff';
              shadow = '0 0 30px var(--btn-green-shade)';
            }
            else if (isSelected) {
              bg = 'var(--accent-red)';
              border = '1px solid #fff';
              shadow = '0 0 30px var(--accent-red)';
            }
          }
          const imgKey = `${opt.slug}-${q.letter}`;
          const showEmoji = imgErrors[imgKey] || !opt.imageFile;
          return (
            <button
              key={opt.slug}
              style={{ ...styles.optionCard, background: bg, border, boxShadow: shadow }}
              onClick={() => onAnswer(isTarget, opt.slug)}
            >
              {!showEmoji ? (
                <img
                  src={`/assets/images/${opt.imageFile}`}
                  alt={opt.word}
                  style={styles.optImg}
                  onError={() => onImgError(imgKey)}
                />
              ) : (
                <span style={styles.optEmoji}>{opt.emoji || opt.word[0]}</span>
              )}
              <span style={styles.optWord}>{opt.word}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Syllable Round ─────────────────────────────────────────────────────────

function SyllableRound({ q, selected, imgErrors, onImgError, onAnswer, onSpeak }) {
  const imgKey = `syl-${q.target.slug}`;
  const showEmoji = imgErrors[imgKey] || !q.target.imageFile;

  return (
    <>
      <div style={styles.questionRow}>
        <h2 style={styles.question}>
          How many syllables in <span style={styles.letterHighlight}>{q.target.word}</span>?
        </h2>
        <button style={styles.speakBtn} onClick={onSpeak}>🔊</button>
      </div>

      <div style={styles.syllableImgWrap}>
        {!showEmoji ? (
          <img
            src={`/assets/images/${q.target.imageFile}`}
            alt={q.target.word}
            style={styles.syllableImg}
            onError={() => onImgError(imgKey)}
          />
        ) : (
          <span style={{ fontSize: 110, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' }}>{q.target.emoji || q.target.word[0]}</span>
        )}
        <div style={styles.syllableWord}>{q.target.word}</div>
      </div>

      <div style={styles.syllableChoices}>
        {q.choices.map(num => {
          const isCorrect = num === q.correct;
          const isSelected = selected === String(num);
          let bg = 'var(--glass-bg)';
          let border = '1px solid var(--glass-border)';
          let shadow = '0 12px 30px rgba(0,0,0,0.3)';

          if (selected) {
            if (isCorrect) {
              bg = 'var(--btn-green-base)'; border = '1px solid #fff'; shadow = '0 0 30px var(--btn-green-shade)';
            }
            else if (isSelected) {
              bg = 'var(--accent-red)'; border = '1px solid #fff'; shadow = '0 0 30px var(--accent-red)';
            }
          }
          return (
            <button
              key={num}
              style={{ ...styles.syllableBtn, background: bg, border, boxShadow: shadow }}
              onClick={() => onAnswer(isCorrect, String(num))}
            >
              <span style={styles.syllableNum}>{num}</span>
              <span style={styles.syllableClap}>{'👏'.repeat(num)}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '8px 12px', maxWidth: 640, margin: '0 auto', textAlign: 'center', boxSizing: 'border-box' },
  dots: { display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12, flex: '0 0 auto' },
  dot: { width: 14, height: 14, borderRadius: '50%', transition: 'all 0.3s' },
  modeTag: {
    textAlign: 'center', fontSize: 15, fontWeight: 900, letterSpacing: 1,
    color: '#fff', marginBottom: 12, textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    background: 'var(--glass-bg)', display: 'inline-block',
    padding: '6px 20px', borderRadius: 30, border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    width: 'fit-content', margin: '0 auto 12px', boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
    flex: '0 0 auto',
  },
  questionRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12, flex: '0 0 auto' },
  question: { fontSize: 'var(--font-lg)', fontWeight: 800, textAlign: 'center', margin: 0, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)' },
  letterHighlight: { color: 'var(--accent-cyan)', fontWeight: 900, fontSize: '1.2em', textShadow: '0 0 16px rgba(0, 229, 255, 0.8)' },
  speakBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 36, padding: 4, flexShrink: 0, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))', transition: 'transform 0.2s' },
  grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: '1 1 0', overflowY: 'auto', minHeight: 0 },
  optionCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 28, border: 'none', cursor: 'pointer',
    minHeight: 100, justifyContent: 'center', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', color: '#fff'
  },
  optImg: { maxHeight: '25vh', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.5))' },
  optEmoji: { fontSize: 56, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.5))' },
  optWord: { fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: 1, textShadow: '0 2px 4px rgba(0,0,0,0.5)', textTransform: 'uppercase' },
  syllableImgWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 16, flex: '0 0 auto' },
  syllableImg: { maxHeight: '25vh', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.5))' },
  syllableWord: { fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: 2, textShadow: '0 4px 12px rgba(0,0,0,0.6)', textTransform: 'uppercase' },
  syllableChoices: { display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', flex: '1 1 0', overflowY: 'auto', minHeight: 0, alignContent: 'flex-start' },
  syllableBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '16px 24px', borderRadius: 28, border: 'none', cursor: 'pointer',
    minWidth: 100, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', color: '#fff',
  },
  syllableNum: { fontSize: 44, fontWeight: 900, color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.6)' },
  syllableClap: { fontSize: 28, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' },
};
