import api from './api';
import { AccountSubmission, PaginatedResponse } from '@/types';

export const submissionsService = {
  list: async (params?: { status?: string; platform?: string }): Promise<PaginatedResponse<AccountSubmission>> => {
    const { data } = await api.get('/submissions/', { params });
    return data;
  },

  create: async (formData: FormData): Promise<AccountSubmission> => {
    const { data } = await api.post('/submissions/create/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  update: async (id: number, formData: FormData): Promise<AccountSubmission> => {
    const { data } = await api.patch(`/submissions/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/submissions/${id}/`);
  },

  approve: async (id: number): Promise<AccountSubmission> => {
    const { data } = await api.patch(`/submissions/${id}/approve/`);
    return data;
  },

  reject: async (id: number): Promise<AccountSubmission> => {
    const { data } = await api.patch(`/submissions/${id}/reject/`);
    return data;
  },
};
