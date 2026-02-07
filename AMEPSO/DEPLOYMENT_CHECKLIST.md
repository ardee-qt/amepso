# AMEPSO E-Wallet - Deployment Checklist

## 📋 Pre-Deployment

### Code Quality
- [ ] All PHP files follow PSR-2 coding standards
- [ ] No debug statements or console.log left
- [ ] All SQL queries use prepared statements
- [ ] Error messages are user-friendly
- [ ] Code comments are clear and helpful

### Security Review
- [ ] Passwords are hashed with bcrypt
- [ ] SQL injection prevention (prepared statements)
- [ ] XSS protection (no unescaped output)
- [ ] CSRF tokens implemented (if applicable)
- [ ] Sensitive data not logged
- [ ] No hardcoded credentials in code
- [ ] HTTPS will be enabled

### Database
- [ ] Schema is optimized
- [ ] Indexes created for performance
- [ ] Relationships defined with foreign keys
- [ ] Backup plan documented
- [ ] Data retention policy set

### Frontend
- [ ] All responsive breakpoints tested
- [ ] Dark mode works correctly
- [ ] Mobile navigation functional
- [ ] Forms validate input
- [ ] Error messages display properly
- [ ] Loading states show for API calls

---

## 🚀 Deployment Steps

### 1. **Environment Setup**

```bash
# Create production .env file
cp .env.example .env
# Edit .env with production credentials
nano .env
```

Update these values:
```
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASS=your-secure-password
DB_NAME=amepso_production
APP_ENV=production
APP_DEBUG=false
```

### 2. **Database Setup**

```bash
# Option A: Using setup.php (if web access available)
# 1. Open setup.php in browser
# 2. Enter production database credentials
# 3. Click Install Database

# Option B: Manual setup (recommended for security)
mysql -u your-user -p
CREATE DATABASE amepso_production;
USE amepso_production;
SOURCE database.sql;
```

### 3. **File Permissions**

```bash
# Set correct permissions (Linux/Mac)
chmod 755 api/
chmod 755 api/config/
chmod 644 api/*.php
chmod 644 api/config/db.php

# Ensure web server can read files
chown -R www-data:www-data /var/www/amepso
```

### 4. **Configuration**

```bash
# Update database connection
edit api/config/db.php
# Set: DB_HOST, DB_USER, DB_PASS, DB_NAME

# Secure the configuration file
chmod 600 api/config/db.php

# Set session storage path
mkdir -p sessions
chmod 700 sessions
```

### 5. **Delete Temporary Files**

```bash
# Remove setup files for security
rm setup.php
rm setup_action.php
rm .env.example
rm dt.php (if this was temporary)

# Optional: Keep only production files
rm README.md (or keep for reference)
```

### 6. **Enable HTTPS/SSL**

For production, enable SSL:

```bash
# If using Let's Encrypt
certbot certonly --webroot -w /var/www/amepso -d yourdomain.com

# Configure web server for HTTPS
# Apache: Edit vhost config
# Nginx: Update server block
```

### 7. **Set Up Web Server**

#### Apache Configuration
```apache
<VirtualHost *:443>
    ServerName amepso.com
    DocumentRoot /var/www/amepso
    
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    <Directory /var/www/amepso>
        RewriteEngine On
        RewriteRule ^$ public/ [L]
        RewriteRule ^(.*)$ public/$1 [L]
        AllowOverride All
    </Directory>
    
    <Directory /var/www/amepso/api>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name amepso.com;
    root /var/www/amepso;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        index index.html;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

### 8. **Enable CORS (if needed)**

In `api/config/db.php`:
```php
header('Access-Control-Allow-Origin: https://yourdomain.com');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
```

### 9. **Set Up Monitoring**

```bash
# Create log directory
mkdir -p logs
chmod 755 logs

# Configure PHP error logging
# In php.ini:
error_log = /var/www/amepso/logs/error.log

# Configure database backups
# Cron job:
0 2 * * * mysqldump -u user -p password amepso_production > /backups/amepso-$(date +\%Y\%m\%d).sql
```

### 10. **Set Up Email Notifications** (Optional)

Configure in `api/config/db.php`:
```php
define('MAIL_DRIVER', 'smtp');
define('MAIL_HOST', 'smtp.gmail.com');
define('MAIL_PORT', 587);
define('MAIL_USERNAME', 'your-email@gmail.com');
define('MAIL_PASSWORD', 'your-app-password');
```

---

## ✅ Post-Deployment Verification

### Functionality Tests
- [ ] User can register
- [ ] User can login
- [ ] Balance displays correctly
- [ ] Can add funds
- [ ] Can create bills
- [ ] Can pay bills
- [ ] Dark mode works
- [ ] Mobile responsive works
- [ ] Forms validate correctly
- [ ] Error messages display

### Performance Tests
- [ ] Page load time < 3s
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] Images compressed
- [ ] CSS/JS minified (optional)

### Security Tests
- [ ] HTTPS working
- [ ] Passwords hashed in DB
- [ ] API requires authentication
- [ ] Invalid tokens rejected
- [ ] CORS restricted properly
- [ ] No debug info exposed
- [ ] Setup files deleted

### API Tests
```bash
# Test with curl or Postman

# Register
curl -X POST https://amepso.com/api/auth.php?action=register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"pass123"}'

# Login
curl -X POST https://amepso.com/api/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Get balance
curl -X GET https://amepso.com/api/wallet.php?action=get_balance \
  -H "Authorization: Bearer TOKEN_HERE"
```

---

## 📊 Monitoring Setup

### Health Checks
```bash
# Check PHP
php --version

# Check MySQL
mysql -u user -p -e "SELECT 1"

# Check Disk Space
df -h

# Check Memory
free -h

# Check Processes
ps aux | grep php
```

### Error Logging
- [ ] PHP errors logged to file
- [ ] Database errors captured
- [ ] API errors logged with timestamps
- [ ] Access logs configured
- [ ] Error notification set up

### Performance Monitoring
- [ ] Database query times monitored
- [ ] API response times tracked
- [ ] CPU/Memory usage checked
- [ ] Disk space monitored
- [ ] Uptime monitored

---

## 🔄 Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Check disk space

### Weekly
- [ ] Review database size
- [ ] Check access logs
- [ ] Test critical features

### Monthly
- [ ] Database optimization
- [ ] Security updates
- [ ] Performance review
- [ ] Backup verification

### Quarterly
- [ ] Security audit
- [ ] Code review
- [ ] Database analysis
- [ ] Load testing

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Test connection
mysql -h host -u user -p database_name

# Check MySQL status
systemctl status mysql

# Verify credentials in db.php
cat api/config/db.php
```

### API Not Responding
```bash
# Check PHP-FPM
systemctl status php-fpm

# Check web server
systemctl status apache2  # or nginx

# Check logs
tail -f /var/log/apache2/error.log
```

### Performance Issues
```bash
# Check slow queries
mysql -e "SET GLOBAL slow_query_log = 'ON';"

# Monitor processes
top

# Check disk usage
du -sh /var/www/amepso/*
```

---

## 📝 Documentation Updates

After deployment:

- [ ] Update README with production URL
- [ ] Document any customizations
- [ ] Create runbook for common tasks
- [ ] Document backup procedures
- [ ] Update support contact info
- [ ] Document API base URL
- [ ] Create troubleshooting guide

---

## 🔐 Security Hardening

```bash
# Remove unnecessary files
rm -f setup.php setup_action.php dt.php

# Secure configuration
chmod 600 api/config/db.php

# Disable directory listing
echo "Options -Indexes" > .htaccess

# Set HTTPS only
echo "Header always set Strict-Transport-Security 'max-age=31536000'" >> .htaccess

# Set security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
```

---

## 📊 Backup Strategy

### Automatic Backups
```bash
# Daily at 2 AM
0 2 * * * /usr/bin/mysqldump -u root -p[PASSWORD] amepso_production | gzip > /backups/daily/amepso-$(date +%Y%m%d-%H%M%S).sql.gz

# Weekly full backup
0 3 * * 0 tar -czf /backups/weekly/amepso-$(date +%Y%m%d).tar.gz /var/www/amepso /backups/daily/
```

### Backup Verification
```bash
# Verify backup integrity
gunzip -t /backups/daily/backup.sql.gz

# Restore test
mysql < backup.sql
```

---

## ✨ Final Checklist

- [ ] Database created and populated
- [ ] Web server configured
- [ ] HTTPS/SSL enabled
- [ ] Environment variables set
- [ ] Setup files deleted
- [ ] Permissions correct
- [ ] Monitoring active
- [ ] Backups working
- [ ] Team trained
- [ ] Documentation complete
- [ ] Go-live testing passed
- [ ] Users notified

---

## 🎉 Go Live!

After completing all checks:

1. Announce to users
2. Monitor closely first 24 hours
3. Be ready for support calls
4. Check analytics
5. Celebrate! 🚀

---

**Deployment Version:** 1.0.0  
**Last Updated:** January 2024  
**Status:** Ready for Production
