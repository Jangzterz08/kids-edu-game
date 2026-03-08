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
    position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    background: 'var(--bg-surface)', borderRadius: 'var(--modal-radius)',
    padding: 'var(--space-xl)', width: '90%', maxWidth: 480,
    boxShadow: 'var(--shadow-modal)',
  },
  title: { fontSize: 'var(--font-lg)', fontWeight: 900, marginBottom: 24, textAlign: 'center' },
  field: { marginBottom: 20 },
  label: { display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 'var(--font-base)' },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: 16,
    border: '2px solid var(--text-muted)', fontSize: 'var(--font-base)',
    fontFamily: 'Nunito, sans-serif', outline: 'none',
    background: 'var(--bg-surface-alt)',
  },
  error: { color: 'var(--error)', fontWeight: 700, marginBottom: 12 },
  actions: { display: 'flex', gap: 12, marginTop: 24 },
};
