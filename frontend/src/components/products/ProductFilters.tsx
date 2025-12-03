// frontend/src/components/products/ProductFilters.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';

interface FilterFormData {
  type: string;
  riskLevel: string;
  minYield?: number;
  maxYield?: number;
  minInvestment?: number;
  sortBy: string;
  order: string;
}

interface ProductFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({ onFiltersChange }) => {
  const { register, watch } = useForm<FilterFormData>({
    defaultValues: {
      type: '',
      riskLevel: '',
      minYield: undefined,
      maxYield: undefined,
      minInvestment: undefined,
      sortBy: 'createdAt',
      order: 'DESC',
    },
  });

  // Watch all form fields and trigger filter changes
  React.useEffect(() => {
    const subscription = watch((value) => {
      const filters: any = {};

      Object.entries(value).forEach(([key, val]) => {
        if (val !== '' && val !== undefined && val !== null) {
          filters[key] = val;
        }
      });
      
      onFiltersChange(filters);
    });

    return () => subscription.unsubscribe();
  }, [watch, onFiltersChange]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
      
      <div className="space-y-4">
        {/* Product Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Type
          </label>
          <select
            {...register('type')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            <option value="stocks">Stocks</option>
            <option value="bonds">Bonds</option>
            <option value="mutual_funds">Mutual Funds</option>
            <option value="etfs">ETFs</option>
            <option value="real_estate">Real Estate</option>
          </select>
        </div>

        {/* Risk Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Level
          </label>
          <select
            {...register('riskLevel')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>

        {/* Yield Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yield Rate (%)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Min"
              min="0"
              max="100"
              {...register('minYield', { valueAsNumber: true })}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <input
              type="number"
              placeholder="Max"
              min="0"
              max="100"
              {...register('maxYield', { valueAsNumber: true })}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Minimum Investment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Min. Investment
          </label>
          <input
            type="number"
            placeholder="e.g., 5000"
            min="0"
            {...register('minInvestment', { valueAsNumber: true })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="grid grid-cols-2 gap-3">
            <select
              {...register('sortBy')}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              <option value="createdAt">Date Added</option>
              <option value="yieldRate">Yield Rate</option>
              <option value="minInvestment">Min Investment</option>
              <option value="riskLevel">Risk Level</option>
            </select>
            <select
              {...register('order')}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};