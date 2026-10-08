import { api } from './api.js';

export const deviceService = {
  assessDevice: (payload) => api.post('/devices/assess', payload),
  getDeviceAssessment: (id) => api.get(`/devices/${id}`),
  getUserAssessments: (userId) => api.get(`/devices/user/${userId}`),
};

export default deviceService;
