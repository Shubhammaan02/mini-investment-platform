// backend/src/utils/aiService.js
class AIService {
  static generateProductDescription(productData) {
    const { name, type, riskLevel, yieldRate, minInvestment, duration } = productData;
    
    const riskDescriptions = {
      low: 'a conservative, low-risk',
      medium: 'a balanced, medium-risk', 
      high: 'a high-growth, high-risk'
    };

    const typeDescriptions = {
      stocks: 'equity investment in carefully selected public companies',
      bonds: 'fixed-income security offering stable returns',
      mutual_funds: 'professionally managed portfolio of diversified assets',
      etfs: 'exchange-traded fund tracking market indexes',
      real_estate: 'real estate investment trust with property assets'
    };

    const descriptions = [
      `This ${riskDescriptions[riskLevel]} ${typeDescriptions[type]} offers an attractive annual yield of ${yieldRate}%.`,
      `With a minimum investment of $${minInvestment} and ${duration}-month duration, this product is designed for ${riskLevel} risk tolerance investors.`,
      `The ${name} provides exposure to ${type.replace('_', ' ')} assets with professional management and regular returns.`,
      `Ideal for investors seeking ${riskLevel} risk exposure with potential returns of ${yieldRate}% annually.`,
      `This investment opportunity combines ${riskLevel} risk with ${yieldRate}% projected returns over ${duration} months.`
    ];

    // Select 2-3 random description parts
    const selectedDescriptions = [];
    const usedIndices = new Set();
    
    while (selectedDescriptions.length < 3 && selectedDescriptions.length < descriptions.length) {
      const randomIndex = Math.floor(Math.random() * descriptions.length);
      if (!usedIndices.has(randomIndex)) {
        selectedDescriptions.push(descriptions[randomIndex]);
        usedIndices.add(randomIndex);
      }
    }

    return selectedDescriptions.join(' ');
  }

  static recommendProducts(products, userRiskAppetite, userPortfolio = []) {
    if (!products.length) return [];

    // Calculate current portfolio distribution
    const portfolioDistribution = this.calculatePortfolioDistribution(userPortfolio);
    
    // Score products based on multiple factors
    const scoredProducts = products.map(product => {
      let score = 0;

      // Risk alignment (most important factor)
      const riskScore = this.calculateRiskScore(product.riskLevel, userRiskAppetite);
      score += riskScore * 0.4;

      // Yield potential
      const yieldScore = (product.yieldRate / 20) * 0.3; // Normalize to 20% max yield
      score += yieldScore;

      // Portfolio diversification
      const diversificationScore = this.calculateDiversificationScore(product, portfolioDistribution);
      score += diversificationScore * 0.2;

      // Accessibility (lower min investment = better)
      const accessibilityScore = product.minInvestment <= 1000 ? 0.1 : 0;
      score += accessibilityScore;

      return {
        ...product.toJSON ? product.toJSON() : product,
        recommendationScore: Math.min(score, 1),
        reason: this.generateRecommendationReason(product, riskScore, yieldScore, diversificationScore)
      };
    });

    // Sort by recommendation score and return top 3
    return scoredProducts
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 3);
  }

  static calculateRiskScore(productRisk, userRiskAppetite) {
    const riskLevels = { low: 1, medium: 2, high: 3 };
    const userRisk = riskLevels[userRiskAppetite];
    const productRiskLevel = riskLevels[productRisk];

    // Higher score for closer risk alignment
    const difference = Math.abs(userRisk - productRiskLevel);
    return 1 - (difference / 2); // Normalize to 0-1
  }

  static calculatePortfolioDistribution(portfolio) {
    const distribution = {};
    let totalValue = 0;

    portfolio.forEach(investment => {
      const type = investment.product?.type || investment.productType;
      const value = investment.amount || investment.currentValue || 0;
      
      distribution[type] = (distribution[type] || 0) + value;
      totalValue += value;
    });

    // Convert to percentages
    if (totalValue > 0) {
      Object.keys(distribution).forEach(type => {
        distribution[type] = (distribution[type] / totalValue) * 100;
      });
    }

    return distribution;
  }

  static calculateDiversificationScore(product, portfolioDistribution) {
    const currentPercentage = portfolioDistribution[product.type] || 0;
    
    // Prefer products in categories with lower current allocation
    if (currentPercentage < 20) return 0.1; // Good diversification
    if (currentPercentage < 40) return 0.05; // Moderate
    return 0; // Already heavily invested
  }

  static generateRecommendationReason(product, riskScore, yieldScore, diversificationScore) {
    const reasons = [];

    if (riskScore > 0.8) {
      reasons.push('excellent risk alignment with your profile');
    } else if (riskScore > 0.6) {
      reasons.push('good risk match for your preferences');
    }

    if (yieldScore > 0.2) {
      reasons.push('competitive yield potential');
    }

    if (diversificationScore > 0.05) {
      reasons.push('helps diversify your portfolio');
    }

    if (product.minInvestment <= 1000) {
      reasons.push('low minimum investment threshold');
    }

    return reasons.length > 0 
      ? `Recommended because: ${reasons.join(', ')}.`
      : 'Good investment opportunity based on current market conditions.';
  }

  static generatePortfolioInsights(portfolio, products = []) {
    if (!portfolio.length) {
      return {
        riskDistribution: { low: 0, medium: 0, high: 0 },
        typeDistribution: {},
        totalValue: 0,
        totalInvested: 0,
        estimatedReturns: 0,
        insights: [
          'Start building your portfolio by making your first investment.',
          'Consider exploring different product types to build a diversified portfolio.',
          'Set your risk appetite in profile to get personalized recommendations.'
        ]
      };
    }

    const insights = [];
    const riskDistribution = { low: 0, medium: 0, high: 0 };
    const typeDistribution = {};
    let totalValue = 0;
    let totalInvested = 0;
    let estimatedReturns = 0;

    // Calculate portfolio metrics
    portfolio.forEach(investment => {
      const product = products.find(p => p.id === investment.productId) || investment.product;
      if (product) {
        riskDistribution[product.riskLevel] = (riskDistribution[product.riskLevel] || 0) + investment.currentValue;
        typeDistribution[product.type] = (typeDistribution[product.type] || 0) + investment.currentValue;
      }
      
      totalValue += investment.currentValue;
      totalInvested += investment.amount;
      estimatedReturns += investment.expectedReturns;
    });

    // Generate insights
    const returnPercentage = ((totalValue - totalInvested) / totalInvested * 100).toFixed(2);
    
    if (returnPercentage > 0) {
      insights.push(`Your portfolio is up ${returnPercentage}% with estimated returns of $${estimatedReturns.toFixed(2)}.`);
    } else {
      insights.push('Monitor your investments regularly to track performance.');
    }

    // Risk concentration insight
    const maxRisk = Object.keys(riskDistribution).reduce((a, b) => 
      riskDistribution[a] > riskDistribution[b] ? a : b
    );
    
    const riskPercentage = (riskDistribution[maxRisk] / totalValue * 100).toFixed(1);
    if (riskPercentage > 60) {
      insights.push(`Your portfolio is heavily weighted towards ${maxRisk} risk investments (${riskPercentage}%). Consider diversifying risk exposure.`);
    }

    // Type concentration insight
    const maxType = Object.keys(typeDistribution).reduce((a, b) => 
      typeDistribution[a] > typeDistribution[b] ? a : b
    );
    
    const typePercentage = (typeDistribution[maxType] / totalValue * 100).toFixed(1);
    if (typePercentage > 50) {
      insights.push(`Your portfolio has significant exposure to ${maxType.replace('_', ' ')} (${typePercentage}%). Explore other asset types for better diversification.`);
    } else {
      insights.push('Good portfolio diversification across different asset types.');
    }

    // Add general investment insight
    if (totalValue < 5000) {
      insights.push('Consider increasing your investment amount to benefit from compounding returns.');
    } else {
      insights.push('Your portfolio shows healthy growth potential. Continue regular investments for long-term wealth building.');
    }

    return {
      riskDistribution,
      typeDistribution,
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      estimatedReturns: parseFloat(estimatedReturns.toFixed(2)),
      insights
    };
  }
  
  // Add these methods to the existing AIService class
  static generateErrorSummary(logs) {
    if (!logs || logs.length === 0) {
      return {
        summary: 'No errors found in the logs',
        categories: {},
        recommendations: ['All systems are functioning normally']
      };
    }

    // Categorize errors
    const errorCategories = {
      validation: { count: 0, examples: [] },
      authentication: { count: 0, examples: [] },
      authorization: { count: 0, examples: [] },
      not_found: { count: 0, examples: [] },
      server_error: { count: 0, examples: [] },
      business_rule: { count: 0, examples: [] },
      unknown: { count: 0, examples: [] }
    };

    let totalErrors = 0;
    let uniqueUsers = new Set();
    let uniqueEndpoints = new Set();

    // Analyze each error log
    logs.forEach(log => {
      if (log.isError) {
        totalErrors++;
        
        if (log.userId) uniqueUsers.add(log.userId);
        uniqueEndpoints.add(log.endpoint);

        const category = log.errorCategory || this.categorizeError(log);
        errorCategories[category].count++;
        
        if (errorCategories[category].examples.length < 3) {
          errorCategories[category].examples.push({
            endpoint: log.endpoint,
            method: log.method,
            errorMessage: log.errorMessage,
            timestamp: log.createdAt
          });
        }
      }
    });

    // Generate summary
    const summary = this.generateErrorSummaryText(errorCategories, totalErrors, uniqueUsers.size, uniqueEndpoints.size);
    const recommendations = this.generateErrorRecommendations(errorCategories);

    return {
      summary,
      statistics: {
        totalErrors,
        affectedUsers: uniqueUsers.size,
        affectedEndpoints: uniqueEndpoints.size,
        errorRate: ((totalErrors / logs.length) * 100).toFixed(2)
      },
      categories: errorCategories,
      recommendations,
      timeframe: {
        start: logs[0]?.createdAt,
        end: logs[logs.length - 1]?.createdAt
      }
    };
  }

  static categorizeError(log) {
    const { statusCode, errorMessage, endpoint } = log;
    
    if (statusCode >= 500) return 'server_error';
    if (statusCode === 401) return 'authentication';
    if (statusCode === 403) return 'authorization';
    if (statusCode === 404) return 'not_found';
    if (statusCode === 400) {
      if (errorMessage?.includes('validation') || errorMessage?.includes('required') || errorMessage?.includes('invalid')) {
        return 'validation';
      }
      if (errorMessage?.includes('balance') || errorMessage?.includes('investment') || errorMessage?.includes('portfolio')) {
        return 'business_rule';
      }
    }
    
    return 'unknown';
  }

  static generateErrorSummaryText(categories, totalErrors, affectedUsers, affectedEndpoints) {
    const topCategory = Object.entries(categories)
      .filter(([_, data]) => data.count > 0)
      .sort((a, b) => b[1].count - a[1].count)[0];

    const topCategoryName = topCategory ? topCategory[0].replace('_', ' ') : 'none';
    const topCategoryCount = topCategory ? topCategory[1].count : 0;
    const topCategoryPercentage = totalErrors > 0 ? ((topCategoryCount / totalErrors) * 100).toFixed(1) : 0;

    return `Found ${totalErrors} errors affecting ${affectedUsers} users across ${affectedEndpoints} endpoints. ` +
          `The most common issue is ${topCategoryName} errors (${topCategoryPercentage}% of all errors).`;
  }

  static generateErrorRecommendations(categories) {
    const recommendations = [];

    if (categories.validation.count > 0) {
      recommendations.push(
        'Consider improving client-side validation to reduce server-side validation errors',
        'Review API documentation for required fields and data formats'
      );
    }

    if (categories.authentication.count > 0) {
      recommendations.push(
        'Check token expiration and refresh mechanisms',
        'Verify login credential validation processes'
      );
    }

    if (categories.authorization.count > 0) {
      recommendations.push(
        'Review user role and permission assignments',
        'Ensure proper access control checks are in place'
      );
    }

    if (categories.server_error.count > 0) {
      recommendations.push(
        'Investigate database connection and query performance',
        'Check server resource utilization and error logs'
      );
    }

    if (categories.not_found.count > 0) {
      recommendations.push(
        'Verify API endpoint routes and resource existence checks',
        'Check client-side navigation and URL generation'
      );
    }

    if (categories.business_rule.count > 0) {
      recommendations.push(
        'Review business logic validation rules',
        'Consider providing more detailed error messages to users'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('No specific recommendations - system appears stable');
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  static generateSystemHealthReport(logs, timeRange = '24h') {
    const now = new Date();
    let startTime;
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now - 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now - 24 * 60 * 60 * 1000);
    }

    const recentLogs = logs.filter(log => new Date(log.createdAt) >= startTime);
    const totalRequests = recentLogs.length;
    const errorLogs = recentLogs.filter(log => log.isError);
    const successLogs = recentLogs.filter(log => !log.isError);

    // Calculate statistics
    const errorRate = totalRequests > 0 ? (errorLogs.length / totalRequests) * 100 : 0;
    const avgResponseTime = recentLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / totalRequests;
    
    // Group by endpoint
    const endpointStats = {};
    recentLogs.forEach(log => {
      if (!endpointStats[log.endpoint]) {
        endpointStats[log.endpoint] = { requests: 0, errors: 0, totalTime: 0 };
      }
      endpointStats[log.endpoint].requests++;
      endpointStats[log.endpoint].totalTime += log.responseTime || 0;
      if (log.isError) endpointStats[log.endpoint].errors++;
    });

    // Calculate performance metrics
    Object.keys(endpointStats).forEach(endpoint => {
      const stats = endpointStats[endpoint];
      stats.avgTime = stats.totalTime / stats.requests;
      stats.errorRate = (stats.errors / stats.requests) * 100;
    });

    // Generate health score (0-100)
    let healthScore = 100;
    
    // Deduct for error rate
    if (errorRate > 5) healthScore -= 20;
    else if (errorRate > 2) healthScore -= 10;
    
    // Deduct for slow responses
    if (avgResponseTime > 1000) healthScore -= 20;
    else if (avgResponseTime > 500) healthScore -= 10;

    // Ensure score is within bounds
    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      timeframe: {
        start: startTime,
        end: now,
        range: timeRange
      },
      overview: {
        totalRequests,
        successfulRequests: successLogs.length,
        failedRequests: errorLogs.length,
        errorRate: parseFloat(errorRate.toFixed(2)),
        averageResponseTime: parseFloat(avgResponseTime.toFixed(2)),
        healthScore: parseFloat(healthScore.toFixed(1))
      },
      performance: {
        fastEndpoints: Object.entries(endpointStats)
          .filter(([_, stats]) => stats.avgTime < 100)
          .map(([endpoint, stats]) => ({ endpoint, ...stats })),
        slowEndpoints: Object.entries(endpointStats)
          .filter(([_, stats]) => stats.avgTime >= 500)
          .map(([endpoint, stats]) => ({ endpoint, ...stats }))
      },
      issues: {
        highErrorEndpoints: Object.entries(endpointStats)
          .filter(([_, stats]) => stats.errorRate > 10)
          .map(([endpoint, stats]) => ({ endpoint, ...stats })),
        frequentErrors: this.getFrequentErrors(errorLogs)
      },
      recommendations: this.generateHealthRecommendations(healthScore, errorRate, avgResponseTime)
    };
  }

  static getFrequentErrors(errorLogs, limit = 5) {
    const errorCounts = {};
    
    errorLogs.forEach(log => {
      const key = `${log.endpoint}:${log.errorMessage || 'Unknown error'}`;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => {
        const [endpoint, message] = key.split(':');
        return { endpoint, message, count };
      });
  }

  static generateHealthRecommendations(healthScore, errorRate, avgResponseTime) {
    const recommendations = [];

    if (healthScore >= 90) {
      recommendations.push('System is healthy and performing well');
    } else if (healthScore >= 70) {
      recommendations.push('System is stable but could use optimization');
    } else {
      recommendations.push('System requires attention and improvements');
    }

    if (errorRate > 5) {
      recommendations.push('High error rate detected - investigate failing endpoints');
    } else if (errorRate > 2) {
      recommendations.push('Moderate error rate - monitor for degradation');
    }

    if (avgResponseTime > 1000) {
      recommendations.push('Slow response times - optimize database queries and API endpoints');
    } else if (avgResponseTime > 500) {
      recommendations.push('Response times are acceptable but could be improved');
    }

    if (recommendations.length === 0) {
      recommendations.push('No specific recommendations - system is performing optimally');
    }

    return recommendations;
  }
}

module.exports = AIService;