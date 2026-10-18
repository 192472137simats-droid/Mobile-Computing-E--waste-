import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import VintageHeading from '../../../components/vintage/VintageHeading/VintageHeading';
import Button from '../../../components/common/Button/Button';
import Badge from '../../../components/ui/Badge/Badge';
import Divider from '../../../components/common/Divider/Divider';
import IconWrapper from '../../../components/common/IconWrapper/IconWrapper';
import VintageIllustration from '../../../components/vintage/VintageIllustration/VintageIllustration';
import ArchivalEmptyState from '../../../components/vintage/ArchivalEmptyState/ArchivalEmptyState';
import ArchivalSkeleton from '../../../components/vintage/ArchivalSkeleton/ArchivalSkeleton';
import ConfirmModal from '../../../components/common/ConfirmModal/ConfirmModal';
import rewardService from '../../../services/rewardService';
import styles from './Rewards.module.css';

export function Rewards() {
  const [account, setAccount] = useState({ balance: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 });
  const [catalog, setCatalog] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Confirmation Modal State
  const [pendingRedemptionItem, setPendingRedemptionItem] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accRes, catRes, redRes] = await Promise.all([
        rewardService.getMyAccount(),
        rewardService.getCatalog(),
        rewardService.getMyRedemptions(),
      ]);

      if (accRes && accRes.data) setAccount(accRes.data);
      if (catRes && catRes.data) setCatalog(catRes.data);
      if (redRes && redRes.data) setRedemptions(redRes.data);
    } catch (err) {
      console.error('Failed to load rewards data:', err);
      setErrorMsg('Failed to load rewards ledger. Please refresh to try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- this effect loads remote data.
    loadData();
  }, []);

  const handlePromptRedeem = (item) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (account.balance < item.pointsCost) {
      setErrorMsg(
        `Insufficient points balance. You have ${account.balance} pts, but this reward requires ${item.pointsCost} pts.`
      );
      return;
    }

    setPendingRedemptionItem(item);
  };

  const executeRedeem = async () => {
    if (!pendingRedemptionItem) return;
    const item = pendingRedemptionItem;
    setPendingRedemptionItem(null);

    try {
      setRedeemingId(item.id);
      const res = await rewardService.redeemReward({
        rewardItem: item.title,
        points: item.pointsCost,
        deliveryNotes: `Redeemed online via VESTIGE Circular Ledger. Reference Code: VSTG-${Math.floor(100000 + Math.random() * 900000)}`,
      });

      if (res && res.data) {
        setSuccessMsg(
          `🎉 Successfully redeemed "${item.title}" for ${item.pointsCost} points! Voucher code registered in your archive.`
        );
        loadData();
      }
    } catch (err) {
      console.error('Redemption error:', err);
      setErrorMsg(err.message || 'Failed to complete redemption.');
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <PageShell>
      <div className={styles.pageWrapper}>
        <Container size="lg">
          <div className={styles.backBar}>
            <Link to="/user/dashboard" className={styles.backLink}>
              <IconWrapper name="arrow-left" size={16} />
              <span>Back to User Dashboard</span>
            </Link>
          </div>

          <VintageHeading
            level={1}
            eyebrow="Circular Sustainability Ledger"
            subtitle="Accrue verifiable points through certified e-waste recycling and redeem them for craftsman restoration discounts, partner vouchers, and tree restoration."
          >
            Circular Rewards & Sustainability Ledger
          </VintageHeading>

          {successMsg && (
            <div className={`${styles.alertBox} ${styles.alertSuccess}`} role="status">
              <IconWrapper name="check" size={20} color="var(--vestige-moss)" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className={`${styles.alertBox} ${styles.alertError}`} role="alert">
              <IconWrapper name="alert-triangle" size={20} color="var(--vestige-rust)" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '2rem 0' }}>
              <ArchivalSkeleton variant="card" height="140px" />
              <ArchivalSkeleton variant="table" rows={4} />
            </div>
          ) : (
            <>
              {/* Balance Hero Card */}
              <div className={styles.balanceCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div className={styles.balanceGrid} style={{ flex: 1 }}>
                    <div className={styles.metricBlock}>
                      <div className={styles.metricLabel}>Available Balance</div>
                      <div className={styles.metricValue} style={{ color: 'var(--vestige-brass-dark)' }}>
                        {account.balance} <span style={{ fontSize: 'var(--font-size-lg)' }}>PTS</span>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--vestige-ink-light)', marginTop: '4px' }}>
                        Ready for immediate redemption
                      </div>
                    </div>

                    <div className={styles.metricBlock}>
                      <div className={styles.metricLabel}>Lifetime Earned</div>
                      <div className={styles.metricValue} style={{ color: 'var(--vestige-moss)' }}>
                        +{account.lifetimeEarned} <span style={{ fontSize: 'var(--font-size-lg)' }}>PTS</span>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--vestige-ink-light)', marginTop: '4px' }}>
                        Via verified e-waste collections
                      </div>
                    </div>

                    <div className={styles.metricBlock}>
                      <div className={styles.metricLabel}>Lifetime Redeemed</div>
                      <div className={styles.metricValue} style={{ color: 'var(--vestige-espresso)' }}>
                        {account.lifetimeRedeemed} <span style={{ fontSize: 'var(--font-size-lg)' }}>PTS</span>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--vestige-ink-light)', marginTop: '4px' }}>
                        In workshop discounts & trees
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }} aria-hidden="true">
                    <VintageIllustration name="scales" size={90} opacity={0.65} color="var(--vestige-brass-dark)" />
                  </div>
                </div>
              </div>

              {/* Active Rewards Catalog */}
              <VintageHeading
                level={2}
                eyebrow="Circular Marketplace"
                subtitle="Select an authorized redemption voucher or eco-restoration initiative."
              >
                Redeemable Archival Rewards
              </VintageHeading>

              <div className={styles.catalogGrid}>
                {catalog.map((item) => {
                  const canAfford = account.balance >= item.pointsCost;
                  return (
                    <div key={item.id} className={styles.catalogCard}>
                      <div>
                        <div className={styles.cardHeader}>
                          <Badge variant="gold">{item.badgeText || item.category}</Badge>
                          <div className={styles.cardCost}>{item.pointsCost} PTS</div>
                        </div>
                        <h3 className={styles.cardTitle}>{item.title}</h3>
                        <p className={styles.cardDesc}>{item.description}</p>
                      </div>

                      <div>
                        <Button
                          variant={canAfford ? 'ornate' : 'subtle'}
                          size="md"
                          disabled={!canAfford || redeemingId === item.id}
                          loading={redeemingId === item.id}
                          onClick={() => handlePromptRedeem(item)}
                          style={{ width: '100%' }}
                          icon={<IconWrapper name="check" size={16} />}
                        >
                          {canAfford ? `Redeem for ${item.pointsCost} pts` : `Need ${item.pointsCost - account.balance} more pts`}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Divider flourish="❖" variant="gold" />

              {/* User Redemptions History */}
              <div style={{ marginBottom: 'var(--space-10)' }}>
                <VintageHeading
                  level={2}
                  eyebrow="Issued Certificates"
                  subtitle="Active electronic vouchers and sustainability registrations."
                >
                  My Redeemed Vouchers & Certificates
                </VintageHeading>

                {redemptions.length === 0 ? (
                  <ArchivalEmptyState
                    illustration="books"
                    title="No Certificates Redeemed Yet"
                    description="Your accrued sustainability points can be redeemed for workshop discounts and environmental restoration initiatives above."
                  />
                ) : (
                  <div className={styles.tableWrapper}>
                    <table className={styles.ledgerTable}>
                      <thead>
                        <tr>
                          <th>Date Issued</th>
                          <th>Reward Item</th>
                          <th>Points Used</th>
                          <th>Status</th>
                          <th>Fulfillment Code / Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {redemptions.map((r) => (
                          <tr key={r.id}>
                            <td>{r.createdAt ? r.createdAt.substring(0, 10) : 'Recent'}</td>
                            <td>
                              <strong>{r.rewardItem}</strong>
                            </td>
                            <td>
                              <span style={{ color: 'var(--vestige-brass-dark)', fontWeight: 'bold' }}>
                                -{r.points} PTS
                              </span>
                            </td>
                            <td>
                              <Badge variant="olive">{r.status}</Badge>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)' }}>
                              {r.deliveryNotes || 'Standard Certificate Issued'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </Container>
      </div>

      {/* Confirmation Modal Before Spending Points */}
      <ConfirmModal
        isOpen={!!pendingRedemptionItem}
        title="Confirm Reward Redemption"
        message={`Are you sure you wish to redeem "${pendingRedemptionItem?.title}" for ${pendingRedemptionItem?.pointsCost} PTS? This will deduct the points from your active balance.`}
        confirmLabel={`Redeem (${pendingRedemptionItem?.pointsCost} PTS)`}
        isDestructive={false}
        onConfirm={executeRedeem}
        onCancel={() => setPendingRedemptionItem(null)}
      />
    </PageShell>
  );
}

export default Rewards;
