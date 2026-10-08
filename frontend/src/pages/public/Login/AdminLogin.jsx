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
import { useAuth } from '../../../contexts/AuthContext';
import styles from './AuthForms.module.css';

export function AdminLogin() {
  const [formData, setFormData] = useState({ adminEmail: '', masterKey: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [forgotNotice, setForgotNotice] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.adminEmail.trim()) {
      errs.adminEmail = 'Administrative Access ID or email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      errs.adminEmail = 'Please enter a valid administrative email format.';
    }

    if (!formData.masterKey) {
      errs.masterKey = 'Security clearance master password is required.';
    } else if (formData.masterKey.length < 6) {
      errs.masterKey = 'Administrative credentials require at least 6 characters.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setAuthError('');
    setForgotNotice(false);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await login(formData.adminEmail, formData.masterKey, 'ADMIN');
      navigate('/admin/dashboard');
    } catch (err) {
      setAuthError(err.message || 'Clearance verification failed. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className={styles.authWrapper}>
        <Container size="sm">
          {/* Breadcrumb / Back Link */}
          <div className={styles.backBar}>
            <Link to="/portals" className={styles.backLink}>
              <IconWrapper name="arrow-left" size={16} />
              <span>Back to Public Portals</span>
            </Link>
          </div>

          <LedgerCard
            variant="admin"
            watermark="building"
            watermarkSize={140}
            watermarkOpacity={0.12}
            headerBadge={
              <WaxSealBadge
                variant="espresso"
                size="md"
                icon={<IconWrapper name="shield" size={24} color="var(--vestige-gold)" />}
                label="ADMIN"
              />
            }
            title="ADMIN LOGIN"
            subtitle="Secure Administrative Portal. Authorized governance clearance."
          >
            {/* Elevated Security Notice */}
            <div className={styles.securityWarningBox}>
              <IconWrapper name="lock" size={16} color="var(--vestige-gold)" />
              <span>Institutional Sector &bull; All administrative access attempts are strictly verified and audited.</span>
            </div>

            {authError && (
              <div className={styles.mockBanner} style={{ borderColor: 'var(--vestige-crimson)' }} role="alert">
                <IconWrapper name="info" size={18} color="var(--vestige-crimson)" />
                <p style={{ color: 'var(--vestige-crimson)' }}>{authError}</p>
              </div>
            )}

            {forgotNotice && (
              <div className={styles.mockBanner} role="status">
                <IconWrapper name="info" size={18} color="var(--vestige-gold-dark)" />
                <p>Contact the platform administrator for credential recovery. No reset request was sent.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              <FormField
                id="admin-email"
                label="Admin Access ID / Email"
                required
                error={errors.adminEmail}
                helpText="Enter your authorized governance email credentials."
              >
                <Input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleInputChange}
                  placeholder="officer@organization.com"
                  icon={<IconWrapper name="shield" size={18} />}
                  autoComplete="username"
                />
              </FormField>

              <FormField
                id="admin-master-key"
                label="Master Access Password"
                required
                error={errors.masterKey}
              >
                <PasswordInput
                  name="masterKey"
                  value={formData.masterKey}
                  onChange={handleInputChange}
                  placeholder="Enter security key"
                  autoComplete="current-password"
                />
              </FormField>

              <div className={styles.formRowBetween}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" className={styles.checkbox} defaultChecked />
                  <span>Enforce high-security session</span>
                </label>

                <button
                  type="button"
                  onClick={() => setForgotNotice(true)}
                  className={styles.textLinkBtn}
                >
                  Credential recovery
                </button>
              </div>

              <div className={styles.actionBlock}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className={styles.submitBtn}
                  icon={<IconWrapper name="lock" size={18} />}
                >
                  {loading ? 'Verifying Clearance...' : 'Authenticate Officer Terminal'}
                </Button>
              </div>
            </form>

            <Divider flourish="❖" variant="dark" />

            {/* Public Redirect Links */}
            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--vestige-ink-light)', marginTop: '1rem' }}>
              <p>Looking for standard platform access?</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <Link to="/login/user" style={{ color: 'var(--vestige-gold-dark)', fontWeight: 'bold' }}>
                  &rarr; Patron & Device Owner Sign In
                </Link>
                <Link to="/login/vendor" style={{ color: 'var(--vestige-olive)', fontWeight: 'bold' }}>
                  &rarr; Workshop & Partner Atelier Sign In
                </Link>
              </div>
            </div>
          </LedgerCard>
        </Container>
      </div>
    </PageShell>
  );
}

export default AdminLogin;
