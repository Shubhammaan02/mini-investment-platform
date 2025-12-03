// frontend/src/types/index.ts
// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  riskAppetite: 'low' | 'medium' | 'high';
  balance: number;
  role: 'user' | 'admin';
  isActive: boolean;
  lastLogin?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: string;
}

// Product types
export interface InvestmentProduct {
  id: string;
  name: string;
  description: string;
  type: 'stocks' | 'bonds' | 'mutual_funds' | 'etfs' | 'real_estate';
  riskLevel: 'low' | 'medium' | 'high';
  yieldRate: number;
  minInvestment: number;
  maxInvestment?: number;
  duration: number;
  totalUnits: number;
  availableUnits: number;
  isActive: boolean;
  createdAt: string;
}

// Investment types
export interface Investment {
  id: string;
  userId: string;
  productId: string;
  product?: InvestmentProduct;
  amount: number;
  units: number;
  unitPrice: number;
  currentValue: number;
  expectedReturns: number;
  totalReturn: number;
  returnPercentage: number;
  investmentDate: string;
  maturityDate: string;
  status: 'active' | 'matured' | 'cancelled';
}

export interface Portfolio {
  investments: Investment[];
  portfolioSummary: {
    totalInvestments: number;
    totalInvested: number;
    totalCurrentValue: number;
    totalReturns: number;
    overallReturnPercentage: number;
    activeInvestments: number;
    maturedInvestments: number;
  };
  distributions: {
    byType: Record<string, number>;
    byRisk: Record<string, number>;
  };
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  riskAppetite: 'low' | 'medium' | 'high';
}

export interface InvestmentFormData {
  productId: string;
  amount: number;
}