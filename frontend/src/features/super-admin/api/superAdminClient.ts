import axios from 'axios';

// A dedicated axios instance for super admin routes.
// We keep this separate from the main tenant api client to ensure
// error handling and interceptors are isolated to this high-privilege context.
export const superAdminClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/system` : '/api/system',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add auth token
superAdminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global errors for super admin
superAdminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // We can add global error handling here (e.g. redirect to 404 or show toast)
    return Promise.reject(error);
  }
);
