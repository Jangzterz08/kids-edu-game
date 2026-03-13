import { useRef, useState, useEffect, useCallback } from 'react';
import { speakWord } from '../../lib/sound';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ROUNDS = 3;
const AUTO_ADVANCE_THRESHOLD = 65;

export default function TracingGame({ lessons, onComplete }) {
  const [queue]   = useState(() => shuffle(lessons).slice(0, Math.min(ROUNDS, lessons.length)));
  const [idx, setIdx]         = useState(0);
  const [scores, setScores]   = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [coverage, setCoverage] = useState(0);
  const [done, setDone]       = useState(false);
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  const lesson = queue[idx];
  const char = lesson.letter || lesson.numeral || lesson.word[0].toUpperCase();

  const drawGuide = useCallback((canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Dashed outline
    ctx.setLineDash([12, 7]);
    ctx.strokeStyle = '#CFD8DC';
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.font = 'bold 190px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(char, canvas.width / 2, canvas.height / 2);
    // Ghost fill
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillText(char, canvas.width / 2, canvas.height / 2);
  }, [char]);

  // Animate pulsing start-dot in top-left area of letter
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawGuide(canvas);
    setCoverage(0);
    setDone(false);
    speakWord(lesson.letter ? `Letter ${char}` : lesson.numeral ? `Number ${char}` : lesson.word);

    let t = 0;
    function pulse() {
      if (!canvasRef.current) return;
      const c = canvasRef.current.getContext('2d');
      // Re-draw guide (keeps dot on top without clearing user strokes on first frame)
      const pulse = 0.6 + 0.4 * Math.sin(t++ / 8);
      c.save();
      c.setLineDash([]);
      c.beginPath();
      c.arc(canvas.width * 0.35, canvas.height * 0.28, 14 * pulse, 0, Math.PI * 2);
      c.fillStyle = `rgba(41,121,255,${0.7 * pulse})`;
      c.fill();
      c.restore();
      animRef.current = requestAnimationFrame(pulse);
    }
    animRef.current = requestAnimationFrame(pulse);
    return () => cancelAnimationFrame(animRef.current);
  }, [idx, drawGuide]);

  function clearCanvas() {
    cancelAnimationFrame(animRef.current);
    const canvas = canvasRef.current;
    drawGuide(canvas);
    setCoverage(0);
    setDone(false);
  }

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches?.[0];
    return {
      x: (touch ? touch.clientX : e.clientX) - rect.left,
      y: (touch ? touch.clientY : e.clientY) - rect.top,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    ctx.setLineDash([]);
    ctx.strokeStyle = '#2979FF';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setDrawing(true);
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function endDraw() {
    if (!drawing) return;
    setDrawing(false);
    const canvas = canvasRef.current;
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let blue = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 2] > 150 && data[i] < 100) blue++;
    }
    const pct = Math.min(100, Math.round((blue / (canvas.width * canvas.height * 0.15)) * 100));
    setCoverage(pct);
    if (pct >= AUTO_ADVANCE_THRESHOLD && !done) {
      setDone(true);
      cancelAnimationFrame(animRef.current);
      setTimeout(() => handleNext(pct), 800);
    }
  }

  function handleNext(overrideScore) {
    const score = Math.max(overrideScore ?? coverage, 50);
    const newScores = [...scores, score];
    setScores(newScores);

    if (idx < queue.length - 1) {
      setIdx(i => i + 1);
    } else {
      const avg = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length);
      onComplete(avg);
    }
  }

  function handleSkip() {
    onComplete(50);
  }

  const isLast = idx === queue.length - 1;

  return (
    <div style={styles.container}>
      {/* Round dots */}
      <div style={styles.dots}>
        {queue.map((_, i) => (
          <div key={i} style={{ ...styles.dot, background: i < idx ? 'var(--accent-blue)' : i === idx ? 'var(--accent-blue)' : 'var(--text-muted)', opacity: i < idx ? 0.4 : 1 }} />
        ))}
      </div>

      <h2 style={styles.title}>
        Trace the {lesson.letter ? `letter ${char}` : lesson.numeral ? `number ${char}` : lesson.word}! ✏️
      </h2>

      <div style={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          width={320} height={320}
          style={styles.canvas}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      {done
        ? <div style={{ ...styles.coverage, color: 'var(--accent-green)', fontSize: 22 }}>Great job! 🌟</div>
        : coverage > 0
          ? <div style={styles.coverage}>{coverage}% — {coverage >= AUTO_ADVANCE_THRESHOLD ? 'Almost there!' : 'Keep going!'}</div>
          : <div style={styles.coverage}>Trace the letter above ☝️</div>
      }

      <div style={styles.actions}>
        <button className="kid-btn ghost" onClick={clearCanvas} style={{ flex: 1 }}>
          Clear
        </button>
        <button className="kid-btn ghost" onClick={handleSkip} style={{ flex: 1 }}>
          Skip
        </button>
        <button className="kid-btn green" onClick={() => handleNext()} style={{ flex: 2 }} disabled={done}>
          {isLast ? 'Done! ✅' : 'Next ➡️'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 'var(--space-xl)', maxWidth: 460, margin: '0 auto' },
  dots: { display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 },
  dot: { width: 14, height: 14, borderRadius: '50%', transition: 'all 0.3s' },
  title: { fontSize: 'var(--font-lg)', fontWeight: 900, textAlign: 'center', marginBottom: 24, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' },
  canvasWrap: {
    borderRadius: 32, overflow: 'hidden', border: '2px solid var(--glass-border)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.4)', background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    display: 'flex', justifyContent: 'center', marginBottom: 24,
  },
  canvas: { touchAction: 'none', cursor: 'crosshair', display: 'block' },
  coverage: { textAlign: 'center', fontWeight: 800, color: '#fff', marginBottom: 24, fontSize: 'var(--font-base)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  actions: { display: 'flex', gap: 16 },
};
