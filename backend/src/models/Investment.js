// backend/src/models/Investment.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Investment = sequelize.define('Investment', {
  id: {
    // type: DataTypes.UUID,
    // defaultValue: DataTypes.UUIDV4,
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {                            // ADDED: Missing field
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  productId: {                         // ADDED: Missing field
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'InvestmentProducts',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  units: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currentValue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  expectedReturns: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  investmentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  maturityDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'matured', 'cancelled'),
    defaultValue: 'active'
  },
  // Add calculated fields for better performance
  totalReturn: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  returnPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  }
}, {
  // hooks: {
  //   beforeCreate: (investment) => {
  //     // Calculate initial current value and expected returns
  //     investment.currentValue = investment.amount;
  //     investment.expectedReturns = investment.amount * (investment.unitPrice / 100) * (investment.duration / 12);
  //   }
  // }
});

// Instance method to calculate current value
Investment.prototype.calculateCurrentValue = function(product) {
  if (!product || !product.duration) return this.currentValue || this.amount;
  
  const investmentDate = new Date(this.investmentDate);
  const now = new Date();
  const monthsPassed = (now.getFullYear() - investmentDate.getFullYear()) * 12 + 
                      (now.getMonth() - investmentDate.getMonth());
  
  const monthlyReturnRate = (product.yieldRate / 100) / 12;
  return parseFloat((this.amount * Math.pow(1 + monthlyReturnRate, Math.min(monthsPassed, product.duration))).toFixed(2));
};

// Instance method to update investment values
Investment.prototype.updateInvestmentValues = async function(product) {
  if (this.status === 'active' && product) {
    this.currentValue = this.calculateCurrentValue(product);
    this.totalReturn = parseFloat((this.currentValue - this.amount).toFixed(2));
    this.returnPercentage = parseFloat(((this.totalReturn / this.amount) * 100).toFixed(2));
    
    // Check if investment has matured
    if (new Date() >= new Date(this.maturityDate)) {
      this.status = 'matured';
    }
    
    await this.save();
  }
  return this;
};

module.exports = Investment;