// backend/src/config/migrations.js
const { sequelize, User, InvestmentProduct, Investment, TransactionLog, PasswordReset } = require('../models');

const syncDatabase = async () => {
  try {
    // Sync all models
    if (process.env.NODE_ENV === 'test') {
      await sequelize.sync({ force: true });
      console.log('Database synchronized with force (test environment)');
    } else if (process.env.NODE_ENV === 'development') {
      // Use alter instead of force to preserve data
      await sequelize.sync({ alter: true });
      console.log('Database synchronized with alter (development)');
    } else {
      // In production, don't sync automatically
      console.log('Database sync skipped in production (use migrations)');
      return;
    }

    // Seed initial data only if tables are empty
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      await seedInitialData();
    }
  } catch (error) {
    console.error('Database synchronization failed:', error);
    process.exit(1);
  }
};

const seedInitialData = async () => {
  try {
    // Check if products already exist
    const productCount = await InvestmentProduct.count();
    if (productCount === 0) {
      const products = await InvestmentProduct.bulkCreate([
        {
          name: 'Tech Growth Fund',
          description: 'High-growth technology companies portfolio',
          type: 'mutual_funds',
          riskLevel: 'high',
          yieldRate: 15.5,
          minInvestment: 1000,
          maxInvestment: 50000,
          duration: 36,
          totalUnits: 10000,
          availableUnits: 5000
        },
        {
          name: 'Government Bonds',
          description: 'Secure government bonds with fixed returns',
          type: 'bonds',
          riskLevel: 'low',
          yieldRate: 5.2,
          minInvestment: 500,
          maxInvestment: 100000,
          duration: 24,
          totalUnits: 50000,
          availableUnits: 25000
        },
        {
          name: 'Real Estate Trust',
          description: 'Commercial real estate investment trust',
          type: 'real_estate',
          riskLevel: 'medium',
          yieldRate: 8.7,
          minInvestment: 2000,
          maxInvestment: 75000,
          duration: 60,
          totalUnits: 8000,
          availableUnits: 3000
        },
        {
          name: 'Blue Chip Stocks',
          description: 'Portfolio of established large-cap companies',
          type: 'stocks',
          riskLevel: 'medium',
          yieldRate: 9.3,
          minInvestment: 500,
          maxInvestment: null,
          duration: 12,
          totalUnits: 20000,
          availableUnits: 15000
        },
        {
          name: 'Green Energy ETF',
          description: 'Renewable energy companies exchange-traded fund',
          type: 'etfs',
          riskLevel: 'high',
          yieldRate: 12.8,
          minInvestment: 100,
          maxInvestment: 25000,
          duration: 18,
          totalUnits: 15000,
          availableUnits: 8000
        }
      ]);
      console.log('Sample investment products created');
    }

    // Check if admin exists
    const adminCount = await User.count({ where: { email: 'admin@investment.com' } });
    if (adminCount === 0) {
      // Use the User model's hook to hash password automatically
      const adminUser = await User.create({
        email: 'admin@investment.com',
        password: 'Admin123!', // Will be hashed by the User model hook
        firstName: 'System',
        lastName: 'Admin',
        role: 'admin',
        riskAppetite: 'medium',
        balance: 50000.00
      });
      console.log('Admin user created:', adminUser.email);
    }
    
  } catch (error) {
    console.error('Seeding failed:', error);
  }
};

module.exports = { syncDatabase };