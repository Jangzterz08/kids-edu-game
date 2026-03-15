import { useState, useRef } from 'react';
import { speakWord } from '../../lib/sound';

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function fuzzyMatch(heard, target) {
  const h = heard.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (h === t || h.includes(t) || t.includes(h)) return true;
  // Allow 1 edit for short words, 2 for longer ones
  return levenshtein(h, t) <= (t.length <= 4 ? 1 : 2);
}

// ── Type-it fallback (iOS Safari / no SpeechRecognition) ───────────────────

function TypeItButton({ word }) {
  const [status, setStatus]   = useState('idle'); // idle | open | success | fail
  const [typed, setTyped]     = useState('');
  const inputRef              = useRef(null);

  function open() {
    speakWord(word);
    setTyped('');
    setStatus('open');
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function check() {
    if (!typed.trim()) return;
    const ok = fuzzyMatch(typed, word);
    setStatus(ok ? 'success' : 'fail');
    if (ok) speakWord('Great job!');
    else    speakWord('Try again!');
    setTimeout(() => { setStatus('idle'); setTyped(''); }, 2200);
  }

  function handleKey(e) {
    if (e.key === 'Enter') check();
  }

  if (status === 'open') {
    return (
      <div style={typeStyles.row}>
        <input
          ref={inputRef}
          value={typed}
          onChange={e => setTyped(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Type "${word}"…`}
          style={typeStyles.input}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <button onClick={check} style={typeStyles.checkBtn}>✓</button>
      </div>
    );
  }

  const bg = status === 'success' ? 'var(--success, #22C55E)'
           : status === 'fail'    ? '#F97316'
           : 'var(--accent-blue, #3B82F6)';
  const label = status === 'success' ? '⭐ Great job!'
              : status === 'fail'    ? '🔤 Try again!'
              : '⌨️ Type it!';

  return (
    <button
      onClick={open}
      disabled={status !== 'idle'}
      aria-label={`Type the word ${word}`}
      style={{ ...btnStyle, background: bg, minWidth: 170 }}
    >
      {label}
    </button>
  );
}

const typeStyles = {
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  input: {
    fontSize: 20, fontWeight: 700, padding: '10px 16px',
    borderRadius: 16, border: '3px solid var(--accent-blue, #3B82F6)',
    outline: 'none', width: 160, fontFamily: 'inherit',
    background: 'var(--bg-surface, #fff)', color: 'var(--text-primary)',
  },
  checkBtn: {
    fontSize: 22, fontWeight: 900, padding: '10px 18px',
    borderRadius: 16, border: 'none', cursor: 'pointer',
    background: 'var(--accent-blue, #3B82F6)', color: '#fff',
  },
};

const btnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  padding: '13px 30px', borderRadius: 50, border: 'none', color: '#fff',
  fontSize: 20, fontWeight: 800, cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(0,0,0,0.18)', transition: 'background 0.25s',
};

// ── Main component ──────────────────────────────────────────────────────────

export default function SpeakAlongButton({ word }) {
  const [status, setStatus] = useState('idle'); // idle | listening | success | fail
  const resultGot = useRef(false);

  // iOS Safari fallback — show keyboard input instead of mic
  if (!SpeechRecognitionAPI) return <TypeItButton word={word} />;

  function start() {
    if (status !== 'idle') return;

    // Speak the word first so child hears it one more time
    speakWord(word);
    setStatus('listening');
    resultGot.current = false;

    // Wait for TTS to finish, then open mic
    setTimeout(() => {
      const rec = new SpeechRecognitionAPI();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 5;

      // Safety timeout — force reset if stuck listening after 8s
      const safetyTimer = setTimeout(() => {
        if (!resultGot.current) {
          try { rec.abort(); } catch (_) {}
          setStatus('idle');
        }
      }, 8000);

      rec.onresult = (e) => {
        clearTimeout(safetyTimer);
        resultGot.current = true;
        const transcripts = Array.from(e.results[0]).map(r =>
          r.transcript.toLowerCase().trim()
        );
        const matched = transcripts.some(t => fuzzyMatch(t, word));
        setStatus(matched ? 'success' : 'fail');
        setTimeout(() => setStatus('idle'), 2200);
      };

      rec.onerror = () => { clearTimeout(safetyTimer); setStatus('idle'); };
      rec.onend   = () => { clearTimeout(safetyTimer); if (!resultGot.current) setStatus('idle'); };

      try { rec.start(); } catch (_) { clearTimeout(safetyTimer); setStatus('idle'); }
    }, 1300);
  }

  const cfg = {
    idle:      { icon: '🎤', label: 'Say it!',    bg: 'var(--accent-blue, #3B82F6)' },
    listening: { icon: '🔴', label: 'Listening…', bg: '#EF4444' },
    success:   { icon: '⭐', label: 'Great job!', bg: 'var(--success, #22C55E)' },
    fail:      { icon: '🎤', label: 'Try again!', bg: '#F97316' },
  }[status];

  return (
    <>
      <style>{`
        @keyframes mic-pulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 4px 14px rgba(239,68,68,0.4); }
          50%       { transform: scale(1.07); box-shadow: 0 6px 20px rgba(239,68,68,0.6); }
        }
      `}</style>
      <button
        onClick={start}
        disabled={status !== 'idle'}
        aria-label={`Say the word ${word}`}
        style={{
          ...btnStyle,
          background: cfg.bg,
          cursor: status === 'idle' ? 'pointer' : 'default',
          animation: status === 'listening' ? 'mic-pulse 1s ease infinite' : 'none',
          minWidth: 170,
        }}
      >
        <span style={{ fontSize: 26 }}>{cfg.icon}</span>
        <span>{cfg.label}</span>
      </button>
    </>
  );
}
