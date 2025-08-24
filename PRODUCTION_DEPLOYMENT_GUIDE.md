# MATRATV CARE - Production Deployment Guide

## 🚀 Quick Start

1. **Database Setup**: Run `COMPLETE_DATABASE_SETUP.sql` in Supabase SQL Editor
2. **Environment Variables**: Configure all required environment variables
3. **Admin Setup**: Create admin account and configure UPI settings
4. **Deploy**: Deploy to your hosting platform
5. **Verify**: Run verification tests

## 📋 Prerequisites

- Supabase project with service role key
- Hosting platform (Netlify, Vercel, etc.)
- UPI merchant account for payments
- Domain name (optional but recommended)

## 🔧 Environment Variables

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

## 🗄️ Database Setup

### Step 1: Run Complete Database Setup

1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Copy and paste the entire contents of `COMPLETE_DATABASE_SETUP.sql`
4. Click "Run" to execute

### Step 2: Verify Database Setup

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

-- Check if all functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'process_referral_rewards', 'distribute_referral_commissions',
    'check_user_subscription_status', 'update_user_subscription_status',
    'get_user_subscription_requests', 'check_admin_status',
    'get_active_upi_config'
);
```

## 👨‍💼 Admin Setup

### Step 1: Create Admin Account

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

### Step 2: Configure UPI Settings

1. Log into the admin panel at `/admin`
2. Go to UPI Settings
3. Add your UPI ID and merchant name
4. Set as primary UPI

## 🌐 Deployment

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables in Netlify dashboard
4. Deploy

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set build settings:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variables in Vercel dashboard
4. Deploy

### Manual Deployment

```bash
# Build the project
npm run build

# Upload dist/ folder to your web server
```

## ✅ Verification Checklist

### 1. Database Verification

- [ ] All tables created successfully
- [ ] All functions working
- [ ] RLS policies active
- [ ] Triggers functioning

### 2. Admin Panel Verification

- [ ] Can log into admin panel
- [ ] UPI settings can be configured
- [ ] Can view subscription requests
- [ ] Can approve/reject requests
- [ ] Can manage withdrawal requests

### 3. User Features Verification

- [ ] User registration works
- [ ] Referral codes generate correctly
- [ ] Subscription page loads
- [ ] Payment proof upload works
- [ ] Referral rewards trigger on activation

### 4. E-commerce Verification

- [ ] Products display correctly
- [ ] Cart functionality works
- [ ] Checkout process completes
- [ ] Order status updates

## 🔍 Testing Procedures

### Test Referral System

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

### Test Subscription System

1. Submit subscription request with payment proof
2. Approve request as admin
3. Verify user gets access to premium features

### Test Payment System

1. Create test order
2. Complete payment process
3. Verify order status updates
4. Check referral commissions for orders

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

## 📋 7-Level Referral System Workflow

### System Overview
The MATRATV CARE platform implements a sophisticated 7-level fixed reward system where users can earn rewards by referring others to the platform. The system automatically tracks referrals up to 7 levels deep and distributes fixed reward amounts at each level.

### Default Reward Structure
- **Level 1**: ₹200 (Direct referral)
- **Level 2**: ₹15
- **Level 3**: ₹11
- **Level 4**: ₹9
- **Level 5**: ₹7
- **Level 6**: ₹5
- **Level 7**: ₹3

### Reward Triggers
1. **Subscription Activation**: When a user's subscription status changes from 'inactive' to 'active'
2. **Order Purchase**: When a user completes a purchase (percentage-based commissions)

### Admin Management
- **Reward Configuration**: Modify reward amounts for each level via admin panel
- **User Analytics**: View referral networks and performance metrics
- **Order Management**: Process orders and trigger reward distribution
- **Withdrawal Requests**: Approve/reject user withdrawal requests

### Key Features
- **Automatic Distribution**: Rewards are distributed automatically via database triggers
- **Idempotent Operations**: Prevents duplicate rewards for the same event
- **Real-time Updates**: Dashboard shows live referral and reward data
- **Security**: Row Level Security (RLS) ensures data protection

---

**🎉 Your MATRATV CARE system is now ready for production!**
