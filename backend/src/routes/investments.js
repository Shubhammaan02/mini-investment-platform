// backend/src/routes/investments.js
const express = require('express');
const InvestmentController = require('../controllers/investmentController');
const { authenticate } = require('../middleware/auth');
const { validateInvestment } = require('../middleware/investmentValidation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Investment operations
router.post('/', validateInvestment('create'), InvestmentController.createInvestment);
router.post('/simulate', validateInvestment('simulate'), InvestmentController.simulateInvestment);

// Portfolio management
router.get('/portfolio', InvestmentController.getPortfolio);
router.get('/performance', InvestmentController.getInvestmentPerformance);
router.get('/:id', InvestmentController.getInvestment);

module.exports = router;