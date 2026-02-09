# 🚀 AMEPSO E-Wallet Admin Dashboard - QUICK START GUIDE

## ⚡ Get Running in 3 Steps

### Step 1️⃣: Open Terminal
Navigate to the project folder:
```bash
cd "C:\Users\VIVOBOOK\OneDrive\Pictures\Attachments\Desktop\ADMIN"
```

### Step 2️⃣: Install Dependencies
```bash
npm install
```

This will install all required packages (React, Recharts, etc.)

### Step 3️⃣: Start Development Server
```bash
npm start
```

The app will automatically open in your browser at `http://localhost:3000`

---

## 🔐 Login Credentials

```
Email:    admin@amepso.com
Password: admin123
```

---

## 📱 What You'll See

After logging in, you'll have access to:

1. **Dashboard** - Overview with statistics and charts
2. **User Management** - Browse all users
3. **Transactions** - View all transactions
4. **Bills** - Manage bills and payments
5. **Recurring Payments** - Subscription management
6. **Analytics** - Spending insights and trends
7. **Add Funds** - Fund addition history
8. **Notifications** - Payment reminders
9. **Settings** - Profile and preferences

---

## 🎨 Try These Features

### Dark Mode / Light Mode
- Click the 🌙 icon in the sidebar (mobile) or navbar (desktop)
- Theme changes instantly across the entire app

### Search Table Data
- Type in the search box on any table
- Results filter in real-time
- Shows total matching records

### Filter by Status
- Click the filter dropdown on tables
- Select Active, Inactive, Paid, Pending, or Overdue
- Table updates automatically

### View Details
- Click any row in a table
- Modal dialog opens with full information
- Includes action buttons (Edit, Mark as Paid, etc.)

### Pagination
- Bottom of tables show page numbers
- Click to navigate between pages
- Shows 10 items per page

### Interactive Charts
- Charts respond to data changes
- Hover for tooltips
- Smooth animations

---

## 📁 Project Structure

```
ADMIN/
├── src/
│   ├── components/        (Reusable UI pieces)
│   ├── pages/            (Full page components)
│   ├── data/             (Mock data)
│   ├── styles/           (CSS)
│   ├── App.jsx           (Main component)
│   └── index.js          (Entry point)
├── public/
│   └── index.html        (HTML template)
├── package.json          (Dependencies)
└── README.md             (Full documentation)
```

---

## ⚙️ Customization

### Change Title
Edit `src/App.jsx` (currently "AMEPSO E-Wallet")

### Modify Mock Data
Edit `src/data/mockData.js` to add/change:
- Users
- Transactions
- Bills
- Analytics data

### Change Colors
Edit `src/styles/main.css` - look for:
```css
:root {
  --primary-color: #6366f1;  /* Change this! */
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
}
```

### Add New Pages
1. Create `src/pages/NewPage.jsx`
2. Add to navigation in `src/components/Sidebar.jsx`
3. Add route in `src/App.jsx`

---

## 🎯 Key Features

✅ **10 Complete Pages** - Login, Dashboard, Users, Transactions, Bills, Recurring, Analytics, Add Funds, Notifications, Settings

✅ **Dark/Light Mode** - Beautiful theme switching

✅ **Responsive Design** - Works on desktop, tablet, mobile

✅ **Interactive Tables** - Search, filter, pagination, click for details

✅ **Live Charts** - Line, Pie, Bar charts with Recharts

✅ **Modal Dialogs** - View details, edit profiles, change passwords

✅ **Status Badges** - Color-coded status indicators

✅ **Professional UI** - Modern fintech design

✅ **Mock Data** - 100+ realistic data objects

✅ **No Backend Required** - Fully frontend, ready for integration

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Try a different port
PORT=3001 npm start
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
npm cache clean --force
npm install
```

### Can't See Charts
Make sure Recharts is installed:
```bash
npm install recharts
```

### Page Not Updating
Check browser console (F12) for errors and refresh page (Ctrl+R)

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| README.md | Complete project documentation |
| SETUP.md | Setup and customization guide |
| PROJECT_SUMMARY.md | Detailed project overview |
| QUICK_START.md | This file! |

---

## 🎓 Learning Tips

1. **Explore Components** - All components are in `src/components/`
2. **See Mock Data** - Check `src/data/mockData.js`
3. **Understand Styling** - Main CSS is in `src/styles/main.css`
4. **Study Pages** - Each page is a separate component in `src/pages/`
5. **Check App.jsx** - See how everything connects

---

## ✨ Example Workflows

### To Add a New User:
1. Go to `src/data/mockData.js`
2. Add to `mockUsers` array:
```javascript
{
  id: 9,
  name: "New User",
  email: "user@email.com",
  phone: "+1 (555) 999-9999",
  balance: 5000.00,
  status: "Active",
  createdDate: "2024-02-09",
  avatar: "https://i.pravatar.cc/150?img=9"
}
```
3. Refresh app - new user appears!

### To Change Primary Color:
1. Go to `src/styles/main.css`
2. Find `:root {` section
3. Change `--primary-color: #6366f1;` to your color
4. Entire app updates automatically!

### To Add a New Navigation Item:
1. Go to `src/components/Sidebar.jsx`
2. Add to `navItems` array
3. Create new page component in `src/pages/`
4. Update routing in `src/App.jsx`

---

## 🚀 Next Level

### When Ready to Deploy:
```bash
npm run build
```
This creates an optimized `build/` folder ready for production!

### When Ready to Connect Backend:
Replace mock data imports with API calls:
```javascript
// Instead of:
import { mockUsers } from '../data/mockData';

// Use:
const [users, setUsers] = useState([]);
useEffect(() => {
  fetch('/api/users')
    .then(r => r.json())
    .then(setUsers);
}, []);
```

---

## 📞 Support Resources

- **React Docs**: https://react.dev
- **Recharts**: https://recharts.org
- **CSS Tips**: https://developer.mozilla.org/en-US/docs/Web/CSS

---

## 🎉 You're All Set!

Your professional admin dashboard is ready to:
- 📊 Display real-time statistics
- 💳 Manage transactions
- 👥 Handle users
- 📈 Show analytics
- 🎨 Switch themes
- 📱 Work on any device

**Start exploring now!** 🚀

```bash
npm start
```

---

**Happy coding!** ❤️

*AMEPSO E-Wallet Admin Dashboard - Professional Frontend Solution*
