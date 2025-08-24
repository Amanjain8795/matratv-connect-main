# MATRATV CARE - Complete E-commerce Platform

A modern, responsive e-commerce platform built specifically for feminine hygiene products with a comprehensive 7-level referral commission system.

## 🚀 Quick Start

1. **Setup**: Follow `SETUP_INSTRUCTIONS.md` for complete setup guide
2. **Database**: Run `COMPLETE_DATABASE_SETUP.sql` in Supabase
3. **Deploy**: Use `PRODUCTION_DEPLOYMENT_GUIDE.md` for deployment

## ✨ Features

### 🛒 E-commerce Core
- **Product Catalog**: Searchable and filterable product listings
- **Shopping Cart**: Persistent cart with localStorage and Supabase sync
- **Secure Checkout**: Address management with geolocation support
- **Payment Integration**: Razorpay payment gateway with Edge Functions
- **Order Management**: Complete order tracking and history

### 👥 Multi-Level Referral System
- **7-Level Commission Structure**: Earn commissions up to 7 levels deep
- **Automatic Tracking**: Referral links and code tracking
- **Commission Distribution**: Automatic commission calculation and distribution
- **Withdrawal System**: Request and manage earnings withdrawals
- **Referral Analytics**: Track referred users and earnings

### 🔐 Authentication & Security
- **Secure Authentication**: Supabase Auth with email verification
- **Profile Management**: Complete user profile system
- **Role-Based Access**: Admin dashboard with restricted access
- **Protected Routes**: Authentication enforcement for sensitive areas

### 📱 Mobile-First Design
- **Responsive Design**: Optimized for all device sizes
- **Mobile Navigation**: Touch-friendly hamburger menu
- **Progressive Web App**: Fast loading with modern web technologies

### 🌐 Internationalization
- **Bilingual Support**: English and Hindi language support
- **Persistent Language**: Language preference saved across sessions
- **Localized Content**: All UI elements and messages translated

### ⚡ Performance & UX
- **Lazy Loading**: Optimized component loading
- **Code Splitting**: Efficient bundle management
- **Error Boundaries**: Graceful error handling
- **Toast Notifications**: User-friendly feedback system

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast development
- **Tailwind CSS** for styling
- **ShadCN UI** components
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **TanStack Query** for state management
- **i18next** for internationalization

### Backend & Database
- **Supabase** for backend services
- **PostgreSQL** database with RLS
- **Supabase Edge Functions** for payment processing
- **Real-time subscriptions** for live updates

### Payment & External Services
- **Razorpay** payment gateway
- **OpenCage** geocoding API
- **Geolocation API** for address auto-fill

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Razorpay account (for payments)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd matratvcare
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file based on `.env.example`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site Configuration
VITE_SITE_URL=http://localhost:5173

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id

# Development Mode (set to 'false' for production)
VITE_DEV_MODE=true
```

### 4. Database Setup

#### Option A: Use the SQL Schema (Recommended)
1. Copy the SQL from the migration file in the docs
2. Run it in your Supabase SQL editor

#### Option B: Use Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### 5. Edge Functions Setup
```bash
# Deploy edge functions
supabase functions deploy create-payment-order
supabase functions deploy verify-payment

# Set up secrets
supabase secrets set RAZORPAY_KEY_ID=your_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_secret_key
```

### 6. Start Development Server
```bash
npm run dev
```

## 🗄️ Database Schema

### Core Tables
- `user_profiles` - User information and referral data
- `products` - Product catalog
- `product_categories` - Product categorization
- `orders` - Order management
- `order_items` - Order line items
- `cart_items` - Shopping cart storage

### Referral System
- `referral_commissions` - Commission tracking
- `withdrawal_requests` - Withdrawal management

### Key Features
- **Automatic Profile Creation**: Trigger-based profile creation
- **Referral Code Generation**: Unique code generation function
- **Commission Distribution**: Automated multi-level commission calculation
- **RLS Policies**: Row-level security for data protection

## 🎯 Referral System

### Commission Structure
- **Level 1**: 10% commission
- **Level 2**: 5% commission  
- **Level 3**: 3% commission
- **Level 4**: 2% commission
- **Level 5**: 1% commission
- **Level 6**: 0.5% commission
- **Level 7**: 0.5% commission

### How It Works
1. User registers with referral code
2. Referral chain is established automatically
3. On successful purchase, commissions are distributed
4. Users can track earnings and request withdrawals
5. Admins can approve/reject withdrawal requests

## 👨‍💼 Admin Features

### Dashboard Analytics
- Total users, orders, revenue tracking
- Product and withdrawal management
- Real-time statistics

### Product Management
- CRUD operations for products
- Category management
- Stock tracking
- Status management (active/inactive)

### Order Management
- View all orders
- Order status tracking
- Customer information

### Withdrawal Management
- Review withdrawal requests
- Approve/reject with admin notes
- User verification

### Access Control
Currently configured for `admin@matratvcare.com`. Update the admin check in `/src/pages/Admin.tsx` for production use.

## 🔒 Security Features

### Authentication
- Email verification required
- Password strength validation
- Secure session management

### Data Protection
- Row Level Security (RLS) on all tables
- User data isolation
- Admin role verification

### Payment Security
- Razorpay signature verification
- Server-side payment validation
- Secure webhook handling

## 📱 Mobile Responsiveness

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- Touch-friendly navigation
- Swipe gestures
- Optimized layouts
- Fast loading

## 🌐 Internationalization

### Supported Languages
- **English** (default)
- **Hindi** (हिंदी)

### Adding New Languages
1. Create translation file in `/src/i18n/locales/`
2. Add language option in `LanguageSwitcher`
3. Update i18n configuration

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

### Netlify
```bash
# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Environment Variables
Ensure all environment variables are set in your deployment platform.

## 🔧 Development

### Project Structure
```
src/
├── components/         # Reusable UI components
│   ├── auth/          # Authentication components
│   ├── layout/        # Layout components
│   └── ui/            # ShadCN UI components
├── context/           # React contexts
├── hooks/             # Custom React hooks
├── i18n/              # Internationalization
���── lib/               # Utilities and configurations
├── pages/             # Page components
└── main.tsx           # Application entry point
```

### Key Files
- `/src/lib/supabase.ts` - Database configuration and types
- `/src/lib/referral.ts` - Referral system utilities
- `/src/context/AuthContext.tsx` - Authentication state management
- `/src/context/CartContext.tsx` - Shopping cart management

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration with referral code
- [ ] Product browsing and filtering
- [ ] Cart functionality (add/remove/update)
- [ ] Checkout process with address
- [ ] Payment integration
- [ ] Referral link sharing
- [ ] Commission calculation
- [ ] Withdrawal requests
- [ ] Admin dashboard operations
- [ ] Mobile responsiveness
- [ ] Language switching

### Mock Data
The application includes mock data for development when Supabase is not configured. Set `VITE_DEV_MODE=true` to enable mock mode.

## 🐛 Troubleshooting

### Common Issues

#### Supabase Connection
- Verify environment variables
- Check Supabase project status
- Ensure RLS policies are configured

#### Payment Issues
- Verify Razorpay credentials
- Check Edge Functions deployment
- Review payment gateway configuration

#### Mobile Issues
- Test on actual devices
- Check responsive breakpoints
- Verify touch interactions

### Debug Mode
Enable debug mode by setting `VITE_DEV_MODE=true` in environment variables.

## 📈 Performance Optimization

### Bundle Optimization
- Code splitting with lazy loading
- Tree shaking for unused code
- Optimized asset loading

### Database Optimization
- Efficient queries with proper indexing
- Row Level Security for data filtering
- Connection pooling

### Caching Strategy
- Browser caching for static assets
- API response caching
- Image optimization

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Submit a pull request
5. Code review and merge

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for backend infrastructure
- [ShadCN UI](https://ui.shadcn.com/) for beautiful components
- [Tailwind CSS](https://tailwindcss.com/) for styling system
- [Razorpay](https://razorpay.com/) for payment processing
- [Lucide React](https://lucide.dev/) for iconography

## 📞 Support

For support, email support@matratvcare.com or create an issue in the repository.

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Basic e-commerce functionality
- [x] Multi-level referral system
- [x] Payment integration
- [x] Admin dashboard

### Phase 2 (Upcoming)
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Social media integration
- [ ] Advanced product filters
- [ ] Subscription products
- [ ] WhatsApp integration
- [ ] SMS notifications

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] AI-powered recommendations
- [ ] Advanced inventory management
- [ ] Multi-vendor support
- [ ] Advanced reporting
- [ ] Integration with accounting software

---

Built with ❤️ for feminine hygiene awareness and accessible healthcare.
