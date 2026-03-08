import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="page-center">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 80 }}>🤔</div>
        <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 900, marginBottom: 12 }}>Oops!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Page not found</p>
        <button className="kid-btn" onClick={() => navigate('/')}>Go Home</button>
      </div>
    </div>
  );
}
