import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import PageShell from '../components/layout/PageShell/PageShell';
import Container from '../components/layout/Container/Container';
import LedgerCard from '../components/vintage/LedgerCard/LedgerCard';
import WaxSealBadge from '../components/vintage/WaxSealBadge/WaxSealBadge';
import IconWrapper from '../components/common/IconWrapper/IconWrapper';
import Button from '../components/common/Button/Button';

export function ProtectedRoute({ children, allowedRoles = [], requireVerifiedVendor = false }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <PageShell>
        <Container size="sm">
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--vestige-ink-light)' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>
              Consulting VESTIGE Security Ledger...
            </p>
          </div>
        </Container>
      </PageShell>
    );
  }

  if (!isAuthenticated || !user) {
    let redirectPath = '/login/user';
    if (location.pathname.startsWith('/vendor')) {
      redirectPath = '/login/vendor';
    } else if (location.pathname.startsWith('/admin')) {
      redirectPath = '/login/admin';
    }
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Account Status Suspension Guard
  if (user.active === false) {
    return (
      <PageShell>
        <Container size="sm">
          <div style={{ marginTop: '2rem' }}>
            <LedgerCard
              variant="admin"
              headerBadge={
                <WaxSealBadge
                  variant="espresso"
                  size="md"
                  icon={<IconWrapper name="lock" size={24} color="var(--vestige-crimson)" />}
                  label="LOCKED"
                />
              }
              title="Archival Account Suspended"
              subtitle="Access to this terminal has been placed on administrative hold."
            >
              <div style={{ padding: '1rem 0', color: 'var(--vestige-ink)' }}>
                <p>
                  Your profile <strong>({user.email})</strong> is currently inactive. If you believe this is an error, please contact the VESTIGE governing archive.
                </p>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <Button variant="primary" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </LedgerCard>
          </div>
        </Container>
      </PageShell>
    );
  }

  // Role Access Guard (Admins have institutional clearance everywhere)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role) && user.role !== 'ADMIN') {
    return (
      <PageShell>
        <Container size="sm">
          <div style={{ marginTop: '2rem' }}>
            <LedgerCard
              variant="admin"
              headerBadge={
                <WaxSealBadge
                  variant="gold"
                  size="md"
                  icon={<IconWrapper name="shield" size={24} color="var(--vestige-crimson)" />}
                  label="DENIED"
                />
              }
              title="Clearance Level Insufficient"
              subtitle="This terminal is reserved for designated institutional credentials."
            >
              <div style={{ padding: '1rem 0', color: 'var(--vestige-ink)' }}>
                <p>
                  You are authenticated with role <strong>{user.role}</strong>, but this sector requires one of: <strong>{allowedRoles.join(', ')}</strong>.
                </p>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link to={user.role === 'VENDOR' ? '/vendor/dashboard' : '/user/dashboard'}>
                  <Button variant="primary">Return to My Dashboard</Button>
                </Link>
                <Link to="/portals">
                  <Button variant="ghost">Public Portals</Button>
                </Link>
                <Button variant="ghost" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </LedgerCard>
          </div>
        </Container>
      </PageShell>
    );
  }

  // Vendor Verification Status Guard
  if (requireVerifiedVendor && user.role === 'VENDOR') {
    const status = user.vendorProfile?.verificationStatus;
    if (status !== 'VERIFIED') {
      return (
        <PageShell>
          <Container size="sm">
            <div style={{ marginTop: '2rem' }}>
              <LedgerCard
                variant="vendor"
                headerBadge={
                  <WaxSealBadge
                    variant="olive"
                    size="md"
                    icon={<IconWrapper name="clock" size={24} color="var(--vestige-gold-dark)" />}
                    label={status || 'PENDING'}
                  />
                }
                title="Workshop Accreditation Under Review"
                subtitle="Your partner application is pending verification by the governing archive."
              >
                <div style={{ padding: '1rem 0', color: 'var(--vestige-ink)', lineHeight: 1.6 }}>
                  <p>
                    <strong>Workshop:</strong> {user.vendorProfile?.businessName || 'Registered Atelier'}
                  </p>
                  <p style={{ marginTop: '0.5rem' }}>
                    Status: <strong style={{ color: 'var(--vestige-gold-dark)' }}>{status || 'PENDING_REVIEW'}</strong>
                  </p>
                  <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--vestige-ink-light)' }}>
                    Dispatches and collection authorizations activate once our verification team validates your trade credentials.
                  </p>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                  <Button variant="primary" onClick={() => window.location.reload()}>
                    Refresh Status
                  </Button>
                  <Button variant="ghost" onClick={logout}>
                    Sign Out
                  </Button>
                </div>
              </LedgerCard>
            </div>
          </Container>
        </PageShell>
      );
    }
  }

  return children;
}

export default ProtectedRoute;
