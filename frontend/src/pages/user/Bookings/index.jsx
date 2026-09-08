import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import WaxSealBadge from '../../../components/vintage/WaxSealBadge/WaxSealBadge';
import IconWrapper from '../../../components/common/IconWrapper/IconWrapper';
import Button from '../../../components/common/Button/Button';
import RazorpayCheckoutModal from '../../../components/payment/RazorpayCheckoutModal';
import WhatsAppButton from '../../../components/shared/WhatsAppButton/WhatsAppButton';
import ArchivalEmptyState from '../../../components/vintage/ArchivalEmptyState/ArchivalEmptyState';
import ArchivalSkeleton from '../../../components/vintage/ArchivalSkeleton/ArchivalSkeleton';
import ConfirmModal from '../../../components/common/ConfirmModal/ConfirmModal';
import { useTranslation } from '../../../i18n/useTranslation';
import apiClient from '../../../services/apiClient.js';
import {
  ensurePrototypeDataSeeded,
  INITIAL_USER_BOOKINGS,
  INITIAL_USER_RECYCLING,
} from '../../../utils/prototypeSeed.js';

const LOCAL_USER_BOOKINGS = 'vestige_user_bookings';
const LOCAL_RECYCLING_KEY = 'vestige_recycling_requests';

export function Bookings() {
  const { t } = useTranslation();
  const [repairs, setRepairs] = useState([]);
  const [recycling, setRecycling] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('repairs');
  const [actionMessage, setActionMessage] = useState('');
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);

  // Confirmation Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDestructive: true,
  });

  const loadBookings = React.useCallback(async () => {
    setLoading(true);
    try {
      ensurePrototypeDataSeeded();

      let localBookings = [];
      let localRecycling = [];

      try {
        const bSaved = localStorage.getItem(LOCAL_USER_BOOKINGS);
        localBookings = bSaved ? JSON.parse(bSaved) : INITIAL_USER_BOOKINGS;

        const rSaved = localStorage.getItem(LOCAL_RECYCLING_KEY);
        localRecycling = rSaved ? JSON.parse(rSaved) : INITIAL_USER_RECYCLING;
      } catch {}

      const [repairsRes, recyclingRes] = await Promise.all([
        apiClient.get('/api/repairs/my').catch(() => ({ data: [] })),
        apiClient.get('/api/recycling/my').catch(() => ({ data: [] })),
      ]);

      const serverRepairs = repairsRes?.data?.data || (Array.isArray(repairsRes?.data) ? repairsRes.data : []);
      const existingRepIds = new Set(serverRepairs.map((r) => r.id));
      const combinedRepairs = [
        ...serverRepairs,
        ...localBookings.filter((l) => !existingRepIds.has(l.id)),
      ];
      setRepairs(combinedRepairs.length > 0 ? combinedRepairs : localBookings);

      const serverRecycling = recyclingRes?.data?.data || (Array.isArray(recyclingRes?.data) ? recyclingRes.data : []);
      const existingRecIds = new Set(serverRecycling.map((r) => r.id));
      const combinedRecycling = [
        ...serverRecycling,
        ...localRecycling.filter((l) => !existingRecIds.has(l.id)),
      ];
      setRecycling(combinedRecycling.length > 0 ? combinedRecycling : localRecycling);
    } catch (err) {
      console.warn('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handlePaymentSuccess = (paymentData) => {
    if (!selectedBookingForPayment) return;
    const bookingId = selectedBookingForPayment.id;
    const receiptRef = paymentData?.transactionRef || `VSTG-PAY-${Math.floor(100000 + Math.random() * 900000)}`;

    const updated = repairs.map((r) =>
      r.id === bookingId
        ? {
            ...r,
            isPaid: true,
            status: 'COMPLETED',
            receiptId: receiptRef,
          }
        : r
    );

    setRepairs(updated);
    try {
      localStorage.setItem(LOCAL_USER_BOOKINGS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist paid booking:', e);
    }

    setSelectedBookingForPayment(null);
    setActionMessage(
      `✓ Payment verified successfully! Archival receipt #${receiptRef} recorded for ${selectedBookingForPayment.brand} ${selectedBookingForPayment.model}.`
    );
  };

  const openCancelRepairModal = (id) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Cancel Hardware Restoration Booking',
      message:
        'Are you certain you wish to cancel this repair request? This action will release the workshop reservation.',
      confirmLabel: 'Cancel Booking',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        const updated = repairs.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r));
        setRepairs(updated);
        try {
          localStorage.setItem(LOCAL_USER_BOOKINGS, JSON.stringify(updated));
        } catch {}
        try {
          await apiClient.patch(`/api/repairs/${id}/status`, {
            status: 'CANCELLED',
            notes: 'Cancelled by patron',
          });
        } catch {}
        setActionMessage(t('common.success', 'Repair booking has been cancelled.'));
      },
    });
  };

  const openCancelRecyclingModal = (id) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Cancel E-Waste Collection Pickup',
      message:
        'Are you certain you wish to cancel this e-waste doorstep pickup? The assigned logistics vehicle will be unassigned.',
      confirmLabel: 'Cancel Collection',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        const updated = recycling.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r));
        setRecycling(updated);
        try {
          localStorage.setItem(LOCAL_RECYCLING_KEY, JSON.stringify(updated));
        } catch {}
        try {
          await apiClient.patch(`/api/recycling/${id}/status`, {
            status: 'CANCELLED',
            notes: 'Cancelled by patron',
          });
        } catch {}
        setActionMessage(t('common.success', 'E-waste collection request has been cancelled.'));
      },
    });
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'olive';
      case 'IN_PROGRESS':
      case 'ACCEPTED':
      case 'SCHEDULED':
        return 'gold';
      case 'CANCELLED':
      case 'REJECTED':
        return 'rust';
      default:
        return 'espresso';
    }
  };

  // Calculations for prototype metrics
  const totalSettledAmount = repairs
    .filter((r) => r.isPaid)
    .reduce((acc, r) => acc + (parseFloat(r.estimatedCost) || 3500), 0);
  const pendingPaymentCount = repairs.filter(
    (r) => !r.isPaid && (r.status === 'COMPLETED' || r.status === 'IN_PROGRESS')
  ).length;

  return (
    <PageShell>
      <Container size="lg">
        {/* Header */}
        <div
          style={{
            margin: '2rem 0 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--vestige-brass-dark)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 'bold',
              }}
            >
              ✦ {t('bookings.subtitle', 'Archival Workflows & Custody Ledger')}
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.25rem',
                color: 'var(--vestige-espresso)',
                margin: '0.25rem 0 0',
              }}
            >
              {t('bookings.title', 'My Registered Bookings & Payments')}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Button
              variant="ornate"
              size="sm"
              onClick={() => setSelectedBookingForPayment(repairs[0] || INITIAL_USER_BOOKINGS[0])}
              icon={<IconWrapper name="credit-card" size={16} />}
            >
              Pay Workshop Bill (Razorpay)
            </Button>
            <Link to="/user/assessment" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm" icon={<IconWrapper name="search" size={16} />}>
                {t('assessment.calculateBtn', 'New Diagnostic')}
              </Button>
            </Link>
          </div>
        </div>

        {actionMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--vestige-parchment-light)',
              border: '1px solid var(--vestige-brass)',
              borderRadius: 'var(--radius-xs)',
              marginBottom: '1.5rem',
              color: 'var(--vestige-espresso)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>{actionMessage}</p>
            <button
              onClick={() => setActionMessage('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--vestige-ink-light)',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Prototype Summary & Calculations Plate */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              padding: '1rem',
              background: 'var(--vestige-parchment-light)',
              border: '1px solid var(--vestige-brass-light)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--vestige-ink-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Restoration Bookings
            </span>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--vestige-espresso)', marginTop: '0.2rem' }}>
              {repairs.length} Registered
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--vestige-brass-dark)' }}>
              {pendingPaymentCount > 0 ? `${pendingPaymentCount} Invoices Awaiting Payment` : 'All payments up to date'}
            </span>
          </div>

          <div
            style={{
              padding: '1rem',
              background: 'var(--vestige-parchment-light)',
              border: '1px solid var(--vestige-brass-light)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--vestige-ink-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Restorations Settled
            </span>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--vestige-moss)', marginTop: '0.2rem' }}>
              ₹{totalSettledAmount.toLocaleString()}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--vestige-ink-light)' }}>
              Verified Razorpay transactions
            </span>
          </div>

          <div
            style={{
              padding: '1rem',
              background: 'var(--vestige-parchment-light)',
              border: '1px solid var(--vestige-brass-light)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--vestige-ink-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              E-Waste Custody Dispatches
            </span>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--vestige-olive-dark)', marginTop: '0.2rem' }}>
              {recycling.length} Parcels
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--vestige-olive)' }}>Zero-landfill certified</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            borderBottom: '2px solid var(--vestige-parchment-border)',
            marginBottom: '1.5rem',
          }}
        >
          <button
            onClick={() => setActiveTab('repairs')}
            style={{
              padding: '0.75rem 1.25rem',
              fontFamily: 'var(--font-serif)',
              fontSize: '1rem',
              letterSpacing: '0.5px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'repairs' ? '3px solid var(--vestige-brass-dark)' : '3px solid transparent',
              color: activeTab === 'repairs' ? 'var(--vestige-espresso)' : 'var(--vestige-ink-light)',
              cursor: 'pointer',
              fontWeight: activeTab === 'repairs' ? 'bold' : 'normal',
              transition: 'all var(--transition-fast)',
            }}
          >
            {t('bookings.tabRepairs', 'Hardware Restorations')} ({repairs.length})
          </button>
          <button
            onClick={() => setActiveTab('recycling')}
            style={{
              padding: '0.75rem 1.25rem',
              fontFamily: 'var(--font-serif)',
              fontSize: '1rem',
              letterSpacing: '0.5px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'recycling' ? '3px solid var(--vestige-olive)' : '3px solid transparent',
              color: activeTab === 'recycling' ? 'var(--vestige-espresso)' : 'var(--vestige-ink-light)',
              cursor: 'pointer',
              fontWeight: activeTab === 'recycling' ? 'bold' : 'normal',
              transition: 'all var(--transition-fast)',
            }}
          >
            {t('bookings.tabRecycling', 'Ethical Recycling')} ({recycling.length})
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ArchivalSkeleton variant="card" height="160px" />
            <ArchivalSkeleton variant="card" height="160px" />
          </div>
        ) : activeTab === 'repairs' ? (
          /* Repairs Section */
          repairs.length === 0 ? (
            <ArchivalEmptyState
              illustration="tools"
              title={t('bookings.noRepairs', 'No Active Repair Bookings')}
              description="When your diagnostics recommend restoration, book a certified artisan workshop to renew your device."
              actionLabel={t('assessment.calculateBtn', 'Submit Device for Diagnostic')}
              actionHref="/user/assessment"
              actionIcon={<IconWrapper name="tools" size={16} />}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {repairs.map((r) => {
                const vendorPhone = r.vendor?.whatsappNumber || r.vendorWhatsappNumber || '+919876543210';
                const workshopName = r.vendor?.businessName || r.vendorBusinessName || 'Aegis Diagnostics Atelier';
                const contextualMsg = `Hello ${workshopName}, I am contacting you regarding my VESTIGE repair booking #${r.id || ''} for my ${r.submission?.brand || r.brand || ''} ${r.submission?.model || r.model || ''}.`;
                const feeAmount = r.submission?.estimatedRepairCost || r.estimatedCost || 3500.0;

                return (
                  <LedgerCard
                    key={r.id}
                    variant="default"
                    watermark="tools"
                    watermarkSize={120}
                    watermarkOpacity={0.08}
                    headerBadge={
                      <WaxSealBadge
                        variant={getStatusVariant(r.status)}
                        size="sm"
                        icon={<IconWrapper name="tools" size={16} color="var(--vestige-ivory)" />}
                        label={t(`status.${r.status}`, r.status)}
                      />
                    }
                    title={`${r.submission?.brand || r.brand || 'Device'} ${r.submission?.model || r.model || ''}`}
                    subtitle={`${t('bookings.assignedWorkshop', 'Assigned Atelier')}: ${workshopName}`}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        margin: '1rem 0',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--vestige-ink-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {t('bookings.scheduleDate', 'Preferred Schedule')}
                        </span>
                        <div style={{ fontWeight: 'bold', marginTop: '0.2rem', fontFamily: 'var(--font-serif)' }}>
                          {r.preferredDate} {r.preferredTime ? `@ ${r.preferredTime}` : ''}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--vestige-ink-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {t('bookings.estimatedFee', 'Repair Fee Quotation')}
                        </span>
                        <div style={{ fontWeight: 'bold', marginTop: '0.2rem', color: 'var(--vestige-espresso)', fontFamily: 'var(--font-serif)' }}>
                          ₹{Number(feeAmount).toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--vestige-ink-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {t('bookings.contact', 'Artisan Workshop Contact')}
                        </span>
                        <div style={{ marginTop: '0.25rem' }}>
                          <WhatsAppButton
                            inline
                            phoneNumber={vendorPhone}
                            customMessage={contextualMsg}
                            label={t('whatsapp.contactWorkshop', 'Message Workshop')}
                          />
                        </div>
                      </div>
                    </div>

                    {r.issueDescription && (
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontStyle: 'italic',
                          color: 'var(--vestige-ink)',
                          margin: '0.5rem 0',
                        }}
                      >
                        "{r.issueDescription}"
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '1.25rem',
                        borderTop: '1px solid var(--vestige-parchment-border)',
                        paddingTop: '0.75rem',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      {/* Payment Options Row */}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {r.isPaid ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              color: 'var(--vestige-moss)',
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              background: 'rgba(62, 92, 67, 0.1)',
                              padding: '0.35rem 0.75rem',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--vestige-moss)',
                            }}
                          >
                            <IconWrapper name="check" size={16} color="var(--vestige-moss)" />
                            <span>Paid via Razorpay (Ref #{r.receiptId || 'VSTG-PAY-882190'})</span>
                          </div>
                        ) : (
                          <>
                            <Button
                              variant="ornate"
                              size="sm"
                              onClick={() => setSelectedBookingForPayment(r)}
                              icon={<IconWrapper name="credit-card" size={16} />}
                            >
                              {r.status === 'COMPLETED'
                                ? `Pay Final Workshop Bill (₹${Number(feeAmount).toFixed(0)})`
                                : `Pay Diagnostic Advance / Deposit (₹500)`}
                            </Button>

                            {r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openCancelRepairModal(r.id)}
                                style={{ color: 'var(--vestige-rust)' }}
                              >
                                {t('bookings.cancel', 'Cancel Booking')}
                              </Button>
                            )}
                          </>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--vestige-ink-light)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        Ref ID: #{r.id?.substring(0, 10)}
                      </span>
                    </div>
                  </LedgerCard>
                );
              })}
            </div>
          )
        ) : (
          /* Recycling Section */
          recycling.length === 0 ? (
            <ArchivalEmptyState
              illustration="recycling"
              title={t('bookings.noRecycling', 'No E-Waste Collection Dispatches')}
              description="Schedule doorstep collection for obsolete devices to guarantee zero-landfill ethical recovery and earn rewards."
              actionLabel={t('nav.recycling', 'Schedule Collection Pickup')}
              actionHref="/user/recycling"
              actionIcon={<IconWrapper name="arrow-right" size={16} />}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {recycling.map((req) => (
                <LedgerCard
                  key={req.id}
                  variant="default"
                  watermark="recycling"
                  watermarkSize={120}
                  watermarkOpacity={0.08}
                  headerBadge={
                    <WaxSealBadge
                      variant={getStatusVariant(req.status)}
                      size="sm"
                      icon={<IconWrapper name="shield" size={16} color="var(--vestige-ivory)" />}
                      label={t(`status.${req.status}`, req.status)}
                    />
                  }
                  title={`${req.brand} ${req.model} (${req.deviceType})`}
                  subtitle={`${t('recycling.partner', 'Authorized Recycler')}: ${req.vendor?.businessName || req.vendorBusinessName || 'Certified Facility'}`}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      margin: '1rem 0',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--vestige-ink-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('recycling.pickupAddress', 'Pickup Location')}
                      </span>
                      <div style={{ marginTop: '0.2rem', fontSize: '0.9rem' }}>{req.pickupAddress}</div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--vestige-ink-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('recycling.date', 'Collection Date')}
                      </span>
                      <div style={{ fontWeight: 'bold', marginTop: '0.2rem', fontFamily: 'var(--font-serif)' }}>
                        {req.pickupDate} @ {req.pickupTime || '10:00 AM'}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--vestige-ink-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('recycling.units', 'Registered Parcel Count')}
                      </span>
                      <div style={{ fontWeight: 'bold', marginTop: '0.2rem', color: 'var(--vestige-olive)', fontFamily: 'var(--font-serif)' }}>
                        {req.deviceCount} {req.deviceCount === 1 ? 'Unit' : 'Units'} (Zero-Landfill Custody)
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '1.25rem',
                      borderTop: '1px solid var(--vestige-parchment-border)',
                      paddingTop: '0.75rem',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    {req.status !== 'CANCELLED' && req.status !== 'COMPLETED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCancelRecyclingModal(req.id)}
                        style={{ color: 'var(--vestige-rust)' }}
                      >
                        {t('bookings.cancel', 'Cancel Collection Request')}
                      </Button>
                    )}
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--vestige-ink-light)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Custody Ref: #{req.id?.substring(0, 10)}
                    </span>
                  </div>
                </LedgerCard>
              ))}
            </div>
          )
        )}

        {/* Razorpay Checkout Modal */}
        {selectedBookingForPayment && (
          <RazorpayCheckoutModal
            booking={selectedBookingForPayment}
            onClose={() => setSelectedBookingForPayment(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {/* Confirm Modal for Cancellation */}
        <ConfirmModal
          isOpen={confirmModalConfig.isOpen}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmLabel={confirmModalConfig.confirmLabel || 'Confirm'}
          isDestructive={confirmModalConfig.isDestructive}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        />
      </Container>
    </PageShell>
  );
}

export default Bookings;
