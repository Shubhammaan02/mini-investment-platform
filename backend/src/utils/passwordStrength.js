// backend/src/utils/passwordStrength.js
class PasswordStrengthAnalyzer {
  static analyzePassword(password) {
    const feedback = [];
    let score = 0;

    // Length check
    if (password.length >= 12) {
      score += 2;
    } else if (password.length >= 8) {
      score += 1;
      feedback.push('🔒 Consider using at least 12 characters for better security');
    } else {
      feedback.push('❌ Password should be at least 8 characters long');
    }

    // Upper case letters
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('🔤 Include uppercase letters');
    }

    // Lower case letters
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('🔤 Include lowercase letters');
    }

    // Numbers
    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('🔢 Include numbers');
    }

    // Special characters
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('⭐ Add special characters (!@#$% etc.)');
    }

    // Common patterns to avoid
    const commonPatterns = [
      '123456', 'password', 'qwerty', 'admin', 'welcome'
    ];
    
    const lowerPassword = password.toLowerCase();
    if (commonPatterns.some(pattern => lowerPassword.includes(pattern))) {
      score -= 1;
      feedback.push('⚠️ Avoid common words and sequential patterns');
    }

    // Repeated characters
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('🔄 Avoid repeating the same character multiple times');
    }

    // Determine strength level
    let strength;
    if (score >= 5) {
      strength = 'strong';
      feedback.unshift('✅ Excellent! Your password is strong and secure');
    } else if (score >= 3) {
      strength = 'medium';
      feedback.unshift('🟡 Good start, but consider these improvements:');
    } else {
      strength = 'weak';
      feedback.unshift('🔴 Your password needs significant improvements:');
    }

    return {
      score,
      strength,
      feedback,
      isAcceptable: score >= 3
    };
  }

  static generateStrongPassword() {
    const chars = {
      uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
      lowercase: 'abcdefghjkmnpqrstuvwxyz',
      numbers: '23456789',
      symbols: '!@#$%&*'
    };

    const getRandomChar = (str) => str[Math.floor(Math.random() * str.length)];

    let password = '';
    password += getRandomChar(chars.uppercase);
    password += getRandomChar(chars.lowercase);
    password += getRandomChar(chars.numbers);
    password += getRandomChar(chars.symbols);

    // Fill remaining characters randomly
    const allChars = chars.uppercase + chars.lowercase + chars.numbers + chars.symbols;
    for (let i = password.length; i < 12; i++) {
      password += getRandomChar(allChars);
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    return password;
  }
}

module.exports = PasswordStrengthAnalyzer;