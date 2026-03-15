import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKid } from '../context/KidContext';
import { api } from '../lib/api';
import LeaderboardTable from '../components/classroom/LeaderboardTable';

export default function KidLeaderboard() {
  const { activeKid } = useKid();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassrooms();
  }, [activeKid?.id]);

  async function loadClassrooms() {
    try {
      const data = await api.get(`/api/kids/me/classrooms`);
      setClassrooms(data.classrooms);
      if (data.classrooms.length > 0) {
        const first = data.classrooms[0].id;
        setSelectedId(first);
        await loadLeaderboard(first);
      }
    } catch (err) {
      console.error('Failed to load classrooms', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadLeaderboard(classroomId) {
    try {
      const data = await api.get(`/api/classrooms/${classroomId}/leaderboard`);
      setLeaderboard(data.leaderboard);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    }
  }

  async function handleSelectClassroom(id) {
    setSelectedId(id);
    await loadLeaderboard(id);
  }

  if (loading) return <div style={styles.center}>Loading...</div>;

  if (classrooms.length === 0) {
    return (
      <div style={styles.center}>
        <p style={styles.emptyEmoji}>🏆</p>
        <p style={styles.emptyText}>You're not in any classroom yet.</p>
        <p style={styles.emptyHint}>Ask your parent or teacher to add you!</p>
        <button onClick={() => navigate('/play')} className="kid-btn" style={{ marginTop: 16 }}>
          Back to Games
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>🏆 Class Ranking</h1>

      {/* Classroom tabs if multiple */}
      {classrooms.length > 1 && (
        <div style={styles.tabs}>
          {classrooms.map(c => (
            <button
              key={c.id}
              style={{ ...styles.tab, ...(selectedId === c.id ? styles.tabActive : {}) }}
              onClick={() => handleSelectClassroom(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <LeaderboardTable entries={leaderboard} highlightKidId={activeKid?.id} />
    </div>
  );
}

const styles = {
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: 60, textAlign: 'center',
  },
  emptyEmoji: { fontSize: 64, marginBottom: 8 },
  emptyText: { fontSize: 'var(--font-md)', fontWeight: 800, color: 'var(--text-primary)' },
  emptyHint: { fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' },
  page: { padding: 'var(--space-lg)' },
  heading: { fontSize: 'var(--font-xl)', fontWeight: 900, textAlign: 'center', marginBottom: 20 },
  tabs: { display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 },
  tab: {
    padding: '8px 18px', borderRadius: 16, border: '2px solid #E0E0E0',
    background: 'transparent', fontWeight: 700, fontSize: 'var(--font-sm)',
    cursor: 'pointer',
  },
  tabActive: { background: 'var(--accent-blue)', color: '#fff', borderColor: 'var(--accent-blue)' },
};
