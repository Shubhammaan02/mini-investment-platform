// frontend/src/app/products/[id]/page.tsx
'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { InvestmentForm } from '@/components/investments/InvestmentForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useProduct } from '@/hooks/useProducts';
import { formatCurrency, formatPercentage } from '@/utils/format';
import { useParams } from 'next/navigation';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { data: product, isLoading, error } = useProduct(productId);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !product) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-danger-600 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Product not found
              </h3>
              <p className="text-gray-500">
                The product you're looking for doesn't exist or is no longer available.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* Breadcrumb */}
          <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <a href="/products" className="text-gray-500 hover:text-gray-700">
                  Products
                </a>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{product.name}</span>
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center">
                      <span className="text-3xl">{getTypeIcon(product.type)}</span>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(product.riskLevel)}`}>
                          {product.riskLevel.toUpperCase()} RISK
                        </span>
                        <span className="text-gray-500 capitalize">
                          {product.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-lg leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Key Metrics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Metrics</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">
                      {formatPercentage(product.yieldRate)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Expected Yield</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {product.duration}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Months</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(product.minInvestment)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Min Investment</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {product.availableUnits.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Available Units</div>
                  </div>
                </div>
              </div>

              {/* Investment Details */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Investment Details</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Product Type</span>
                    <span className="font-medium capitalize">{product.type.replace('_', ' ')}</span>
                  </div>
                  
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Risk Level</span>
                    <span className={`font-medium px-2 py-1 rounded-full text-xs ${getRiskColor(product.riskLevel)}`}>
                      {product.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Minimum Investment</span>
                    <span className="font-medium">{formatCurrency(product.minInvestment)}</span>
                  </div>
                  
                  {product.maxInvestment && (
                    <div className="flex justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600">Maximum Investment</span>
                      <span className="font-medium">{formatCurrency(product.maxInvestment)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Total Units</span>
                    <span className="font-medium">{product.totalUnits.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between py-3">
                    <span className="text-gray-600">Available Units</span>
                    <span className="font-medium">{product.availableUnits.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Performance Projection */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Projection</h2>
                
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((year) => (
                    <div key={year} className="flex items-center justify-between py-2">
                      <span className="text-gray-600">After {year} year{year > 1 ? 's' : ''}</span>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(product.minInvestment * Math.pow(1 + product.yieldRate / 100, year))}
                        </div>
                        <div className="text-sm text-success-600">
                          +{formatPercentage((Math.pow(1 + product.yieldRate / 100, year) - 1) * 100)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Investment Sidebar */}
            <div className="lg:col-span-1">
              <InvestmentForm
                product={product}
                userBalance={user?.balance || 0}
                onSuccess={() => {
                  // Refresh data or show success message
                  window.location.reload();
                }}
              />

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fill Rate</span>
                    <span className="font-medium">
                      {(((product.totalUnits - product.availableUnits) / product.totalUnits) * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Popularity</span>
                    <span className="font-medium">
                      {product.availableUnits < product.totalUnits * 0.3 ? 'High' : 
                       product.availableUnits < product.totalUnits * 0.6 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time to Invest</span>
                    <span className="font-medium">~5 minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}