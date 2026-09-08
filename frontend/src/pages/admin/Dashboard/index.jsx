import React, { useEffect, useState } from 'react';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import WaxSealBadge from '../../../components/vintage/WaxSealBadge/WaxSealBadge';
import IconWrapper from '../../../components/common/IconWrapper/IconWrapper';
import Button from '../../../components/common/Button/Button';
import AdminNav from '../../../components/admin/AdminNav';
import VintageLineChart from '../../../components/analytics/VintageLineChart';
import KpiMetricCard from '../../../components/analytics/KpiMetricCard';
import ArchivalSkeleton from '../../../components/vintage/ArchivalSkeleton/ArchivalSkeleton';
import ArchivalEmptyState from '../../../components/vintage/ArchivalEmptyState/ArchivalEmptyState';
import ConfirmModal from '../../../components/common/ConfirmModal/ConfirmModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from '../../../i18n/useTranslation';
import apiClient from '../../../services/apiClient';

import {
  ensurePrototypeDataSeeded,
  INITIAL_ADMIN_KPIS,
  INITIAL_ADMIN_REGISTRATION_ACTIVITY,
  INITIAL_ADMIN_VENDORS,
} from '../../../utils/prototypeSeed';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [platformKpis, setPlatformKpis] = useState(null);
  const [regActivity, setRegActivity] = useState(null);
  const [range, setRange] = useState('6m');
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  // Confirmation Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    onConfirm: null,
    isDestructive: false,
  });

  const loadData = async (selectedRange = range) => {
    setLoading(true);
    try {
      ensurePrototypeDataSeeded();

      let fallbackKpis = INITIAL_ADMIN_KPIS;
      try {
        const savedKpis = localStorage.getItem('vestige_admin_kpis');
        if (savedKpis) fallbackKpis = JSON.parse(savedKpis);
      } catch {}

      let fallbackReg = INITIAL_ADMIN_REGISTRATION_ACTIVITY[selectedRange] || INITIAL_ADMIN_REGISTRATION_ACTIVITY['6m'];
      try {
        const savedReg = localStorage.getItem('vestige_admin_registration_activity');
        if (savedReg) {
          const parsed = JSON.parse(savedReg);
          if (parsed[selectedRange]) fallbackReg = parsed[selectedRange];
        }
      } catch {}

      let fallbackVendors = [];
      try {
        const savedVendors = localStorage.getItem('vestige_admin_vendors');
        const vList = savedVendors ? JSON.parse(savedVendors) : INITIAL_ADMIN_VENDORS;
        fallbackVendors = vList.filter((v) => v.verificationStatus === 'PENDING');
      } catch {
        fallbackVendors = INITIAL_ADMIN_VENDORS.filter((v) => v.verificationStatus === 'PENDING');
      }

      const [kpiRes, regRes, vendorRes] = await Promise.all([
        apiClient.get('/api/analytics/admin/overview').catch(() => null),
        apiClient.get(`/api/admin/registration-activity?range=${selectedRange}`).catch(() => null),
        apiClient.get('/api/admin/vendors/pending').catch(() => null),
      ]);

      setPlatformKpis(kpiRes?.data?.data || fallbackKpis);
      setRegActivity(regRes?.data?.data || fallbackReg);

      const serverVendors = vendorRes?.data?.data;
      if (Array.isArray(serverVendors) && serverVendors.length > 0) {
        setPendingVendors(serverVendors);
      } else {
        setPendingVendors(fallbackVendors);
      }
    } catch (err) {
      console.warn('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(range);
  }, [range]);

  const promptVerifyVendor = (vendorId, businessName, action) => {
    const isApproving = action === 'APPROVE';
    setConfirmModalConfig({
      isOpen: true,
      title: isApproving ? `Approve Workshop: ${businessName}` : `Reject Workshop: ${businessName}`,
      message: isApproving
        ? `Accredit and verify ${businessName}? The workshop will immediately receive hardware restoration bookings and collections.`
        : `Reject accreditation application for ${businessName}? The partner will be notified of document insufficiency.`,
      confirmLabel: isApproving ? 'Approve & Verify' : 'Reject Application',
      isDestructive: !isApproving,
      onConfirm: async () => {
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.patch(`/api/admin/vendors/${vendorId}/verify`, {
            action,
            rejectionReason: isApproving ? null : 'Document requirements unfulfilled',
          }).catch(() => {});
        } catch {}

        try {
          const savedVendors = JSON.parse(localStorage.getItem('vestige_admin_vendors') || '[]');
          const updated = savedVendors.map((v) =>
            v.id === vendorId
              ? { ...v, verificationStatus: isApproving ? 'VERIFIED' : 'REJECTED' }
              : v
          );
          localStorage.setItem('vestige_admin_vendors', JSON.stringify(updated));
        } catch {}

        setNotice(`Vendor partner successfully ${isApproving ? 'APPROVED & VERIFIED' : 'REJECTED'}.`);
        loadData(range);
      },
    });
  };

  const totalUsers = platformKpis?.totalUsers ?? 0;
  const activeUsers = platformKpis?.activeUsers ?? 0;
  const suspendedUsers = Math.max(0, totalUsers - activeUsers);

  return (
    <PageShell>
      <Container size="lg">
        {/* Header Ribbon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--vestige-brass-dark)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
              ✦ {t('admin.governance', 'Institutional Governance Command')}
            </span>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', color: 'var(--vestige-espresso)', margin: '0.25rem 0 0' }}>
              {t('admin.dashboardTitle', 'Registry Governance Dashboard')}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Button variant="ghost" size="sm" onClick={logout} icon={<IconWrapper name="lock" size={16} />}>
              {t('nav.signOut', 'Sign Out')} ({user?.fullName})
            </Button>
          </div>
        </div>

        {/* Admin Navigation */}
        <AdminNav />

        {notice && (
          <div style={{ padding: '0.75rem 1rem', background: 'var(--vestige-parchment-light)', border: '1px solid var(--vestige-brass)', borderRadius: 'var(--radius-xs)', marginBottom: '1.5rem', color: 'var(--vestige-espresso)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{notice}</p>
            <button onClick={() => setNotice('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vestige-ink-light)' }}>✕</button>
          </div>
        )}

        {/* Real Platform KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <KpiMetricCard
            title="Total Registered Users"
            value={totalUsers}
            subtitle="Patron network ledger"
            icon="crest"
            badgeLabel="TOTAL"
            loading={loading}
          />
          <KpiMetricCard
            title="Active Users"
            value={activeUsers}
            subtitle="Operational clearance"
            icon="shield"
            variant="moss"
            badgeLabel="ACTIVE"
            loading={loading}
          />
          <KpiMetricCard
            title="Suspended Users"
            value={suspendedUsers}
            subtitle="Administrative holds"
            icon="shield"
            variant={suspendedUsers > 0 ? 'rust' : 'gold'}
            badgeLabel="HOLDS"
            loading={loading}
          />
          <KpiMetricCard
            title="Total Workshops"
            value={platformKpis?.totalVendors ?? 0}
            subtitle="Accredited artisans"
            icon="tools"
            variant="olive"
            badgeLabel="ATELIERS"
            loading={loading}
          />
          <KpiMetricCard
            title="Pending Verification"
            value={pendingVendors.length}
            subtitle="Requires audit"
            icon="tools"
            variant={pendingVendors.length > 0 ? 'olive' : 'gold'}
            badgeLabel="QUEUE"
            loading={loading}
          />
          <KpiMetricCard
            title="Completed Repairs"
            value={platformKpis?.completedRepairs ?? 0}
            subtitle="Hardware restorations"
            icon="tools"
            variant="moss"
            badgeLabel="RESTORED"
            loading={loading}
          />
          <KpiMetricCard
            title="Completed Recycling"
            value={platformKpis?.completedRecycling ?? 0}
            subtitle="Zero-landfill collections"
            icon="recycling"
            variant="olive"
            badgeLabel="RECYCLED"
            loading={loading}
          />
          <KpiMetricCard
            title="Reward Points Issued"
            value={platformKpis?.totalPointsIssued ?? 0}
            subtitle="Circular economy tokens"
            icon="scales"
            variant="gold"
            badgeLabel="POINTS"
            loading={loading}
          />
        </div>

        {/* Monthly Registration Activity & Verification Queue */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Registration Activity Chart */}
          <LedgerCard
            variant="admin"
            watermark="globe"
            watermarkSize={130}
            watermarkOpacity={0.06}
            headerBadge={
              <WaxSealBadge
                variant="gold"
                size="sm"
                icon={<IconWrapper name="crest" size={16} color="var(--vestige-espresso)" />}
                label="REGISTRATIONS"
              />
            }
            title="Monthly Registration Analysis"
            subtitle={regActivity?.comparisonMessage || 'Natural registration activity chronology'}
          >
            {/* Time-Range Toggles & Summary Metrics */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {['7d', '30d', '6m', '12m'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-serif)',
                      letterSpacing: '0.5px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--vestige-parchment-border)',
                      background: range === r ? 'var(--vestige-espresso)' : 'var(--vestige-parchment-light)',
                      color: range === r ? 'var(--vestige-ivory-warm)' : 'var(--vestige-ink)',
                      cursor: 'pointer',
                      fontWeight: range === r ? 'bold' : 'normal',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>

              {regActivity && (
                <div style={{ fontSize: '0.8rem', color: 'var(--vestige-ink-light)', fontFamily: 'var(--font-mono)' }}>
                  This Period: <strong style={{ color: 'var(--vestige-espresso)' }}>{regActivity.currentPeriodCount || 0}</strong> vs Prior: {regActivity.previousPeriodCount || 0}
                </div>
              )}
            </div>

            {loading ? (
              <ArchivalSkeleton variant="chart" height="180px" />
            ) : (
              <VintageLineChart
                points={regActivity?.timeline || []}
                loading={loading}
              />
            )}
          </LedgerCard>

          {/* Pending Vendor Accreditations */}
          <LedgerCard
            variant="admin"
            watermark="building"
            watermarkSize={130}
            watermarkOpacity={0.06}
            headerBadge={
              <WaxSealBadge
                variant="espresso"
                size="sm"
                icon={<IconWrapper name="shield" size={16} color="var(--vestige-brass)" />}
                label={`${pendingVendors.length} PENDING`}
              />
            }
            title="Partner Accreditation Queue"
            subtitle="Verify trade licenses and workshop capabilities"
          >
            {loading ? (
              <ArchivalSkeleton variant="table" rows={3} />
            ) : pendingVendors.length === 0 ? (
              <ArchivalEmptyState
                illustration="building"
                title="Accreditation Queue Clear"
                description="No partner workshop or artisan applications awaiting administrative verification."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
                {pendingVendors.map((v) => (
                  <div key={v.id} style={{ padding: '0.85rem', border: '1px solid var(--vestige-parchment-border)', borderRadius: 'var(--radius-xs)', background: 'var(--vestige-parchment-light)' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--vestige-espresso)', fontFamily: 'var(--font-serif)' }}>
                      {v.businessName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--vestige-ink-light)', marginTop: '0.2rem' }}>
                      {v.city}, {v.state} &bull; {v.deviceCategories?.join(', ') || 'Hardware Repair'}
                    </div>
                    <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => promptVerifyVendor(v.id, v.businessName, 'APPROVE')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => promptVerifyVendor(v.id, v.businessName, 'REJECT')}
                        style={{ color: 'var(--vestige-rust)' }}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LedgerCard>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModalConfig.isOpen}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmLabel={confirmModalConfig.confirmLabel}
          isDestructive={confirmModalConfig.isDestructive}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        />
      </Container>
    </PageShell>
  );
}

export default AdminDashboard;
