import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useKid } from '../context/KidContext';
import { api } from '../lib/api';
import { MODULE_REGISTRY } from '../data/index';
import { AVATAR_EMOJIS } from '../lib/avatars';
import StarBadge from '../components/modules/StarBadge';
import ProgressRing from '../components/modules/ProgressRing';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { kids, refreshKids } = useKid();
  const [selectedKid, setSelectedKid] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Subscription state
  const [subscription, setSubscription] = useState(null);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => { refreshKids(); }, []);

  // Detect checkout result from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      toast.success('Subscription activated! All modules unlocked.');
      window.history.replaceState({}, '', '/parent');
    } else if (params.get('checkout') === 'cancel') {
      toast('Checkout cancelled — you can upgrade any time.');
      window.history.replaceState({}, '', '/parent');
    }
  }, []);

  useEffect(() => {
    if (kids.length > 0 && !selectedKid) setSelectedKid(kids[0]);
  }, [kids]);

  // Fetch subscription data from first kid's home-summary
  useEffect(() => {
    if (kids.length > 0) {
      api.get(`/api/kids/${kids[0].id}/home-summary`)
        .then(data => {
          setSubscription(data?.subscription || null);
        })
        .catch(() => {});
    }
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

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await api.get('/api/billing/portal');
      window.open(res.url, '_blank');
    } catch {
      toast.error("Couldn't open billing portal — please try again.");
    } finally { setPortalLoading(false); }
  }

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await api.post('/api/billing/checkout', { plan: selectedPlan });
      window.location.href = res.url;
    } catch {
      toast.error("Couldn't start checkout — please try again.");
      setCheckoutLoading(false);
    }
  }

  const progBySlug = progressData.reduce((acc, p) => { acc[p.moduleSlug] = p; return acc; }, {});

  // Determine checkout button label
  const isTrialing = subscription?.status === 'trialing';
  let checkoutLabel = 'Subscribe';
  if (isTrialing) {
    checkoutLabel = 'Start Free Trial';
  } else if (selectedPlan === 'monthly') {
    checkoutLabel = 'Subscribe to Monthly Plan';
  } else if (selectedPlan === 'annual') {
    checkoutLabel = 'Subscribe to Annual Plan';
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>📊 Progress Dashboard</h1>

      {/* Subscription Section */}
      {kids.length > 0 && (
        subscription === null ? (
          // Loading skeleton
          <div style={subStyles.skeleton} aria-hidden="true" />
        ) : (
          <SubscriptionSection
            subscription={subscription}
            showPlanPicker={showPlanPicker}
            setShowPlanPicker={setShowPlanPicker}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            checkoutLoading={checkoutLoading}
            portalLoading={portalLoading}
            handleManageBilling={handleManageBilling}
            handleCheckout={handleCheckout}
            checkoutLabel={checkoutLabel}
          />
        )
      )}

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
        <button
          style={styles.analyticsBtn}
          onClick={() => navigate('/parent/analytics')}
        >
          View Analytics
        </button>
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

// ── SubscriptionSection ──────────────────────────────────────────────────────

function SubscriptionSection({
  subscription,
  showPlanPicker,
  setShowPlanPicker,
  selectedPlan,
  setSelectedPlan,
  checkoutLoading,
  portalLoading,
  handleManageBilling,
  handleCheckout,
  checkoutLabel,
}) {
  const status = subscription?.status || 'none';

  const STATUS_PILL_COLORS = {
    trialing: { background: 'rgba(245,158,11,0.15)', color: 'var(--orange)' },
    active:   { background: 'rgba(16,185,129,0.15)', color: 'var(--green)' },
    canceled: { background: 'rgba(107,114,128,0.15)', color: '#6B7280' },
    past_due: { background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' },
    none:     { background: 'rgba(107,114,128,0.15)', color: '#6B7280' },
  };
  const STATUS_LABELS = {
    trialing: 'Free Trial',
    active:   'Active',
    canceled: 'Cancelled',
    past_due: 'Payment issue',
    none:     'Free plan',
  };

  const pillStyle = STATUS_PILL_COLORS[status] || STATUS_PILL_COLORS.none;
  const pillLabel = STATUS_LABELS[status] || 'Free plan';

  if (status === 'active') {
    // Active subscriber — show plan management
    const nextBilling = subscription.subscriptionEnd
      ? new Date(subscription.subscriptionEnd).toLocaleDateString()
      : '—';
    return (
      <div style={subStyles.section}>
        <div style={subStyles.activeRow}>
          <div>
            <span style={subStyles.premiumHeading}>Premium Plan</span>
            <span style={{ ...subStyles.pill, ...pillStyle }}>{pillLabel}</span>
          </div>
          <div style={subStyles.billingInfo}>
            Next billing: {nextBilling}
          </div>
        </div>
        <button
          style={subStyles.ghostBtn}
          aria-label="Manage billing -- opens Stripe Customer Portal in a new tab"
          onClick={handleManageBilling}
          disabled={portalLoading}
        >
          {portalLoading ? 'Opening portal...' : 'Manage billing'}
        </button>
      </div>
    );
  }

  if (status === 'past_due') {
    return (
      <div
        style={{ ...subStyles.banner, borderLeft: '4px solid var(--accent-red)' }}
        role="alert"
      >
        <div style={subStyles.bannerHeading}>Payment issue — modules locked.</div>
        <div style={subStyles.bannerBody}>Update your payment method to restore access.</div>
        <button
          style={{ ...subStyles.ghostBtn, marginTop: 'var(--space-md)' }}
          onClick={handleManageBilling}
          disabled={portalLoading}
        >
          {portalLoading ? 'Opening portal...' : 'Fix billing'}
        </button>
      </div>
    );
  }

  // trialing, none, canceled — show upgrade banner + optional plan picker
  const isTrialing = status === 'trialing';
  let bannerHeading = 'Unlock all 13 modules.';
  let bannerBody = 'Your kids are on the free plan — only 3 modules available.';

  if (isTrialing && subscription?.trialEndsAt) {
    const daysLeft = Math.max(1, Math.ceil((new Date(subscription.trialEndsAt) - Date.now()) / 86400000));
    bannerHeading = `${daysLeft} days left in your free trial`;
    bannerBody = 'Upgrade to unlock all 13 modules after your trial ends.';
  }

  return (
    <div
      style={{ ...subStyles.banner, borderLeft: '4px solid var(--primary)' }}
      role="status"
    >
      <div style={subStyles.bannerHeading}>{bannerHeading}</div>
      <div style={subStyles.bannerBody}>{bannerBody}</div>

      {!showPlanPicker && (
        <button
          style={{ ...subStyles.ghostBtn, marginTop: 'var(--space-md)' }}
          onClick={() => setShowPlanPicker(true)}
        >
          Upgrade Now
        </button>
      )}

      {showPlanPicker && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          <div
            role="radiogroup"
            aria-label="Choose your plan"
            style={subStyles.planGrid}
          >
            {/* Monthly plan card */}
            <div
              role="radio"
              aria-checked={selectedPlan === 'monthly'}
              tabIndex={0}
              style={{
                ...subStyles.planCard,
                ...(selectedPlan === 'monthly' ? subStyles.planCardSelected : {}),
              }}
              onClick={() => setSelectedPlan('monthly')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedPlan('monthly'); }}
            >
              <div style={subStyles.planPrice}>$4.99 / month</div>
              <div style={subStyles.planSub}>Billed monthly</div>
            </div>

            {/* Annual plan card */}
            <div
              role="radio"
              aria-checked={selectedPlan === 'annual'}
              tabIndex={0}
              style={{
                ...subStyles.planCard,
                ...(selectedPlan === 'annual' ? subStyles.planCardSelected : {}),
              }}
              onClick={() => setSelectedPlan('annual')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedPlan('annual'); }}
            >
              <span style={subStyles.badge}>Best value</span>
              <div style={subStyles.planPrice}>$39.99 / year</div>
              <div style={subStyles.planSub}>Billed annually</div>
              <div style={{ color: 'var(--green)', fontWeight: 600, fontSize: 'var(--font-sm)', marginTop: 4 }}>
                Save 33%
              </div>
            </div>
          </div>

          <button
            style={{
              ...subStyles.ghostBtn,
              marginTop: 'var(--space-md)',
              width: '100%',
              opacity: !selectedPlan ? 0.5 : 1,
              cursor: !selectedPlan ? 'not-allowed' : 'pointer',
            }}
            disabled={!selectedPlan || checkoutLoading}
            onClick={handleCheckout}
          >
            {checkoutLoading ? 'Opening Stripe...' : checkoutLabel}
          </button>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-sm)' }}>
            <button
              style={subStyles.maybeLaterBtn}
              onClick={() => { setShowPlanPicker(false); }}
            >
              Maybe later
            </button>
          </div>
        </div>
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

// ── Subscription Styles ──────────────────────────────────────────────────────

const subStyles = {
  skeleton: {
    height: 80,
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    marginBottom: 'var(--space-lg)',
    animation: 'pulse-glow 1.5s ease-in-out infinite',
  },
  section: {
    background: 'var(--glass-bg)',
    borderRadius: 16,
    padding: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
    backdropFilter: 'blur(10px)',
  },
  banner: {
    background: 'var(--glass-bg)',
    borderRadius: 12,
    padding: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
    backdropFilter: 'blur(10px)',
  },
  bannerHeading: {
    fontSize: 'var(--font-md)',
    fontWeight: 600,
    color: '#fff',
    marginBottom: 4,
  },
  bannerBody: {
    fontSize: 'var(--font-base)',
    color: 'var(--text-secondary)',
  },
  activeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-sm)',
  },
  premiumHeading: {
    fontSize: 'var(--font-md)',
    fontWeight: 600,
    color: '#fff',
    marginRight: 'var(--space-sm)',
  },
  pill: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
  },
  billingInfo: {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
  },
  ghostBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.4)',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 12,
    minHeight: 44,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 'var(--font-base)',
    fontWeight: 600,
  },
  planGrid: {
    display: 'flex',
    gap: 'var(--space-md)',
  },
  planCard: {
    flex: 1,
    background: 'var(--glass-bg)',
    borderRadius: 12,
    padding: 'var(--space-md)',
    border: '1.5px solid var(--glass-border)',
    minHeight: 160,
    position: 'relative',
    cursor: 'pointer',
  },
  planCardSelected: {
    border: '2px solid var(--primary)',
    background: 'rgba(14,165,233,0.12)',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'var(--green)',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 8,
    fontSize: 'var(--font-xs, 14px)',
    fontWeight: 600,
  },
  planPrice: {
    fontSize: 'var(--font-md)',
    fontWeight: 600,
    color: '#fff',
    marginBottom: 4,
  },
  planSub: {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
  },
  maybeLaterBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 'var(--font-sm)',
    padding: '4px 8px',
  },
};

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  container: { maxWidth: 900, margin: '0 auto', padding: 'var(--space-xl)' },
  heading: { fontSize: 'var(--font-xl)', fontWeight: 900, marginBottom: 28 },

  kidTabs: { display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' },
  kidTab: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 24px', borderRadius: 24, border: '2px solid var(--text-muted)',
    background: 'transparent', fontWeight: 700, fontSize: 'var(--font-base)',
    cursor: 'pointer', color: 'var(--text-secondary)',
  },
  kidTabActive: { background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', color: '#fff' },
  analyticsBtn: {
    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 20px', borderRadius: 24,
    border: '2px solid var(--primary, #6C5CE7)',
    background: 'transparent', fontWeight: 700, fontSize: 'var(--font-base)',
    cursor: 'pointer', color: 'var(--primary, #6C5CE7)', fontFamily: 'inherit',
  },
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
