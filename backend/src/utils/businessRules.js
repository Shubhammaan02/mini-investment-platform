// backend/src/utils/businessRules.js
class BusinessRules {
  static validateInvestment(user, product, investmentAmount, units) {
    const errors = [];
    const warnings = [];

    // Check if investment amount is positive
    if (investmentAmount <= 0) {
      errors.push('Investment amount must be greater than 0');
    }

    // Check if user has sufficient balance
    const userBalance = parseFloat(user.balance || 0);
    if (userBalance < investmentAmount) {
      errors.push(`Insufficient balance. Available: $${userBalance.toFixed(2)}, Required: $${investmentAmount.toFixed(2)}`);
    }

    // Check minimum investment
    const minInvestment = parseFloat(product.minInvestment || 0);
    if (investmentAmount < minInvestment) {
      errors.push(`Minimum investment is $${minInvestment.toFixed(2)}`);
    }

    // Check maximum investment if defined
    if (product.maxInvestment) {
      const maxInvestment = parseFloat(product.maxInvestment);
      if (investmentAmount > maxInvestment) {
        errors.push(`Maximum investment is $${maxInvestment.toFixed(2)}`);
      }
    }

    // Check available units
    const availableUnits = parseInt(product.availableUnits || 0);
    if (units > availableUnits) {
      errors.push(`Only ${availableUnits} units available`);
    }

    // Check if product is active
    if (!product.isActive) {
      errors.push('Product is not available for investment');
    }

    // Risk validation (users can only invest in products up to their risk appetite)
    const riskLevels = { low: 1, medium: 2, high: 3 };
    const userRisk = riskLevels[user.riskAppetite || 'medium'];
    const productRisk = riskLevels[product.riskLevel || 'medium'];
    
    if (productRisk > userRisk) {
      warnings.push(`This product exceeds your risk appetite (${user.riskAppetite}). Consider updating your risk profile.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  static calculateInvestmentReturns(amount, yieldRate, duration) {
    // Simple annual compound interest calculation
    const annualRate = parseFloat(yieldRate) / 100;
    const years = parseInt(duration) / 12;
    const expectedReturns = amount * Math.pow(1 + annualRate, years) - amount;
    
    return {
      expectedReturns: parseFloat(Math.max(0, expectedReturns).toFixed(2)),
      totalValue: parseFloat((amount + expectedReturns).toFixed(2)),
      annualizedReturn: parseFloat(yieldRate)
    };
  }

  static calculateUnits(amount, product) {
    let unitPrice;
    if (product.unitPrice) {
      unitPrice = parseFloat(product.unitPrice);
    } else {
      // Default: unit price is 1/100th of min investment
      unitPrice = parseFloat(product.minInvestment) / 100;
    }
    
    const units = Math.floor(parseFloat(amount) / unitPrice);
    const actualAmount = parseFloat((units * unitPrice).toFixed(2));
    
    return {
      units,
      unitPrice: parseFloat(unitPrice.toFixed(2)),
      actualAmount
    };
  }

  static validatePortfolioDiversification(userInvestments, newInvestment) {
    const warnings = [];
    
    // Calculate current portfolio distribution
    const distribution = {};
    let totalPortfolioValue = 0;

    userInvestments.forEach(inv => {
      const type = inv.product.type;
      distribution[type] = (distribution[type] || 0) + inv.currentValue;
      totalPortfolioValue += inv.currentValue;
    });

    // Add new investment to calculate new distribution
    distribution[newInvestment.type] = (distribution[newInvestment.type] || 0) + newInvestment.amount;
    totalPortfolioValue += newInvestment.amount;

    // Check if any asset type exceeds 50% of portfolio
    Object.keys(distribution).forEach(type => {
      const percentage = (distribution[type] / totalPortfolioValue) * 100;
      if (percentage > 50) {
        warnings.push(`Your ${type} investments will represent ${percentage.toFixed(1)}% of your portfolio. Consider diversifying.`);
      }
    });

    return warnings;
  }

  static canWithdrawInvestment(investment) {
    const errors = [];
    const warnings = [];  // FIXED: Declare warnings array

    if (investment.status !== 'active') {
      errors.push('Only active investments can be withdrawn');
    }

    // Calculate months invested
    const investmentDate = new Date(investment.investmentDate);
    const now = new Date();
    const monthsInvested = (now.getFullYear() - investmentDate.getFullYear()) * 12 + 
                          (now.getMonth() - investmentDate.getMonth());
    
    if (monthsInvested < 3) {
      errors.push('Investments must be held for at least 3 months before withdrawal');
    }

    // Check if withdrawal would incur penalties
    const maturityDate = new Date(investment.maturityDate);
    const totalMonths = (maturityDate.getFullYear() - investmentDate.getFullYear()) * 12 + 
                       (maturityDate.getMonth() - investmentDate.getMonth());
    
    if (monthsInvested < totalMonths * 0.5) {
      warnings.push('Early withdrawal may incur penalties');
    }

    return {
      canWithdraw: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
}

module.exports = BusinessRules;