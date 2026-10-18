import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import ArchivalMetricPlate from '../../../components/vintage/ArchivalMetricPlate/ArchivalMetricPlate';
import IconWrapper from '../../../components/common/IconWrapper/IconWrapper';
import ArchivalSkeleton from '../../../components/vintage/ArchivalSkeleton/ArchivalSkeleton';
import rewardService from '../../../services/rewardService';
import recyclingService from '../../../services/recyclingService';
import { useAuth } from '../../../contexts/useAuth';
import styles from './Dashboard.module.css';

const actions = [
  {
    icon: 'tools',
    title: 'Assess a device',
    text: 'Understand whether repair or recycling is the right next step for your electronics.',
    path: '/user/assessment',
    action: 'Start assessment',
  },
  {
    icon: 'recycle',
    title: 'Arrange recycling',
    text: 'Choose a service partner and schedule a pickup for your old devices.',
    path: '/user/recycling',
    action: 'Schedule a pickup',
  },
  {
    icon: 'gift',
    title: 'Explore your rewards',
    text: 'See your points, browse the catalog, and redeem eligible rewards.',
    path: '/user/rewards',
    action: 'View rewards',
  },
  {
    icon: 'calendar',
    title: 'Track your bookings',
    text: 'Follow your repair and recycling requests as your vendor updates their progress.',
    path: '/user/bookings',
    action: 'View bookings',
  },
  {
    icon: 'globe',
    title: 'See your activity',
    text: 'Review completed services and category-based estimates of your environmental impact.',
    path: '/user/analytics',
    action: 'View insights',
  },
];
export function UserDashboard() {
  const { user } = useAuth();
  const [account, setAccount] = useState({ balance: 0, lifetimeEarned: 0 });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    async function fetchData() {
      try {
        const [accRes, recRes] = await Promise.all([
          rewardService.getAccount(),
          recyclingService.getMyRecyclingRequests(),
        ]);
        if (accRes?.data) setAccount(accRes.data);
        if (recRes?.data) setRequests(recRes.data);
      } catch (err) {
        setLoadError(err.message || 'Could not load your account.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  const activeRecycleCount = requests.filter(
    (request) =>
      !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(request.status),
  ).length;
  const firstName = user?.fullName?.split(' ')[0];
  return (
    <PageShell>
      <div className={styles.pageWrapper}>
        <Container size="lg">
          <div className={styles.welcome}>
            <div>
              <span className={styles.eyebrow}>YOUR WORKSPACE</span>
              <h1>Welcome back{firstName ? ', ' + firstName : ''}.</h1>
              <p>
                Good choices start here. What can we help your device do next?
              </p>
            </div>
            <Link to="/user/assessment" className={styles.primary}>
              Assess a device <IconWrapper name="arrow-right" size={18} />
            </Link>
          </div>
          {loadError && (
            <p role="alert" className={styles.error}>
              {loadError}
            </p>
          )}
          <div className={styles.platesGrid}>
            {loading ? (
              [1, 2, 3, 4].map((id) => (
                <ArchivalSkeleton key={id} variant="card" height="160px" />
              ))
            ) : (
              <>
                <ArchivalMetricPlate
                  title="Your reward points"
                  value={account.balance}
                  subtitle={'Lifetime earned: ' + (account.lifetimeEarned ?? 0)}
                  actionLabel="Explore rewards →"
                  actionTo="/user/rewards"
                />
                <ArchivalMetricPlate
                  title="Active recycling requests"
                  value={activeRecycleCount}
                  subtitle="Track your upcoming collections"
                  actionLabel="View recycling →"
                  actionTo="/user/recycling"
                />
                <ArchivalMetricPlate
                  compact
                  title="Device assessment"
                  value="Repair or recycle?"
                  subtitle="Find a next step for your electronics"
                  actionLabel="Assess a device →"
                  actionTo="/user/assessment"
                />
                <ArchivalMetricPlate
                  compact
                  title="Your service history"
                  value="Stay in the loop"
                  subtitle="Repair and recycling updates in one place"
                  actionLabel="View bookings →"
                  actionTo="/user/bookings"
                />
              </>
            )}
          </div>
          <div className={styles.sectionHead}>
            <h2>A little care. A new possibility.</h2>
            <p>Choose what you would like to do.</p>
          </div>
          <div className={styles.actionsGrid}>
            {actions.map((action) => (
              <article className={styles.actionCard} key={action.path}>
                <span className={styles.actionIcon}>
                  <IconWrapper name={action.icon} size={25} />
                </span>
                <h3>{action.title}</h3>
                <p>{action.text}</p>
                <Link to={action.path} className={styles.actionLink}>
                  {action.action}
                  <IconWrapper name="arrow-right" size={17} />
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </div>
    </PageShell>
  );
}
export default UserDashboard;
