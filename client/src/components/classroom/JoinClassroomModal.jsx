import { useState } from 'react';
import { api } from '../../lib/api';

export default function JoinClassroomModal({ kidId, onClose, onJoined }) {
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    setLoading(true);
    try {
      await api.post(`/api/kids/${kidId}/join-classroom`, { joinCode: code.trim().toUpperCase() });
      onJoined();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={styles.title}>Join a Classroom</h2>
        <p style={styles.hint}>Enter the 6-character code from your teacher</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="e.g. XK72PL"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            autoFocus
          />
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.buttons}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading || code.length < 4} className="kid-btn">
              {loading ? '...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'var(--bg-surface)', borderRadius: 24, padding: 32,
    width: '90%', maxWidth: 380, textAlign: 'center',
  },
  title: { fontSize: 'var(--font-lg)', fontWeight: 900, marginBottom: 8 },
  hint: { fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: {
    padding: '16px 20px', borderRadius: 16, border: '2px solid #E0E0E0',
    fontSize: 24, fontWeight: 800, fontFamily: 'monospace',
    textAlign: 'center', letterSpacing: 4, outline: 'none',
    background: 'var(--bg-surface-alt)',
  },
  error: { color: 'var(--error)', fontWeight: 700, fontSize: 'var(--font-sm)' },
  buttons: { display: 'flex', gap: 12, justifyContent: 'center' },
  cancelBtn: {
    background: 'none', border: '2px solid #E0E0E0', padding: '10px 24px',
    borderRadius: 16, fontWeight: 700, fontSize: 'var(--font-sm)', cursor: 'pointer',
  },
};
