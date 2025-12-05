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

// ========== CRITICAL FIXES FOR RENDER ==========

// 1. Trust Render's proxy (IMPORTANT for HTTPS redirects)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // max: 100,
  max: process.env.NODE_ENV === 'production' ? 200 : 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  skipSuccessfulRequests: false,
  legacyHeaders: false,
  standardHeaders: true // Use standard 'RateLimit-*' headers
});

// 3. CORS Configuration - Fix for Render
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://investment-platform-frontend-live.onrender.com',
      'http://localhost:3000'
    ];

    // In production, check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
  maxAge: 600, // Cache preflight requests for 10 minutes
  preflightContinue: false
};

// 4. HTTPS Redirect Middleware (preserves POST method)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Check if request is HTTP and not localhost
    if (req.headers['x-forwarded-proto'] !== 'https' && 
        req.hostname !== 'localhost' && 
        !req.hostname.includes('localhost')) {
      // Use 307 Temporary Redirect (preserves POST method)
      return res.redirect(307, `https://${req.headers.host}${req.originalUrl}`);
    }
    next();
  });
}

// ========== MIDDLEWARE SETUP ==========

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS (apply before other middleware)
app.use(cors(corsOptions));

// Handle OPTIONS requests for CORS preflight
app.options('*', cors(corsOptions));

// Rate limiting (apply after CORS but before body parsing)
app.use('/api/', limiter);

// Body parsing middleware (CRITICAL: Must be before routes)
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Middleware
// app.use(helmet());
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));
// app.use(limiter);
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log(`   Headers:`, {
    'content-type': req.headers['content-type'],
    'x-forwarded-proto': req.headers['x-forwarded-proto'],
    'host': req.headers['host']
  });
  console.log(`   Body keys:`, Object.keys(req.body));
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
      },
      renderInfo: {
        isProduction: process.env.NODE_ENV === 'production',
        port: process.env.PORT,
        nodeVersion: process.version
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

// Add a POST test endpoint for debugging
app.post('/api/test-post', (req, res) => {
  console.log('Test POST received:', {
    method: req.method,
    body: req.body,
    headers: req.headers
  });
  res.json({ 
    message: 'POST request successful',
    method: req.method,
    bodyReceived: req.body,
    timestamp: new Date().toISOString()
  });
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
      testPost: 'POST /api/test-post',
      docs: '/api/docs (coming soon)'
    },
    renderFix: 'POST requests should now work correctly'
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
      test: 'POST /api/test-post',
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

  // Handle CORS errors
  if (error.name === 'CorsError') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Cross-origin request blocked'
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    requestMethod: req.method,
    requestUrl: req.originalUrl
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.warn(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      root: 'GET /',
      api: 'GET /api',
      health: 'GET /health',
      testPost: 'POST /api/test-post',
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
    console.log('🔧 Configuration:', {
      PORT: process.env.PORT,
      DB_HOST: process.env.DB_HOST ? `${process.env.DB_HOST.substring(0, 20)}...` : 'Not set',
      NODE_ENV: process.env.NODE_ENV,
      TRUST_PROXY: app.get('trust proxy')
    });

    // Only sync with main database if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      await syncDatabase();
    }

    // await syncDatabase();

    // Test database connection
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection established successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      console.log('💡 Troubleshooting database:');
      console.log('   - Check DB_HOST:', process.env.DB_HOST);
      console.log('   - Check DB_PORT:', process.env.DB_PORT);
      console.log('   - Check DB_NAME:', process.env.DB_NAME);
      console.log('   - Check DB_USER:', process.env.DB_USER);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📚 API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🧪 Test POST endpoint: POST http://localhost:${PORT}/api/test-post`);

      // if (process.env.NODE_ENV !== 'test') {
      //   console.log(`💾 Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
      // }

      if (process.env.NODE_ENV === 'production') {
        console.log(`🌍 Production URL: https://investment-platform-frontend-live.onrender.com`);
      }

      console.log('\n🔑 Available Auth Endpoints:');
      console.log('   POST /api/auth/signup');
      console.log('   POST /api/auth/login');
      console.log('   GET  /api/auth/profile (protected)');
      console.log('   POST /api/auth/forgot-password');
      console.log('   POST /api/auth/reset-password');
      console.log('   GET  /api/auth/generate-password');

      console.log('\n🔧 POST Request Fix Applied:');
      console.log('   - trust proxy enabled');
      console.log('   - HTTPS redirect with 307 status (preserves POST method)');
      console.log('   - Enhanced CORS configuration');
    });
  } catch (error) {
    console.error('\n❌ Failed to start server:', error.message);
    console.error('Stack:', error.stack);
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
  if (sequelize) {
    await sequelize.close();
    console.log('✅ Database connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Server terminated');
  if (sequelize) {
    await sequelize.close();
  }
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
