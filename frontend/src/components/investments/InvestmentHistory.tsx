// frontend/src/components/investments/InvestmentHistory.tsx
'use client';

import { Investment } from '@/types';
import { formatCurrency, formatDate, formatPercentage, formatRelativeTime } from '@/utils/format';
import React, { useState } from 'react';

interface InvestmentHistoryProps {
  investments: Investment[];
}

export const InvestmentHistory: React.FC<InvestmentHistoryProps> = ({ investments }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'matured' | 'cancelled'>('all');

  const filteredInvestments = investments.filter(investment => {
    if (filter === 'all') return true;
    return investment.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success-600 bg-success-50 border-success-200';
      case 'matured':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'cancelled':
        return 'text-danger-600 bg-danger-50 border-danger-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'matured':
        return '⚫';
      case 'cancelled':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getTimeToMaturity = (maturityDate: string) => {
    const now = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Matured';
    if (diffDays <= 30) return `${diffDays} days`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months`;
    return `${Math.ceil(diffDays / 365)} years`;
  };

  const stats = {
    total: investments.length,
    active: investments.filter(i => i.status === 'active').length,
    matured: investments.filter(i => i.status === 'matured').length,
    cancelled: investments.filter(i => i.status === 'cancelled').length,
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Investment History</h3>
            <p className="text-sm text-gray-600">Track your investment journey</p>
          </div>
          
          {/* Stats */}
          <div className="flex space-x-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{stats.total}</div>
              <div className="text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-success-600">{stats.active}</div>
              <div className="text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-600">{stats.matured}</div>
              <div className="text-gray-600">Matured</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All Investments' },
            { key: 'active', label: 'Active' },
            { key: 'matured', label: 'Matured' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Investments List */}
      <div className="divide-y divide-gray-200">
        {filteredInvestments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No investments found
            </h4>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You haven't made any investments yet."
                : `No ${filter} investments found.`
              }
            </p>
          </div>
        ) : (
          filteredInvestments.map((investment) => (
            <div key={investment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${getStatusColor(investment.status)}`}>
                      <span className="text-lg">{getStatusIcon(investment.status)}</span>
                    </div>
                  </div>

                  {/* Investment Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-lg font-semibold text-gray-900 truncate">
                        {investment.product?.name || 'Unknown Product'}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(investment.status)}`}>
                        {investment.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Invested: {formatCurrency(investment.amount)}</span>
                      <span>•</span>
                      <span>Started: {formatRelativeTime(investment.investmentDate)}</span>
                      <span>•</span>
                      <span>
                        {investment.status === 'active' 
                          ? `Matures in ${getTimeToMaturity(investment.maturityDate)}`
                          : `Matured on ${formatDate(investment.maturityDate)}`
                        }
                      </span>
                    </div>

                    {/* Progress for active investments */}
                    {investment.status === 'active' && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{getTimeToMaturity(investment.maturityDate)} remaining</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-primary-600 h-1 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                ((new Date().getTime() - new Date(investment.investmentDate).getTime()) / 
                                (new Date(investment.maturityDate).getTime() - new Date(investment.investmentDate).getTime())) * 100,
                                100
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance */}
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(investment.currentValue)}
                  </div>
                  <div className={`text-sm ${
                    investment.returnPercentage >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {investment.returnPercentage >= 0 ? '+' : ''}
                    {formatPercentage(investment.returnPercentage)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatCurrency(investment.totalReturn)} returns
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>Units: {investment.units.toLocaleString()}</span>
                  <span>•</span>
                  <span>Type: {investment.product?.type?.replace('_', ' ') || 'N/A'}</span>
                  <span>•</span>
                  <span>Risk: {investment.product?.riskLevel?.toUpperCase() || 'N/A'}</span>
                </div>
                
                <div className="flex space-x-2">
                  <button className="text-primary-600 hover:text-primary-700 font-medium">
                    View Details
                  </button>
                  {investment.status === 'active' && (
                    <>
                      <span className="text-gray-300">•</span>
                      <button className="text-danger-600 hover:text-danger-700 font-medium">
                        Withdraw
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination or View All */}
      {filteredInvestments.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredInvestments.length} of {investments.length} investments
            </div>
            <button className="text-primary-600 hover:text-primary-700 font-medium">
              View All Investments →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};