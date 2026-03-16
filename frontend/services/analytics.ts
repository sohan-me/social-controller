import api from './api';
import { AnalyticsDashboard } from '@/types';

export const analyticsService = {
  dashboard: async (): Promise<AnalyticsDashboard> => {
    const { data } = await api.get('/analytics/dashboard/');
    return data;
  },
};
