// backend/src/controllers/transactionLogController.js
const { TransactionLog, User } = require('../models');
const AIService = require('../utils/aiService');
const { Op } = require('sequelize');

class TransactionLogController {
  // Get all logs with filtering and pagination
  static async getLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        method,
        statusCode,
        isError,
        errorCategory,
        userId,
        startDate,
        endDate,
        sortBy = 'createdAt',
        order = 'DESC'
      } = req.query;

      const where = {};
      const userWhere = {};

      // Apply filters
      if (search) {
        where[Op.or] = [
          { endpoint: { [Op.like]: `%${search}%` } },
          { errorMessage: { [Op.like]: `%${search}%` } },
          { ipAddress: { [Op.like]: `%${search}%` } }
        ];
      }

      if (method) where.method = method;
      if (statusCode) where.statusCode = parseInt(statusCode);
      if (isError !== undefined) where.isError = isError === 'true';
      if (errorCategory) where.errorCategory = errorCategory;
      if (userId) where.userId = userId;

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }

      // User search
      if (search) {
        const users = await User.findAll({
          where: {
            [Op.or]: [
              { email: { [Op.like]: `%${search}%` } },
              { firstName: { [Op.like]: `%${search}%` } },
              { lastName: { [Op.like]: `%${search}%` } }
            ]
          },
          attributes: ['id']
        });
        
        if (users.length > 0) {
          where[Op.or] = [
            ...(where[Op.or] || []),
            { userId: users.map(u => u.id) }
          ];
        }
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: logs } = await TransactionLog.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
          required: false
        }],
        order: [[sortBy, order.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalLogs: count,
          hasNext: offset + logs.length < count,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          search,
          method,
          statusCode,
          isError,
          errorCategory,
          userId,
          startDate,
          endDate
        }
      });

    } catch (error) {
      console.error('Get logs error:', error);
      res.status(500).json({
        error: 'Failed to fetch transaction logs'
      });
    }
  }

  // Get logs by user ID or email
  static async getLogsByUser(req, res) {
    try {
      const { identifier } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Check if identifier is email or ID
      let user;
      if (identifier.includes('@')) {
        user = await User.findOne({ where: { email: identifier } });
      } else {
        user = await User.findByPk(identifier);
      }

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: logs } = await TransactionLog.findAndCountAll({
        where: { userId: user.id },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      // Generate error summary for this user
      const errorLogs = logs.filter(log => log.isError);
      const errorSummary = AIService.generateErrorSummary(errorLogs);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        logs,
        errorSummary,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalLogs: count,
          errorLogs: errorLogs.length,
          successRate: count > 0 ? ((count - errorLogs.length) / count * 100).toFixed(2) : 100
        }
      });

    } catch (error) {
      console.error('Get user logs error:', error);
      res.status(500).json({
        error: 'Failed to fetch user transaction logs'
      });
    }
  }

  // Get error summary with AI analysis
  static async getErrorSummary(req, res) {
    try {
      const { timeframe = '24h', limit = 1000 } = req.query;

      // Calculate time range
      const now = new Date();
      let startTime;
      
      switch (timeframe) {
        case '1h':
          startTime = new Date(now - 60 * 60 * 1000);
          break;
        case '6h':
          startTime = new Date(now - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now - 24 * 60 * 60 * 1000);
      }

      const errorLogs = await TransactionLog.findAll({
        where: {
          isError: true,
          createdAt: {
            [Op.gte]: startTime
          }
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
          required: false
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      });

      const summary = AIService.generateErrorSummary(errorLogs);

      res.json({
        timeframe: {
          start: startTime,
          end: now,
          range: timeframe
        },
        ...summary
      });

    } catch (error) {
      console.error('Get error summary error:', error);
      res.status(500).json({
        error: 'Failed to generate error summary'
      });
    }
  }

  // Get system health report
  static async getSystemHealth(req, res) {
    try {
      const { timeframe = '24h', limit = 5000 } = req.query;

      // Calculate time range
      const now = new Date();
      let startTime;
      
      switch (timeframe) {
        case '1h':
          startTime = new Date(now - 60 * 60 * 1000);
          break;
        case '6h':
          startTime = new Date(now - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now - 24 * 60 * 60 * 1000);
      }

      const logs = await TransactionLog.findAll({
        where: {
          createdAt: {
            [Op.gte]: startTime
          }
        },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      });

      const healthReport = AIService.generateSystemHealthReport(logs, timeframe);

      res.json(healthReport);

    } catch (error) {
      console.error('Get system health error:', error);
      res.status(500).json({
        error: 'Failed to generate system health report'
      });
    }
  }

  // Get dashboard statistics
  static async getDashboardStats(req, res) {
    try {
      const now = new Date();
      const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);

      // Get total counts
      const totalLogs = await TransactionLog.count();
      const totalErrors = await TransactionLog.count({ where: { isError: true } });
      const totalUsers = await User.count();

      // Get 24h stats
      const logs24h = await TransactionLog.count({
        where: { createdAt: { [Op.gte]: last24Hours } }
      });
      
      const errors24h = await TransactionLog.count({
        where: { 
          isError: true,
          createdAt: { [Op.gte]: last24Hours }
        }
      });

      // Get top endpoints
      const topEndpoints = await TransactionLog.findAll({
        attributes: [
          'endpoint',
          [TransactionLog.sequelize.fn('COUNT', TransactionLog.sequelize.col('id')), 'requestCount'],
          [TransactionLog.sequelize.fn('AVG', TransactionLog.sequelize.col('responseTime')), 'avgResponseTime'],
          [TransactionLog.sequelize.fn('SUM', TransactionLog.sequelize.literal('CASE WHEN isError THEN 1 ELSE 0 END')), 'errorCount']
        ],
        group: ['endpoint'],
        order: [[TransactionLog.sequelize.literal('requestCount'), 'DESC']],
        limit: 10,
        raw: true
      });

      // Get error distribution
      const errorDistribution = await TransactionLog.findAll({
        attributes: [
          'errorCategory',
          [TransactionLog.sequelize.fn('COUNT', TransactionLog.sequelize.col('id')), 'count']
        ],
        where: { isError: true },
        group: ['errorCategory'],
        raw: true
      });

      // Get recent errors
      const recentErrors = await TransactionLog.findAll({
        where: { isError: true },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email'],
          required: false
        }],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      res.json({
        overview: {
          totalLogs,
          totalErrors,
          totalUsers,
          logs24h,
          errors24h,
          errorRate24h: logs24h > 0 ? ((errors24h / logs24h) * 100).toFixed(2) : 0
        },
        topEndpoints: topEndpoints.map(ep => ({
          endpoint: ep.endpoint,
          requestCount: parseInt(ep.requestCount),
          avgResponseTime: parseFloat(ep.avgResponseTime || 0).toFixed(2),
          errorCount: parseInt(ep.errorCount),
          errorRate: ((parseInt(ep.errorCount) / parseInt(ep.requestCount)) * 100).toFixed(2)
        })),
        errorDistribution: errorDistribution.reduce((acc, item) => {
          if (item.errorCategory) {
            acc[item.errorCategory] = parseInt(item.count);
          }
          return acc;
        }, {}),
        recentErrors: recentErrors.map(error => ({
          id: error.id,
          endpoint: error.endpoint,
          method: error.method,
          statusCode: error.statusCode,
          errorMessage: error.errorMessage,
          user: error.user ? { email: error.user.email } : null,
          timestamp: error.createdAt
        }))
      });

    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch dashboard statistics'
      });
    }
  }

  // Delete old logs (admin only - cleanup)
  static async cleanupLogs(req, res) {
    try {
      const { olderThanDays = 30 } = req.body;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));

      const deletedCount = await TransactionLog.destroy({
        where: {
          createdAt: {
            [Op.lt]: cutoffDate
          }
        }
      });

      res.json({
        message: `Successfully deleted ${deletedCount} logs older than ${olderThanDays} days`,
        deletedCount,
        cutoffDate
      });

    } catch (error) {
      console.error('Cleanup logs error:', error);
      res.status(500).json({
        error: 'Failed to cleanup logs'
      });
    }
  }
}

module.exports = TransactionLogController;