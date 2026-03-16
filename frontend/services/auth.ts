import api from './api';
import { AuthTokens } from '@/types';

export const authService = {
  login: async (username: string, password: string): Promise<AuthTokens> => {
    const { data } = await api.post('/auth/login/', { username, password });
    return data;
  },

  register: async (payload: {
    username: string;
    email: string;
    password: string;
    password2: string;
    role?: string;
  }) => {
    const { data } = await api.post('/auth/register/', payload);
    return data;
  },

  me: async () => {
    const { data } = await api.get('/users/me/');
    return data;
  },
};
