// frontend/src/components/portfolio/PortfolioAnalytics.tsx
'use client';

import { Portfolio } from '@/types';
// import { formatCurrency, formatPercentage, formatDate } from '@/utils/format';
import { formatCurrency, formatPercentage } from '@/utils/format';
import React from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

interface PortfolioAnalyticsProps {
  portfolio: Portfolio;
  performanceData: any[];
}

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export const PortfolioAnalytics: React.FC<PortfolioAnalyticsProps> = ({
  portfolio,
  performanceData,
}) => {
  const { distributions, portfolioSummary } = portfolio;

  // Prepare data for asset type distribution
  const assetTypeData = Object.entries(distributions.byType)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      value,
    }));

  // Prepare data for risk distribution
  const riskData = Object.entries(distributions.byRisk)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

  // Performance metrics
  const performanceMetrics = [
    {
      label: 'Total Return',
      value: formatCurrency(portfolioSummary.totalReturns),
      change: portfolioSummary.overallReturnPercentage,
      isPositive: portfolioSummary.overallReturnPercentage >= 0,
    },
    {
      label: 'Return Rate',
      value: formatPercentage(portfolioSummary.overallReturnPercentage),
      change: portfolioSummary.overallReturnPercentage,
      isPositive: portfolioSummary.overallReturnPercentage >= 0,
    },
    {
      label: 'Active Investments',
      value: portfolioSummary.activeInvestments.toString(),
      change: null,
    },
    {
      label: 'Success Rate',
      value: `${((portfolioSummary.activeInvestments / portfolioSummary.totalInvestments) * 100).toFixed(1)}%`,
      change: null,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
            <div className={`text-2xl font-bold ${
              metric.isPositive !== null 
                ? metric.isPositive ? 'text-success-600' : 'text-danger-600'
                : 'text-gray-900'
            }`}>
              {metric.value}
            </div>
            {metric.change !== null && (
              <div className={`text-sm ${
                metric.isPositive ? 'text-success-600' : 'text-danger-600'
              }`}>
                {metric.isPositive ? '+' : ''}{formatPercentage(metric.change)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  name="Portfolio Value"
                />
                <Line
                  type="monotone"
                  dataKey="returns"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  name="Returns"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Allocation</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Value']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Value']}
                />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Capital Invested</span>
                <span className="font-medium">{formatCurrency(portfolioSummary.totalInvested)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Returns Generated</span>
                <span className="font-medium text-success-600">
                  {formatCurrency(portfolioSummary.totalReturns)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-success-500 h-2 rounded-full"
                  style={{ 
                    width: `${Math.min((portfolioSummary.totalReturns / portfolioSummary.totalInvested) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Current Value</span>
                <span className="font-medium text-primary-600">
                  {formatCurrency(portfolioSummary.totalCurrentValue)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {portfolioSummary.totalInvestments}
              </div>
              <div className="text-gray-600">Total Investments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">
                {formatPercentage(portfolioSummary.overallReturnPercentage)}
              </div>
              <div className="text-gray-600">Overall Return</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};