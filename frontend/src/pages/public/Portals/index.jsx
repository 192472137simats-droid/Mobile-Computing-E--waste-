import React from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import IconWrapper from '../../../components/common/IconWrapper/IconWrapper';
import styles from './Portals.module.css';

const portals = [
  {
    role: 'user',
    icon: 'user',
    label: 'For device owners',
    title: 'Your next chapter starts here.',
    text: 'Assess a device, book a repair or recycling service, and keep track of your rewards.',
    features: [
      'Device assessments',
      'Service bookings & tracking',
      'Rewards & activity',
    ],
    action: 'User login',
    register: 'Create an account',
  },
  {
    role: 'vendor',
    icon: 'tools',
    label: 'For service partners',
    title: 'Do good work. Make an impact.',
    text: 'Manage assigned requests and keep your customers informed at every stage.',
    features: [
      'Repair & recycling requests',
      'Job status updates',
      'Business activity insights',
    ],
    action: 'Vendor login',
    register: 'Register your business',
  },
  {
    role: 'admin',
    icon: 'shield',
    label: 'For administrators',
    title: 'Keep the platform moving.',
    text: 'Oversee the people, services, and activity that connect the VESTIGE community.',
    features: [
      'User & vendor management',
      'Service & payment records',
      'Analytics & audit history',
    ],
    action: 'Admin login',
  },
];
export function PortalsPage() {
  return (
    <PageShell>
      <section className={styles.wrapper}>
        <Container size="lg">
          <div className={styles.heading}>
            <span>WELCOME TO VESTIGE</span>
            <h1>
              A place for everyone.
              <br />
              Choose your workspace.
            </h1>
            <p>
              Whether you own a device or help give it a second life, start
              here.
            </p>
          </div>
          <div className={styles.grid}>
            {portals.map((portal) => (
              <article
                className={`${styles.card} ${styles[portal.role]}`}
                key={portal.role}
              >
                <div className={styles.icon}>
                  <IconWrapper name={portal.icon} size={28} />
                </div>
                <span className={styles.label}>{portal.label}</span>
                <h2>{portal.title}</h2>
                <p>{portal.text}</p>
                <ul>
                  {portal.features.map((feature) => (
                    <li key={feature}>
                      <span aria-hidden="true">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to={'/login/' + portal.role} className={styles.login}>
                  {portal.action}
                  <IconWrapper name="arrow-right" size={18} />
                </Link>
                {portal.register ? (
                  <Link
                    to={'/register/' + portal.role}
                    className={styles.register}
                  >
                    {portal.register}
                  </Link>
                ) : (
                  <span className={styles.note}>
                    Access for authorized administrators
                  </span>
                )}
              </article>
            ))}
          </div>
          <p className={styles.help}>
            Already have an account? Choose your role above to sign in.
          </p>
        </Container>
      </section>
    </PageShell>
  );
}
export default PortalsPage;
