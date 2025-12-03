// backend/src/controllers/productController.js
const { InvestmentProduct, Investment } = require('../models');
const AIService = require('../utils/aiService');
const { Op } = require('sequelize');

class ProductController {
  // Admin: Create product with AI description
  static async createProduct(req, res) {
    try {
      const {
        name,
        type,
        riskLevel,
        yieldRate,
        minInvestment,
        maxInvestment,
        duration,
        totalUnits
      } = req.body;

      // Validate required fields
      const errors = [];
      if (!name) errors.push({ field: 'name', message: 'Product name is required' });
      if (!type || !['stocks', 'bonds', 'mutual_funds', 'etfs', 'real_estate'].includes(type)) {
        errors.push({ field: 'type', message: 'Valid product type is required' });
      }
      if (!riskLevel || !['low', 'medium', 'high'].includes(riskLevel)) {
        errors.push({ field: 'riskLevel', message: 'Valid risk level is required' });
      }
      if (!yieldRate || yieldRate < 0 || yieldRate > 100) {
        errors.push({ field: 'yieldRate', message: 'Yield rate must be between 0 and 100' });
      }
      if (!minInvestment || minInvestment <= 0) {
        errors.push({ field: 'minInvestment', message: 'Minimum investment must be positive' });
      }
      if (maxInvestment && maxInvestment < minInvestment) {
        errors.push({ field: 'maxInvestment', message: 'Maximum investment must be greater than minimum' });
      }
      if (!duration || duration <= 0 || duration > 360) {
        errors.push({ field: 'duration', message: 'Duration must be between 1 and 360 months' });
      }
      if (!totalUnits || totalUnits <= 0) {
        errors.push({ field: 'totalUnits', message: 'Total units must be positive' });
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }

      // Generate AI description
      let description;
      try {
        description = AIService.generateProductDescription({
          name,
          type,
          riskLevel,
          yieldRate: parseFloat(yieldRate),
          minInvestment: parseFloat(minInvestment),
          maxInvestment: maxInvestment ? parseFloat(maxInvestment) : null,
          duration: parseInt(duration)
        });
      } catch (aiError) {
        console.warn('AI description generation failed, using fallback:', aiError.message);
        description = `${name} - A ${riskLevel} risk ${type.replace('_', ' ')} investment with ${yieldRate}% annual yield.`;
      }

      const product = await InvestmentProduct.create({
        name,
        description,
        type,
        riskLevel,
        yieldRate: parseFloat(parseFloat(yieldRate).toFixed(2)),
        minInvestment: parseFloat(parseFloat(minInvestment).toFixed(2)),
        maxInvestment: maxInvestment ? parseFloat(parseFloat(maxInvestment).toFixed(2)) : null,
        duration: parseInt(duration),
        totalUnits: parseInt(totalUnits),
        availableUnits: parseInt(totalUnits),
        isActive: true
      });

      res.status(201).json({
        message: 'Product created successfully',
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          type: product.type,
          riskLevel: product.riskLevel,
          yieldRate: product.yieldRate,
          minInvestment: product.minInvestment,
          maxInvestment: product.maxInvestment,
          duration: product.duration,
          totalUnits: product.totalUnits,
          availableUnits: product.availableUnits,
          isActive: product.isActive,
          createdAt: product.createdAt
        }
      });
    } catch (error) {
      console.error('Create product error:', error);

      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        return res.status(400).json({
          error: 'Database validation failed',
          details: errors
        });
      }

      res.status(500).json({
        error: 'Failed to create product',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Admin: Update product
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const product = await InvestmentProduct.findByPk(id);
      if (!product) {
        return res.status(404).json({
          error: 'Product not found'
        });
      }

      // Regenerate description if key fields are updated
      const descriptionFields = ['name', 'type', 'riskLevel', 'yieldRate', 'minInvestment', 'maxInvestment', 'duration'];
      const shouldUpdateDescription = descriptionFields.some(field => field in updates);

      if (shouldUpdateDescription) {
        updates.description = AIService.generateProductDescription({
          name: updates.name || product.name,
          type: updates.type || product.type,
          riskLevel: updates.riskLevel || product.riskLevel,
          yieldRate: updates.yieldRate || product.yieldRate,
          minInvestment: updates.minInvestment || product.minInvestment,
          maxInvestment: updates.maxInvestment || product.maxInvestment,
          duration: updates.duration || product.duration
        });
      }

      await product.update(updates);

      res.json({
        message: 'Product updated successfully',
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          type: product.type,
          riskLevel: product.riskLevel,
          yieldRate: product.yieldRate,
          minInvestment: product.minInvestment,
          maxInvestment: product.maxInvestment,
          duration: product.duration,
          totalUnits: product.totalUnits,
          availableUnits: product.availableUnits,
          isActive: product.isActive,
          updatedAt: product.updatedAt
        }
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        error: 'Failed to update product'
      });
    }
  }

  // Admin: Delete product (soft delete)
  static async deleteProduct(req, res) {
    const transaction = await require('../config/database').sequelize.transaction();
    try {
      const { id } = req.params;

      // const product = await InvestmentProduct.findByPk(id);
      // if (!product) {
      //   return res.status(404).json({
      //     error: 'Product not found'
      //   });
      // }

      const product = await InvestmentProduct.findByPk(id, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Product not found'
        });
      }

      // Check if there are active investments in this product
      const activeInvestments = await Investment.count({
        where: { 
          productId: id,
          status: 'active'
        },
        transaction
      });

      if (activeInvestments > 0) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Cannot delete product with active investments',
          details: `There are ${activeInvestments} active investments in this product`
        });
      }

      // Soft delete by setting isActive to false
      // await product.update({ isActive: false });
      await product.update({ isActive: false }, { transaction });
      await transaction.commit();

      res.json({
        message: 'Product deleted successfully'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Delete product error:', error);
      res.status(500).json({
        error: 'Failed to delete product'
      });
    }
  }

  // Get all active products for users
  static async getProducts(req, res) {
    try {
      const { 
        type, 
        riskLevel, 
        minYield, 
        maxYield, 
        minInvestment,
        maxInvestment,
        search,
        availableOnly = 'true',
        sortBy = 'createdAt', 
        order = 'DESC',
        page = 1,
        limit = 10
      } = req.query;

      // Validate and sanitize inputs
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(Math.max(1, parseInt(limit) || 10), 100); // Max 100 per page
      const offset = (pageNum - 1) * limitNum;
      
      // Validate sortBy to prevent SQL injection
      const allowedSortFields = ['name', 'type', 'riskLevel', 'yieldRate', 'minInvestment', 'duration', 'createdAt', 'updatedAt'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const sortOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

      const where = { isActive: true };
      
      // Apply filters
      if (type && ['stocks', 'bonds', 'mutual_funds', 'etfs', 'real_estate'].includes(type)) {
        where.type = type;
      }
      
      if (riskLevel && ['low', 'medium', 'high'].includes(riskLevel)) {
        where.riskLevel = riskLevel;
      }
      
      if (minYield) {
        const minYieldNum = parseFloat(minYield);
        if (!isNaN(minYieldNum)) {
          where.yieldRate = { ...where.yieldRate, [Op.gte]: minYieldNum };
        }
      }

      if (maxYield) {
        const maxYieldNum = parseFloat(maxYield);
        if (!isNaN(maxYieldNum)) {
          where.yieldRate = { ...where.yieldRate, [Op.lte]: maxYieldNum };
        }
      }

      if (minInvestment) {
        const minInvNum = parseFloat(minInvestment);
        if (!isNaN(minInvNum)) {
          where.minInvestment = { [Op.lte]: minInvNum };
        }
      }

      if (maxInvestment) {
        const maxInvNum = parseFloat(maxInvestment);
        if (!isNaN(maxInvNum)) {
          where.maxInvestment = { [Op.gte]: maxInvNum };
        }
      }
      
      // Search by product name
      if (search && typeof search === 'string' && search.trim().length > 0) {
        where.name = { [Op.like]: `%${search.trim()}%` };
      }
      
      // Filter by availability
      if (availableOnly === 'true') {
        where.availableUnits = { [Op.gt]: 0 };
      }

      const { count, rows: products } = await InvestmentProduct.findAndCountAll({
        where,
        order: [[sortField, sortOrder]],
        limit: limitNum,
        offset: offset,
        attributes: { 
          exclude: ['createdAt', 'updatedAt'] 
        }
      });

      // Calculate pagination
      const totalPages = Math.ceil(count / limitNum);
      const hasNext = pageNum < totalPages;
      const hasPrev = pageNum > 1;

      res.json({
        products,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalProducts: count,
          hasNext,
          hasPrev,
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        error: 'Failed to fetch products'
      });
    }
  }

  // Get product by ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;

      const product = await InvestmentProduct.findOne({
        where: { 
          id, 
          isActive: true 
        },
        attributes: { 
          exclude: ['createdAt', 'updatedAt'] 
        }
      });

      if (!product) {
        return res.status(404).json({
          error: 'Product not found'
        });
      }

      res.json({
        product
      });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        error: 'Failed to fetch product'
      });
    }
  }

  // AI Product Recommendations
  static async getRecommendedProducts(req, res) {
    try {
      const userRiskAppetite = req.user.riskAppetite;

      // Get user's current investments for portfolio analysis
      const userInvestments = await Investment.findAll({
        where: { userId: req.user.id },
        include: [{
          model: InvestmentProduct,
          as: 'product',
          attributes: ['id', 'type', 'riskLevel', 'name']
        }]
      });

      // Get all active products
      const allProducts = await InvestmentProduct.findAll({
        where: { 
          isActive: true,
          availableUnits: { [Op.gt]: 0 }
        },
        attributes: { 
          exclude: ['createdAt', 'updatedAt'] 
        }
      });

      let recommendations;
      try {
        recommendations = AIService.recommendProducts(
          allProducts, 
          userRiskAppetite, 
          userInvestments
        );
      } catch (aiError) {
        console.warn('AI recommendations failed, using fallback:', aiError.message);
        // Fallback: simple risk-based filtering
        recommendations = allProducts
          .filter(product => product.riskLevel === userRiskAppetite || 
                  (userRiskAppetite === 'medium' && product.riskLevel === 'low') ||
                  (userRiskAppetite === 'high' && ['low', 'medium'].includes(product.riskLevel)))
          .slice(0, 3)
          .map(product => ({
            ...product.toJSON(),
            recommendationScore: 0.8,
            reason: 'Based on your risk appetite'
          }));
      }

      res.json({
        recommendations,
        userRiskAppetite,
        totalProducts: allProducts.length,
        note: recommendations.length === 0 ? 'No suitable products found for your risk profile' : undefined
      });
    } catch (error) {
      console.error('Get recommendations error:', error);
      res.status(500).json({
        error: 'Failed to generate recommendations'
      });
    }
  }

  // Get portfolio insights
  static async getPortfolioInsights(req, res) {
    try {
      const userInvestments = await Investment.findAll({
        where: { userId: req.user.id },
        include: [{
          model: InvestmentProduct,
          as: 'product',
          attributes: ['id', 'type', 'riskLevel', 'name', 'yieldRate']
        }]
      });

      const allProducts = await InvestmentProduct.findAll({
        where: { isActive: true },
        attributes: ['id', 'type', 'riskLevel']
      });

      const insights = AIService.generatePortfolioInsights(userInvestments, allProducts);

      // Remove duplicate data
      const { insights: insightMessages, ...portfolioData } = insights;

      res.json({
        ...portfolioData,
        insights: insightMessages,
        summary: {
          totalInvestments: userInvestments.length
        }
      });
    } catch (error) {
      console.error('Get portfolio insights error:', error);
      res.status(500).json({
        error: 'Failed to generate portfolio insights'
      });
    }
  }
}

module.exports = ProductController;