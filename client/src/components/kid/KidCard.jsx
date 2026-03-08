const AVATAR_EMOJIS = {
  bear: '🐻', lion: '🦁', rabbit: '🐰', cat: '🐱',
  dog: '🐶', owl: '🦉', fox: '🦊', penguin: '🐧',
};

export default function KidCard({ kid, onClick, active, onDelete }) {
  return (
    <div
      style={{ ...styles.card, ...(active ? styles.active : {}) }}
      onClick={onClick}
    >
      <div style={styles.avatar}>{AVATAR_EMOJIS[kid.avatarId] || '🐻'}</div>
      <div style={styles.name}>{kid.name}</div>
      <div style={styles.stars}>⭐ {kid.totalStars} stars</div>
      {onDelete && (
        <button
          style={styles.deleteBtn}
          onClick={e => { e.stopPropagation(); onDelete(kid); }}
          title="Remove kid"
        >✕</button>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: 'var(--bg-surface)', borderRadius: 24, padding: 24,
    textAlign: 'center', cursor: 'pointer', position: 'relative',
    border: '3px solid transparent', transition: 'border-color 0.15s, transform 0.15s',
    boxShadow: 'var(--shadow-card)',
  },
  active: { borderColor: 'var(--accent-blue)', transform: 'scale(1.04)' },
  avatar: { fontSize: 64, marginBottom: 8 },
  name: { fontSize: 'var(--font-md)', fontWeight: 800, marginBottom: 4 },
  stars: { fontSize: 'var(--font-sm)', color: 'var(--star-gold)', fontWeight: 700 },
  deleteBtn: {
    position: 'absolute', top: 12, right: 12,
    background: 'var(--error)', color: '#fff', border: 'none',
    width: 28, height: 28, borderRadius: '50%', fontSize: 14,
    cursor: 'pointer', fontWeight: 700,
  },
};
