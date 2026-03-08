import { useNavigate, useParams } from 'react-router-dom';
import { getModule } from '../data/index';

export default function ModuleIntro() {
  const { moduleSlug } = useParams();
  const navigate = useNavigate();
  const mod = getModule(moduleSlug);

  if (!mod) return <div className="page-center">Module not found</div>;

  return (
    <div className="page-center" style={{ ...styles.bg, background: mod.bgGradient }}>
      <div style={styles.card}>
        <div style={styles.emoji}>{mod.iconEmoji}</div>
        <h1 style={styles.title}>{mod.title}</h1>
        <p style={styles.sub}>{mod.lessons.length} fun lessons to explore!</p>
        <div style={styles.pills}>
          {mod.games.map(g => (
            <span key={g} style={styles.pill}>{g === 'matching' ? '🃏 Match' : g === 'tracing' ? '✏️ Trace' : '❓ Quiz'}</span>
          ))}
        </div>
        <button
          className="kid-btn"
          style={styles.btn}
          onClick={() => navigate(`/play/${moduleSlug}/lesson`)}
        >
          Let's Go! 🚀
        </button>
        <button
          className="kid-btn ghost"
          style={{ ...styles.btn, marginTop: 12 }}
          onClick={() => navigate('/play')}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

const styles = {
  bg: { minHeight: '100vh' },
  card: {
    background: 'rgba(255,255,255,0.95)', borderRadius: 'var(--modal-radius)',
    padding: 48, textAlign: 'center', maxWidth: 400, width: '90%',
    boxShadow: 'var(--shadow-modal)', animation: 'bounce-in 0.4s ease',
  },
  emoji: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 'var(--font-xl)', fontWeight: 900, marginBottom: 8 },
  sub: { fontSize: 'var(--font-base)', color: 'var(--text-secondary)', marginBottom: 20 },
  pills: { display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' },
  pill: {
    background: 'var(--bg-surface-alt)', padding: '6px 14px', borderRadius: 20,
    fontSize: 'var(--font-sm)', fontWeight: 700,
  },
  btn: { width: '100%', display: 'flex', justifyContent: 'center' },
};
