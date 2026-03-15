import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useKid } from '../../context/KidContext';

export default function ProtectedRoute({ requireKid = false, requireRole = null }) {
  const { session, user, kidSession, loading } = useAuth();
  const { activeKid } = useKid();

  if (loading) return <div style={styles.loading}>Loading...</div>;

  // No Supabase session → login (check before kidSession so teachers can access their routes)
  if (!session) return <Navigate to="/login" replace />;

  // Kid direct session (PIN login) — only allow play routes if no Supabase role
  if (kidSession && user?.role !== 'teacher') {
    if (requireRole === 'teacher') return <Navigate to="/play" replace />;
    if (requireRole === 'parent') return <Navigate to="/play" replace />;
    return <Outlet />;
  }

  // Role-based guards
  if (requireRole === 'teacher' && user?.role !== 'teacher') return <Navigate to="/" replace />;
  if (requireRole === 'parent' && user?.role === 'teacher') return <Navigate to="/teacher" replace />;

  // Kid selection guard for play routes
  if (requireKid && !activeKid) return <Navigate to="/" replace />;

  return <Outlet />;
}

const styles = {
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', fontSize: 24, color: 'var(--text-secondary)',
    fontFamily: 'Nunito, sans-serif',
  },
};
