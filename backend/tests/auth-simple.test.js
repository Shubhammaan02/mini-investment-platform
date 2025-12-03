// backend/tests/auth-simple.test.js
const request = require('supertest');

// Mock the database for simple tests
jest.mock('../src/models', () => {
  const bcrypt = require('bcryptjs');
  
  const mockUser = {
    id: 'test-id-123',
    email: 'test@example.com',
    password: bcrypt.hashSync('StrongPass123!', 12),
    firstName: 'Test',
    lastName: 'User',
    riskAppetite: 'medium',
    balance: 10000.00,
    isActive: true,
    validatePassword: async function(password) {
      return await bcrypt.compare(password, this.password);
    },
    save: jest.fn()
  };

  return {
    User: {
      findOne: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn()
    },
    PasswordReset: {
      findOne: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn()
    }
  };
});

const app = require('../src/app');

describe('Simple Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a strong password', async () => {
    const response = await request(app)
      .get('/api/auth/generate-password')
      .expect(200);

    expect(response.body.password).toBeDefined();
    expect(response.body.analysis.strength).toBe('strong');
  });

  it('health check should work', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
  });
});