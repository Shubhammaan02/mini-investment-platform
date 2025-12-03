// backend/src/middleware/transactionLogger.js
const { TransactionLog } = require('../models');
const AIService = require('../utils/aiService');

const transactionLogger = async (req, res, next) => {
  const startTime = Date.now();
  
  // Capture response data
  const originalSend = res.send;
  const originalJson = res.json;
  let responseBody = '';
  let responseSent = false;
  
  res.send = function(data) {
    if (!responseSent) {
      responseBody = data;
      responseSent = true;
    }
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    if (!responseSent) {
      responseBody = JSON.stringify(data);
      responseSent = true;
    }
    return originalJson.call(this, data);
  };

  res.on('finish', async () => {
    try {
      const duration = Date.now() - startTime;
      
      // Don't log health checks to reduce noise
      // if (req.path === '/health') return;
      if (req.path === '/health' || req.path === '/api') return;

      const isError = res.statusCode >= 400;
      let errorCategory = null;
      
      try {
        errorCategory = isError ? AIService.categorizeError({
          statusCode: res.statusCode,
          errorMessage: getErrorMessage(responseBody),
          endpoint: req.path
        }) : null;
      } catch (aiError) {
        console.error('AI categorization failed:', aiError.message);
        // Continue without AI categorization
      }

      await TransactionLog.create({
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        requestBody: req.method !== 'GET' && req.body ? 
          JSON.stringify(sanitizeRequestBody(req.body)).substring(0, 500) : null,
        responseBody: typeof responseBody === 'string' ? 
          responseBody.substring(0, 1000) : JSON.stringify(responseBody).substring(0, 1000),
        errorMessage: isError ? getErrorMessage(responseBody) : null,
        userAgent: req.get('User-Agent') || 'Unknown',
        ipAddress: req.ip || req.connection.remoteAddress,
        responseTime: duration,
        userId: req.user ? req.user.id : null,
        isError,
        errorCategory
      });
      
    } catch (error) {
      console.error('Transaction logging failed:', error.message);
      // Don't throw error to avoid breaking the main request
    }
  });

  next();
};

// Helper function to sanitize request body (remove passwords)
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = JSON.parse(JSON.stringify(body));
  const sensitiveFields = ['password', 'newPassword', 'currentPassword', 'token', 'otp', 'jwt'];

  const sanitizeNested = (obj) => {
    for (const key in obj) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeNested(obj[key]);
      }
    }
  };
  
  sanitizeNested(sanitized);
  return sanitized;
}

// Helper function to extract error message from response
function getErrorMessage(responseBody) {
  try {
    let parsed;
    if (typeof responseBody === 'string') {
      try {
        parsed = JSON.parse(responseBody);
      } catch {
        return responseBody.substring(0, 200);
      }
    } else {
      parsed = responseBody;
    }
    
    // Check multiple possible error message fields
    return parsed.error || parsed.message || parsed.details?.[0]?.message || 'Unknown error';
  } catch {
    return 'Unknown error';
  }
}

module.exports = transactionLogger;