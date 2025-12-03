// frontend/src/components/dashboard/InvestmentList.tsx
'use client';

import { Investment } from '@/types';
import { formatCurrency, formatDate, formatPercentage } from '@/utils/format';
import Link from 'next/link';
import React from 'react';

interface InvestmentListProps {
  investments: Investment[];
}

export const InvestmentList: React.FC<InvestmentListProps> = ({ investments }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800';
      case 'matured':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-success-600';
      case 'medium':
        return 'text-warning-600';
      case 'high':
        return 'text-danger-600';
      default:
        return 'text-gray-600';
    }
  };

  if (investments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">💼</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No investments yet
        </h3>
        <p className="text-gray-500 mb-4">
          Start building your portfolio by making your first investment.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Recent Investments
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Your active and completed investment positions.
        </p>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {investments.map((investment) => (
            <li key={investment.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-sm">
                          {investment.product?.type === 'stocks' && '📈'}
                          {investment.product?.type === 'bonds' && '📋'}
                          {investment.product?.type === 'mutual_funds' && '🏦'}
                          {investment.product?.type === 'etfs' && '📊'}
                          {investment.product?.type === 'real_estate' && '🏠'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {investment.product?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className={`font-medium ${getRiskColor(investment.product?.riskLevel || 'medium')}`}>
                          {investment.product?.riskLevel?.toUpperCase()}
                        </span>
                        {' • '}
                        {investment.product?.type?.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(investment.currentValue)}
                      </div>
                      <div className={`text-sm ${investment.returnPercentage >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        {investment.returnPercentage >= 0 ? '+' : ''}
                        {formatPercentage(investment.returnPercentage)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(investment.status)}`}
                      >
                        {investment.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Since {formatDate(investment.investmentDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex space-y-2 sm:space-y-0 sm:space-x-6">
                    <div className="flex items-center text-sm text-gray-500">
                      <span>Invested: {formatCurrency(investment.amount)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>Units: {investment.units}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>Matures: {formatDate(investment.maturityDate)}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <Link
                      href={`/investments/${investment.id}`}
                      className="text-primary-600 hover:text-primary-500"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};