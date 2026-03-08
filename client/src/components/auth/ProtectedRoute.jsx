import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useKid } from '../../context/KidContext';

export default function ProtectedRoute({ requireKid = false }) {
  const { session, loading } = useAuth();
  const { activeKid }        = useKid();

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
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
