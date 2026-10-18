import React from 'react';
import { Link } from 'react-router-dom';
import Container from '../Container/Container';
import VestigeLogo from '../../common/VestigeLogo/VestigeLogo';
import { getSupportWhatsAppLink } from '../../../utils/whatsapp';
import styles from './Footer.module.css';

export function Footer() {
  const whatsappUrl = getSupportWhatsAppLink(
    'Hello VESTIGE Support, I have a question about my device.',
  );
  return (
    <footer className={styles.footer} id="contact">
      <Container size="lg">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link to="/" aria-label="VESTIGE Home">
              <VestigeLogo tagline="" />
            </Link>
            <p>
              Better choices for your electronics.
              <br />A little care for what comes next.
            </p>
          </div>
          <div className={styles.links}>
            <strong>Get involved</strong>
            <Link to="/user/assessment">Assess a device</Link>
            <Link to="/register/user">Create an account</Link>
            <Link to="/register/vendor">Become a partner</Link>
          </div>
          <div className={styles.links}>
            <strong>Your workspace</strong>
            <Link to="/login/user">User portal</Link>
            <Link to="/login/vendor">Vendor portal</Link>
            <Link to="/login/admin">Admin portal</Link>
          </div>
          <div className={styles.links}>
            <strong>Here to help</strong>
            <p>A question about your next step?</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.support}
            >
              Chat with us <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>
            © {new Date().getFullYear()} VESTIGE. All rights reserved.
          </span>
          <span>
            Repair. Reuse. Recycle. <span className={styles.dot}>●</span>
          </span>
        </div>
      </Container>
    </footer>
  );
}
export default Footer;
