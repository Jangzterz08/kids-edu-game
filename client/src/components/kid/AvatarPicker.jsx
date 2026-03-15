const AVATARS = [
  { id: 'bear',    emoji: '🐻' },
  { id: 'lion',    emoji: '🦁' },
  { id: 'rabbit',  emoji: '🐰' },
  { id: 'cat',     emoji: '🐱' },
  { id: 'dog',     emoji: '🐶' },
  { id: 'owl',     emoji: '🦉' },
  { id: 'fox',     emoji: '🦊' },
  { id: 'penguin', emoji: '🐧' },
];

export default function AvatarPicker({ value, onChange }) {
  return (
    <div style={styles.grid}>
      {AVATARS.map(a => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          style={{ ...styles.item, ...(value === a.id ? styles.selected : {}) }}
          type="button"
        >
          <span style={styles.emoji}>{a.emoji}</span>
        </button>
      ))}
    </div>
  );
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  item: {
    background: 'rgba(255,255,255,0.4)', border: '3px solid transparent',
    borderRadius: 20, padding: 12, cursor: 'pointer',
    transition: 'border-color 0.15s, transform 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  selected: {
    borderColor: '#3BBFE8', transform: 'scale(1.1)',
    background: 'rgba(59,191,232,0.2)',
    boxShadow: '0 4px 12px rgba(59,191,232,0.35)',
  },
  emoji: { fontSize: 40 },
};
