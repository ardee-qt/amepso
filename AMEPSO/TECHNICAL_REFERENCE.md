# AMEPSO E-Wallet - Technical Reference Card

## 🎯 Quick Reference for Developers

---

## 📋 API Endpoints at a Glance

### Authentication Endpoints
```
POST   /api/auth.php?action=register
POST   /api/auth.php?action=login
POST   /api/auth.php?action=logout
GET    /api/auth.php?action=verify_token
```

### Bills Endpoints
```
GET    /api/bills.php?action=get_all
GET    /api/bills.php?action=get_pending
GET    /api/bills.php?action=get_upcoming
POST   /api/bills.php?action=create
POST   /api/bills.php?action=pay
GET    /api/bills.php?action=get_by_id&id=X
```

### Wallet Endpoints
```
GET    /api/wallet.php?action=get_balance
POST   /api/wallet.php?action=add_funds
GET    /api/wallet.php?action=get_fund_history?limit=10&offset=0
GET    /api/wallet.php?action=get_transactions?limit=20&offset=0
```

### Profile Endpoints
```
GET    /api/profile.php?action=get_profile
POST   /api/profile.php?action=update_profile
POST   /api/profile.php?action=change_password
GET    /api/profile.php?action=get_account_stats
```

### Reminders Endpoints
```
GET    /api/reminders.php?action=get_pending_reminders
GET    /api/reminders.php?action=get_overdue_bills
POST   /api/reminders.php?action=generate_reminders
POST   /api/reminders.php?action=mark_reminder_sent
GET    /api/reminders.php?action=get_bill_status
```

### Analytics Endpoints
```
GET    /api/analytics.php?action=get_transactions
GET    /api/analytics.php?action=get_spending_trends
GET    /api/analytics.php?action=get_category_breakdown
GET    /api/analytics.php?action=get_monthly_comparison
GET    /api/analytics.php?action=get_spending_insights
```

---

## 🔐 Authentication

### Bearer Token Usage
```javascript
// In JavaScript
fetch('/api/endpoint', {
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
    }
})

// In cURL
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" https://api/endpoint
```

### Token Flow
```
1. Register/Login → Get Token
2. Store Token (localStorage)
3. Send Token with every request
4. Token verified by backend
5. User ID extracted from session
```

---

## 📊 Database Tables Quick Reference

```
users:           id, name, email, password, phone, address, balance, created_at
bills:           id, user_id, description, amount, due_date, account_number, status
transactions:    id, user_id, type, amount, description, reference_number, bill_id, status
recurring:       id, user_id, description, amount, frequency, next_due_date, is_active
budget:          id, user_id, monthly_limit, current_month_spent
reminders:       id, user_id, bill_id, reminder_date, reminder_type, is_sent
fund_history:    id, user_id, amount, payment_method, status, created_at
analytics:       id, user_id, category, total_spent, transaction_count, month
```

---

## 🔄 Common Request/Response Patterns

### Success Response
```json
{
    "success": true,
    "message": "Operation successful",
    "data": { /* results */ }
}
```

### Error Response
```json
{
    "success": false,
    "message": "Error description"
}
```

### Pagination
```json
{
    "success": true,
    "data": [ /* results */ ],
    "pagination": {
        "total": 100,
        "limit": 10,
        "offset": 0
    }
}
```

---

## HTTP Status Codes

| Code | Status | Usage |
|------|--------|-------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Invalid/missing token |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate entry |
| 500 | Server Error | Database/server error |

---

## 🔧 Configuration Variables

**Database (api/config/db.php):**
```php
DB_HOST       = 'localhost'
DB_USER       = 'root'
DB_PASS       = 'password'
DB_NAME       = 'amepso_wallet'
```

---

## 🎨 Frontend CSS Classes

### Colors
```css
--primary: #FF8C42      /* Orange */
--secondary: #A0438D    /* Purple */
--accent: #FF6B6B       /* Coral */
--success: #4CAF50      /* Green */
--danger: #F44336       /* Red */
--warning: #FF9800      /* Amber */
```

### Responsive Breakpoints
```css
1200px+  /* Desktop */
768px    /* Tablet */
480px    /* Mobile */
360px    /* Small Mobile */
```

---

## 📱 Mobile Responsive Guidelines

```css
/* Phone (360px - 480px) */
@media (max-width: 480px) {
    /* Stack vertically */
    /* Larger tap targets */
    /* Touch-friendly spacing */
}

/* Tablet (480px - 768px) */
@media (min-width: 481px) and (max-width: 768px) {
    /* 2-column layout */
    /* Medium spacing */
}

/* Desktop (768px+) */
@media (min-width: 769px) {
    /* Full layout */
    /* Optimal spacing */
}
```

---

## 🛠️ Common Tasks

### Add New API Endpoint
```php
// In api/bills.php
case 'new_action':
    newAction($user_id);
    break;

function newAction($user_id) {
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM table WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    // Process and return
}
```

### Add New Database Query
```php
// Always use prepared statements
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
```

### Add New Frontend Feature
```javascript
// In EWalletApp class
newFeature() {
    const token = localStorage.getItem('auth_token');
    fetch('/api/endpoint', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            this.showNotification('Success!', 'success');
        }
    });
}
```

---

## 🚀 Deployment Commands

```bash
# Create database
mysql -u user -p < database.sql

# Set permissions
chmod 755 api/
chmod 644 api/*.php
chmod 600 api/config/db.php

# Start server
php -S localhost:8000

# Run tests
curl -X POST http://localhost/api/auth.php?action=register \
  -d '{"name":"Test","email":"test@example.com","password":"pass123"}'
```

---

## 🔍 Debugging Tips

### Enable Error Display (Development Only)
```php
// At top of api/config/db.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

### View API Response
```javascript
// In browser console
fetch('/api/endpoint')
    .then(r => r.json())
    .then(data => console.log(data))
```

### Check Database
```bash
mysql amepso_wallet
SHOW TABLES;
SELECT * FROM users;
DESCRIBE bills;
```

### View Logs
```bash
tail -f /var/log/php.log
tail -f /var/log/mysql.log
```

---

## 📊 Query Examples

### Get User Stats
```sql
SELECT 
    COUNT(*) as total_bills,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM bills 
WHERE user_id = 1;
```

### Get Monthly Spending
```sql
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as month,
    SUM(amount) as total,
    COUNT(*) as count
FROM transactions
WHERE user_id = 1 AND type = 'payment'
GROUP BY DATE_FORMAT(created_at, '%Y-%m');
```

### Get Overdue Bills
```sql
SELECT * FROM bills
WHERE user_id = 1 
AND status = 'pending' 
AND due_date < CURDATE();
```

---

## 💡 Performance Tips

1. **Index Frequently Queried Columns**
   - user_id, created_at, status, due_date

2. **Use Pagination**
   - Limit/offset for large datasets
   - Return counts for UI

3. **Cache Results**
   - Store tokens locally
   - Cache balance temporarily

4. **Optimize Queries**
   - Use SELECT specific columns (not *)
   - Use GROUP BY for aggregations
   - Use HAVING for filtering

5. **Monitor Performance**
   - Check query times
   - Monitor database size
   - Track API response times

---

## 🔐 Security Checklist

- [ ] Use prepared statements
- [ ] Hash passwords with bcrypt
- [ ] Validate all inputs
- [ ] Use HTTPS in production
- [ ] Store tokens securely
- [ ] Log security events
- [ ] Regular backups
- [ ] Update dependencies
- [ ] Security audit quarterly
- [ ] Monitor access logs

---

## 📱 Frontend Methods Reference

### Authentication Methods
```javascript
app.handleLogin()           // User login
app.handleRegister()        // User registration
app.handleLogout()          // User logout
app.loadProfileData()       // Load user profile
app.saveProfileChanges()    // Update profile
app.changePassword()        // Change password
```

### Wallet Methods
```javascript
app.addFunds()              // Add money
app.updateBalance()         // Refresh balance
app.showFundHistory()       // View deposits
```

### Bill Methods
```javascript
app.updateBillHistory()     // Load bills
app.payElectricityBill()    // Pay bill
app.addRecurringPayment()   // Schedule recurring
```

### Dashboard Methods
```javascript
app.showDashboard()         // Show main view
app.updateStats()           // Update statistics
app.updateUpcomingBills()   // Show upcoming
app.initializeCharts()      // Initialize analytics
```

### UI Methods
```javascript
app.openModal(id)           // Open modal
app.closeModal(id)          // Close modal
app.closeAllModals()        // Close all
app.showNotification()      // Show alert
app.toggleDarkMode()        // Toggle theme
```

---

## 🎯 Development Workflow

1. **Start Local Server**
   ```
   php -S localhost:8000
   ```

2. **Open Application**
   ```
   http://localhost:8000/index.html
   ```

3. **Debug in Browser**
   ```
   F12 → Console/Network tab
   ```

4. **Test Endpoints**
   ```
   Use Postman or Thunder Client
   ```

5. **Check Database**
   ```
   phpMyAdmin: http://localhost/phpmyadmin
   ```

6. **Review Logs**
   ```
   tail -f error.log
   ```

---

## 📈 Monitoring Dashboard

Monitor these key metrics:

```
✓ Database: Connection errors, Slow queries
✓ API: Response times, Error rates, Status codes
✓ Frontend: Page load time, User actions, Error logs
✓ System: Disk space, Memory, CPU, Uptime
✓ Business: Active users, Transactions, Revenue
```

---

## 🆘 Emergency Procedures

### Database Down
```sql
-- Verify connection
SELECT 1;

-- Check status
SHOW STATUS;

-- Restart service
systemctl restart mysql
```

### API Not Responding
```bash
# Check PHP
systemctl status php-fpm

# Check Web Server
systemctl status apache2

# Check Logs
tail -f /var/log/apache2/error.log
```

### High CPU/Memory
```bash
# Find processes
top
ps aux

# Kill if needed
kill -9 <PID>
```

---

## 📞 Contact Info

**For Questions:**
- Review documentation files
- Check inline code comments
- Run setup.php for installation help
- Monitor browser console for errors

**For Issues:**
- Check QUICKSTART.md for setup help
- Review BACKEND_README.md for API details
- Check DEPLOYMENT_CHECKLIST.md for production setup

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production Ready  

Keep this reference handy for development! 📋
