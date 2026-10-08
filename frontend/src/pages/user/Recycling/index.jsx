import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import VintageHeading from '../../../components/vintage/VintageHeading/VintageHeading';
import WaxSealBadge from '../../../components/vintage/WaxSealBadge/WaxSealBadge';
import FormField from '../../../components/forms/FormField/FormField';
import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';
import Badge from '../../../components/ui/Badge/Badge';
import Divider from '../../../components/common/Divider/Divider';
import IconWrapper from '../../../components/common/IconWrapper/IconWrapper';
import ArchivalEmptyState from '../../../components/vintage/ArchivalEmptyState/ArchivalEmptyState';
import ArchivalSkeleton from '../../../components/vintage/ArchivalSkeleton/ArchivalSkeleton';
import ConfirmModal from '../../../components/common/ConfirmModal/ConfirmModal';
import recyclingService from '../../../services/recyclingService';
import vendorService from '../../../services/vendorService';
import styles from './Recycling.module.css';

export function RecyclingPage() {
  const location = useLocation();
  const prefill = location.state || {};

  const [vendors, setVendors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState(() => ({
    submissionId: prefill.prefillSubmissionId || '',
    deviceType: prefill.prefillDeviceType || 'SMARTPHONE',
    brand: prefill.prefillBrand || '',
    model: prefill.prefillModel || '',
    vendorId: '',
    pickupAddress: 'Flat 304, Heritage Apartments, 12th Cross, Indiranagar, Bengaluru',
    pickupDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    pickupTime: '10:00',
    deviceCount: 1,
  }));

  // Confirmation Modal State
  const [cancellingRequestId, setCancellingRequestId] = useState(null);

  const loadInitialData = React.useCallback(async () => {
    try {
      setLoading(true);
      const vendorRes = await vendorService.getVendors('RECYCLE');
      if (vendorRes && vendorRes.data) {
        setVendors(vendorRes.data);
        if (vendorRes.data.length > 0) {
          setFormData((prev) => (prev.vendorId ? prev : { ...prev, vendorId: vendorRes.data[0].id }));
        }
      }

      const requestsRes = await recyclingService.getMyRecyclingRequests();
      if (requestsRes && requestsRes.data) {
        setRequests(requestsRes.data);
      }
    } catch (err) {
      console.error('Failed to load recycling data:', err);
      setErrorMsg(err.message || 'Could not load recycling partners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.vendorId) {
      setErrorMsg('Please select an authorized e-waste collection partner.');
      return;
    }
    if (!formData.pickupAddress.trim()) {
      setErrorMsg('Pickup location address is required.');
      return;
    }
    const count = parseInt(formData.deviceCount, 10);
    if (isNaN(count) || count < 1) {
      setErrorMsg('Please enter a valid quantity of devices (at least 1).');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        vendorId: formData.vendorId,
        submissionId: formData.submissionId || null,
        deviceType: formData.deviceType,
        brand: formData.brand || 'General Electronics',
        model: formData.model || 'Recycling Parcel',
        pickupAddress: formData.pickupAddress.trim(),
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime ? `${formData.pickupTime}:00` : '10:00:00',
        deviceCount: count,
      };

      const res = await recyclingService.createRecyclingRequest(payload);
      if (res && res.data) {
        const refId = res.data.id ? res.data.id.substring(0, 8).toUpperCase() : 'PENDING';
        setSuccessMsg(
          `✦ Collection scheduled successfully! Archival Reference ID: #${refId}. Logistics Partner: ${res.data.vendorBusinessName || 'Certified Recycler'}. +${count * 50} Circular Reward Points will be awarded after collection is completed!`
        );

        const requestsRes = await recyclingService.getMyRecyclingRequests();
        if (requestsRes && requestsRes.data) {
          setRequests(requestsRes.data);
        }
      }
    } catch (err) {
      console.error('Recycling request creation error:', err);
      const message = err?.data?.message || err?.message || 'Unable to schedule your collection at this time. Please try again.';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  const executeCancelRequest = async () => {
    if (!cancellingRequestId) return;
    const reqId = cancellingRequestId;
    setCancellingRequestId(null);

    try {
      await recyclingService.cancelRecyclingRequest(reqId);
      setSuccessMsg('Recycling pickup cancelled successfully.');
      loadInitialData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to cancel recycling request.');
    }
  };

  return (
    <PageShell>
      <div className={styles.pageWrapper}>
        <Container size="lg">
          <div className={styles.backBar}>
            <Link to="/user/dashboard" className={styles.backLink}>
              <IconWrapper name="arrow-left" size={16} />
              <span>Back to User Dashboard</span>
            </Link>
          </div>

          <VintageHeading
            level={1}
            eyebrow="Phase 3 Zero-Landfill Initiative"
            subtitle="Book certified e-waste logistics partners for doorstep collection. Earn verifiable circular economy points upon certified facility intake."
          >
            Zero-Landfill Doorstep Collection
          </VintageHeading>

          {successMsg && (
            <div className={`${styles.alertBox} ${styles.alertSuccess}`} role="status">
              <IconWrapper name="check" size={20} color="var(--vestige-moss)" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span>{successMsg}</span>
                <Link to="/user/bookings" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="sm">
                    View in Archival Ledger →
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className={`${styles.alertBox} ${styles.alertError}`} role="alert">
              <IconWrapper name="alert-triangle" size={20} color="var(--vestige-rust)" />
              <span>{errorMsg}</span>
            </div>
          )}

          <LedgerCard
            variant="vendor"
            watermark="recycling"
            watermarkSize={140}
            watermarkOpacity={0.08}
            headerBadge={
              <WaxSealBadge
                variant="olive"
                size="md"
                icon={<IconWrapper name="shield" size={24} color="var(--vestige-ivory)" />}
                label="ETHICAL PICKUP"
              />
            }
            title="Schedule E-Waste Dispatch"
            subtitle="Fill out pickup details for certified courier collection."
          >
            <form onSubmit={handleSubmit} noValidate>
              <div className={styles.formGrid}>
                {/* 1. Recycler Partner Selection */}
                <FormField
                  id="vendorId"
                  label="Certified Recycling Facility"
                  required
                  helpText="Select an authorized local dismantling partner."
                >
                  <select
                    id="vendorId"
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleInputChange}
                    className={styles.selectInput}
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.businessName} ({v.city}, {v.state}) — Rating: {v.rating || '5.0'} ★
                      </option>
                    ))}
                    {vendors.length === 0 && (
                      <option value="">No registered recyclers online (Demo Default will be used)</option>
                    )}
                  </select>
                </FormField>

                {/* 2. Device Count */}
                <FormField
                  id="deviceCount"
                  label="Quantity of Devices"
                  required
                  helpText="Number of items bundled in this pickup parcel."
                >
                  <Input
                    id="deviceCount"
                    name="deviceCount"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.deviceCount}
                    onChange={handleInputChange}
                  />
                </FormField>

                {/* 3. Primary Device Category */}
                <FormField
                  id="deviceType"
                  label="Primary Equipment Type"
                  required
                >
                  <select
                    id="deviceType"
                    name="deviceType"
                    value={formData.deviceType}
                    onChange={handleInputChange}
                    className={styles.selectInput}
                  >
                    <option value="SMARTPHONE">Smartphone / Mobile Phone</option>
                    <option value="LAPTOP">Laptop / Notebook Computer</option>
                    <option value="TABLET">Tablet / E-Reader</option>
                    <option value="DESKTOP">Desktop Workstation / Monitor</option>
                    <option value="OTHER">Assorted Electronics / Cables</option>
                  </select>
                </FormField>

                {/* 4. Brand & Model */}
                <FormField
                  id="brand"
                  label="Brand & Model Details"
                  helpText="e.g. Dell Inspiron 15 / Legacy Audio Amp"
                >
                  <Input
                    id="brand"
                    name="brand"
                    placeholder="Enter device brand/model"
                    value={formData.brand ? `${formData.brand} ${formData.model}` : formData.brand}
                    onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value, model: '' }))}
                  />
                </FormField>

                {/* 5. Pickup Date */}
                <FormField
                  id="pickupDate"
                  label="Preferred Pickup Date"
                  required
                >
                  <Input
                    id="pickupDate"
                    name="pickupDate"
                    type="date"
                    min={todayStr}
                    value={formData.pickupDate}
                    onChange={handleInputChange}
                  />
                </FormField>

                {/* 6. Pickup Time */}
                <FormField
                  id="pickupTime"
                  label="Preferred Time Window"
                  required
                >
                  <Input
                    id="pickupTime"
                    name="pickupTime"
                    type="time"
                    value={formData.pickupTime}
                    onChange={handleInputChange}
                  />
                </FormField>
              </div>

              {/* 7. Full Pickup Address */}
              <div style={{ marginTop: 'var(--space-4)' }}>
                <FormField
                  id="pickupAddress"
                  label="Full Street Address & Landmark"
                  required
                  helpText="Doorstep location where the collection courier will retrieve the parcel."
                >
                  <Input
                    id="pickupAddress"
                    name="pickupAddress"
                    placeholder="Street address, apartment/unit, city, and pincode"
                    value={formData.pickupAddress}
                    onChange={handleInputChange}
                  />
                </FormField>
              </div>

              <div className={styles.actionRow}>
                <div className={styles.pointsEarnNotice}>
                  <IconWrapper name="crest" size={18} color="var(--vestige-brass-dark)" />
                  <span>
                    Estimated Reward:{' '}
                    <strong>{(parseInt(formData.deviceCount, 10) || 1) * 50} Circular Points</strong>
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="ornate"
                  size="lg"
                  loading={submitting}
                  icon={<IconWrapper name="calendar" size={18} />}
                >
                  {submitting ? 'Dispatching Request...' : 'Confirm & Schedule Collection'}
                </Button>
              </div>
            </form>
          </LedgerCard>

          <Divider flourish="❖" variant="gold" />

          {/* User's Recycling Requests History Registry */}
          <div className={styles.registrySection}>
            <VintageHeading
              level={2}
              eyebrow="Archival Audit Trail"
              subtitle="Live chronological history of scheduled, in-progress, and completed e-waste pickups."
            >
              My Recycling Registry Ledger
            </VintageHeading>

            {loading ? (
              <ArchivalSkeleton variant="table" rows={4} />
            ) : requests.length === 0 ? (
              <ArchivalEmptyState
                illustration="recycling"
                title="No Recycling Dispatches in Ledger"
                description="Schedule your first zero-landfill e-waste collection using the dispatch form above."
              />
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.ledgerTable}>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Partner Recycler</th>
                      <th>Device Details</th>
                      <th>Count</th>
                      <th>Status</th>
                      <th>Points Awarded</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.pickupDate}</strong>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--vestige-ink-light)' }}>
                            {r.pickupTime ? r.pickupTime.substring(0, 5) : 'Anytime'}
                          </div>
                        </td>
                        <td>{r.vendorBusinessName || 'Certified Facility'}</td>
                        <td>
                          <div>
                            <strong>{r.deviceType}</strong>
                          </div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--vestige-ink-light)' }}>
                            {r.brand} {r.model}
                          </div>
                        </td>
                        <td>{r.deviceCount} items</td>
                        <td>
                          <Badge
                            variant={
                              r.status === 'COMPLETED'
                                ? 'olive'
                                : r.status === 'CANCELLED'
                                ? 'rust'
                                : 'gold'
                            }
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td>
                          <span style={{ color: 'var(--vestige-brass-dark)', fontWeight: 'bold' }}>
                            +{r.pointsAwarded || (r.status === 'COMPLETED' ? r.deviceCount * 50 : 0)} PTS
                          </span>
                        </td>
                        <td>
                          {r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancellingRequestId(r.id)}
                              style={{ color: 'var(--vestige-rust)' }}
                            >
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Confirm Modal for Cancellation */}
          <ConfirmModal
            isOpen={!!cancellingRequestId}
            title="Cancel Recycling Pickup"
            message="Are you sure you wish to cancel this scheduled e-waste collection? The assigned courier vehicle will be unassigned."
            confirmLabel="Cancel Pickup"
            isDestructive={true}
            onConfirm={executeCancelRequest}
            onCancel={() => setCancellingRequestId(null)}
          />
        </Container>
      </div>
    </PageShell>
  );
}

export default RecyclingPage;
