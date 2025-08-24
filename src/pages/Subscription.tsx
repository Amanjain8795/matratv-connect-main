import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/NewAuthContext';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { 
  getSubscriptionPlans, 
  createSubscriptionRequest, 
  getUserSubscriptionRequests,
  getActiveUPIConfig,
  type SubscriptionPlan,
  type SubscriptionRequest 
} from '@/lib/supabase';
import { 
  Crown, 
  QrCode, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ArrowLeft,
  Shield,
  Star,
  Gift,
  Zap
} from 'lucide-react';
import QRCode from 'react-qr-code';
import Seo from '@/components/Seo';

const Subscription = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // State management
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [userRequests, setUserRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [upiConfig, setUpiConfig] = useState<any>(null);

  // Load data on component mount
  useEffect(() => {
    loadSubscriptionData();
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Check system status first
      const systemStatus = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co';

      if (systemStatus) {
        // Demo mode - show demo plans
        setPlans([{
          id: 'demo-plan',
          name: 'Premium Annual Plan',
          description: 'Full access to all MATRATV CARE features',
          price: 99.00,
          duration_months: 12,
          features: { features: ['Shopping Cart', 'Referral System', 'Premium Support', 'Unlimited Orders', 'Priority Support'] },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        setSelectedPlan({
          id: 'demo-plan',
          name: 'Premium Annual Plan (Demo)',
          description: 'Full access to all MATRATV CARE features - Demo Mode',
          price: 99.00,
          duration_months: 12,
          features: { features: ['Shopping Cart', 'Referral System', 'Premium Support'] },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setUserRequests([]);
        setUpiConfig({ upi_id: 'demo@upi', merchant_name: 'DEMO MERCHANT' });
        return;
      }

      const [plansData, requestsData, upiData] = await Promise.all([
        getSubscriptionPlans(),
        getUserSubscriptionRequests(user.id),
        getActiveUPIConfig()
      ]);

      setPlans(plansData);
      setUserRequests(requestsData);
      setUpiConfig(upiData);

      if (plansData.length > 0) {
        setSelectedPlan(plansData[0]); // Select first plan by default
      }
    } catch (error: any) {
      console.error('Error loading subscription data:', error?.message || error);

      // Show user-friendly error message
      toast({
        description: 'Unable to load subscription data. Please contact administrator.',
        variant: 'destructive'
      });

      setUserRequests([]);
      setUpiConfig({ upi_id: 'demo@upi', merchant_name: 'DEMO MERCHANT' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          description: 'Please upload an image (JPG, PNG, WebP) or PDF file',
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          description: 'File size must be less than 5MB',
          variant: 'destructive'
        });
        return;
      }

      setPaymentProof(file);
    }
  };

  const handleSubmitRequest = async () => {
    if (!user || !selectedPlan) return;

    if (!upiTransactionId.trim()) {
      toast({
        description: 'Please enter UPI transaction ID',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      await createSubscriptionRequest(
        user.id,
        upiTransactionId.trim(),
        selectedPlan.price,
        paymentProof || undefined
      );

      toast({
        description: 'Subscription request submitted successfully! Please wait for admin approval.',
        variant: 'default'
      });

      // Reset form
      setUpiTransactionId('');
      setPaymentProof(null);
      setShowQR(false);

      // Reload requests
      try {
        const updatedRequests = await getUserSubscriptionRequests(user.id);
        setUserRequests(updatedRequests);
      } catch (error: any) {
        console.error('Error reloading subscription requests:', error?.message || error);
        // Don't show error toast here since request was already submitted successfully
      }

    } catch (error: any) {
      console.error('Error submitting subscription request:', error?.message || error);
      toast({
        description: error?.message || 'Failed to submit subscription request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const generateUPIUrl = () => {
    if (!selectedPlan || !upiConfig?.upi_id) return '';
    
    const amount = selectedPlan.price.toFixed(2);
    const merchantName = upiConfig.merchant_name || 'MATRATV CARE';
    
    return `upi://pay?pa=${upiConfig.upi_id}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('MATRATV CARE Subscription')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Show subscription page even if user has active subscription (for admin management)
  const showActiveMessage = profile?.subscription_status === 'active';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <Seo
        title="Subscription - MATRATV CARE"
        description="Subscribe to MATRATV CARE premium features including shopping cart, referral system, and more."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Active Subscription Message */}
          {showActiveMessage && (
            <div className="mb-8">
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl text-green-600">Active Subscription</CardTitle>
                  <CardDescription>
                    You already have an active subscription and can access all features.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button onClick={() => navigate('/')} className="mr-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go to Home
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Refresh Status
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {showActiveMessage ? 'Manage Your Subscription' : 'Unlock Premium Features'}
            </h1>
            <p className="text-lg text-gray-600">
              {showActiveMessage
                ? 'Your subscription details and renewal options'
                : 'Subscribe to access all MATRATV CARE features including shopping, referrals, and exclusive benefits'
              }
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Subscription Plans */}
            <div className="space-y-6">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedPlan?.id === plan.id 
                      ? 'ring-2 ring-purple-500 shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription className="mt-1">{plan.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">₹{plan.price}</div>
                        <div className="text-sm text-gray-500">for {plan.duration_months} months</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">What's Included:</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {plan.features?.features?.map((feature: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Additional premium features */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-gray-600">Secure Shopping</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-xs text-gray-600">Premium Support</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-purple-500" />
                          <span className="text-xs text-gray-600">Referral Earnings</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-orange-500" />
                          <span className="text-xs text-gray-600">Fast Checkout</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Payment Section */}
            <div className="space-y-6">
              
              {/* Payment Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Payment Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-semibold text-purple-600">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Generate QR Code</p>
                        <p className="text-sm text-gray-600">Click "Show QR Code" to generate payment QR</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-semibold text-purple-600">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Make Payment</p>
                        <p className="text-sm text-gray-600">Scan QR with any UPI app and pay ₹{selectedPlan?.price}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-semibold text-purple-600">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Submit Proof</p>
                        <p className="text-sm text-gray-600">Upload payment screenshot and transaction ID</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <Button 
                    onClick={() => setShowQR(true)} 
                    className="w-full"
                    disabled={!selectedPlan || !upiConfig?.upi_id}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Show QR Code
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Proof Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Payment Proof
                  </CardTitle>
                  <CardDescription>
                    After making payment, upload proof and transaction details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="transaction-id">UPI Transaction ID *</Label>
                    <Input
                      id="transaction-id"
                      placeholder="Enter UPI transaction ID"
                      value={upiTransactionId}
                      onChange={(e) => setUpiTransactionId(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="payment-proof">Payment Screenshot (Optional)</Label>
                    <Input
                      id="payment-proof"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                    {paymentProof && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ {paymentProof.name} selected
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleSubmitRequest}
                    disabled={submitting || !upiTransactionId.trim()}
                    className="w-full"
                  >
                    {submitting ? 'Submitting...' : 'Submit for Verification'}
                  </Button>
                </CardContent>
              </Card>

              {/* Previous Requests */}
              {userRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Subscription Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userRequests.map((request) => (
                        <div key={request.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">₹{request.amount}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(request.requested_at).toLocaleDateString()}
                            </p>
                            {request.admin_notes && (
                              <p className="text-xs text-gray-500 mt-1">{request.admin_notes}</p>
                            )}
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR to Pay</DialogTitle>
            <DialogDescription>
              Scan this QR code with any UPI app to pay ₹{selectedPlan?.price}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center p-6 bg-white rounded-lg border">
              {generateUPIUrl() && (
                <QRCode
                  value={generateUPIUrl()}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              )}
            </div>
            
            <div className="space-y-2 text-center">
              <p className="font-medium">Payment Details</p>
              <p className="text-sm text-gray-600">Amount: ₹{selectedPlan?.price}</p>
              <p className="text-sm text-gray-600">UPI ID: {upiConfig?.upi_id}</p>
              <p className="text-sm text-gray-600">Merchant: {upiConfig?.merchant_name || 'MATRATV CARE'}</p>
            </div>
            
            <Alert>
              <AlertDescription>
                After payment, come back to this page and upload your payment proof with transaction ID.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Subscription;
