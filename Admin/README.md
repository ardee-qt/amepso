# ORMECO Payment System - Admin Dashboard

A comprehensive, responsive admin dashboard for managing ORMECO (Oriental Mindoro Electric Cooperative) electricity bill payments. Built with React, featuring dark mode, modern UI, and complete member account, transaction, and billing management.

## 🎯 Features

### Pages & Components
✅ **Login Page** - Clean authentication interface  
✅ **Dashboard** - Real-time statistics, charts, and overview  
✅ **Member Management** - Complete member account listing with search/filter  
✅ **Transactions** - ORMECO payment tracking and history  
✅ **Bills & Payments** - Electricity bill management with status tracking  
✅ **Auto-Pay** - Recurring ORMECO payment management  
✅ **Analytics** - Payment insights and consumption trends  
✅ **Add Funds History** - Wallet top-up tracking for payments  
✅ **Notifications** - ORMECO bill reminders and alerts  
✅ **Settings** - Profile and preferences management  

### Design Features
✨ Dark Mode & Light Mode Toggle  
✨ Fully Responsive (Desktop, Tablet, Mobile)  
✨ Modern Fintech Design  
✨ Soft Shadows & Rounded Cards  
✨ Smooth Animations & Transitions  
✨ Interactive Charts (Recharts)  
✨ Status Badges with Color Coding  
✨ Modal Dialogs  
✨ Search & Filter Functionality  
✨ Pagination Support  

## 📁 Project Structure

```
src/
├── components/           # Reusable React components
│   ├── Sidebar.jsx
│   ├── Navbar.jsx
│   ├── StatCard.jsx
│   ├── Table.jsx
│   ├── Modal.jsx
│   ├── StatusBadge.jsx
│   └── index.js
├── pages/               # Page components
│   ├── LoginPage.jsx
│   ├── Dashboard.jsx
│   ├── Users.jsx
│   ├── Transactions.jsx
│   ├── Bills.jsx
│   ├── RecurringPayments.jsx
│   ├── Analytics.jsx
│   ├── AddFunds.jsx
│   ├── Notifications.jsx
│   ├── Settings.jsx
│   └── index.js
├── data/                # Mock data
│   └── mockData.js
├── styles/              # CSS styles
│   └── main.css
├── App.jsx              # Main app component
├── index.js            # React entry point
└── public/
    └── index.html       # HTML template
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd path/to/ADMIN
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and go to `http://localhost:3000`

### Demo Credentials
- **Email**: admin@amepso.com
- **Password**: admin123

## 🗄️ Database Setup

The AMEPSO E-Wallet system includes a complete MySQL database schema ready for backend integration.

### Quick Database Setup

1. **Install MySQL Server** (5.7+ or MariaDB 10.2+)

2. **Create the database:**
```bash
mysql -u root -p < database/schema.sql
```

3. **(Optional) Load sample data:**
```bash
mysql -u root -p < database/seed.sql
```

4. **Configure environment:**
```bash
cp .env.example .env
# Edit .env and update database credentials
```

### Database Files

- `database/schema.sql` - Complete database structure
- `database/seed.sql` - Sample Filipino user data
- `database/DATABASE_SETUP.md` - Detailed setup guide
- `database/connection.example.js` - Node.js connection example
- `.env.example` - Environment variables template

### Database Features

✅ **8 Tables** - Members, Bills, Transactions, Auto-Pay, Budget, Analytics  
✅ **Security** - Password hashing, PIN protection, rate limiting  
✅ **Indexes** - Optimized for query performance  
✅ **Foreign Keys** - Data integrity and relationships  
✅ **Sample Data** - ORMECO members from Oriental Mindoro  
✅ **Payment Focus** - Exclusively for ORMECO electricity bill payments  

For detailed database documentation, see [database/DATABASE_SETUP.md](database/DATABASE_SETUP.md)

## 🎨 Design System

### Color Palette
- **Primary**: #6366f1 (Indigo)
- **Success**: #10b981 (Emerald)
- **Warning**: #f59e0b (Amber)
- **Error**: #ef4444 (Red)
- **Info**: #3b82f6 (Blue)

### Dark Mode
- **Background**: #0f172a
- **Surface**: #1e293b
- **Text**: #f1f5f9

## 📊 Mock Data

All data is simulated using mock objects in `mockData.js` with focus on ORMECO electricity payments:
- 8 sample member accounts
- 10 ORMECO payment transactions
- 8 electricity bills
- 7 auto-payment subscriptions
- 8 wallet top-up records
- 7 ORMECO bill notifications
- Payment analytics by customer type (Residential, Commercial, Industrial, etc.)

## 🔧 Customization

### Adding New Users
Edit `src/data/mockData.js` and update the `mockUsers` array.

### Changing Theme Colors
Modify CSS variables in `src/styles/main.css`:
```css
:root {
  --primary-color: #6366f1;
  --success-color: #10b981;
  /* ... more colors ... */
}
```

### Adding New Pages
1. Create a new component in `src/pages/`
2. Export it in `src/pages/index.js`
3. Add navigation item in `Sidebar.jsx`
4. Update `App.jsx` to route to the new page

## 📱 Responsive Breakpoints

- **Desktop**: 1024px and above
- **Tablet**: 768px - 1023px
- **Mobile**: Below 768px

## 🛠️ Technologies Used

- **React 18** - UI Library
- **Recharts** - Charts and Visualization
- **CSS3** - Styling (no CSS-in-JS)
- **JavaScript ES6+** - Core Logic

## 📝 Features Breakdown

### Sidebar Navigation
- 9 main navigation items
- Theme toggle button
- Active state indicator
- Responsive hamburger menu (mobile)

### Navbar
- Search functionality
- Theme toggle
- Notification bell
- User profile dropdown

### Statistics Cards
- Key metrics display
- Change percentage indicators
- Hover effects
- Icon backgrounds

### Tables
- Sortable columns
- Search filter
- Status filtering
- Pagination
- Row click handlers

### Modals
- User details view
- Transaction details
- Bill management
- Form inputs
- Confirm/Cancel actions

### Charts
- Line charts (trends)
- Pie charts (distribution)
- Bar charts (frequency)
- Tooltips and legends
- Responsive sizing

## 🔐 Security Notes

This is a **frontend-only** demonstration. In production:
- Implement proper authentication
- Use secure API calls
- Add request validation
- Implement error handling
- Add data encryption
- Use environment variables for sensitive data

## 🎯 Future Enhancements

- [ ] Backend API integration (Node.js/Express)
- [ ] Real MySQL database connection
- [ ] User authentication (JWT)
- [ ] Export data to CSV/PDF
- [ ] Advanced filtering options
- [ ] Real-time notifications (WebSocket)
- [ ] User activity logs
- [ ] Batch operations
- [ ] Custom date ranges
- [ ] Report generation
- [ ] User role management
- [ ] Audit trails
- [ ] Payment gateway integration (GCash, PayMaya)
- [ ] SMS notifications for Filipino users

## 📚 Documentation

- [Quick Start Guide](QUICK_START.md)
- [Setup Instructions](SETUP.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Database Setup](database/DATABASE_SETUP.md)
- [Complete Documentation](DOCUMENTATION_INDEX.md)

## 🌐 Localization
Optimized for ORMECO - Oriental Mindoro Electric Cooperative**
- **Purpose**: Exclusively for ORMECO electricity bill payments
- **Location**: Oriental Mindoro, Philippines
- **Currency**: Philippine Peso (₱)
- **Phone Format**: +63 (Philippine format)
- **Members**: Filipino users from Oriental Mindoro
- **Payment Methods**: GCash, PayMaya, BDO, BPI, Bank Transfer
- **Bill Types**: ORMECO Electricity Bills only
- **Customer Categories**: Residential, Commercial, Industrial, Agricultural, Government
- Bills: ORMECO electricity, PLDT, Globe, PhilHealth

## 📄 License

This project is open source and available for educational and commercial use.

## 👨‍💻 Author

Created with ❤️ as a professional Admin Dashboard UI.

---

**Note**: This is a frontend-only demonstration with mock data. To make it production-ready, integrate with a backend API and add proper authentication/authorization.
