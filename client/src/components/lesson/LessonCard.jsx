import { useState } from 'react';
import SoundButton from './SoundButton';
import SpeakAlongButton from './SpeakAlongButton';
import DotGrid from '../ui/DotGrid';

export default function LessonCard({ lesson }) {
  const { title, word, imageFile, dotCount, letter, numeral, emoji, tip } = lesson;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="glass-panel" style={styles.card}>
      {/* Large symbol (letter/number/emoji) IF no image and no dots */}
      {!imageFile && dotCount === undefined && (letter || numeral) && (
        <div style={styles.symbol}>{letter || numeral}</div>
      )}
      {/* emoji-only symbol removed — imageWrap fallback already shows it */}

      {/* Image, DotGrid, or emoji fallback */}
      <div style={styles.imageWrap}>
        {dotCount !== undefined ? (
          <DotGrid count={dotCount} />
        ) : !imgFailed && imageFile ? (
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

      {/* Speak-along mic — child repeats what the speaker says */}
      <SpeakAlongButton word={word} />

      {/* Tip (manners / food) */}
      {tip && <div style={styles.tip}>{tip}</div>}
    </div>
  );
}

const styles = {
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
    padding: 'var(--space-xl)', maxWidth: 460, margin: '0 auto',
  },
  symbol: {
    fontSize: 120, fontWeight: 900, lineHeight: 1, color: 'var(--accent-cyan)',
    textShadow: '0 0 24px rgba(0, 229, 255, 0.6)', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))'
  },
  imageWrap: {
    width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: 36, overflow: 'hidden', boxShadow: 'inset 0 12px 24px rgba(0,0,0,0.2)',
  },
  image: { width: '100%', height: '100%', objectFit: 'contain', padding: 20, filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.6))' },
  imageEmoji: { fontSize: 140, filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.6))' },
  wordRow: { display: 'flex', alignItems: 'center', gap: 20 },
  word: { fontSize: 'var(--font-2xl)', fontWeight: 900, color: '#fff', textShadow: '0 4px 16px rgba(0,0,0,0.6)', letterSpacing: 2 },
  tip: {
    fontSize: 'var(--font-base)', color: '#fff', fontWeight: 800,
    background: 'rgba(213, 0, 249, 0.3)', border: '1px solid rgba(213, 0, 249, 0.6)',
    padding: '12px 24px', borderRadius: 24, textAlign: 'center', textShadow: '0 2px 6px rgba(0,0,0,0.5)',
  },
};
