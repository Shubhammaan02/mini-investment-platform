// backend/src/models/TransactionLog.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TransactionLog = sequelize.define('TransactionLog', {
  id: {
    // type: DataTypes.UUID,
    // defaultValue: DataTypes.UUIDV4,
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {                            // ADDED: Missing field
    type: DataTypes.INTEGER,
    allowNull: true,                   // Nullable for non-authenticated requests
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  endpoint: {
    type: DataTypes.STRING,
    allowNull: false
  },
  method: {
    type: DataTypes.ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
    allowNull: false
  },
  statusCode: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  requestBody: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responseBody: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  responseTime: {
    type: DataTypes.INTEGER,
    comment: 'Response time in milliseconds'
  },
  isError: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  errorCategory: {
    type: DataTypes.ENUM('validation', 'authentication', 'authorization', 'not_found', 'server_error', 'business_rule', 'unknown'),
    allowNull: true
  },
  errorSummary: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI-generated error summary'
  }
}, {
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['endpoint']
    },
    {
      fields: ['statusCode']
    },
    {
      fields: ['isError']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = TransactionLog;