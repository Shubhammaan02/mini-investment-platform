// frontend/src/hooks/useProducts.ts
import { investmentsAPI, productsAPI } from '@/services/api';
import { InvestmentFormData } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';

export const useProducts = (filters?: any) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const response = await productsAPI.getProducts(filters);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await productsAPI.getProduct(id);
      return response.data.product;
    },
    enabled: !!id,
  });
};

export const useRecommendations = () => {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await productsAPI.getRecommendations();
      return response.data;
    },
  });
};

export const useInvest = () => {
  return useMutation({
    mutationFn: (data: InvestmentFormData) => investmentsAPI.createInvestment(data),
  });
};

export const useSimulateInvestment = () => {
  return useMutation({
    mutationFn: (data: InvestmentFormData) => investmentsAPI.simulateInvestment(data),
  });
};