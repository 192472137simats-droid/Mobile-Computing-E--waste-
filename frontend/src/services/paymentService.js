import apiClient from './apiClient.js';

export const paymentService = {
  createRepairPaymentOrder: async (bookingId) => {
    return apiClient.post('/api/payments/create-order', { bookingId });
  },
  verifyPaymentSignature: async (payload) => {
    return apiClient.post('/api/payments/verify', payload);
  },
  getMyPaymentHistory: async () => {
    const response = await apiClient.get('/api/payments/my-history');
    return response.data;
  },
  getAdminPaymentMetrics: async () => {
    const response = await apiClient.get('/api/admin/payments');
    return response.data;
  },
};

export default paymentService;
