import { useState } from 'react';

const roles = [
  {
    id: 'kid',
    emoji: '🎮',
    label: 'Kid',
    sub: "Let's play!",
    gradient: 'linear-gradient(140deg, #FF8C3A, #E86020)',
    glow: 'rgba(255,140,58,0.5)',
    border: 'rgba(255,255,255,0.6)',
  },
  {
    id: 'parent',
    emoji: '👨‍👩‍👧',
    label: 'Parent',
    sub: 'Track progress',
    gradient: 'linear-gradient(140deg, #3BBFE8, #1A9EC8)',
    glow: 'rgba(59,191,232,0.5)',
    border: 'rgba(255,255,255,0.6)',
  },
  {
    id: 'teacher',
    emoji: '📚',
    label: 'Teacher',
    sub: 'Manage class',
    gradient: 'linear-gradient(140deg, #4CC860, #2E9E40)',
    glow: 'rgba(76,200,96,0.5)',
    border: 'rgba(255,255,255,0.6)',
  },
];

export default function RoleSelector({ onSelect }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={s.container}>
      <p style={s.prompt}>Who are you?</p>
      <p style={s.sub}>Choose your role to get started</p>
      <div style={s.grid}>
        {roles.map(r => (
          <button
            key={r.id}
            style={{
              ...s.card,
              background: r.gradient,
              border: `1.5px solid ${r.border}`,
              boxShadow: hovered === r.id
                ? `0 16px 40px ${r.glow}, 0 0 0 2px ${r.border}`
                : `0 8px 24px rgba(0,0,0,0.3)`,
              transform: hovered === r.id ? 'translateY(-8px) scale(1.04)' : 'none',
            }}
            onClick={() => onSelect(r.id)}
            onMouseEnter={() => setHovered(r.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <span style={s.emoji}>{r.emoji}</span>
            <span style={s.label}>{r.label}</span>
            <span style={s.roleSub}>{r.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const s = {
  container: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%',
  },
  prompt: {
    fontSize: 'var(--font-lg)', fontWeight: 700,
    color: '#0A4A6E', margin: 0,
    textShadow: '0 1px 3px rgba(255,255,255,0.5)',
  },
  sub: {
    fontSize: 14, fontWeight: 500,
    color: '#1A7A9A',
    margin: '0 0 20px',
  },
  grid: {
    display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', width: '100%',
  },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '24px 20px', borderRadius: 24,
    cursor: 'pointer', minWidth: 100, flex: 1,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    transition: 'transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.2s',
    fontFamily: 'Fredoka, sans-serif',
  },
  emoji: { fontSize: 44, lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' },
  label: { fontSize: 20, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.3)' },
  roleSub: { fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.75)' },
};
