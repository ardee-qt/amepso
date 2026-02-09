# AMEPSO E-Wallet Admin Dashboard - Setup Guide

## Quick Start

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm start
```

The app will open at `http://localhost:3000`

### Step 3: Login
Use the demo credentials:
- Email: `admin@amepso.com`
- Password: `admin123`

## What's Included

### 📊 Dashboard Components
- Real-time statistics cards
- Interactive charts (Line, Pie, Bar)
- Recent users and transactions tables
- User detail modal

### 👥 User Management
- Complete user directory
- Search and filter functionality
- Pagination (10 items per page)
- User profile details modal
- Avatar display

### 💳 Transactions
- Transaction listing with all details
- Status badges (Completed, Pending, Failed)
- Payment method indicators
- Transaction detail modal
- Download receipt option

### 📄 Bills & Payments
- Bill tracking with due dates
- Status indicators (Paid, Pending, Overdue)
- Days until due calculation
- Bill detail modal
- Send reminder functionality

### 🔄 Recurring Payments
- Card-based layout
- Active/Inactive toggle
- Next due date display
- Subscription management
- Edit payment option

### 📈 Analytics
- Monthly spending trends
- Category breakdown (Pie chart)
- Transaction frequency (Bar chart)
- Category trends over time
- Key performance metrics

### ➕ Add Funds History
- Fund addition tracking
- Payment method icons
- Transaction status display
- Fund addition detail modal
- Print receipt option

### 🔔 Notifications
- Payment reminders
- Status-based color coding
- User and date information
- Notification statistics

### ⚙️ Settings
- Profile information management
- Password change functionality
- Security settings (2FA)
- Language and timezone preferences
- Notification preferences
- Automatic backup option

## 🎨 Customization

### Change Theme Colors
Edit `src/styles/main.css` CSS variables:
```css
:root {
  --primary-color: #6366f1;      /* Change this */
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
}
```

### Modify Mock Data
Edit `src/data/mockData.js` to:
- Add/remove users
- Change transaction data
- Update bills
- Modify analytics data

### Add New Pages
1. Create `src/pages/NewPage.jsx`
2. Add to `src/pages/index.js`
3. Update Sidebar navigation in `src/components/Sidebar.jsx`
4. Add route in `src/App.jsx`

## 🚀 Building for Production

```bash
npm run build
```

Creates optimized production build in the `build/` folder.

## 📦 Dependencies

- **React 18.2**: UI library
- **Recharts 2.10**: Chart visualization
- **React Router 6.20**: Navigation (ready for integration)
- **React Scripts 5.0**: Build tools

## 🌙 Dark Mode

The app includes a built-in dark/light mode toggle:
- Toggle in sidebar (mobile) or navbar (desktop)
- Persists in component state
- All colors adapt automatically
- Custom CSS variables manage theming

## 📱 Responsive Design

Optimized for:
- **Desktop**: Full feature set (1024px+)
- **Tablet**: Optimized layout (768px - 1023px)
- **Mobile**: Touch-friendly interface (<768px)

## 🔐 Security Notes

**This is a frontend demo only.** For production:
1. Never hardcode credentials
2. Implement proper authentication
3. Add JWT tokens
4. Use secure API endpoints
5. Validate all inputs
6. Add CORS protection
7. Implement rate limiting

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Use different port
PORT=3001 npm start
```

### Dependencies not installing
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Chart components not displaying
Ensure `recharts` is properly installed:
```bash
npm install recharts
```

## 📝 File Structure Explanation

```
components/     - Reusable UI components (Sidebar, Navbar, Table, etc.)
pages/         - Full page components (Dashboard, Users, etc.)
data/          - Mock data for the application
styles/        - Global CSS and theme styling
App.jsx        - Main application component with routing
index.js       - React entry point
public/        - Static HTML template
```

## 🎯 Next Steps

1. **Connect Backend**: Replace mock data with API calls
2. **Add Authentication**: Implement real login system
3. **Deploy**: Push to Vercel, Netlify, or your server
4. **Enhance**: Add more features based on requirements

## 💡 Tips

- Use browser DevTools to inspect component states
- Check `main.css` for all available classes
- Mock data is easily searchable (ADMIN/src/data/mockData.js)
- All components are self-contained and reusable
- Charts update automatically when data changes

---

**Ready to go!** 🚀 Happy coding!
