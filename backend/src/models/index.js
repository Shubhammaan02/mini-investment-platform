// backend/src/models/index.js
// const { sequelize } = require('../config/database');

// Use test database configuration when in test environment
const sequelize = process.env.NODE_ENV === 'test' 
  ? require('../config/database.test').sequelize
  : require('../config/database').sequelize;

const User = require('./User');
const InvestmentProduct = require('./InvestmentProduct');
const Investment = require('./Investment');
const TransactionLog = require('./TransactionLog');
const PasswordReset = require('./PasswordReset');

// User Relationships
User.hasMany(Investment, { foreignKey: 'userId', as: 'investments' });
User.hasMany(TransactionLog, { foreignKey: 'userId', as: 'logs' });
User.hasMany(PasswordReset, { foreignKey: 'userId', as: 'passwordResets' });

// Investment Relationships
Investment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Investment.belongsTo(InvestmentProduct, { foreignKey: 'productId', as: 'product' });

// InvestmentProduct Relationships
InvestmentProduct.hasMany(Investment, { foreignKey: 'productId', as: 'investments' });

// TransactionLog Relationships
TransactionLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// PasswordReset Relationships
PasswordReset.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  InvestmentProduct,
  Investment,
  TransactionLog,
  PasswordReset
};