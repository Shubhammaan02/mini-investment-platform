// backend/tests/transactionLogs.test.js
const request = require('supertest');
const app = require('../src/app');
const { User, TransactionLog } = require('../src/models');

describe('Transaction Logs API', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;

  beforeAll(async () => {
    // Clean up
    await TransactionLog.destroy({ where: {} });
    await User.destroy({ where: { email: ['adminlogs@example.com', 'userlogs@example.com'] } });

    // Create admin user
    adminUser = await User.create({
      email: 'adminlogs@example.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'Logs',
      role: 'admin'
    });

    // Create regular user
    regularUser = await User.create({
      email: 'userlogs@example.com',
      password: 'UserPass123!',
      firstName: 'Regular',
      lastName: 'User',
      role: 'user'
    });

    // Create some test logs
    await TransactionLog.bulkCreate([
      {
        endpoint: '/api/auth/login',
        method: 'POST',
        statusCode: 200,
        responseTime: 150,
        userId: adminUser.id,
        isError: false
      },
      {
        endpoint: '/api/products',
        method: 'GET',
        statusCode: 200,
        responseTime: 200,
        userId: regularUser.id,
        isError: false
      },
      {
        endpoint: '/api/investments',
        method: 'POST',
        statusCode: 400,
        responseTime: 100,
        userId: regularUser.id,
        isError: true,
        errorMessage: 'Insufficient balance',
        errorCategory: 'business_rule'
      },
      {
        endpoint: '/api/nonexistent',
        method: 'GET',
        statusCode: 404,
        responseTime: 50,
        isError: true,
        errorMessage: 'Route not found',
        errorCategory: 'not_found'
      }
    ]);

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'adminlogs@example.com',
        password: 'AdminPass123!'
      });
    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'userlogs@example.com',
        password: 'UserPass123!'
      });
    userToken = userLogin.body.token;
  });

  afterAll(async () => {
    await TransactionLog.destroy({ where: {} });
    await User.destroy({ where: { id: [adminUser.id, regularUser.id] } });
    
    const { sequelize } = require('../src/config/database');
    await sequelize.close();
  });

  describe('GET /api/admin/logs', () => {
    it('should get logs as admin', async () => {
      const response = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.logs).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.logs.length).toBeGreaterThan(0);
    });

    it('should filter logs by error status', async () => {
      const response = await request(app)
        .get('/api/admin/logs?isError=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const allErrors = response.body.logs.every(log => log.isError === true);
      expect(allErrors).toBe(true);
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied. Admin privileges required.');
    });
  });

  describe('GET /api/admin/logs/dashboard', () => {
    it('should get dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/admin/logs/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.overview).toBeDefined();
      expect(response.body.topEndpoints).toBeInstanceOf(Array);
      expect(response.body.errorDistribution).toBeDefined();
      expect(response.body.recentErrors).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/admin/logs/errors/summary', () => {
    it('should get error summary with AI analysis', async () => {
      const response = await request(app)
        .get('/api/admin/logs/errors/summary?timeframe=24h')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.summary).toBeDefined();
      expect(response.body.statistics).toBeDefined();
      expect(response.body.categories).toBeDefined();
      expect(response.body.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/admin/logs/health', () => {
    it('should get system health report', async () => {
      const response = await request(app)
        .get('/api/admin/logs/health?timeframe=24h')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.overview).toBeDefined();
      expect(response.body.performance).toBeDefined();
      expect(response.body.issues).toBeDefined();
      expect(response.body.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/admin/logs/user/:identifier', () => {
    it('should get logs by user email', async () => {
      const response = await request(app)
        .get(`/api/admin/logs/user/${regularUser.email}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.logs).toBeInstanceOf(Array);
      expect(response.body.errorSummary).toBeDefined();
    });

    it('should get logs by user ID', async () => {
      const response = await request(app)
        .get(`/api/admin/logs/user/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.logs).toBeInstanceOf(Array);
    });
  });
});