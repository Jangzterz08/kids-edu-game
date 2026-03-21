import { useState, useEffect } from 'react';
import { api } from '../lib/api';

// Status badge color map
const statusColors = {
  active:   { background: '#10b981', color: 'white' },
  expired:  { background: '#ef4444', color: 'white' },
  none:     { background: '#6b7280', color: 'white' },
  past_due: { background: '#f59e0b', color: 'white' },
};

const statusLabels = {
  active:   'Active',
  expired:  'Expired',
  none:     'No License',
  past_due: 'Payment Due',
};

function StatusBadge({ status }) {
  const style = statusColors[status] || statusColors.none;
  const label = statusLabels[status] || status;
  return (
    <span style={{
      ...style,
      display: 'inline-block',
      padding: '3px 12px',
      borderRadius: 20,
      fontSize: 'var(--font-sm)',
      fontWeight: 700,
    }}>
      {label}
    </span>
  );
}

function RoleBadge({ role }) {
  const isAdmin = role === 'admin';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 16,
      fontSize: 'var(--font-xs)',
      fontWeight: 700,
      background: isAdmin ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.2)',
      color: isAdmin ? 'var(--primary-dark)' : 'var(--text-secondary)',
    }}>
      {isAdmin ? 'Admin' : 'Teacher'}
    </span>
  );
}

export default function SchoolDashboard() {
  const [status, setStatus] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addError, setAddError] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  // Detect checkout result from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      window.history.replaceState({}, '', '/school');
    }
    if (params.get('checkout') === 'cancel') {
      window.history.replaceState({}, '', '/school');
    }
  }, []);

  // Fetch all data in parallel on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/api/billing/school-status'),
      api.get('/api/school/teachers'),
      api.get('/api/billing/school-invoices'),
    ])
      .then(([statusData, teacherData, invoiceData]) => {
        setStatus(statusData);
        setTeachers(teacherData.teachers || []);
        setInvoices(invoiceData.invoices || []);
      })
      .catch(err => {
        const msg = err.message || '';
        if (msg.includes('403') || msg.toLowerCase().includes('not a school admin') || msg.toLowerCase().includes('forbidden')) {
          setError('You are not a school admin.');
        } else {
          setError(msg || 'Failed to load school dashboard.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(plan) {
    setCheckoutLoading(plan);
    try {
      const data = await api.post('/api/billing/school-checkout', { plan });
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Checkout failed — please try again.');
      setCheckoutLoading(null);
    }
  }

  async function handleAddTeacher(e) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAddLoading(true);
    setAddError(null);
    try {
      await api.post('/api/school/teachers', { email: newEmail.trim() });
      setNewEmail('');
      // Refresh teacher list
      const data = await api.get('/api/school/teachers');
      setTeachers(data.teachers || []);
    } catch (err) {
      setAddError(err.message || 'Could not add teacher.');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemoveTeacher(userId) {
    try {
      await api.delete(`/api/school/teachers/${userId}`);
      // Refresh teacher list
      const data = await api.get('/api/school/teachers');
      setTeachers(data.teachers || []);
    } catch (err) {
      setError(err.message || 'Could not remove teacher.');
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.hint}>Loading school dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>School Dashboard</h1>
        <div style={styles.errorBox}>{error}</div>
      </div>
    );
  }

  const licenseStatus = status?.licenseStatus || 'none';
  const isLicensed = licenseStatus === 'active';
  const expiryDate = status?.licenseExpiry
    ? new Date(status.licenseExpiry).toLocaleDateString()
    : '—';

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>🏫 School Dashboard</h1>

      {/* ── Section 1: License Status Card ── */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>License Status</h2>
        <div style={styles.statusRow}>
          <div>
            <div style={styles.schoolName}>{status?.name || 'Your School'}</div>
            <div style={{ marginTop: 8 }}>
              <StatusBadge status={licenseStatus} />
            </div>
          </div>
          <div style={styles.seatBox}>
            <div style={styles.seatNumber}>
              {status?.seatsUsed ?? 0} / {status?.seatCount ?? 0}
            </div>
            <div style={styles.seatLabel}>seats used</div>
          </div>
        </div>

        {isLicensed && (
          <div style={styles.renewalRow}>
            <span style={styles.renewalLabel}>Renewal date:</span>
            <span style={styles.renewalDate}>{expiryDate}</span>
          </div>
        )}

        {!isLicensed && (
          <div style={styles.upgradeSection}>
            <p style={styles.upgradeHint}>
              Upgrade to a school license to unlock all content for your teachers and students.
            </p>
            <div style={styles.tierGrid}>
              {/* Tier 1 */}
              <div style={styles.tierCard}>
                <div style={styles.tierName}>Starter</div>
                <div style={styles.tierSeats}>Up to 30 seats</div>
                <div style={styles.tierPrice}>$49 / month</div>
                <button
                  style={{
                    ...styles.upgradeBtn,
                    opacity: checkoutLoading === 'tier_1' ? 0.7 : 1,
                    cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                  }}
                  disabled={!!checkoutLoading}
                  onClick={() => handleUpgrade('tier_1')}
                >
                  {checkoutLoading === 'tier_1' ? 'Opening...' : 'Upgrade'}
                </button>
              </div>

              {/* Tier 2 */}
              <div style={{ ...styles.tierCard, border: '2px solid var(--primary)' }}>
                <div style={styles.tierBadge}>Popular</div>
                <div style={styles.tierName}>Standard</div>
                <div style={styles.tierSeats}>Up to 100 seats</div>
                <div style={styles.tierPrice}>$129 / month</div>
                <button
                  style={{
                    ...styles.upgradeBtn,
                    opacity: checkoutLoading === 'tier_2' ? 0.7 : 1,
                    cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                  }}
                  disabled={!!checkoutLoading}
                  onClick={() => handleUpgrade('tier_2')}
                >
                  {checkoutLoading === 'tier_2' ? 'Opening...' : 'Upgrade'}
                </button>
              </div>

              {/* Tier 3 */}
              <div style={styles.tierCard}>
                <div style={styles.tierName}>District</div>
                <div style={styles.tierSeats}>Up to 500 seats</div>
                <div style={styles.tierPrice}>$399 / month</div>
                <button
                  style={{
                    ...styles.upgradeBtn,
                    opacity: checkoutLoading === 'tier_3' ? 0.7 : 1,
                    cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                  }}
                  disabled={!!checkoutLoading}
                  onClick={() => handleUpgrade('tier_3')}
                >
                  {checkoutLoading === 'tier_3' ? 'Opening...' : 'Upgrade'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isLicensed && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <span style={styles.manageBilling}>
              Manage your subscription in the Stripe billing portal. Contact support for changes.
            </span>
          </div>
        )}
      </div>

      {/* ── Section 2: Teachers List ── */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Teachers ({teachers.length})</h2>
        {teachers.length === 0 ? (
          <p style={styles.emptyMsg}>No teachers added yet.</p>
        ) : (
          <div style={styles.teacherList}>
            {teachers.map(t => (
              <div key={t.id} style={styles.teacherRow}>
                <div style={styles.teacherInfo}>
                  <div style={styles.teacherName}>{t.name || t.email}</div>
                  <div style={styles.teacherEmail}>{t.email}</div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <RoleBadge role={t.role} />
                    <span style={styles.classroomCount}>
                      {t.classroomCount ?? 0} classroom{t.classroomCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {t.role !== 'admin' && (
                  <button
                    style={styles.removeBtn}
                    onClick={() => handleRemoveTeacher(t.userId)}
                    aria-label={`Remove ${t.name || t.email}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 3: Add Teacher Form ── */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Add Teacher</h2>
        <form onSubmit={handleAddTeacher} style={styles.addForm}>
          <input
            type="email"
            placeholder="teacher@school.com"
            value={newEmail}
            onChange={e => { setNewEmail(e.target.value); setAddError(null); }}
            style={styles.emailInput}
            required
            aria-label="Teacher email address"
          />
          <button
            type="submit"
            style={{
              ...styles.addBtn,
              opacity: addLoading ? 0.7 : 1,
              cursor: addLoading ? 'not-allowed' : 'pointer',
            }}
            disabled={addLoading}
          >
            {addLoading ? 'Adding...' : 'Add Teacher'}
          </button>
        </form>
        {addError && <p style={styles.addError}>{addError}</p>}
        <p style={styles.addHint}>
          The teacher must already have an account. They will be added to your school immediately.
        </p>
      </div>

      {/* ── Section 4: Invoices Table ── */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Invoices</h2>
        {invoices.length === 0 ? (
          <p style={styles.emptyMsg}>No invoices yet.</p>
        ) : (
          <div style={styles.invoiceTable}>
            <div style={styles.invoiceHeader}>
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Invoice</span>
            </div>
            {invoices.map(inv => {
              const date = inv.created
                ? new Date(inv.created * 1000).toLocaleDateString()
                : '—';
              const amount = inv.amountPaid != null
                ? `${(inv.amountPaid / 100).toFixed(2)} ${(inv.currency || 'usd').toUpperCase()}`
                : '—';
              return (
                <div key={inv.id} style={styles.invoiceRow}>
                  <span style={styles.invoiceCell}>{date}</span>
                  <span style={styles.invoiceCell}>{amount}</span>
                  <span style={styles.invoiceCell}>
                    <StatusBadge status={inv.status === 'paid' ? 'active' : 'past_due'} />
                  </span>
                  <span style={styles.invoiceCell}>
                    {inv.invoicePdf ? (
                      <a
                        href={inv.invoicePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.downloadLink}
                      >
                        Download
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  container: {
    maxWidth: 860,
    margin: '0 auto',
    padding: 'var(--space-xl)',
  },
  heading: {
    fontSize: 'var(--font-xl)',
    fontWeight: 900,
    marginBottom: 'var(--space-lg)',
    color: 'var(--text-primary)',
  },
  hint: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: 'var(--font-md)',
    padding: 40,
  },
  errorBox: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: 12,
    padding: 'var(--space-lg)',
    color: '#B91C1C',
    fontSize: 'var(--font-base)',
    fontWeight: 600,
  },
  card: {
    background: 'var(--glass-bg)',
    borderRadius: 'var(--card-radius)',
    padding: 'var(--space-lg)',
    marginBottom: 'var(--space-lg)',
    backdropFilter: 'blur(10px)',
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--glass-border)',
  },
  sectionTitle: {
    fontSize: 'var(--font-md)',
    fontWeight: 800,
    marginBottom: 'var(--space-md)',
    color: 'var(--text-primary)',
  },
  // License Status
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-md)',
  },
  schoolName: {
    fontSize: 'var(--font-lg)',
    fontWeight: 900,
    color: 'var(--text-primary)',
  },
  seatBox: {
    textAlign: 'right',
  },
  seatNumber: {
    fontSize: 'var(--font-xl)',
    fontWeight: 900,
    color: 'var(--primary)',
  },
  seatLabel: {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
    marginTop: 2,
  },
  renewalRow: {
    display: 'flex',
    gap: 'var(--space-sm)',
    alignItems: 'center',
    marginTop: 'var(--space-sm)',
  },
  renewalLabel: {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
  },
  renewalDate: {
    fontSize: 'var(--font-sm)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  manageBilling: {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  },
  // Upgrade tiers
  upgradeSection: {
    marginTop: 'var(--space-md)',
  },
  upgradeHint: {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-md)',
  },
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 'var(--space-md)',
  },
  tierCard: {
    background: 'var(--bg-surface)',
    borderRadius: 16,
    padding: 'var(--space-md)',
    border: '1.5px solid var(--glass-border)',
    position: 'relative',
    textAlign: 'center',
  },
  tierBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'var(--primary)',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 8,
    fontSize: 'var(--font-xs)',
    fontWeight: 700,
  },
  tierName: {
    fontSize: 'var(--font-base)',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: 4,
  },
  tierSeats: {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
    marginBottom: 8,
  },
  tierPrice: {
    fontSize: 'var(--font-md)',
    fontWeight: 900,
    color: 'var(--primary)',
    marginBottom: 'var(--space-md)',
  },
  upgradeBtn: {
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '10px 20px',
    fontFamily: 'inherit',
    fontSize: 'var(--font-sm)',
    fontWeight: 700,
    width: '100%',
    minHeight: 44,
  },
  // Teachers list
  teacherList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
  },
  teacherRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-md)',
    background: 'var(--bg-surface)',
    borderRadius: 12,
    border: '1px solid var(--glass-border)',
    gap: 'var(--space-md)',
  },
  teacherInfo: {
    flex: 1,
    minWidth: 0,
  },
  teacherName: {
    fontSize: 'var(--font-base)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  teacherEmail: {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
    marginTop: 2,
  },
  classroomCount: {
    fontSize: 'var(--font-xs)',
    color: 'var(--text-muted)',
  },
  removeBtn: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#B91C1C',
    borderRadius: 10,
    padding: '8px 16px',
    fontFamily: 'inherit',
    fontSize: 'var(--font-sm)',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
    minHeight: 40,
  },
  emptyMsg: {
    color: 'var(--text-muted)',
    fontSize: 'var(--font-sm)',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 'var(--space-md)',
  },
  // Add teacher form
  addForm: {
    display: 'flex',
    gap: 'var(--space-md)',
    flexWrap: 'wrap',
    marginBottom: 'var(--space-sm)',
  },
  emailInput: {
    flex: 1,
    minWidth: 220,
    padding: '10px 16px',
    borderRadius: 12,
    border: '1.5px solid var(--glass-border)',
    background: 'var(--bg-surface)',
    fontFamily: 'inherit',
    fontSize: 'var(--font-sm)',
    color: 'var(--text-primary)',
    outline: 'none',
    minHeight: 44,
  },
  addBtn: {
    background: 'var(--green)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '10px 24px',
    fontFamily: 'inherit',
    fontSize: 'var(--font-sm)',
    fontWeight: 700,
    minHeight: 44,
    flexShrink: 0,
  },
  addError: {
    color: '#B91C1C',
    fontSize: 'var(--font-sm)',
    marginBottom: 'var(--space-sm)',
    fontWeight: 600,
  },
  addHint: {
    fontSize: 'var(--font-xs)',
    color: 'var(--text-muted)',
    marginTop: 'var(--space-xs)',
  },
  // Invoices table
  invoiceTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  invoiceHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    padding: '8px var(--space-md)',
    fontSize: 'var(--font-xs)',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  invoiceRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-surface)',
    borderRadius: 10,
    alignItems: 'center',
    border: '1px solid var(--glass-border)',
  },
  invoiceCell: {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-primary)',
  },
  downloadLink: {
    color: 'var(--primary)',
    fontWeight: 700,
    fontSize: 'var(--font-sm)',
    textDecoration: 'underline',
  },
};
