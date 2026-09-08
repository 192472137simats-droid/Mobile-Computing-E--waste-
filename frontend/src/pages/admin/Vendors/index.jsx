import React, { useEffect, useState } from 'react';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import Button from '../../../components/common/Button/Button';
import AdminNav from '../../../components/admin/AdminNav';
import ArchivalSkeleton from '../../../components/vintage/ArchivalSkeleton/ArchivalSkeleton';
import ArchivalEmptyState from '../../../components/vintage/ArchivalEmptyState/ArchivalEmptyState';
import ConfirmModal from '../../../components/common/ConfirmModal/ConfirmModal';
import apiClient from '../../../services/apiClient';

import { ensurePrototypeDataSeeded, INITIAL_ADMIN_VENDORS } from '../../../utils/prototypeSeed';

export function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
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

  const loadVendors = async () => {
    setLoading(true);
    try {
      ensurePrototypeDataSeeded();
      let fallbackVendors = INITIAL_ADMIN_VENDORS;
      try {
        const saved = localStorage.getItem('vestige_admin_vendors');
        if (saved) fallbackVendors = JSON.parse(saved);
      } catch {}

      const res = await apiClient.get('/api/admin/vendors').catch(() => null);
      const serverVendors = res?.data?.data;
      if (Array.isArray(serverVendors) && serverVendors.length > 0) {
        setVendors(serverVendors);
      } else {
        setVendors(fallbackVendors);
      }
    } catch (err) {
      console.warn('Failed to load vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const promptVerify = (v, action) => {
    const isApproving = action === 'APPROVE';
    setConfirmModalConfig({
      isOpen: true,
      title: isApproving ? `Approve Workshop: ${v.businessName}` : `Reject Workshop: ${v.businessName}`,
      message: isApproving
        ? `Accredit and verify ${v.businessName}? The workshop will immediately receive hardware restoration bookings and collections.`
        : `Reject accreditation for ${v.businessName}? The partner will be notified of document insufficiency.`,
      confirmLabel: isApproving ? 'Approve & Verify' : 'Reject Application',
      isDestructive: !isApproving,
      onConfirm: async () => {
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.patch(`/api/admin/vendors/${v.id}/verify`, {
            action,
            rejectionReason: isApproving ? null : 'Document verification requirements unfulfilled',
          }).catch(() => {});
        } catch {}

        try {
          const saved = JSON.parse(localStorage.getItem('vestige_admin_vendors') || '[]');
          const source = saved.length > 0 ? saved : INITIAL_ADMIN_VENDORS;
          const updated = source.map((item) =>
            item.id === v.id ? { ...item, verificationStatus: isApproving ? 'VERIFIED' : 'REJECTED' } : item
          );
          localStorage.setItem('vestige_admin_vendors', JSON.stringify(updated));
        } catch {}

        setNotice(`Workshop partner ${v.businessName} ${isApproving ? 'APPROVED & VERIFIED' : 'REJECTED'}.`);
        loadVendors();
      },
    });
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesStatus = filterStatus === 'ALL' || v.verificationStatus === filterStatus;
    const matchesSearch =
      !searchQuery.trim() ||
      (v.businessName && v.businessName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.city && v.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.user?.email && v.user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <PageShell>
      <Container size="lg">
        <div style={{ margin: '2rem 0 1rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--vestige-brass-dark)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
            ✦ Workshop & Artisan Accreditation
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', color: 'var(--vestige-espresso)', margin: '0.25rem 0 0' }}>
            Workshop Partner Directory
          </h1>
        </div>

        <AdminNav />

        {notice && (
          <div style={{ padding: '0.75rem 1rem', background: 'var(--vestige-parchment-light)', border: '1px solid var(--vestige-brass)', borderRadius: 'var(--radius-xs)', marginBottom: '1.5rem', color: 'var(--vestige-espresso)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{notice}</p>
            <button onClick={() => setNotice('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vestige-ink-light)' }}>✕</button>
          </div>
        )}

        <LedgerCard
          variant="admin"
          watermark="tools"
          watermarkSize={120}
          watermarkOpacity={0.06}
          title={`Accredited Workshops & Partners (${filteredVendors.length} displayed)`}
          subtitle="Audit workshop trade credentials, location, and specialization"
        >
          {/* Search and Status Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '360px' }}>
              <input
                type="text"
                placeholder="Search by business, city, email..."
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
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-serif)',
                    letterSpacing: '0.5px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--vestige-parchment-border)',
                    background: filterStatus === s ? 'var(--vestige-espresso)' : 'var(--vestige-parchment-light)',
                    color: filterStatus === s ? 'var(--vestige-ivory-warm)' : 'var(--vestige-ink)',
                    cursor: 'pointer',
                    fontWeight: filterStatus === s ? 'bold' : 'normal',
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
          ) : filteredVendors.length === 0 ? (
            <ArchivalEmptyState
              illustration="tools"
              title="No Workshops Match Query"
              description="No partner workshops or craftsmen match the selected status filter."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--vestige-brass-dark)', textAlign: 'left', color: 'var(--vestige-espresso)', fontFamily: 'var(--font-serif)' }}>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Workshop Business</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Location</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Categories</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'right' }}>Governance Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--vestige-parchment-border)' }}>
                      <td style={{ padding: '0.75rem 0.6rem' }}>
                        <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: 'var(--vestige-espresso)' }}>{v.businessName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--vestige-ink-light)' }}>{v.user?.email || 'Partner Account'}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem', color: 'var(--vestige-ink-light)' }}>
                        {v.city}, {v.state}
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(v.deviceCategories || []).map((c) => (
                            <span key={c} style={{ fontSize: '0.72rem', padding: '1px 5px', background: 'var(--vestige-parchment-light)', border: '1px solid var(--vestige-parchment-border)', borderRadius: 'var(--radius-xs)', fontFamily: 'var(--font-mono)' }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem' }}>
                        <span style={{
                          color: v.verificationStatus === 'VERIFIED' ? 'var(--vestige-moss)' : v.verificationStatus === 'PENDING' ? 'var(--vestige-brass-dark)' : 'var(--vestige-rust)',
                          fontWeight: 'bold',
                          fontSize: '0.82rem',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {v.verificationStatus}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          {v.verificationStatus !== 'VERIFIED' && (
                            <Button variant="primary" size="sm" onClick={() => promptVerify(v, 'APPROVE')}>
                              Verify
                            </Button>
                          )}
                          {v.verificationStatus !== 'REJECTED' && (
                            <Button variant="ghost" size="sm" onClick={() => promptVerify(v, 'REJECT')} style={{ color: 'var(--vestige-rust)' }}>
                              Reject
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </LedgerCard>

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

export default AdminVendorsPage;
