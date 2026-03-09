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
        const score = Math.round(((correct + (isCorrect ? 1 : 0)) / TOTAL_ROUNDS) * 100);
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
          let bg = 'var(--bg-surface-alt)';
          if (selected) {
            if (isTarget) bg = 'var(--success)';
            else if (isSelected) bg = 'var(--error)';
          }
          const imgKey = `${opt.slug}-${q.letter}`;
          const showEmoji = imgErrors[imgKey] || !opt.imageFile;
          return (
            <button
              key={opt.slug}
              style={{ ...styles.optionCard, background: bg }}
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
          <span style={{ fontSize: 96 }}>{q.target.emoji || q.target.word[0]}</span>
        )}
        <div style={styles.syllableWord}>{q.target.word}</div>
      </div>

      <div style={styles.syllableChoices}>
        {q.choices.map(num => {
          const isCorrect = num === q.correct;
          const isSelected = selected === String(num);
          let bg = 'var(--bg-surface-alt)';
          if (selected) {
            if (isCorrect) bg = 'var(--success)';
            else if (isSelected) bg = 'var(--error)';
          }
          return (
            <button
              key={num}
              style={{ ...styles.syllableBtn, background: bg }}
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
  container: { padding: 'var(--space-xl)', maxWidth: 600, margin: '0 auto' },
  dots: { display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 12 },
  dot: { width: 12, height: 12, borderRadius: '50%', transition: 'all 0.2s' },
  modeTag: {
    textAlign: 'center', fontSize: 14, fontWeight: 700,
    color: 'var(--text-secondary)', marginBottom: 16,
    background: 'var(--bg-surface-alt)', display: 'inline-block',
    padding: '4px 16px', borderRadius: 20,
    width: 'fit-content', margin: '0 auto 16px',
  },
  questionRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 },
  question: { fontSize: 'var(--font-lg)', fontWeight: 800, textAlign: 'center', margin: 0 },
  letterHighlight: { color: 'var(--accent-blue)', fontWeight: 900, fontSize: '1.1em' },
  speakBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, padding: 4, flexShrink: 0 },
  grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  optionCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 20, border: 'none', cursor: 'pointer',
    boxShadow: 'var(--shadow-card)', minHeight: 130,
    justifyContent: 'center', transition: 'background 0.2s',
  },
  optImg: { width: 72, height: 72, objectFit: 'contain' },
  optEmoji: { fontSize: 52 },
  optWord: { fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' },
  syllableImgWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 28 },
  syllableImg: { width: 120, height: 120, objectFit: 'contain' },
  syllableWord: { fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' },
  syllableChoices: { display: 'flex', justifyContent: 'center', gap: 16 },
  syllableBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '16px 24px', borderRadius: 20, border: 'none', cursor: 'pointer',
    boxShadow: 'var(--shadow-card)', minWidth: 100, transition: 'background 0.2s',
  },
  syllableNum: { fontSize: 40, fontWeight: 900, color: 'var(--text-primary)' },
  syllableClap: { fontSize: 20 },
};
