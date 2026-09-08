import React, { useEffect, useState } from 'react';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import WaxSealBadge from '../../../components/vintage/WaxSealBadge/WaxSealBadge';
import IconWrapper from '../../../components/common/IconWrapper/IconWrapper';
import Button from '../../../components/common/Button/Button';
import ArchivalEmptyState from '../../../components/vintage/ArchivalEmptyState/ArchivalEmptyState';
import ArchivalSkeleton from '../../../components/vintage/ArchivalSkeleton/ArchivalSkeleton';
import ConfirmModal from '../../../components/common/ConfirmModal/ConfirmModal';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import {
  ensurePrototypeDataSeeded,
  INITIAL_VENDOR_REPAIRS,
  INITIAL_VENDOR_RECYCLING,
  logPlatformActivity,
} from '../../../utils/prototypeSeed';

const LOCAL_VENDOR_REPAIRS = 'vestige_vendor_repairs';
const LOCAL_VENDOR_RECYCLING = 'vestige_vendor_recycling';
const LOCAL_VENDOR_VERIFIED = 'vestige_vendor_verified';

export function VendorDashboard() {
  const { user, logout } = useAuth();

  // Accreditation state defaults to VERIFIED for prototype workbench testing
  const [isVerified, setIsVerified] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(LOCAL_VENDOR_VERIFIED) !== 'false';
    }
    return true;
  });

  const [repairs, setRepairs] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem(LOCAL_VENDOR_REPAIRS);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_VENDOR_REPAIRS;
  });

  const [recycling, setRecycling] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem(LOCAL_VENDOR_RECYCLING);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_VENDOR_RECYCLING;
  });

  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'

  // Confirm Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDestructive: false,
  });

  const vendor = user?.vendorProfile;

  // Initialize seed data on mount
  useEffect(() => {
    ensurePrototypeDataSeeded();
  }, []);

  const persistRepairs = (updated) => {
    setRepairs(updated);
    try {
      localStorage.setItem(LOCAL_VENDOR_REPAIRS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist vendor repairs:', e);
    }
  };

  const persistRecycling = (updated) => {
    setRecycling(updated);
    try {
      localStorage.setItem(LOCAL_VENDOR_RECYCLING, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist vendor recycling:', e);
    }
  };

  const toggleAccreditation = () => {
    const next = !isVerified;
    setIsVerified(next);
    try {
      localStorage.setItem(LOCAL_VENDOR_VERIFIED, next ? 'true' : 'false');
    } catch {}
    setActionNotice(
      next
        ? '✦ Accreditation Status: VERIFIED & ACCREDITED (All workbenches active).'
        : 'Accreditation Status: PENDING REVIEW (Gated mode simulated).'
    );
  };

  const handleUpdateRepairStatus = async (repairId, nextStatus) => {
    setActionNotice('');
    const updated = repairs.map((r) =>
      r.id === repairId ? { ...r, status: nextStatus } : r
    );
    persistRepairs(updated);

    const actionLabels = {
      ACCEPTED: 'Accepted! Scheduled for hardware intake & bench evaluation.',
      IN_PROGRESS: 'Under active repair & component micro-soldering.',
      COMPLETED: 'Marked Completed! Customer notified for collection & +100 PTS awarded.',
      REJECTED: 'Declined request. Re-routed to alternative accredited workshop.',
    };

    setActionNotice(
      `✓ Repair Job #${repairId.substring(0, 10)}: ${actionLabels[nextStatus] || nextStatus}`
    );

    const targetJob = repairs.find((r) => r.id === repairId);
    logPlatformActivity({
      actorRole: 'VENDOR',
      actorName: user?.vendorProfile?.businessName || 'Aegis Diagnostics Atelier',
      actorEmail: user?.email || 'aegis@vestige.internal',
      actionType: `REPAIR_${nextStatus}`,
      category: 'REPAIR',
      description: `Workshop updated repair job #${repairId.substring(0, 10)} to ${nextStatus}`,
      targetEntity: 'RepairBooking',
      targetId: repairId,
      details: `${targetJob ? `${targetJob.brand || ''} ${targetJob.model || ''}` : 'Hardware repair'} • ${actionLabels[nextStatus] || nextStatus}`,
      badge: 'VENDOR',
      status: nextStatus,
    });

    // Attempt backend sync
    try {
      await api.patch(`/repairs/${repairId}/status`, {
        status: nextStatus,
        notes: `Progressed by craftsman to ${nextStatus}`,
      });
    } catch (err) {
      console.warn('Backend sync failed, updated locally in workbench:', err);
    }
  };

  const handleUpdateRecyclingStatus = async (requestId, nextStatus) => {
    setActionNotice('');
    const updated = recycling.map((req) =>
      req.id === requestId ? { ...req, status: nextStatus } : req
    );
    persistRecycling(updated);

    const actionLabels = {
      ACCEPTED: 'Accepted collection! Logistics vehicle queued.',
      SCHEDULED: 'Logistics courier dispatched for doorstep retrieval.',
      COMPLETED: 'Disassembly received at custody vault & circular points credited to patron!',
      REJECTED: 'Declined pickup dispatch.',
    };

    setActionNotice(
      `✓ E-Waste Parcel #${requestId.substring(0, 10)}: ${actionLabels[nextStatus] || nextStatus}`
    );

    const targetRec = recycling.find((r) => r.id === requestId);
    logPlatformActivity({
      actorRole: 'VENDOR',
      actorName: user?.vendorProfile?.businessName || 'Aegis Diagnostics Atelier',
      actorEmail: user?.email || 'aegis@vestige.internal',
      actionType: `RECYCLING_${nextStatus}`,
      category: 'RECYCLING',
      description: `Workshop updated e-waste dispatch #${requestId.substring(0, 10)} to ${nextStatus}`,
      targetEntity: 'RecyclingRequest',
      targetId: requestId,
      details: `${targetRec ? `${targetRec.brand || ''} ${targetRec.model || ''}` : 'E-waste item'} • ${actionLabels[nextStatus] || nextStatus}`,
      badge: 'VENDOR',
      status: nextStatus,
    });

    // Attempt backend sync
    try {
      await api.patch(`/recycling/${requestId}/status`, {
        status: nextStatus,
        notes: `Progressed by logistics partner to ${nextStatus}`,
      });
    } catch (err) {
      console.warn('Backend sync failed, updated locally in workbench:', err);
    }
  };

  const promptDeclineRepair = (repairId) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Decline Repair Request',
      message:
        'Are you certain you wish to decline this assigned repair request? It will be safely re-routed to an alternate accredited VESTIGE workshop.',
      confirmLabel: 'Decline Job',
      isDestructive: true,
      onConfirm: () => {
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        handleUpdateRepairStatus(repairId, 'REJECTED');
      },
    });
  };

  const promptDeclineRecycling = (requestId) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Decline Recycling Pickup',
      message:
        'Are you certain you wish to decline this e-waste collection dispatch? It will be re-routed to an alternate certified recovery partner.',
      confirmLabel: 'Decline Pickup',
      isDestructive: true,
      onConfirm: () => {
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        handleUpdateRecyclingStatus(requestId, 'REJECTED');
      },
    });
  };

  const filteredRepairs = repairs.filter((r) => {
    if (filterMode === 'ACTIVE')
      return r.status === 'PENDING' || r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS';
    if (filterMode === 'COMPLETED') return r.status === 'COMPLETED';
    return true;
  });

  const filteredRecycling = recycling.filter((req) => {
    if (filterMode === 'ACTIVE')
      return req.status === 'PENDING' || req.status === 'ACCEPTED' || req.status === 'SCHEDULED';
    if (filterMode === 'COMPLETED') return req.status === 'COMPLETED';
    return true;
  });

  // Calculate prototype financial and operational stats
  const completedJobsCount = repairs.filter((r) => r.status === 'COMPLETED').length;
  const activeJobsCount =
    repairs.filter((r) => r.status !== 'COMPLETED' && r.status !== 'REJECTED').length +
    recycling.filter((r) => r.status !== 'COMPLETED' && r.status !== 'REJECTED').length;
  const totalRevenue = completedJobsCount * 3500 + 4200;

  const displayLocation =
    vendor?.address && vendor.address.trim()
      ? `${vendor.address}, ${vendor.city || ''}, ${vendor.state || ''} - ${vendor.pincode || ''}`
      : '14/B Industrial Suburb, Peenya 2nd Stage, Bengaluru, Karnataka - 560058';

  return (
    <PageShell>
      <Container size="lg">
        {/* Header Ribbon */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: '2rem 0 1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--vestige-olive)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 'bold',
              }}
            >
              ✦ Certified Craftsman Workbench & Registry
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.25rem',
                color: 'var(--vestige-espresso)',
                margin: '0.25rem 0 0',
              }}
            >
              {vendor?.businessName || 'Aegis Diagnostics Atelier'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Button
              variant={isVerified ? 'subtle' : 'ornate'}
              size="sm"
              onClick={toggleAccreditation}
              icon={<IconWrapper name={isVerified ? 'check' : 'shield'} size={16} />}
            >
              {isVerified ? 'Accredited (Active)' : 'Simulate Instant Accreditation'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              icon={<IconWrapper name="lock" size={16} />}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {actionNotice && (
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
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>{actionNotice}</p>
            <button
              onClick={() => setActionNotice('')}
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

        {/* Workbench Performance KPI Grid */}
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
              Active Queue
            </span>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--vestige-espresso)', marginTop: '0.2rem' }}>
              {activeJobsCount} Jobs
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--vestige-olive-dark)' }}>Pending review & progress</span>
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
              Restorations Completed
            </span>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--vestige-moss)', marginTop: '0.2rem' }}>
              {completedJobsCount + 12}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--vestige-ink-light)' }}>Verified customer pickups</span>
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
              Total Revenue Disbursed
            </span>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--vestige-brass-dark)', marginTop: '0.2rem' }}>
              ₹{totalRevenue.toLocaleString()}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--vestige-olive-dark)' }}>Settled via Razorpay escrow</span>
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
              Quality Rating
            </span>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--vestige-espresso)', marginTop: '0.2rem' }}>
              4.9 ★
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--vestige-olive-dark)' }}>Accredited craftsman excellence</span>
          </div>
        </div>

        {/* Status Filter Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--vestige-ink-light)',
              fontFamily: 'var(--font-serif)',
              marginRight: '0.5rem',
            }}
          >
            Filter Workbench Jobs:
          </span>
          {['ALL', 'ACTIVE', 'COMPLETED'].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-serif)',
                letterSpacing: '0.5px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--vestige-parchment-border)',
                background: filterMode === mode ? 'var(--vestige-espresso)' : 'var(--vestige-parchment-light)',
                color: filterMode === mode ? 'var(--vestige-ivory-warm)' : 'var(--vestige-ink)',
                cursor: 'pointer',
                fontWeight: filterMode === mode ? 'bold' : 'normal',
                transition: 'all var(--transition-fast)',
              }}
            >
              {mode} (
              {mode === 'ALL'
                ? repairs.length + recycling.length
                : mode === 'ACTIVE'
                ? repairs.filter((r) => r.status !== 'COMPLETED' && r.status !== 'REJECTED').length +
                  recycling.filter((r) => r.status !== 'COMPLETED' && r.status !== 'REJECTED').length
                : repairs.filter((r) => r.status === 'COMPLETED').length +
                  recycling.filter((r) => r.status === 'COMPLETED').length}
              )
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          {/* Workshop Dossier */}
          <LedgerCard
            variant="vendor"
            watermark="building"
            watermarkSize={140}
            watermarkOpacity={0.1}
            headerBadge={
              <WaxSealBadge
                variant={isVerified ? 'olive' : 'gold'}
                size="sm"
                icon={<IconWrapper name="tools" size={18} color="var(--vestige-ivory)" />}
                label={isVerified ? 'VERIFIED' : 'PENDING REVIEW'}
              />
            }
            title="Workshop Dossier"
            subtitle="Accredited operational credentials"
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                fontSize: '0.92rem',
                color: 'var(--vestige-ink)',
              }}
            >
              <div>
                <span
                  style={{
                    color: 'var(--vestige-ink-light)',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Lead Technician:
                </span>
                <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>
                  {user?.fullName || 'Aegis Diagnostics Atelier'} ({user?.email || 'aegis@vestige.internal'})
                </div>
              </div>
              <div>
                <span
                  style={{
                    color: 'var(--vestige-ink-light)',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Workshop Facility Location:
                </span>
                <div style={{ fontSize: '0.88rem', color: 'var(--vestige-espresso)' }}>
                  {displayLocation}
                </div>
              </div>
              <div>
                <span
                  style={{
                    color: 'var(--vestige-ink-light)',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Accreditation Status:
                </span>
                <div
                  style={{
                    fontWeight: 'bold',
                    color: isVerified ? 'var(--vestige-olive)' : 'var(--vestige-brass-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>{isVerified ? 'VERIFIED & CERTIFIED ATELIER' : 'PENDING ADMINISTRATIVE AUDIT'}</span>
                  <button
                    onClick={toggleAccreditation}
                    style={{
                      background: 'none',
                      border: '1px solid var(--vestige-brass)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '2px 6px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      color: 'var(--vestige-espresso)',
                    }}
                  >
                    Switch Mode
                  </button>
                </div>
              </div>
              <div>
                <span
                  style={{
                    color: 'var(--vestige-ink-light)',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Authorized Repair Categories:
                </span>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    marginTop: '0.25rem',
                  }}
                >
                  {['SMARTPHONE', 'LAPTOP', 'TABLET', 'VINTAGE_AUDIO'].map((cat) => (
                    <span
                      key={cat}
                      style={{
                        background: 'var(--vestige-parchment-border)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </LedgerCard>

          {/* Active Repair Workbench */}
          <LedgerCard
            variant="default"
            watermark="tools"
            watermarkSize={140}
            watermarkOpacity={0.1}
            headerBadge={
              <WaxSealBadge
                variant="gold"
                size="sm"
                icon={<IconWrapper name="tools" size={16} color="var(--vestige-espresso)" />}
                label={`${filteredRepairs.length} JOBS`}
              />
            }
            title="Assigned Hardware Restorations"
            subtitle="Patron requests allocated to your workbench for intake & repair"
          >
            {loading ? (
              <ArchivalSkeleton variant="card" height="120px" />
            ) : !isVerified ? (
              <div
                style={{
                  padding: '1.25rem',
                  background: 'var(--vestige-parchment-light)',
                  border: '1px dashed var(--vestige-brass)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--vestige-brass-dark)',
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: '0 0 0.75rem 0', fontWeight: 'bold' }}>
                  Accreditation simulated as PENDING.
                </p>
                <Button variant="ornate" size="sm" onClick={toggleAccreditation}>
                  Activate Accreditation to View & Accept Jobs
                </Button>
              </div>
            ) : filteredRepairs.length === 0 ? (
              <ArchivalEmptyState
                illustration="tools"
                title="No Repairs In This View"
                description={
                  filterMode === 'ALL'
                    ? 'No active repair bookings allocated to this workshop.'
                    : `No ${filterMode.toLowerCase()} repair jobs found.`
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredRepairs.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '1.15rem',
                      border: '1px solid var(--vestige-parchment-border)',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--vestige-parchment-light)',
                      boxShadow: 'var(--shadow-paper-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 'bold',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: '1.05rem',
                          color: 'var(--vestige-espresso)',
                        }}
                      >
                        {r.brand} {r.model}
                      </span>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color:
                            r.status === 'COMPLETED'
                              ? 'var(--vestige-moss)'
                              : r.status === 'REJECTED'
                              ? 'var(--vestige-rust)'
                              : 'var(--vestige-brass-dark)',
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 8px',
                          border: '1px solid currentColor',
                          borderRadius: 'var(--radius-xs)',
                        }}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--vestige-ink-light)',
                        marginTop: '0.35rem',
                        display: 'flex',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>
                        <strong>Patron:</strong> {r.userName || 'Device Owner'}
                      </span>
                      {r.userPhone && (
                        <span>
                          <strong>Phone:</strong> {r.userPhone}
                        </span>
                      )}
                      <span>
                        <strong>Schedule:</strong> {r.preferredDate} {r.preferredTime ? `@ ${r.preferredTime}` : ''}
                      </span>
                      <span>
                        <strong>Quotation:</strong> ₹{Number(r.estimatedCost || 3500).toFixed(2)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.86rem',
                        marginTop: '0.4rem',
                        fontStyle: 'italic',
                        color: 'var(--vestige-ink)',
                        background: 'rgba(255, 255, 255, 0.4)',
                        padding: '0.4rem 0.6rem',
                        borderRadius: 'var(--radius-xs)',
                      }}
                    >
                      "{r.issueDescription}"
                    </div>

                    {/* Interactive Action Row for Accepting / Denying / Progressing */}
                    <div
                      style={{
                        marginTop: '0.85rem',
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      {r.status === 'PENDING' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateRepairStatus(r.id, 'ACCEPTED')}
                            icon={<IconWrapper name="check" size={14} />}
                          >
                            Accept Job
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => promptDeclineRepair(r.id)}
                            style={{ color: 'var(--vestige-rust)' }}
                          >
                            Decline
                          </Button>
                        </>
                      )}

                      {r.status === 'ACCEPTED' && (
                        <>
                          <Button
                            variant="ornate"
                            size="sm"
                            onClick={() => handleUpdateRepairStatus(r.id, 'IN_PROGRESS')}
                            icon={<IconWrapper name="tools" size={14} />}
                          >
                            Start Restoration Workbench
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => promptDeclineRepair(r.id)}
                            style={{ color: 'var(--vestige-rust)' }}
                          >
                            Cancel Intake
                          </Button>
                        </>
                      )}

                      {r.status === 'IN_PROGRESS' && (
                        <Button
                          variant="ornate"
                          size="sm"
                          onClick={() => handleUpdateRepairStatus(r.id, 'COMPLETED')}
                          icon={<IconWrapper name="crest" size={14} />}
                        >
                          Mark Completed & Issue Receipt (+100 PTS)
                        </Button>
                      )}

                      {r.status === 'COMPLETED' && (
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--vestige-moss)',
                            fontWeight: 'bold',
                            fontFamily: 'var(--font-serif)',
                          }}
                        >
                          ✓ Restoration Complete — Invoice Ready for Patron Payment
                        </span>
                      )}

                      {r.status === 'REJECTED' && (
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--vestige-rust)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          Job Declined (Re-routed)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LedgerCard>
        </div>

        {/* E-Waste Collections Workbench */}
        <LedgerCard
          variant="vendor"
          headerBadge={
            <WaxSealBadge
              variant="olive"
              size="sm"
              icon={<IconWrapper name="recycle" size={16} color="var(--vestige-ivory)" />}
              label={`${filteredRecycling.length} PARCELS`}
            />
          }
          title="Assigned E-Waste Doorstep Dispatches"
          subtitle="Customer zero-landfill pickup requests allocated for ethical dismantling"
        >
          {loading ? (
            <ArchivalSkeleton variant="card" height="120px" />
          ) : !isVerified ? (
            <p style={{ color: 'var(--vestige-brass-dark)' }}>
              Accreditation pending. Click "Simulate Instant Accreditation" above to activate.
            </p>
          ) : filteredRecycling.length === 0 ? (
            <ArchivalEmptyState
              illustration="recycling"
              title="No E-Waste Collections"
              description="No doorstep collection dispatches currently allocated to your facility."
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
              }}
            >
              {filteredRecycling.map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: '1.15rem',
                    border: '1px solid var(--vestige-parchment-border)',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--vestige-parchment-light)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.02rem' }}>
                      {req.brand} {req.model} ({req.deviceCount} items)
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color:
                          req.status === 'COMPLETED'
                            ? 'var(--vestige-moss)'
                            : 'var(--vestige-olive)',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 8px',
                        border: '1px solid currentColor',
                        borderRadius: 'var(--radius-xs)',
                      }}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--vestige-ink-light)',
                      marginTop: '0.35rem',
                    }}
                  >
                    <div>
                      <strong>Location:</strong> {req.pickupAddress}
                    </div>
                    <div>
                      <strong>Collection Schedule:</strong> {req.pickupDate}{' '}
                      {req.pickupTime ? `@ ${req.pickupTime}` : ''}
                    </div>
                  </div>

                  <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {req.status === 'PENDING' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateRecyclingStatus(req.id, 'ACCEPTED')}
                          icon={<IconWrapper name="check" size={14} />}
                        >
                          Accept Pickup
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => promptDeclineRecycling(req.id)}
                          style={{ color: 'var(--vestige-rust)' }}
                        >
                          Decline
                        </Button>
                      </>
                    )}

                    {req.status === 'ACCEPTED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateRecyclingStatus(req.id, 'SCHEDULED')}
                        icon={<IconWrapper name="calendar" size={14} />}
                      >
                        Dispatch Logistics Agent
                      </Button>
                    )}

                    {req.status === 'SCHEDULED' && (
                      <Button
                        variant="ornate"
                        size="sm"
                        onClick={() => handleUpdateRecyclingStatus(req.id, 'COMPLETED')}
                        icon={<IconWrapper name="recycle" size={14} />}
                      >
                        Confirm Intake & Award Circular Points (+100 PTS)
                      </Button>
                    )}

                    {req.status === 'COMPLETED' && (
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--vestige-moss)',
                          fontWeight: 'bold',
                        }}
                      >
                        ✓ Zero-Landfill Dismantling Verified — Secondary Materials Secured
                      </span>
                    )}

                    {req.status === 'REJECTED' && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--vestige-rust)' }}>
                        Pickup Declined
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </LedgerCard>

        {/* Confirmation Modal */}
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

export default VendorDashboard;
