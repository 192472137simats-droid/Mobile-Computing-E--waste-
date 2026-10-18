import React from 'react';
import styles from './VestigeLogo.module.css';

export function VestigeLogo({
  variant = 'horizontal',
  size = 'md',
  theme = 'dark',
  tagline = 'Give technology a second life',
  className = '',
  ...props
}) {
  return (
    <div
      className={`${styles.logo} ${styles[variant]} ${styles[size]} ${styles[theme]} ${className}`}
      {...props}
    >
      <span className={styles.mark} aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path
            d="M9 11L20 31L31 11"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 16C22 7 28 6 34 5C33 13 29 18 21 16Z"
            fill="currentColor"
          />
        </svg>
      </span>
      {variant !== 'icon-only' && (
        <span className={styles.words}>
          <span className={styles.wordmark}>
            vestige<span>.</span>
          </span>
          {tagline && <span className={styles.tagline}>{tagline}</span>}
        </span>
      )}
    </div>
  );
}
export default VestigeLogo;
