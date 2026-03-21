import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TeacherLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoEmoji}>🎓</span>
          <span style={styles.logoText}>Tinker Academy</span>
          <span style={styles.badge}>Teacher</span>
        </div>
        <nav style={styles.nav}>
          <Link to="/teacher" style={styles.navLink}>Classrooms</Link>
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
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 var(--space-xl)', height: 72,
    background: 'var(--bg-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8 },
  logoEmoji: { fontSize: 32 },
  logoText: { fontSize: 'var(--font-lg)', fontWeight: 900, color: 'var(--accent-blue)' },
  badge: {
    fontSize: 'var(--font-xs)', fontWeight: 800, color: '#fff',
    background: 'var(--accent-green)', padding: '4px 10px', borderRadius: 10,
  },
  nav: { display: 'flex', alignItems: 'center', gap: 'var(--space-md)' },
  navLink: {
    fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-secondary)',
    padding: '8px 16px', borderRadius: 12,
  },
  signOutBtn: {
    background: 'none', border: '2px solid var(--text-muted)', color: 'var(--text-secondary)',
    padding: '8px 16px', borderRadius: 20, fontWeight: 700,
    fontSize: 'var(--font-sm)', cursor: 'pointer',
  },
  main: { flex: 1, padding: 'var(--space-xl)' },
};
