import { useState } from 'react';
import SoundButton from './SoundButton';

export default function LessonCard({ lesson }) {
  const { title, word, imageFile, letter, numeral, emoji, tip } = lesson;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div style={styles.card}>
      {/* Large symbol (letter/number/emoji) */}
      {(letter || numeral) && (
        <div style={styles.symbol}>{letter || numeral}</div>
      )}
      {emoji && !letter && !numeral && !imageFile && (
        <div style={styles.symbolEmoji}>{emoji}</div>
      )}

      {/* Image or emoji fallback */}
      <div style={styles.imageWrap}>
        {!imgFailed && imageFile ? (
          <img
            src={`/assets/images/${imageFile}`}
            alt={word}
            style={styles.image}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span style={styles.imageEmoji}>{emoji || '🖼️'}</span>
        )}
      </div>

      {/* Word + sound */}
      <div style={styles.wordRow}>
        <span style={styles.word}>{word}</span>
        <SoundButton word={word} size="md" />
      </div>

      {/* Tip (manners / food) */}
      {tip && <div style={styles.tip}>{tip}</div>}
    </div>
  );
}

const styles = {
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    padding: 'var(--space-xl)', maxWidth: 420, margin: '0 auto',
    background: 'var(--bg-surface)', borderRadius: 'var(--card-radius)',
    boxShadow: 'var(--shadow-card)',
  },
  symbol: {
    fontSize: 96, fontWeight: 900, lineHeight: 1, color: 'var(--accent-blue)',
    textShadow: '2px 4px 8px rgba(0,0,0,0.1)',
  },
  symbolEmoji: { fontSize: 80 },
  imageWrap: {
    width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-surface-alt)', borderRadius: 24, overflow: 'hidden',
  },
  image: { width: '100%', height: '100%', objectFit: 'contain', padding: 16 },
  imageEmoji: { fontSize: 100 },
  wordRow: { display: 'flex', alignItems: 'center', gap: 16 },
  word: { fontSize: 'var(--font-xl)', fontWeight: 900, color: 'var(--text-primary)' },
  title: { fontSize: 'var(--font-base)', color: 'var(--text-secondary)', fontWeight: 600 },
  tip: {
    fontSize: 'var(--font-sm)', color: 'var(--accent-purple)', fontWeight: 700,
    background: '#F3E5F5', padding: '10px 16px', borderRadius: 16, textAlign: 'center',
  },
};
