import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { AVATAR_EMOJIS } from '../lib/avatars';

// Warning triangle for struggling students
const WARNING = '\u26A0';

// Cell background color based on avgStars value
function getCellStyle(avgStars) {
  if (avgStars === null) {
    return { backgroundColor: '#F3F4F6' }; // gray — no data
  }
  if (avgStars >= 2.5) {
    return { backgroundColor: '#D1FAE5' }; // green-100
  }
  if (avgStars >= 1.0) {
    return { backgroundColor: '#FEF3C7' }; // yellow-100
  }
  return { backgroundColor: '#FEE2E2' }; // red-100
}

// Struggling = avgStars < 1.5 AND attempts >= 2
function isStruggling(avgStars, attempts) {
  return avgStars !== null && avgStars < 1.5 && attempts >= 2;
}

export default function ClassroomAnalytics() {
  const { id } = useParams();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [id]);

  async function loadAnalytics() {
    try {
      const result = await api.get(`/api/teacher/classroom/${id}/analytics`);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={styles.center}>Loading analytics...</div>;
  if (error)   return <div style={styles.center}>{error}</div>;
  if (!data)   return <div style={styles.center}>No data available.</div>;

  const { students, modules, matrix } = data;

  // Build lookup: `${studentId}::${moduleSlug}` → { avgStars, attempts }
  const matrixLookup = {};
  matrix.forEach(entry => {
    matrixLookup[`${entry.studentId}::${entry.moduleSlug}`] = entry;
  });

  return (
    <div>
      <h2 style={styles.heading}>Analytics</h2>

      {modules.length === 0 || students.length === 0 ? (
        <p style={styles.emptyText}>No progress data available yet.</p>
      ) : (
        <>
          <p style={styles.legend}>
            <span style={{ ...styles.chip, backgroundColor: '#D1FAE5' }}>Good (&ge;2.5 stars)</span>
            <span style={{ ...styles.chip, backgroundColor: '#FEF3C7' }}>OK (1.0–2.4 stars)</span>
            <span style={{ ...styles.chip, backgroundColor: '#FEE2E2' }}>
              {WARNING} Struggling (&lt;1.0 stars, or &lt;1.5 with 2+ attempts)
            </span>
          </p>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, textAlign: 'left' }}>Student</th>
                  {modules.map(mod => (
                    <th key={mod.slug} style={styles.th}>{mod.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td style={{ ...styles.td, textAlign: 'left' }}>
                      <span style={styles.studentCell}>
                        <span style={{ fontSize: 20 }}>
                          {AVATAR_EMOJIS[student.avatarId] || '🐻'}
                        </span>
                        <span style={{ fontWeight: 700 }}>{student.name}</span>
                      </span>
                    </td>
                    {modules.map(mod => {
                      const key = `${student.id}::${mod.slug}`;
                      const entry = matrixLookup[key] || null;
                      const avgStars = entry ? entry.avgStars : null;
                      const attempts = entry ? entry.attempts : 0;
                      const struggling = isStruggling(avgStars, attempts);
                      const cellStyle = getCellStyle(avgStars);

                      return (
                        <td key={mod.slug} style={{ ...styles.td, ...cellStyle }}>
                          {entry ? (
                            <span>
                              {avgStars.toFixed(1)}
                              {struggling && (
                                <span title="Struggling: low stars with multiple attempts" style={styles.warning}>
                                  {' '}{WARNING}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span style={styles.noData}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  center: {
    textAlign: 'center', padding: 60,
    fontSize: 'var(--font-md)', color: 'var(--text-secondary)',
  },
  heading: {
    fontSize: 'var(--font-lg)', fontWeight: 900, marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center', padding: 40,
    color: 'var(--text-secondary)', fontSize: 'var(--font-md)',
  },
  legend: {
    display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16,
    fontSize: 'var(--font-xs)', alignItems: 'center',
  },
  chip: {
    padding: '4px 10px', borderRadius: 12,
    fontWeight: 700, fontSize: 'var(--font-xs)',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    minWidth: 400,
  },
  th: {
    border: '1px solid #E5E7EB',
    padding: '8px 12px',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: 'var(--font-xs)',
    background: '#F9FAFB',
    whiteSpace: 'nowrap',
  },
  td: {
    border: '1px solid #E5E7EB',
    padding: '8px 12px',
    textAlign: 'center',
    fontSize: 'var(--font-sm)',
  },
  studentCell: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  warning: {
    color: '#DC2626',
  },
  noData: {
    color: '#9CA3AF',
  },
};
