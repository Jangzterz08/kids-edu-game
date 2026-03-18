import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import RoleSelector from '../components/auth/RoleSelector';
import PinKeypad from '../components/auth/PinKeypad';
import OceanFish from '../components/OceanFish';

const Spinner = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" style={{ animation: 'spin 0.7s linear infinite' }} aria-label="Loading">
    <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.35)" strokeWidth="3" fill="none"/>
    <path d="M12 3a9 9 0 0 1 9 9" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/>
  </svg>
);

const AVATAR_EMOJIS = {
  bear: '🐻', lion: '🦁', rabbit: '🐰', cat: '🐱',
  dog: '🐶', owl: '🦉', fox: '🦊', penguin: '🐧',
  frog: '🐸', chick: '🐥', hamster: '🐹', panda: '🐼',
  butterfly: '🦋', dragon: '🐉', dino: '🦕', unicorn: '🦄',
};

export default function Login() {
  const [role, setRole]         = useState(null);   // null | 'parent' | 'teacher' | 'kid'
  const [mode, setMode]         = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail]       = useState('');
  const [password, setPass]     = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Kid login state
  const [kidStep, setKidStep]   = useState('name');   // 'name' | 'pick' | 'pin'
  const [kidName, setKidName]   = useState('');
  const [kidMatches, setKidMatches] = useState([]);
  const [selectedKid, setSelectedKid] = useState(null);

  const [forgotMode, setForgotMode]   = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent]   = useState(false);

  const { signInWithEmail, signUpWithEmail, signInAsKid, resetPassword } = useAuth();
  const navigate = useNavigate();

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    if (forgotMode) { setForgotMode(false); setForgotSent(false); setForgotEmail(''); setError(''); return; }
    if (role === 'kid' && kidStep !== 'name') {
      if (kidStep === 'pin') { setSelectedKid(null); setKidStep(kidMatches.length > 1 ? 'pick' : 'name'); }
      else setKidStep('name');
      setError('');
      return;
    }
    setRole(null);
    setError('');
  }

  // Parent / Teacher submit
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const u = await signInWithEmail(email, password);
        navigate(u.role === 'teacher' ? '/teacher' : '/');
      } else {
        const u = await signUpWithEmail(email, password, name, role);
        navigate(u.role === 'teacher' ? '/teacher' : '/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Kid name lookup
  async function handleKidNameSubmit(e) {
    e.preventDefault();
    if (!kidName.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { kids } = await api.public.post('/api/auth/kid-lookup', { name: kidName.trim() });
      if (kids.length === 0) {
        setError('No kid found with that name. Ask your parent to set up a PIN!');
      } else if (kids.length === 1) {
        setSelectedKid(kids[0]);
        setKidStep('pin');
      } else {
        setKidMatches(kids);
        setKidStep('pick');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Kid PIN submit
  async function handlePinSubmit(pin) {
    setError('');
    setLoading(true);
    try {
      await signInAsKid(selectedKid.id, pin);
      navigate('/play');
    } catch (err) {
      setError('Wrong PIN. Try again!');
      setLoading(false);
    }
  }

  // Kid avatar pick
  function handlePickKid(kid) {
    setSelectedKid(kid);
    setKidStep('pin');
    setError('');
  }

  return (
    <div className="page-center" style={styles.bg}>
      <OceanFish />
      <div style={styles.card}>
        <div style={styles.logo}>🎓</div>
        <h1 style={styles.title}>KidsLearn</h1>
        <p style={styles.sub}>Educational fun for every kid!</p>

        {/* Step 1: Role selector */}
        {!role && <RoleSelector onSelect={setRole} />}

        {/* Forgot password view */}
        {(role === 'parent' || role === 'teacher') && forgotMode && (
          <>
            <div style={styles.roleTag}>🔑 Reset Password</div>
            {forgotSent ? (
              <div style={styles.sentBox}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
                <p style={styles.sentTitle}>Check your email!</p>
                <p style={styles.sentSub}>We sent a reset link to <strong>{forgotEmail}</strong>. Check your inbox (and spam folder).</p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} style={styles.form}>
                <p style={styles.forgotHint}>Enter your email and we'll send you a link to reset your password.</p>
                <input
                  style={styles.input} className="login-input" type="email" placeholder="Email address"
                  value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required autoFocus
                />
                {error && <p style={styles.error}>{error}</p>}
                <button type="submit" disabled={loading} className="kid-btn" style={{ width: '100%' }}>
                  {loading ? <Spinner /> : 'Send Reset Link'}
                </button>
              </form>
            )}
            <button onClick={handleBack} style={styles.backBtn}>← Back to Sign In</button>
          </>
        )}

        {/* Parent / Teacher: email form */}
        {(role === 'parent' || role === 'teacher') && !forgotMode && (
          <>
            <div style={styles.roleTag}>
              {role === 'parent' ? '👨‍👩‍👧 Parent' : '📚 Teacher'}
            </div>
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
                  style={styles.input} className="login-input" type="text" placeholder="Your name"
                  value={name} onChange={e => setName(e.target.value)}
                />
              )}
              <input
                style={styles.input} className="login-input" type="email" placeholder="Email address"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
              <input
                style={styles.input} className="login-input" type="password" placeholder="Password"
                value={password} onChange={e => setPass(e.target.value)} required
                minLength={6}
              />
              {mode === 'signin' && (
                <button
                  type="button"
                  style={styles.forgotLink}
                  onClick={() => { setForgotMode(true); setForgotEmail(email); setError(''); }}
                >
                  Forgot password?
                </button>
              )}
              {error && <p style={styles.error}>{error}</p>}
              <button type="submit" disabled={loading} className="kid-btn" style={{ width: '100%' }}>
                {loading ? <Spinner /> : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            <button onClick={handleBack} style={styles.backBtn}>← Back</button>
          </>
        )}

        {/* Kid: name entry */}
        {role === 'kid' && kidStep === 'name' && (
          <>
            <div style={styles.roleTag}>🎮 Kid Login</div>
            <form onSubmit={handleKidNameSubmit} style={styles.form}>
              <input
                style={styles.input} className="login-input" type="text" placeholder="What's your name?"
                value={kidName} onChange={e => setKidName(e.target.value)}
                autoFocus
              />
              {error && <p style={styles.error}>{error}</p>}
              <button type="submit" disabled={loading} className="kid-btn" style={{ width: '100%' }}>
                {loading ? <Spinner /> : 'Next'}
              </button>
            </form>
            <button onClick={handleBack} style={styles.backBtn}>← Back</button>
          </>
        )}

        {/* Kid: avatar picker (disambiguation) */}
        {role === 'kid' && kidStep === 'pick' && (
          <>
            <div style={styles.roleTag}>Which one is you?</div>
            <div style={styles.avatarGrid}>
              {kidMatches.map(k => (
                <button key={k.id} style={styles.avatarCard} onClick={() => handlePickKid(k)}>
                  <span style={styles.avatarEmoji}>{AVATAR_EMOJIS[k.avatarId] || '🐻'}</span>
                  <span style={styles.avatarName}>{k.name}</span>
                </button>
              ))}
            </div>
            <button onClick={handleBack} style={styles.backBtn}>← Back</button>
          </>
        )}

        {/* Kid: PIN keypad */}
        {role === 'kid' && kidStep === 'pin' && (
          <>
            <div style={styles.roleTag}>
              <span style={{ fontSize: 32 }}>{AVATAR_EMOJIS[selectedKid?.avatarId] || '🐻'}</span>
              {' '}{selectedKid?.name}
            </div>
            <p style={styles.pinPrompt}>Enter your PIN</p>
            <PinKeypad onSubmit={handlePinSubmit} loading={loading} error={error} />
            <button onClick={handleBack} style={styles.backBtn}>← Back</button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  bg: { background: 'linear-gradient(180deg, #8BD4F2 0%, #5BC8EC 40%, #3BBFE8 70%, #E8C87A 88%, #D4A84B 100%)', minHeight: '100vh', backgroundAttachment: 'fixed' },
  card: {
    background: 'rgba(255,255,255,0.45)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 32, padding: 40,
    width: '90%', maxWidth: 420, textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,80,120,0.2)',
    border: '2px solid rgba(255,255,255,0.7)',
    animation: 'slide-up 0.4s ease',
    position: 'relative', zIndex: 1,
  },
  logo:  { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 4, color: '#0A4A6E', fontFamily: 'Fredoka, sans-serif' },
  sub:   { fontSize: 'var(--font-sm)', color: '#1A7A9A', marginBottom: 28, fontWeight: 500 },
  roleTag: {
    fontSize: 'var(--font-md)', fontWeight: 700,
    marginBottom: 20, color: '#0A4A6E', fontFamily: 'Fredoka, sans-serif',
  },
  tabs: {
    display: 'flex', marginBottom: 24,
    background: 'rgba(255,255,255,0.4)', borderRadius: 16, padding: 4,
    border: '1.5px solid rgba(255,255,255,0.6)',
  },
  tab: {
    flex: 1, padding: '10px', border: 'none', background: 'transparent',
    fontWeight: 600, fontSize: 'var(--font-base)', cursor: 'pointer',
    color: '#1A7A9A', borderRadius: 12, fontFamily: 'Fredoka, sans-serif',
    transition: 'all 0.15s',
  },
  tabActive: { background: '#3BBFE8', color: '#fff', boxShadow: '0 2px 10px rgba(59,191,232,0.4)' },
  form:  { display: 'flex', flexDirection: 'column', gap: 14 },
  input: {
    padding: '14px 18px', borderRadius: 16,
    border: '2px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.5)',
    fontSize: 'var(--font-base)', fontFamily: 'Fredoka, sans-serif',
    outline: 'none', color: '#0A4A6E',
    transition: 'border-color 0.15s',
  },
  error: { color: '#C84030', fontWeight: 600, fontSize: 'var(--font-sm)' },
  forgotLink: {
    background: 'none', border: 'none',
    color: '#0A6B8A', fontWeight: 600, fontSize: 13,
    cursor: 'pointer', textAlign: 'right',
    fontFamily: 'Fredoka, sans-serif',
    textDecoration: 'underline', marginTop: -6,
  },
  forgotHint: {
    color: '#1A7A9A', fontSize: 14, fontWeight: 500,
    marginBottom: 4, lineHeight: 1.5,
  },
  sentBox: { padding: '16px 0', marginBottom: 8 },
  sentTitle: { fontSize: 'var(--font-md)', fontWeight: 700, color: '#0A4A6E', marginBottom: 8, fontFamily: 'Fredoka, sans-serif' },
  sentSub:   { fontSize: 14, color: '#1A7A9A', lineHeight: 1.6 },
  backBtn: {
    marginTop: 16, background: 'none', border: 'none',
    color: '#1A7A9A', fontWeight: 600, fontSize: 'var(--font-sm)',
    cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Fredoka, sans-serif',
  },
  pinPrompt: { fontSize: 'var(--font-base)', fontWeight: 600, color: '#1A7A9A', marginBottom: 8 },
  avatarGrid: { display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 },
  avatarCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '16px 20px', borderRadius: 20,
    border: '2px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.45)',
    cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
  },
  avatarEmoji: { fontSize: 40 },
  avatarName:  { fontSize: 'var(--font-sm)', fontWeight: 700, color: '#0A4A6E' },
};
