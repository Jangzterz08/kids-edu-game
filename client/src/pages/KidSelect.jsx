import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKid } from '../context/KidContext';
import { api } from '../lib/api';
import KidCard from '../components/kid/KidCard';
import AddKidModal from '../components/kid/AddKidModal';

export default function KidSelect() {
  const { kids, setKids, selectKid, refreshKids } = useKid();
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    refreshKids().finally(() => setLoading(false));
  }, []);

  async function handleDelete(kid) {
    if (!confirm(`Remove ${kid.name}? This deletes all their progress.`)) return;
    await api.delete(`/api/kids/${kid.id}`);
    refreshKids();
  }

  function handleSelect(kid) {
    selectKid(kid);
    navigate('/play');
  }

  function handleAdded(kid) {
    setShowAdd(false);
    refreshKids();
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Who's playing today?</h1>
      {loading ? (
        <p style={styles.loading}>Loading kids...</p>
      ) : (
        <div style={styles.grid}>
          {kids.map(kid => (
            <KidCard
              key={kid.id}
              kid={kid}
              onClick={() => handleSelect(kid)}
              onDelete={handleDelete}
            />
          ))}
          <button style={styles.addCard} onClick={() => setShowAdd(true)}>
            <span style={styles.addIcon}>+</span>
            <span style={styles.addLabel}>Add Kid</span>
          </button>
        </div>
      )}
      {showAdd && (
        <AddKidModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />
      )}
    </div>
  );
}

const styles = {
  container: { padding: 'var(--space-xl)', maxWidth: 800, margin: '0 auto' },
  heading: { fontSize: 'var(--font-xl)', fontWeight: 900, textAlign: 'center', marginBottom: 40 },
  loading: { textAlign: 'center', fontSize: 'var(--font-md)', color: 'var(--text-secondary)' },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20,
  },
  addCard: {
    background: 'var(--bg-surface)', borderRadius: 24, padding: 24,
    border: '3px dashed var(--text-muted)', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: 140, gap: 8, transition: 'border-color 0.15s',
  },
  addIcon: { fontSize: 48, color: 'var(--text-muted)' },
  addLabel: { fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-muted)' },
};
