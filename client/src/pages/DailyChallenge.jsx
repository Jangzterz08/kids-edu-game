import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKid } from '../context/KidContext';
import { api } from '../lib/api';
import { getModule } from '../data/index';

export default function DailyChallenge() {
  const { activeKid } = useKid();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeKid) return;
    api.get(`/api/daily-challenge/${activeKid.id}`)
      .then(data => setChallenge(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeKid?.id]);

  const mod = challenge ? getModule(challenge.moduleSlug) : null;
  const completed = !!challenge?.completedAt;

  if (loading) {
    return (
      <div style={s.center}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Loading challenge…</div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <button style={s.back} onClick={() => navigate('/play')}>← Back</button>

      <div style={s.card}>
        <div style={s.badge}>⚡ Daily Challenge</div>

        {completed ? (
          <>
            <div style={s.bigEmoji}>🎉</div>
            <h2 style={s.title}>Challenge Complete!</h2>
            <p style={s.sub}>
              You earned <strong style={{ color: '#F59E0B' }}>+{challenge.coinsEarned} 🪙</strong> bonus coins today!
            </p>
            <p style={s.sub2}>Come back tomorrow for a new challenge.</p>
            <button style={s.doneBtn} onClick={() => navigate('/play')}>
              Back to Home →
            </button>
          </>
        ) : (
          <>
            <div style={s.modEmojiWrap}>
              <span style={s.modEmoji}>{mod?.iconEmoji || '🎮'}</span>
            </div>
            <h2 style={s.title}>Today's Module</h2>
            <h3 style={s.modName}>{mod?.title || challenge?.moduleSlug}</h3>
            <p style={s.sub}>Complete this module to earn</p>
            <div style={s.rewardRow}>
              <span style={s.coinBig}>🪙 +20</span>
              <span style={s.rewardLabel}>bonus coins!</span>
            </div>
            <button
              style={s.playBtn}
              onClick={() => mod && navigate(`/play/${mod.slug}`)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              Play Now →
            </button>
          </>
        )}
      </div>

      <div style={s.hint}>
        {completed
          ? '🐙 Amazing work today! See you tomorrow!'
          : "🐙 Can you finish today's challenge? You've got this!"}
      </div>
    </div>
  );
}

const s = {
  page: {
    padding: 24, maxWidth: 480, margin: '0 auto',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
  },
  center: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh',
  },
  back: {
    alignSelf: 'flex-start',
    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12,
    padding: '8px 16px', fontWeight: 700, fontSize: 14,
    cursor: 'pointer', color: '#fff', fontFamily: 'inherit',
  },
  card: {
    background: 'rgba(255,255,255,0.94)', borderRadius: 32,
    padding: '32px 28px', width: '100%', maxWidth: 420,
    boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    textAlign: 'center',
  },
  badge: {
    background: 'linear-gradient(135deg, #FF6B9D, #FF9F43)',
    color: '#fff', borderRadius: 20, padding: '6px 18px',
    fontSize: 13, fontWeight: 800, letterSpacing: 0.5,
  },
  bigEmoji: { fontSize: 72 },
  modEmojiWrap: {
    width: 100, height: 100, borderRadius: 28,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(102,126,234,0.4)',
  },
  modEmoji: { fontSize: 56 },
  title: { fontSize: 22, fontWeight: 900, color: '#0A4A6E', margin: 0 },
  modName: { fontSize: 28, fontWeight: 900, color: '#0A2540', margin: 0 },
  sub: { fontSize: 15, color: '#5B9CB8', margin: 0, fontWeight: 600 },
  sub2: { fontSize: 13, color: '#94A3B8', margin: 0 },
  rewardRow: { display: 'flex', alignItems: 'center', gap: 8 },
  coinBig: { fontSize: 28, fontWeight: 900, color: '#F59E0B' },
  rewardLabel: { fontSize: 16, fontWeight: 700, color: '#92400E' },
  playBtn: {
    background: 'linear-gradient(135deg, #FF6B9D, #FF9F43)',
    color: '#fff', border: 'none', borderRadius: 20,
    padding: '16px 40px', fontSize: 18, fontWeight: 900,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 8px 24px rgba(255,107,157,0.4)',
    transition: 'transform 0.15s',
    marginTop: 8,
  },
  doneBtn: {
    background: 'linear-gradient(135deg, #10AC84, #2ECC71)',
    color: '#fff', border: 'none', borderRadius: 20,
    padding: '14px 36px', fontSize: 16, fontWeight: 900,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 8px 24px rgba(16,172,132,0.4)',
    marginTop: 8,
  },
  hint: {
    background: 'rgba(255,255,255,0.22)', borderRadius: 20,
    padding: '12px 20px', fontSize: 15, fontWeight: 600,
    color: '#fff', textAlign: 'center', maxWidth: 420,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
};
