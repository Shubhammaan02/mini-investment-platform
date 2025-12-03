// backend/tests/setup.js
const { sequelize } = require('../src/models');

// Global test setup
beforeAll(async () => {
  // Sync all models with test database
  await sequelize.sync({ force: true });
});

// Global test teardown
afterAll(async () => {
  // Close database connection
  await sequelize.close();
});