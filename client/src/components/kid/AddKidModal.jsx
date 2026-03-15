import { useState } from 'react';
import AvatarPicker from './AvatarPicker';
import { api } from '../../lib/api';

export default function AddKidModal({ onClose, onAdded }) {
  const [name, setName]       = useState('');
  const [avatarId, setAvatar] = useState('bear');
  const [ageGroup, setAge]    = useState('5-6');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter a name!'); return; }
    setLoading(true);
    try {
      const kid = await api.post('/api/kids', { name: name.trim(), avatarId, ageGroup });
      onAdded(kid);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={styles.title}>Add a Kid</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Kid's name..."
              maxLength={30}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Age Group</label>
            <select style={styles.input} value={ageGroup} onChange={e => setAge(e.target.value)}>
              <option value="3-4">3–4 years</option>
              <option value="5-6">5–6 years</option>
              <option value="7-8">7–8 years</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Choose Avatar</label>
            <AvatarPicker value={avatarId} onChange={setAvatar} />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.actions}>
            <button type="button" onClick={onClose} className="kid-btn ghost" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={loading} className="kid-btn green" style={{ flex: 1 }}>
              {loading ? 'Adding...' : 'Add Kid!'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,60,100,0.45)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '2px solid rgba(255,255,255,0.75)',
    borderRadius: 32,
    padding: 'var(--space-xl)', width: '90%', maxWidth: 480,
    boxShadow: '0 20px 60px rgba(0,80,120,0.25)',
    animation: 'bounce-in 0.35s cubic-bezier(0.175,0.885,0.32,1.275)',
  },
  title: {
    fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: 24, textAlign: 'center',
    color: '#0A4A6E', fontFamily: 'Fredoka, sans-serif',
  },
  field: { marginBottom: 20 },
  label: {
    display: 'block', fontWeight: 700, marginBottom: 8,
    fontSize: 'var(--font-base)', color: '#0A4A6E',
    fontFamily: 'Fredoka, sans-serif',
  },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: 16,
    border: '2px solid rgba(255,255,255,0.7)',
    background: 'rgba(255,255,255,0.5)',
    fontSize: 'var(--font-base)',
    fontFamily: 'Fredoka, sans-serif', outline: 'none',
    color: '#0A4A6E',
    boxSizing: 'border-box',
  },
  error: { color: '#C84030', fontWeight: 700, marginBottom: 12 },
  actions: { display: 'flex', gap: 12, marginTop: 24 },
};
