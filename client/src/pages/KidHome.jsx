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
            <div style={styles.streakBadge}>
              <span style={styles.streakFire}>🔥</span>
              <span style={styles.streakNum}>{streak}</span>
              <span style={styles.streakLabel}>day streak!</span>
            </div>
          )}
          <button style={styles.coinBadge} onClick={() => navigate('/play/store')}>
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
  container: { padding: 'var(--space-xl)', maxWidth: 900, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 },
  welcome: { display: 'flex', alignItems: 'center', gap: 20 },
  avatar: { fontSize: 72 },
  name: { fontSize: 'var(--font-xl)', fontWeight: 900 },
  sub: { fontSize: 'var(--font-base)', color: 'var(--text-secondary)' },
  streakBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
    borderRadius: 20, padding: '10px 20px',
    boxShadow: '0 4px 12px rgba(255,107,53,0.35)',
  },
  streakFire: { fontSize: 28 },
  streakNum: { fontSize: 32, fontWeight: 900, color: '#fff' },
  streakLabel: { fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)' },
  coinBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'linear-gradient(135deg, #FFF9C4, #FFD600)',
    border: '2px solid #F9A825', borderRadius: 20, padding: '10px 20px',
    boxShadow: '0 4px 12px rgba(249,168,37,0.35)',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  coinIcon: { fontSize: 24 },
  coinNum: { fontSize: 28, fontWeight: 900, color: '#5D4037' },
  coinLabel: { fontSize: 13, fontWeight: 700, color: '#795548' },
  badgesSection: { marginBottom: 28 },
  badgesTitle: { fontSize: 'var(--font-base)', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' },
  badgesRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  badge: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    background: 'linear-gradient(135deg, #FFF9C4, #FFF176)',
    border: '2px solid #F9A825',
    borderRadius: 16, padding: '10px 14px', minWidth: 72,
    boxShadow: '0 2px 8px rgba(249,168,37,0.3)',
  },
  badgeEmoji: { fontSize: 28 },
  badgeName: { fontSize: 11, fontWeight: 700, color: '#5D4037', textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 },
};
