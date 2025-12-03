// backend/src/controllers/investmentController.js
const { Investment, InvestmentProduct, User, TransactionLog } = require('../models');
const BusinessRules = require('../utils/businessRules');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class InvestmentController {
  // Create new investment
  static async createInvestment(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { productId, amount } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!productId || !amount || amount <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Invalid input',
          details: 'Product ID and positive amount are required'
        });
      }

      // Fetch product with lock for update
      const product = await InvestmentProduct.findByPk(productId, { 
        transaction,
        lock: transaction.LOCK.UPDATE 
      });

      if (!product || !product.isActive) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Product not found or not available for investment'
        });
      }

      // Fetch user with lock for update
      const user = await User.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      // Calculate units and validate investment
      const { units, unitPrice, actualAmount } = BusinessRules.calculateUnits(amount, product);
      
      const validation = BusinessRules.validateInvestment(user, product, actualAmount, units);
      if (!validation.isValid) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Investment validation failed',
          details: validation.errors,
          warnings: validation.warnings
        });
      }

      // Calculate investment details
      const investmentDate = new Date();
      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + product.duration);

      const returnsCalculation = BusinessRules.calculateInvestmentReturns(
        actualAmount, 
        product.yieldRate, 
        product.duration
      );

      // Create investment
      const investment = await Investment.create({
        userId,
        productId,
        amount: actualAmount,
        units,
        unitPrice,
        currentValue: actualAmount,
        expectedReturns: returnsCalculation.expectedReturns,
        investmentDate,
        maturityDate,
        status: 'active'
      }, { transaction });

      // Update user balance
      user.balance = parseFloat((parseFloat(user.balance) - actualAmount).toFixed(2));
      await user.save({ transaction });

      // Update product available units
      product.availableUnits -= units;
      await product.save({ transaction });

      await transaction.commit();

      res.status(201).json({
        message: 'Investment created successfully',
        investment: {
          id: investment.id,
          productId: investment.productId,
          amount: parseFloat(investment.amount.toFixed(2)),
          units: investment.units,
          unitPrice: parseFloat(investment.unitPrice.toFixed(2)),
          currentValue: parseFloat(investment.currentValue.toFixed(2)),
          expectedReturns: parseFloat(investment.expectedReturns.toFixed(2)),
          investmentDate: investment.investmentDate,
          maturityDate: investment.maturityDate,
          status: investment.status
        },
        summary: {
          newBalance: parseFloat(user.balance.toFixed(2)),
          unitsPurchased: units,
          totalCost: parseFloat(actualAmount.toFixed(2))
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Create investment error:', error);

      // Handle Sequelize errors
      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        return res.status(400).json({
          error: 'Database validation failed',
          details: errors
        });
      }

      res.status(500).json({
        error: 'Failed to create investment',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user portfolio
  static async getPortfolio(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: investments } = await Investment.findAndCountAll({
        where: { userId },
        include: [{
          model: InvestmentProduct,
          as: 'product',
          attributes: ['id', 'name', 'type', 'riskLevel', 'yieldRate', 'duration']
        }],
        order: [['investmentDate', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      // Update investment values (simulate growth)
      const updatedInvestments = await Promise.all(
        investments.map(async (inv) => {
          if (inv.product) {
            await inv.updateInvestmentValues(inv.product);
          }
          return inv;
        })
      );

      // Calculate portfolio summary
      let totalInvested = 0;
      let totalCurrentValue = 0;
      let totalReturns = 0;

      updatedInvestments.forEach(inv => {
        totalInvested += parseFloat(inv.amount) || 0;
        totalCurrentValue += parseFloat(inv.currentValue) || 0;
        totalReturns += parseFloat(inv.totalReturn) || 0;
      });

      const portfolioSummary = {
        totalInvestments: count,
        // totalInvestments: updatedInvestments.length,
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
        totalReturns: parseFloat(totalReturns.toFixed(2)),
        overallReturnPercentage: totalInvested > 0 ? 
          parseFloat(((totalReturns / totalInvested) * 100).toFixed(2)) : 0,
        activeInvestments: updatedInvestments.filter(inv => inv.status === 'active').length,
        maturedInvestments: updatedInvestments.filter(inv => inv.status === 'matured').length
      };

      // Calculate distribution by product type
      const typeDistribution = {};
      const riskDistribution = {};
      updatedInvestments.forEach(inv => {
        if (inv.product) {
          const type = inv.product.type;
          const risk = inv.product.riskLevel;
          const value = parseFloat(inv.currentValue) || 0;
          
          typeDistribution[type] = (typeDistribution[type] || 0) + value;
          riskDistribution[risk] = (riskDistribution[risk] || 0) + value;
        }
      });

      res.json({
        investments: updatedInvestments.map(inv => ({
          id: inv.id,
          productId: inv.productId,
          amount: parseFloat(inv.amount.toFixed(2)),
          units: inv.units,
          currentValue: parseFloat(inv.currentValue.toFixed(2)),
          totalReturn: parseFloat(inv.totalReturn.toFixed(2)),
          returnPercentage: parseFloat(inv.returnPercentage.toFixed(2)),
          investmentDate: inv.investmentDate,
          maturityDate: inv.maturityDate,
          status: inv.status,
          product: inv.product
        })),
        portfolioSummary,
        distributions: {
          byType: typeDistribution,
          byRisk: riskDistribution
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          hasNext: offset + updatedInvestments.length < count,
          hasPrevious: parseInt(page) > 1
        }
      });

    } catch (error) {
      console.error('Get portfolio error:', error);
      res.status(500).json({
        error: 'Failed to fetch portfolio'
      });
    }
  }

  // Get specific investment
  static async getInvestment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const investment = await Investment.findOne({
        where: { id, userId },
        include: [{
          model: InvestmentProduct,
          as: 'product',
          attributes: ['id', 'name', 'type', 'riskLevel', 'yieldRate', 'duration', 'description']
        }]
      });

      if (!investment) {
        return res.status(404).json({
          error: 'Investment not found'
        });
      }

      // Update investment values
      const updatedInvestment = await investment.updateInvestmentValues();

      // Calculate time to maturity
      const timeToMaturity = Math.max(0, updatedInvestment.maturityDate - new Date());
      const monthsToMaturity = Math.ceil(timeToMaturity / (30 * 24 * 60 * 60 * 1000));

      res.json({
        investment: updatedInvestment,
        analytics: {
          monthsToMaturity,
          timeToMaturity: Math.floor(timeToMaturity / (24 * 60 * 60 * 1000)), // days
          isMatured: updatedInvestment.status === 'matured',
          canWithdraw: BusinessRules.canWithdrawInvestment(updatedInvestment)
        }
      });

    } catch (error) {
      console.error('Get investment error:', error);
      res.status(500).json({
        error: 'Failed to fetch investment'
      });
    }
  }

  // Get investment performance over time
  static async getInvestmentPerformance(req, res) {
    try {
      const userId = req.user.id;
      const { period = '6m' } = req.query; // 1m, 3m, 6m, 1y, all

      // Validate period parameter
      const validPeriods = ['1m', '3m', '6m', '1y', 'all'];
      if (!validPeriods.includes(period)) {
        return res.status(400).json({
          error: 'Invalid period parameter',
          details: `Period must be one of: ${validPeriods.join(', ')}`
        });
      }

      const investments = await Investment.findAll({
        where: { userId },
        include: [{
          model: InvestmentProduct,
          as: 'product',
          attributes: ['id', 'name', 'type', 'yieldRate']
        }]
      });

      // Generate actual historical performance (not future projections)
      const performanceData = this.generateHistoricalPerformance(investments, period);

      // Helper functions defined as static methods
      const bestPerformer = this.getBestPerformer(investments);
      const worstPerformer = this.getWorstPerformer(investments);
      const averageReturn = this.calculateAverageReturn(investments);

      res.json({
        performance: performanceData,
        period,
        summary: {
          bestPerformer,
          worstPerformer,
          averageReturn
        }
      });

    } catch (error) {
      console.error('Get performance error:', error);
      res.status(500).json({
        error: 'Failed to fetch performance data'
      });
    }
  }

  // Static helper methods
  static generateHistoricalPerformance(investments, period) {
    // Calculate actual historical performance based on investment dates
    const now = new Date();
    let months;
    
    switch (period) {
      case '1m': months = 1; break;
      case '3m': months = 3; break;
      case '6m': months = 6; break;
      case '1y': months = 12; break;
      default: months = 24; // for 'all'
    }
    
    const performance = [];
    
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - i - 1));
      
      let monthValue = 0;
      let monthReturns = 0;
      
      investments.forEach(inv => {
        const investmentDate = new Date(inv.investmentDate);
        if (investmentDate <= date) {
          const monthsInvested = (date.getFullYear() - investmentDate.getFullYear()) * 12 + 
                                (date.getMonth() - investmentDate.getMonth());
          const monthlyRate = (inv.product?.yieldRate || 0) / 100 / 12;
          const currentValue = inv.amount * Math.pow(1 + monthlyRate, Math.min(monthsInvested, inv.product?.duration || 12));
          
          monthValue += currentValue;
          monthReturns += currentValue - inv.amount;
        }
      });
      
      performance.push({
        month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
        value: parseFloat(monthValue.toFixed(2)),
        returns: parseFloat(monthReturns.toFixed(2))
      });
    }
    
    return performance;
  }

  static getBestPerformer(investments) {
    if (!investments.length) return null;
    
    return investments.reduce((best, current) => {
      const currentReturn = ((current.currentValue - current.amount) / current.amount) || 0;
      const bestReturn = ((best.currentValue - best.amount) / best.amount) || 0;
      return currentReturn > bestReturn ? current : best;
    });
  }

  static getWorstPerformer(investments) {
    if (!investments.length) return null;
    
    return investments.reduce((worst, current) => {
      const currentReturn = ((current.currentValue - current.amount) / current.amount) || 0;
      const worstReturn = ((worst.currentValue - worst.amount) / worst.amount) || 0;
      return currentReturn < worstReturn ? current : worst;
    });
  }

  static calculateAverageReturn(investments) {
    if (!investments.length) return 0;
    
    const totalReturn = investments.reduce((sum, inv) => {
      return sum + (((inv.currentValue - inv.amount) / inv.amount) || 0);
    }, 0);
    
    return parseFloat(((totalReturn / investments.length) * 100).toFixed(2));
  }

  // Simulate investment (for testing/planning)
  static async simulateInvestment(req, res) {
    try {
      const { productId, amount } = req.body;
      const userId = req.user.id;

      const product = await InvestmentProduct.findByPk(productId);
      if (!product || !product.isActive) {
        return res.status(404).json({
          error: 'Product not found'
        });
      }

      const user = await User.findByPk(userId);
      const { units, unitPrice, actualAmount } = BusinessRules.calculateUnits(amount, product);

      const validation = BusinessRules.validateInvestment(user, product, actualAmount, units);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Investment simulation failed',
          details: validation.errors
        });
      }

      const returnsCalculation = BusinessRules.calculateInvestmentReturns(
        actualAmount, 
        product.yieldRate, 
        product.duration
      );

      // Generate projection data
      const projection = generateInvestmentProjection(actualAmount, product.yieldRate, product.duration);

      res.json({
        simulation: {
          product: {
            name: product.name,
            type: product.type,
            riskLevel: product.riskLevel,
            yieldRate: product.yieldRate,
            duration: product.duration
          },
          investment: {
            amount: actualAmount,
            units,
            unitPrice
          },
          returns: returnsCalculation,
          projection,
          validation: {
            ...validation,
            newBalance: user.balance - actualAmount
          }
        }
      });

    } catch (error) {
      console.error('Simulate investment error:', error);
      res.status(500).json({
        error: 'Failed to simulate investment'
      });
    }
  }
}

function generateInvestmentProjection(amount, yieldRate, duration) {
  const monthlyRate = yieldRate / 100 / 12;
  const projection = [];
  
  for (let month = 0; month <= duration; month++) {
    const value = amount * Math.pow(1 + monthlyRate, month);
    projection.push({
      month,
      value: parseFloat(value.toFixed(2)),
      returns: parseFloat((value - amount).toFixed(2))
    });
  }
  
  return projection;
}

module.exports = InvestmentController;