// FILE: lib/api.js
// PURPOSE: Configured axios instance — points to NEXT_PUBLIC_API_URL, sends cookies,
//          intercepts 401 responses and redirects to /login.

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url ?? '';
    const isPaymentRoute = url.includes('/payment/');
    if (typeof window !== 'undefined' && error?.response?.status === 401 && !isPaymentRoute) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
