import api from './api.js';

const read = async (endpoint, params) => (await api.get(endpoint, { params })).data;

export const analyticsService = {
  getAdminOverview: (params) => read('/analytics/admin/overview', params),
  getAdminDevices: (params) => read('/analytics/admin/devices', params),
  getAdminRepairs: (params) => read('/analytics/admin/repairs', params),
  getAdminRecycling: (params) => read('/analytics/admin/recycling', params),
  getAdminRewards: (params) => read('/analytics/admin/rewards', params),
  getAdminVendorWorkload: (params) => read('/analytics/admin/vendors', params),
  getAdminPerformance: (params) => read('/admin/performance', params),
  getVendorOverview: (params) => read('/analytics/vendor/overview', params),
  getUserOverview: (params) => read('/analytics/user/overview', params),
};

export default analyticsService;
