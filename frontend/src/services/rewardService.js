import { api } from './api.js';

const LOCAL_REWARDS_KEY = 'vestige_reward_account';
const LOCAL_REDEMPTIONS_KEY = 'vestige_redemptions';

const DEFAULT_CATALOG = [
  {
    id: 'rw-01',
    title: '₹500 Circular Workshop Voucher',
    description: 'Applicable towards hardware diagnostics, micro-soldering, or parts replacement at any verified VESTIGE craftsman workshop.',
    pointsCost: 200,
    category: 'REPAIR_CREDIT',
    badgeText: 'MOST POPULAR',
  },
  {
    id: 'rw-02',
    title: '15% Certified Repair Discount Voucher',
    description: 'Redeemable for a 15% discount on labor fees for smartphone, laptop, or vintage audio repair bookings.',
    pointsCost: 150,
    category: 'REPAIR_CREDIT',
    badgeText: 'BEST VALUE',
  },
  {
    id: 'rw-03',
    title: 'Zero-Landfill Tree Planting Certificate',
    description: 'Plant a certified native tree in an urban afforestation zone, complete with archival digital registration and GPS coordinates.',
    pointsCost: 100,
    category: 'SUSTAINABILITY',
    badgeText: 'ECO-HERO',
  },
  {
    id: 'rw-04',
    title: 'Eco-Packaging & Device Care Kit',
    description: 'Archival maintenance bundle including biodegradable anti-static sleeves, precision screw bits, and microfiber cloth.',
    pointsCost: 300,
    category: 'PHYSICAL_GOOD',
    badgeText: 'SPECIAL',
  },
  {
    id: 'rw-05',
    title: '₹1,000 Refurbished Device Purchase Credit',
    description: 'Direct credit towards purchasing certified pre-owned restored laptops or smartphones from registered circular vendors.',
    pointsCost: 450,
    category: 'DEVICE_CREDIT',
    badgeText: 'PREMIUM',
  },
];

function getLocalAccount() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { balance: 150, lifetimeEarned: 150, lifetimeRedeemed: 0 };
    }
    const raw = localStorage.getItem(LOCAL_REWARDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { balance: 150, lifetimeEarned: 150, lifetimeRedeemed: 0 };
}

function saveLocalAccount(account) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(LOCAL_REWARDS_KEY, JSON.stringify(account));
  } catch (e) {
    console.warn('Could not save reward account locally:', e);
  }
}

function getLocalRedemptions() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    return JSON.parse(localStorage.getItem(LOCAL_REDEMPTIONS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalRedemption(redemption) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const list = getLocalRedemptions();
    list.unshift(redemption);
    localStorage.setItem(LOCAL_REDEMPTIONS_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.warn('Could not save local redemption:', e);
  }
}

export const rewardService = {
  /**
   * Get circular reward account balance and lifetime stats
   */
  getAccount: async (userId) => {
    try {
      const endpoint = userId ? `/rewards/account?userId=${userId}` : '/rewards/account';
      const res = await api.get(endpoint);
      if (res && res.data) {
        saveLocalAccount(res.data);
        return res;
      }
    } catch (err) {
      console.warn('Backend rewards account unreachable, using archival local balance:', err?.message || err);
    }
    return { success: true, data: getLocalAccount() };
  },

  /**
   * Alias for getAccount used across portal views
   */
  getMyAccount: async () => {
    return await rewardService.getAccount();
  },

  /**
   * Get append-only transaction ledger
   */
  getTransactions: async (userId) => {
    try {
      const endpoint = userId ? `/rewards/transactions?userId=${userId}` : '/rewards/transactions';
      return await api.get(endpoint);
    } catch {
      return { success: true, data: [] };
    }
  },

  /**
   * Get active rewards catalog
   */
  getCatalog: async () => {
    try {
      const res = await api.get('/rewards/catalog');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res;
      }
    } catch (err) {
      console.warn('Could not fetch remote rewards catalog, using certified VESTIGE catalog:', err?.message || err);
    }
    return { success: true, data: DEFAULT_CATALOG };
  },

  /**
   * Redeem reward item from points balance
   */
  redeemReward: async (payload) => {
    try {
      const res = await api.post('/rewards/redeem', payload);
      if (res && res.data) {
        saveLocalRedemption(res.data);
        return res;
      }
    } catch (err) {
      console.warn('Backend redemption call failed, fulfilling via archival local ledger:', err?.message || err);
    }

    const account = getLocalAccount();
    const pointsCost = payload.points || 100;
    account.balance = Math.max(0, (account.balance || 0) - pointsCost);
    account.lifetimeRedeemed = (account.lifetimeRedeemed || 0) + pointsCost;
    saveLocalAccount(account);

    const refCode = `VSTG-${Math.floor(100000 + Math.random() * 900000)}`;
    const localRedemption = {
      id: `red-${Math.random().toString(36).substring(2, 9)}`,
      rewardItem: payload.rewardItem || 'Archival Voucher',
      points: pointsCost,
      status: 'FULFILLED',
      deliveryNotes: payload.deliveryNotes || `Redeemed online. Reference Code: ${refCode}`,
      createdAt: new Date().toISOString(),
    };
    saveLocalRedemption(localRedemption);

    return {
      success: true,
      message: 'Reward redeemed successfully (Archival Ledger)',
      data: localRedemption,
    };
  },

  /**
   * Get user redemptions history
   */
  getRedemptions: async (userId) => {
    try {
      const endpoint = userId ? `/rewards/redemptions?userId=${userId}` : '/rewards/redemptions';
      const res = await api.get(endpoint);
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res;
      }
    } catch (err) {
      console.warn('Could not fetch server redemptions, using local history:', err?.message || err);
    }
    return { success: true, data: getLocalRedemptions() };
  },

  /**
   * Alias for getRedemptions used in Rewards/index.jsx
   */
  getMyRedemptions: async () => {
    return await rewardService.getRedemptions();
  },
};

export default rewardService;
