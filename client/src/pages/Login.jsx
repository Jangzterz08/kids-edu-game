import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode]       = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [name, setName]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const { signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center" style={styles.bg}>
      <div style={styles.card}>
        <div style={styles.logo}>🎓</div>
        <h1 style={styles.title}>KidsLearn</h1>
        <p style={styles.sub}>Educational fun for every kid!</p>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(mode === 'signin' ? styles.tabActive : {}) }}
            onClick={() => setMode('signin')}
          >Sign In</button>
          <button
            style={{ ...styles.tab, ...(mode === 'signup' ? styles.tabActive : {}) }}
            onClick={() => setMode('signup')}
          >Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'signup' && (
            <input
              style={styles.input} type="text" placeholder="Your name"
              value={name} onChange={e => setName(e.target.value)}
            />
          )}
          <input
            style={styles.input} type="email" placeholder="Email address"
            value={email} onChange={e => setEmail(e.target.value)} required
          />
          <input
            style={styles.input} type="password" placeholder="Password"
            value={password} onChange={e => setPass(e.target.value)} required
            minLength={6}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} className="kid-btn" style={{ width: '100%' }}>
            {loading ? '...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  bg: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  card: {
    background: 'var(--bg-surface)', borderRadius: 32, padding: 40,
    width: '90%', maxWidth: 400, textAlign: 'center', boxShadow: 'var(--shadow-modal)',
  },
  logo:  { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 'var(--font-xl)', fontWeight: 900, marginBottom: 4 },
  sub:   { fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 28 },
  tabs:  { display: 'flex', marginBottom: 24, border: '2px solid #E0E0E0', borderRadius: 16, overflow: 'hidden' },
  tab: {
    flex: 1, padding: '12px', border: 'none', background: 'transparent',
    fontWeight: 700, fontSize: 'var(--font-base)', cursor: 'pointer', color: 'var(--text-secondary)',
  },
  tabActive: { background: 'var(--accent-blue)', color: '#fff' },
  form:  { display: 'flex', flexDirection: 'column', gap: 14 },
  input: {
    padding: '14px 18px', borderRadius: 16, border: '2px solid #E0E0E0',
    fontSize: 'var(--font-base)', fontFamily: 'Nunito, sans-serif',
    outline: 'none', background: 'var(--bg-surface-alt)',
  },
  error: { color: 'var(--error)', fontWeight: 700, fontSize: 'var(--font-sm)' },
};
