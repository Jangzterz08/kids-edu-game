import { speakWord } from '../../lib/sound';

export default function SoundButton({ word, size = 'md' }) {
  const sz = size === 'sm' ? 48 : size === 'lg' ? 88 : 64;
  return (
    <button
      onClick={() => speakWord(word)}
      style={{ ...styles.btn, width: sz, height: sz, fontSize: sz * 0.45 }}
      title={`Hear "${word}"`}
    >
      🔊
    </button>
  );
}

const styles = {
  btn: {
    background: 'var(--accent-yellow)', border: 'none', borderRadius: '50%',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'transform 0.12s, box-shadow 0.12s',
  },
};
