// backend/src/routes/transactionLogs.js
const express = require('express');
const TransactionLogController = require('../controllers/transactionLogController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require admin privileges
router.use(authenticate);
router.use(requireAdmin);

// Log management endpoints
router.get('/', TransactionLogController.getLogs);
router.get('/dashboard', TransactionLogController.getDashboardStats);
router.get('/health', TransactionLogController.getSystemHealth);
router.get('/errors/summary', TransactionLogController.getErrorSummary);
router.get('/user/:identifier', TransactionLogController.getLogsByUser);
router.delete('/cleanup', TransactionLogController.cleanupLogs);

module.exports = router;