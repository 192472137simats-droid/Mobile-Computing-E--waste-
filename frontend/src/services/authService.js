import api from './api';

const TOKEN_KEY = 'vestige_auth_token';
const USER_KEY = 'vestige_user_profile';

function storeSession(token, profile) {
  if (!token || !profile) {
    throw new Error('Authentication response did not contain a session.');
  }
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(profile));
  return { token, profile };
}

export const authService = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
  getCachedProfile: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  },
  setCachedProfile: (profile) => {
    if (profile) localStorage.setItem(USER_KEY, JSON.stringify(profile));
    else localStorage.removeItem(USER_KEY);
  },
  login: async (email, password, expectedRole = null) => {
    const response = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
      expectedRole,
    });
    return storeSession(response.data?.token, response.data?.profile);
  },
  signUpUser: async (email, password, registrationData) => {
    const response = await api.post('/auth/register/public/user', {
      fullName: registrationData.fullName,
      email: email.trim().toLowerCase(),
      password,
      phone: registrationData.phone,
      preferredLanguage: registrationData.preferredLanguage || 'en',
    });
    return storeSession(response.data?.token, response.data?.profile);
  },
  signUpVendor: async (email, password, vendorData) => {
    const response = await api.post('/auth/register/public/vendor', {
      ...vendorData,
      email: email.trim().toLowerCase(),
      password,
      preferredLanguage: vendorData.preferredLanguage || 'en',
      serviceTypes: vendorData.serviceTypes || [],
      deviceCategories: vendorData.deviceCategories || [],
    });
    return storeSession(response.data?.token, response.data?.profile);
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    if (!response.data) throw new Error('Unable to verify your session.');
    authService.setCachedProfile(response.data);
    return response.data;
  },
  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export default authService;
