import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKid } from '../context/KidContext';
import { api } from '../lib/api';
import KidCard from '../components/kid/KidCard';
import AddKidModal from '../components/kid/AddKidModal';
import SetPinModal from '../components/kid/SetPinModal';
import OceanFish from '../components/OceanFish';

export default function KidSelect() {
  const { kids, setKids, selectKid, refreshKids } = useKid();
  const [showAdd, setShowAdd] = useState(false);
  const [pinKid, setPinKid]   = useState(null);
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
    <div style={styles.page}>
      <OceanFish />
      <div style={styles.container}>
        <div style={styles.logoRow}>
          <span style={{ fontSize: 48 }}>🌊</span>
        </div>
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
                onSetPin={(k) => setPinKid(k)}
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
        {pinKid && (
          <SetPinModal
            kid={pinKid}
            onClose={() => setPinKid(null)}
            onSaved={() => { setPinKid(null); refreshKids(); }}
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    margin: 'calc(-1 * var(--space-xl))',
    minHeight: 'calc(100vh - 72px)',
    background: 'linear-gradient(180deg, #8BD4F2 0%, #5BC8EC 40%, #3BBFE8 70%, #E8C87A 88%, #D4A84B 100%)',
    backgroundAttachment: 'fixed',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: 'var(--space-2xl) var(--space-xl)',
    position: 'relative',
  },
  container: { width: '100%', maxWidth: 900, position: 'relative', zIndex: 1 },
  logoRow: { textAlign: 'center', marginBottom: 8 },
  heading: {
    fontSize: 'var(--font-2xl)', fontWeight: 700, textAlign: 'center',
    marginBottom: 40, color: '#fff',
    fontFamily: 'Fredoka, sans-serif',
    textShadow: '0 2px 12px rgba(0,80,120,0.35)',
  },
  loading: { textAlign: 'center', fontSize: 'var(--font-md)', color: '#fff', fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 },
  addCard: {
    background: 'rgba(255,255,255,0.35)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 28, padding: 24,
    border: '2.5px dashed rgba(255,255,255,0.7)', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: 190, gap: 12, transition: 'all 0.2s',
    boxShadow: '0 8px 24px rgba(0,80,120,0.15)',
  },
  addIcon:  { fontSize: 56, color: '#fff', textShadow: '0 2px 8px rgba(0,80,120,0.3)' },
  addLabel: { fontSize: 'var(--font-md)', fontWeight: 700, color: '#fff', fontFamily: 'Fredoka, sans-serif', textShadow: '0 1px 4px rgba(0,80,120,0.3)' },
};
