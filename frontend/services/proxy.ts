import api from './api';
import { Proxy } from '@/types';

export const proxyService = {
  list: async (): Promise<Proxy[]> => {
    const { data } = await api.get('/proxy/');
    return data.results ?? data;
  },

  create: async (payload: { host: string; port: number; username?: string; password?: string } | { proxy_string: string }): Promise<Proxy> => {
    const { data } = await api.post('/proxy/', payload);
    return data;
  },

  bulkCreate: async (proxies: string): Promise<{ created: number; errors: { raw: string; message: string }[] }> => {
    const { data } = await api.post('/proxy/bulk/', { proxies });
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/proxy/${id}/`);
  },
};
