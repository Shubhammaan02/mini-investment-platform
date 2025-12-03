// backend/tests/investments.test.js
const request = require('supertest');
const app = require('../src/app');
const { User, InvestmentProduct, Investment } = require('../src/models');

describe('Investments API', () => {
  let userToken;
  let adminToken;
  let testProduct;
  let testUser;

  beforeAll(async () => {
    // Clean up
    await Investment.destroy({ where: {} });
    await InvestmentProduct.destroy({ where: { name: 'Test Investment Product' } });
    await User.destroy({ where: { email: ['testinvest@example.com', 'admininvest@example.com'] } });

    // Create test user
    testUser = await User.create({
      email: 'testinvest@example.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'Investor',
      balance: 10000.00
    });

    // Create admin user
    const adminUser = await User.create({
      email: 'admininvest@example.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'Invest',
      role: 'admin'
    });

    // Create test product
    testProduct = await InvestmentProduct.create({
      name: 'Test Investment Product',
      description: 'Test product for investment testing',
      type: 'bonds',
      riskLevel: 'low',
      yieldRate: 5.0,
      minInvestment: 1000,
      maxInvestment: 5000,
      duration: 12,
      totalUnits: 1000,
      availableUnits: 1000,
      isActive: true
    });

    // Login to get tokens
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testinvest@example.com',
        password: 'TestPass123!'
      });
    userToken = userLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admininvest@example.com',
        password: 'AdminPass123!'
      });
    adminToken = adminLogin.body.token;
  });

  afterAll(async () => {
    await Investment.destroy({ where: {} });
    await InvestmentProduct.destroy({ where: { id: testProduct.id } });
    await User.destroy({ where: { id: [testUser.id] } });
    
    const { sequelize } = require('../src/config/database');
    await sequelize.close();
  });

  describe('POST /api/investments/simulate', () => {
    it('should simulate investment successfully', async () => {
      const simulationData = {
        productId: testProduct.id,
        amount: 2000
      };

      const response = await request(app)
        .post('/api/investments/simulate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(simulationData)
        .expect(200);

      expect(response.body.simulation).toBeDefined();
      expect(response.body.simulation.investment.amount).toBe(2000);
      expect(response.body.simulation.returns.expectedReturns).toBeGreaterThan(0);
    });

    it('should reject simulation with insufficient balance', async () => {
      const simulationData = {
        productId: testProduct.id,
        amount: 50000
      };

      const response = await request(app)
        .post('/api/investments/simulate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(simulationData)
        .expect(400);

      expect(response.body.error).toBe('Investment simulation failed');
      expect(response.body.details).toContain('Insufficient balance');
    });
  });

  describe('POST /api/investments', () => {
    it('should create investment successfully', async () => {
      const investmentData = {
        productId: testProduct.id,
        amount: 2000
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(investmentData)
        .expect(201);

      expect(response.body.message).toBe('Investment created successfully');
      expect(response.body.investment.amount).toBe(2000);
      expect(response.body.summary.newBalance).toBe(8000); // 10000 - 2000
    });

    it('should reject investment below minimum', async () => {
      const investmentData = {
        productId: testProduct.id,
        amount: 500
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(investmentData)
        .expect(400);

      expect(response.body.error).toBe('Investment validation failed');
      expect(response.body.details).toContain('Minimum investment is $1000.00');
    });

    it('should reject investment above maximum', async () => {
      const investmentData = {
        productId: testProduct.id,
        amount: 6000
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(investmentData)
        .expect(400);

      expect(response.body.error).toBe('Investment validation failed');
      expect(response.body.details).toContain('Maximum investment is $5000.00');
    });
  });

  describe('GET /api/investments/portfolio', () => {
    it('should get user portfolio', async () => {
      const response = await request(app)
        .get('/api/investments/portfolio')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.investments).toBeInstanceOf(Array);
      expect(response.body.portfolioSummary.totalInvestments).toBe(1);
      expect(response.body.portfolioSummary.totalInvested).toBe(2000);
      expect(response.body.distributes).toBeDefined();
    });
  });

  describe('GET /api/investments/:id', () => {
    it('should get specific investment', async () => {
      // First get the investment ID from portfolio
      const portfolioResponse = await request(app)
        .get('/api/investments/portfolio')
        .set('Authorization', `Bearer ${userToken}`);

      const investmentId = portfolioResponse.body.investments[0].id;

      const response = await request(app)
        .get(`/api/investments/${investmentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.investment.id).toBe(investmentId);
      expect(response.body.analytics).toBeDefined();
    });

    it('should return 404 for non-existent investment', async () => {
      const response = await request(app)
        .get('/api/investments/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.error).toBe('Investment not found');
    });
  });

  describe('GET /api/investments/performance', () => {
    it('should get investment performance', async () => {
      const response = await request(app)
        .get('/api/investments/performance?period=6m')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.performance).toBeInstanceOf(Array);
      expect(response.body.period).toBe('6m');
      expect(response.body.summary).toBeDefined();
    });
  });
});