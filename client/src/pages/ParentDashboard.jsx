import { useEffect, useState } from 'react';
import { useKid } from '../context/KidContext';
import { api } from '../lib/api';
import { MODULE_REGISTRY } from '../data/index';
import { AVATAR_EMOJIS } from '../lib/avatars';
import StarBadge from '../components/modules/StarBadge';
import ProgressRing from '../components/modules/ProgressRing';

export default function ParentDashboard() {
  const { kids, refreshKids } = useKid();
  const [selectedKid, setSelectedKid] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { refreshKids(); }, []);

  useEffect(() => {
    if (kids.length > 0 && !selectedKid) setSelectedKid(kids[0]);
  }, [kids]);

  useEffect(() => {
    if (!selectedKid) { setProgressData([]); setStats(null); return; }
    setLoading(true);
    Promise.all([
      api.get(`/api/progress/${selectedKid.id}`),
      api.get(`/api/progress/${selectedKid.id}/stats`),
    ])
      .then(([progRes, statsRes]) => {
        setProgressData(progRes.progress || []);
        setStats(statsRes);
      })
      .catch(() => { setProgressData([]); setStats(null); })
      .finally(() => setLoading(false));
  }, [selectedKid?.id]);

  const progBySlug = progressData.reduce((acc, p) => { acc[p.moduleSlug] = p; return acc; }, {});

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>📊 Progress Dashboard</h1>

      {/* Kid tabs */}
      <div style={styles.kidTabs}>
        {kids.map(k => (
          <button
            key={k.id}
            style={{ ...styles.kidTab, ...(selectedKid?.id === k.id ? styles.kidTabActive : {}) }}
            onClick={() => setSelectedKid(k)}
          >
            <span>{AVATAR_EMOJIS[k.avatarId] || '🐻'}</span>
            <span>{k.name}</span>
          </button>
        ))}
      </div>

      {!selectedKid && kids.length === 0 && (
        <p style={styles.hint}>No kids added yet. Go to Kids to add one.</p>
      )}
      {selectedKid && loading && <p style={styles.hint}>Loading...</p>}

      {selectedKid && !loading && stats && (
        <>
          {/* Summary stat cards */}
          <div style={styles.statsRow}>
            <StatCard icon="⭐" label="Total Stars" value={stats.summary.totalStars} color="#FF9800" />
            <StatCard icon="🔥" label="Day Streak" value={stats.summary.currentStreak} color="#F44336" />
            <StatCard icon="✅" label="Lessons Done" value={stats.summary.totalLessonsCompleted} color="#4CAF50" />
          </div>

          {/* Weekly Activity */}
          <Section title="📅 This Week">
            <WeeklyChart data={stats.weeklyActivity} />
          </Section>

          {/* Game Accuracy */}
          <Section title="🎮 Game Accuracy">
            <div style={styles.accuracyCard}>
              <AccuracyBar label="🃏 Matching" score={stats.gameAccuracy.match} color="#2979FF" />
              <AccuracyBar label="✏️ Tracing"  score={stats.gameAccuracy.trace} color="#9C27B0" />
              <AccuracyBar label="❓ Quiz"     score={stats.gameAccuracy.quiz}  color="#FF9800" />
            </div>
          </Section>

          {/* Recommended Next */}
          {stats.recommended && (
            <Section title="💡 Recommended Next">
              <div style={styles.recommendedCard}>
                <span style={styles.recommendedEmoji}>{stats.recommended.iconEmoji}</span>
                <div>
                  <div style={styles.recommendedTitle}>{stats.recommended.title}</div>
                  <div style={styles.recommendedSub}>
                    {stats.recommended.pct > 0
                      ? `${stats.recommended.pct}% complete — keep going!`
                      : 'Not started yet — try this next!'}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Module Progress Grid */}
          <Section title="📚 All Modules">
            <div style={styles.grid}>
              {MODULE_REGISTRY.map(mod => {
                const p = progBySlug[mod.slug] || {
                  lessonsCompleted: 0,
                  lessonsTotal: mod.lessons.length,
                  starsEarned: 0,
                  maxStars: mod.lessons.length * 3,
                };
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
          </Section>
        </>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `4px solid ${color}` }}>
      <span style={{ fontSize: 32 }}>{icon}</span>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function WeeklyChart({ data }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={styles.weeklyChart}>
      {data.map((d, i) => (
        <div key={i} style={styles.weekCol}>
          <div style={styles.barArea}>
            <div
              style={{
                ...styles.bar,
                height: d.count > 0 ? `${Math.round((d.count / maxCount) * 100)}%` : '4px',
                background: d.count > 0 ? 'var(--accent-blue)' : 'var(--bg-surface-alt)',
              }}
            />
          </div>
          <div style={styles.barCount}>{d.count > 0 ? d.count : ''}</div>
          <div style={styles.barDay}>{d.day}</div>
        </div>
      ))}
    </div>
  );
}

function AccuracyBar({ label, score, color }) {
  return (
    <div style={styles.accuracyRow}>
      <div style={styles.accuracyLabel}>{label}</div>
      <div style={styles.accuracyTrack}>
        {score !== null ? (
          <div style={{ ...styles.accuracyFill, width: `${score}%`, background: color }} />
        ) : (
          <span style={styles.accuracyEmpty}>No data yet</span>
        )}
      </div>
      {score !== null && <div style={{ ...styles.accuracyPct, color }}>{score}%</div>}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  container: { maxWidth: 900, margin: '0 auto', padding: 'var(--space-xl)' },
  heading: { fontSize: 'var(--font-xl)', fontWeight: 900, marginBottom: 28 },

  kidTabs: { display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' },
  kidTab: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 24px', borderRadius: 24, border: '2px solid var(--text-muted)',
    background: 'transparent', fontWeight: 700, fontSize: 'var(--font-base)',
    cursor: 'pointer', color: 'var(--text-secondary)',
  },
  kidTabActive: { background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', color: '#fff' },
  hint: { textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--font-md)', padding: 40 },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 },
  statCard: {
    background: 'var(--bg-surface)', borderRadius: 20, padding: '24px 20px',
    textAlign: 'center', boxShadow: 'var(--shadow-card)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  },
  statValue: { fontSize: 40, fontWeight: 900, lineHeight: 1 },
  statLabel: { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' },

  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 'var(--font-base)', fontWeight: 800, marginBottom: 12 },

  weeklyChart: {
    background: 'var(--bg-surface)', borderRadius: 20,
    padding: '20px 20px 14px', display: 'flex', gap: 8,
    boxShadow: 'var(--shadow-card)',
  },
  weekCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  barArea: { width: '100%', height: 72, display: 'flex', alignItems: 'flex-end' },
  bar: { width: '100%', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease', minHeight: 4 },
  barCount: { fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', height: 16, lineHeight: '16px' },
  barDay: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' },

  accuracyCard: {
    background: 'var(--bg-surface)', borderRadius: 20, padding: '20px 24px',
    boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 18,
  },
  accuracyRow: { display: 'flex', alignItems: 'center', gap: 12 },
  accuracyLabel: { width: 110, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 },
  accuracyTrack: {
    flex: 1, height: 18, background: 'var(--bg-surface-alt)', borderRadius: 9, overflow: 'hidden',
    display: 'flex', alignItems: 'center',
  },
  accuracyFill: { height: '100%', borderRadius: 9, transition: 'width 0.5s ease' },
  accuracyEmpty: { fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: 10 },
  accuracyPct: { width: 38, textAlign: 'right', fontSize: 14, fontWeight: 800, flexShrink: 0 },

  recommendedCard: {
    background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
    borderRadius: 20, padding: '20px 24px',
    display: 'flex', alignItems: 'center', gap: 16,
    border: '2px solid #81C784', boxShadow: 'var(--shadow-card)',
  },
  recommendedEmoji: { fontSize: 48 },
  recommendedTitle: { fontSize: 'var(--font-base)', fontWeight: 800, color: '#1B5E20' },
  recommendedSub: { fontSize: 'var(--font-sm)', color: '#388E3C', marginTop: 4 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  card: { borderRadius: 20, padding: 20, color: '#fff', boxShadow: 'var(--shadow-card)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardEmoji: { fontSize: 36 },
  cardTitle: { fontSize: 'var(--font-base)', fontWeight: 800, marginBottom: 4 },
  cardSub: { fontSize: 'var(--font-sm)', opacity: 0.85, marginBottom: 8 },
};
