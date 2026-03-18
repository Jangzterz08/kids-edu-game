import { useState, useEffect } from 'react';

export default function PinKeypad({ length = 4, onSubmit, loading, error }) {
  const [digits, setDigits] = useState('');

  // Auto-clear digits when an error comes back so kid can retry immediately
  useEffect(() => {
    if (error) setDigits('');
  }, [error]);

  function handleDigit(d) {
    if (digits.length >= length) return;
    const next = digits + d;
    setDigits(next);
    if (next.length === length) onSubmit(next);
  }

  function handleBackspace() {
    setDigits(prev => prev.slice(0, -1));
  }

  function handleClear() {
    setDigits('');
  }

  return (
    <div style={styles.container}>
      {/* Dots indicator */}
      <div style={styles.dots}>
        {Array.from({ length }, (_, i) => (
          <div key={i} style={{
            ...styles.dot,
            background: i < digits.length ? 'var(--accent-blue)' : '#E0E0E0',
          }} />
        ))}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Keypad grid */}
      <div style={styles.grid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} style={styles.key} onClick={() => handleDigit(String(n))} disabled={loading}>
            {n}
          </button>
        ))}
        <button style={styles.key} onClick={handleClear} disabled={loading}>C</button>
        <button style={styles.key} onClick={() => handleDigit('0')} disabled={loading}>0</button>
        <button style={styles.key} onClick={handleBackspace} disabled={loading}>←</button>
      </div>

      {loading && <p style={styles.loadingText}>Checking...</p>}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 },
  dots: { display: 'flex', gap: 16 },
  dot: {
    width: 20, height: 20, borderRadius: '50%',
    transition: 'background 0.15s',
  },
  error: { color: 'var(--error)', fontWeight: 700, fontSize: 'var(--font-sm)', margin: 0 },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
    width: '100%', maxWidth: 260,
  },
  key: {
    width: 72, height: 72, borderRadius: 20,
    border: '2px solid #E0E0E0', background: 'var(--bg-surface)',
    fontSize: 28, fontWeight: 800, cursor: 'pointer',
    fontFamily: 'Nunito, sans-serif',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.1s, background 0.15s',
  },
  loadingText: { color: 'var(--text-secondary)', fontWeight: 700, fontSize: 'var(--font-sm)' },
};
