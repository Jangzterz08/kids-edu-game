import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function TeacherDashboard() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName]       = useState('');
  const [creating, setCreating]     = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadClassrooms(); }, []);

  async function loadClassrooms() {
    try {
      const data = await api.get('/api/classrooms');
      setClassrooms(data.classrooms);
    } catch (err) {
      console.error('Failed to load classrooms', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/api/classrooms', { name: newName.trim() });
      setNewName('');
      setShowCreate(false);
      await loadClassrooms();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div style={styles.center}>Loading classrooms...</div>;

  return (
    <div>
      <div style={styles.topRow}>
        <h1 style={styles.heading}>My Classrooms</h1>
        <button className="kid-btn" onClick={() => setShowCreate(!showCreate)}>
          + Create Classroom
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={styles.createForm}>
          <input
            style={styles.input} type="text" placeholder="Classroom name (e.g. Class 3A)"
            value={newName} onChange={e => setNewName(e.target.value)} autoFocus
          />
          <button type="submit" disabled={creating} className="kid-btn">
            {creating ? '...' : 'Create'}
          </button>
        </form>
      )}

      {classrooms.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No classrooms yet. Create one to get started!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {classrooms.map(c => (
            <button key={c.id} style={styles.card} onClick={() => navigate(`/teacher/classroom/${c.id}`)}>
              <div style={styles.cardTop}>
                <span style={styles.cardEmoji}>🏫</span>
                <span style={styles.cardName}>{c.name}</span>
              </div>
              <div style={styles.cardMeta}>
                <span>{c._count?.students ?? 0} students</span>
                <span style={styles.code}>Code: {c.joinCode}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  center: { textAlign: 'center', padding: 60, fontSize: 'var(--font-md)', color: 'var(--text-secondary)' },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  heading: { fontSize: 'var(--font-xl)', fontWeight: 900 },
  createForm: { display: 'flex', gap: 12, marginBottom: 24 },
  input: {
    flex: 1, padding: '14px 18px', borderRadius: 16, border: '2px solid #E0E0E0',
    fontSize: 'var(--font-base)', fontFamily: 'Nunito, sans-serif',
    outline: 'none', background: 'var(--bg-surface-alt)',
  },
  empty: { textAlign: 'center', padding: 60 },
  emptyText: { fontSize: 'var(--font-md)', color: 'var(--text-secondary)' },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20,
  },
  card: {
    background: 'var(--bg-surface)', borderRadius: 24, padding: 24,
    border: '2px solid #E0E0E0', cursor: 'pointer', textAlign: 'left',
    transition: 'transform 0.15s, box-shadow 0.15s',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: 12 },
  cardEmoji: { fontSize: 32 },
  cardName: { fontSize: 'var(--font-md)', fontWeight: 800 },
  cardMeta: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', fontWeight: 700,
  },
  code: { fontFamily: 'monospace', background: '#f0f0f0', padding: '2px 8px', borderRadius: 8 },
};
