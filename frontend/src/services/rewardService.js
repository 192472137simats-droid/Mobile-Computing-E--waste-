import { api } from './api.js';

export const rewardService = {
  getAccount: (userId) => api.get(userId ? `/rewards/account?userId=${userId}` : '/rewards/account'),
  getMyAccount: () => api.get('/rewards/account'),
  getTransactions: (userId) =>
    api.get(userId ? `/rewards/transactions?userId=${userId}` : '/rewards/transactions'),
  getCatalog: () => api.get('/rewards/catalog'),
  redeemReward: (payload) => api.post('/rewards/redeem', payload),
  getRedemptions: (userId) =>
    api.get(userId ? `/rewards/redemptions?userId=${userId}` : '/rewards/redemptions'),
  getMyRedemptions: () => api.get('/rewards/redemptions'),
};

export default rewardService;
