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

          let cardBg = 'var(--bg-surface)';
          if (isOwned) cardBg = 'linear-gradient(135deg, #E8F5E9, #C8E6C9)';
          if (isFlash && flash.success) cardBg = 'linear-gradient(135deg, #FFF9C4, #FFF176)';
          if (isFlash && !flash.success) cardBg = 'linear-gradient(135deg, #FFEBEE, #FFCDD2)';

          return (
            <div key={item.id} style={{ ...styles.card, background: cardBg }}>
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
  page: { padding: 'var(--space-xl)', maxWidth: 700, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' },
  backBtn: {
    background: 'var(--bg-surface-alt)', border: 'none', borderRadius: 12,
    padding: '8px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  titleRow: { display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
  titleEmoji: { fontSize: 32 },
  title: { fontSize: 'var(--font-xl)', fontWeight: 900, margin: 0 },
  coinPill: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'linear-gradient(135deg, #FFF9C4, #FFD600)',
    border: '2px solid #F9A825', borderRadius: 20, padding: '8px 16px',
    fontSize: 18, fontWeight: 900, color: '#5D4037',
  },
  coinNum: { fontSize: 22, fontWeight: 900 },
  sub: { color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24 },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16,
  },
  card: {
    borderRadius: 20, padding: '20px 12px', textAlign: 'center',
    boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 10, transition: 'background 0.3s',
  },
  emojiWrap: { position: 'relative', display: 'inline-flex' },
  itemEmoji: { fontSize: 56 },
  ownedBadge: {
    position: 'absolute', top: -4, right: -8,
    background: '#4CAF50', color: '#fff', borderRadius: '50%',
    width: 22, height: 22, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 900, fontSize: 13,
  },
  itemLabel: { fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' },
  btn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    border: 'none', borderRadius: 14, padding: '8px 16px',
    fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
    width: '100%',
  },
  btnBuy: { background: 'linear-gradient(135deg, #FFD600, #FF9800)', color: '#5D4037' },
  btnLocked: { background: 'var(--bg-surface-alt)', color: 'var(--text-muted)', cursor: 'not-allowed', opacity: 0.6 },
  btnUse: { background: 'linear-gradient(135deg, #4CAF50, #81C784)', color: '#fff' },
};
