import { useState, useEffect } from 'react';
import { useKid } from '../context/KidContext';
import { api } from '../lib/api';
import JoinClassroomModal from '../components/classroom/JoinClassroomModal';

export default function ParentClassrooms() {
  const { kids, refreshKids } = useKid();
  const [selectedKidId, setSelectedKidId] = useState(null);
  const [classrooms, setClassrooms]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showJoin, setShowJoin]           = useState(false);

  useEffect(() => {
    refreshKids().then(k => { if (k.length > 0 && !selectedKidId) setSelectedKidId(k[0].id); });
  }, []);

  useEffect(() => {
    if (selectedKidId) loadClassrooms(selectedKidId);
  }, [selectedKidId]);

  async function loadClassrooms(kidId) {
    setLoading(true);
    try {
      const data = await api.get(`/api/kids/${kidId}/classrooms`);
      setClassrooms(data.classrooms);
    } catch (err) {
      console.error('Failed to load classrooms', err);
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave(classroomId) {
    if (!confirm('Leave this classroom?')) return;
    try {
      await api.delete(`/api/kids/${selectedKidId}/leave-classroom/${classroomId}`);
      await loadClassrooms(selectedKidId);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleJoined() {
    setShowJoin(false);
    if (selectedKidId) await loadClassrooms(selectedKidId);
  }

  const selectedKid = kids.find(k => k.id === selectedKidId);

  return (
    <div>
      <h1 style={styles.heading}>Classrooms</h1>

      {/* Kid tabs */}
      {kids.length > 1 && (
        <div style={styles.tabs}>
          {kids.map(k => (
            <button
              key={k.id}
              style={{ ...styles.tab, ...(selectedKidId === k.id ? styles.tabActive : {}) }}
              onClick={() => setSelectedKidId(k.id)}
            >
              {k.name}
            </button>
          ))}
        </div>
      )}

      <div style={styles.actions}>
        <button className="kid-btn" onClick={() => setShowJoin(true)}>
          + Join a Classroom
        </button>
      </div>

      {loading ? (
        <p style={styles.empty}>Loading...</p>
      ) : classrooms.length === 0 ? (
        <p style={styles.empty}>
          {selectedKid?.name || 'This kid'} isn't in any classrooms yet. Enter a join code from your teacher!
        </p>
      ) : (
        <div style={styles.list}>
          {classrooms.map(c => (
            <div key={c.id} style={styles.card}>
              <div style={styles.cardInfo}>
                <span style={{ fontSize: 28 }}>🏫</span>
                <div>
                  <div style={styles.cardName}>{c.name}</div>
                  <div style={styles.cardTeacher}>Teacher: {c.teacher?.name || 'Unknown'}</div>
                </div>
              </div>
              <button onClick={() => handleLeave(c.id)} style={styles.leaveBtn}>Leave</button>
            </div>
          ))}
        </div>
      )}

      {showJoin && (
        <JoinClassroomModal
          kidId={selectedKidId}
          onClose={() => setShowJoin(false)}
          onJoined={handleJoined}
        />
      )}
    </div>
  );
}

const styles = {
  heading: { fontSize: 'var(--font-xl)', fontWeight: 900, marginBottom: 20 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: {
    padding: '8px 18px', borderRadius: 16, border: '2px solid #E0E0E0',
    background: 'transparent', fontWeight: 700, fontSize: 'var(--font-sm)', cursor: 'pointer',
  },
  tabActive: { background: 'var(--accent-blue)', color: '#fff', borderColor: 'var(--accent-blue)' },
  actions: { marginBottom: 20 },
  empty: { textAlign: 'center', padding: 40, color: 'var(--text-secondary)', fontSize: 'var(--font-md)' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg-surface)', padding: '16px 24px', borderRadius: 20,
    border: '2px solid #E0E0E0',
  },
  cardInfo: { display: 'flex', alignItems: 'center', gap: 14 },
  cardName: { fontWeight: 800, fontSize: 'var(--font-md)' },
  cardTeacher: { fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', fontWeight: 600 },
  leaveBtn: {
    background: 'none', border: '1px solid var(--error)', color: 'var(--error)',
    padding: '6px 14px', borderRadius: 12, fontWeight: 700, fontSize: 'var(--font-xs)',
    cursor: 'pointer',
  },
};
