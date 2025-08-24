# MATRATV CARE Subscription System Setup Guide

This guide explains how to set up and configure the subscription system for MATRATV CARE.

## 🏗️ Database Setup

### 1. Run the Subscription Schema

Execute the SQL script in `docs/SUBSCRIPTION_SCHEMA.sql` in your Supabase SQL editor to create all necessary tables, policies, and functions.

```sql
-- The script includes:
-- - subscription_status column in user_profiles
-- - subscription_requests table
-- - subscription_plans table  
-- - user_subscriptions table
-- - RLS policies
-- - Storage bucket for payment proofs
-- - Helper functions
```

### 2. Default Settings

By default, existing users are set to 'active' subscription status for smooth migration. To require subscriptions for all users, comment out this line in the schema:

```sql
-- UPDATE user_profiles SET subscription_status = 'active' WHERE subscription_status IS NULL;
```

## 💰 Subscription Configuration

### Default Plan
The system includes a default subscription plan:
- **Name**: Premium Annual Plan
- **Price**: ₹99.00
- **Duration**: 12 months
- **Features**: Full access to all features

### UPI Configuration
The subscription page uses the admin UPI configuration from the existing system. Ensure your admin UPI settings are configured properly.

## 🔒 Feature Restrictions

### Protected Features
Non-subscribers cannot access:
- Shopping cart
- Adding products to cart
- Referral system
- Premium features

### Implementation
- **Frontend**: SubscriptionGuard component and useSubscriptionGuard hook
- **Backend**: RLS policies enforce database-level restrictions
- **Cart**: Context-level checks prevent cart modifications

## 🎛️ Admin Management

### Subscription Requests Tab
Admins can:
- View all pending subscription requests
- View payment proofs uploaded by users
- Approve/reject requests with notes
- Manually change any user's subscription status

### User Management
- Search and filter users
- View subscription status for all users
- Manually toggle subscription status
- Override subscription status regardless of payment

## 🔄 User Flow

### For Non-Subscribers
1. User tries to access restricted feature
2. Redirected to `/subscription` page
3. User sees subscription plans and pricing
4. User generates QR code for payment
5. User makes UPI payment
6. User uploads payment proof and transaction ID
7. Admin reviews and approves/rejects
8. User gains access to all features

### For Active Subscribers
- Full access to all features
- Subscription status shown in header
- No restrictions or redirects

## 🔧 Environment Variables

No additional environment variables required. The system uses existing Supabase configuration.

## 📱 User Interface

### Subscription Page (`/subscription`)
- **QR Code Generation**: Dynamic UPI payment QR codes
- **Payment Proof Upload**: File upload with validation
- **Transaction ID Entry**: UPI transaction tracking
- **Request History**: Users can see their submission status

### Admin Panel
- **New Subscription Tab**: Manage all subscription requests
- **User Management**: Control subscription status directly
- **Payment Verification**: View uploaded payment proofs

### Feature Protection
- **SubscriptionGuard**: Wrapper component for protected content
- **SubscriptionButton**: Subscription-aware buttons
- **Header Integration**: Shows subscription status and quick access

## 🛡️ Security Features

### Data Protection
- **Row Level Security**: All tables have proper RLS policies
- **File Upload Security**: Payment proofs stored securely in Supabase storage
- **Admin Verification**: Manual approval process prevents fraud

### Access Control
- **Route Protection**: Subscription required for premium routes
- **Component Guards**: Individual components check subscription status
- **API Guards**: Database policies enforce subscription requirements

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration with new subscription requirement
- [ ] Subscription page QR code generation
- [ ] Payment proof upload functionality
- [ ] Admin approval/rejection workflow
- [ ] Feature restrictions for non-subscribers
- [ ] Cart access blocking
- [ ] Referral system access blocking
- [ ] Manual subscription status updates

### Mock Mode
In development mode (placeholder Supabase credentials), the system:
- Shows active subscription for all users
- Displays mock subscription plans
- Simulates payment workflows
- Allows testing without real payments

## 🚀 Production Deployment

### Checklist
- [ ] Database schema deployed
- [ ] UPI credentials configured
- [ ] Storage bucket created and configured
- [ ] RLS policies active
- [ ] Admin accounts created
- [ ] Default subscription plan created
- [ ] Payment proof storage working

### Post-Deployment
1. Test the complete subscription flow
2. Configure admin notification system (optional)
3. Set up monitoring for subscription requests
4. Train admin users on approval process

## 🔄 Migration Strategy

### For Existing Users
1. **Immediate**: Existing users keep active status
2. **Gradual**: Set existing users to inactive and notify
3. **Granular**: Selective migration based on user criteria

### For New Users
- All new registrations require subscription
- Immediate redirect to subscription page after registration
- No access to premium features until subscription

## 📊 Analytics & Monitoring

### Key Metrics
- Subscription conversion rate
- Average time to payment approval
- User retention after subscription
- Revenue from subscriptions

### Admin Dashboard
- Pending requests count
- Approval/rejection statistics
- User subscription distribution
- Revenue tracking

## 🆘 Troubleshooting

### Common Issues

#### Users Not Redirected to Subscription
- Check `subscription_status` column in user profiles
- Verify authentication context is loading subscription status
- Ensure SubscriptionGuard components are properly implemented

#### Payment Proofs Not Uploading
- Check storage bucket permissions
- Verify RLS policies on storage.objects
- Ensure file size and type validation

#### Admin Cannot Approve Requests
- Verify admin authentication
- Check admin RLS policies
- Ensure service role key is configured

#### QR Code Not Generating
- Check UPI configuration in admin settings
- Verify `getActiveUPIConfig()` function
- Ensure admin UPI ID is set

### Debug Mode
Set `NODE_ENV=development` to enable detailed logging for subscription system.

## 📞 Support

For technical support with the subscription system:
1. Check the troubleshooting section above
2. Review browser console for JavaScript errors
3. Check Supabase logs for database errors
4. Verify all environment variables are set correctly

The subscription system is designed to be robust and production-ready with proper error handling and fallbacks throughout.
