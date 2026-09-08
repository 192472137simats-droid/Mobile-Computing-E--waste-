import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import VintageHeading from '../../../components/vintage/VintageHeading/VintageHeading';
import WaxSealBadge from '../../../components/vintage/WaxSealBadge/WaxSealBadge';
import FormField from '../../../components/forms/FormField/FormField';
import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';
import Divider from '../../../components/common/Divider/Divider';
import IconWrapper from '../../../components/common/IconWrapper/IconWrapper';
import deviceService from '../../../services/deviceService';
import { useTranslation } from '../../../i18n/useTranslation';
import styles from './Assessment.module.css';

const AVAILABLE_ISSUES = [
  'Cracked Display / Digitizer',
  'Battery Degradation (>30% loss)',
  'Motherboard / Logic Board Fault',
  'Severe Liquid Intrusion',
  'Damaged Charging Port / Pins',
  'Unresponsive Keyboard / Trackpad',
  'Broken Hinge / Enclosure Fracture',
  'Intermittent Boot Failure / Kernel Panics',
  'Overheating / Fan Bearing Failure',
];

export function AssessmentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    deviceType: 'SMARTPHONE',
    brand: '',
    model: '',
    deviceAgeYears: 3,
    condition: 'FAIR',
    estimatedRepairCost: '',
    originalValue: '',
    partAvailability: 'AVAILABLE',
  });

  const [selectedIssues, setSelectedIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assessmentResult, setAssessmentResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleIssue = (issue) => {
    setSelectedIssues((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.brand.trim() || !formData.model.trim()) {
      setError('Please provide the brand and model of your electronic device.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        deviceType: formData.deviceType,
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        deviceAgeYears: parseInt(formData.deviceAgeYears, 10) || 1,
        condition: formData.condition,
        estimatedRepairCost: parseFloat(formData.estimatedRepairCost) || 0,
        originalValue: parseFloat(formData.originalValue) || 10000,
        partAvailability: formData.partAvailability,
        knownIssues: selectedIssues,
      };

      const response = await deviceService.assessDevice(payload);
      if (response && response.data) {
        setAssessmentResult(response.data);
      } else {
        setError('No assessment response received from Decision Engine.');
      }
    } catch (err) {
      console.error('Assessment submission error:', err);
      setError(err.message || 'Failed to evaluate device assessment. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookRepair = () => {
    if (!assessmentResult) return;

    const refId = `REP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newBooking = {
      id: refId,
      submissionId: assessmentResult.id || null,
      deviceType: assessmentResult.deviceType || formData.deviceType || 'SMARTPHONE',
      brand: assessmentResult.brand || formData.brand || 'Apparatus',
      model: assessmentResult.model || formData.model || 'Standard Edition',
      vendorBusinessName: 'Aegis Precision Electronics Atelier',
      vendorWhatsappNumber: '+919889568711',
      estimatedCost: parseFloat(assessmentResult.estimatedRepairCost || formData.repairCost || 3200),
      status: 'PENDING',
      preferredDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      preferredTime: '11:00 AM',
      issueDescription: selectedIssues.length > 0 ? selectedIssues.join(', ') : 'Hardware diagnostic restoration and testing',
      isPaid: false,
      submission: {
        brand: assessmentResult.brand || formData.brand,
        model: assessmentResult.model || formData.model,
        estimatedRepairCost: parseFloat(assessmentResult.estimatedRepairCost || formData.repairCost || 3200),
        engineScore: assessmentResult.engineScore || 78,
        engineRecommendation: 'REPAIR',
      },
      createdAt: new Date().toISOString(),
    };

    try {
      const savedBookings = JSON.parse(localStorage.getItem('vestige_user_bookings') || '[]');
      savedBookings.unshift(newBooking);
      localStorage.setItem('vestige_user_bookings', JSON.stringify(savedBookings));
    } catch (e) {
      console.warn('Could not save booking locally:', e);
    }

    try {
      const vendorRepairs = JSON.parse(localStorage.getItem('vestige_vendor_repairs') || '[]');
      vendorRepairs.unshift({
        id: newBooking.id,
        userName: 'Archival Patron (Self)',
        userEmail: 'user@vestige.internal',
        userPhone: '+91 98895 68711',
        brand: newBooking.brand,
        model: newBooking.model,
        deviceType: newBooking.deviceType,
        status: 'PENDING',
        preferredDate: newBooking.preferredDate,
        preferredTime: newBooking.preferredTime,
        estimatedCost: newBooking.estimatedCost,
        issueDescription: newBooking.issueDescription,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('vestige_vendor_repairs', JSON.stringify(vendorRepairs));
    } catch (e) {
      console.warn('Could not mirror booking to vendor:', e);
    }

    try {
      const adminRepairs = JSON.parse(localStorage.getItem('vestige_admin_repairs') || '[]');
      adminRepairs.unshift({
        id: newBooking.id,
        userFullName: 'Archival Patron',
        userEmail: 'user@vestige.internal',
        brand: newBooking.brand,
        model: newBooking.model,
        deviceType: newBooking.deviceType,
        vendorBusinessName: newBooking.vendorBusinessName,
        estimatedCost: newBooking.estimatedCost,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('vestige_admin_repairs', JSON.stringify(adminRepairs));
    } catch {}

    navigate('/user/bookings', {
      state: {
        successMessage: `Restoration booking #${newBooking.id} scheduled for ${newBooking.brand} ${newBooking.model}!`,
      },
    });
  };

  const handleProceedToRecycling = () => {
    if (!assessmentResult) return;
    navigate('/user/recycling', {
      state: {
        prefillSubmissionId: assessmentResult.id,
        prefillDeviceType: assessmentResult.deviceType,
        prefillBrand: assessmentResult.brand,
        prefillModel: assessmentResult.model,
      },
    });
  };

  return (
    <PageShell>
      <div className={styles.pageWrapper}>
        <Container size="lg">
          {/* Breadcrumb Navigation */}
          <div className={styles.backBar}>
            <Link to="/user/dashboard" className={styles.backLink}>
              <IconWrapper name="arrow-left" size={16} />
              <span>{t('common.back', 'Back to User Dashboard')}</span>
            </Link>
          </div>

          <VintageHeading
            level={1}
            eyebrow={t('hero.eyebrow', 'The Unified Circular Registry')}
            subtitle={t('assessment.subtitle', 'Submit hardware specifications for archival heuristic evaluation.')}
          >
            {t('assessment.title', 'Device Diagnostic & Circular Scoring')}
          </VintageHeading>

          {error && (
            <div className={`${styles.alertBox} ${styles.alertError}`} role="alert">
              <IconWrapper name="alert-triangle" size={20} color="var(--vestige-rust)" />
              <span>{error}</span>
            </div>
          )}

          <LedgerCard
            variant="user"
            headerBadge={
              <WaxSealBadge
                variant="gold"
                size="md"
                icon={<IconWrapper name="tools" size={24} color="var(--vestige-espresso)" />}
                label={t('nav.diagnostics', 'DIAGNOSTICS')}
              />
            }
            title={t('assessment.step1', '1. Device Category & Specifications')}
            subtitle={t('assessment.subtitle', 'All inputs are evaluated by our algorithmic circular scoring engine.')}
          >
            <form onSubmit={handleSubmit} noValidate>
              <div className={styles.formGrid}>
                {/* 1. Device Category */}
                <FormField
                  id="deviceType"
                  label="Device Category"
                  required
                  helpText="Select primary equipment classification."
                >
                  <select
                    id="deviceType"
                    name="deviceType"
                    value={formData.deviceType}
                    onChange={handleInputChange}
                    className={styles.selectInput}
                  >
                    <option value="SMARTPHONE">Smartphone</option>
                    <option value="LAPTOP">Laptop / Notebook</option>
                    <option value="TABLET">Tablet Computer</option>
                    <option value="DESKTOP">Desktop / Tower Station</option>
                    <option value="OTHER">Other Audio/Electronics</option>
                  </select>
                </FormField>

                {/* 2. Device Age */}
                <FormField
                  id="deviceAgeYears"
                  label="Device Age (Years)"
                  required
                  helpText="Approximate years since manufacture or initial purchase."
                >
                  <Input
                    id="deviceAgeYears"
                    name="deviceAgeYears"
                    type="number"
                    min="0"
                    max="30"
                    value={formData.deviceAgeYears}
                    onChange={handleInputChange}
                  />
                </FormField>

                {/* 3. Brand */}
                <FormField
                  id="brand"
                  label="Brand / Manufacturer"
                  required
                  helpText="e.g. Apple, Dell, Lenovo, Samsung, HP"
                >
                  <Input
                    id="brand"
                    name="brand"
                    placeholder="Enter brand name"
                    value={formData.brand}
                    onChange={handleInputChange}
                  />
                </FormField>

                {/* 4. Model */}
                <FormField
                  id="model"
                  label="Model Designation"
                  required
                  helpText="e.g. iPhone 11 Pro, ThinkPad T480, Galaxy S20"
                >
                  <Input
                    id="model"
                    name="model"
                    placeholder="Enter model number or name"
                    value={formData.model}
                    onChange={handleInputChange}
                  />
                </FormField>

                {/* 5. Physical Condition */}
                <FormField
                  id="condition"
                  label="Physical & Cosmetic Condition"
                  required
                >
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className={styles.selectInput}
                  >
                    <option value="GOOD">Good (Minor cosmetic blemishes only)</option>
                    <option value="FAIR">Fair (Visible wear, scratches, or minor dents)</option>
                    <option value="POOR">Poor (Cracked glass, heavy fractures, water damage)</option>
                  </select>
                </FormField>

                {/* 6. Spare Parts Availability */}
                <FormField
                  id="partAvailability"
                  label="Spare Parts Availability"
                  required
                >
                  <select
                    id="partAvailability"
                    name="partAvailability"
                    value={formData.partAvailability}
                    onChange={handleInputChange}
                    className={styles.selectInput}
                  >
                    <option value="AVAILABLE">Available (OEM or certified aftermarket supply)</option>
                    <option value="UNKNOWN">Unknown (Requires workshop inspection)</option>
                    <option value="UNAVAILABLE">Unavailable (Obsolete or proprietary components)</option>
                  </select>
                </FormField>

                {/* 7. Estimated Repair Cost */}
                <FormField
                  id="estimatedRepairCost"
                  label="Estimated Repair Cost (₹)"
                  helpText="Estimated quotation for parts & technician labor."
                >
                  <Input
                    id="estimatedRepairCost"
                    name="estimatedRepairCost"
                    type="number"
                    placeholder="e.g. 3500"
                    value={formData.estimatedRepairCost}
                    onChange={handleInputChange}
                  />
                </FormField>

                {/* 8. Original / Replacement Valuation */}
                <FormField
                  id="originalValue"
                  label="Original / Replacement Valuation (₹)"
                  helpText="Estimated purchase price or contemporary replacement value."
                >
                  <Input
                    id="originalValue"
                    name="originalValue"
                    type="number"
                    placeholder="e.g. 35000"
                    value={formData.originalValue}
                    onChange={handleInputChange}
                  />
                </FormField>
              </div>

              {/* Known Issues Checklist */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <IconWrapper name="shield" size={18} color="var(--vestige-walnut)" />
                  Known Technical Faults & Symptoms
                </h3>
                <div className={styles.issuesGrid}>
                  {AVAILABLE_ISSUES.map((issue) => {
                    const isChecked = selectedIssues.includes(issue);
                    return (
                      <div
                        key={issue}
                        onClick={() => toggleIssue(issue)}
                        className={`${styles.checkboxCard} ${isChecked ? styles.checkboxCardActive : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          aria-label={issue}
                        />
                        <span>{issue}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.actionRow}>
                <Button
                  type="submit"
                  variant="ornate"
                  size="lg"
                  loading={loading}
                  icon={<IconWrapper name="crest" size={18} />}
                >
                  {loading ? t('common.loading', 'Evaluating via Decision Engine...') : t('assessment.calculateBtn', 'Run Circular Diagnostic Engine')}
                </Button>
              </div>
            </form>
          </LedgerCard>

          {/* Decision Engine Verdict Result Card */}
          {assessmentResult && (
            <div className={styles.verdictCard}>
              <div className={styles.verdictHeader}>
                <div className={styles.verdictBadgeGroup}>
                  <WaxSealBadge
                    variant={assessmentResult.engineRecommendation === 'REPAIR' ? 'moss' : 'espresso'}
                    size="lg"
                    icon={
                      <IconWrapper
                        name={assessmentResult.engineRecommendation === 'REPAIR' ? 'tools' : 'shield'}
                        size={28}
                        color="var(--vestige-ivory)"
                      />
                    }
                    label={t(`status.${assessmentResult.engineRecommendation}`, assessmentResult.engineRecommendation)}
                  />
                  <div>
                    <h2 className={styles.sectionTitle} style={{ border: 'none', margin: 0 }}>
                      {t('assessment.recommendation', 'Archival Heuristic Recommendation')}: {t(`status.${assessmentResult.engineRecommendation}`, assessmentResult.engineRecommendation)}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--vestige-sepia-mid)', fontSize: 'var(--font-size-sm)' }}>
                      Confidence Level:{' '}
                      <strong style={{ color: 'var(--vestige-espresso)' }}>
                        {assessmentResult.engineConfidence}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className={styles.scoreMeter}>
                  <div>
                    <div className={styles.scoreValue}>{assessmentResult.engineScore} / 100</div>
                    <div className={styles.scoreLabel}>{t('assessment.repairScore', 'Circular Repairability Score')}</div>
                  </div>
                </div>
              </div>

              <div className={styles.rationaleBox}>
                <h4 className={styles.rationaleTitle}>Algorithmic Archival Rationale</h4>
                <p className={styles.rationaleText}>{assessmentResult.engineRationale}</p>
              </div>

              <Divider flourish="❖" variant="gold" />

              <div className={styles.verdictActions}>
                {assessmentResult.engineRecommendation === 'RECYCLE' ? (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleProceedToRecycling}
                    icon={<IconWrapper name="arrow-right" size={18} />}
                  >
                    {t('assessment.scheduleRecycleBtn', 'Schedule Zero-Landfill Pickup')}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ornate"
                      size="lg"
                      onClick={handleBookRepair}
                      icon={<IconWrapper name="tools" size={18} />}
                    >
                      {t('assessment.bookRepairBtn', 'Book Certified Repair Workshop')}
                    </Button>
                    <Button
                      variant="subtle"
                      size="md"
                      onClick={handleProceedToRecycling}
                    >
                      {t('assessment.scheduleRecycleBtn', 'Recycle Device Instead')}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setAssessmentResult(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {t('assessment.calculateBtn', 'New Assessment')}
                </Button>
              </div>
            </div>
          )}
        </Container>
      </div>
    </PageShell>
  );
}

export default AssessmentPage;
