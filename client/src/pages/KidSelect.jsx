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
  container: { padding: 'var(--space-2xl) var(--space-xl)', maxWidth: 840, margin: '0 auto' },
  heading: { fontSize: 'var(--font-2xl)', fontWeight: 900, textAlign: 'center', marginBottom: 48, color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.6)' },
  loading: { textAlign: 'center', fontSize: 'var(--font-md)', color: 'var(--text-secondary)', fontWeight: 800 },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24,
  },
  addCard: {
    background: 'rgba(255,255,255,0.05)', borderRadius: 32, padding: 24,
    border: '2px dashed rgba(255,255,255,0.3)', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: 180, gap: 12, transition: 'all 0.2s', backdropFilter: 'blur(10px)',
  },
  addIcon: { fontSize: 56, color: 'rgba(255,255,255,0.8)' },
  addLabel: { fontSize: 'var(--font-md)', fontWeight: 800, color: 'rgba(255,255,255,0.8)' },
};
