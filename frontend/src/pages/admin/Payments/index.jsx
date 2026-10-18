import React, { useEffect, useState } from 'react';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import AdminNav from '../../../components/admin/AdminNav';
import KpiMetricCard from '../../../components/analytics/KpiMetricCard';
import VintageLineChart from '../../../components/analytics/VintageLineChart';
import ArchivalSkeleton from '../../../components/vintage/ArchivalSkeleton/ArchivalSkeleton';
import ArchivalEmptyState from '../../../components/vintage/ArchivalEmptyState/ArchivalEmptyState';
import apiClient from '../../../services/apiClient';


export function AdminPaymentsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await apiClient.get('/api/admin/payments');
      setMetrics(response.data || null);
    } catch (err) {
      setLoadError(err.message || 'Could not load records.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- this effect loads remote data.
    loadPayments();
  }, []);

  const transactions = metrics?.recentTransactions || [];
  const filteredTransactions = transactions.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      (p.userFullName && p.userFullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.userEmail && p.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.providerOrderId && p.providerOrderId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <PageShell>
      <Container size="lg">
        <div style={{ margin: '2rem 0 1rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--vestige-brass-dark)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
            ✦ Financial & Restoration Revenue
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', color: 'var(--vestige-espresso)', margin: '0.25rem 0 0' }}>
            Payment Gateway & Revenue Ledger
          </h1>
        </div>

        <AdminNav />
        {loadError && <p role="alert">{loadError}</p>}

        {/* Financial KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <KpiMetricCard
            title="Total Revenue"
            value={`₹${Number(metrics?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            subtitle="Verified Razorpay payments"
            icon="scales"
            badgeLabel="REVENUE"
            loading={loading}
          />
          <KpiMetricCard
            title="Successful Checkouts"
            value={metrics?.successfulPayments ?? 0}
            subtitle="Cryptographically verified"
            icon="shield"
            variant="moss"
            badgeLabel="SETTLED"
            loading={loading}
          />
          <KpiMetricCard
            title="Pending Checkouts"
            value={metrics?.pendingPayments ?? 0}
            subtitle="Awaiting client confirmation"
            icon="tools"
            variant="gold"
            badgeLabel="PENDING"
            loading={loading}
          />
          <KpiMetricCard
            title="Failed / Abandoned"
            value={metrics?.failedPayments ?? 0}
            subtitle="Signature or auth error"
            icon="shield"
            variant={metrics?.failedPayments > 0 ? 'rust' : 'gold'}
            badgeLabel="FAILED"
            loading={loading}
          />
        </div>

        {/* Revenue Velocity Chart */}
        <div style={{ marginBottom: '2rem' }}>
          <LedgerCard
            variant="admin"
            watermark="scales"
            watermarkSize={120}
            watermarkOpacity={0.06}
            title="Monthly Completed Payment Transactions"
            subtitle="Chronological settlement transaction velocity"
          >
            {loading ? (
              <ArchivalSkeleton variant="chart" height="180px" />
            ) : (
              <VintageLineChart
                points={metrics?.revenueOverTime || []}
                loading={loading}
              />
            )}
          </LedgerCard>
        </div>

        {/* Transactions Table */}
        <LedgerCard
          variant="admin"
          title={`Payment Transactions (${filteredTransactions.length} records)`}
          subtitle="Audit server-computed amounts, Razorpay order IDs, and settlement status"
        >
          {/* Search and Status Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '360px' }}>
              <input
                type="text"
                placeholder="Search by patron, email, order ID..."
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
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'CANCELLED'].map((s) => (
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
            <ArchivalSkeleton variant="table" rows={5} />
          ) : filteredTransactions.length === 0 ? (
            <ArchivalEmptyState
              illustration="scales"
              title="No Transactions Match Query"
              description="No financial settlement records found for this query filter."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--vestige-brass-dark)', textAlign: 'left', color: 'var(--vestige-espresso)', fontFamily: 'var(--font-serif)' }}>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Order Reference</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Patron</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Service Allocation</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Gateway</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--vestige-parchment-border)' }}>
                      <td style={{ padding: '0.75rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {tx.providerOrderId}
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem' }}>
                        <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>{tx.userFullName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--vestige-ink-light)' }}>{tx.userEmail}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem', fontSize: '0.82rem' }}>
                        {tx.relatedEntityType}
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem', fontWeight: 'bold', color: 'var(--vestige-espresso)', fontFamily: 'var(--font-serif)' }}>
                        ₹{Number(tx.amount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem', color: 'var(--vestige-ink-light)', fontSize: '0.82rem' }}>
                        {tx.provider}
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
                              tx.status === 'SUCCESS'
                                ? 'rgba(56, 85, 61, 0.15)'
                                : tx.status === 'PENDING'
                                ? 'rgba(168, 131, 74, 0.15)'
                                : 'rgba(131, 39, 21, 0.15)',
                            color:
                              tx.status === 'SUCCESS'
                                ? 'var(--vestige-moss)'
                                : tx.status === 'PENDING'
                                ? 'var(--vestige-brass-dark)'
                                : 'var(--vestige-rust)',
                          }}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem', color: 'var(--vestige-ink-light)', fontSize: '0.82rem' }}>
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}
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

export default AdminPaymentsPage;
