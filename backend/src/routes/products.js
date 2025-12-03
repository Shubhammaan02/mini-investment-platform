// backend/src/routes/products.js
const express = require('express');
const ProductController = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateProduct } = require('../middleware/productValidation');

const router = express.Router();

// Admin only routes
router.post('/', authenticate, requireAdmin, validateProduct('create'), ProductController.createProduct);
router.put('/:id', authenticate, requireAdmin, validateProduct('update'), ProductController.updateProduct);
router.delete('/:id', authenticate, requireAdmin, ProductController.deleteProduct);

// User routes (protected)
router.get('/recommendations', authenticate, ProductController.getRecommendedProducts);
router.get('/insights', authenticate, ProductController.getPortfolioInsights);

// Public routes
router.get('/', ProductController.getProducts);
router.get('/:id', ProductController.getProductById);

module.exports = router;