// backend/src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'defaultdb',
  process.env.DB_USER || 'avnadmin',
  process.env.DB_PASSWORD || 'AVNS_Wu_7l2iGVv-gVTmPkS6',
  {
    host: process.env.DB_HOST || 'mysql-172eee34-maanshubham002-63fc.j.aivencloud.com',
    port: parseInt(process.env.DB_PORT) || '17724',
    // port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    // IMPORTANT: Aiven MySQL requires SSL
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false   // can set false if errors come
      }
    },
    
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

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

module.exports = { sequelize, testConnection };
