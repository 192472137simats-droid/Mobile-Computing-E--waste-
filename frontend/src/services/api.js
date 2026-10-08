/**
 * VESTIGE API Client Service Foundation
 * Handles REST requests to the Spring Boot backend with consistent error handling,
 * JWT token injection, and concurrent GET request deduplication.
 */

const DEFAULT_PROD_API = 'https://vestige-owfd.onrender.com/api';

function getBaseUrl() {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  let base = envUrl;
  
  // If in production and no absolute URL is provided (e.g. empty or default '/api'), use production Render backend
  if (!base || base === '/api') {
    base = import.meta.env.PROD ? DEFAULT_PROD_API : '/api';
  }

  // Auto-correct typo where environment variable was configured with /ap instead of /api
  if (base.endsWith('/ap')) {
    base = base.slice(0, -3) + '/api';
  }
  // Strip trailing slashes
  base = base.replace(/\/+$/, '');
  // If base does not end with /api and is an absolute URL, ensure /api is included
  if (base.startsWith('http') && !base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
}

const TOKEN_KEY = 'vestige_auth_token';

// In-flight GET request cache to prevent duplicate simultaneous network requests
const inFlightRequests = new Map();

export async function apiClient(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const cleanEndpoint = endpoint.replace(/^\/api\/?/, '/').replace(/^\/?/, '/');
  const { params, ...fetchOptions } = options;
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.append(key, String(value));
    });
  }
  const url = `${baseUrl}${cleanEndpoint}${query.size ? `${cleanEndpoint.includes('?') ? '&' : '?'}${query}` : ''}`;
  
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers || {}),
  };

  // 15-second request timeout to prevent hanging pending states
  const controller = new AbortController();
  const timeoutMs = fetchOptions.timeout || 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const config = {
    ...fetchOptions,
    headers,
    signal: fetchOptions.signal || controller.signal,
  };

  const method = (config.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const cacheKey = isGet ? `${url}_${token || ''}` : null;

  // If there is already an identical GET request in flight, reuse its promise
  if (isGet && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const executeRequest = async () => {
    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error((data && data.message) || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutError = new Error('Backend service connection timed out. Please try again.');
        timeoutError.status = 504;
        throw timeoutError;
      }
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    } finally {
      if (isGet) {
        inFlightRequests.delete(cacheKey);
      }
    }
  };

  if (isGet) {
    const promise = executeRequest();
    inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  return executeRequest();
}

export const api = {
  get: (endpoint, options = {}) => apiClient(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options = {}) => apiClient(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  patch: (endpoint, body, options = {}) => apiClient(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options = {}) => apiClient(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options = {}) => apiClient(endpoint, { method: 'DELETE', ...options }),
};

export default api;
