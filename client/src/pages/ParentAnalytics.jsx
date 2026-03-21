import { useState, useEffect } from 'react';
import { useKid } from '../context/KidContext';
import { api } from '../lib/api';
import { AVATAR_EMOJIS } from '../lib/avatars';
import DailyMinutesChart from '../components/analytics/DailyMinutesChart';
import ModuleStarsChart from '../components/analytics/ModuleStarsChart';

export default function ParentAnalytics() {
  const { kids, refreshKids } = useKid();
  const [selectedKid, setSelectedKid] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { refreshKids(); }, []);

  useEffect(() => {
    if (kids.length > 0 && !selectedKid) setSelectedKid(kids[0]);
  }, [kids]);

  useEffect(() => {
    if (!selectedKid) { setAnalyticsData(null); return; }
    setLoading(true);
    setError(null);
    api.get(`/api/parent/analytics/${selectedKid.id}?period=7d`)
      .then(data => setAnalyticsData(data))
      .catch(err => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [selectedKid?.id]);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Analytics</h1>

      {/* Kid tabs */}
      <div style={styles.kidTabs}>
        {kids.map(k => (
          <button
            key={k.id}
            style={{
              ...styles.kidTab,
              ...(selectedKid?.id === k.id ? styles.kidTabActive : {}),
            }}
            onClick={() => setSelectedKid(k)}
          >
            <span>{AVATAR_EMOJIS[k.avatarId] || '🐻'}</span>
            <span>{k.name}</span>
          </button>
        ))}
      </div>

      {kids.length === 0 && (
        <p style={styles.hint}>No kids added yet. Go to Kids to add one.</p>
      )}

      {loading && <p style={styles.hint}>Loading analytics...</p>}
      {error && <p style={{ ...styles.hint, color: 'var(--accent-red, #ef4444)' }}>{error}</p>}

      {selectedKid && analyticsData && !loading && (
        <>
          {/* Daily Minutes Chart */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Time in App This Week</h2>
            <div style={styles.chartCard}>
              <DailyMinutesChart data={analyticsData.dailyMinutes || []} />
            </div>
          </div>

          {/* Module Stars Chart */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Module Progress</h2>
            <div style={styles.chartCard}>
              <ModuleStarsChart data={analyticsData.moduleStars || []} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: 'var(--space-xl, 32px)',
  },
  heading: {
    fontSize: 'var(--font-xl, 28px)',
    fontWeight: 900,
    marginBottom: 28,
    color: 'var(--text-primary, #fff)',
  },
  kidTabs: {
    display: 'flex',
    gap: 12,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  kidTab: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 24px',
    borderRadius: 24,
    border: '2px solid var(--text-muted, #555)',
    background: 'transparent',
    fontWeight: 700,
    fontSize: 'var(--font-base, 16px)',
    cursor: 'pointer',
    color: 'var(--text-secondary, #aaa)',
    fontFamily: 'inherit',
  },
  kidTabActive: {
    background: 'var(--accent-blue, #0EA5E9)',
    borderColor: 'var(--accent-blue, #0EA5E9)',
    color: '#fff',
  },
  hint: {
    textAlign: 'center',
    color: 'var(--text-secondary, #aaa)',
    fontSize: 'var(--font-md, 18px)',
    padding: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 'var(--font-base, 16px)',
    fontWeight: 800,
    marginBottom: 12,
    color: 'var(--text-primary, #fff)',
  },
  chartCard: {
    background: 'var(--bg-surface, #1e2a3a)',
    borderRadius: 20,
    padding: '20px 16px 12px',
    boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.3))',
  },
};
