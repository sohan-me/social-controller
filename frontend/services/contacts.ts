import api from './api';
import { AdminContact } from '@/types';

export const contactsService = {
  list: async (): Promise<AdminContact[]> => {
    const { data } = await api.get('/contacts/');
    // Handle both paginated and non-paginated responses
    if (Array.isArray(data)) {
      return data;
    }
    return data.results || [];
  },
  create: async (contact: { phone?: string; email?: string; is_active?: boolean }): Promise<AdminContact> => {
    const { data } = await api.post('/contacts/', contact);
    return data;
  },
  update: async (id: number, contact: { phone?: string; email?: string; is_active?: boolean }): Promise<AdminContact> => {
    const { data } = await api.patch(`/contacts/${id}/`, contact);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/contacts/${id}/`);
  },
};

