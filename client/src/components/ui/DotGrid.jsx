import React from 'react';

export default function DotGrid({ count }) {
  if (count === 0) {
    return (
      <div style={styles.zeroContainer}>
        <span style={styles.zeroIcon}>🚫</span>
        <span style={styles.zeroText}>Zero Space</span>
      </div>
    );
  }

  const dots = Array.from({ length: count }, (_, i) => i);
  // Dynamic grid depending on count to make it look like dice / symmetrical
  let cols = 3;
  if (count <= 4) cols = 2;
  if (count === 1) cols = 1;

  return (
    <div style={{ ...styles.grid, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {dots.map(i => (
        <div key={i} style={styles.dot} />
      ))}
    </div>
  );
}

const styles = {
  zeroContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: '100%', width: '100%'
  },
  zeroIcon: { fontSize: 48, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' },
  zeroText: { fontSize: 16, fontWeight: 900, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: 2 },
  grid: {
    display: 'grid',
    gap: 16,
    padding: 16,
    alignItems: 'center',
    justifyItems: 'center',
    width: '100%',
    height: '100%',
    alignContent: 'center',
    justifyContent: 'center'
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 2px 2px 6px rgba(255,255,255,0.8), inset -2px -4px 6px rgba(0,0,0,0.2)',
    animation: 'pulse-glow 2s infinite ease-in-out alternate'
  }
};
