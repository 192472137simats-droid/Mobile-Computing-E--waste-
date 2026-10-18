import React, { useEffect, useState } from 'react';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import AdminNav from '../../../components/admin/AdminNav';
import apiClient from '../../../services/apiClient';


export function AdminRewardsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadRewards = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await apiClient.get('/api/admin/rewards');
      setAccounts(response.data || []);
    } catch (err) {
      setLoadError(err.message || 'Could not load records.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- this effect loads remote data.
    loadRewards();
  }, []);

  return (
    <PageShell>
      <Container size="lg">
        <div style={{ margin: '2rem 0 1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--vestige-gold-dark)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
            ✦ Circular Economy Incentive Ledger
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--vestige-espresso)', margin: '0.25rem 0 0' }}>
            Patron Rewards Accounts
          </h1>
        </div>

        <AdminNav />
        {loadError && <p role="alert">{loadError}</p>}

        <LedgerCard
          variant="admin"
          title={`Reward Accounts (${accounts.length})`}
          subtitle="Audit platform circular token distribution, lifetime earnings, and redemptions"
        >
          {loading ? (
            <p style={{ color: 'var(--vestige-ink-light)' }}>Loading reward accounts...</p>
          ) : accounts.length === 0 ? (
            <p style={{ color: 'var(--vestige-ink-light)' }}>No reward accounts registered yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--vestige-gold-dark)', textAlign: 'left', color: 'var(--vestige-espresso)' }}>
                    <th style={{ padding: '0.6rem' }}>Account Holder</th>
                    <th style={{ padding: '0.6rem' }}>Email</th>
                    <th style={{ padding: '0.6rem' }}>Current Balance</th>
                    <th style={{ padding: '0.6rem' }}>Lifetime Earned</th>
                    <th style={{ padding: '0.6rem' }}>Lifetime Redeemed</th>
                    <th style={{ padding: '0.6rem' }}>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.id} style={{ borderBottom: '1px solid var(--vestige-parchment-border)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 'bold' }}>{acc.userFullName}</td>
                      <td style={{ padding: '0.6rem', color: 'var(--vestige-ink-light)' }}>{acc.userEmail}</td>
                      <td style={{ padding: '0.6rem', fontWeight: 'bold', color: '#8a6514', fontSize: '1rem' }}>
                        🪙 {acc.balance || 0} pts
                      </td>
                      <td style={{ padding: '0.6rem', color: '#2d4a3e' }}>
                        +{acc.lifetimeEarned || 0} pts
                      </td>
                      <td style={{ padding: '0.6rem', color: '#a84242' }}>
                        -{acc.lifetimeRedeemed || 0} pts
                      </td>
                      <td style={{ padding: '0.6rem', color: 'var(--vestige-ink-light)', fontSize: '0.82rem' }}>
                        {acc.updatedAt ? new Date(acc.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </LedgerCard>
      </Container>
    </PageShell>
  );
}

export default AdminRewardsPage;
