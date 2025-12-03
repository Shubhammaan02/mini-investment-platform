// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/database.js',
    '!src/config/database.test.js',
    '!src/config/migrations.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  // Setup files after env
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // Force jest to use a single worker to avoid database conflicts
  maxWorkers: 1
};