// frontend/src/components/products/ProductComparison.tsx
'use client';

import { InvestmentProduct } from '@/types';
import { formatCurrency, formatPercentage } from '@/utils/format';
import React from 'react';

interface ProductComparisonProps {
  products: InvestmentProduct[];
  onRemove: (productId: string) => void;
  onClear: () => void;
}

export const ProductComparison: React.FC<ProductComparisonProps> = ({
  products,
  onRemove,
  onClear,
}) => {
  if (products.length === 0) {
    return null;
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-success-600 bg-success-50';
      case 'medium': return 'text-warning-600 bg-warning-50';
      case 'high': return 'text-danger-600 bg-danger-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const comparisonFields = [
    { key: 'yieldRate', label: 'Expected Yield', format: formatPercentage },
    { key: 'duration', label: 'Duration', format: (value: number) => `${value} months` },
    { key: 'minInvestment', label: 'Min Investment', format: formatCurrency },
    { key: 'maxInvestment', label: 'Max Investment', format: (value?: number) => value ? formatCurrency(value) : 'No limit' },
    { key: 'riskLevel', label: 'Risk Level', format: (value: string) => value.toUpperCase() },
    { key: 'availableUnits', label: 'Available Units', format: (value: number) => value.toLocaleString() },
  ] as const;

  // Helper function to safely format values
  const formatValue = (field: typeof comparisonFields[number], product: InvestmentProduct) => {
    const value = product[field.key as keyof InvestmentProduct];
    
    switch (field.key) {
      case 'yieldRate':
      case 'duration':
      case 'minInvestment':
      case 'availableUnits':
        return field.format(value as number);
      
      case 'maxInvestment':
        return field.format(value as number | undefined);
      
      case 'riskLevel':
        return field.format(value as string);
      
      default:
        return String(value);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Product Comparison ({products.length} products)
          </h3>
          <button
            onClick={onClear}
            className="text-sm text-danger-600 hover:text-danger-700 font-medium"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-4 font-medium text-gray-500">Feature</th>
              {products.map((product) => (
                <th key={product.id} className="text-left p-4 min-w-[200px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {product.type.replace('_', ' ')}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(product.id)}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                      aria-label="Remove product from comparison"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonFields.map((field) => (
              <tr key={field.key} className="border-b border-gray-100">
                <td className="p-4 font-medium text-gray-700 bg-gray-50">
                  {field.label}
                </td>
                {products.map((product) => (
                  <td key={`${product.id}-${field.key}`} className="p-4">
                    <span className={
                      field.key === 'riskLevel' 
                        ? `px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(product[field.key as keyof InvestmentProduct] as string)}`
                        : 'text-gray-900'
                    }>
                        {formatValue(field, product)}
                      {/* {field.format(
                        product[field.key as keyof InvestmentProduct] as number
                      )} */}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4 font-medium text-gray-700 bg-gray-50">
                Description
              </td>
              {products.map((product) => (
                <td key={`${product.id}-description`} className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {product.description}
                  </p>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-gray-50">
        <div className="flex space-x-3">
          {products.map((product) => (
            <a
              key={product.id}
              href={`/products/${product.id}`}
              className="flex-1 bg-primary-600 text-white text-center py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Invest in {product.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};