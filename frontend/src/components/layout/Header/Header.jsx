import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import VestigeLogo from '../../common/VestigeLogo/VestigeLogo';
import Container from '../Container/Container';
import { useAuth } from '../../../contexts/useAuth';
import useTranslation from '../../../i18n/useTranslation';
import SUPPORTED_LANGUAGES from '../../../i18n/languages';
import styles from './Header.module.css';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const dashboardPath =
    user?.role === 'ADMIN'
      ? '/admin/dashboard'
      : user?.role === 'VENDOR'
        ? '/vendor/dashboard'
        : '/user/dashboard';
  const handleSignOut = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };
  const handleNav = (event, id) => {
    event.preventDefault();
    setMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(id === 'home' ? '/' : '/#' + id);
      return;
    }
    navigate(id === 'home' ? '/' : '/#' + id);
    if (id === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
    else
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <header
      className={styles.header}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setMenuOpen(false);
          document.getElementById('navigation-toggle')?.focus();
        }
      }}
    >
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>
      <Container size="lg" className={styles.container}>
        <Link
          to="/"
          onClick={(event) => handleNav(event, 'home')}
          className={styles.brandLink}
          aria-label="VESTIGE Home"
        >
          <VestigeLogo
            variant="horizontal"
            size="md"
            theme="light"
            tagline=""
          />
        </Link>
        <nav
          id="main-navigation"
          className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}
          aria-label="Main navigation"
        >
          {[
            ['home', 'nav.home', 'Home'],
            ['how-it-works', 'nav.howItWorks', 'How it works'],
            ['services', 'nav.services', 'Services'],
            ['about', 'nav.about', 'About us'],
          ].map(([id, key, label]) => (
            <a
              key={id}
              href={id === 'home' ? '/' : '/#' + id}
              onClick={(event) => handleNav(event, id)}
              className={`${styles.navLink} ${(id === 'home' ? location.pathname === '/' && !location.hash : location.hash === '#' + id) ? styles.navLinkActive : ''}`}
            >
              {t(key, label)}
            </a>
          ))}
          <select
            aria-label="Select language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className={styles.langSelect}
          >
            {SUPPORTED_LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.native} ({item.code.toUpperCase()})
              </option>
            ))}
          </select>
        </nav>
        <div className={styles.controls}>
          {isAuthenticated && user ? (
            <>
              <Link
                to={dashboardPath}
                onClick={() => setMenuOpen(false)}
                className={styles.btnSolid}
              >
                Dashboard
              </Link>
              <button onClick={handleSignOut} className={styles.btnOutline}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login/user"
                onClick={() => setMenuOpen(false)}
                className={styles.btnOutline}
              >
                Log in
              </Link>
              <Link
                to="/portals"
                onClick={() => setMenuOpen(false)}
                className={styles.btnSolid}
              >
                Get started <span aria-hidden="true">↗</span>
              </Link>
            </>
          )}
          <button
            id="navigation-toggle"
            className={styles.menuToggle}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-controls="main-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </Container>
    </header>
  );
}
export default Header;
