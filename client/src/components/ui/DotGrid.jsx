import React from 'react';

const SEA_EMOJIS = ['🐠', '🐡', '🐚', '🦀', '🐙', '🦑', '🐟', '🦞', '🦐', '🐬'];

export default function DotGrid({ count }) {
  if (count === 0) {
    return (
      <div style={styles.zeroContainer}>
        <span style={styles.zeroIcon}>🌊</span>
        <span style={styles.zeroText}>Zero Fish</span>
      </div>
    );
  }

  const dots = Array.from({ length: count }, (_, i) => i);
  // Dynamic grid depending on count to make it look like dice / symmetrical
  let cols = 3;
  if (count <= 4) cols = 2;
  if (count === 1) cols = 1;

  // Pick a consistent emoji for this specific number (so "3" is always the same emoji)
  const emoji = SEA_EMOJIS[count % SEA_EMOJIS.length];

  return (
    <div style={{ ...styles.grid, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {dots.map(i => (
        <span key={i} style={styles.emojiItem}>
          {emoji}
        </span>
      ))}
    </div>
  );
}

const styles = {
  zeroContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: '100%', width: '100%'
  },
  zeroIcon: { fontSize: 48, filter: 'drop-shadow(0 4px 8px rgba(0,80,120,0.3))' },
  zeroText: { fontSize: 16, fontWeight: 700, color: '#1A7A9A', textTransform: 'uppercase', letterSpacing: 2 },
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
  emojiItem: {
    fontSize: 38,
    lineHeight: 1,
    filter: 'drop-shadow(0 4px 8px rgba(0,80,120,0.25))',
    animation: 'ocean-float 4s infinite ease-in-out alternate',
    display: 'inline-block'
  }
};
