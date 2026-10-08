import { api } from './api.js';

export const vendorService = {
  getVendors: (serviceType) =>
    api.get(serviceType ? `/vendors?serviceType=${encodeURIComponent(serviceType)}` : '/vendors'),
  getVendorById: (id) => api.get(`/vendors/${id}`),
};

export default vendorService;
