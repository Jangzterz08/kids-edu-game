import { useNavigate } from 'react-router-dom';
import ProgressRing from './ProgressRing';
import StarBadge from './StarBadge';
import { getModule } from '../../data/index';

export default function ModuleCard({ moduleSlug, serverMeta, progressData, completed: isCompleted }) {
  const navigate = useNavigate();
  const mod      = getModule(moduleSlug);
  if (!mod) return null;

  const total     = mod.lessons.length;
  const completed = progressData?.lessonsCompleted ?? 0;
  const stars     = progressData?.starsEarned ?? 0;
  const maxStars  = progressData?.maxStars ?? total * 3;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className="glass-panel"
      style={styles.card}
      onClick={() => navigate(`/play/${mod.slug}`)}
      onMouseEnter={(e) => { 
        e.currentTarget.style.transform = 'translateY(-12px) scale(1.03)'; 
        e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0, 229, 255, 0.3)'; 
      }}
      onMouseLeave={(e) => { 
        e.currentTarget.style.transform = ''; 
        e.currentTarget.style.boxShadow = ''; 
      }}
    >
      <div style={styles.topRow}>
        <div style={styles.emojiContainer}>
          <div style={styles.glowBehind}></div>
          <span style={styles.emoji}>{mod.iconEmoji}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isCompleted && <span style={styles.completedBadge}>✅</span>}
          <ProgressRing percent={pct} size={52} stroke={5} color="rgba(255,255,255,0.9)" />
        </div>
      </div>
      <div style={styles.title}>{mod.title}</div>
      <div style={styles.sub}>{completed}/{total} lessons</div>
      <StarBadge stars={Math.min(3, Math.round((stars / maxStars) * 3))} size="sm" />
    </div>
  );
}

const styles = {
  card: {
    padding: 'var(--space-lg)',
    cursor: 'pointer', color: '#fff',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    minHeight: 180,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    position: 'relative', overflow: 'hidden',
  },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  emojiContainer: { position: 'relative' },
  glowBehind: {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: 60, height: 60, background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
    filter: 'blur(8px)', borderRadius: '50%',
  },
  emoji: { 
    fontSize: 56, position: 'relative', zIndex: 2, 
    filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.5))',
    display: 'inline-block', animation: 'float-organic 5s infinite ease-in-out'
  },
  title: { fontSize: 'var(--font-lg)', fontWeight: 900, marginTop: 12, textShadow: '0 2px 8px rgba(0,0,0,0.5)' },
  sub: { fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 700 },
  completedBadge: { fontSize: 24, filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' },
};
