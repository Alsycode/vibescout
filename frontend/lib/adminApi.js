// FILE: lib/adminApi.js
// PURPOSE: Configured axios instance for admin panel requests — same shape as
//          lib/api.js, but 401s redirect to /admin/login instead of /login,
//          since admin sessions use a separate cookie (vb_admin_session).

import axios from 'axios';

const adminApi = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url ?? '';
    const isAuthCheck = url.includes('/admin/auth/me');
    if (typeof window !== 'undefined' && error?.response?.status === 401 && !isAuthCheck) {
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default adminApi;
