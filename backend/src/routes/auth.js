// backend/src/routes/auth.js
const express = require('express');
const AuthController = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/signup', validate('signup'), AuthController.signup);
router.post('/login', validate('login'), AuthController.login);
router.post('/forgot-password', validate('requestReset'), AuthController.requestPasswordReset);
router.post('/reset-password', validate('resetPassword'), AuthController.resetPassword);
router.get('/generate-password', AuthController.generateStrongPassword);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);

module.exports = router;