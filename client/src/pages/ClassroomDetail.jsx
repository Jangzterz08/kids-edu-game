import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import LeaderboardTable from '../components/classroom/LeaderboardTable';

export default function ClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('leaderboard'); // 'leaderboard' | 'students'

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    try {
      const [detail, lb] = await Promise.all([
        api.get(`/api/classrooms/${id}`),
        api.get(`/api/classrooms/${id}/leaderboard`),
      ]);
      setClassroom(detail.classroom);
      setLeaderboard(lb.leaderboard);
    } catch (err) {
      console.error('Failed to load classroom', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveStudent(kidId) {
    if (!confirm('Remove this student from the classroom?')) return;
    try {
      await api.post(`/api/classrooms/${id}/remove-student`, { kidId });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this classroom? This cannot be undone.')) return;
    try {
      await api.delete(`/api/classrooms/${id}`);
      navigate('/teacher');
    } catch (err) {
      alert(err.message);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(classroom.joinCode);
  }

  if (loading) return <div style={styles.center}>Loading...</div>;
  if (!classroom) return <div style={styles.center}>Classroom not found</div>;

  return (
    <div>
      <button onClick={() => navigate('/teacher')} style={styles.backBtn}>← Back to Classrooms</button>

      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.heading}>{classroom.name}</h1>
          <div style={styles.codeRow}>
            <span style={styles.codeLabel}>Join Code:</span>
            <span style={styles.code}>{classroom.joinCode}</span>
            <button onClick={copyCode} style={styles.copyBtn}>Copy</button>
          </div>
        </div>
        <button onClick={handleDelete} style={styles.deleteBtn}>Delete Classroom</button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(tab === 'leaderboard' ? styles.tabActive : {}) }}
          onClick={() => setTab('leaderboard')}
        >🏆 Leaderboard</button>
        <button
          style={{ ...styles.tab, ...(tab === 'students' ? styles.tabActive : {}) }}
          onClick={() => setTab('students')}
        >👥 Students</button>
      </div>

      {tab === 'leaderboard' && (
        leaderboard.length === 0
          ? <p style={styles.emptyText}>No students yet. Share the join code with parents!</p>
          : <LeaderboardTable entries={leaderboard} />
      )}

      {tab === 'students' && (
        leaderboard.length === 0
          ? <p style={styles.emptyText}>No students enrolled yet.</p>
          : <div style={styles.studentList}>
              {leaderboard.map(s => (
                <div key={s.kidId} style={styles.studentRow}>
                  <span style={styles.studentInfo}>
                    <span style={{ fontSize: 24 }}>{AVATAR_EMOJIS[s.avatarId] || '🐻'}</span>
                    <span style={{ fontWeight: 800 }}>{s.name}</span>
                  </span>
                  <button onClick={() => handleRemoveStudent(s.kidId)} style={styles.removeBtn}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
      )}
    </div>
  );
}

const AVATAR_EMOJIS = {
  bear: '🐻', lion: '🦁', rabbit: '🐰', cat: '🐱',
  dog: '🐶', owl: '🦉', fox: '🦊', penguin: '🐧',
  frog: '🐸', chick: '🐥', hamster: '🐹', panda: '🐼',
  butterfly: '🦋', dragon: '🐉', dino: '🦕', unicorn: '🦄',
};

const styles = {
  center: { textAlign: 'center', padding: 60, fontSize: 'var(--font-md)', color: 'var(--text-secondary)' },
  backBtn: {
    background: 'none', border: 'none', color: 'var(--text-secondary)',
    fontWeight: 700, fontSize: 'var(--font-sm)', cursor: 'pointer', marginBottom: 16,
  },
  headerRow: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: 24, flexWrap: 'wrap', gap: 16,
  },
  heading: { fontSize: 'var(--font-xl)', fontWeight: 900, marginBottom: 8 },
  codeRow: { display: 'flex', alignItems: 'center', gap: 8 },
  codeLabel: { fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-secondary)' },
  code: {
    fontFamily: 'monospace', fontWeight: 800, fontSize: 'var(--font-md)',
    background: '#f0f0f0', padding: '4px 12px', borderRadius: 8, letterSpacing: 2,
  },
  copyBtn: {
    background: 'var(--accent-blue)', color: '#fff', border: 'none',
    padding: '6px 14px', borderRadius: 12, fontWeight: 700, fontSize: 'var(--font-xs)',
    cursor: 'pointer',
  },
  deleteBtn: {
    background: 'none', border: '2px solid var(--error)', color: 'var(--error)',
    padding: '8px 16px', borderRadius: 16, fontWeight: 700, fontSize: 'var(--font-sm)',
    cursor: 'pointer',
  },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: {
    padding: '10px 20px', borderRadius: 16, border: '2px solid #E0E0E0',
    background: 'transparent', fontWeight: 700, fontSize: 'var(--font-sm)',
    cursor: 'pointer', color: 'var(--text-secondary)',
  },
  tabActive: { background: 'var(--accent-blue)', color: '#fff', borderColor: 'var(--accent-blue)' },
  emptyText: { textAlign: 'center', padding: 40, color: 'var(--text-secondary)', fontSize: 'var(--font-md)' },
  studentList: { display: 'flex', flexDirection: 'column', gap: 8 },
  studentRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg-surface)', padding: '12px 20px', borderRadius: 16,
  },
  studentInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  removeBtn: {
    background: 'none', border: '1px solid var(--error)', color: 'var(--error)',
    padding: '4px 12px', borderRadius: 10, fontWeight: 700, fontSize: 'var(--font-xs)',
    cursor: 'pointer',
  },
};
