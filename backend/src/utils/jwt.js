// backend/src/utils/jwt.js
const jwt = require('jsonwebtoken');

class JWTUtils {
  static generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static generateAuthTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const token = this.generateToken(payload);

    return {
      token,
      expiresIn: process.env.JWT_EXPIRES_IN,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        riskAppetite: user.riskAppetite,
        balance: user.balance,
      },
    };
  }
}

module.exports = JWTUtils;