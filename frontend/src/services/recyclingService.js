import { api } from './api.js';

export const recyclingService = {
  createRecyclingRequest: (payload) => api.post('/recycling', payload),
  schedulePickup: (payload) => api.post('/recycling', payload),
  getMyRecyclingRequests: (userId) =>
    api.get(userId ? `/recycling/user/${userId}` : '/recycling/my'),
  getRecyclingRequest: (id) => api.get(`/recycling/${id}`),
  cancelRecyclingRequest: (id, notes = 'Cancelled by owner') =>
    api.patch(`/recycling/${id}/status`, { status: 'CANCELLED', notes }),
  updateStatus: (id, statusData) => api.patch(`/recycling/${id}/status`, statusData),
  getAllRequests: (status) =>
    api.get(status ? `/recycling?status=${encodeURIComponent(status)}` : '/recycling'),
};

export default recyclingService;
