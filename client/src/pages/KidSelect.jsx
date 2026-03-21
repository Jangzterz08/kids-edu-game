import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKid } from '../context/KidContext';
import { api } from '../lib/api';
import KidCard from '../components/kid/KidCard';
import AddKidModal from '../components/kid/AddKidModal';
import SetPinModal from '../components/kid/SetPinModal';
import AvatarPicker from '../components/kid/AvatarPicker';
import OceanFish from '../components/OceanFish';

export default function KidSelect() {
  const { kids, setKids, selectKid, refreshKids } = useKid();
  const [showAdd, setShowAdd]       = useState(false);
  const [pinKid, setPinKid]         = useState(null);
  const [picKid, setPicKid]         = useState(null);
  const [picAvatar, setPicAvatar]   = useState('');
  const [loading, setLoading]       = useState(true);
  const [confirmKid, setConfirmKid] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    refreshKids().finally(() => setLoading(false));
  }, []);

  async function handleDelete(kid) {
    setConfirmKid(kid);
  }

  async function confirmDelete() {
    if (!confirmKid) return;
    await api.delete(`/api/kids/${confirmKid.id}`);
    setConfirmKid(null);
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

  async function handleSavePic() {
    if (!picKid) return;
    await api.put(`/api/kids/${picKid.id}`, { avatarId: picAvatar });
    setPicKid(null);
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
                onSetPic={(k) => { setPicKid(k); setPicAvatar(k.avatarId || 'bear'); }}
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
        {picKid && (
          <div style={styles.confirmOverlay} onClick={() => setPicKid(null)}>
            <div style={styles.confirmBox} onClick={e => e.stopPropagation()}>
              <p style={styles.confirmTitle}>Change {picKid.name}'s Avatar</p>
              <AvatarPicker value={picAvatar} onChange={setPicAvatar} />
              <div style={{ ...styles.confirmBtns, marginTop: 20 }}>
                <button className="kid-btn ghost" style={{ flex: 1 }} onClick={() => setPicKid(null)}>Cancel</button>
                <button className="kid-btn" style={{ flex: 1 }} onClick={handleSavePic}>Save</button>
              </div>
            </div>
          </div>
        )}
        {confirmKid && (
          <div style={styles.confirmOverlay}>
            <div style={styles.confirmBox}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🗑️</div>
              <p style={styles.confirmTitle}>Remove {confirmKid.name}?</p>
              <p style={styles.confirmSub}>This deletes all their progress and can't be undone.</p>
              <div style={styles.confirmBtns}>
                <button className="kid-btn ghost" style={{ flex: 1 }} onClick={() => setConfirmKid(null)}>
                  Cancel
                </button>
                <button className="kid-btn pink" style={{ flex: 1 }} onClick={confirmDelete}>
                  Remove
                </button>
              </div>
            </div>
          </div>
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
  confirmOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,60,100,0.55)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200,
  },
  confirmBox: {
    background: 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '2px solid rgba(255,255,255,0.7)',
    borderRadius: 28, padding: '36px 32px',
    maxWidth: 360, width: '90%', textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,80,120,0.25)',
    animation: 'bounce-in 0.35s cubic-bezier(0.175,0.885,0.32,1.275)',
  },
  confirmTitle: { fontSize: 'var(--font-lg)', fontWeight: 700, color: '#0A4A6E', marginBottom: 8, fontFamily: 'Fredoka, sans-serif' },
  confirmSub:   { fontSize: 'var(--font-sm)', color: '#1A7A9A', marginBottom: 28, lineHeight: 1.5 },
  confirmBtns:  { display: 'flex', gap: 12 },
};
