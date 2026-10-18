import React from 'react';
import PaperTexture from '../../vintage/PaperTexture/PaperTexture';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import WhatsAppButton from '../../shared/WhatsAppButton/WhatsAppButton';
import styles from './PageShell.module.css';

export function PageShell({
  children,
  currentLanguage,
  onLanguageChange,
  className = '',
}) {
  return (
    <PaperTexture className={`${styles.shell} ${className}`}>
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={onLanguageChange}
      />
      <main className={styles.main} id="main-content">
        {children}
      </main>
      <Footer />
      <WhatsAppButton variant="floating" label="Need help?" />
    </PaperTexture>
  );
}

export default PageShell;
