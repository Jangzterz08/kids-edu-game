import { useState } from 'react';
import { api } from '../../lib/api';

export default function SetPinModal({ kid, onClose, onSaved }) {
  const [pin, setPin]           = useState('');
  const [confirm, setConfirm]   = useState('');
  const [step, setStep]         = useState('enter'); // 'enter' | 'confirm'
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  function handleEnter(e) {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN must be 4-6 digits');
      return;
    }
    setError('');
    setStep('confirm');
  }

  async function handleConfirm(e) {
    e.preventDefault();
    if (pin !== confirm) {
      setError("PINs don't match");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/kid-set-pin', { kidId: kid.id, pin });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={styles.title}>Set PIN for {kid.name}</h2>
        <p style={styles.hint}>Your kid will use this PIN to log in directly</p>

        {step === 'enter' ? (
          <form onSubmit={handleEnter} style={styles.form}>
            <input
              style={styles.input} type="password" inputMode="numeric"
              placeholder="Enter 4-6 digit PIN" maxLength={6}
              value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
            {error && <p style={styles.error}>{error}</p>}
            <div style={styles.buttons}>
              <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
              <button type="submit" className="kid-btn">Next</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirm} style={styles.form}>
            <input
              style={styles.input} type="password" inputMode="numeric"
              placeholder="Confirm PIN" maxLength={6}
              value={confirm} onChange={e => setConfirm(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
            {error && <p style={styles.error}>{error}</p>}
            <div style={styles.buttons}>
              <button type="button" onClick={() => { setStep('enter'); setConfirm(''); setError(''); }} style={styles.cancelBtn}>Back</button>
              <button type="submit" disabled={loading} className="kid-btn">
                {loading ? '...' : 'Save PIN'}
              </button>
            </div>
          </form>
        )}
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
    width: '90%', maxWidth: 360, textAlign: 'center',
  },
  title: { fontSize: 'var(--font-lg)', fontWeight: 900, marginBottom: 8 },
  hint: { fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: {
    padding: '16px 20px', borderRadius: 16, border: '2px solid #E0E0E0',
    fontSize: 24, fontWeight: 800, textAlign: 'center', letterSpacing: 6,
    outline: 'none', background: 'var(--bg-surface-alt)', fontFamily: 'monospace',
  },
  error: { color: 'var(--error)', fontWeight: 700, fontSize: 'var(--font-sm)' },
  buttons: { display: 'flex', gap: 12, justifyContent: 'center' },
  cancelBtn: {
    background: 'none', border: '2px solid #E0E0E0', padding: '10px 24px',
    borderRadius: 16, fontWeight: 700, fontSize: 'var(--font-sm)', cursor: 'pointer',
  },
};
