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

export function VendorLogin() {
  const [formData, setFormData] = useState({ businessEmail: '', password: '' });
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
    if (!formData.businessEmail.trim()) {
      errs.businessEmail = 'Registered workshop email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)) {
      errs.businessEmail = 'Please enter a valid business email format.';
    }

    if (!formData.password) {
      errs.password = 'Workshop access password is required.';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must contain at least 6 characters.';
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
      await login(formData.businessEmail, formData.password, 'VENDOR');
      navigate('/vendor/dashboard');
    } catch (err) {
      setAuthError(err.message || 'Workshop authentication failed. Please verify your credentials.');
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
              <span>Back to Portal Selection</span>
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
                label="VENDOR"
              />
            }
            title="VENDOR LOGIN"
            subtitle="Welcome, Partner. Manage your repair and recycling services."
          >
            {authError && (
              <div className={styles.mockBanner} style={{ borderColor: 'var(--vestige-crimson)' }} role="alert">
                <IconWrapper name="info" size={18} color="var(--vestige-crimson)" />
                <p style={{ color: 'var(--vestige-crimson)' }}>{authError}</p>
              </div>
            )}

            {forgotNotice && (
              <div className={styles.mockBanner} role="status">
                <IconWrapper name="info" size={18} color="var(--vestige-gold-dark)" />
                <p>Automated workshop password recovery is not available yet. Contact VESTIGE support to regain access.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              <FormField
                id="vendor-email"
                label="Workshop / Business Email"
                required
                error={errors.businessEmail}
                helpText="The registered email associated with your accredited workshop."
              >
                <Input
                  type="email"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleInputChange}
                  placeholder="contact@workshop.com"
                  icon={<IconWrapper name="envelope" size={18} />}
                  autoComplete="email"
                />
              </FormField>

              <FormField
                id="vendor-password"
                label="Workshop Password"
                required
                error={errors.password}
              >
                <PasswordInput
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter workshop password"
                  autoComplete="current-password"
                />
              </FormField>

              <div className={styles.formRowBetween}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" className={styles.checkbox} defaultChecked />
                  <span>Remember on this terminal</span>
                </label>

                <button
                  type="button"
                  onClick={() => setForgotNotice(true)}
                  className={styles.textLinkBtn}
                >
                  Forgot password?
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
                  {loading ? 'Authenticating...' : 'Sign In to Workshop Atelier'}
                </Button>
              </div>
            </form>

            <Divider flourish="✦" variant="subtle" />

            <div className={styles.authFooter}>
              <p className={styles.switchPrompt}>
                New Repair Workshop or Recycler?{' '}
                <Link to="/register/vendor" className={styles.actionInlineBtn}>
                  Apply for Accreditation
                </Link>
              </p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Device Owner or Patron?{' '}
                <Link to="/login/user" style={{ color: 'var(--vestige-gold-dark)', fontWeight: 'bold' }}>
                  Sign In to Patron Portal &rarr;
                </Link>
              </p>
            </div>
          </LedgerCard>
        </Container>
      </div>
    </PageShell>
  );
}

export default VendorLogin;
