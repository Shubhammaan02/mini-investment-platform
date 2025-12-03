// backend/src/controllers/authController.js
const { User, PasswordReset } = require('../models');
const JWTUtils = require('../utils/jwt');
const PasswordStrengthAnalyzer = require('../utils/passwordStrength');
const emailService = require('../utils/emailService');
const { Op } = require('sequelize');

class AuthController {
  // User Signup
  static async signup(req, res) {
    try {
      const { email, password, firstName, lastName, riskAppetite } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          error: 'User with this email already exists',
        });
      }

      // Analyze password strength
      const passwordAnalysis = PasswordStrengthAnalyzer.analyzePassword(password);
      if (!passwordAnalysis.isAcceptable) {
        return res.status(400).json({
          error: 'Password is too weak',
          passwordAnalysis,
        });
      }

      // Create user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role: 'user',
        riskAppetite: riskAppetite || 'medium',
      });

      // Generate JWT token
      const authTokens = JWTUtils.generateAuthTokens(user);

      res.status(201).json({
        message: 'User created successfully',
        ...authTokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          riskAppetite: user.riskAppetite,
          balance: user.balance,
          isActive: user.isActive,
          lastLogin: user.lastLogin
        },
        passwordAnalysis, // Return password analysis for feedback
      });
    } catch (error) {
      console.error('Signup error:', error);
      const errorDetails = process.env.NODE_ENV === 'development' ? error.message : undefined;

      // Handle Sequelize validation errors
      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }

      res.status(500).json({
        error: 'Failed to create user account',
        details: errorDetails,
      });
    }
  }

  // User Login
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          error: 'Invalid email or password',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          error: 'Account is deactivated. Please contact support.',
        });
      }

      // Validate password
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid email or password',
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const authTokens = JWTUtils.generateAuthTokens(user);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token: authTokens.token,
          expiresIn: authTokens.expiresIn,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            riskAppetite: user.riskAppetite,
            balance: user.balance,
            isActive: user.isActive,
            lastLogin: user.lastLogin
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);

      const errorDetails = process.env.NODE_ENV === 'development' ? error.message : undefined;

      res.status(500).json({
        error: 'Login failed',
        details: errorDetails,
      });
    }
  }

  // Request Password Reset OTP
  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({
          message: 'If the email exists, a reset OTP has been sent',
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Set expiration (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Delete any existing OTPs for this user
      await PasswordReset.destroy({
        where: {
          userId: user.id,
          isUsed: false,
        },
      });

      // Create new OTP record
      await PasswordReset.create({
        userId: user.id,
        email: user.email,
        otp,
        expiresAt,
      });

      // Send OTP via email
      let emailSent = false;
      try {
        if (process.env.NODE_ENV === 'production' && process.env.EMAIL_HOST) {
          emailSent = await emailService.sendOTP(email, otp, user.firstName);
        } else {
          // In development or if email not configured, use dev mode
          emailSent = await emailService.sendDevOTP(email, otp, user.firstName);
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the request if email fails
        emailSent = true; // Mark as sent to continue
      }

      if (!emailSent && process.env.NODE_ENV === 'production') {
        return res.status(500).json({
          error: 'Failed to send reset email',
        });
      }

      res.json({
        message: 'If the email exists, a reset OTP has been sent',
        devNote: process.env.NODE_ENV === 'development' ? `OTP: ${otp}` : undefined,
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        error: 'Failed to process reset request',
      });
    }
  }

  // Verify OTP and Reset Password
  static async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;

      // Find valid OTP
      const resetRecord = await PasswordReset.findOne({
        where: {
          email,
          otp,
          isUsed: false,
          expiresAt: {
            [Op.gt]: new Date(),
          },
        },
        include: [{ model: User, as: 'user' }],
      });

      if (!resetRecord) {
        return res.status(400).json({
          error: 'Invalid or expired OTP',
        });
      }

      // Analyze new password strength
      const passwordAnalysis = PasswordStrengthAnalyzer.analyzePassword(newPassword);
      if (!passwordAnalysis.isAcceptable) {
        return res.status(400).json({
          error: 'New password is too weak',
          passwordAnalysis,
        });
      }

      // Update user password
      resetRecord.user.password = newPassword;
      await resetRecord.user.save();

      // Mark OTP as used
      resetRecord.isUsed = true;
      await resetRecord.save();

      res.json({
        message: 'Password reset successfully',
        passwordAnalysis,
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        error: 'Failed to reset password',
      });
    }
  }

  // Generate Strong Password
  static async generateStrongPassword(req, res) {
    try {
      const strongPassword = PasswordStrengthAnalyzer.generateStrongPassword();
      const analysis = PasswordStrengthAnalyzer.analyzePassword(strongPassword);

      res.json({
        password: strongPassword,
        analysis,
      });
    } catch (error) {
      console.error('Password generation error:', error);
      res.status(500).json({
        error: 'Failed to generate password',
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      // req.user will be set by auth middleware
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
      });

      res.json({
        user,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to fetch profile',
      });
    }
  }

  // Update user profile (including role for admins)
  static async updateProfile(req, res) {
    try {
      const { firstName, lastName, riskAppetite } = req.body;
      const userId = req.user.id;
      // const currentUserRole = req.user.role;

      // Find user
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      // Prepare update data
      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (riskAppetite !== undefined) updateData.riskAppetite = riskAppetite;
      
      // Only allow admins to update role, and prevent self-role demotion
      // if (role && currentUserRole === 'admin') {
      //   // Prevent admin from changing their own role
      //   if (userId === req.user.id) {
      //     return res.status(403).json({
      //       error: 'Cannot change your own role',
      //     });
      //   }
      //   updateData.role = role;
      // }

      // Update user
      await user.update(updateData);

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          riskAppetite: user.riskAppetite,
          balance: user.balance,
          isActive: user.isActive,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
      });
    }
  }
}

module.exports = AuthController;