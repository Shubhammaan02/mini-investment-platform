// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { syncDatabase } = require('./config/migrations');
const { sequelize } = require('./models');
const { TransactionLog, User, InvestmentProduct, Investment } = require('./models');
require('dotenv').config();

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Transaction logging middleware - ADD THIS
app.use(require('./middleware/transactionLogger'));

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    const dbStatus = 'connected';
    
    // Get system statistics
    const [
      totalUsers,
      totalProducts,
      totalInvestments,
      totalLogs,
      errorLogs
    ] = await Promise.all([
      User.count(),
      InvestmentProduct.count({ where: { isActive: true } }),
      Investment.count(),
      TransactionLog.count(),
      TransactionLog.count({ where: { isError: true } })
    ]);

    // Get recent activity
    const recentLogs = await TransactionLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['endpoint', 'method', 'statusCode', 'responseTime', 'createdAt']
    });

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Mini Investment Platform API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      statistics: {
        users: totalUsers,
        products: totalProducts,
        investments: totalInvestments,
        logs: totalLogs,
        errors: errorLogs,
        errorRate: totalLogs > 0 ? parseFloat(((errorLogs / totalLogs) * 100).toFixed(2)) : 0
      },
      recentActivity: recentLogs.map(log => ({
        endpoint: log.endpoint,
        method: log.method,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        timestamp: log.createdAt
      })),
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      }
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'Mini Investment Platform API',
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: 'Health check failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Mini Investment Platform API',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    endpoints: {
      api: '/api',
      health: '/health',
      docs: '/api/docs (coming soon)'
    }
  });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/admin/logs', require('./routes/transactionLogs'));
app.use('/api/admin', require('./routes/admin'));

// Add a welcome message for API root
app.get('/api', (req, res) => {
  res.json({
    message: 'Mini Investment Platform API',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    endpoints: {
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password',
        generatePassword: 'GET /api/auth/generate-password'
      },
      products: {
        getProducts: 'GET /api/products',
        getProduct: 'GET /api/products/:id',
        getRecommendations: 'GET /api/products/recommendations (protected)',
        getInsights: 'GET /api/products/insights (protected)',
        createProduct: 'POST /api/products (admin)',
        updateProduct: 'PUT /api/products/:id (admin)',
        deleteProduct: 'DELETE /api/products/:id (admin)'
      },
      investments: {
        create: 'POST /api/investments (protected)',
        simulate: 'POST /api/investments/simulate (protected)',
        getPortfolio: 'GET /api/investments/portfolio (protected)',
        getPerformance: 'GET /api/investments/performance (protected)',
        getInvestment: 'GET /api/investments/:id (protected)'
      },
      admin: {
        logs: {
          getLogs: 'GET /api/admin/logs (admin)',
          getDashboard: 'GET /api/admin/logs/dashboard (admin)',
          getHealth: 'GET /api/admin/logs/health (admin)',
          getErrorSummary: 'GET /api/admin/logs/errors/summary (admin)',
          getUserLogs: 'GET /api/admin/logs/user/:identifier (admin)',
          cleanupLogs: 'DELETE /api/admin/logs/cleanup (admin)'
        }
      },
      health: 'GET /health',
      root: 'GET /'
    },
    documentation: 'Visit /api/docs for detailed API documentation (coming soon)'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Please provide a valid authentication token'
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details
    });
  }

  // Handle Sequelize errors
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message
    }));
    return res.status(400).json({
      error: 'Database validation failed',
      details: errors
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      root: 'GET /',
      api: 'GET /api',
      health: 'GET /health',
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (protected)',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password',
        generatePassword: 'GET /api/auth/generate-password'
      }
    },
    tip: 'Check the /api endpoint for complete API documentation'
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Starting Mini Investment Platform...');
    console.log('📦 Environment:', process.env.NODE_ENV);

    // Only sync with main database if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      await syncDatabase();
    }

    // await syncDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📚 API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);

      if (process.env.NODE_ENV !== 'test') {
        console.log(`💾 Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
      }

      console.log('\n🔑 Available Auth Endpoints:');
      console.log('   POST /api/auth/signup');
      console.log('   POST /api/auth/login');
      console.log('   GET  /api/auth/profile (protected)');
      console.log('   POST /api/auth/forgot-password');
      console.log('   POST /api/auth/reset-password');
      console.log('   GET  /api/auth/generate-password');

    });
  } catch (error) {
    console.error('\n❌ Failed to start server:', error.message);
    if (process.env.NODE_ENV !== 'test') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Check if MySQL is running');
      console.log('   2. Verify database credentials in .env file');
      console.log('   3. Ensure database "investment_platform" exists');
      console.log('   4. Check if port 3306 is available');
    }
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Server terminated');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🛑 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🛑 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

module.exports = app;