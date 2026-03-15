import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKid } from '../context/KidContext';
import { api } from '../lib/api';
import { speakWord } from '../lib/sound';

const STORE_ITEMS = [
  { id: 'frog',      emoji: '🐸', label: 'Frog',      type: 'avatar', price: 30  },
  { id: 'chick',     emoji: '🐥', label: 'Chick',     type: 'avatar', price: 40  },
  { id: 'hamster',   emoji: '🐹', label: 'Hamster',   type: 'avatar', price: 60  },
  { id: 'panda',     emoji: '🐼', label: 'Panda',     type: 'avatar', price: 80  },
  { id: 'butterfly', emoji: '🦋', label: 'Butterfly', type: 'avatar', price: 100 },
  { id: 'dragon',    emoji: '🐉', label: 'Dragon',    type: 'avatar', price: 120 },
  { id: 'dino',      emoji: '🦖', label: 'Dino',      type: 'avatar', price: 150 },
  { id: 'unicorn',   emoji: '🦄', label: 'Unicorn',   type: 'avatar', price: 200 },
];

export default function CoinStore() {
  const { activeKid, refreshKids } = useKid();
  const navigate = useNavigate();
  const [coins, setCoins]         = useState(activeKid?.coins || 0);
  const [unlocked, setUnlocked]   = useState(() => {
    try { return JSON.parse(activeKid?.unlockedItems || '[]'); } catch { return []; }
  });
  const [buying, setBuying]       = useState(null); // itemId being purchased
  const [flash, setFlash]         = useState(null); // { id, success }

  // Sync fresh kid data on mount
  useEffect(() => {
    if (!activeKid) return;
    refreshKids().then(kids => {
      const kid = kids?.find(k => k.id === activeKid.id);
      if (kid) {
        setCoins(kid.coins || 0);
        try { setUnlocked(JSON.parse(kid.unlockedItems || '[]')); } catch { setUnlocked([]); }
      }
    });
  }, [activeKid?.id]);

  async function handleBuy(item) {
    if (buying || unlocked.includes(item.id)) return;
    if (coins < item.price) {
      speakWord('Not enough coins! Keep playing to earn more!');
      setFlash({ id: item.id, success: false });
      setTimeout(() => setFlash(null), 1500);
      return;
    }
    setBuying(item.id);
    try {
      const res = await api.post(`/api/kids/${activeKid.id}/store/buy`, {
        itemId: item.id,
        price: item.price,
      });
      setCoins(res.coins);
      setUnlocked(res.unlockedItems);
      speakWord(`You unlocked ${item.label}!`);
      setFlash({ id: item.id, success: true });
      setTimeout(() => setFlash(null), 2000);
    } catch (err) {
      speakWord('Oops! Something went wrong.');
    } finally {
      setBuying(null);
    }
  }

  async function handleUse(item) {
    try {
      await api.put(`/api/kids/${activeKid.id}`, { avatarId: item.id });
      await refreshKids();
      speakWord(`Now using ${item.label}!`);
      navigate('/play');
    } catch {
      speakWord('Could not change avatar. Try again!');
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/play')}>← Back</button>
        <div style={styles.titleRow}>
          <span style={styles.titleEmoji}>🏪</span>
          <h1 style={styles.title}>Coin Store</h1>
        </div>
        <div style={styles.coinPill}>
          <span>🪙</span>
          <span style={styles.coinNum}>{coins}</span>
        </div>
      </div>

      <p style={styles.sub}>Spend your coins to unlock new avatars!</p>

      {/* Grid */}
      <div style={styles.grid}>
        {STORE_ITEMS.map(item => {
          const isOwned   = unlocked.includes(item.id);
          const canAfford = coins >= item.price;
          const isFlash   = flash?.id === item.id;
          const isBuying  = buying === item.id;

          let cardBg = '#FFFFFF';
          let border = '1.5px solid #E2E8F0';
          if (isOwned) { cardBg = '#F0FDF4'; border = '1.5px solid #86EFAC'; }
          if (isFlash && flash.success)  { cardBg = '#FEFCE8'; border = '1.5px solid #FDE047'; }
          if (isFlash && !flash.success) { cardBg = '#FFF1F2'; border = '1.5px solid #FECDD3'; }

          return (
            <div key={item.id} className="glass-panel" style={{ ...styles.card, background: cardBg, border }}>
              <div style={styles.emojiWrap}>
                <span style={styles.itemEmoji}>{item.emoji}</span>
                {isOwned && <span style={styles.ownedBadge}>✓</span>}
              </div>
              <div style={styles.itemLabel}>{item.label}</div>

              {isOwned ? (
                <button
                  style={{ ...styles.btn, ...styles.btnUse }}
                  onClick={() => handleUse(item)}
                >
                  Use
                </button>
              ) : (
                <button
                  style={{
                    ...styles.btn,
                    ...(canAfford ? styles.btnBuy : styles.btnLocked),
                  }}
                  onClick={() => handleBuy(item)}
                  disabled={isBuying}
                >
                  {isBuying ? '...' : (
                    <>
                      <span>🪙</span>
                      <span>{item.price}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 'var(--space-xl)', maxWidth: 720, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' },
  backBtn: {
    background: '#F1F5F9', border: 'none', borderRadius: 12,
    padding: '8px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
    color: '#64748B', fontFamily: 'Nunito, sans-serif',
  },
  titleRow: { display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
  titleEmoji: { fontSize: 32 },
  title: { fontSize: 'var(--font-xl)', fontWeight: 900, margin: 0, color: '#1E293B' },
  coinPill: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#FFFBEB', border: '2px solid #FDE68A',
    borderRadius: 20, padding: '8px 18px',
    fontSize: 18, fontWeight: 900, color: '#92400E',
  },
  coinNum: { fontSize: 22, fontWeight: 900 },
  sub: { color: '#64748B', fontSize: 15, fontWeight: 600, marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 16 },
  card: {
    background: '#FFFFFF', borderRadius: 20, padding: '20px 12px', textAlign: 'center',
    border: '1.5px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    transition: 'all 0.2s',
  },
  emojiWrap: { position: 'relative', display: 'inline-flex' },
  itemEmoji: { fontSize: 56 },
  ownedBadge: {
    position: 'absolute', top: -4, right: -8,
    background: '#22C55E', color: '#fff', borderRadius: '50%',
    width: 22, height: 22, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 900, fontSize: 13,
  },
  itemLabel: { fontSize: 15, fontWeight: 800, color: '#1E293B' },
  btn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    border: 'none', borderRadius: 14, padding: '10px 16px',
    fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
    width: '100%',
  },
  btnBuy:    { background: 'linear-gradient(135deg, #F59E0B, #F97316)', color: '#fff' },
  btnLocked: { background: '#F1F5F9', color: '#94A3B8', cursor: 'not-allowed', opacity: 0.6 },
  btnUse:    { background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff' },
};
