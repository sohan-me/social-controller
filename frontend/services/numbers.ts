import api from './api';
import { PhoneNumber, PhoneNumberWithSubmissions, PhoneNumberListEntry, PaginatedResponse } from '@/types';

export const numbersService = {
  list: async (): Promise<PaginatedResponse<PhoneNumber>> => {
    const { data } = await api.get('/numbers/');
    return data;
  },

  /** All numbers with url and approved submissions (for users to pick one). */
  getNumberList: async (): Promise<PhoneNumberListEntry[]> => {
    const { data } = await api.get('/numbers/list/');
    return data.results ?? data;
  },

  myNumbers: async (): Promise<PhoneNumberWithSubmissions[]> => {
    const { data } = await api.get('/numbers/my/');
    return data.results ?? data;
  },

  create: async (payload: { number: string; url?: string }): Promise<PhoneNumber> => {
    const { data } = await api.post('/numbers/', payload);
    return data;
  },

  update: async (id: number, payload: Partial<PhoneNumber>): Promise<PhoneNumber> => {
    const { data } = await api.patch(`/numbers/${id}/`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/numbers/${id}/`);
  },
};
