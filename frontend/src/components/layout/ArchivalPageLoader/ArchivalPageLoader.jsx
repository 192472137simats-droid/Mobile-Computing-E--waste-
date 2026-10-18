import React from 'react';
import VintageIllustration from '../../vintage/VintageIllustration/VintageIllustration';
import styles from './ArchivalPageLoader.module.css';

export function ArchivalPageLoader() {
  return (
    <div className={styles.loaderContainer} role="status" aria-label="Loading VESTIGE">
      <div className={styles.illustrationBox}>
        <VintageIllustration name="globe" size={54} opacity={0.55} color="var(--vestige-brass-dark)" />
      </div>
      <div className={styles.spinnerOrbit}>
        <div className={styles.spinnerTrack} />
        <div className={styles.spinnerHead} />
      </div>
      <p className={styles.loadingText}>Getting things ready...</p>
    </div>
  );
}

export default ArchivalPageLoader;
