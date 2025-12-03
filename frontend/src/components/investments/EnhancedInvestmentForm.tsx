// frontend/src/components/investments/EnhancedInvestmentForm.tsx
'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useInvest, useSimulateInvestment } from '@/hooks/useProducts';
import { InvestmentProduct } from '@/types';
import { formatCurrency, formatPercentage } from '@/utils/format';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface InvestmentFormData {
  amount: number;
}

interface EnhancedInvestmentFormProps {
  product: InvestmentProduct;
  userBalance: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EnhancedInvestmentForm: React.FC<EnhancedInvestmentFormProps> = ({
  product,
  userBalance,
  onSuccess,
  onCancel,
}) => {
  const [simulation, setSimulation] = useState<any>(null);
  const [realTimeValidation, setRealTimeValidation] = useState<{
    isValid: boolean;
    messages: string[];
  }>({ isValid: true, messages: [] });
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<InvestmentFormData>();
  const investMutation = useInvest();
  const simulateMutation = useSimulateInvestment();

  const amount = watch('amount', 0);

  // Real-time validation
  useEffect(() => {
    const validateInvestment = () => {
      const messages: string[] = [];

      if (amount < product.minInvestment) {
        messages.push(`Minimum investment is ${formatCurrency(product.minInvestment)}`);
      }

      if (product.maxInvestment && amount > product.maxInvestment) {
        messages.push(`Maximum investment is ${formatCurrency(product.maxInvestment)}`);
      }

      if (amount > userBalance) {
        messages.push(`Insufficient balance. Available: ${formatCurrency(userBalance)}`);
      }

      if (amount > 0 && product.availableUnits === 0) {
        messages.push('This product is currently sold out');
      }

      // Calculate units and check availability
      const unitPrice = product.minInvestment / 100;
      const units = Math.floor(amount / unitPrice);
      if (units > product.availableUnits) {
        messages.push(`Only ${product.availableUnits} units available`);
      }

      setRealTimeValidation({
        isValid: messages.length === 0 && amount >= product.minInvestment,
        messages,
      });
    };

    validateInvestment();
  }, [amount, product, userBalance]);

  const handleSimulate = async (data: InvestmentFormData) => {
    try {
      const response = await simulateMutation.mutateAsync({
        productId: product.id,
        amount: data.amount,
      });
      setSimulation(response.data.simulation);
    } catch (error) {
      console.error('Simulation failed:', error);
    }
  };

  const onSubmit = async (data: InvestmentFormData) => {
    try {
      await investMutation.mutateAsync({
        productId: product.id,
        amount: data.amount,
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Investment failed:', error);
    }
  };

  const suggestedAmounts = [
    product.minInvestment,
    product.minInvestment * 2,
    product.minInvestment * 5,
    product.maxInvestment ? Math.min(product.maxInvestment, userBalance) : userBalance,
  ].filter((amount, index, array) => 
    amount >= product.minInvestment && 
    amount <= userBalance && 
    array.indexOf(amount) === index
  );

  const unitPrice = product.minInvestment / 100;
  const units = Math.floor(amount / unitPrice);
  const actualAmount = units * unitPrice;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Make Investment</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-4 mb-6 border border-primary-100">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-primary-600 font-medium">Available Balance</div>
            <div className="text-2xl font-bold text-primary-900">
              {formatCurrency(userBalance)}
            </div>
          </div>
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-bold">$</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Investment Amount with Real-time Feedback */}
        <div>
          <Input
            label="Investment Amount"
            type="number"
            step="0.01"
            min={product.minInvestment}
            max={Math.min(product.maxInvestment || Infinity, userBalance)}
            placeholder={`Min: ${formatCurrency(product.minInvestment)}`}
            {...register('amount', {
              required: 'Investment amount is required',
              min: {
                value: product.minInvestment,
                message: `Minimum investment is ${formatCurrency(product.minInvestment)}`,
              },
              max: {
                value: Math.min(product.maxInvestment || Infinity, userBalance),
                message: `Maximum investment is ${formatCurrency(Math.min(product.maxInvestment || userBalance, userBalance))}`,
              },
              validate: (value) => value <= userBalance || 'Insufficient balance',
            })}
            error={errors.amount?.message}
          />

          {/* Real-time Validation Messages */}
          {realTimeValidation.messages.length > 0 && (
            <div className="mt-2 space-y-1">
              {realTimeValidation.messages.map((message, index) => (
                <div key={index} className="flex items-center text-sm text-danger-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {message}
                </div>
              ))}
            </div>
          )}

          {/* Real-time Calculation */}
          {amount > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Units:</span>
                  <div className="font-medium">{units.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Unit Price:</span>
                  <div className="font-medium">{formatCurrency(unitPrice)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Actual Amount:</span>
                  <div className="font-medium">{formatCurrency(actualAmount)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Remaining Balance:</span>
                  <div className="font-medium">{formatCurrency(userBalance - actualAmount)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Amounts */}
          {suggestedAmounts.length > 0 && (
            <div className="mt-3">
              <div className="text-sm text-gray-600 mb-2">Quick select:</div>
              <div className="flex flex-wrap gap-2">
                {suggestedAmounts.map((suggestedAmount) => (
                  <button
                    key={suggestedAmount}
                    type="button"
                    onClick={() => {
                      // Set the amount in the form
                      const event = { target: { value: suggestedAmount } };
                      register('amount').onChange(event);
                    }}
                    className={`text-sm px-3 py-2 rounded-lg transition-colors ${
                      amount === suggestedAmount
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {formatCurrency(suggestedAmount)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleSubmit(handleSimulate)}
            disabled={simulateMutation.isPending || !realTimeValidation.isValid}
            className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {simulateMutation.isPending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Simulating...
              </div>
            ) : (
              'Simulate Investment'
            )}
          </button>
          
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={investMutation.isPending}
            disabled={!realTimeValidation.isValid || !amount || amount < product.minInvestment}
          >
            Confirm Investment
          </Button>
        </div>
      </form>

      {/* Simulation Results */}
      {simulation && (
        <div className="mt-6 p-4 bg-success-50 rounded-lg border border-success-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-success-900">Simulation Results</h4>
            <div className="text-success-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-success-700">Investment:</div>
              <div className="font-medium">{formatCurrency(simulation.investment.amount)}</div>
            </div>
            <div>
              <div className="text-success-700">Expected Returns:</div>
              <div className="font-medium text-success-600">
                {formatCurrency(simulation.returns.expectedReturns)}
              </div>
            </div>
            <div>
              <div className="text-success-700">Total Value:</div>
              <div className="font-medium">
                {formatCurrency(simulation.returns.totalValue)}
              </div>
            </div>
            <div>
              <div className="text-success-700">Annual Return:</div>
              <div className="font-medium text-success-600">
                {formatPercentage(simulation.returns.annualizedReturn)}
              </div>
            </div>
          </div>

          {/* Projection Timeline */}
          <div className="mt-4 pt-4 border-t border-success-200">
            <div className="text-xs text-success-600 mb-2">Value Growth Over Time</div>
            <div className="space-y-2">
              {simulation.projection
                .filter((_: any, index: number) => index % 6 === 0 || index === simulation.projection.length - 1)
                .map((point: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-success-700">Month {point.month}</span>
                    <span className="font-medium">{formatCurrency(point.value)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Investment Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Investment Summary</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Product:</span>
            <span className="font-medium">{product.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Risk Level:</span>
            <span className="font-medium capitalize">{product.riskLevel}</span>
          </div>
          <div className="flex justify-between">
            <span>Expected Yield:</span>
            <span className="font-medium text-success-600">
              {formatPercentage(product.yieldRate)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Duration:</span>
            <span className="font-medium">{product.duration} months</span>
          </div>
        </div>
      </div>
    </div>
  );
};