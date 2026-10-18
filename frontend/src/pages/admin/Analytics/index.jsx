import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import WaxSealBadge from '../../../components/vintage/WaxSealBadge/WaxSealBadge';
import IconWrapper from '../../../components/common/IconWrapper/IconWrapper';
import Button from '../../../components/common/Button/Button';
import KpiMetricCard from '../../../components/analytics/KpiMetricCard';
import VintageBarChart from '../../../components/analytics/VintageBarChart';
import VintageLineChart from '../../../components/analytics/VintageLineChart';
import analyticsService from '../../../services/analyticsService';

export function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [devices, setDevices] = useState(null);
  const [repairs, setRepairs] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [datePreset, setDatePreset] = useState('90');

  const getDates = (preset) => {
    const to = new Date().toISOString().split('T')[0];
    let fromDate = new Date();
    if (preset === '30') fromDate.setDate(fromDate.getDate() - 30);
    else if (preset === '90') fromDate.setDate(fromDate.getDate() - 90);
    else if (preset === '365') fromDate.setDate(fromDate.getDate() - 365);
    else fromDate = new Date('2025-01-01');
    const from = fromDate.toISOString().split('T')[0];
    return { from, to };
  };

  const loadData = async (preset = datePreset) => {
    setLoading(true);
    setLoadError('');
    const params = getDates(preset);
    try {
      const [ovRes, devRes, repRes, venRes] = await Promise.all([
        analyticsService.getAdminOverview(params),
        analyticsService.getAdminDevices(params),
        analyticsService.getAdminRepairs(params),
        analyticsService.getAdminVendorWorkload(params),
      ]);

      if (ovRes) setOverview(ovRes);
      if (devRes) setDevices(devRes);
      if (repRes) setRepairs(repRes);
      if (venRes) setVendors(venRes);
    } catch (err) {
      console.warn('Failed to load admin analytics:', err);
      setLoadError(err.message || 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- this effect loads remote data.
    loadData(datePreset);
  }, [datePreset]);

  return (
    <PageShell>
      <Container size="lg">
        {loadError && <p role="alert">{loadError}</p>}
        {/* Header Ribbon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--vestige-gold-dark)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
              ✦ Platform Intelligence & Oversight
            </span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--vestige-espresso)', margin: '0.25rem 0 0' }}>
              Archival Analytics & Metrics
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {['30', '90', '365'].map((p) => (
              <button
                key={p}
                onClick={() => setDatePreset(p)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: '1px solid var(--vestige-parchment-border)',
                  background: datePreset === p ? 'var(--vestige-gold)' : 'var(--vestige-parchment-white)',
                  color: 'var(--vestige-espresso)',
                  fontWeight: datePreset === p ? 'bold' : 'normal',
                  cursor: 'pointer',
                }}
              >
                Last {p} Days
              </button>
            ))}
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="sm">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* 1. Headline Platform KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <KpiMetricCard
            title="Patron Registry"
            value={overview?.totalUsers}
            subtitle={`${overview?.activeUsers || 0} active accounts`}
            icon="shield"
            variant="gold"
            badgeLabel="USERS"
            loading={loading}
          />
          <KpiMetricCard
            title="Verified Craftsmen"
            value={overview?.verifiedVendors}
            subtitle={`Out of ${overview?.totalVendors || 0} registered ateliers`}
            icon="tools"
            variant="olive"
            badgeLabel="WORKSHOPS"
            loading={loading}
          />
          <KpiMetricCard
            title="Device Diagnostics"
            value={overview?.totalSubmissions}
            subtitle={`${overview?.repairRecommendations || 0} repairs / ${overview?.recycleRecommendations || 0} recycled`}
            icon="search"
            variant="espresso"
            badgeLabel="DIAGNOSTICS"
            loading={loading}
          />
          <KpiMetricCard
            title="Repair Completion Rate"
            value={overview?.repairCompletionRate ? `${overview.repairCompletionRate}%` : '0%'}
            subtitle={`${overview?.completedRepairs || 0} restored devices`}
            icon="crest"
            variant="gold"
            badgeLabel="RATE"
            loading={loading}
          />
          <KpiMetricCard
            title="Points in Circulation"
            value={overview?.outstandingPointsBalance ? `${overview.outstandingPointsBalance} PTS` : '0 PTS'}
            subtitle={`${overview?.totalPointsIssued || 0} issued / ${overview?.totalPointsRedeemed || 0} redeemed`}
            icon="crest"
            variant="olive"
            badgeLabel="REWARDS"
            loading={loading}
          />
        </div>

        {/* 2. Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <VintageLineChart
            title="Platform Activity Chronology"
            subtitle="Historical volume of assessments, repairs, and e-waste pickups"
            points={overview?.activityOverTime || []}
            loading={loading}
          />
          <VintageBarChart
            title="Diagnostic Device Categories"
            subtitle="Breakdown of submitted hardware types"
            items={devices?.categoryDistribution || []}
            loading={loading}
          />
          <VintageBarChart
            title="Leading Hardware Brands"
            subtitle="Top evaluated manufacturers"
            items={devices?.brandDistribution || []}
            loading={loading}
          />
          <VintageBarChart
            title="Repair Booking Status Ledger"
            subtitle="Workflow progression states across verified workbenches"
            items={repairs?.statusDistribution || []}
            loading={loading}
          />
        </div>

        {/* 3. Craftsman Performance Table */}
        <LedgerCard
          variant="vendor"
          headerBadge={
            <WaxSealBadge
              variant="olive"
              size="sm"
              icon={<IconWrapper name="tools" size={16} color="var(--vestige-ivory)" />}
              label="WORKLOAD"
            />
          }
          title="Craftsman Workshop Performance Ledger"
          subtitle="Workload allocation and job completion velocity per accredited atelier"
        >
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--vestige-ink-light)', padding: '2rem 0' }}>Gathering craftsman dossiers...</p>
          ) : vendors.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--vestige-ink-light)', padding: '2rem 0' }}>No workshops registered yet.</p>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--vestige-parchment-border)', textAlign: 'left', color: 'var(--vestige-ink-light)' }}>
                    <th style={{ padding: '8px' }}>Atelier / Partner</th>
                    <th style={{ padding: '8px' }}>Accreditation</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Repairs Assigned</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Repairs Completed</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Repair Rate</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Recycling Handled</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.vendorId} style={{ borderBottom: '1px solid var(--vestige-parchment-border)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{v.businessName}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{ fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', background: v.verificationStatus === 'VERIFIED' ? 'var(--vestige-olive-light)' : 'var(--vestige-gold-light)' }}>
                          {v.verificationStatus}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{v.assignedRepairs}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold' }}>{v.completedRepairs}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--vestige-olive)', fontWeight: 'bold' }}>{v.repairCompletionRate}%</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{v.completedRecycling}</td>
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

export default AdminAnalytics;
