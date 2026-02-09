# Backend Integration Guide

## Overview

This guide explains how to integrate a Node.js/Express backend with the AMEPSO E-Wallet Admin Dashboard and MySQL database.

---

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│                 │         │                  │         │             │
│  React Frontend │ ◄─────► │  Express Backend │ ◄─────► │   MySQL DB  │
│  (Port 3000)    │   API   │  (Port 5000)     │   SQL   │  (Port 3306)│
│                 │         │                  │         │             │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

---

## Step 1: Create Backend Structure

```bash
mkdir backend
cd backend
npm init -y
```

Create this structure:
```
backend/
├── server.js           # Main server file
├── config/
│   └── database.js     # Database connection
├── routes/
│   ├── auth.js        # Authentication routes
│   ├── users.js       # User management
│   ├── transactions.js # Transaction routes
│   ├── bills.js       # Bill management
│   └── analytics.js   # Analytics endpoints
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── transactionController.js
│   ├── billController.js
│   └── analyticsController.js
├── middleware/
│   ├── auth.js        # JWT verification
│   └── errorHandler.js
└── .env               # Environment variables
```

---

## Step 2: Install Dependencies

```bash
npm install express mysql2 dotenv bcrypt jsonwebtoken cors body-parser
npm install --save-dev nodemon
```

### Package Purposes:
- `express` - Web framework
- `mysql2` - MySQL driver with async/await support
- `dotenv` - Environment variable management
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `cors` - Enable cross-origin requests
- `body-parser` - Parse request bodies
- `nodemon` - Auto-restart server (development)

---

## Step 3: Database Connection

Copy `database/connection.example.js` to `backend/config/database.js`:

```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

---

## Step 4: Create Express Server

**backend/server.js:**

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection } = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testConnection();
});
```

---

## Step 5: Sample API Endpoints

### Users Endpoint
**backend/routes/users.js:**

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all users
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, phone, balance, is_active, created_at FROM users'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, phone, balance, is_active, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user balance
router.patch('/:id/balance', async (req, res) => {
  const { amount } = req.body;
  try {
    await pool.query(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [amount, req.params.id]
    );
    res.json({ message: 'Balance updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Transactions Endpoint
**backend/routes/transactions.js:**

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const [transactions] = await pool.query(`
      SELECT 
        t.id,
        t.reference_number,
        u.name as user_name,
        t.type,
        t.amount,
        t.status,
        t.payment_method,
        t.created_at
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new transaction
router.post('/', async (req, res) => {
  const { user_id, type, amount, description, payment_method } = req.body;
  
  try {
    // Generate reference number
    const refNum = `TXN-${Date.now()}`;
    
    // Insert transaction
    const [result] = await pool.query(
      'INSERT INTO transactions (user_id, type, amount, description, reference_number, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, type, amount, description, refNum, payment_method]
    );
    
    // Update user balance if successful
    if (type === 'add_funds') {
      await pool.query(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [amount, user_id]
      );
    } else if (type === 'payment') {
      await pool.query(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [amount, user_id]
      );
    }
    
    res.status(201).json({ 
      message: 'Transaction created',
      reference_number: refNum,
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## Step 6: Update Frontend API Calls

**Create a service file: `src/services/api.js`:**

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = {
  // Users
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`);
    return response.json();
  },
  
  getUser: async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    return response.json();
  },
  
  // Transactions
  getTransactions: async () => {
    const response = await fetch(`${API_BASE_URL}/transactions`);
    return response.json();
  },
  
  createTransaction: async (data) => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  // Bills
  getBills: async () => {
    const response = await fetch(`${API_BASE_URL}/bills`);
    return response.json();
  },
  
  // Analytics
  getAnalytics: async () => {
    const response = await fetch(`${API_BASE_URL}/analytics`);
    return response.json();
  }
};
```

**Update your React components to use the API:**

```javascript
import { useEffect, useState } from 'react';
import { api } from '../services/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    api.getUsers()
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        setLoading(false);
      });
  }, []);
  
  // ... rest of component
}
```

---

## Step 7: Authentication (JWT)

**backend/middleware/auth.js:**

```javascript
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
```

**Protect routes:**

```javascript
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  // Only authenticated users can access
});
```

---

## Step 8: Environment Variables

**backend/.env:**

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=amepso_ewallet

# JWT
JWT_SECRET=your_super_secret_key_here_change_in_production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## Step 9: Run Backend

Update `backend/package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

Run in development:
```bash
npm run dev
```

---

## Step 10: Testing

### Test Database Connection
```bash
curl http://localhost:5000/api/health
```

### Test Users Endpoint
```bash
curl http://localhost:5000/api/users
```

### Test Frontend Connection
Update `REACT_APP_API_URL` in frontend `.env` and restart the React app.

---

## Production Considerations

1. **Security**
   - Use HTTPS in production
   - Implement rate limiting
   - Add request validation
   - Use helmet.js for security headers
   - Sanitize user inputs

2. **Database**
   - Use connection pooling
   - Enable SSL for database connections
   - Set up regular backups
   - Create database user with limited permissions

3. **Error Handling**
   - Implement global error handler
   - Log errors to file/service
   - Don't expose sensitive error details

4. **Performance**
   - Enable gzip compression
   - Use Redis for caching
   - Optimize database queries
   - Add database indexes

5. **Deployment**
   - Use PM2 for process management
   - Set up environment-specific configs
   - Enable monitoring (e.g., New Relic)
   - Configure proper logging

---

## Next Steps

✅ Database schema created  
✅ Environment configured  
⏳ Build Express server  
⏳ Create API endpoints  
⏳ Implement authentication  
⏳ Connect frontend to API  
⏳ Deploy to production  

---

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [MySQL2 Package](https://www.npmjs.com/package/mysql2)
- [JWT Authentication](https://jwt.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
