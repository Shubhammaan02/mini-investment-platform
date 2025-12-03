// backend/src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Test database connection function (add this)
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

const sequelize = new Sequelize(
  process.env.DB_NAME || 'mini_investment_platform',
  process.env.DB_USER || 'minidevuser',
  process.env.DB_PASSWORD || 'minidevpassword',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    // port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = { sequelize, testConnection };