import { useNavigate, useParams } from 'react-router-dom';
import { getModule } from '../data/index';

export default function ModuleIntro() {
  const { moduleSlug } = useParams();
  const navigate = useNavigate();
  const mod = getModule(moduleSlug);

  if (!mod) return <div className="page-center">Module not found</div>;

  return (
    <div className="page-center" style={styles.bg}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.emoji}>{mod.iconEmoji}</div>
        <h1 style={styles.title}>{mod.title}</h1>
        <p style={styles.sub}>{mod.lessons.length} fun lessons to explore!</p>
        <div style={styles.pills}>
          {mod.games.map(g => {
            let label = '❓ Quiz';
            if (g === 'matching') label = '🃏 Match';
            if (g === 'tracing') label = '✏️ Trace';
            if (g === 'spelling') label = '🔤 Spell';
            if (g === 'phonics') label = '🔊 Phonics';
            return <span key={g} style={styles.pill}>{label}</span>;
          })}
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
  bg: { minHeight: '100vh', padding: 'var(--space-2xl) var(--space-xl)' },
  card: {
    padding: '48px 32px', textAlign: 'center', maxWidth: 440, width: '100%',
    animation: 'bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  emoji: { 
    fontSize: 100, marginBottom: 20, 
    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
    animation: 'float-organic 5s infinite ease-in-out'
  },
  title: { fontSize: 'var(--font-2xl)', fontWeight: 900, marginBottom: 16, color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.6)' },
  sub: { fontSize: 'var(--font-lg)', color: 'var(--text-secondary)', marginBottom: 28, fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  pills: { display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 36, flexWrap: 'wrap' },
  pill: {
    background: 'rgba(255,255,255,0.15)', padding: '8px 18px', borderRadius: 24,
    fontSize: 'var(--font-sm)', fontWeight: 800, color: '#fff',
    border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', textShadow: '0 1px 3px rgba(0,0,0,0.5)'
  },
  btn: { width: '100%', display: 'flex', justifyContent: 'center' },
};
