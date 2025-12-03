// frontend/src/components/dashboard/PortfolioOverview.tsx
'use client';

import { Portfolio } from '@/types';
import { formatCurrency, formatPercentage } from '@/utils/format';
import React from 'react';

interface PortfolioOverviewProps {
  portfolio: Portfolio;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ portfolio }) => {
  const { portfolioSummary } = portfolio;

  const stats = [
    {
      name: 'Total Portfolio Value',
      value: formatCurrency(portfolioSummary.totalCurrentValue),
      change: portfolioSummary.overallReturnPercentage,
      changeType: portfolioSummary.overallReturnPercentage >= 0 ? 'positive' : 'negative',
      description: 'Current market value',
    },
    {
      name: 'Total Invested',
      value: formatCurrency(portfolioSummary.totalInvested),
      description: 'Total amount invested',
    },
    {
      name: 'Total Returns',
      value: formatCurrency(portfolioSummary.totalReturns),
      change: portfolioSummary.overallReturnPercentage,
      changeType: portfolioSummary.overallReturnPercentage >= 0 ? 'positive' : 'negative',
      description: 'Overall returns',
    },
    {
      name: 'Active Investments',
      value: portfolioSummary.activeInvestments.toString(),
      description: 'Currently active',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {stat.value}
                </dd>
            </dl>
            
            {stat.change !== undefined && (
              <div className="mt-1 flex items-center">
                <span
                  className={`
                    text-sm font-medium
                    ${stat.changeType === 'positive' ? 'text-success-600' : 'text-danger-600'}
                  `}
                >
                  {stat.changeType === 'positive' ? '+' : ''}
                  {formatPercentage(stat.change)}
                </span>
                <span className="text-sm text-gray-500 ml-1">all time</span>
              </div>
            )}
            <p className="mt-2 text-sm text-gray-500">
              {stat.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};