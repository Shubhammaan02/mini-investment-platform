// frontend/src/app/(dashboard)/portfolio/page.tsx
'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { InvestmentList } from '@/components/dashboard/InvestmentList';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { PortfolioOverview } from '@/components/dashboard/PortfolioOverview';
import { RiskDistributionChart } from '@/components/dashboard/RiskDistributionChart';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePortfolio } from '@/hooks/usePortfolio';

// Mock detailed performance data
const mockDetailedPerformance = [
  { month: 'Jan', value: 10000, returns: 0 },
  { month: 'Feb', value: 10500, returns: 500 },
  { month: 'Mar', value: 11000, returns: 1000 },
  { month: 'Apr', value: 11500, returns: 1500 },
  { month: 'May', value: 12000, returns: 2000 },
  { month: 'Jun', value: 12500, returns: 2500 },
  { month: 'Jul', value: 13000, returns: 3000 },
  { month: 'Aug', value: 13500, returns: 3500 },
  { month: 'Sep', value: 14000, returns: 4000 },
  { month: 'Oct', value: 14500, returns: 4500 },
  { month: 'Nov', value: 15000, returns: 5000 },
  { month: 'Dec', value: 15500, returns: 5500 },
];

export default function PortfolioPage() {
  const { data: portfolio, isLoading, error } = usePortfolio();

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

  // Use mock data if no portfolio exists
  const displayPortfolio = portfolio || {
    investments: [],
    portfolioSummary: {
      totalInvestments: 0,
      totalInvested: 10000,
      totalCurrentValue: 10000,
      totalReturns: 0,
      overallReturnPercentage: 0,
      activeInvestments: 0,
      maturedInvestments: 0,
    },
    distributions: {
      byType: {},
      byRisk: { low: 0, medium: 0, high: 0 },
    },
  };

  const riskDistributionData = Object.entries(displayPortfolio.distributions.byRisk)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Portfolio</h1>
            <p className="text-gray-600 mt-1">
              Detailed view of your investment portfolio and performance.
            </p>
          </div>

          {/* Portfolio Overview */}
          <PortfolioOverview portfolio={displayPortfolio} />

          {/* Performance Chart - Full Width */}
          <PerformanceChart data={mockDetailedPerformance} />

          {/* Risk and Type Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskDistributionChart data={riskDistributionData} />
            
            {/* Placeholder for Type Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Asset Type Distribution
              </h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                Asset type chart coming soon...
              </div>
            </div>
          </div>

          {/* All Investments */}
          <InvestmentList investments={displayPortfolio.investments} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}