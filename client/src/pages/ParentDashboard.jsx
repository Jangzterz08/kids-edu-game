import { useEffect, useState } from 'react';
import { useKid } from '../context/KidContext';
import { api } from '../lib/api';
import { MODULE_REGISTRY } from '../data/index';
import StarBadge from '../components/modules/StarBadge';
import ProgressRing from '../components/modules/ProgressRing';

export default function ParentDashboard() {
  const { kids, refreshKids } = useKid();
  const [selectedKid, setSelectedKid] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { refreshKids(); }, []);

  // Auto-select first kid once kids load
  useEffect(() => {
    if (kids.length > 0 && !selectedKid) setSelectedKid(kids[0]);
  }, [kids]);

  useEffect(() => {
    if (!selectedKid) { setProgressData(null); return; }
    setLoading(true);
    api.get(`/api/progress/${selectedKid.id}`)
      .then(d => setProgressData(d.progress))
      .catch(() => setProgressData([]))
      .finally(() => setLoading(false));
  }, [selectedKid?.id]);

  const progBySlug = (progressData || []).reduce((acc, p) => { acc[p.moduleSlug] = p; return acc; }, {});

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Progress Dashboard</h1>

      <div style={styles.kidTabs}>
        {kids.map(k => (
          <button
            key={k.id}
            style={{ ...styles.kidTab, ...(selectedKid?.id === k.id ? styles.kidTabActive : {}) }}
            onClick={() => setSelectedKid(k)}
          >
            {k.name}
          </button>
        ))}
      </div>

      {!selectedKid && kids.length === 0 && (
        <p style={styles.hint}>No kids added yet. Go to Kids to add one.</p>
      )}

      {selectedKid && loading && <p style={styles.hint}>Loading...</p>}

      {selectedKid && !loading && (
        <div style={styles.grid}>
          {MODULE_REGISTRY.map(mod => {
            const p = progBySlug[mod.slug] || { lessonsCompleted: 0, lessonsTotal: mod.lessons.length, starsEarned: 0, maxStars: mod.lessons.length * 3 };
            const pct = p.lessonsTotal > 0 ? Math.round((p.lessonsCompleted / p.lessonsTotal) * 100) : 0;
            const stars3 = Math.min(3, Math.round((p.starsEarned / (p.maxStars || 1)) * 3));
            return (
              <div key={mod.slug} style={{ ...styles.card, background: mod.bgGradient }}>
                <div style={styles.cardTop}>
                  <span style={styles.cardEmoji}>{mod.iconEmoji}</span>
                  <ProgressRing percent={pct} size={48} stroke={5} color="rgba(255,255,255,0.9)" />
                </div>
                <div style={styles.cardTitle}>{mod.title}</div>
                <div style={styles.cardSub}>{p.lessonsCompleted}/{p.lessonsTotal} lessons · {pct}%</div>
                <StarBadge stars={stars3} size="sm" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: 900, margin: '0 auto', padding: 'var(--space-xl)' },
  heading: { fontSize: 'var(--font-xl)', fontWeight: 900, marginBottom: 28 },
  kidTabs: { display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' },
  kidTab: {
    padding: '10px 24px', borderRadius: 24, border: '2px solid var(--text-muted)',
    background: 'transparent', fontWeight: 700, fontSize: 'var(--font-base)',
    cursor: 'pointer', color: 'var(--text-secondary)',
  },
  kidTabActive: { background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', color: '#fff' },
  hint: { textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--font-md)', padding: 40 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  card: { borderRadius: 20, padding: 20, color: '#fff', boxShadow: 'var(--shadow-card)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardEmoji: { fontSize: 36 },
  cardTitle: { fontSize: 'var(--font-base)', fontWeight: 800, marginBottom: 4 },
  cardSub: { fontSize: 'var(--font-sm)', opacity: 0.85, marginBottom: 8 },
};
