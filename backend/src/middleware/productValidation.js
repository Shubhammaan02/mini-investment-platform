// backend/src/middleware/productValidation.js
const Joi = require('joi');

const productSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      'string.min': 'Product name must be at least 3 characters long',
      'any.required': 'Product name is required'
    }),
    type: Joi.string().valid('stocks', 'bonds', 'mutual_funds', 'etfs', 'real_estate').required().messages({
      'any.only': 'Type must be one of: stocks, bonds, mutual_funds, etfs, real_estate',
      'any.required': 'Product type is required'
    }),
    riskLevel: Joi.string().valid('low', 'medium', 'high').required().messages({
      'any.only': 'Risk level must be one of: low, medium, high',
      'any.required': 'Risk level is required'
    }),
    yieldRate: Joi.number().min(0).max(100).required().messages({
      'number.min': 'Yield rate cannot be negative',
      'number.max': 'Yield rate cannot exceed 100%',
      'any.required': 'Yield rate is required'
    }),
    minInvestment: Joi.number().min(1).required().messages({
      'number.min': 'Minimum investment must be at least $1',
      'any.required': 'Minimum investment is required'
    }),
    maxInvestment: Joi.number().min(Joi.ref('minInvestment')).optional().allow(null).messages({
      'number.min': 'Maximum investment must be greater than or equal to minimum investment'
    }),
    duration: Joi.number().min(1).max(360).required().messages({
      'number.min': 'Duration must be at least 1 month',
      'number.max': 'Duration cannot exceed 360 months',
      'any.required': 'Duration is required'
    }),
    totalUnits: Joi.number().min(1).required().messages({
      'number.min': 'Total units must be at least 1',
      'any.required': 'Total units is required'
    })
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    type: Joi.string().valid('stocks', 'bonds', 'mutual_funds', 'etfs', 'real_estate').optional(),
    riskLevel: Joi.string().valid('low', 'medium', 'high').optional(),
    yieldRate: Joi.number().min(0).max(100).optional(),
    minInvestment: Joi.number().min(1).optional(),
    maxInvestment: Joi.number().min(Joi.ref('minInvestment')).optional().allow(null),
    duration: Joi.number().min(1).max(360).optional(),
    totalUnits: Joi.number().min(1).optional(),
    availableUnits: Joi.number().min(0).optional(),
    isActive: Joi.boolean().optional()
  })
};

const validateProduct = (schema) => {
  return (req, res, next) => {
    const { error } = productSchemas[schema].validate(req.body, { abortEarly: false });
    
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
  validateProduct
};