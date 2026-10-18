import React from 'react';
import LedgerCard from '../vintage/LedgerCard/LedgerCard';
import ArchivalMetricPlate from '../vintage/ArchivalMetricPlate/ArchivalMetricPlate';

export function KpiMetricCard({
  title,
  value,
  subtitle,
  badgeLabel,
  loading = false,
  error = null,
  onRetry,
}) {
  if (loading) {
    return (
      <LedgerCard variant="default">
        <div
          style={{
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--vestige-ink-light)',
          }}
        >
          <p>Loading your activity...</p>
        </div>
      </LedgerCard>
    );
  }

  if (error) {
    return (
      <LedgerCard variant="default">
        <div
          style={{
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--vestige-crimson)',
          }}
        >
          <p style={{ fontSize: '0.85rem' }}>Failed to load metric.</p>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                marginTop: '0.5rem',
                background: 'none',
                border: '1px solid var(--vestige-crimson)',
                color: 'var(--vestige-crimson)',
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Retry
            </button>
          )}
        </div>
      </LedgerCard>
    );
  }

  return (
    <ArchivalMetricPlate
      title={title}
      value={value ?? '—'}
      subtitle={subtitle}
      badge={badgeLabel}
    />
  );
}

export default KpiMetricCard;
