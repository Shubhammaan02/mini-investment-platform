// frontend/src/components/investments/WithdrawalManagement.tsx
'use client';

import { Button } from '@/components/ui/Button';
import { Investment } from '@/types';
import { formatCurrency, formatPercentage } from '@/utils/format';
import React, { useState } from 'react';

interface WithdrawalManagementProps {
  investments: Investment[];
}

interface WithdrawalRequest {
  investmentId: string;
  amount: number;
  reason: string;
  penalty?: number;
}

export const WithdrawalManagement: React.FC<WithdrawalManagementProps> = ({ investments }) => {
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(0);
  const [withdrawalReason, setWithdrawalReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeInvestments = investments.filter(inv => inv.status === 'active');

  const calculatePenalty = (investment: Investment, amount: number) => {
    const monthsInvested = Math.floor(
      (new Date().getTime() - new Date(investment.investmentDate).getTime()) / 
      (30 * 24 * 60 * 60 * 1000)
    );
    
    const totalDuration = Math.floor(
      (new Date(investment.maturityDate).getTime() - new Date(investment.investmentDate).getTime()) / 
      (30 * 24 * 60 * 60 * 1000)
    );

    // Penalty calculation: 2% per remaining month, max 20%
    if (monthsInvested < 3) {
      return amount * 0.1; // 10% penalty for very early withdrawal
    }

    const remainingMonths = totalDuration - monthsInvested;
    const penaltyRate = Math.min(remainingMonths * 0.02, 0.2); // 2% per month, max 20%
    
    return amount * penaltyRate;
  };

  const canWithdraw = (investment: Investment) => {
    const monthsInvested = Math.floor(
      (new Date().getTime() - new Date(investment.investmentDate).getTime()) / 
      (30 * 24 * 60 * 60 * 1000)
    );
    
    return monthsInvested >= 3; // Minimum 3 months holding period
  };

  const getWithdrawalInfo = (investment: Investment) => {
    const penalty = calculatePenalty(investment, investment.currentValue);
    const netAmount = investment.currentValue - penalty;
    const monthsInvested = Math.floor(
      (new Date().getTime() - new Date(investment.investmentDate).getTime()) / 
      (30 * 24 * 60 * 60 * 1000)
    );

    return {
      penalty,
      netAmount,
      monthsInvested,
      canWithdraw: canWithdraw(investment),
      penaltyPercentage: (penalty / investment.currentValue) * 100,
    };
  };

  const handleWithdrawalRequest = async () => {
    if (!selectedInvestment) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, call withdrawal API
      console.log('Withdrawal request:', {
        investmentId: selectedInvestment.id,
        amount: withdrawalAmount,
        reason: withdrawalReason,
      });

      // Reset form
      setSelectedInvestment(null);
      setWithdrawalAmount(0);
      setWithdrawalReason('');
      
      alert('Withdrawal request submitted successfully!');
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal request failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeInvestments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">💼</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Active Investments
        </h3>
        <p className="text-gray-600">
          You need active investments to make withdrawals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Withdrawal Form */}
      {selectedInvestment ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Request Withdrawal</h3>
            <button
              onClick={() => setSelectedInvestment(null)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close withdrawal panel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Investment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">{selectedInvestment.product?.name}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Value:</span>
                <div className="font-medium">{formatCurrency(selectedInvestment.currentValue)}</div>
              </div>
              <div>
                <span className="text-gray-600">Original Investment:</span>
                <div className="font-medium">{formatCurrency(selectedInvestment.amount)}</div>
              </div>
              <div>
                <span className="text-gray-600">Returns:</span>
                <div className={`font-medium ${
                  selectedInvestment.returnPercentage >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {formatPercentage(selectedInvestment.returnPercentage)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Months Invested:</span>
                <div className="font-medium">
                  {Math.floor(
                    (new Date().getTime() - new Date(selectedInvestment.investmentDate).getTime()) / 
                    (30 * 24 * 60 * 60 * 1000)
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Withdrawal Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount
              </label>
              <input
                type="number"
                min="0"
                max={selectedInvestment.currentValue}
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Enter amount to withdraw"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>Available: {formatCurrency(selectedInvestment.currentValue)}</span>
                <button
                  type="button"
                  onClick={() => setWithdrawalAmount(selectedInvestment.currentValue)}
                  className="text-primary-600 hover:text-primary-700"
                >
                  Withdraw All
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="withdrawalReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Withdrawal
              </label>
              <select
                id="withdrawalReason"
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select a reason</option>
                <option value="emergency">Emergency Funds Needed</option>
                <option value="reinvestment">Reinvest in Better Opportunity</option>
                <option value="personal">Personal Expenses</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Withdrawal Summary */}
            {withdrawalAmount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h5 className="font-semibold text-yellow-800 mb-3">Withdrawal Summary</h5>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Withdrawal Amount:</span>
                    <span className="font-medium">{formatCurrency(withdrawalAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Early Withdrawal Penalty:</span>
                    <span className="font-medium text-danger-600">
                      -{formatCurrency(calculatePenalty(selectedInvestment, withdrawalAmount))}
                    </span>
                  </div>
                  
                  <div className="flex justify-between border-t border-yellow-200 pt-2">
                    <span className="text-yellow-700 font-semibold">Net Amount Received:</span>
                    <span className="font-semibold text-success-600">
                      {formatCurrency(withdrawalAmount - calculatePenalty(selectedInvestment, withdrawalAmount))}
                    </span>
                  </div>
                  
                  {!canWithdraw(selectedInvestment) && (
                    <div className="text-danger-600 text-xs mt-2">
                      ⚠️ Early withdrawal penalty applies (minimum 3-month holding period not met)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedInvestment(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleWithdrawalRequest}
                isLoading={isSubmitting}
                disabled={!withdrawalAmount || withdrawalAmount <= 0 || !withdrawalReason}
                className="flex-1"
              >
                Confirm Withdrawal
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Investments List for Withdrawal */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Withdrawal Management</h3>
            <p className="text-sm text-gray-600">Select an investment to withdraw funds from</p>
          </div>

          <div className="divide-y divide-gray-200">
            {activeInvestments.map((investment) => {
              const withdrawalInfo = getWithdrawalInfo(investment);
              
              return (
                <div key={investment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                          <span className="text-primary-600 font-bold text-lg">$</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900">{investment.product?.name}</h4>
                        <div className="text-sm text-gray-600">
                          Current Value: {formatCurrency(investment.currentValue)}
                          {' • '}
                          Returns: 
                          <span className={
                            investment.returnPercentage >= 0 ? 'text-success-600' : 'text-danger-600'
                          }>
                            {formatPercentage(investment.returnPercentage)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <Button
                        variant={withdrawalInfo.canWithdraw ? "primary" : "outline"}
                        onClick={() => setSelectedInvestment(investment)}
                        disabled={!withdrawalInfo.canWithdraw}
                      >
                        {withdrawalInfo.canWithdraw ? 'Withdraw' : 'Locked'}
                      </Button>
                      
                      {!withdrawalInfo.canWithdraw && (
                        <div className="text-xs text-gray-500 mt-1">
                          Available in {3 - withdrawalInfo.monthsInvested} months
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Withdrawal Info */}
                  <div className="mt-3 text-sm text-gray-600">
                    {withdrawalInfo.canWithdraw ? (
                      <div>
                        Early withdrawal penalty: {formatPercentage(withdrawalInfo.penaltyPercentage)}
                        {' • '}
                        Net amount: {formatCurrency(withdrawalInfo.netAmount)}
                      </div>
                    ) : (
                      <div>
                        Minimum holding period: 3 months (currently {withdrawalInfo.monthsInvested} months)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Withdrawal Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Withdrawal Guidelines</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Minimum holding period: 3 months</li>
          <li>• Early withdrawal penalty: 2% per remaining month (max 20%)</li>
          <li>• Very early withdrawal (&lt;3 months): 10% penalty</li>
          <li>• Withdrawal requests are processed within 2-3 business days</li>
          <li>• Funds will be credited to your account balance</li>
        </ul>
      </div>
    </div>
  );
};