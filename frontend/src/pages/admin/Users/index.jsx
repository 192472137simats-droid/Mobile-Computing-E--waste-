import React, { useEffect, useState } from 'react';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import LedgerCard from '../../../components/vintage/LedgerCard/LedgerCard';
import Button from '../../../components/common/Button/Button';
import AdminNav from '../../../components/admin/AdminNav';
import ArchivalSkeleton from '../../../components/vintage/ArchivalSkeleton/ArchivalSkeleton';
import ArchivalEmptyState from '../../../components/vintage/ArchivalEmptyState/ArchivalEmptyState';
import ConfirmModal from '../../../components/common/ConfirmModal/ConfirmModal';
import apiClient from '../../../services/apiClient';

import { ensurePrototypeDataSeeded, INITIAL_ADMIN_USERS } from '../../../utils/prototypeSeed';

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState('');

  // Confirmation Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    onConfirm: null,
    isDestructive: false,
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      ensurePrototypeDataSeeded();
      let fallbackUsers = INITIAL_ADMIN_USERS;
      try {
        const saved = localStorage.getItem('vestige_admin_users');
        if (saved) fallbackUsers = JSON.parse(saved);
      } catch {}

      const res = await apiClient.get('/api/admin/users').catch(() => null);
      const serverUsers = res?.data?.data;
      if (Array.isArray(serverUsers) && serverUsers.length > 0) {
        setUsers(serverUsers);
      } else {
        setUsers(fallbackUsers);
      }
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const promptToggleStatus = (u) => {
    const isSuspending = u.active;
    setConfirmModalConfig({
      isOpen: true,
      title: isSuspending ? `Suspend User: ${u.fullName}` : `Reactivate User: ${u.fullName}`,
      message: isSuspending
        ? `Are you certain you wish to suspend ${u.email}? The user will be blocked from logging into the platform until restored.`
        : `Reactivate clearance for ${u.email}?`,
      confirmLabel: isSuspending ? 'Suspend Account' : 'Reactivate',
      isDestructive: isSuspending,
      onConfirm: async () => {
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.patch(`/api/admin/users/${u.id}/status`, {
            active: !isSuspending,
            reason: !isSuspending ? 'Administrative reactivation' : 'Administrative hold',
          }).catch(() => {});
        } catch {}

        try {
          const saved = JSON.parse(localStorage.getItem('vestige_admin_users') || '[]');
          const source = saved.length > 0 ? saved : INITIAL_ADMIN_USERS;
          const updated = source.map((item) =>
            item.id === u.id ? { ...item, active: !isSuspending } : item
          );
          localStorage.setItem('vestige_admin_users', JSON.stringify(updated));
        } catch {}

        setNotice(`User account ${u.fullName} is now ${!isSuspending ? 'ACTIVE' : 'SUSPENDED'}.`);
        loadUsers();
      },
    });
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    const matchesSearch =
      !searchQuery.trim() ||
      (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <PageShell>
      <Container size="lg">
        <div style={{ margin: '2rem 0 1rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--vestige-brass-dark)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
            ✦ User & Identity Governance
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', color: 'var(--vestige-espresso)', margin: '0.25rem 0 0' }}>
            Registered Users Directory
          </h1>
        </div>

        <AdminNav />

        {notice && (
          <div style={{ padding: '0.75rem 1rem', background: 'var(--vestige-parchment-light)', border: '1px solid var(--vestige-brass)', borderRadius: 'var(--radius-xs)', marginBottom: '1.5rem', color: 'var(--vestige-espresso)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{notice}</p>
            <button onClick={() => setNotice('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vestige-ink-light)' }}>✕</button>
          </div>
        )}

        <LedgerCard
          variant="admin"
          watermark="building"
          watermarkSize={120}
          watermarkOpacity={0.06}
          title={`Platform Registry (${filteredUsers.length} profiles displayed)`}
          subtitle="Manage patron and partner clearance levels and active operational status"
        >
          {/* Search and Role Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '360px' }}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2rem',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-body)',
                  backgroundColor: 'var(--vestige-parchment-light)',
                  border: '1px solid var(--vestige-parchment-border)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--vestige-ink)',
                }}
              />
              <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--vestige-ink-light)', fontSize: '0.85rem' }}>
                🔍
              </span>
            </div>

            {/* Role Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['ALL', 'USER', 'VENDOR', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRole(r)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-serif)',
                    letterSpacing: '0.5px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--vestige-parchment-border)',
                    background: filterRole === r ? 'var(--vestige-espresso)' : 'var(--vestige-parchment-light)',
                    color: filterRole === r ? 'var(--vestige-ivory-warm)' : 'var(--vestige-ink)',
                    cursor: 'pointer',
                    fontWeight: filterRole === r ? 'bold' : 'normal',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <ArchivalSkeleton variant="table" rows={6} />
          ) : filteredUsers.length === 0 ? (
            <ArchivalEmptyState
              illustration="books"
              title="No Users Match Query"
              description="No user registry profiles found matching the current search parameters and clearance filter."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--vestige-brass-dark)', textAlign: 'left', color: 'var(--vestige-espresso)', fontFamily: 'var(--font-serif)' }}>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Name</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Email</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Role</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>Registered</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--vestige-parchment-border)' }}>
                      <td style={{ padding: '0.75rem 0.6rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: 'var(--vestige-espresso)' }}>{u.fullName}</td>
                      <td style={{ padding: '0.75rem 0.6rem', color: 'var(--vestige-ink-light)' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem 0.6rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'var(--vestige-parchment-light)', border: '1px solid var(--vestige-brass)', borderRadius: 'var(--radius-xs)', fontFamily: 'var(--font-mono)' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem' }}>
                        <span style={{ color: u.active ? 'var(--vestige-moss)' : 'var(--vestige-rust)', fontWeight: 'bold', fontSize: '0.82rem' }}>
                          {u.active ? '● Active' : '○ Suspended'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem', color: 'var(--vestige-ink-light)', fontSize: '0.82rem' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem 0.6rem', textAlign: 'right' }}>
                        {u.role !== 'ADMIN' && (
                          <Button
                            variant={u.active ? 'ghost' : 'primary'}
                            size="sm"
                            onClick={() => promptToggleStatus(u)}
                            style={u.active ? { color: 'var(--vestige-rust)' } : {}}
                          >
                            {u.active ? 'Suspend' : 'Activate'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </LedgerCard>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModalConfig.isOpen}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmLabel={confirmModalConfig.confirmLabel}
          isDestructive={confirmModalConfig.isDestructive}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        />
      </Container>
    </PageShell>
  );
}

export default AdminUsersPage;
