// frontend/src/components/investments/InvestmentForm.tsx
'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useInvest, useSimulateInvestment } from '@/hooks/useProducts';
import { InvestmentProduct } from '@/types';
import { formatCurrency, formatPercentage } from '@/utils/format';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface InvestmentFormData {
  amount: number;
}

interface InvestmentFormProps {
  product: InvestmentProduct;
  userBalance: number;
  onSuccess?: () => void;
}

export const InvestmentForm: React.FC<InvestmentFormProps> = ({
  product,
  userBalance,
  onSuccess,
}) => {
  const [simulation, setSimulation] = useState<any>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<InvestmentFormData>();
  const investMutation = useInvest();
  const simulateMutation = useSimulateInvestment();

  const amount = watch('amount', 0);

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
    } catch (error) {
      console.error('Investment failed:', error);
    }
  };

  const suggestedAmounts = [
    product.minInvestment,
    product.minInvestment * 5,
    product.maxInvestment ? Math.min(product.maxInvestment, userBalance) : userBalance,
  ].filter((amount, index, array) => 
    amount >= product.minInvestment && 
    amount <= userBalance && 
    array.indexOf(amount) === index
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Make Investment</h3>

      {/* Current Balance */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="text-sm text-gray-600">Available Balance</div>
        <div className="text-2xl font-bold text-gray-900">
          {formatCurrency(userBalance)}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Investment Amount */}
        <div>
          <Input
            label="Investment Amount"
            type="number"
            step="0.01"
            min={product.minInvestment}
            max={Math.min(product.maxInvestment || Infinity, userBalance)}
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

          {/* Suggested Amounts */}
          {suggestedAmounts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestedAmounts.map((suggestedAmount) => (
                <button
                  key={suggestedAmount}
                  type="button"
                  onClick={() => {
                    // Set the amount in the form
                    const event = { target: { value: suggestedAmount } };
                    register('amount').onChange(event);
                  }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                >
                  {formatCurrency(suggestedAmount)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleSubmit(handleSimulate)}
            disabled={simulateMutation.isPending}
            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            {simulateMutation.isPending ? 'Simulating...' : 'Simulate'}
          </button>
          
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={investMutation.isPending}
            disabled={!amount || amount < product.minInvestment || amount > userBalance}
          >
            Invest Now
          </Button>
        </div>
      </form>

      {/* Simulation Results */}
      {simulation && (
        <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <h4 className="font-semibold text-primary-900 mb-3">Simulation Results</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-primary-700">Investment Amount:</span>
              <span className="font-medium">{formatCurrency(simulation.investment.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-700">Expected Returns:</span>
              <span className="font-medium text-success-600">
                {formatCurrency(simulation.returns.expectedReturns)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-700">Total Value at Maturity:</span>
              <span className="font-medium">
                {formatCurrency(simulation.returns.totalValue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-700">Annualized Return:</span>
              <span className="font-medium text-success-600">
                {formatPercentage(simulation.returns.annualizedReturn)}
              </span>
            </div>
          </div>

          {/* Projection Chart Placeholder */}
          <div className="mt-4 pt-4 border-t border-primary-200">
            <div className="text-xs text-primary-600 mb-2">Value Over Time</div>
            <div className="h-2 bg-primary-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 rounded-full transition-all duration-1000"
                style={{ width: '100%' }}
              />
            </div>
            <div className="flex justify-between text-xs text-primary-600 mt-1">
              <span>Now</span>
              <span>{product.duration} months</span>
            </div>
          </div>
        </div>
      )}

      {/* Investment Limits */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Investment Limits</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Minimum: {formatCurrency(product.minInvestment)}</div>
          {product.maxInvestment && (
            <div>Maximum: {formatCurrency(product.maxInvestment)}</div>
          )}
          <div>Available Units: {product.availableUnits.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};