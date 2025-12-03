// frontend/src/components/products/ProductCard.tsx
'use client';

import { InvestmentProduct } from '@/types';
import { formatCurrency, formatPercentage } from '@/utils/format';
import Link from 'next/link';
import React from 'react';

interface ProductCardProps {
  product: InvestmentProduct;
  onCompare?: (product: InvestmentProduct) => void;
  isComparing?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onCompare, 
  isComparing = false 
}) => {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-success-600 bg-success-50';
      case 'medium': return 'text-warning-600 bg-warning-50';
      case 'high': return 'text-danger-600 bg-danger-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stocks': return '📈';
      case 'bonds': return '📋';
      case 'mutual_funds': return '🏦';
      case 'etfs': return '📊';
      case 'real_estate': return '🏠';
      default: return '💼';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
              <span className="text-2xl">{getTypeIcon(product.type)}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {product.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(product.riskLevel)}`}>
                  {product.riskLevel.toUpperCase()} RISK
                </span>
                <span className="text-sm text-gray-500">
                  {getTypeLabel(product.type)}
                </span>
              </div>
            </div>
          </div>
          
          {onCompare && (
            <button
              onClick={() => onCompare(product)}
              className={`p-2 rounded-lg transition-colors ${
                isComparing 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Expected Yield</div>
            <div className="text-lg font-semibold text-success-600">
              {formatPercentage(product.yieldRate)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Duration</div>
            <div className="text-lg font-semibold text-gray-900">
              {product.duration} months
            </div>
          </div>
        </div>

        {/* Investment Range */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">Investment Range</div>
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(product.minInvestment)}
            {product.maxInvestment && ` - ${formatCurrency(product.maxInvestment)}`}
          </div>
        </div>

        {/* Availability */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>
            {product.availableUnits.toLocaleString()} of {product.totalUnits.toLocaleString()} units available
          </span>
          <div className={`w-2 h-2 rounded-full ${
            product.availableUnits > 0 ? 'bg-success-500' : 'bg-danger-500'
          }`} />
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((product.totalUnits - product.availableUnits) / product.totalUnits) * 100}%`
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Link
            href={`/products/${product.id}`}
            className="flex-1 bg-primary-600 text-white text-center py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            View Details
          </Link>
          <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium">
            Quick Invest
          </button>
        </div>
      </div>
    </div>
  );
};