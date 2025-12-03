// frontend/src/app/(dashboard)/investments/page.tsx
'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { InvestmentHistory } from '@/components/investments/InvestmentHistory';
import { WithdrawalManagement } from '@/components/investments/WithdrawalManagement';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PortfolioAnalytics } from '@/components/portfolio/PortfolioAnalytics';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useState } from 'react';

// Mock performance data
const mockPerformanceData = [
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

type TabType = 'overview' | 'history' | 'withdrawals' | 'analytics';

export default function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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

  const tabs = [
    { id: 'overview' as TabType, name: 'Portfolio Overview', icon: '📊' },
    { id: 'history' as TabType, name: 'Investment History', icon: '📝' },
    { id: 'withdrawals' as TabType, name: 'Withdrawals', icon: '💰' },
    { id: 'analytics' as TabType, name: 'Advanced Analytics', icon: '📈' },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Investment Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your investments, track performance, and make withdrawals.
            </p>
          </div>

          {/* Portfolio Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">Total Invested</div>
              <div className="text-2xl font-bold text-gray-900">
                {displayPortfolio.portfolioSummary.totalInvested.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">Current Value</div>
              <div className="text-2xl font-bold text-primary-600">
                {displayPortfolio.portfolioSummary.totalCurrentValue.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">Total Returns</div>
              <div className={`text-2xl font-bold ${
                displayPortfolio.portfolioSummary.totalReturns >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                {displayPortfolio.portfolioSummary.totalReturns >= 0 ? '+' : ''}
                {displayPortfolio.portfolioSummary.totalReturns.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">Active Investments</div>
              <div className="text-2xl font-bold text-gray-900">
                {displayPortfolio.portfolioSummary.activeInvestments}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Overview</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance Chart */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Performance Trend</h3>
                      <div className="h-64">
                        {/* Simple bar chart using divs */}
                        <div className="flex items-end justify-between h-48 space-x-1">
                          {mockPerformanceData.slice(-6).map((point, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                              <div
                                className="w-full bg-primary-500 rounded-t transition-all duration-500"
                                style={{ 
                                  height: `${(point.value / 15500) * 100}%`,
                                  maxHeight: '100%'
                                }}
                              />
                              <div className="text-xs text-gray-600 mt-2">{point.month}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Investment Distribution */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Investment Distribution</h3>
                      <div className="space-y-3">
                        {Object.entries(displayPortfolio.distributions.byRisk)
                          .filter(([_, value]) => value > 0)
                          .map(([risk, value]) => (
                            <div key={risk} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 capitalize">{risk} Risk</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      risk === 'low' ? 'bg-success-500' :
                                      risk === 'medium' ? 'bg-warning-500' : 'bg-danger-500'
                                    }`}
                                    style={{
                                      width: `${(value / displayPortfolio.portfolioSummary.totalCurrentValue) * 100}%`
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-16 text-right">
                                  {((value / displayPortfolio.portfolioSummary.totalCurrentValue) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('history')}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
                  >
                    <div className="text-2xl mb-2">📝</div>
                    <h3 className="font-semibold text-gray-900">View History</h3>
                    <p className="text-sm text-gray-600 mt-1">See all your investment transactions</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('withdrawals')}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
                  >
                    <div className="text-2xl mb-2">💰</div>
                    <h3 className="font-semibold text-gray-900">Make Withdrawal</h3>
                    <p className="text-sm text-gray-600 mt-1">Withdraw funds from your investments</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
                  >
                    <div className="text-2xl mb-2">📈</div>
                    <h3 className="font-semibold text-gray-900">View Analytics</h3>
                    <p className="text-sm text-gray-600 mt-1">Deep dive into your portfolio performance</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <InvestmentHistory investments={displayPortfolio.investments} />
            )}

            {activeTab === 'withdrawals' && (
              <WithdrawalManagement investments={displayPortfolio.investments} />
            )}

            {activeTab === 'analytics' && (
              <PortfolioAnalytics 
                portfolio={displayPortfolio}
                performanceData={mockPerformanceData}
              />
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}