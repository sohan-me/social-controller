import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const tokens = localStorage.getItem('auth_tokens');
    if (tokens) {
      const { access } = JSON.parse(tokens);
      config.headers.Authorization = `Bearer ${access}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const tokens = localStorage.getItem('auth_tokens');
        if (!tokens) throw new Error('No tokens');
        const { refresh } = JSON.parse(tokens);
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/refresh/`,
          { refresh }
        );
        const stored = JSON.parse(localStorage.getItem('auth_tokens') || '{}');
        stored.access = data.access;
        localStorage.setItem('auth_tokens', JSON.stringify(stored));
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem('auth_tokens');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
