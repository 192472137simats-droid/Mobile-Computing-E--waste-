import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import VintageHeading from '../../../components/vintage/VintageHeading/VintageHeading';
import WaxSealBadge from '../../../components/vintage/WaxSealBadge/WaxSealBadge';
import ArchivalMetricPlate from '../../../components/vintage/ArchivalMetricPlate/ArchivalMetricPlate';
import VintageIllustration from '../../../components/vintage/VintageIllustration/VintageIllustration';
import Button from '../../../components/common/Button/Button';
import ArchivalSkeleton from '../../../components/vintage/ArchivalSkeleton/ArchivalSkeleton';
import rewardService from '../../../services/rewardService';
import recyclingService from '../../../services/recyclingService';
import { useTranslation } from '../../../i18n/useTranslation';
import styles from './Dashboard.module.css';

export function UserDashboard() {
  const { t } = useTranslation();
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
        if (accRes && accRes.data) setAccount(accRes.data);
        if (recRes && recRes.data) setRequests(recRes.data);
      } catch (err) {
        console.error('Failed to load user dashboard data:', err);
        setLoadError(err.message || 'Could not load your account.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeRecycleCount = requests.filter((r) =>
    !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status)
  ).length;

  return (
    <PageShell>
      <div className={styles.pageWrapper}>
        <Container size="lg">
          <VintageHeading
            level={1}
            eyebrow={t('portals.user.title', 'Device Owner & Patron Portal')}
            subtitle="Manage your registered electronics, evaluate repairability, schedule doorstep recycling, and monitor your circular rewards."
          >
            {t('nav.dashboard', 'Patron Archival Dashboard')}
          </VintageHeading>

          {loadError && <p role="alert">{loadError}</p>}

          {/* Archival Information Metric Plates Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <ArchivalSkeleton variant="card" height="150px" />
              <ArchivalSkeleton variant="card" height="150px" />
              <ArchivalSkeleton variant="card" height="150px" />
              <ArchivalSkeleton variant="card" height="150px" />
            </div>
          ) : (
            <div className={styles.platesGrid}>
              <ArchivalMetricPlate
                title="Reward Points Balance"
                value={`${account.balance} PTS`}
                subtitle={`Lifetime Earned: ${account.lifetimeEarned || account.balance} PTS`}
                illustration="scales"
                actionLabel="Access Rewards →"
                actionTo="/user/rewards"
                badge="VERIFIED"
              />

              <ArchivalMetricPlate
                title="Active Recycling Pickups"
                value={activeRecycleCount}
                subtitle="Zero-landfill custody dispatches"
                illustration="recycling"
                actionLabel="Schedule Pickup →"
                actionTo="/user/recycling"
                badge="ETHICAL"
              />

              <ArchivalMetricPlate
                title="Hardware Diagnostics"
                value="Ready"
                subtitle="Decision scoring engine active"
                illustration="laptop"
                actionLabel="Assess Device →"
                actionTo="/user/assessment"
                badge="HEURISTIC"
              />

              <ArchivalMetricPlate
                title="Archival Custody Ledger"
                value="Active"
                subtitle="Repair & restoration bookings"
                illustration="tools"
                actionLabel="View Workflows →"
                actionTo="/user/bookings"
                badge="RESTORATION"
              />
            </div>
          )}

          <VintageHeading
            level={2}
            eyebrow="Core Registry Services"
            subtitle="Select a primary workflow to continue your device's circular journey."
          >
            Platform Workflows & Actions
          </VintageHeading>

          {/* Action Modules */}
          <div className={styles.actionsGrid}>
            {/* 1. Assessment */}
            <div className={styles.actionCard}>
              <div>
                <div className={styles.cardHead}>
                  <WaxSealBadge
                    variant="gold"
                    size="sm"
                    icon={<VintageIllustration name="tools" size={18} opacity={0.9} color="var(--vestige-espresso)" />}
                    label="DIAGNOSE"
                  />
                  <h3>1. Device Diagnostics</h3>
                </div>
                <p className={styles.cardDesc}>
                  Input hardware fault symptoms, repair cost estimates, and asset values to receive
                  an immediate algorithmic Repair vs. Recycle score.
                </p>
              </div>
              <Link to="/user/assessment" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="md" style={{ width: '100%' }}>
                  Evaluate a Device
                </Button>
              </Link>
            </div>

            {/* 2. E-Waste Recycling */}
            <div className={styles.actionCard}>
              <div>
                <div className={styles.cardHead}>
                  <WaxSealBadge
                    variant="olive"
                    size="sm"
                    icon={<VintageIllustration name="recycling" size={18} opacity={0.9} color="var(--vestige-ivory)" />}
                    label="RECYCLE"
                  />
                  <h3>2. E-Waste Collection</h3>
                </div>
                <p className={styles.cardDesc}>
                  Book certified zero-landfill collection with authorized dismantlers and earn 50
                  verifiable circular reward points per device.
                </p>
              </div>
              <Link to="/user/recycling" style={{ textDecoration: 'none' }}>
                <Button variant="ornate" size="md" style={{ width: '100%' }}>
                  Schedule Doorstep Pickup
                </Button>
              </Link>
            </div>

            {/* 3. Rewards */}
            <div className={styles.actionCard}>
              <div>
                <div className={styles.cardHead}>
                  <WaxSealBadge
                    variant="espresso"
                    size="sm"
                    icon={<VintageIllustration name="scales" size={18} opacity={0.9} color="var(--vestige-brass)" />}
                    label="REWARD"
                  />
                  <h3>3. Circular Rewards</h3>
                </div>
                <p className={styles.cardDesc}>
                  Browse the rewards catalog, redeem vouchers for workshop discounts, and track your
                  tamper-evident transaction ledger.
                </p>
              </div>
              <Link to="/user/rewards" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="md" style={{ width: '100%' }}>
                  Access Rewards Ledger
                </Button>
              </Link>
            </div>

            {/* 4. Active Bookings */}
            <div className={styles.actionCard}>
              <div>
                <div className={styles.cardHead}>
                  <WaxSealBadge
                    variant="gold"
                    size="sm"
                    icon={<VintageIllustration name="books" size={18} opacity={0.9} color="var(--vestige-espresso)" />}
                    label="BOOKINGS"
                  />
                  <h3>4. My Workflows</h3>
                </div>
                <p className={styles.cardDesc}>
                  Track the real-time custody timeline of active repair bookings and scheduled doorstep
                  e-waste collection parcels.
                </p>
              </div>
              <Link to="/user/bookings" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="md" style={{ width: '100%' }}>
                  View All Bookings
                </Button>
              </Link>
            </div>

            {/* 5. Sustainability Analytics */}
            <div className={styles.actionCard}>
              <div>
                <div className={styles.cardHead}>
                  <WaxSealBadge
                    variant="olive"
                    size="sm"
                    icon={<VintageIllustration name="globe" size={18} opacity={0.9} color="var(--vestige-ivory)" />}
                    label="IMPACT"
                  />
                  <h3>5. Environmental Impact</h3>
                </div>
                <p className={styles.cardDesc}>
                  Inspect your personal circular economy scorecard, landfill diversion totals, and
                  sustainability milestones.
                </p>
              </div>
              <Link to="/user/analytics" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="md" style={{ width: '100%' }}>
                  View My Scorecard
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </PageShell>
  );
}

export default UserDashboard;
