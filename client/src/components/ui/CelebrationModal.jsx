import { useEffect, useRef, useState } from 'react';
import StarBadge from '../modules/StarBadge';
import Mascot from '../mascot/Mascot';

const CONFETTI_COLORS = ['#FF5252','#FFD600','#4CAF50','#2979FF','#E91E8C','#FF9800','#9C27B0'];
const BURST_EMOJIS   = ['🐠','🐡','🐚','🌟','🦀','🐙','⭐','🎉'];

export default function CelebrationModal({ stars = 3, moduleName = '', coinsEarned = 0, onContinue }) {
  const canvasRef = useRef(null);
  const [burst, setBurst] = useState([]);

  // Canvas confetti rain
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      w: 8 + Math.random() * 10,
      h: 4 + Math.random() * 5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      speed: 2 + Math.random() * 4,
      angle: Math.random() * Math.PI * 2,
      spin:  (Math.random() - 0.5) * 0.25,
      drift: (Math.random() - 0.5) * 1.5,
    }));

    let rafId;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y += p.speed;
        p.x += p.drift;
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      });
      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Emoji burst from center
  useEffect(() => {
    const count = 12;
    const items = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const dist  = 90 + Math.random() * 60;
      return {
        id: i,
        emoji: BURST_EMOJIS[i % BURST_EMOJIS.length],
        tx: Math.round(Math.cos(angle) * dist),
        ty: Math.round(Math.sin(angle) * dist),
        rot: `${Math.round((Math.random() - 0.5) * 360)}deg`,
        delay: i * 40,
      };
    });
    setBurst(items);
  }, []);

  const msgs = ['Great try! 💪', 'You did it! 🌟', 'Amazing! 🎉'];
  const msg  = msgs[stars - 1] || msgs[0];

  return (
    <div style={styles.overlay}>
      <canvas ref={canvasRef} style={styles.canvas} />

        {/* Emoji burst particles */}
      <div style={styles.burstOrigin}>
        {burst.map(p => (
          <span
            key={p.id}
            style={{
              ...styles.burstParticle,
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              '--rot': p.rot,
              animationDelay: `${p.delay}ms`,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      <div className="glass-panel" style={styles.box}>
        <Mascot mood="excited" size="lg" showBubble={false} />
        <h1 style={styles.heading}>{msg}</h1>
        <p style={styles.sub}>{moduleName} complete!</p>
        <div style={{ marginBottom: 32 }}>
          <StarBadge stars={stars} size="lg" />
        </div>
        {coinsEarned > 0 && (
          <div style={styles.coinBanner}>
            <span style={styles.coinIcon}>🪙</span>
            <span style={styles.coinText}>+{coinsEarned} coins earned!</span>
          </div>
        )}
        <button className="kid-btn green" onClick={onContinue} style={{ width: '100%' }}>
          Keep Going!
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,60,100,0.6)',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
  },
  canvas: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  burstOrigin: {
    position: 'absolute', top: '50%', left: '50%',
    width: 0, height: 0, pointerEvents: 'none', zIndex: 2,
  },
  burstParticle: {
    position: 'absolute', top: '50%', left: '50%',
    fontSize: 48, lineHeight: 1, filter: 'drop-shadow(0 0 12px #FFF)',
    animation: 'burst-out 0.9s ease-out forwards',
  },
  box: {
    padding: '48px 32px', textAlign: 'center', zIndex: 3, maxWidth: 460, width: '90%',
    animation: 'bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  emoji:   { fontSize: 80, marginBottom: 12 },
  heading: { fontSize: 'var(--font-xl)', fontWeight: 900, marginBottom: 12, color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.6)' },
  sub:     { fontSize: 'var(--font-lg)', color: 'var(--text-secondary)', marginBottom: 24, fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  coinBanner: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    background: 'rgba(255, 234, 0, 0.2)', border: '1px solid rgba(255,234,0,0.5)',
    borderRadius: 24, padding: '16px 24px', marginBottom: 28,
    animation: 'bounce-in 0.4s ease', backdropFilter: 'blur(10px)',
    boxShadow: '0 12px 24px rgba(255,234,0,0.2)',
  },
  coinIcon: { fontSize: 40, filter: 'drop-shadow(0 0 12px rgba(255,234,0,0.8))' },
  coinText: { fontSize: 24, fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)', letterSpacing: 1 },
};
