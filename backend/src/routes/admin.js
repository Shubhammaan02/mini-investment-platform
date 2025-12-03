// backend/src/routes/admin.js
const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const { TransactionLog, Investment, InvestmentProduct } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Admin dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalInvestments,
      totalProducts,
      totalTransactions,
      recentUsers,
      recentInvestments
    ] = await Promise.all([
      User.count(),
      Investment.count(),
      InvestmentProduct.count({ where: { isActive: true } }),
      TransactionLog.count(),
      User.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt']
      }),
      Investment.findAll({
        include: [
          { model: User, attributes: ['email', 'firstName', 'lastName'] },
          { model: InvestmentProduct, as: 'product', attributes: ['name'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10
      })
    ]);

    res.json({
      stats: {
        totalUsers,
        totalInvestments,
        totalProducts,
        totalTransactions
      },
      recentActivity: {
        recentUsers,
        recentInvestments: recentInvestments.map(inv => ({
          id: inv.id,
          amount: inv.amount,
          user: inv.User ? `${inv.User.firstName} ${inv.User.lastName}` : 'Unknown',
          product: inv.product ? inv.product.name : 'Unknown',
          date: inv.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalUsers: count
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (admin only)
router.patch('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent self-role modification
    if (parseInt(userId) === req.user.id) {
      return res.status(403).json({ error: 'Cannot change your own role' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ role });

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router;