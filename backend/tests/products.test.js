// backend/tests/products.test.js
const request = require('supertest');
const app = require('../src/app');
const { User, InvestmentProduct } = require('../src/models');

describe('Products API', () => {
  let adminToken;
  let userToken;
  let testProduct;

  beforeAll(async () => {
    // Clean up any existing test data
    await InvestmentProduct.destroy({ where: { name: 'Test Product' } });
    await User.destroy({ where: { email: 'admin@test.com' } });
    await User.destroy({ where: { email: 'user@test.com' } });

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@test.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    
    // Create regular user
    const regularUser = await User.create({
      email: 'user@test.com',
      password: 'UserPass123!',
      firstName: 'Regular',
      lastName: 'User',
      role: 'user'
    });

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'AdminPass123!'
      });
    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'UserPass123!'
      });
    userToken = userLogin.body.token;
  });

  afterAll(async () => {
    await InvestmentProduct.destroy({ where: { name: 'Test Product' } });
    await User.destroy({ where: { email: ['admin@test.com', 'user@test.com'] } });
    
    const { sequelize } = require('../src/config/database');
    await sequelize.close();
  });

  describe('POST /api/products (admin only)', () => {
    it('should create a new product as admin', async () => {
      const productData = {
        name: 'Test Product',
        type: 'stocks',
        riskLevel: 'medium',
        yieldRate: 8.5,
        minInvestment: 1000,
        maxInvestment: 50000,
        duration: 24,
        totalUnits: 10000
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.message).toBe('Product created successfully');
      expect(response.body.product.name).toBe(productData.name);
      expect(response.body.product.description).toBeDefined();
      expect(response.body.product.availableUnits).toBe(productData.totalUnits);

      testProduct = response.body.product;
    });

    it('should reject product creation by non-admin', async () => {
      const productData = {
        name: 'Test Product 2',
        type: 'bonds',
        riskLevel: 'low',
        yieldRate: 5.0,
        minInvestment: 500,
        duration: 12,
        totalUnits: 5000
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(productData)
        .expect(403);

      expect(response.body.error).toBe('Access denied. Admin privileges required.');
    });
  });

  describe('GET /api/products', () => {
    it('should get all products without authentication', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.products).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter products by type', async () => {
      const response = await request(app)
        .get('/api/products?type=stocks')
        .expect(200);

      const allStocks = response.body.products.every(p => p.type === 'stocks');
      expect(allStocks).toBe(true);
    });
  });

  describe('GET /api/products/recommendations', () => {
    it('should get product recommendations for user', async () => {
      const response = await request(app)
        .get('/api/products/recommendations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.recommendations).toBeInstanceOf(Array);
      expect(response.body.userRiskAppetite).toBe('medium');
    });
  });

  describe('PUT /api/products/:id (admin only)', () => {
    it('should update product as admin', async () => {
      const updates = { yieldRate: 9.0 };

      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.message).toBe('Product updated successfully');
      expect(response.body.product.yieldRate).toBe(9.0);
    });
  });

  describe('DELETE /api/products/:id (admin only)', () => {
    it('should soft delete product as admin', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Product deleted successfully');

      // Verify product is soft deleted
      const getResponse = await request(app)
        .get(`/api/products/${testProduct.id}`)
        .expect(404);

      expect(getResponse.body.error).toBe('Product not found');
    });
  });
});