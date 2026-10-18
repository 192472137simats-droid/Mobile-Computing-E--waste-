import React from 'react';
import { Link } from 'react-router-dom';
import VintageIllustration from '../VintageIllustration/VintageIllustration';
import styles from './ArchivalMetricPlate.module.css';

export function ArchivalMetricPlate({
  title,
  value,
  subtitle,
  illustration,
  compact = false,
  actionLabel,
  actionTo,
  onActionClick,
  badge,
  className = '',
}) {
  return (
    <div className={`${styles.plate} ${className}`}>
      {/* Top Header Eyebrow */}
      <div className={styles.topRow}>
        <span className={styles.plateTitle}>{title}</span>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>

      {/* Main Content Area: Value & Faded Engraved Illustration */}
      <div className={styles.middleRow}>
        <div className={styles.valueGroup}>
          <div
            className={`${styles.valueNumber} ${compact ? styles.compact : ''}`}
          >
            {value}
          </div>
          {subtitle && <div className={styles.subtitleText}>{subtitle}</div>}
        </div>

        {illustration && (
          <div className={styles.illustrationWrapper} aria-hidden="true">
            <VintageIllustration
              name={illustration}
              size={72}
              opacity={0.35}
              color="var(--vestige-ink, #2B1F16)"
            />
          </div>
        )}
      </div>

      {/* Footer Action Button */}
      {actionLabel && (actionTo || onActionClick) && (
        <div className={styles.footerRow}>
          {actionTo ? (
            <Link to={actionTo} className={styles.actionBtn}>
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onActionClick}
              className={styles.actionBtn}
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ArchivalMetricPlate;
