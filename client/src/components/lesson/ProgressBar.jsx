export default function ProgressBar({ current, total, color = 'var(--accent-blue)' }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div style={styles.track}>
      <div style={{ ...styles.fill, width: `${pct}%`, background: color }} />
    </div>
  );
}

const styles = {
  track: { height: 12, borderRadius: 6, background: '#E0E0E0', overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: 6, transition: 'width 0.4s ease' },
};
