import { Outlet, useNavigate } from 'react-router-dom';
import { useKid } from '../../context/KidContext';

const AVATAR_EMOJIS = {
  bear: '🐻', lion: '🦁', rabbit: '🐰', cat: '🐱',
  dog: '🐶', owl: '🦉', fox: '🦊', penguin: '🐧',
};

export default function KidLayout() {
  const { activeKid, clearKid } = useKid();
  const navigate = useNavigate();

  function handleHome() { navigate('/play'); }
  function handleExit() { clearKid(); navigate('/'); }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={handleHome} style={styles.homeBtn}>🏠</button>
        <div style={styles.kidInfo}>
          <span style={styles.avatar}>{AVATAR_EMOJIS[activeKid?.avatarId] || '🐻'}</span>
          <span style={styles.kidName}>{activeKid?.name}</span>
          <span style={styles.stars}>⭐ {activeKid?.totalStars || 0}</span>
        </div>
        <button onClick={handleExit} style={styles.exitBtn}>✕</button>
      </header>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 var(--space-lg)', height: 72,
    background: 'var(--bg-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  homeBtn: {
    fontSize: 28, background: 'none', border: 'none', cursor: 'pointer',
    padding: 8, borderRadius: 12,
  },
  kidInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { fontSize: 32 },
  kidName: { fontSize: 'var(--font-md)', fontWeight: 800 },
  stars: { fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--star-gold)' },
  exitBtn: {
    fontSize: 20, background: 'none', border: '2px solid var(--text-muted)',
    color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '50%',
    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  main: { flex: 1 },
};
