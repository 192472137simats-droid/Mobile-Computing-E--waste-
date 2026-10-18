import React, { useEffect, useState } from 'react';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import WaxSealBadge from '../../../components/vintage/WaxSealBadge/WaxSealBadge';
import IconWrapper from '../../../components/common/IconWrapper/IconWrapper';
import AdminNav from '../../../components/admin/AdminNav';
import ArchivalSkeleton from '../../../components/vintage/ArchivalSkeleton/ArchivalSkeleton';
import ArchivalEmptyState from '../../../components/vintage/ArchivalEmptyState/ArchivalEmptyState';
import apiClient from '../../../services/apiClient';

export function AdminAuditPage() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const loadActions = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await apiClient.get('/api/admin/actions');
      setActions(response.data || []);
    } catch (err) {
      setLoadError(err.message || 'Could not load records.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- this effect loads remote data.
    loadActions();
  }, []);

  const filteredActions = actions.filter((a) => {
    const matchesRole = roleFilter === 'ALL' || a.actorRole === roleFilter;
    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      a.actionType?.toLowerCase().includes(term) ||
      a.description?.toLowerCase().includes(term) ||
      a.actorName?.toLowerCase().includes(term) ||
      a.actorEmail?.toLowerCase().includes(term) ||
      a.targetEntity?.toLowerCase().includes(term) ||
      a.targetId?.toLowerCase().includes(term) ||
      a.details?.toLowerCase().includes(term);

    return matchesRole && matchesCategory && matchesSearch;
  });

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'ADMIN':
        return { bg: 'rgba(131, 39, 21, 0.12)', color: 'var(--vestige-rust)', border: 'var(--vestige-rust)' };
      case 'VENDOR':
        return { bg: 'rgba(56, 85, 61, 0.12)', color: 'var(--vestige-moss)', border: 'var(--vestige-moss)' };
      default:
        return { bg: 'rgba(168, 131, 74, 0.12)', color: 'var(--vestige-brass-dark)', border: 'var(--vestige-brass-dark)' };
    }
  };

  return (
    <PageShell>
      <Container size="lg">
        {/* Header Banner */}
        <div style={{ margin: '2rem 0 1rem' }}>
          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--vestige-brass-dark)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontWeight: 'bold',
            }}
          >
            ✦ Comprehensive Institutional Telemetry & Audit
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2.25rem',
              color: 'var(--vestige-espresso)',
              margin: '0.25rem 0 0',
            }}
          >
            All Vendor & User Platform Activities
          </h1>
        </div>

        <AdminNav />
        {loadError && <p role="alert">{loadError}</p>}

        <LedgerCard
          variant="admin"
          watermark="quill"
          watermarkSize={130}
          watermarkOpacity={0.06}
          headerBadge={
            <WaxSealBadge
              variant="gold"
              size="sm"
              icon={<IconWrapper name="book" size={16} color="var(--vestige-espresso)" />}
              label={`${filteredActions.length} EVENTS`}
            />
          }
          title={`Chronological Activity Ledger (${filteredActions.length} records)`}
          subtitle="Real-time cryptographic audit trail of all patron bookings, vendor workbench updates, and dispatches"
        >
          {/* Filter & Search Bar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              {/* Search Box */}
              <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '440px' }}>
                <input
                  type="text"
                  placeholder="Search actor, email, action, device, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem 0.45rem 2rem',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-body)',
                    backgroundColor: 'var(--vestige-parchment-light)',
                    border: '1px solid var(--vestige-parchment-border)',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--vestige-ink)',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '0.6rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--vestige-ink-light)',
                    fontSize: '0.85rem',
                  }}
                >
                  🔍
                </span>
              </div>

              {/* Role Filters */}
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--vestige-ink-light)', textTransform: 'uppercase', marginRight: '4px' }}>
                  Role:
                </span>
                {['ALL', 'USER', 'VENDOR', 'ADMIN'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-serif)',
                      letterSpacing: '0.5px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--vestige-parchment-border)',
                      background: roleFilter === r ? 'var(--vestige-espresso)' : 'var(--vestige-parchment-light)',
                      color: roleFilter === r ? 'var(--vestige-ivory-warm)' : 'var(--vestige-ink)',
                      cursor: 'pointer',
                      fontWeight: roleFilter === r ? 'bold' : 'normal',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--vestige-ink-light)', textTransform: 'uppercase', marginRight: '4px' }}>
                Category:
              </span>
              {['ALL', 'REPAIR', 'RECYCLING', 'PAYMENTS', 'REWARDS', 'ACCREDITATION'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--vestige-parchment-border)',
                    background: categoryFilter === cat ? 'var(--vestige-brass-dark)' : 'var(--vestige-parchment-light)',
                    color: categoryFilter === cat ? '#fff' : 'var(--vestige-ink-light)',
                    cursor: 'pointer',
                    fontWeight: categoryFilter === cat ? 'bold' : 'normal',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <ArchivalSkeleton variant="table" rows={8} />
          ) : filteredActions.length === 0 ? (
            <ArchivalEmptyState
              illustration="books"
              title="No Activities Match Query"
              description="No user or vendor activities recorded for the selected role, category, and search filter."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid var(--vestige-brass-dark)',
                      textAlign: 'left',
                      color: 'var(--vestige-espresso)',
                      fontFamily: 'var(--font-serif)',
                    }}
                  >
                    <th style={{ padding: '0.75rem 0.6rem' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Actor</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Action & Description</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Target Entity</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActions.map((log) => {
                    const roleStyle = getRoleBadgeVariant(log.actorRole);
                    return (
                      <tr
                        key={log.id}
                        style={{ borderBottom: '1px solid var(--vestige-parchment-border)' }}
                      >
                        {/* Timestamp */}
                        <td
                          style={{
                            padding: '0.75rem 0.6rem',
                            color: 'var(--vestige-ink-light)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.78rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                        </td>

                        {/* Actor (Name, Email, Role badge) */}
                        <td style={{ padding: '0.75rem 0.6rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2px' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '1px 5px',
                                background: roleStyle.bg,
                                color: roleStyle.color,
                                border: `1px solid ${roleStyle.border}`,
                                borderRadius: 'var(--radius-xs)',
                                fontWeight: 'bold',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {log.actorRole || 'USER'}
                            </span>
                            <span style={{ fontWeight: 'bold', color: 'var(--vestige-espresso)', fontFamily: 'var(--font-serif)' }}>
                              {log.actorName || 'Patron'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--vestige-ink-light)' }}>
                            {log.actorEmail || 'platform user'}
                          </div>
                        </td>

                        {/* Action Description & Operational Details */}
                        <td style={{ padding: '0.75rem 0.6rem', maxWidth: '300px' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--vestige-espresso)' }}>
                            {log.description || log.actionType}
                          </div>
                          {log.details && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--vestige-ink-light)', marginTop: '2px' }}>
                              {log.details}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td style={{ padding: '0.75rem 0.6rem' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 6px',
                              background: 'var(--vestige-parchment-light)',
                              border: '1px solid var(--vestige-parchment-border)',
                              borderRadius: 'var(--radius-xs)',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--vestige-espresso)',
                            }}
                          >
                            {log.category || 'GENERAL'}
                          </span>
                        </td>

                        {/* Target Entity & Target ID */}
                        <td style={{ padding: '0.75rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                          <div>{log.targetEntity || 'System'}</div>
                          <div style={{ color: 'var(--vestige-brass-dark)', fontWeight: 'bold' }}>
                            #{log.targetId ? String(log.targetId).substring(0, 10) : 'REF'}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.75rem 0.6rem' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-xs)',
                              fontWeight: 'bold',
                              fontFamily: 'var(--font-mono)',
                              background:
                                log.status === 'COMPLETED' || log.status === 'SETTLED' || log.status === 'APPROVED'
                                  ? 'rgba(56, 85, 61, 0.15)'
                                  : log.status === 'ACCEPTED' || log.status === 'IN_PROGRESS' || log.status === 'SCHEDULED'
                                  ? 'rgba(168, 131, 74, 0.15)'
                                  : 'rgba(131, 39, 21, 0.15)',
                              color:
                                log.status === 'COMPLETED' || log.status === 'SETTLED' || log.status === 'APPROVED'
                                  ? 'var(--vestige-moss)'
                                  : log.status === 'ACCEPTED' || log.status === 'IN_PROGRESS' || log.status === 'SCHEDULED'
                                  ? 'var(--vestige-brass-dark)'
                                  : 'var(--vestige-rust)',
                            }}
                          >
                            {log.status || 'RECORDED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </LedgerCard>
      </Container>
    </PageShell>
  );
}

export default AdminAuditPage;
