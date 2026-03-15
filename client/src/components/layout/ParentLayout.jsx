import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useKid } from '../../context/KidContext';

export default function ParentLayout() {
  const { signOut, user } = useAuth();
  const { activeKid, clearKid } = useKid();
  const navigate = useNavigate();

  async function handleSignOut() {
    clearKid();
    await signOut();
    navigate('/login');
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoEmoji}>🎓</span>
          <span style={styles.logoText}>KidsLearn</span>
        </div>
        <nav style={styles.nav}>
          <Link to="/" style={styles.navLink}>Kids</Link>
          <Link to="/dashboard" style={styles.navLink}>Progress</Link>
          <Link to="/classrooms" style={styles.navLink}>Classrooms</Link>
          {activeKid && (
            <button onClick={() => navigate('/play')} style={styles.playBtn}>
              ▶ Play as {activeKid.name}
            </button>
          )}
          <button onClick={handleSignOut} style={styles.signOutBtn}>Sign Out</button>
        </nav>
      </header>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 var(--space-xl)', height: 72,
    background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1.5px solid var(--glass-border)',
    boxShadow: 'var(--glass-shadow)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  logo:      { display: 'flex', alignItems: 'center', gap: 8 },
  logoEmoji: { fontSize: 32 },
  logoText:  { fontSize: 'var(--font-lg)', fontWeight: 900, color: '#fff', textShadow: '0 1px 6px rgba(0,80,120,0.3)' },
  nav:       { display: 'flex', alignItems: 'center', gap: 8 },
  navLink: {
    fontSize: 'var(--font-base)', fontWeight: 700, color: '#fff',
    padding: '8px 16px', borderRadius: 12,
    transition: 'background 0.15s, color 0.15s',
    textDecoration: 'none',
  },
  playBtn: {
    background: '#22C55E', color: '#fff', border: 'none',
    padding: '10px 20px', borderRadius: 20, fontWeight: 800,
    fontSize: 'var(--font-sm)', cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
    boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
  },
  signOutBtn: {
    background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', color: '#fff',
    padding: '8px 16px', borderRadius: 20, fontWeight: 700,
    fontSize: 'var(--font-sm)', cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
  },
  main: { flex: 1, padding: 'var(--space-xl)' },
};
