import api from './api';
import { PhoneNumber, PhoneNumberWithSubmissions, PaginatedResponse } from '@/types';

export const numbersService = {
  list: async (): Promise<PaginatedResponse<PhoneNumber>> => {
    const { data } = await api.get('/numbers/');
    return data;
  },

  myNumbers: async (): Promise<PhoneNumberWithSubmissions[]> => {
    const { data } = await api.get('/numbers/my/');
    return data.results ?? data;
  },

  create: async (number: string): Promise<PhoneNumber> => {
    const { data } = await api.post('/numbers/', { number });
    return data;
  },

  assign: async (phoneNumberId: number, userId: number) => {
    const { data } = await api.post('/numbers/assign/', {
      phone_number_id: phoneNumberId,
      user_id: userId,
    });
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
