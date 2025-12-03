// frontend/src/hooks/usePortfolio.ts
import { investmentsAPI } from '@/services/api';
import { Portfolio } from '@/types';
import { useQuery } from '@tanstack/react-query';

export const usePortfolio = () => {
  return useQuery<Portfolio>({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await investmentsAPI.getPortfolio();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePerformance = (period: string = '6m') => {
  return useQuery({
    queryKey: ['performance', period],
    queryFn: async () => {
      const response = await investmentsAPI.getPerformance({ period });
      return response.data;
    },
  });
};