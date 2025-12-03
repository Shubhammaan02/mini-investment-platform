// frontend/src/app/products/page.tsx
'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductComparison } from '@/components/products/ProductComparison';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductRecommendations } from '@/components/products/ProductRecommendations';
import { useProducts, useRecommendations } from '@/hooks/useProducts';
import { InvestmentProduct } from '@/types';
import { useState } from 'react';

export default function ProductsPage() {
  const [filters, setFilters] = useState({});
  const [comparisonProducts, setComparisonProducts] = useState<InvestmentProduct[]>([]);
  const { data: productsData, isLoading, error } = useProducts(filters);
  const { data: recommendationsData } = useRecommendations();

  const handleCompare = (product: InvestmentProduct) => {
    setComparisonProducts(prev => {
      const isAlreadyComparing = prev.find(p => p.id === product.id);
      if (isAlreadyComparing) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product].slice(0, 3); // Limit to 3 products
      }
    });
  };

  const handleRemoveFromComparison = (productId: string) => {
    setComparisonProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleClearComparison = () => {
    setComparisonProducts([]);
  };

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

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-danger-600 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Failed to load products
              </h3>
              <p className="text-gray-500">
                Please try refreshing the page.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

//   const products = productsData?.products || [];
  const products: InvestmentProduct[] = productsData?.products || [];

//   const recommendations = recommendationsData?.recommendations || [];
  const recommendations: InvestmentProduct[] = recommendationsData?.recommendations || [];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Investment Products</h1>
            <p className="text-gray-600 mt-1">
              Discover and compare investment opportunities that match your goals.
            </p>
          </div>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <div className="mb-8">
              <ProductRecommendations recommendations={recommendations} />
            </div>
          )}

          {/* Product Comparison */}
          <ProductComparison
            products={comparisonProducts}
            onRemove={handleRemoveFromComparison}
            onClear={handleClearComparison}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <ProductFilters onFiltersChange={setFilters} />
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    All Products ({products.length})
                  </h2>
                  <p className="text-sm text-gray-600">
                    {comparisonProducts.length > 0 && 
                      `Select up to 3 products to compare. ${comparisonProducts.length}/3 selected.`
                    }
                  </p>
                </div>
              </div>

              {/* Products Grid */}
              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product: InvestmentProduct) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onCompare={handleCompare}
                      isComparing={comparisonProducts.some(p => p.id === product.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your filters to see more results.
                  </p>
                </div>
              )}

              {/* Pagination */}
              {productsData?.pagination && productsData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-8">
                  <div className="text-sm text-gray-700">
                    Showing page {productsData.pagination.currentPage} of{' '}
                    {productsData.pagination.totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      disabled={!productsData.pagination.hasPrev}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={!productsData.pagination.hasNext}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}