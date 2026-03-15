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
      style={styles.card}
      onClick={() => navigate(`/play/${mod.slug}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(99,102,241,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)';
      }}
    >
      <div style={styles.topRow}>
        <div style={{ ...styles.iconWrap, background: (mod.color || '#6366F1') + '22' }}>
          <span style={styles.emoji}>{mod.iconEmoji}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isCompleted && <span style={styles.completedBadge}>✅</span>}
          <ProgressRing percent={pct} size={48} stroke={5} color="#6366F1" />
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
    background: '#FFFFFF',
    border: '1.5px solid #F1F5F9',
    borderRadius: 20,
    padding: 'var(--space-lg)',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
    transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s',
    minHeight: 180,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    position: 'relative', overflow: 'hidden',
  },
  topRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconWrap: {
    width: 64, height: 64, borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  emoji: {
    fontSize: 40,
    display: 'inline-block',
    animation: 'float-soft 3s infinite ease-in-out',
  },
  title: { fontSize: 'var(--font-base)', fontWeight: 900, marginTop: 8, color: '#1E293B' },
  sub:   { fontSize: 'var(--font-xs)', color: '#94A3B8', marginBottom: 8, fontWeight: 700 },
  completedBadge: { fontSize: 22 },
};
