# MATRATV CARE - Complete Setup Instructions

## 🚀 Quick Start Guide

This document provides complete setup instructions for the MATRATV CARE system. Follow these steps to get your system up and running.

## 📋 Prerequisites

- Supabase account and project
- Node.js (v16 or higher)
- npm or yarn package manager
- Hosting platform (Netlify, Vercel, etc.)

## 🔧 Step 1: Environment Setup

### 1.1 Create Environment Variables

Create a `.env` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site Configuration
VITE_SITE_URL=https://your-domain.com

# Razorpay (if using)
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID=your_ga_id
```

### 1.2 Get Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the following:
   - Project URL
   - Anon public key
   - Service role key (keep this secret!)

## 🗄️ Step 2: Database Setup

### 2.1 Run Database Setup

1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Copy and paste the entire contents of `COMPLETE_DATABASE_SETUP.sql`
4. Click "Run" to execute

### 2.2 Verify Database Setup

Run this verification query in SQL Editor:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles', 'products', 'orders', 'order_items',
    'referral_commissions', 'withdrawal_requests', 'cart_items',
    'subscription_requests', 'subscription_plans', 'user_subscriptions',
    'admins', 'system_settings'
);
```

## 👨‍💼 Step 3: Admin Setup

### 3.1 Create Admin Account

Run this SQL to create your first admin account:

```sql
INSERT INTO admins (
    email, 
    password_hash, 
    full_name, 
    is_active
) VALUES (
    'your-admin-email@example.com',
    crypt('your-secure-password', gen_salt('bf')),
    'Admin Name',
    true
);
```

### 3.2 Configure UPI Settings

1. Log into the admin panel at `/admin`
2. Go to UPI Settings
3. Add your UPI ID and merchant name
4. Set as primary UPI

## 🌐 Step 4: Application Setup

### 4.1 Install Dependencies

```bash
npm install
```

### 4.2 Build the Application

```bash
npm run build
```

### 4.3 Deploy to Hosting Platform

#### Netlify Deployment
1. Connect your GitHub repository to Netlify
2. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables in Netlify dashboard
4. Deploy

#### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set build settings:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variables in Vercel dashboard
4. Deploy

## ✅ Step 5: Verification

### 5.1 Test Core Features

1. **User Registration**: Create a test user account
2. **Referral System**: Test referral code generation and usage
3. **Subscription**: Submit and approve a subscription request
4. **Admin Panel**: Log into admin panel and verify access
5. **E-commerce**: Test product display and cart functionality

### 5.2 Test Referral System

1. Create test users with referral codes
2. Activate subscription for referred user
3. Verify rewards are distributed:

```sql
-- Check referral commissions
SELECT * FROM referral_commissions 
WHERE trigger_type = 'subscription_activation' 
ORDER BY created_at DESC;

-- Check user balances
SELECT full_name, total_earnings, available_balance 
FROM user_profiles 
WHERE total_earnings > 0;
```

## 🔧 System Features

### Core Features
- ✅ **User Authentication**: Secure login/registration system
- ✅ **E-commerce**: Product catalog, shopping cart, checkout
- ✅ **7-Level Referral System**: Fixed reward structure
- ✅ **Subscription Management**: Payment verification and activation
- ✅ **Admin Panel**: Complete management interface
- ✅ **Withdrawal System**: User withdrawal requests
- ✅ **UPI Integration**: Payment processing

### Referral Reward Structure
- **Level 1**: ₹200 (Direct referral)
- **Level 2**: ₹15
- **Level 3**: ₹11
- **Level 4**: ₹9
- **Level 5**: ₹7
- **Level 6**: ₹5
- **Level 7**: ₹3

### Security Features
- Row Level Security (RLS) policies
- Encrypted admin passwords
- Secure file uploads
- Protected API endpoints

## 🛡️ Security Checklist

- [ ] Service role key is secure and not exposed
- [ ] RLS policies are properly configured
- [ ] Admin passwords are hashed
- [ ] File uploads are restricted to payment proofs
- [ ] API endpoints are protected

## 📊 Monitoring

### Key Metrics to Monitor
1. **User Registration**: Daily new users
2. **Subscription Conversion**: Registration to subscription rate
3. **Referral Activity**: Referral commissions created
4. **Payment Success**: Successful payment rate
5. **System Performance**: Response times and errors

### Log Monitoring
Monitor these logs in Supabase:
- Function execution logs
- RLS policy violations
- Authentication events
- Database errors

## 🔧 Maintenance

### Regular Tasks
1. **Weekly**: Review pending subscription requests
2. **Weekly**: Process withdrawal requests
3. **Monthly**: Review referral system performance
4. **Monthly**: Update reward configuration if needed

### Backup Strategy
- Enable Supabase point-in-time recovery
- Export critical data monthly
- Keep configuration backups

## 🆘 Troubleshooting

### Common Issues

1. **Referral rewards not triggering**
   - Check if `process_referral_rewards` function exists
   - Verify user has `referred_by` set
   - Check subscription status change

2. **Admin panel not accessible**
   - Verify admin account exists and is active
   - Check service role key configuration
   - Verify RLS policies

3. **Payment proofs not uploading**
   - Check storage bucket permissions
   - Verify file size limits
   - Check storage policies

### Debug Queries

```sql
-- Check referral chain
SELECT * FROM user_profiles WHERE referred_by IS NOT NULL;

-- Check recent commissions
SELECT * FROM referral_commissions ORDER BY created_at DESC LIMIT 10;

-- Check subscription requests
SELECT * FROM subscription_requests ORDER BY created_at DESC LIMIT 10;

-- Check admin accounts
SELECT email, is_active FROM admins;
```

## 📞 Support

For technical support:
1. Check the troubleshooting section above
2. Review Supabase logs for errors
3. Verify environment variables are set correctly
4. Test with a fresh database setup if needed

## 🎯 Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database setup completed
- [ ] Admin account created
- [ ] UPI settings configured
- [ ] All features tested
- [ ] Security measures in place
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Documentation complete

---

## 📁 Project Structure

```
matratv-connect/
├── COMPLETE_DATABASE_SETUP.sql     # Complete database setup
├── PRODUCTION_DEPLOYMENT_GUIDE.md  # Detailed deployment guide
├── SETUP_INSTRUCTIONS.md          # This file - quick setup guide
├── README.md                      # Project overview
├── src/                           # Application source code
├── supabase/                      # Supabase configuration
├── public/                        # Static assets
└── package.json                   # Dependencies
```

---

**🎉 Your MATRATV CARE system is now ready for production!**

For detailed information, refer to `PRODUCTION_DEPLOYMENT_GUIDE.md`.
