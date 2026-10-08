import React from 'react';
import Container from '../Container/Container';
import VestigeLogo from '../../common/VestigeLogo/VestigeLogo';
import { SUPPORT_PHONE } from '../../../config/support';
import { getSupportWhatsAppLink } from '../../../utils/whatsapp';
import styles from './Footer.module.css';

export function Footer() {
  const whatsappUrl = getSupportWhatsAppLink('Hello VESTIGE Support, I have an inquiry regarding my device.');

  return (
    <footer className={styles.footer} id="contact" role="contentinfo">
      <Container size="lg">
        {/* Brand & Philosophy Header */}
        <div className={styles.brandRow}>
          <VestigeLogo
            variant="vertical"
            size="lg"
            theme="dark"
            tagline="Circular Luxury, Timeless Impact"
          />

          <div className={styles.quoteBlock}>
            <p className={styles.quote}>
              &ldquo;We don&apos;t just repair devices, we restore stories.&rdquo;
            </p>
            <div className={styles.philosophy}>
              <span>REPAIR</span>
              <span className={styles.dot}>✦</span>
              <span>REUSE</span>
              <span className={styles.dot}>✦</span>
              <span>RECYCLE</span>
              <span className={styles.dot}>✦</span>
              <span>REWARD</span>
            </div>
          </div>

          {/* Official WhatsApp Archival Support */}
          <div className={styles.supportBox}>
            <span className={styles.supportLabel}>Direct Archival Concierge</span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappButton}
              aria-label={`Contact VESTIGE Support on WhatsApp at ${SUPPORT_PHONE}`}
            >
              <span className={styles.whatsappIcon}>💬</span>
              <div className={styles.whatsappText}>
                <span className={styles.whatsappTitle}>WhatsApp Support</span>
                <span className={styles.whatsappNumber}>{SUPPORT_PHONE}</span>
              </div>
            </a>
          </div>
        </div>

        <div className={styles.dividerRule} />

        {/* Bottom Metadata */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} VESTIGE. Unified Circular Economy Platform. All archival records reserved.
          </p>
          <p className={styles.motto}>
            AUTHENTIC HERITAGE &bull; TIMELESS TECHNOLOGY &bull; CIRCULAR FUTURE
          </p>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
