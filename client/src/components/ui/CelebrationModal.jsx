import { useEffect, useRef } from 'react';
import StarBadge from '../modules/StarBadge';

const CONFETTI_COLORS = ['#FF5252','#FFD600','#4CAF50','#2979FF','#E91E8C','#FF9800','#9C27B0'];

export default function CelebrationModal({ stars = 3, moduleName = '', onContinue }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      w: 8 + Math.random() * 8,
      h: 4 + Math.random() * 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      speed: 2 + Math.random() * 4,
      angle: Math.random() * Math.PI * 2,
      spin:  (Math.random() - 0.5) * 0.2,
    }));

    let rafId;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y += p.speed;
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

  const msgs = ['Amazing! 🎉', 'You did it! 🌟', 'Super job! 🏆'];
  const msg  = msgs[stars - 1] || msgs[0];

  return (
    <div style={styles.overlay}>
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.box}>
        <div style={styles.emoji}>🎊</div>
        <h1 style={styles.heading}>{msg}</h1>
        <p style={styles.sub}>{moduleName} complete!</p>
        <div style={{ marginBottom: 24 }}>
          <StarBadge stars={stars} size="lg" />
        </div>
        <button className="kid-btn green" onClick={onContinue} style={{ width: '100%' }}>
          Keep Going!
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
  },
  canvas: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  box: {
    background: 'var(--bg-surface)', borderRadius: 'var(--modal-radius)',
    padding: 48, textAlign: 'center', zIndex: 1, maxWidth: 380, width: '90%',
    boxShadow: 'var(--shadow-modal)', animation: 'bounce-in 0.5s ease',
  },
  emoji: { fontSize: 72, marginBottom: 8 },
  heading: { fontSize: 'var(--font-xl)', fontWeight: 900, marginBottom: 8 },
  sub: { fontSize: 'var(--font-base)', color: 'var(--text-secondary)', marginBottom: 16 },
};
