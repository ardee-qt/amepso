# AMEPSO E-Wallet - Full Stack Application
## Backend Documentation & Setup Guide

---

## 📋 Overview

AMEPSO E-Wallet is a comprehensive electricity bill payment and financial management system. This backend provides RESTful API endpoints powered by PHP and MySQL.

**Backend Features:**
- ✅ Secure user authentication with bcrypt password hashing
- ✅ Token-based authorization system
- ✅ Bill management and payment processing
- ✅ Wallet fund management
- ✅ Payment reminders and notifications
- ✅ Advanced spending analytics and insights
- ✅ User profile management

---

## 🗂️ Project Structure

```
AMEPSO/
├── api/
│   ├── config/
│   │   └── db.php              # Database connection & configuration
│   ├── auth.php                # Authentication endpoints (register, login, logout)
│   ├── bills.php               # Bill management endpoints
│   ├── wallet.php              # Wallet & funds management
│   ├── profile.php             # User profile management
│   ├── reminders.php           # Payment reminders system
│   └── analytics.php           # Spending analytics & insights
├── database.sql                # Complete database schema
├── setup.php                   # Interactive setup wizard
├── setup_action.php            # Setup handler
├── index.html                  # Frontend application
├── index.js                    # Frontend business logic
├── style.css                   # Frontend styling
├── background.jpg              # Background image
└── README.md                   # This file
```

---

## ⚙️ Installation

### Prerequisites
- PHP 7.0 or higher
- MySQL 5.7 or higher
- A web server (Apache, Nginx, or built-in PHP server)

### Step 1: Download Files
Place all files in a directory accessible by your web server.

### Step 2: Run Setup Wizard
1. Open your browser and navigate to `http://localhost/amepso/setup.php`
2. The setup wizard will:
   - Test your database connection
   - Create the database and tables
   - Configure credentials automatically
   - Create an `installed.lock` file

### Step 3: Verify Installation
After setup, verify the configuration in `api/config/db.php`

### Step 4: Delete Setup Files (Recommended)
For security, delete or rename:
- `setup.php`
- `setup_action.php`

---

## 🔌 API Endpoints Documentation

### Authentication API (`api/auth.php`)

#### 1. Register User
```
POST /api/auth.php?action=register
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
}

Response (201):
{
    "success": true,
    "message": "Registration successful",
    "data": {
        "token": "eyJ0eXAiOiJKV1QiLC...",
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com"
        }
    }
}
```

#### 2. Login User
```
POST /api/auth.php?action=login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "SecurePassword123"
}

Response (200):
{
    "success": true,
    "message": "Login successful",
    "data": {
        "token": "eyJ0eXAiOiJKV1QiLC...",
        "user": {
            "id": 1,
            "name": "John Doe",
            "balance": 10000
        }
    }
}
```

#### 3. Logout User
```
POST /api/auth.php?action=logout
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "message": "Logout successful"
}
```

#### 4. Verify Token
```
GET /api/auth.php?action=verify_token
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "valid": true,
    "user_id": 1
}
```

---

### Bills API (`api/bills.php`)

#### 1. Get All Bills
```
GET /api/bills.php?action=get_all
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": [
        {
            "id": 1,
            "description": "January 2024 Bill",
            "amount": 2500,
            "due_date": "2024-02-15",
            "status": "pending",
            "account_number": "123456789"
        }
    ]
}
```

#### 2. Get Pending Bills
```
GET /api/bills.php?action=get_pending
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": [
        {
            "id": 1,
            "description": "January 2024 Bill",
            "amount": 2500,
            "due_date": "2024-02-15",
            "status": "pending"
        }
    ]
}
```

#### 3. Get Upcoming Bills (next 30 days)
```
GET /api/bills.php?action=get_upcoming
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": [
        {
            "id": 1,
            "description": "January 2024 Bill",
            "amount": 2500,
            "due_date": "2024-02-15",
            "days_until_due": 12
        }
    ]
}
```

#### 4. Create New Bill
```
POST /api/bills.php?action=create
Authorization: Bearer <token>
Content-Type: application/json

{
    "description": "February 2024 Bill",
    "amount": 3000,
    "due_date": "2024-03-15",
    "account_number": "123456789"
}

Response (201):
{
    "success": true,
    "message": "Bill created successfully",
    "data": {
        "id": 2,
        "reference_number": "BILL-20240115-001"
    }
}
```

#### 5. Pay Bill
```
POST /api/bills.php?action=pay
Authorization: Bearer <token>
Content-Type: application/json

{
    "bill_id": 1,
    "payment_method": "wallet"
}

Response (200):
{
    "success": true,
    "message": "Bill paid successfully",
    "data": {
        "bill_id": 1,
        "transaction_id": "TXN-20240115-001",
        "new_balance": 7500
    }
}
```

---

### Wallet API (`api/wallet.php`)

#### 1. Get Balance
```
GET /api/wallet.php?action=get_balance
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": {
        "balance": 10000,
        "currency": "₱"
    }
}
```

#### 2. Add Funds
```
POST /api/wallet.php?action=add_funds
Authorization: Bearer <token>
Content-Type: application/json

{
    "amount": 5000,
    "payment_method": "credit_card",
    "description": "Monthly top-up"
}

Response (200):
{
    "success": true,
    "message": "Funds added successfully",
    "data": {
        "amount_added": 5000,
        "reference_id": "TXN-20240115-123456",
        "timestamp": "2024-01-15 10:30:45"
    }
}
```

#### 3. Get Fund History
```
GET /api/wallet.php?action=get_fund_history?limit=10&offset=0
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": [
        {
            "id": 1,
            "amount": 5000,
            "payment_method": "credit_card",
            "status": "completed",
            "date": "2024-01-15 10:30:45"
        }
    ],
    "pagination": {
        "total": 5,
        "limit": 10,
        "offset": 0
    }
}
```

#### 4. Get Transactions
```
GET /api/wallet.php?action=get_transactions?limit=20&offset=0&type=payment
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": [
        {
            "id": 1,
            "type": "payment",
            "amount": 2500,
            "description": "January 2024 Bill",
            "reference": "TXN-20240115-001",
            "status": "completed",
            "date": "2024-01-15 10:30:45"
        }
    ],
    "pagination": {
        "total": 20,
        "limit": 20,
        "offset": 0
    }
}
```

---

### Profile API (`api/profile.php`)

#### 1. Get User Profile
```
GET /api/profile.php?action=get_profile
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "09123456789",
        "address": "123 Main St, City",
        "balance": 10000,
        "member_since": "2024-01-15 08:00:00"
    }
}
```

#### 2. Update Profile
```
POST /api/profile.php?action=update_profile
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "John Doe Updated",
    "email": "newemail@example.com",
    "phone": "09123456789",
    "address": "456 Oak St, City"
}

Response (200):
{
    "success": true,
    "message": "Profile updated successfully"
}
```

#### 3. Change Password
```
POST /api/profile.php?action=change_password
Authorization: Bearer <token>
Content-Type: application/json

{
    "current_password": "OldPassword123",
    "new_password": "NewPassword456"
}

Response (200):
{
    "success": true,
    "message": "Password changed successfully"
}
```

#### 4. Get Account Statistics
```
GET /api/profile.php?action=get_account_stats
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": {
        "this_month_spending": 7500,
        "bills_paid_this_month": 3,
        "pending_bills": 2,
        "total_transactions": 25
    }
}
```

---

### Analytics API (`api/analytics.php`)

#### 1. Get Transactions (Paginated)
```
GET /api/analytics.php?action=get_transactions&limit=50&offset=0
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": [
        {
            "id": 1,
            "type": "payment",
            "amount": 2500,
            "description": "January Bill",
            "date": "2024-01-15"
        }
    ]
}
```

#### 2. Get 12-Month Spending Trends
```
GET /api/analytics.php?action=get_spending_trends
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": [
        {
            "month": "2023-02",
            "total": 7500,
            "count": 3
        },
        {
            "month": "2023-03",
            "total": 8200,
            "count": 4
        }
    ]
}
```

#### 3. Get Category Breakdown
```
GET /api/analytics.php?action=get_category_breakdown
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": {
        "payments": 15000,
        "add_funds": 25000,
        "recurring": 3000
    }
}
```

#### 4. Get Monthly Comparison
```
GET /api/analytics.php?action=get_monthly_comparison
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": [
        {
            "month": "2023-11",
            "added": 10000,
            "spent": 7500,
            "transactions": 4
        },
        {
            "month": "2023-12",
            "added": 15000,
            "spent": 8200,
            "transactions": 5
        }
    ]
}
```

#### 5. Get Spending Insights (AI-Powered)
```
GET /api/analytics.php?action=get_spending_insights
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": {
        "total_spent": 15000,
        "monthly_limit": 20000,
        "spent_percentage": 75,
        "transaction_count": 12,
        "insights": [
            {
                "type": "warning",
                "message": "You're at 75% of your monthly budget",
                "severity": "high"
            },
            {
                "type": "info",
                "message": "Average monthly spending: ₱5,000",
                "severity": "low"
            }
        ]
    }
}
```

---

### Payment Reminders API (`api/reminders.php`)

#### 1. Get Pending Reminders
```
GET /api/reminders.php?action=get_pending_reminders
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": [
        {
            "id": 1,
            "reminder_type": "due_soon",
            "reminder_date": "2024-02-13",
            "bill_id": 1,
            "description": "January Bill",
            "amount": 2500,
            "days_until_due": 2
        }
    ]
}
```

#### 2. Get Overdue Bills
```
GET /api/reminders.php?action=get_overdue_bills
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": [
        {
            "id": 1,
            "description": "January Bill",
            "amount": 2500,
            "due_date": "2024-02-15",
            "days_overdue": 5
        }
    ],
    "count": 1
}
```

#### 3. Generate Reminders
```
POST /api/reminders.php?action=generate_reminders
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "message": "Generated 3 reminders",
    "reminders_created": 3
}
```

#### 4. Get Bill Status
```
GET /api/reminders.php?action=get_bill_status
Authorization: Bearer <token>

Response (200):
{
    "success": true,
    "data": {
        "pending": {
            "count": 3,
            "total": 7500
        },
        "overdue": {
            "count": 1,
            "total": 2500
        },
        "paid_this_month": {
            "count": 5,
            "total": 12500
        }
    }
}
```

---

## 🔐 Authentication

All protected endpoints require the `Authorization` header with a Bearer token:

```
Authorization: Bearer <token>
```

Tokens are returned after successful login and registration.

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    balance DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);
```

### Bills Table
```sql
CREATE TABLE bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    description VARCHAR(255),
    amount DECIMAL(10, 2),
    due_date DATE,
    account_number VARCHAR(50),
    status ENUM('pending', 'paid', 'overdue'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('payment', 'add_funds', 'recurring'),
    amount DECIMAL(10, 2),
    description VARCHAR(255),
    reference_number VARCHAR(50),
    bill_id INT,
    status ENUM('pending', 'completed', 'failed'),
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL
);
```

---

## 🛠️ Configuration

Edit `api/config/db.php` to configure:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'amepso_wallet');
```

---

## 🚀 Deployment

### Option 1: Shared Hosting
1. Upload all files to your hosting provider
2. Create MySQL database through control panel
3. Run setup.php through browser
4. Delete setup files for security

### Option 2: Local Development
```bash
# Using PHP built-in server
php -S localhost:8000

# Navigate to http://localhost:8000/setup.php
```

### Option 3: Docker
```dockerfile
FROM php:7.4-apache
RUN docker-php-ext-install mysqli
COPY . /var/www/html/
```

---

## 🔒 Security Best Practices

✅ **Implemented:**
- Bcrypt password hashing (PASSWORD_BCRYPT)
- Token-based authentication
- Email validation
- SQL injection prevention (prepared statements)
- CORS headers

⚠️ **Recommendations:**
- Use HTTPS in production
- Implement rate limiting
- Add CSRF protection tokens
- Regular security audits
- Keep PHP and MySQL updated
- Monitor access logs

---

## 📝 Error Handling

All API responses follow this format:

**Success Response:**
```json
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}
```

**Error Response:**
```json
{
    "success": false,
    "message": "Error description"
}
```

**HTTP Status Codes:**
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

---

## 📞 Support

For issues or questions:
1. Check the API documentation
2. Review database schema
3. Verify configuration in db.php
4. Check server error logs

---

## 📄 License

AMEPSO E-Wallet © 2024

---

**Last Updated:** January 2024
**Version:** 1.0.0
