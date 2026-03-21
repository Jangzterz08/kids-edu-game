import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useKid } from '../../context/KidContext';
import { useAuth } from '../../context/AuthContext';
import { isMuted, setMuted } from '../../lib/sound';
import { AVATAR_EMOJIS } from '../../lib/avatars';

function OceanScene() {
  const bubblesRef = useRef(null);

  useEffect(() => {
    const el = bubblesRef.current;
    if (!el) return;
    for (let i = 0; i < 10; i++) {
      const b = document.createElement('div');
      const size = Math.random() * 14 + 5;
      b.style.cssText = `
        position:absolute;
        width:${size}px; height:${size}px;
        border-radius:50%;
        border:2px solid rgba(255,255,255,0.3);
        background:rgba(255,255,255,0.05);
        left:${Math.random() * 100}%;
        bottom:${Math.random() * 50}%;
        animation:bubble-rise ${Math.random() * 7 + 5}s linear ${Math.random() * 10}s infinite;
      `;
      el.appendChild(b);
    }
  }, []);

  return (
    <div style={scene.wrap}>
      {/* Light rays */}
      {[15, 28, 45, 62, 78].map((left, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: `${left}%`,
          width: 70, height: '65vh',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, transparent 100%)',
          transformOrigin: 'top center',
          animation: `ray-sway ${7 + i}s ease-in-out ${i * 0.8}s infinite`,
        }} />
      ))}

      {/* Sun rays from top */}
      {[10, 25, 42, 60, 76].map((left, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: `${left}%`,
          width: 60, height: '55vh',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)',
          transformOrigin: 'top center',
          animation: `ray-sway ${7 + i}s ease-in-out ${i * 0.8}s infinite`,
        }} />
      ))}

      {/* Back wave — light cyan */}
      <div style={{ ...scene.wave, bottom: '38%', height: '52%', background: 'rgba(59,191,232,0.4)', borderRadius: '60% 60% 0 0 / 30% 30% 0 0' }} />
      {/* Mid wave — vivid cyan */}
      <div style={{ ...scene.wave, bottom: '22%', height: '44%', background: 'linear-gradient(180deg,#3BBFE8,#2AAED8)', borderRadius: '55% 65% 0 0 / 28% 38% 0 0' }} />
      {/* Mid wave 2 — slightly deeper */}
      <div style={{ ...scene.wave, bottom: '28%', left: '42%', width: '68%', height: '38%', background: '#2AAED8', borderRadius: '65% 35% 0 0 / 45% 25% 0 0', opacity: 0.6 }} />
      {/* Sandy floor */}
      <div style={{ ...scene.wave, bottom: 0, height: '28%', background: 'linear-gradient(180deg,#3BBFE8 0%,#5BC8EC 15%,#E8C87A 38%,#D4A84B 100%)', borderRadius: '50% 50% 0 0 / 18% 18% 0 0' }} />

      {/* Seaweed left — bright green */}
      <div style={{ position: 'absolute', bottom: '22%', left: '3%', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {['#4CC860','#38B048','#4CC860','#38B048','#4CC860','#38B048'].map((bg, i) => (
          <div key={i} style={{ width: 14, height: 20, background: bg, borderRadius: '50%', animation: `sway 3s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: '22%', left: '9%', display: 'flex', flexDirection: 'column', gap: 0, transform: 'scale(0.75)' }}>
        {['#38B048','#4CC860','#38B048','#4CC860'].map((bg, i) => (
          <div key={i} style={{ width: 14, height: 20, background: bg, borderRadius: '50%', animation: `sway 3.5s ease-in-out ${i * 0.3 + 0.5}s infinite` }} />
        ))}
      </div>
      {/* Seaweed right */}
      <div style={{ position: 'absolute', bottom: '22%', right: '4%', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {['#4CC860','#58D870','#4CC860','#58D870','#4CC860','#58D870'].map((bg, i) => (
          <div key={i} style={{ width: 14, height: 20, background: bg, borderRadius: '50%', animation: `sway 2.8s ease-in-out ${i * 0.25}s infinite` }} />
        ))}
      </div>

      {/* Coral — warm coral red */}
      {[['12%','23%','0.5s'],['20%','25.5%','1s'],['right:11%','23.5%','0.2s'],['right:20%','26%','1.2s']].map(([lr, b, delay], i) => (
        <div key={i} style={{
          position: 'absolute', bottom: b,
          ...(lr.startsWith('right') ? { right: lr.split(':')[1] } : { left: lr }),
          fontSize: i % 2 === 0 ? 38 : 28,
          animation: `sway 4s ease-in-out ${delay} infinite`,
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.15))',
        }}>🪸</div>
      ))}

      {/* Floating items */}
      {[
        { emoji: '🐠', top: '30%', left: '7%', delay: '0s' },
        { emoji: '⭐', top: '38%', right: '9%', delay: '1.5s' },
        { emoji: '🐚', top: '50%', left: '17%', delay: '3s' },
        { emoji: '🐡', top: '24%', right: '22%', delay: '2s' },
        { emoji: '✨', top: '57%', right: '30%', delay: '0.8s', size: 18 },
        { emoji: '🫧', top: '44%', left: '35%', delay: '2.5s', size: 20 },
      ].map((item, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: item.top,
          ...(item.left ? { left: item.left } : { right: item.right }),
          fontSize: item.size || 24,
          animation: `ocean-float ${6 + i}s ease-in-out ${item.delay} infinite`,
          opacity: 0.85,
          pointerEvents: 'none',
        }}>{item.emoji}</div>
      ))}

      {/* Swimming fish */}
      {[
        { top: '42%', duration: '14s', delay: '0s', size: 26 },
        { top: '57%', duration: '20s', delay: '6s', size: 20 },
        { top: '33%', duration: '25s', delay: '11s', size: 22 },
      ].map((fish, i) => (
        <div key={i} style={{
          position: 'absolute', top: fish.top,
          fontSize: fish.size,
          animation: `swim ${fish.duration} linear ${fish.delay} infinite`,
          pointerEvents: 'none',
        }}>{['🐟','🐠','🐡'][i]}</div>
      ))}

      {/* Bubbles container */}
      <div ref={bubblesRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
    </div>
  );
}

export default function KidLayout() {
  const { activeKid, clearKid } = useKid();
  const { kidSession, signOutKid } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mutedState, setMutedState] = useState(isMuted());
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Routes where exit needs no confirmation (not mid-game)
  const safeRoutes = ['/play', '/play/store', '/play/leaderboard'];
  const inGame = !safeRoutes.includes(location.pathname);

  function handleHome() { navigate('/play'); }

  function toggleMute() {
    const next = !mutedState;
    setMuted(next);
    setMutedState(next);
  }

  function handleExitClick() {
    if (inGame) { setShowExitConfirm(true); }
    else { doExit(); }
  }

  function doExit() {
    clearKid();
    if (kidSession) { signOutKid(); navigate('/login'); }
    else { navigate('/'); }
  }

  return (
    <div style={styles.container}>
      <OceanScene />
      <header style={styles.header}>
        <button onClick={handleHome} style={styles.homeBtn} aria-label="Go home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
        <div style={styles.kidInfo}>
          <span style={styles.avatar}>{AVATAR_EMOJIS[activeKid?.avatarId] || '🐻'}</span>
          <span style={styles.kidName}>{activeKid?.name}</span>
          <span style={styles.stars}>⭐ {activeKid?.totalStars || 0}</span>
        </div>
        <div style={styles.rightBtns}>
          <button onClick={toggleMute} style={styles.muteBtn} aria-label={mutedState ? 'Unmute' : 'Mute'}>
            {mutedState ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>
          <button onClick={handleExitClick} style={styles.exitBtn} aria-label="Exit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="18" height="18" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </header>
      <main style={styles.main}>
        <Outlet />
      </main>

      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmBox}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🚪</div>
            <p style={styles.confirmTitle}>Leave the game?</p>
            <p style={styles.confirmSub}>Your progress in this game won't be saved.</p>
            <div style={styles.confirmBtns}>
              <button className="kid-btn ghost" style={{ flex: 1 }} onClick={() => setShowExitConfirm(false)}>
                Keep Playing
              </button>
              <button className="kid-btn pink" style={{ flex: 1 }} onClick={doExit}>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const scene = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none',
  },
  wave: {
    position: 'absolute', left: '-5%', width: '110%',
    filter: 'drop-shadow(0 -6px 14px rgba(0,150,220,0.25))',
  },
};

const styles = {
  container: { height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', height: 56, flexShrink: 0,
    background: 'rgba(91,200,236,0.55)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '2px solid rgba(255,255,255,0.4)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  homeBtn: {
    fontSize: 26, background: 'rgba(255,255,255,0.35)', border: '2px solid rgba(255,255,255,0.6)',
    cursor: 'pointer', padding: 8, borderRadius: 14, lineHeight: 1,
  },
  kidInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar:  { fontSize: 30 },
  kidName: { fontSize: 18, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,100,150,0.4)' },
  stars:   { fontSize: 16, fontWeight: 700, color: '#FFF176', textShadow: '0 1px 4px rgba(0,0,0,0.2)' },
  rightBtns: { display: 'flex', alignItems: 'center', gap: 8 },
  muteBtn: {
    background: 'rgba(255,255,255,0.3)', border: '2px solid rgba(255,255,255,0.5)',
    color: '#fff', cursor: 'pointer', borderRadius: '50%',
    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  exitBtn: {
    background: 'rgba(255,255,255,0.3)',
    border: '2px solid rgba(255,255,255,0.5)',
    color: '#fff', cursor: 'pointer', borderRadius: '50%',
    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  main: { flex: 1, position: 'relative', zIndex: 1, overflowY: 'auto', height: 'calc(100dvh - 56px)' },
  confirmOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,60,100,0.6)',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200,
  },
  confirmBox: {
    background: 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '2px solid rgba(255,255,255,0.7)',
    borderRadius: 28, padding: '36px 32px',
    maxWidth: 360, width: '90%', textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,80,120,0.25)',
    animation: 'bounce-in 0.35s cubic-bezier(0.175,0.885,0.32,1.275)',
  },
  confirmTitle: { fontSize: 'var(--font-lg)', fontWeight: 700, color: '#0A4A6E', marginBottom: 8, fontFamily: 'Fredoka, sans-serif' },
  confirmSub:   { fontSize: 'var(--font-sm)', color: '#1A7A9A', marginBottom: 28, lineHeight: 1.5 },
  confirmBtns:  { display: 'flex', gap: 12 },
};
