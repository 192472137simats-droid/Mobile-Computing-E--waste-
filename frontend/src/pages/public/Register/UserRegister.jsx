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

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English (Default)' },
  { value: 'hi', label: 'Hindi (हिंदी)' },
  { value: 'ta', label: 'Tamil (தமிழ்)' },
  { value: 'te', label: 'Telugu (తెలుగు)' },
  { value: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
];

export function UserRegister() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    preferredLanguage: 'en',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const { signUpUser } = useAuth();
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
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full legal name is required.';
    }
    if (!formData.email.trim()) {
      errs.email = 'Valid email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email format.';
    }
    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
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
      await signUpUser(formData.email, formData.password, {
        fullName: formData.fullName,
        phone: formData.phone,
        preferredLanguage: formData.preferredLanguage,
      });
      navigate('/user/dashboard');
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className={styles.authWrapper}>
        <Container size="sm">
          <div className={styles.backBar}>
            <Link to="/login/user" className={styles.backLink}>
              <IconWrapper name="arrow-left" size={16} />
              <span>Back to Patron Sign In</span>
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
                label="PATRON"
              />
            }
            title="Patron Registry"
            subtitle="Create an archival account to manage device assessments, repair dispatches, and circular rewards."
          >
            {authError && (
              <div className={styles.mockBanner} style={{ borderColor: 'var(--vestige-crimson)' }} role="alert">
                <IconWrapper name="info" size={18} color="var(--vestige-crimson)" />
                <p style={{ color: 'var(--vestige-crimson)' }}>{authError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              <FormField
                id="reg-fullname"
                label="Full Name"
                required
                error={errors.fullName}
              >
                <Input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Eleanor Vance"
                  icon={<IconWrapper name="user" size={18} />}
                  autoComplete="name"
                />
              </FormField>

              <FormField
                id="reg-email"
                label="Email Address"
                required
                error={errors.email}
                helpText="Will serve as your archival sign-in identifier."
              >
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="patron@example.com"
                  icon={<IconWrapper name="envelope" size={18} />}
                  autoComplete="email"
                />
              </FormField>

              <FormField
                id="reg-password"
                label="Password"
                required
                error={errors.password}
                helpText="Minimum 6 characters."
              >
                <PasswordInput
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create strong password"
                  autoComplete="new-password"
                />
              </FormField>

              <FormField
                id="reg-phone"
                label="Contact Phone"
                helpText="Optional: used for pickup coordination."
              >
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  icon={<IconWrapper name="phone" size={18} />}
                  autoComplete="tel"
                />
              </FormField>

              <FormField
                id="reg-language"
                label="Preferred Language"
                helpText="Language for certificates and correspondence."
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--vestige-parchment-white)',
                  border: '1px solid var(--vestige-parchment-border)',
                  borderRadius: 'var(--vestige-radius-sm)',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--vestige-ink)',
                }}>
                  <select
                    id="reg-language"
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </FormField>

              <div className={styles.actionBlock}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className={styles.submitBtn}
                  icon={<IconWrapper name="shield" size={18} />}
                >
                  {loading ? 'Creating Archival Profile...' : 'Complete Patron Registration'}
                </Button>
              </div>
            </form>

            <Divider flourish="✦" variant="subtle" />

            <div className={styles.authFooter}>
              <p className={styles.switchPrompt}>
                Already registered?{' '}
                <Link to="/login/user" className={styles.actionInlineBtn}>
                  Sign in to your account
                </Link>
              </p>
            </div>
          </LedgerCard>
        </Container>
      </div>
    </PageShell>
  );
}

export default UserRegister;
