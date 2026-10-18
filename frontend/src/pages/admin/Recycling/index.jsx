import React, { useEffect, useState } from 'react';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import AdminNav from '../../../components/admin/AdminNav';
import ArchivalSkeleton from '../../../components/vintage/ArchivalSkeleton/ArchivalSkeleton';
import ArchivalEmptyState from '../../../components/vintage/ArchivalEmptyState/ArchivalEmptyState';
import apiClient from '../../../services/apiClient';


export function AdminRecyclingPage() {
  const [recycling, setRecycling] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadRecycling = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await apiClient.get('/api/admin/recycling');
      setRecycling(response.data || []);
    } catch (err) {
      setLoadError(err.message || 'Could not load records.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- this effect loads remote data.
    loadRecycling();
  }, []);

  const filteredRecycling = recycling.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      (r.userFullName && r.userFullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.deviceBrand && r.deviceBrand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.deviceModel && r.deviceModel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.pickupAddress && r.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <PageShell>
      <Container size="lg">
        <div style={{ margin: '2rem 0 1rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--vestige-brass-dark)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
            ✦ E-Waste & Custody Ledger
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', color: 'var(--vestige-espresso)', margin: '0.25rem 0 0' }}>
            Zero-Landfill Recycling Collections
          </h1>
        </div>

        <AdminNav />
        {loadError && <p role="alert">{loadError}</p>}

        <LedgerCard
          variant="admin"
          watermark="recycling"
          watermarkSize={120}
          watermarkOpacity={0.06}
          title={`Recycling Custody Records (${filteredRecycling.length} records)`}
          subtitle="Audit responsible e-waste logistics, pickup fulfillment, and awarded points"
        >
          {/* Search and Status Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '360px' }}>
              <input
                type="text"
                placeholder="Search by patron, device, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--vestige-ink-light)', fontSize: '0.85rem' }}>
                🔍
              </span>
            </div>

            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {['ALL', 'PENDING', 'ACCEPTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-serif)',
                    letterSpacing: '0.5px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--vestige-parchment-border)',
                    background: statusFilter === s ? 'var(--vestige-espresso)' : 'var(--vestige-parchment-light)',
                    color: statusFilter === s ? 'var(--vestige-ivory-warm)' : 'var(--vestige-ink)',
                    cursor: 'pointer',
                    fontWeight: statusFilter === s ? 'bold' : 'normal',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <ArchivalSkeleton variant="table" rows={6} />
          ) : filteredRecycling.length === 0 ? (
            <ArchivalEmptyState
              illustration="recycling"
              title="No Recycling Records Match Query"
              description="No e-waste collection records found matching the specified search parameters."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--vestige-brass-dark)', textAlign: 'left', color: 'var(--vestige-espresso)', fontFamily: 'var(--font-serif)' }}>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Ref #</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Patron</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Device Category</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Units</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Pickup Logistics</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecycling.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--vestige-parchment-border)' }}>
                      <td style={{ padding: '0.75rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        #{r.id.substring(0, 8)}
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem' }}>
                        <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>{r.userFullName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--vestige-ink-light)' }}>{r.userEmail}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{r.deviceBrand} {r.deviceModel}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--vestige-ink-light)', fontFamily: 'var(--font-mono)' }}>{r.deviceCategory}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem', fontWeight: 'bold', color: 'var(--vestige-olive)', fontFamily: 'var(--font-serif)' }}>
                        {r.deviceCount} {r.deviceCount === 1 ? 'Unit' : 'Units'}
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem', fontSize: '0.82rem', color: 'var(--vestige-ink-light)', maxWidth: '240px' }}>
                        {r.pickupAddress}
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-xs)',
                            fontWeight: 'bold',
                            fontFamily: 'var(--font-mono)',
                            background:
                              r.status === 'COMPLETED'
                                ? 'rgba(56, 85, 61, 0.15)'
                                : r.status === 'SCHEDULED' || r.status === 'ACCEPTED'
                                ? 'rgba(168, 131, 74, 0.15)'
                                : 'rgba(131, 39, 21, 0.15)',
                            color:
                              r.status === 'COMPLETED'
                                ? 'var(--vestige-moss)'
                                : r.status === 'SCHEDULED' || r.status === 'ACCEPTED'
                                ? 'var(--vestige-brass-dark)'
                                : 'var(--vestige-rust)',
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem', color: 'var(--vestige-ink-light)', fontSize: '0.82rem' }}>
                        {r.pickupDate || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </LedgerCard>
      </Container>
    </PageShell>
  );
}

export default AdminRecyclingPage;
