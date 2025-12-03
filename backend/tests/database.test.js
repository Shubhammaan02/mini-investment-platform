// backend/src/config/database.test.js
const { Sequelize } = require('sequelize');

// Use SQLite for testing to avoid MySQL connection issues
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:', // Use in-memory SQLite for tests
  logging: false, // Disable logging during tests
  pool: {
    max: 1,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Test database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the test database:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };