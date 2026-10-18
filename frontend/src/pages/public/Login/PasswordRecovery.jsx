import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import FormField from '../../../components/forms/FormField/FormField';
import Input from '../../../components/common/Input/Input';
import PasswordInput from '../../../components/forms/PasswordInput/PasswordInput';
import Button from '../../../components/common/Button/Button';
import apiClient from '../../../services/apiClient';
import styles from './AuthForms.module.css';

export function PasswordRecovery() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');
  const isReset = location.pathname === '/reset-password';
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    setMessage('');
    if (isReset && (!token || newPassword.length < 8 || newPassword !== confirmPassword)) {
      setError(!token ? 'This reset link is incomplete.' : 'Use at least 8 characters and matching passwords.');
      return;
    }
    setBusy(true);
    try {
      if (isReset) {
        await apiClient.post('/api/auth/password-reset/complete', { token, newPassword });
        setMessage('Your password has been updated. You can sign in now.');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        await apiClient.post('/api/auth/password-reset/request', { email });
        setMessage('If an eligible account exists, a reset link has been sent to its email address.');
      }
    } catch (err) {
      setError(err.message || 'Password recovery is unavailable. Please try again later.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <div className={styles.authWrapper}>
        <Container size="sm">
          <LedgerCard
            variant="user"
            title={isReset ? 'SET A NEW PASSWORD' : 'RESET YOUR PASSWORD'}
            subtitle={isReset ? 'Choose a new password for your account.' : 'Enter your account email to receive a reset link.'}
          >
            {message && <div className={styles.mockBanner} role="status"><p>{message}</p></div>}
            {error && <div className={styles.mockBanner} role="alert"><p>{error}</p></div>}
            <form onSubmit={handleSubmit} className={styles.form}>
              {isReset ? (
                <>
                  <FormField id="new-password" label="New Password" required>
                    <PasswordInput name="newPassword" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" />
                  </FormField>
                  <FormField id="confirm-password" label="Confirm New Password" required>
                    <PasswordInput name="confirmPassword" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
                  </FormField>
                </>
              ) : (
                <FormField id="recovery-email" label="Account Email" required>
                  <Input type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
                </FormField>
              )}
              <Button type="submit" variant="primary" size="lg" loading={busy}>
                {isReset ? 'Update Password' : 'Send Reset Link'}
              </Button>
            </form>
            <p className={styles.switchPrompt}><Link to="/login/user">Back to sign in</Link></p>
          </LedgerCard>
        </Container>
      </div>
    </PageShell>
  );
}

export default PasswordRecovery;
