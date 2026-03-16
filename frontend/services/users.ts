import api from './api';
import { User, PaginatedResponse } from '@/types';

export const usersService = {
  list: async (): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get('/users/');
    return data;
  },

  create: async (payload: {
    username: string;
    email: string;
    password: string;
    password2: string;
    role: string;
  }): Promise<User> => {
    const { data } = await api.post('/users/', payload);
    return data;
  },

  update: async (id: number, payload: Partial<User>): Promise<User> => {
    const { data } = await api.patch(`/users/${id}/`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}/`);
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get('/users/me/');
    return data;
  },

  updateMe: async (formData: FormData): Promise<User> => {
    const { data } = await api.patch('/users/me/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
