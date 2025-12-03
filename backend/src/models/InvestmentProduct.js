// backend/src/models/InvestmentProduct.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvestmentProduct = sequelize.define('InvestmentProduct', {
  id: {
    // type: DataTypes.UUID,
    // defaultValue: DataTypes.UUIDV4,
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('stocks', 'bonds', 'mutual_funds', 'etfs', 'real_estate'),
    allowNull: false
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false
  },
  yieldRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: 'Annual yield rate in percentage'
  },
  minInvestment: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  maxInvestment: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Investment duration in months'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  totalUnits: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  availableUnits: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  indexes: [
    {
      fields: ['riskLevel']
    },
    {
      fields: ['type']
    },
    {
      fields: ['yieldRate']
    }
  ]
});

module.exports = InvestmentProduct;