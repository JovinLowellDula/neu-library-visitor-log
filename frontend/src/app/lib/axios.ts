import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      console.log('Axios interceptor - Token:', token ? 'Found' : 'Not found');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Axios interceptor - Added Authorization header');
      }
    }
    return config;
  },
  (error) => {
    console.error('Axios request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios response error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;