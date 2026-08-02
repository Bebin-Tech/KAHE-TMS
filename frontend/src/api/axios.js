import axios from 'axios';
import { clearRoleSession, getCurrentSession, getRouteRole, getStoredSession, updateRoleAccessToken } from '../utils/session';

const localHosts = ['localhost', '127.0.0.1'];
const defaultBaseURL =
  typeof window !== 'undefined' && localHosts.includes(window.location.hostname)
    ? 'http://127.0.0.1:8000/api/'
    : '/api/';
const baseURL = import.meta.env.VITE_API_BASE_URL || defaultBaseURL;

const isTokenRequest = (url = '') => /(^|\/)token\/?/.test(url) || url.includes('token/refresh/');

const api = axios.create({
  baseURL: baseURL,
});

api.interceptors.request.use((config) => {
  if (isTokenRequest(config.url)) {
    return config;
  }

  const routeRole = getRouteRole();
  const current = routeRole
    ? { role: routeRole, session: getStoredSession(routeRole) }
    : getCurrentSession();
  if (current?.session?.access) {
    config.headers.Authorization = `Bearer ${current.session.access}`;
    config._sessionRole = current.role;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || isTokenRequest(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const current = originalRequest._sessionRole
        ? { role: originalRequest._sessionRole, session: getStoredSession(originalRequest._sessionRole) }
        : getCurrentSession();
      const refreshToken = current?.session?.refresh;

      if (refreshToken) {
        try {
          const response = await axios.post(`${baseURL}token/refresh/`, {
            refresh: refreshToken,
          });

          if (response.status === 200) {
            const newAccessToken = response.data.access;
            updateRoleAccessToken(current.role, newAccessToken);

            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          console.error('Refresh token expired or invalid', refreshError);
          clearRoleSession(current.role);
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        if (current?.role) clearRoleSession(current.role);
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
