import { AVATAR_EMOJIS } from '../../lib/avatars';

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardTable({ entries, highlightKidId }) {
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <span style={styles.rankCol}>#</span>
        <span style={styles.nameCol}>Player</span>
        <span style={styles.statCol}>⭐ Stars</span>
        <span style={styles.statCol}>🔥 Streak</span>
        <span style={styles.statCol}>📚 Lessons</span>
      </div>

      {/* Rows */}
      {entries.map(entry => {
        const isMe = entry.kidId === highlightKidId;
        return (
          <div key={entry.kidId} style={{
            ...styles.row,
            ...(isMe ? styles.highlightRow : {}),
          }}>
            <span style={styles.rankCol}>
              {RANK_MEDALS[entry.rank] || entry.rank}
            </span>
            <span style={styles.nameCol}>
              <span style={styles.avatar}>{AVATAR_EMOJIS[entry.avatarId] || '🐻'}</span>
              <span style={styles.name}>{entry.name}</span>
              {isMe && <span style={styles.youBadge}>You</span>}
            </span>
            <span style={styles.statCol}>{entry.totalStars}</span>
            <span style={styles.statCol}>{entry.currentStreak}d</span>
            <span style={styles.statCol}>{entry.lessonsCompleted}</span>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    background: 'var(--bg-surface)', borderRadius: 20, overflow: 'hidden',
    border: '2px solid #E0E0E0',
  },
  headerRow: {
    display: 'flex', alignItems: 'center', padding: '12px 20px',
    background: 'var(--bg-surface-alt)', fontWeight: 800,
    fontSize: 'var(--font-sm)', color: 'var(--text-secondary)',
  },
  row: {
    display: 'flex', alignItems: 'center', padding: '14px 20px',
    borderTop: '1px solid #f0f0f0', transition: 'background 0.1s',
  },
  highlightRow: {
    background: 'rgba(102, 126, 234, 0.08)',
    borderLeft: '4px solid var(--accent-blue)',
  },
  rankCol: { width: 50, fontWeight: 800, fontSize: 'var(--font-md)', textAlign: 'center' },
  nameCol: { flex: 1, display: 'flex', alignItems: 'center', gap: 10 },
  statCol: { width: 90, textAlign: 'center', fontWeight: 700, fontSize: 'var(--font-sm)' },
  avatar: { fontSize: 28 },
  name: { fontWeight: 800, fontSize: 'var(--font-base)' },
  youBadge: {
    fontSize: 'var(--font-xs)', fontWeight: 800, color: '#fff',
    background: 'var(--accent-blue)', padding: '2px 8px', borderRadius: 8,
  },
};
