// frontend/src/components/products/ProductRecommendations.tsx
'use client';

import { InvestmentProduct } from '@/types';
import { formatCurrency, formatPercentage } from '@/utils/format';
import Link from 'next/link';
import React from 'react';

interface ProductRecommendationsProps {
  // recommendations: Array<InvestmentProduct & { recommendationScore: number; reason: string }>;
  recommendations: InvestmentProduct[];
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  recommendations,
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // const getScoreColor = (score: number) => {
  //   if (score >= 0.8) return 'text-success-600 bg-success-50';
  //   if (score >= 0.6) return 'text-warning-600 bg-warning-50';
  //   return 'text-gray-600 bg-gray-50';
  // };

  // const getScoreLabel = (score: number) => {
  //   if (score >= 0.8) return 'Highly Recommended';
  //   if (score >= 0.6) return 'Recommended';
  //   return 'Good Match';
  // };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-success-600 bg-success-50';
      case 'medium': return 'text-warning-600 bg-warning-50';
      case 'high': return 'text-danger-600 bg-danger-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          AI-Powered Recommendations
        </h3>
        <div className="text-sm text-gray-500">
          Personalized for your risk profile
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((product, index) => (
          <div
            key={product.id}
            className="flex items-start space-x-4 p-4 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
          >
            {/* Rank Badge */}
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{product.name}</h4>
                  <p className="text-sm text-gray-500 capitalize">
                    {product.type.replace('_', ' ')} • {product.riskLevel} Risk
                  </p>
                </div>
                {/* <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(product.recommendationScore)}`}>
                  {getScoreLabel(product.recommendationScore)}
                </div> */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(product.riskLevel)}`}>
                  {product.riskLevel.toUpperCase()} RISK
                </div>
              </div>

              {/* Recommendation Reason */}
              {/* <p className="text-sm text-gray-600 mb-3">
                {product.reason}
              </p> */}

              {/* Key Metrics */}
              <div className="flex items-center space-x-6 text-sm">
                <div>
                  <span className="text-gray-500">Yield: </span>
                  <span className="font-semibold text-success-600">
                    {formatPercentage(product.yieldRate)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Min. Investment: </span>
                  <span className="font-semibold">
                    {formatCurrency(product.minInvestment)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Duration: </span>
                  <span className="font-semibold">
                    {product.duration} months
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {product.description}
              </p>
            </div>

            {/* Action */}
            <Link
              href={`/products/${product.id}`}
              className="flex-shrink-0 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Invest
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <Link
          href="/products"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          View All Products →
        </Link>
      </div>
    </div>
  );
};