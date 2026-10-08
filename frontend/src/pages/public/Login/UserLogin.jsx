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

export function UserLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
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
    if (!formData.email.trim()) {
      errs.email = 'Registered email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email format (e.g. user@example.com).';
    }

    if (!formData.password) {
      errs.password = 'Account password is required.';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
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
      await login(formData.email, formData.password, 'USER');
      navigate('/user/dashboard');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please verify your credentials.');
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
            variant="user"
            watermark="quill"
            watermarkSize={130}
            watermarkOpacity={0.12}
            headerBadge={
              <WaxSealBadge
                variant="gold"
                size="md"
                icon={<IconWrapper name="user" size={24} color="var(--vestige-espresso)" />}
                label="USER"
              />
            }
            title="USER LOGIN"
            subtitle="Welcome back. Continue your device's journey."
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
                <p>Automated password recovery is not available yet. Contact VESTIGE support to regain access.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              <FormField
                id="user-email"
                label="Email Address"
                required
                error={errors.email}
                helpText="The email address associated with your VESTIGE user account."
              >
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                  icon={<IconWrapper name="envelope" size={18} />}
                  autoComplete="email"
                />
              </FormField>

              <FormField
                id="user-password"
                label="Password"
                required
                error={errors.password}
              >
                <PasswordInput
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
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
                  {loading ? 'Authenticating...' : 'Sign In to Patron Portal'}
                </Button>
              </div>
            </form>

            <Divider flourish="✦" variant="subtle" />

            <div className={styles.authFooter}>
              <p className={styles.switchPrompt}>
                New to VESTIGE?{' '}
                <Link to="/register/user" className={styles.actionInlineBtn}>
                  Create Free Patron Account
                </Link>
              </p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Electronics Workshop Partner?{' '}
                <Link to="/login/vendor" style={{ color: 'var(--vestige-olive)', fontWeight: 'bold' }}>
                  Sign In to Workshop Atelier &rarr;
                </Link>
              </p>
            </div>
          </LedgerCard>
        </Container>
      </div>
    </PageShell>
  );
}

export default UserLogin;
