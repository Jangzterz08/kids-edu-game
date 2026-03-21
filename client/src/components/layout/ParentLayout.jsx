import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useKid } from '../../context/KidContext';
import './ParentLayout.css';

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
    <div className="pl-container">
      <header className="pl-header">
        <div className="pl-logo">
          <span className="pl-logo-emoji">🎓</span>
          <span className="pl-logo-text">Tinker Academy</span>
        </div>
        <nav className="pl-nav">
          <Link to="/" className="pl-nav-link">Kids</Link>
          <Link to="/dashboard" className="pl-nav-link">Progress</Link>
          <Link to="/classrooms" className="pl-nav-link">Classrooms</Link>
          {activeKid && (
            <button onClick={() => navigate('/play')} className="pl-play-btn">
              ▶ {activeKid.name}
            </button>
          )}
          <button onClick={handleSignOut} className="pl-signout-btn">Sign Out</button>
        </nav>
      </header>
      <main className="pl-main">
        <Outlet />
      </main>
    </div>
  );
}
