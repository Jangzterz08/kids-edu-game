export default function ProgressBar({ current, total, color = 'var(--accent-blue)' }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div style={styles.track}>
      <div style={{ ...styles.fill, width: `${pct}%`, background: color }} />
    </div>
  );
}

const styles = {
  track: { height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden', width: '100%', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' },
  fill: { height: '100%', borderRadius: 8, transition: 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
};
