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
      style={{ ...styles.card, background: mod.bgGradient }}
      onClick={() => navigate(`/play/${mod.slug}`)}
    >
      <div style={styles.topRow}>
        <span style={styles.emoji}>{mod.iconEmoji}</span>
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
    borderRadius: 'var(--card-radius)', padding: 'var(--space-lg)',
    cursor: 'pointer', color: '#fff',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: 'var(--shadow-card)',
    minHeight: 160,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  emoji: { fontSize: 48 },
  title: { fontSize: 'var(--font-md)', fontWeight: 900, marginTop: 4 },
  sub: { fontSize: 'var(--font-sm)', opacity: 0.85, marginBottom: 4 },
  completedBadge: { fontSize: 20 },
};
