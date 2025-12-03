// backend/src/middleware/investmentValidation.js
const Joi = require('joi');

const investmentSchemas = {
  create: Joi.object({
    productId: Joi.number().integer().positive().required().messages({
      'number.base': 'Product ID must be a number',
      'number.positive': 'Product ID must be a positive number',
      // 'string.guid': 'Product ID must be a valid UUID',
      'any.required': 'Product ID is required'
    }),
    amount: Joi.number().positive().min(1).required().messages({
      'number.positive': 'Amount must be a positive number',
      'number.min': 'Amount must be at least $1',
      'any.required': 'Amount is required'
    })
  }),

  simulate: Joi.object({
    productId: Joi.number().integer().positive().required().messages({
      // 'string.guid': 'Product ID must be a valid UUID',
      'number.base': 'Product ID must be a number',
      'number.positive': 'Product ID must be a positive number',
      'any.required': 'Product ID is required'
    }),
    amount: Joi.number().positive().min(1).required().messages({
      'number.positive': 'Amount must be a positive number',
      'number.min': 'Amount must be at least $1',
      'any.required': 'Amount is required'
    })
  })
};

const validateInvestment = (schema) => {
  return (req, res, next) => {
    const { error } = investmentSchemas[schema].validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
};

module.exports = {
  validateInvestment
};