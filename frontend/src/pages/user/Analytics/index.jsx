import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import Button from '../../../components/common/Button/Button';
import KpiMetricCard from '../../../components/analytics/KpiMetricCard';
import VintageLineChart from '../../../components/analytics/VintageLineChart';
import analyticsService from '../../../services/analyticsService';

export function UserAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await analyticsService.getUserOverview();
        setAnalytics(data);
      } catch (err) {
        console.warn('Failed to load user analytics:', err);
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
            <span style={{ fontSize: '0.85rem', color: 'var(--vestige-gold-dark)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
              ✦ Circular Sustainability Scorecard
            </span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--vestige-espresso)', margin: '0.25rem 0 0' }}>
              My Environmental Impact Ledger
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/user/dashboard">
              <Button variant="ghost" size="sm">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Headline Sustainability KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <KpiMetricCard
            title="Evaluated Devices"
            value={analytics?.totalSubmissions}
            subtitle={`${analytics?.repairRecommendations || 0} repairs / ${analytics?.recycleRecommendations || 0} recycled`}
            icon="search"
            variant="gold"
            badgeLabel="DIAGNOSTICS"
            loading={loading}
          />
          <KpiMetricCard
            title="Completed Restorations"
            value={analytics?.completedRepairs}
            subtitle={`Out of ${analytics?.totalRepairsBooked || 0} registered bookings`}
            icon="tools"
            variant="olive"
            badgeLabel="REPAIRS"
            loading={loading}
          />
          <KpiMetricCard
            title="Diverted From Landfills"
            value={`${analytics?.totalDevicesRecycled || 0} items`}
            subtitle={`Across ${analytics?.completedRecycling || 0} collection pickups`}
            icon="recycle"
            variant="espresso"
            badgeLabel="E-WASTE"
            loading={loading}
          />
          <KpiMetricCard
            title="Circular Points Earned"
            value={analytics?.currentPointsBalance !== undefined ? `${analytics.currentPointsBalance} PTS` : '0 PTS'}
            subtitle={`Lifetime: ${analytics?.lifetimePointsEarned || 0} earned / ${analytics?.lifetimePointsRedeemed || 0} redeemed`}
            icon="crest"
            variant="gold"
            badgeLabel="REWARDS"
            loading={loading}
          />
        </div>

        {/* Activity Timeline */}
        <div style={{ marginBottom: '2rem' }}>
          <VintageLineChart
            title="My Circular Journey Chronology"
            subtitle="Monthly record of device diagnostic evaluations, restorations, and ethical e-waste recycling pickups"
            points={analytics?.personalActivityTimeline || []}
            loading={loading}
          />
        </div>

        {/* Circular Action Links */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/user/assessment">
            <Button variant="primary">Evaluate Another Device</Button>
          </Link>
          <Link to="/user/rewards">
            <Button variant="ornate">Redeem Circular Rewards</Button>
          </Link>
          <Link to="/user/bookings">
            <Button variant="ghost">View Active Bookings</Button>
          </Link>
        </div>
      </Container>
    </PageShell>
  );
}

export default UserAnalytics;
