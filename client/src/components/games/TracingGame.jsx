import { useRef, useState, useEffect } from 'react';
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

export default function TracingGame({ lessons, onComplete }) {
  const [queue]   = useState(() => shuffle(lessons).slice(0, Math.min(ROUNDS, lessons.length)));
  const [idx, setIdx]         = useState(0);
  const [scores, setScores]   = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [coverage, setCoverage] = useState(0);
  const canvasRef = useRef(null);

  const lesson = queue[idx];
  const char = lesson.letter || lesson.numeral || lesson.word[0].toUpperCase();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setLineDash([10, 6]);
    ctx.strokeStyle = '#B0BEC5';
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.font = 'bold 180px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(char, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillText(char, canvas.width / 2, canvas.height / 2);

    setCoverage(0);
    speakWord(lesson.letter ? `Letter ${char}` : lesson.numeral ? `Number ${char}` : lesson.word);
  }, [idx]);

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
    setCoverage(Math.min(100, Math.round((blue / (canvas.width * canvas.height * 0.15)) * 100)));
  }

  function handleNext() {
    const score = Math.max(coverage, 50);
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

      {coverage > 0 && (
        <div style={styles.coverage}>{coverage}% covered</div>
      )}

      <div style={styles.actions}>
        <button className="kid-btn ghost" onClick={handleSkip} style={{ flex: 1 }}>
          Skip
        </button>
        <button className="kid-btn green" onClick={handleNext} style={{ flex: 2 }}>
          {isLast ? 'Done! ✅' : 'Next ➡️'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 'var(--space-xl)', maxWidth: 420, margin: '0 auto' },
  dots: { display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 },
  dot: { width: 12, height: 12, borderRadius: '50%', transition: 'all 0.2s' },
  title: { fontSize: 'var(--font-lg)', fontWeight: 900, textAlign: 'center', marginBottom: 20 },
  canvasWrap: {
    borderRadius: 24, overflow: 'hidden', border: '3px solid var(--text-muted)',
    boxShadow: 'var(--shadow-card)', background: '#FAFAFA',
    display: 'flex', justifyContent: 'center', marginBottom: 16,
  },
  canvas: { touchAction: 'none', cursor: 'crosshair', display: 'block' },
  coverage: { textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16 },
  actions: { display: 'flex', gap: 12 },
};
