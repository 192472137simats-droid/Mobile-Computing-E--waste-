import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth';
import Button from '../../common/Button/Button';
import IconWrapper from '../../common/IconWrapper/IconWrapper';
import styles from './Navbar.module.css';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return '/login/user';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'VENDOR') return '/vendor/dashboard';
    return '/user/dashboard';
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <div className={styles.logoBadge}>V</div>
          <div>
            <h1 className={styles.title}>VESTIGE</h1>
            <p className={styles.tagline}>Give Technology a Second Life</p>
          </div>
        </Link>

        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>
            Home
          </Link>
          <Link to="/portals" className={styles.navLink}>
            Portals
          </Link>
          <Link to="/user/assessment" className={styles.navLink}>
            Diagnostics
          </Link>

          <div className={styles.authGroup}>
            {isAuthenticated && user ? (
              <>
                <Link to={getDashboardPath()}>
                  <Button variant="primary" size="sm" icon={<IconWrapper name="user" size={14} />}>
                    Dashboard
                  </Button>
                </Link>
                <span className={styles.userBadge}>{user.role}</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login/user">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register/user">
                  <Button variant="ornate" size="sm">
                    Join VESTIGE
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
