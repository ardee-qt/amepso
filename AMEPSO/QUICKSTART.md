# AMEPSO E-Wallet - Quick Start Guide

## ⚡ Get Started in 5 Minutes

### 1️⃣ **Download & Extract**
Place all files in your web server directory:
- **Windows/XAMPP:** `C:\xampp\htdocs\amepso`
- **Linux/Apache:** `/var/www/html/amepso`
- **macOS/Local:** `~/Sites/amepso`

### 2️⃣ **Run Setup Wizard**
Open in your browser:
```
http://localhost/amepso/setup.php
```

**In the setup page:**
- Database Host: `localhost`
- Database User: `root` (or your user)
- Database Password: (leave blank if none)
- Database Name: `amepso_wallet`

Click **Test Connection** → Then **Install Database**

### 3️⃣ **Delete Setup Files** (Security)
After successful setup, delete or rename:
- `setup.php`
- `setup_action.php`

### 4️⃣ **Start Using!**
Open in your browser:
```
http://localhost/amepso/index.html
```

---

## 📋 Default Credentials for Testing

After setup, create an account:
- **Email:** test@amepso.com
- **Password:** TestPassword123
- **Name:** Test User

---

## 🧪 First Steps Checklist

### ✅ Authentication
1. Click **Register**
2. Fill in Name, Email, Password
3. Click **Sign Up**
4. You'll get ₱10,000 starting balance

### ✅ Add a Bill
1. Click **Add Bill** button
2. Enter bill details:
   - Description: "January Electricity Bill"
   - Amount: 2500
   - Due Date: Pick a date
3. Click **Add**

### ✅ Make a Payment
1. Click **Pay Bill** on the bill
2. Confirm payment
3. Balance updates automatically

### ✅ Add More Funds
1. Click **Add Funds**
2. Enter amount: 5000
3. Select payment method: GCash
4. Click **Add**

---

## 🔗 Important API URLs

After setup, these endpoints are available:

```
Base URL: http://localhost/amepso/api/

Authentication:
- POST   /auth.php?action=register
- POST   /auth.php?action=login
- POST   /auth.php?action=logout
- GET    /auth.php?action=verify_token

Wallet:
- GET    /wallet.php?action=get_balance
- POST   /wallet.php?action=add_funds
- GET    /wallet.php?action=get_transactions

Bills:
- GET    /bills.php?action=get_all
- POST   /bills.php?action=pay

Profile:
- GET    /profile.php?action=get_profile
- POST   /profile.php?action=update_profile

Analytics:
- GET    /analytics.php?action=get_spending_insights
- GET    /analytics.php?action=get_spending_trends
```

---

## 📊 Database Access

### Using MySQL Command Line
```bash
mysql -u root -p
USE amepso_wallet;
SHOW TABLES;
SELECT * FROM users;
```

### Using phpMyAdmin
```
http://localhost/phpmyadmin
Username: root
Password: (your password)
Database: amepso_wallet
```

---

## 🚀 Frontend Features

### Dashboard
- 💰 Current balance display
- 📋 Recent bills
- 📊 Spending charts
- ⚠️ Alert notifications

### Bills Management
- ✅ View all bills
- ✅ Pay bills instantly
- ✅ Track bill history
- ✅ Set recurring payments

### Wallet
- ✅ Add funds (multiple methods)
- ✅ View balance
- ✅ Transaction history
- ✅ Receipt generation

### Analytics
- ✅ 12-month spending trends
- ✅ Category breakdown
- ✅ Monthly comparison
- ✅ AI insights & recommendations

### Profile
- ✅ Edit personal info
- ✅ Change password
- ✅ View account stats
- ✅ Dark mode toggle

---

## 🎨 Dark Mode

Click the **moon/sun icon** in the top-right to toggle dark mode.
Your preference is saved automatically.

---

## 📱 Mobile Responsive

The app works on:
- 📲 Phones (360px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1200px+)

---

## 🔐 Security Tips

1. **Change Password Regularly**
   - Profile → Change Password

2. **Never Share Credentials**
   - Keep your login info private

3. **Use HTTPS in Production**
   - Set up SSL certificate

4. **Delete Setup Files**
   - Already mentioned above

5. **Backup Your Database**
   - Export regularly in phpMyAdmin

---

## ⚙️ Configuration

Edit `api/config/db.php` to change database credentials:

```php
define('DB_HOST', 'localhost');      // Your database host
define('DB_USER', 'root');           // Your database user
define('DB_PASS', '');               // Your database password
define('DB_NAME', 'amepso_wallet');  // Database name
```

---

## 🆘 Common Issues & Fixes

### ❌ "Connection Refused"
- Check if MySQL is running
- Verify correct host/port
- Check database credentials

### ❌ "Table doesn't exist"
- Run setup.php again
- Check database is created
- Verify schema was imported

### ❌ "Unauthorized" Error
- Log in again
- Check browser localStorage
- Clear browser cache

### ❌ App shows blank page
- Check browser console (F12)
- Verify all files are in place
- Check web server logs

### ❌ Payment fails
- Check wallet balance
- Verify bill amount is correct
- Try adding funds first

---

## 📚 More Documentation

- **Backend Docs:** Open `BACKEND_README.md`
- **Architecture:** Open `ARCHITECTURE.md`
- **Integration:** Open `INTEGRATION_GUIDE.js`

---

## 🎯 Next Steps

After initial setup:

1. **Test All Features**
   - Create multiple accounts
   - Add various bills
   - Test payments

2. **Customize Settings**
   - Update company info
   - Set budget limits
   - Configure reminders

3. **Integrate with Frontend**
   - Follow INTEGRATION_GUIDE.js
   - Replace localStorage with API calls
   - Test all endpoints

4. **Deploy to Production**
   - Set up domain
   - Enable HTTPS
   - Configure backups
   - Monitor performance

---

## 💡 Tips & Tricks

✅ **Auto-Generate Test Data:**
Run this in MySQL:
```sql
INSERT INTO bills (user_id, description, amount, due_date, account_number, status)
VALUES (1, 'Test Bill', 2500, '2024-02-15', '123456789', 'pending');
```

✅ **Check API Response:**
Open browser DevTools (F12) → Network tab
Make an action and see the API response

✅ **View Database:**
Open phpMyAdmin and check tables for your data

✅ **Reset Everything:**
Delete `installed.lock` and run setup.php again

---

## 🎓 Learning Resources

- **PHP Basics:** https://www.php.net/manual/
- **MySQL Guide:** https://dev.mysql.com/doc/
- **REST API Concepts:** https://restfulapi.net/
- **JavaScript ES6:** https://javascript.info/

---

## 📞 Support

If you encounter issues:

1. Check browser console (F12 → Console)
2. Check server error logs
3. Review BACKEND_README.md
4. Verify database connectivity
5. Test with API tools (Postman, Thunder Client)

---

## 🎉 You're All Set!

Your AMEPSO E-Wallet is ready to use. Start by:

1. Opening `index.html`
2. Registering a new account
3. Adding some bills
4. Making test payments
5. Exploring the analytics

Enjoy managing your electricity bills! 💰

---

**Need Help?** See the full documentation files included in the project.

**Version:** 1.0.0  
**Last Updated:** January 2024
