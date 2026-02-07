# AMEPSO E-Wallet - Frontend-Backend Integration Guide

This guide shows how to modify `index.js` to use PHP APIs instead of localStorage.
Implement these changes gradually to integrate with the backend.

---

## 1. AUTHENTICATION INTEGRATION

### Replace handleRegister() Method

**OLD:** Uses localStorage only  
**NEW:** Calls PHP register endpoint

```javascript
handleRegister_NewVersion() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) {
        this.showNotification('Please fill in all fields', 'error');
        return;
    }

    if (!this.validateEmail(email)) {
        this.showNotification('Invalid email format', 'error');
        return;
    }

    if (!this.validatePassword(password)) {
        this.showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    // Call PHP register endpoint
    fetch('/api/auth.php?action=register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Save token to localStorage
            localStorage.setItem('auth_token', data.data.token);
            localStorage.setItem('user_id', data.data.user.id);
            
            this.showNotification('Registration successful!', 'success');
            
            // Clear form and show dashboard
            setTimeout(() => {
                this.showDashboard();
            }, 1500);
        } else {
            this.showNotification(data.message || 'Registration failed', 'error');
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        this.showNotification('Network error: ' + error.message, 'error');
    });
}
```

### Replace handleLogin() Method

```javascript
handleLogin_NewVersion() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        this.showNotification('Please enter email and password', 'error');
        return;
    }

    // Call PHP login endpoint
    fetch('/api/auth.php?action=login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Save token and user data
            localStorage.setItem('auth_token', data.data.token);
            localStorage.setItem('user_id', data.data.user.id);
            localStorage.setItem('user_name', data.data.user.name);
            
            this.showNotification('Login successful!', 'success');
            
            setTimeout(() => {
                this.showDashboard();
            }, 1500);
        } else {
            this.showNotification(data.message || 'Login failed', 'error');
        }
    })
    .catch(error => {
        this.showNotification('Network error: ' + error.message, 'error');
    });
}
```

---

## 2. WALLET & BALANCE INTEGRATION

### Fetch Balance from Backend

Replace `updateBalance()` method:

```javascript
updateBalance_NewVersion() {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        this.showWelcome();
        return;
    }

    fetch('/api/wallet.php?action=get_balance', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            this.userData.balance = data.data.balance;
            document.getElementById('balanceAmount').textContent = 
                '₱' + this.userData.balance.toLocaleString('en-US', { minimumFractionDigits: 2 });
        } else {
            this.showNotification('Failed to fetch balance', 'error');
        }
    })
    .catch(error => console.error('Balance fetch error:', error));
}
```

### Add Funds Using Backend

Replace `addFunds()` method:

```javascript
addFunds_NewVersion() {
    const amount = parseFloat(document.getElementById('fundsAmount').value);
    const paymentMethod = document.getElementById('paymentMethod').value;

    if (!amount || amount <= 0) {
        this.showNotification('Invalid amount', 'error');
        return;
    }

    const token = localStorage.getItem('auth_token');

    fetch('/api/wallet.php?action=add_funds', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            amount: amount,
            payment_method: paymentMethod,
            description: 'Add Funds'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            this.showNotification('Funds added successfully!', 'success');
            
            // Refresh balance
            setTimeout(() => {
                this.updateBalance_NewVersion();
                this.updateBillHistory_NewVersion();
                this.closeAllModals();
            }, 1500);
        } else {
            this.showNotification(data.message || 'Failed to add funds', 'error');
        }
    })
    .catch(error => this.showNotification('Error: ' + error.message, 'error'));
}
```

---

## 3. BILLS INTEGRATION

### Fetch Bills from Backend

Replace `updateBillHistory()` method:

```javascript
updateBillHistory_NewVersion() {
    const token = localStorage.getItem('auth_token');
    
    fetch('/api/bills.php?action=get_all', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update UI with bills data
            const billsList = document.getElementById('billsList');
            billsList.innerHTML = '';
            
            data.data.forEach(bill => {
                const billItem = document.createElement('div');
                billItem.className = 'bill-item';
                billItem.innerHTML = `
                    <div class="bill-info">
                        <h4>${bill.description}</h4>
                        <p>${bill.due_date}</p>
                    </div>
                    <div class="bill-amount">₱${bill.amount.toLocaleString()}</div>
                    <button onclick="app.selectBillForPayment(${bill.id}, ${bill.amount})" class="btn-pay">
                        Pay
                    </button>
                `;
                billsList.appendChild(billItem);
            });
        }
    })
    .catch(error => console.error('Bills fetch error:', error));
}
```

### Pay Bill Using Backend

Replace `payElectricityBill()` method:

```javascript
payElectricityBill_NewVersion() {
    const billId = this.selectedBillId;
    const billAmount = this.selectedBillAmount;
    const token = localStorage.getItem('auth_token');

    if (this.userData.balance < billAmount) {
        this.showNotification('Insufficient balance', 'error');
        return;
    }

    fetch('/api/bills.php?action=pay', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            bill_id: billId,
            payment_method: 'wallet'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            this.showNotification('Bill paid successfully!', 'success');
            
            // Update UI
            setTimeout(() => {
                this.updateBalance_NewVersion();
                this.updateBillHistory_NewVersion();
                this.updateUpcomingBills_NewVersion();
                this.closeAllModals();
            }, 1500);
        } else {
            this.showNotification(data.message || 'Payment failed', 'error');
        }
    })
    .catch(error => this.showNotification('Error: ' + error.message, 'error'));
}
```

---

## 4. PROFILE INTEGRATION

### Load User Profile from Backend

```javascript
loadProfileData_NewVersion() {
    const token = localStorage.getItem('auth_token');
    
    fetch('/api/profile.php?action=get_profile', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const profile = data.data;
            document.getElementById('profileName').value = profile.name;
            document.getElementById('profileEmail').value = profile.email;
            document.getElementById('profilePhone').value = profile.phone || '';
            document.getElementById('profileAddress').value = profile.address || '';
            document.getElementById('profileBalance').textContent = 
                '₱' + profile.balance.toLocaleString('en-US', { minimumFractionDigits: 2 });
        }
    })
    .catch(error => console.error('Profile load error:', error));
}
```

### Update Profile with Backend

```javascript
saveProfileChanges_NewVersion() {
    const token = localStorage.getItem('auth_token');
    
    const profileData = {
        name: document.getElementById('profileName').value,
        email: document.getElementById('profileEmail').value,
        phone: document.getElementById('profilePhone').value,
        address: document.getElementById('profileAddress').value
    };

    fetch('/api/profile.php?action=update_profile', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            this.showNotification('Profile updated successfully!', 'success');
        } else {
            this.showNotification(data.message || 'Update failed', 'error');
        }
    })
    .catch(error => this.showNotification('Error: ' + error.message, 'error'));
}
```

---

## 5. ANALYTICS INTEGRATION

### Fetch Spending Trends

```javascript
fetchSpendingTrends_NewVersion() {
    const token = localStorage.getItem('auth_token');
    
    fetch('/api/analytics.php?action=get_spending_trends', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Format data for chart
            const labels = data.data.map(item => item.month);
            const amounts = data.data.map(item => item.total);
            
            // Update chart with new data
            this.drawSpendingChart(labels, amounts);
        }
    })
    .catch(error => console.error('Analytics fetch error:', error));
}
```

### Fetch Spending Insights

```javascript
fetchSpendingInsights_NewVersion() {
    const token = localStorage.getItem('auth_token');
    
    fetch('/api/analytics.php?action=get_spending_insights', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const insights = data.data;
            
            // Display insights as notifications
            insights.insights.forEach(insight => {
                this.showNotification(insight.message, 
                    insight.type === 'warning' ? 'warning' : 'info');
            });
        }
    })
    .catch(error => console.error('Insights fetch error:', error));
}
```

---

## 6. LOGOUT INTEGRATION

### Logout and Clear Tokens

```javascript
handleLogout_NewVersion() {
    const token = localStorage.getItem('auth_token');
    
    fetch('/api/auth.php?action=logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Clear local storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        localStorage.removeItem('userData');
        
        this.showNotification('Logged out successfully', 'success');
        
        setTimeout(() => {
            this.showWelcome();
        }, 1500);
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Force logout even if API fails
        localStorage.removeItem('auth_token');
        this.showWelcome();
    });
}
```

---

## 7. HELPER FUNCTION - API CALL WRAPPER

Reusable API call function with error handling:

```javascript
async apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(endpoint, finalOptions);
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, logout
                this.handleLogout_NewVersion();
                return null;
            }
            throw new Error(data.message || 'API Error');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        this.showNotification(error.message, 'error');
        return null;
    }
}
```

---

## 8. INITIALIZATION - CALL ON APP START

Add this to the EWalletApp constructor after checking localStorage:

```javascript
initializeApp_WithBackend() {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
        // Verify token is still valid
        fetch('/api/auth.php?action=verify_token', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(r => r.json())
        .then(data => {
            if (data.valid) {
                this.showDashboard();
                this.updateBalance_NewVersion();
                this.loadProfileData_NewVersion();
                this.updateBillHistory_NewVersion();
            } else {
                // Token invalid, show login
                this.showWelcome();
            }
        })
        .catch(() => this.showWelcome());
    } else {
        this.showWelcome();
    }
}
```

---

## 📋 MIGRATION CHECKLIST

- [x] 1. Replace handleRegister() with backend call
- [x] 2. Replace handleLogin() with backend call
- [x] 3. Replace updateBalance() with API fetch
- [x] 4. Replace addFunds() with API call
- [x] 5. Replace payElectricityBill() with API call
- [x] 6. Replace updateBillHistory() with API fetch
- [x] 7. Replace loadProfileData() with API fetch
- [x] 8. Replace saveProfileChanges() with API call
- [x] 9. Replace changePassword() with API call
- [x] 10. Replace analytics with API calls
- [x] 11. Replace handleLogout() with API call
- [x] 12. Add token verification on app start
- [x] 13. Implement token refresh logic
- [x] 14. Add error handling for 401 Unauthorized
- [x] 15. Test all endpoints thoroughly

---

## ⚠️ ERROR HANDLING BEST PRACTICES

1. **Always check for token** before making requests
2. **Handle 401 (Unauthorized)** by clearing token and showing login
3. **Show user-friendly error messages** for API failures
4. **Log detailed errors** to console for debugging
5. **Implement retry logic** for failed requests
6. **Show loading spinners** during API calls
7. **Validate response data** before using it
8. **Test all error scenarios** before production

---

## 🔐 SECURITY NOTES

1. **Never store password** in localStorage
2. **Always use HTTPS** in production
3. **Validate all input** on both frontend and backend
4. **Implement rate limiting** on backend
5. **Use Content Security Policy** headers
6. **Sanitize all user input** before displaying
7. **Implement CSRF protection** tokens if needed
8. **Regular security audits** and updates

---

## 🚀 Next Steps

1. Copy each function from above into your `index.js` file
2. Replace the old methods with the new ones
3. Test each API endpoint thoroughly
4. Verify error handling works correctly
5. Test on different browsers and devices
6. Deploy to production when ready

---

**Happy coding!** 💻

For more details, see [BACKEND_README.md](BACKEND_README.md) for complete API documentation.
