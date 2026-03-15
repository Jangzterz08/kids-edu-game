import { useEffect, useRef } from 'react';

const FISH = [
  { emoji: '🐟', top: '18%', duration: '16s', delay: '0s',   size: 28 },
  { emoji: '🐠', top: '55%', duration: '22s', delay: '5s',   size: 22 },
  { emoji: '🐡', top: '35%', duration: '28s', delay: '11s',  size: 24 },
  { emoji: '🐟', top: '72%', duration: '19s', delay: '8s',   size: 18 },
  { emoji: '🐠', top: '42%', duration: '34s', delay: '2s',   size: 20 },
];

const FLOATERS = [
  { emoji: '⭐', top: '20%', left: '8%',  delay: '0s',   size: 20 },
  { emoji: '🐚', top: '65%', left: '15%', delay: '2s',   size: 22 },
  { emoji: '✨', top: '38%', right: '7%', delay: '1s',   size: 16 },
  { emoji: '🫧', top: '50%', left: '88%', delay: '3.5s', size: 22 },
  { emoji: '🌟', top: '80%', right: '20%',delay: '4s',   size: 18 },
];

export default function OceanFish() {
  const bubblesRef = useRef(null);

  useEffect(() => {
    const el = bubblesRef.current;
    if (!el) return;
    const bubbles = [];
    for (let i = 0; i < 18; i++) {
      const b = document.createElement('div');
      const size = Math.random() * 12 + 4;
      b.style.cssText = `
        position:absolute;
        width:${size}px; height:${size}px;
        border-radius:50%;
        border:2px solid rgba(255,255,255,0.35);
        background:rgba(255,255,255,0.06);
        left:${Math.random() * 100}%;
        bottom:${Math.random() * 60}%;
        animation:bubble-rise ${Math.random() * 8 + 5}s linear ${Math.random() * 12}s infinite;
        pointer-events:none;
      `;
      el.appendChild(b);
      bubbles.push(b);
    }
    return () => bubbles.forEach(b => b.remove());
  }, []);

  return (
    <div style={s.wrap}>
      {/* Swimming fish */}
      {FISH.map((f, i) => (
        <div key={i} style={{
          position: 'absolute', top: f.top,
          fontSize: f.size,
          animation: `swim ${f.duration} linear ${f.delay} infinite`,
          pointerEvents: 'none', opacity: 0.88,
        }}>{f.emoji}</div>
      ))}

      {/* Floating decorations */}
      {FLOATERS.map((f, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: f.top,
          ...(f.left ? { left: f.left } : { right: f.right }),
          fontSize: f.size,
          animation: `ocean-float ${7 + i * 1.2}s ease-in-out ${f.delay} infinite`,
          pointerEvents: 'none', opacity: 0.7,
        }}>{f.emoji}</div>
      ))}

      {/* Bubbles */}
      <div ref={bubblesRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
    </div>
  );
}

const s = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 0,
    overflow: 'hidden', pointerEvents: 'none',
  },
};
