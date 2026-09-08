import api from './api.js';

function getLocalAnalytics() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        totalSubmissions: 0,
        repairRecommendations: 0,
        recycleRecommendations: 0,
        completedRepairs: 0,
        totalRepairsBooked: 0,
        totalDevicesRecycled: 0,
        completedRecycling: 0,
        currentPointsBalance: 150,
        lifetimePointsEarned: 150,
        lifetimePointsRedeemed: 0,
        personalActivityTimeline: [],
      };
    }
    const submissions = JSON.parse(localStorage.getItem('vestige_user_submissions') || '[]');
    const recycling = JSON.parse(localStorage.getItem('vestige_recycling_requests') || '[]');
    const account = JSON.parse(localStorage.getItem('vestige_reward_account') || '{"balance": 150, "lifetimeEarned": 150, "lifetimeRedeemed": 0}');

    const repairRecs = submissions.filter((s) => s.engineRecommendation === 'REPAIR').length;
    const recycleRecs = submissions.filter((s) => s.engineRecommendation === 'RECYCLE').length;
    const totalDivertedItems = recycling.reduce((acc, r) => acc + (parseInt(r.deviceCount, 10) || 1), 0);

    return {
      totalSubmissions: submissions.length,
      repairRecommendations: repairRecs,
      recycleRecommendations: recycleRecs,
      completedRepairs: 0,
      totalRepairsBooked: 0,
      totalDevicesRecycled: totalDivertedItems,
      completedRecycling: recycling.length,
      currentPointsBalance: account.balance || 0,
      lifetimePointsEarned: account.lifetimeEarned || 0,
      lifetimePointsRedeemed: account.lifetimeRedeemed || 0,
      personalActivityTimeline: [
        { label: 'Diagnostic Evaluations', value: submissions.length },
        { label: 'Dismantling Dispatches', value: recycling.length },
        { label: 'Circular Points', value: account.balance || 0 },
      ],
    };
  } catch {
    return {
      totalSubmissions: 0,
      repairRecommendations: 0,
      recycleRecommendations: 0,
      completedRepairs: 0,
      totalRepairsBooked: 0,
      totalDevicesRecycled: 0,
      completedRecycling: 0,
      currentPointsBalance: 150,
      lifetimePointsEarned: 150,
      lifetimePointsRedeemed: 0,
      personalActivityTimeline: [],
    };
  }
}

export const analyticsService = {
  getAdminOverview: (params) => api.get('/analytics/admin/overview', { params }).then((res) => res.data).catch(() => null),
  getAdminDevices: (params) => api.get('/analytics/admin/devices', { params }).then((res) => res.data).catch(() => null),
  getAdminRepairs: (params) => api.get('/analytics/admin/repairs', { params }).then((res) => res.data).catch(() => null),
  getAdminRecycling: (params) => api.get('/analytics/admin/recycling', { params }).then((res) => res.data).catch(() => null),
  getAdminRewards: (params) => api.get('/analytics/admin/rewards', { params }).then((res) => res.data).catch(() => null),
  getAdminVendorWorkload: (params) => api.get('/analytics/admin/vendors', { params }).then((res) => res.data).catch(() => null),
  getAdminPerformance: (params) => api.get('/admin/performance', { params }).then((res) => res.data).catch(() => null),
  getVendorOverview: (params) => api.get('/analytics/vendor/overview', { params }).then((res) => res.data).catch(() => null),
  getUserOverview: async (params) => {
    try {
      const res = await api.get('/analytics/user/overview', { params });
      if (res && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Could not fetch server analytics, using local ledger summary:', err?.message || err);
    }
    return getLocalAnalytics();
  },
};

export default analyticsService;
