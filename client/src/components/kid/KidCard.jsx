import { AVATAR_EMOJIS } from '../../lib/avatars';

export default function KidCard({ kid, onClick, active, onDelete, onSetPin, onSetPic }) {
  return (
    <div
      style={{ ...styles.card, ...(active ? styles.active : {}) }}
      onClick={onClick}
    >
      <div style={styles.avatarWrap}>
        <div style={styles.avatar}>{AVATAR_EMOJIS[kid.avatarId] || '🐻'}</div>
        {onSetPic && (
          <button
            style={styles.picBtn}
            onClick={e => { e.stopPropagation(); onSetPic(kid); }}
            aria-label="Change avatar"
          >✏️</button>
        )}
      </div>
      <div style={styles.name}>{kid.name}</div>
      <div style={styles.stars}>⭐ {kid.totalStars} stars</div>
      {kid.pin ? (
        <div style={styles.pinBadge}>🔑 PIN set</div>
      ) : onSetPin ? (
        <button
          style={styles.pinBtn}
          onClick={e => { e.stopPropagation(); onSetPin(kid); }}
        >🔑 Set PIN</button>
      ) : null}
      {onDelete && (
        <button
          style={styles.deleteBtn}
          onClick={e => { e.stopPropagation(); onDelete(kid); }}
          aria-label={`Remove ${kid.name}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: 'rgba(255,255,255,0.45)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 28, padding: 24,
    textAlign: 'center', cursor: 'pointer', position: 'relative',
    border: '2px solid rgba(255,255,255,0.7)',
    transition: 'transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.2s',
    boxShadow: '0 8px 24px rgba(0,80,120,0.18)',
    fontFamily: 'Fredoka, sans-serif',
  },
  active: {
    borderColor: '#3BBFE8',
    transform: 'scale(1.06) translateY(-4px)',
    boxShadow: '0 16px 40px rgba(59,191,232,0.4)',
  },
  avatarWrap: { position: 'relative', display: 'inline-block', marginBottom: 8 },
  avatar: { fontSize: 64, display: 'block' },
  picBtn: {
    position: 'absolute', bottom: -4, right: -4,
    background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(59,191,232,0.5)',
    borderRadius: '50%', width: 24, height: 24,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, cursor: 'pointer', lineHeight: 1,
  },
  name:   { fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: 4, color: '#0A4A6E' },
  stars:  { fontSize: 'var(--font-sm)', color: '#E8A030', fontWeight: 700 },
  pinBadge: {
    fontSize: 'var(--font-xs)', fontWeight: 700, color: '#2E9E40', marginTop: 4,
  },
  pinBtn: {
    marginTop: 6,
    background: 'rgba(59,191,232,0.15)',
    border: '1.5px solid rgba(59,191,232,0.5)',
    color: '#0A6B8A', padding: '4px 12px', borderRadius: 10,
    fontWeight: 700, fontSize: 'var(--font-xs)', cursor: 'pointer',
    fontFamily: 'Fredoka, sans-serif',
  },
  deleteBtn: {
    position: 'absolute', top: 12, right: 12,
    background: 'rgba(200,112,96,0.15)', color: '#C87060', border: 'none',
    width: 28, height: 28, borderRadius: '50%',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};
