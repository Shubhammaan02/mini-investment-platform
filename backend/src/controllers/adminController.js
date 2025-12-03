// backend/src/controllers/adminController.js
const getSystemMetrics = async (req, res) => {
  try {
    const { User, Investment, InvestmentProduct, TransactionLog } = require('../models');
    
    // Parallel database queries for performance
    const [
      totalUsers,
      totalInvestments,
      totalProducts,
      activeUsers,
      totalInvestmentAmount,
      systemHealth,
      recentErrors
    ] = await Promise.all([
      User.count(),
      Investment.count(),
      InvestmentProduct.count({ where: { isActive: true } }),
      User.count({ where: { isActive: true } }),
      Investment.sum('amount'),
      checkSystemHealth(),
      TransactionLog.findAll({
        where: { statusCode: { [Op.gte]: 400 } },
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, attributes: ['email', 'firstName', 'lastName'] }]
      })
    ]);

    const metrics = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisWeek: await getNewUsersThisWeek()
      },
      investments: {
        total: totalInvestments,
        totalAmount: totalInvestmentAmount || 0,
        averageInvestment: totalInvestments > 0 ? totalInvestmentAmount / totalInvestments : 0
      },
      products: {
        total: totalProducts,
        active: await InvestmentProduct.count({ where: { isActive: true } })
      },
      system: systemHealth,
      recentErrors: recentErrors.map(log => ({
        id: log.id,
        endpoint: log.endpoint,
        method: log.method,
        statusCode: log.statusCode,
        errorMessage: log.errorMessage,
        user: log.User ? log.User.email : 'System',
        timestamp: log.createdAt
      }))
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('System metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system metrics'
    });
  }
};

const getNewUsersThisWeek = async () => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const { User } = require('../models');
  return await User.count({
    where: {
      createdAt: {
        [Op.gte]: startOfWeek
      }
    }
  });
};

const checkSystemHealth = async () => {
  const { sequelize } = require('../models');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    
    // Check database performance
    const dbQueryTime = Date.now();
    await sequelize.query('SELECT 1');
    const dbResponseTime = Date.now() - dbQueryTime;
    
    return {
      database: 'healthy',
      databaseResponseTime: `${dbResponseTime}ms`,
      server: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  } catch (error) {
    return {
      database: 'unhealthy',
      server: 'healthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};
