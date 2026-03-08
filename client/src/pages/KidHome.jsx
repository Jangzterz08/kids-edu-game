import { useEffect, useState } from 'react';
import { useKid } from '../context/KidContext';
import { MODULE_REGISTRY } from '../data/index';
import { api } from '../lib/api';
import ModuleCard from '../components/modules/ModuleCard';

const AVATAR_EMOJIS = {
  bear: '🐻', lion: '🦁', rabbit: '🐰', cat: '🐱',
  dog: '🐶', owl: '🦉', fox: '🦊', penguin: '🐧',
};

export default function KidHome() {
  const { activeKid, refreshKids } = useKid();
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    if (!activeKid) return;
    api.get(`/api/progress/${activeKid.id}`)
      .then(d => setProgressData(d.progress || []))
      .catch(() => {});
    // Refresh kid's star count
    refreshKids();
  }, [activeKid?.id]);

  const progBySlug = progressData.reduce((acc, p) => { acc[p.moduleSlug] = p; return acc; }, {});

  return (
    <div style={styles.container}>
      <div style={styles.welcome}>
        <span style={styles.avatar}>{AVATAR_EMOJIS[activeKid?.avatarId] || '🐻'}</span>
        <div>
          <h1 style={styles.name}>Hi, {activeKid?.name}! 👋</h1>
          <p style={styles.sub}>What do you want to learn today?</p>
        </div>
      </div>

      <div style={styles.grid}>
        {MODULE_REGISTRY.map(mod => (
          <ModuleCard
            key={mod.slug}
            moduleSlug={mod.slug}
            progressData={progBySlug[mod.slug]}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 'var(--space-xl)', maxWidth: 900, margin: '0 auto' },
  welcome: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36 },
  avatar: { fontSize: 72 },
  name: { fontSize: 'var(--font-xl)', fontWeight: 900 },
  sub: { fontSize: 'var(--font-base)', color: 'var(--text-secondary)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 },
};
