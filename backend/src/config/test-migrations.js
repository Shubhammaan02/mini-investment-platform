// backend/src/config/test-migrations.js
const { sequelize } = require('../models');

const syncTestDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('✅ Test database synchronized successfully');
    return true;
  } catch (error) {
    console.error('❌ Test database synchronization failed:', error.message);
    return false;
  }
};

module.exports = { syncTestDatabase };