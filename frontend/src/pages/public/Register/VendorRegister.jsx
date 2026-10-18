import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import WaxSealBadge from '../../../components/vintage/WaxSealBadge/WaxSealBadge';
import FormField from '../../../components/forms/FormField/FormField';
import Input from '../../../components/common/Input/Input';
import PasswordInput from '../../../components/forms/PasswordInput/PasswordInput';
import Button from '../../../components/common/Button/Button';
import IconWrapper from '../../../components/common/IconWrapper/IconWrapper';
import Divider from '../../../components/common/Divider/Divider';
import { useAuth } from '../../../contexts/useAuth';
import styles from '../Login/AuthForms.module.css';

const AVAILABLE_SERVICES = [
  { id: 'REPAIR', label: 'Hardware Repair & Diagnostics' },
  { id: 'RECYCLING', label: 'E-Waste Collection & Recycling' },
  { id: 'REFURBISHMENT', label: 'Certified Refurbishment' },
];

const AVAILABLE_CATEGORIES = [
  { id: 'SMARTPHONE', label: 'Smartphones & Tablets' },
  { id: 'LAPTOP', label: 'Laptops & Computers' },
  { id: 'AUDIO', label: 'Vintage Audio & Turntables' },
  { id: 'APPLIANCE', label: 'Small Household Appliances' },
  { id: 'OTHER', label: 'General Electronic Equipment' },
];

export function VendorRegister() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    businessType: 'Independent Repair Workshop',
    address: '',
    city: '',
    state: '',
    pincode: '',
    whatsappNumber: '',
    serviceTypes: ['REPAIR'],
    deviceCategories: ['SMARTPHONE', 'LAPTOP'],
    documentType: 'TRADE_LICENSE',
    documentUrl: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const { signUpVendor } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxToggle = (field, id) => {
    setFormData((prev) => {
      const list = prev[field] || [];
      const updated = list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
      return { ...prev, [field]: updated };
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Contact name is required.';
    if (!formData.email.trim()) errs.email = 'Business email is required.';
    if (!formData.password || formData.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (!formData.businessName.trim()) errs.businessName = 'Workshop / Business name is required.';
    if (!formData.address.trim()) errs.address = 'Shop street address is required.';
    if (!formData.city.trim()) errs.city = 'City is required.';
    if (!formData.state.trim()) errs.state = 'State is required.';
    if (!formData.pincode.trim()) errs.pincode = 'Pincode is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setAuthError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await signUpVendor(formData.email, formData.password, formData);
      navigate('/vendor/dashboard');
    } catch (err) {
      setAuthError(err.message || 'Vendor registration failed. Please check form data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className={styles.authWrapper}>
        <Container size="md">
          <div className={styles.backBar}>
            <Link to="/login/vendor" className={styles.backLink}>
              <IconWrapper name="arrow-left" size={16} />
              <span>Back to Workshop Sign In</span>
            </Link>
          </div>

          <LedgerCard
            variant="vendor"
            watermark="tools"
            watermarkSize={130}
            watermarkOpacity={0.12}
            headerBadge={
              <WaxSealBadge
                variant="olive"
                size="md"
                icon={<IconWrapper name="tools" size={24} color="var(--vestige-ivory)" />}
                label="PARTNER"
              />
            }
            title="Craftsman Workshop Accreditation"
            subtitle="Register your certified workshop or e-waste logistics facility into the VESTIGE circular network."
          >
            {authError && (
              <div className={styles.mockBanner} style={{ borderColor: 'var(--vestige-crimson)' }} role="alert">
                <IconWrapper name="info" size={18} color="var(--vestige-crimson)" />
                <p style={{ color: 'var(--vestige-crimson)' }}>{authError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--vestige-espresso)', margin: '1rem 0 0.5rem' }}>
                1. Workshop Ownership & Identity
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <FormField id="v-fullname" label="Lead Technician / Owner Name" required error={errors.fullName}>
                  <Input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Master Rajesh Sharma"
                    icon={<IconWrapper name="user" size={18} />}
                  />
                </FormField>

                <FormField id="v-email" label="Business Email" required error={errors.email}>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="workshop@domain.com"
                    icon={<IconWrapper name="envelope" size={18} />}
                  />
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <FormField id="v-password" label="Account Password" required error={errors.password}>
                  <PasswordInput
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create workshop password"
                  />
                </FormField>

                <FormField id="v-phone" label="Contact Telephone">
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98888 77770"
                    icon={<IconWrapper name="phone" size={18} />}
                  />
                </FormField>
              </div>

              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--vestige-espresso)', margin: '1.5rem 0 0.5rem' }}>
                2. Establishment Details
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <FormField id="v-bname" label="Business / Shop Name" required error={errors.businessName}>
                  <Input
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="e.g. Bangalore Precision Electronics"
                    icon={<IconWrapper name="tools" size={18} />}
                  />
                </FormField>

                <FormField id="v-btype" label="Business Classification">
                  <Input
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    placeholder="e.g. Certified Repair Atelier"
                  />
                </FormField>
              </div>

              <FormField id="v-address" label="Workshop Street Address" required error={errors.address}>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street, Building, Landmark"
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <FormField id="v-city" label="City" required error={errors.city}>
                  <Input name="city" value={formData.city} onChange={handleInputChange} placeholder="Bengaluru" />
                </FormField>

                <FormField id="v-state" label="State" required error={errors.state}>
                  <Input name="state" value={formData.state} onChange={handleInputChange} placeholder="Karnataka" />
                </FormField>

                <FormField id="v-pincode" label="Pincode" required error={errors.pincode}>
                  <Input name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="560001" />
                </FormField>
              </div>

              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--vestige-espresso)', margin: '1.5rem 0 0.5rem' }}>
                3. Technical Services & Hardware Focus
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <label style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--vestige-espresso)' }}>Services Provided:</label>
                {AVAILABLE_SERVICES.map((s) => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.serviceTypes.includes(s.id)}
                      onChange={() => handleCheckboxToggle('serviceTypes', s.id)}
                    />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--vestige-espresso)' }}>Device Categories Handled:</label>
                {AVAILABLE_CATEGORIES.map((c) => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.deviceCategories.includes(c.id)}
                      onChange={() => handleCheckboxToggle('deviceCategories', c.id)}
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>

              <FormField id="v-doc" label="Accreditation / Registration Certificate URL" helpText="Link to trade license, GST, or ISO certificate (optional for preliminary submission).">
                <Input
                  name="documentUrl"
                  value={formData.documentUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/certificates/license.pdf"
                  icon={<IconWrapper name="archive" size={18} />}
                />
              </FormField>

              <div className={styles.actionBlock}>
                <Button
                  type="submit"
                  variant="ornate"
                  size="lg"
                  loading={loading}
                  className={styles.submitBtn}
                  icon={<IconWrapper name="tools" size={18} />}
                >
                  {loading ? 'Submitting Application...' : 'Submit Workshop for Accreditation'}
                </Button>
              </div>
            </form>

            <Divider flourish="❖" variant="subtle" />

            <div className={styles.authFooter}>
              <p className={styles.switchPrompt}>
                Already registered?{' '}
                <Link to="/login/vendor" className={styles.actionInlineBtn}>
                  Sign in to workshop portal
                </Link>
              </p>
            </div>
          </LedgerCard>
        </Container>
      </div>
    </PageShell>
  );
}

export default VendorRegister;
