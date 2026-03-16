import api from './api';
import { MyWalletResponse, PaymentTransaction } from '@/types';

export const walletService = {
  getMyWallet: async (): Promise<MyWalletResponse> => {
    const { data } = await api.get('/wallet/me/');
    return data;
  },

  creditUser: async (payload: {
    user_id: number;
    amount_BDT: string | number;
    note?: string;
  }): Promise<PaymentTransaction> => {
    const { data } = await api.post('/wallet/credit/', {
      user_id: payload.user_id,
      amount_BDT: String(payload.amount_BDT),
      note: payload.note ?? '',
    });
    return data;
  },

  listTransactions: async (params?: { user_id?: number }): Promise<PaymentTransaction[]> => {
    const { data } = await api.get('/wallet/transactions/', { params });
    return data.results ?? data;
  },

  updateTransaction: async (
    id: number,
    payload: { amount_BDT?: string | number; note?: string }
  ): Promise<PaymentTransaction> => {
    const { data } = await api.patch(`/wallet/transactions/${id}/`, {
      ...(payload.amount_BDT != null && { amount_BDT: String(payload.amount_BDT) }),
      ...(payload.note != null && { note: payload.note }),
    });
    return data;
  },

  deleteTransaction: async (id: number): Promise<void> => {
    await api.delete(`/wallet/transactions/${id}/`);
  },
};
