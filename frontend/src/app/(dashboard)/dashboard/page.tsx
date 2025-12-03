// frontend/src/app/(dashboard)/dashboard/page.tsx
'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { InvestmentList } from '@/components/dashboard/InvestmentList';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { PortfolioOverview } from '@/components/dashboard/PortfolioOverview';
import { RiskDistributionChart } from '@/components/dashboard/RiskDistributionChart';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Header } from '@/components/layout/Header';
import { usePortfolio } from '@/hooks/usePortfolio';

// Mock performance data - will be replaced with real API data
const mockPerformanceData = [
  { month: 'Jan', value: 10000, returns: 0 },
  { month: 'Feb', value: 10500, returns: 500 },
  { month: 'Mar', value: 11000, returns: 1000 },
  { month: 'Apr', value: 11500, returns: 1500 },
  { month: 'May', value: 12000, returns: 2000 },
  { month: 'Jun', value: 12500, returns: 2500 },
];

export default function DashboardPage() {

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

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-danger-600 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Failed to load portfolio
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

  // Prepare risk distribution data for chart
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
          <Header />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's your investment overview.
            </p>
          </div>

          {/* Portfolio Overview */}
          <PortfolioOverview portfolio={displayPortfolio} />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <PerformanceChart data={mockPerformanceData} />

            {/* Risk Distribution */}
            <RiskDistributionChart data={riskDistributionData} />
          </div>

          {/* Recent Investments */}
          <InvestmentList investments={displayPortfolio.investments} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}