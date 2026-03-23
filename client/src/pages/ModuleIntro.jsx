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
            if (g === 'pattern') label = '🔁 Pattern';
            if (g === 'oddOneOut') label = '❓ Odd One Out';
            if (g === 'scramble') label = '🔀 Scramble';
            if (g === 'sort') label = '🔢 Sort';
            if (g === 'trueFalse') label = '✅ True or False';
            if (g === 'memoryMatch') label = '🧠 Memory Match';
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
    background: 'rgba(255,255,255,0.45)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '2px solid rgba(255,255,255,0.7)',
    boxShadow: '0 20px 60px rgba(0,80,120,0.2)',
    animation: 'bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  emoji: {
    fontSize: 100, marginBottom: 20,
    filter: 'drop-shadow(0 4px 18px rgba(59,191,232,0.35))',
    animation: 'float-organic 5s infinite ease-in-out',
    display: 'block',
  },
  title: { fontSize: 'var(--font-2xl)', fontWeight: 700, marginBottom: 12, color: '#0A4A6E', textShadow: '0 1px 4px rgba(255,255,255,0.5)' },
  sub:   { fontSize: 'var(--font-base)', color: '#1A7A9A', marginBottom: 28, fontWeight: 500 },
  pills: { display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 36, flexWrap: 'wrap' },
  pill: {
    background: 'rgba(59,191,232,0.15)', padding: '8px 18px', borderRadius: 24,
    fontSize: 'var(--font-sm)', fontWeight: 700, color: '#0A6B8A',
    border: '1.5px solid rgba(59,191,232,0.4)',
  },
  btn: { width: '100%', display: 'flex', justifyContent: 'center' },
};
