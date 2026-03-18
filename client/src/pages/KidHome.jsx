import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKid } from '../context/KidContext';
import { MODULE_REGISTRY, getModule } from '../data/index';
import { api } from '../lib/api';
import OllieMascot from '../components/OllieMascot';
import StarBadge from '../components/modules/StarBadge';

function getOllieMessage(streak, earnedCount, totalCount, dailyDone) {
  const hour = new Date().getHours();
  if (dailyDone) return 'Challenge done! 🏆';
  if (streak >= 14) return `${streak} days! Legendary! 🔥`;
  if (streak >= 7) return `${streak} day streak! Amazing! 🔥`;
  if (streak >= 3) return `${streak} days in a row! ⭐`;
  if (earnedCount === totalCount && totalCount > 0) return 'All modules done! 🎉';
  if (earnedCount === 0) {
    if (hour < 12) return 'Good morning! 🌅';
    if (hour < 17) return 'Ready to learn? 🎓';
    return 'Evening session! 🌙';
  }
  if (hour < 12) return 'Good morning! 🌅';
  if (hour < 17) return 'Keep going! 💪';
  return 'Learning tonight! 🌙';
}

const AVATAR_EMOJIS = {
  bear: '🐻', lion: '🦁', rabbit: '🐰', cat: '🐱',
  dog: '🐶', owl: '🦉', fox: '🦊', penguin: '🐧',
  frog: '🐸', chick: '🐥', hamster: '🐹', panda: '🐼',
  butterfly: '🦋', dragon: '🐉', dino: '🦖', unicorn: '🦄',
};

const CATEGORIES = [
  { id: 'all',      label: 'All Subjects', emoji: '⭐', slugs: null },
  { id: 'language', label: 'Language',     emoji: '📚', slugs: ['alphabet', 'manners'] },
  { id: 'math',     label: 'Math & Logic', emoji: '🔢', slugs: ['numbers', 'shapes', 'logic'] },
  { id: 'about-me', label: 'About Me',     emoji: '🧒', slugs: ['body-parts', 'emotions'] },
  { id: 'world',    label: 'World',        emoji: '🌍', slugs: ['colors', 'animals', 'household', 'food-pyramid', 'weather', 'days-of-week'] },
];

// Card gradient per module color
function cardGradient(color) {
  const map = {
    '#6366F1': 'linear-gradient(140deg, rgba(99,102,241,0.75), rgba(79,70,229,0.85))',
    '#F59E0B': 'linear-gradient(140deg, rgba(245,158,11,0.75), rgba(180,83,9,0.85))',
    '#10B981': 'linear-gradient(140deg, rgba(16,185,129,0.75), rgba(5,150,105,0.85))',
    '#EC4899': 'linear-gradient(140deg, rgba(236,72,153,0.75), rgba(157,23,77,0.85))',
    '#8B5CF6': 'linear-gradient(140deg, rgba(139,92,246,0.75), rgba(109,40,217,0.85))',
    '#EF4444': 'linear-gradient(140deg, rgba(239,68,68,0.75), rgba(185,28,28,0.85))',
    '#F97316': 'linear-gradient(140deg, rgba(249,115,22,0.75), rgba(194,65,12,0.85))',
    '#06B6D4': 'linear-gradient(140deg, rgba(6,182,212,0.75), rgba(8,145,178,0.85))',
    '#14B8A6': 'linear-gradient(140deg, rgba(20,184,166,0.75), rgba(15,118,110,0.85))',
  };
  return map[color] || `linear-gradient(140deg, rgba(14,165,233,0.75), rgba(2,132,199,0.85))`;
}

export default function KidHome() {
  const { activeKid, refreshKids } = useKid();
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [streak, setStreak]             = useState(0);
  const [coins, setCoins]               = useState(activeKid?.coins || 0);
  const [hasClassroom, setHasClassroom] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [dailyChallenge, setDailyChallenge] = useState(null);

  useEffect(() => {
    if (!activeKid) return;
    api.get(`/api/progress/${activeKid.id}`)
      .then(d => setProgressData(d.progress || []))
      .catch(() => {});
    api.get(`/api/achievements/${activeKid.id}`)
      .then(d => setAchievements(d.achievements || []))
      .catch(() => {});
    api.get(`/api/kids/me/classrooms`)
      .then(d => setHasClassroom((d.classrooms || []).length > 0))
      .catch(() => {
        api.get(`/api/kids/${activeKid.id}/classrooms`)
          .then(d => setHasClassroom((d.classrooms || []).length > 0))
          .catch(() => setHasClassroom(false));
      });
    refreshKids().then(kids => {
      const kid = kids?.find(k => k.id === activeKid.id);
      if (kid) {
        setStreak(kid.currentStreak || 0);
        setCoins(kid.coins || 0);
      }
    });
    api.get(`/api/daily-challenge/${activeKid.id}`)
      .then(d => setDailyChallenge(d))
      .catch(() => {});
  }, [activeKid?.id]);

  const progBySlug = progressData.reduce((acc, p) => { acc[p.moduleSlug] = p; return acc; }, {});
  const earnedModuleSlugs = new Set(
    achievements.filter(a => a.type === 'module_complete').map(a => a.moduleSlug)
  );

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);
  const visibleModules = activeCategory === 'all'
    ? MODULE_REGISTRY
    : MODULE_REGISTRY.filter(m => activeCat?.slugs?.includes(m.slug));

  const completedModules = MODULE_REGISTRY.filter(m => earnedModuleSlugs.has(m.slug));
  const overallPct = Math.round((earnedModuleSlugs.size / MODULE_REGISTRY.length) * 100);

  return (
    <div style={s.wrapper} className="kidhome-wrapper">

      {/* ── LEFT SIDEBAR ── */}
      <aside style={s.sidebar} className="kidhome-sidebar">
        <div style={s.kidProfile} className="kidhome-sidebar-profile">
          <div style={s.kidAvatar}>{AVATAR_EMOJIS[activeKid?.avatarId] || '🐻'}</div>
          <div style={s.kidName}>{activeKid?.name}</div>
          <div style={s.kidStars}>⭐ {activeKid?.totalStars || 0} stars</div>
        </div>

        <div style={s.divider} className="kidhome-sidebar-divider" />

        <nav style={s.categoryNav} className="kidhome-sidebar-nav">
          {CATEGORIES.map(cat => {
            const count = cat.slugs ? cat.slugs.length : MODULE_REGISTRY.length;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                style={{ ...s.catItem, ...(isActive ? s.catItemActive : {}) }}
                className={`kidhome-cat-item cat-item-hover`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span style={s.catEmoji}>{cat.emoji}</span>
                <span style={s.catLabel} className="kidhome-cat-label">{cat.label}</span>
                <span style={{ ...s.catCount, ...(isActive ? s.catCountActive : {}) }} className="kidhome-cat-count">
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Ollie mascot at bottom of sidebar */}
        <div style={s.mascotWrap} className="kidhome-mascot">
          <OllieMascot
            size={0.75}
            message={getOllieMessage(streak, earnedModuleSlugs.size, MODULE_REGISTRY.length, !!dailyChallenge?.completedAt)}
          />
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={s.main} className="kidhome-main">
        <div style={s.mainHeader}>
          <h1 style={s.pageTitle}>{activeCat?.emoji} {activeCat?.label}</h1>
          <p style={s.pageSubtitle}>
            {visibleModules.length} subject{visibleModules.length !== 1 ? 's' : ''} · Pick one to start!
          </p>
        </div>

        <div style={s.moduleGrid} className="kidhome-module-grid">
          {visibleModules.map(mod => {
            const prog  = progBySlug[mod.slug];
            const total = mod.lessons.length;
            const done  = prog?.lessonsCompleted ?? 0;
            const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
            const isCompleted = earnedModuleSlugs.has(mod.slug);
            const moduleStars = prog?.starsEarned ?? 0;
            const btnLabel = pct === 0 ? 'Start →' : pct === 100 ? 'Replay →' : 'Continue →';

            return (
              <div
                key={mod.slug}
                style={{ ...s.moduleCard, background: cardGradient(mod.color) }}
                className="module-card-hover"
                onClick={() => navigate(`/play/${mod.slug}`)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.45)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.3)';
                }}
              >
                {isCompleted && (
                  <div style={s.completedBadge}>
                    <StarBadge stars={moduleStars} size="sm" />
                  </div>
                )}

                <div style={s.cardIconWrap}>
                  <span style={s.cardEmoji}>{mod.iconEmoji}</span>
                </div>

                <div style={s.cardTitle}>{mod.title}</div>
                <div style={s.cardSub}>{done}/{total} lessons</div>

                <div style={s.progressBarBg}>
                  <div style={{ ...s.progressBarFill, width: `${pct}%` }} />
                </div>

                <button
                  style={s.cardBtn}
                  className="card-btn-hover"
                  onClick={e => { e.stopPropagation(); navigate(`/play/${mod.slug}`); }}
                >
                  {btnLabel}
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── RIGHT PANEL ── */}
      <aside style={s.rightPanel} className="kidhome-right-panel">

        {/* Daily Challenge */}
        {dailyChallenge && (() => {
          const mod = getModule(dailyChallenge.moduleSlug);
          const done = !!dailyChallenge.completedAt;
          return (
            <div
              style={{
                ...s.widget,
                background: done ? 'rgba(16,172,132,0.18)' : 'rgba(255,107,157,0.14)',
                border: done ? '1.5px solid rgba(16,172,132,0.4)' : '1.5px solid rgba(255,107,157,0.4)',
                cursor: done ? 'default' : 'pointer',
              }}
              onClick={() => !done && navigate('/play/daily')}
            >
              <div style={s.widgetTitle}>⚡ Daily Challenge</div>
              {done ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 22 }}>✅</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>+20 🪙 earned!</span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 26 }}>{mod?.iconEmoji || '🎮'}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0A4A6E' }}>{mod?.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#FF6B9D', fontWeight: 700 }}>+20 🪙 bonus • Tap to play!</div>
                </>
              )}
            </div>
          );
        })()}

        {/* Streak */}
        <div style={s.widget} className="kidhome-widget">
          <div style={s.widgetTitle}>🔥 Streak</div>
          <div style={s.streakRow}>
            <span style={s.streakNum}>{streak}</span>
            <span style={s.streakUnit}>days</span>
          </div>
          {streak > 0 && (
            <div style={s.streakMsg}>
              {streak >= 7 ? '🏆 Incredible!' : streak >= 3 ? '🌟 On a roll!' : '👍 Great start!'}
            </div>
          )}
        </div>

        {/* Coins */}
        <div style={s.widget} className="kidhome-widget">
          <div style={s.widgetTitle}>🪙 Coins</div>
          <div style={s.coinRow}>
            <span style={s.coinNum}>{coins}</span>
          </div>
          <button style={s.storeBtn} className="store-btn-hover" onClick={() => navigate('/play/store')}>
            Visit Store →
          </button>
        </div>

        {/* Class Ranking */}
        {hasClassroom && (
          <button style={s.leaderboardBtn} onClick={() => navigate('/play/leaderboard')}>
            🏆 Class Ranking
          </button>
        )}

        {/* Overall Progress */}
        <div style={s.widget} className="kidhome-widget">
          <div style={s.widgetTitle}>📊 Overall</div>
          <div style={s.progressRow}>
            <span style={s.progressBig}>{earnedModuleSlugs.size}</span>
            <span style={s.progressOf}>/ {MODULE_REGISTRY.length}</span>
          </div>
          <div style={s.progressBarBg}>
            <div style={{ ...s.progressBarFill, width: `${overallPct}%`, background: 'linear-gradient(90deg,#10B981,#34D399)' }} />
          </div>
          <div style={s.progressLabel}>{overallPct}% complete</div>
        </div>

        {/* Badges */}
        {completedModules.length > 0 && (
          <div style={s.widget} className="kidhome-widget">
            <div style={s.widgetTitle}>🏅 Badges</div>
            <div style={s.badgesGrid}>
              {completedModules.map(m => (
                <div key={m.slug} style={s.badge} title={`${m.title} Complete!`}>
                  <span style={{ fontSize: 26 }}>{m.iconEmoji}</span>
                  <span style={s.badgeLabel}>{m.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </aside>
    </div>
  );
}

const s = {
  wrapper: {
    display: 'flex',
    height: 'calc(100vh - 72px)',
    background: 'transparent',
    overflow: 'hidden',
  },

  // ── Sidebar ──
  sidebar: {
    width: 230, minWidth: 230,
    background: 'rgba(255,255,255,0.28)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '2px solid rgba(255,255,255,0.5)',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto', padding: '28px 0',
  },
  kidProfile: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '0 16px 20px',
  },
  kidAvatar: { fontSize: 56, lineHeight: 1 },
  kidName:   { fontSize: 18, fontWeight: 700, color: '#0A4A6E' },
  kidStars:  { fontSize: 14, fontWeight: 600, color: '#D97706' },
  divider:   { height: 1, background: 'rgba(255,255,255,0.5)', margin: '0 16px 16px' },
  categoryNav: { display: 'flex', flexDirection: 'column', gap: 3, padding: '0 12px' },
  catItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 14px', borderRadius: 14,
    background: 'none', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
    color: '#0A4A6E', textAlign: 'left',
    transition: 'background 0.15s',
    width: '100%',
  },
  catItemActive: { background: 'rgba(255,255,255,0.5)', color: '#0A4A6E', borderRadius: 14 },
  catEmoji:      { fontSize: 18, minWidth: 22 },
  catLabel:      { flex: 1, fontSize: 14, fontWeight: 600 },
  catCount: {
    fontSize: 12, fontWeight: 700,
    background: 'rgba(255,255,255,0.4)', color: '#0A4A6E',
    borderRadius: 20, padding: '2px 8px',
  },
  catCountActive: { background: 'rgba(59,191,232,0.3)', color: '#0A4A6E' },
  mascotWrap: {
    marginTop: 'auto', paddingTop: 24,
    display: 'flex', justifyContent: 'center',
    paddingBottom: 20,
    animation: 'mascot-float 3s ease-in-out infinite',
  },

  // ── Main ──
  main: { flex: 1, overflowY: 'auto', padding: '28px 28px' },
  mainHeader: { marginBottom: 24 },
  pageTitle:    { fontSize: 26, fontWeight: 700, color: '#fff', margin: 0, textShadow: '0 2px 8px rgba(0,80,120,0.4)' },
  pageSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: 500 },
  moduleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
    gap: 18,
  },
  moduleCard: {
    borderRadius: 22,
    padding: '20px 16px 16px',
    cursor: 'pointer',
    boxShadow: '0 8px 28px rgba(0,0,0,0.3)',
    border: '1.5px solid rgba(255,255,255,0.2)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s',
    display: 'flex', flexDirection: 'column', gap: 9,
    position: 'relative',
  },
  completedBadge: { position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.25)', borderRadius: 20, padding: '3px 6px' },
  cardIconWrap: {
    width: 68, height: 68, borderRadius: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto',
    background: 'rgba(255,255,255,0.15)',
  },
  cardEmoji: {
    fontSize: 40,
    display: 'inline-block',
    animation: 'float-soft 3s infinite ease-in-out',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
  },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#fff', textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.3)' },
  cardSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500, textAlign: 'center' },
  progressBarBg: {
    height: 6, borderRadius: 999,
    background: 'rgba(255,255,255,0.2)', overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', borderRadius: 999,
    background: 'rgba(255,255,255,0.85)',
    boxShadow: '0 0 8px rgba(255,255,255,0.5)',
    transition: 'width 0.4s ease',
  },
  cardBtn: {
    width: '100%', padding: '10px 0', borderRadius: 12,
    border: 'none',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(4px)',
    color: '#fff',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', marginTop: 2,
    transition: 'background 0.15s',
  },

  // ── Right Panel ──
  rightPanel: {
    width: 220, minWidth: 220,
    background: 'rgba(255,255,255,0.28)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderLeft: '2px solid rgba(255,255,255,0.5)',
    overflowY: 'auto',
    padding: '20px 14px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  widget: {
    background: 'rgba(255,255,255,0.4)',
    borderRadius: 16, padding: 14,
    border: '1.5px solid rgba(255,255,255,0.6)',
    boxShadow: '0 2px 10px rgba(0,100,150,0.1)',
  },
  widgetTitle: {
    fontSize: 11, fontWeight: 700, color: '#0A6B8A',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },

  streakRow: { display: 'flex', alignItems: 'baseline', gap: 5 },
  streakNum:  { fontSize: 38, fontWeight: 700, color: '#FF8C3A', lineHeight: 1 },
  streakUnit: { fontSize: 15, fontWeight: 600, color: '#5B9CB8' },
  streakMsg:  { fontSize: 12, fontWeight: 600, color: '#0A6B8A', marginTop: 6 },

  coinRow: { marginBottom: 10 },
  coinNum: { fontSize: 34, fontWeight: 700, color: '#D97706', lineHeight: 1 },
  storeBtn: {
    width: '100%', padding: '9px 0',
    background: 'rgba(255,200,50,0.2)', border: '1.5px solid rgba(217,119,6,0.35)',
    borderRadius: 12, color: '#92400E',
    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },

  leaderboardBtn: {
    width: '100%', padding: '13px 0',
    background: 'rgba(59,191,232,0.2)', border: '1.5px solid rgba(59,191,232,0.5)',
    borderRadius: 14, color: '#0A4A6E',
    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },

  progressRow:   { display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 },
  progressBig:   { fontSize: 32, fontWeight: 700, color: '#059669', lineHeight: 1 },
  progressOf:    { fontSize: 13, color: '#5B9CB8', fontWeight: 500 },
  progressLabel: { fontSize: 12, color: '#5B9CB8', fontWeight: 500, marginTop: 6 },

  badgesGrid: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  badge: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 2, padding: '7px 9px',
    background: 'rgba(255,200,50,0.15)', border: '1px solid rgba(217,119,6,0.25)',
    borderRadius: 12, minWidth: 56,
  },
  badgeLabel: { fontSize: 10, fontWeight: 600, color: '#92400E', textAlign: 'center' },
};
