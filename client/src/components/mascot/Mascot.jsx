import { useEffect, useState } from 'react';

// Sunny the star — emoji-based mascot with mood states
const MOODS = {
  happy:       { emoji: '🌟', bubble: 'Ready to learn?' },
  excited:     { emoji: '🤩', bubble: 'Amazing job!!' },
  celebrating: { emoji: '🥳', bubble: "You're on fire!" },
  sleepy:      { emoji: '😴', bubble: 'Welcome back!' },
  encouraging: { emoji: '😊', bubble: 'Keep going!' },
  proud:       { emoji: '😍', bubble: 'So proud of you!' },
};

function getGreeting(streak) {
  if (streak >= 7)  return 'celebrating';
  if (streak >= 3)  return 'excited';
  if (streak === 0) return 'sleepy';
  return 'happy';
}

export default function Mascot({ mood: moodOverride, streak = 0, size = 'md', showBubble = true }) {
  const [bounce, setBounce] = useState(false);
  const moodKey = moodOverride || getGreeting(streak);
  const { emoji, bubble } = MOODS[moodKey] || MOODS.happy;

  // Bounce on mount and whenever mood changes
  useEffect(() => {
    setBounce(true);
    const t = setTimeout(() => setBounce(false), 600);
    return () => clearTimeout(t);
  }, [moodKey]);

  const fontSize = size === 'lg' ? 72 : size === 'sm' ? 36 : 56;

  return (
    <div style={styles.wrapper}>
      {showBubble && (
        <div style={styles.bubble}>
          <span style={styles.bubbleText}>{bubble}</span>
          <div style={styles.bubbleTail} />
        </div>
      )}
      <span
        style={{
          fontSize,
          display: 'inline-block',
          animation: bounce ? 'mascot-bounce 0.5s ease' : 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setBounce(true)}
        title="Sunny"
      >
        {emoji}
      </span>

      <style>{`
        @keyframes mascot-bounce {
          0%   { transform: scale(1) translateY(0); }
          30%  { transform: scale(1.25) translateY(-10px); }
          60%  { transform: scale(0.95) translateY(2px); }
          100% { transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },
  bubble: {
    position: 'relative',
    background: '#fff',
    border: '2px solid #E8EAF6',
    borderRadius: 16,
    padding: '8px 14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    maxWidth: 160,
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 13, fontWeight: 700, color: '#3C3C8C',
    whiteSpace: 'nowrap',
  },
  bubbleTail: {
    position: 'absolute', bottom: -9, left: '50%', transform: 'translateX(-50%)',
    width: 0, height: 0,
    borderLeft: '8px solid transparent',
    borderRight: '8px solid transparent',
    borderTop: '9px solid #fff',
    filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.05))',
  },
};
