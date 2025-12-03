// backend/tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');
const { User, PasswordReset } = require('../src/models');

describe('Authentication API', () => {
  let testUser;

  beforeAll(async () => {
    // Ensure database is synced
    await require('../src/config/migrations').syncDatabase();
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await User.destroy({ where: { email: testUser.email } });
    }
    await require('../src/config/database').sequelize.close();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'Test',
        lastName: 'User',
        riskAppetite: 'medium'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password');

      testUser = response.body.user;
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test2@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.error).toBe('Password is too weak');
      expect(response.body.passwordAnalysis).toBeDefined();
      expect(response.body.passwordAnalysis.strength).toBe('weak');
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'AnotherPass123!',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.error).toBe('User with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongPass123!'
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/generate-password', () => {
    it('should generate a strong password', async () => {
      const response = await request(app)
        .get('/api/auth/generate-password')
        .expect(200);

      expect(response.body.password).toBeDefined();
      expect(response.body.analysis.strength).toBe('strong');
    });
  });

  describe('Password Reset Flow', () => {
    it('should request password reset OTP', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        })
        .expect(200);

      expect(response.body.message).toContain('reset OTP has been sent');
    });

    it('should reset password with valid OTP', async () => {
      // Get the OTP from the database (in development)
      const resetRecord = await PasswordReset.findOne({
        where: { email: 'test@example.com', isUsed: false }
      });

      if (resetRecord) {
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({
            email: 'test@example.com',
            otp: resetRecord.otp,
            newPassword: 'NewStrongPass123!'
          })
          .expect(200);

        expect(response.body.message).toBe('Password reset successfully');
      }
    });
  });
});