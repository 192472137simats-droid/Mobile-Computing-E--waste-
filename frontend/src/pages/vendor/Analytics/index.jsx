import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import Button from '../../../components/common/Button/Button';
import KpiMetricCard from '../../../components/analytics/KpiMetricCard';
import VintageBarChart from '../../../components/analytics/VintageBarChart';
import VintageLineChart from '../../../components/analytics/VintageLineChart';
import analyticsService from '../../../services/analyticsService';

export function VendorAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await analyticsService.getVendorOverview();
        setAnalytics(data);
      } catch (err) {
        console.warn('Failed to load vendor analytics:', err);
        setLoadError(err.message || 'Could not load analytics.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <PageShell>
      <Container size="lg">
        {loadError && <p role="alert">{loadError}</p>}
        {/* Header Ribbon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--vestige-olive)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
              ✦ Workshop Performance Ledger
            </span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--vestige-espresso)', margin: '0.25rem 0 0' }}>
              {analytics?.businessName || 'Atelier Metrics'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/vendor/dashboard">
              <Button variant="ghost" size="sm">Back to Workbench</Button>
            </Link>
          </div>
        </div>

        {/* Headline Workbench Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <KpiMetricCard
            title="Allocated Repairs"
            value={analytics?.assignedRepairs}
            subtitle={`${analytics?.completedRepairs || 0} completed restoration jobs`}
            icon="tools"
            variant="gold"
            badgeLabel="REPAIRS"
            loading={loading}
          />
          <KpiMetricCard
            title="Restoration Completion Rate"
            value={analytics?.repairCompletionRate ? `${analytics.repairCompletionRate}%` : '0%'}
            subtitle={`${analytics?.activeRepairs || 0} jobs currently active`}
            icon="crest"
            variant="olive"
            badgeLabel="EFFICIENCY"
            loading={loading}
          />
          <KpiMetricCard
            title="E-Waste Parcels Dispatched"
            value={analytics?.assignedRecycling}
            subtitle={`${analytics?.completedRecycling || 0} parcels certified`}
            icon="recycle"
            variant="espresso"
            badgeLabel="RECYCLING"
            loading={loading}
          />
          <KpiMetricCard
            title="Recycling Fulfillment"
            value={analytics?.recyclingCompletionRate ? `${analytics.recyclingCompletionRate}%` : '0%'}
            subtitle={`${analytics?.activeRecycling || 0} parcels pending pickup`}
            icon="shield"
            variant="olive"
            badgeLabel="LOGISTICS"
            loading={loading}
          />
        </div>

        {/* Visualizers Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          <VintageLineChart
            title="Monthly Workbench Activity"
            subtitle="Combined restoration and collection workflows"
            points={analytics?.monthlyActivity || []}
            loading={loading}
          />
          <VintageBarChart
            title="Repair Job Status Distribution"
            subtitle="Lifecycle stages of assigned hardware restoration tickets"
            items={analytics?.repairStatusDistribution || []}
            loading={loading}
          />
        </div>
      </Container>
    </PageShell>
  );
}

export default VendorAnalytics;
