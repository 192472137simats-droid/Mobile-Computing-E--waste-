import React, { useState } from 'react';
import paymentService from '../../services/paymentService.js';
import useTranslation from '../../i18n/useTranslation';
import styles from './RazorpayCheckoutModal.module.css';

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Payment checkout could not be loaded. Please try again.'));
    document.head.appendChild(script);
  });
}

export function RazorpayCheckoutModal({ booking, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  const amount = booking?.submission?.estimatedRepairCost || booking?.estimatedCost || 500;
  const brand = booking?.submission?.brand || booking?.brand || 'Electronic Device';
  const model = booking?.submission?.model || booking?.model || 'Hardware Unit';
  const workshop = booking?.vendor?.businessName || booking?.vendorBusinessName || 'Aegis Diagnostics Atelier';

  const handlePay = async () => {
    try {
      setLoading(true);
      setError(null);

      await loadRazorpay();
      const orderRes = await paymentService.createRepairPaymentOrder(booking?.id);
      const orderData = orderRes?.data || orderRes;

      if (window.Razorpay && orderData?.razorpayKeyId && orderData?.providerOrderId) {
        const options = {
          key: orderData.razorpayKeyId,
          amount: Math.round(Number(orderData.amount) * 100),
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
              setLoading(false);
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
        throw new Error('Payment checkout is not available. Please try again later.');
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
