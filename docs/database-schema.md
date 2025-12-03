
# Database Schema Documentation

## Tables Overview

### Users
- Stores user authentication and profile information
- Includes risk appetite for AI recommendations
- Maintains user balance for investments

### InvestmentProducts
- Defines available investment options
- Categorizes by type, risk level, and yield rate
- Tracks available units for investment

### Investments
- Records user investments in products
- Tracks current value and expected returns
- Manages investment lifecycle

### TransactionLogs
- Logs all API calls for monitoring
- Tracks errors and performance metrics
- Used for AI error summarization

### PasswordResets
- Manages OTP-based password reset flow
- Includes expiration and usage tracking

## Relationships
- Users → Investments (One-to-Many)
- InvestmentProducts → Investments (One-to-Many)
- Users → TransactionLogs (One-to-Many)
- Users → PasswordResets (One-to-Many)