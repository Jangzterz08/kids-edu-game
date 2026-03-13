import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKid } from '../context/KidContext';
import { MODULE_REGISTRY } from '../data/index';
import { api } from '../lib/api';
import ModuleCard from '../components/modules/ModuleCard';
import Mascot from '../components/mascot/Mascot';

const AVATAR_EMOJIS = {
  bear: '🐻', lion: '🦁', rabbit: '🐰', cat: '🐱',
  dog: '🐶', owl: '🦉', fox: '🦊', penguin: '🐧',
  // Store unlockables
  frog: '🐸', chick: '🐥', hamster: '🐹', panda: '🐼',
  butterfly: '🦋', dragon: '🐉', dino: '🦖', unicorn: '🦄',
};

export default function KidHome() {
  const { activeKid, refreshKids } = useKid();
  const navigate = useNavigate();
  const [progressData, setProgressData]     = useState([]);
  const [achievements, setAchievements]     = useState([]);
  const [streak, setStreak]                 = useState(0);
  const [coins, setCoins]                   = useState(activeKid?.coins || 0);

  useEffect(() => {
    if (!activeKid) return;
    api.get(`/api/progress/${activeKid.id}`)
      .then(d => setProgressData(d.progress || []))
      .catch(() => {});
    api.get(`/api/achievements/${activeKid.id}`)
      .then(d => setAchievements(d.achievements || []))
      .catch(() => {});
    // Refresh kid to get updated streak + totalStars + coins
    refreshKids().then(kids => {
      const kid = kids?.find(k => k.id === activeKid.id);
      if (kid) {
        setStreak(kid.currentStreak || 0);
        setCoins(kid.coins || 0);
      }
    });
  }, [activeKid?.id]);

  const progBySlug = progressData.reduce((acc, p) => { acc[p.moduleSlug] = p; return acc; }, {});
  const earnedModuleSlugs = new Set(
    achievements.filter(a => a.type === 'module_complete').map(a => a.moduleSlug)
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.welcome}>
          <span style={styles.avatar}>{AVATAR_EMOJIS[activeKid?.avatarId] || '🐻'}</span>
          <div>
            <h1 style={styles.name}>Hi, {activeKid?.name}! 👋</h1>
            <p style={styles.sub}>What do you want to learn today?</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Mascot streak={streak} size="md" showBubble={true} />
          {streak > 0 && (
            <div className="glass-pill" style={styles.streakBadge}>
              <span style={styles.streakFire}>🔥</span>
              <span style={styles.streakNum}>{streak}</span>
              <span style={styles.streakLabel}>day streak!</span>
            </div>
          )}
          <button className="glass-pill" style={styles.coinBadge} onClick={() => navigate('/play/store')}>
            <span style={styles.coinIcon}>🪙</span>
            <span style={styles.coinNum}>{coins}</span>
            <span style={styles.coinLabel}>Store</span>
          </button>
        </div>
      </div>

      {earnedModuleSlugs.size > 0 && (
        <div style={styles.badgesSection}>
          <h3 style={styles.badgesTitle}>🏆 Your Badges</h3>
          <div style={styles.badgesRow}>
            {MODULE_REGISTRY.filter(m => earnedModuleSlugs.has(m.slug)).map(m => (
              <div key={m.slug} style={styles.badge} title={m.title + ' Complete!'}>
                <span style={styles.badgeEmoji}>{m.iconEmoji}</span>
                <span style={styles.badgeName}>{m.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.grid}>
        {MODULE_REGISTRY.map(mod => (
          <ModuleCard
            key={mod.slug}
            moduleSlug={mod.slug}
            progressData={progBySlug[mod.slug]}
            completed={earnedModuleSlugs.has(mod.slug)}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 'var(--space-xl)', maxWidth: 1000, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 20 },
  welcome: { display: 'flex', alignItems: 'center', gap: 24 },
  avatar: { fontSize: 80, filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.4))', animation: 'float-organic 6s infinite ease-in-out' },
  name: { fontSize: 'var(--font-xl)', fontWeight: 900, textShadow: '0 2px 8px rgba(0,0,0,0.6)' },
  sub: { fontSize: 'var(--font-base)', color: 'var(--text-secondary)' },
  streakBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 24px',
  },
  streakFire: { fontSize: 28, filter: 'drop-shadow(0 0 8px #FF6D00)' },
  streakNum: { fontSize: 32, fontWeight: 900, color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.8)' },
  streakLabel: { fontSize: 14, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  coinBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 24px', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  coinIcon: { fontSize: 28, filter: 'drop-shadow(0 0 8px #FFEA00)' },
  coinNum: { fontSize: 32, fontWeight: 900, color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.8)' },
  coinLabel: { fontSize: 14, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  badgesSection: { marginBottom: 32 },
  badgesTitle: { fontSize: 'var(--font-base)', fontWeight: 800, marginBottom: 16, color: 'var(--text-muted)' },
  badgesRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  badge: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '14px 20px', minWidth: 80,
    background: 'rgba(255, 234, 0, 0.15)',
    border: '1px solid rgba(255, 234, 0, 0.4)',
    borderRadius: 20,
    boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  badgeEmoji: { fontSize: 36, filter: 'drop-shadow(0 0 10px rgba(255,234,0,0.5))' },
  badgeName: { fontSize: 13, fontWeight: 800, color: '#FFF', textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 },
};
