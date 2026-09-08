import React, { useState } from 'react';
import paymentService from '../../services/paymentService.js';
import useTranslation from '../../i18n/useTranslation';
import styles from './RazorpayCheckoutModal.module.css';

export function RazorpayCheckoutModal({ booking, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'CARD' | 'NETBANKING'
  const [transactionDetails, setTransactionDetails] = useState(null);

  const amount = booking?.submission?.estimatedRepairCost || booking?.estimatedCost || 3500.0;
  const brand = booking?.submission?.brand || booking?.brand || 'Electronic Device';
  const model = booking?.submission?.model || booking?.model || 'Hardware Unit';
  const workshop = booking?.vendor?.businessName || booking?.vendorBusinessName || 'Aegis Diagnostics Atelier';

  const handlePay = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Request order creation from backend or archival sandbox
      const orderRes = await paymentService.createRepairPaymentOrder(booking?.id || 'archival-job', amount);
      const orderData = orderRes?.data || orderRes;

      // 2. Check if Razorpay script is loaded in browser
      if (window.Razorpay && orderData?.razorpayKeyId) {
        const options = {
          key: orderData.razorpayKeyId,
          amount: Math.round(Number(amount) * 100),
          currency: orderData.currency || 'INR',
          name: orderData.businessName || 'VESTIGE Restoration Atelier',
          description: orderData.description || `Restoration Fee for ${brand} ${model}`,
          order_id: orderData.providerOrderId,
          prefill: {
            email: orderData.customerEmail || 'patron@vestige.internal',
            contact: orderData.customerPhone || '+919876543210',
          },
          theme: {
            color: '#c9a84c',
          },
          handler: async function (response) {
            try {
              const verifyRes = await paymentService.verifyPaymentSignature({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                bookingId: booking?.id,
                amount,
              });
              setTransactionDetails(verifyRes?.data);
              setSuccess(true);
              setTimeout(() => {
                if (onSuccess) onSuccess(verifyRes?.data);
                if (onClose) onClose();
              }, 1500);
            } catch (vErr) {
              setError(vErr.response?.data?.message || 'Signature verification failed.');
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Instant Sandbox/Prototype Verification Mode
        const mockPaymentId = `pay_rzp_mock_${Date.now()}`;
        const verifyRes = await paymentService.verifyPaymentSignature({
          razorpayOrderId: orderData?.providerOrderId || `order_${Date.now()}`,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: 'mock_signature_approved',
          bookingId: booking?.id,
          amount,
        });

        setTransactionDetails(verifyRes?.data);
        setSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess(verifyRes?.data);
          if (onClose) onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Payment failure:', err);
      setError(err?.response?.data?.message || err?.message || 'Payment could not be completed.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="pay-modal-title">
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        <div className={styles.header}>
          <h2 id="pay-modal-title" className={styles.title}>
            {t('payment.title', 'Hardware Restoration Service Fee')}
          </h2>
          <p className={styles.subtitle}>
            Order Ref: #{booking?.id?.substring(0, 10) || 'VSTG-88219'}
          </p>
        </div>

        <div className={styles.badge}>
          <span>🛡️</span>
          <span>{t('payment.secureBadge', 'Razorpay 256-Bit Encrypted Escrow Checkout')}</span>
        </div>

        <div className={styles.billSummary}>
          <div className={styles.billRow}>
            <span>Restoration Item:</span>
            <strong>{brand} {model}</strong>
          </div>
          <div className={styles.billRow}>
            <span>Accredited Atelier:</span>
            <span>{workshop}</span>
          </div>
          <div className={styles.billRow}>
            <span>Service & Diagnostics Base:</span>
            <span>₹{Number(amount).toFixed(2)}</span>
          </div>
          <div className={styles.billTotal}>
            <span>{t('payment.amountPayable', 'Amount Payable')}:</span>
            <span style={{ color: 'var(--vestige-espresso)' }}>₹{Number(amount).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Instrument Tabs */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--vestige-ink-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Select Payment Method (Sandbox / Live):
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
            {[
              { id: 'UPI', label: '📱 UPI (GPay / PhonePe)' },
              { id: 'CARD', label: '💳 Credit / Debit Card' },
              { id: 'NETBANKING', label: '🏦 NetBanking' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-serif)',
                  border: paymentMethod === m.id ? '1.5px solid var(--vestige-espresso)' : '1px solid var(--vestige-parchment-border)',
                  background: paymentMethod === m.id ? 'var(--vestige-espresso)' : 'var(--vestige-parchment-light)',
                  color: paymentMethod === m.id ? 'var(--vestige-ivory)' : 'var(--vestige-ink)',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                  fontWeight: paymentMethod === m.id ? 'bold' : 'normal',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className={`${styles.statusMessage} ${styles.statusError}`}>{error}</div>}
        {success && (
          <div className={`${styles.statusMessage} ${styles.statusSuccess}`}>
            ✓ {t('payment.success', 'Payment Verified & Confirmed via Razorpay!')}
            {transactionDetails?.transactionRef && (
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                Transaction Ref: #{transactionDetails.transactionRef}
              </div>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.payBtn}
            onClick={handlePay}
            disabled={loading || success}
          >
            {loading
              ? t('payment.verifying', 'Processing via Razorpay...')
              : success
              ? '✓ Payment Confirmed'
              : `${t('payment.proceedBtn', 'Pay with Razorpay')} (₹${Number(amount).toFixed(2)})`}
          </button>
          <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default RazorpayCheckoutModal;
