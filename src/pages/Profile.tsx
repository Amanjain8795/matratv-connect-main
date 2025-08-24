import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, 
  Wallet, 
  ShoppingBag, 
  Users, 
  Copy, 
  Share2,
  IndianRupee,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Edit,
  Save,
  Info
} from "lucide-react";
import { useAuth } from "@/context/NewAuthContext";
import {
  getUserOrders,
  getReferralCommissions,
  getReferredUsers,
  getReferrerInfo,
  getUserWithdrawalRequests,
  type Order,
  type ReferralCommission,
  type WithdrawalRequest
} from "@/lib/supabase";
import { WithdrawalRequestDialog } from "@/components/WithdrawalRequestDialog";
import { toast } from "@/components/ui/use-toast";
// Removed multi-level card view; we'll list all-level referrals in the table instead

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const Profile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [referrerInfo, setReferrerInfo] = useState<any>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const { user, profile, updateProfile, retry, requireAuth } = useAuth();
  const isAuthenticated = !!user;
  const { t } = useTranslation();
  
  const defaultTab = searchParams.get('tab') || 'personal';

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    setValue,
    watch
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
    }
  });


  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth();
      return;
    }
    
    if (profile) {
      setValue("full_name", profile.full_name || "");
      setValue("phone", profile.phone || "");
    }
  }, [isAuthenticated, profile, requireAuth, setValue]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Add automatic timeout for loading state
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('��� Profile loading timeout - stopping loading');
        setLoading(false);
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const fetchUserData = async () => {
    if (!user) {
      console.log('⚠️ No user found, skipping data fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('📊 Fetching user data for:', user.id);
      setLoading(true);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const { getAllLevelReferredUsers } = await import('@/lib/supabase');
      const dataPromise = Promise.all([
        getUserOrders(user.id),
        getReferralCommissions(user.id),
        getAllLevelReferredUsers(user.id),
        getReferrerInfo(user.id),
        getUserWithdrawalRequests(user.id)
      ]);

      const [ordersData, commissionsData, referredData, referrerData, withdrawalsData] = await Promise.race([
        dataPromise,
        timeoutPromise
      ]) as any;

      setOrders(ordersData || []);
      setCommissions(commissionsData || []);
      setReferredUsers(referredData || []);
      setReferrerInfo(referrerData || null);
      setWithdrawalRequests(withdrawalsData || []);
      console.log('✅ User data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data. Please try again.",
        variant: "destructive"
      });

      // Set empty arrays so UI doesn't stay in loading state
      setOrders([]);
      setCommissions([]);
      setReferredUsers([]);
      setReferrerInfo(null);
      setWithdrawalRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      setEditMode(false);
    } catch (error) {
      // Error handled in auth context
    }
  };

  const handleWithdrawalSuccess = () => {
    fetchUserData(); // Refresh data after successful withdrawal request
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'delivered':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'shipped':
        return <AlertCircle className="h-4 w-4 text-purple-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
      case 'rejected':
      case 'payment_failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'confirmed': 'default',
      'delivered': 'default',
      'approved': 'default',
      'processing': 'secondary',
      'shipped': 'secondary',
      'pending': 'secondary',
      'cancelled': 'destructive',
      'rejected': 'destructive',
      'payment_failed': 'destructive',
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const generateReferralLink = () => {
    if (!profile) return '';

    // Use environment variable for site URL if available, otherwise use current origin
    const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    return `${baseUrl}/register?ref=${profile.referral_code}`;
  };

  const copyReferralLink = () => {
    if (!profile) return;

    const referralLink = generateReferralLink();
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link Copied!",
      description: "Referral link has been copied to your clipboard."
    });
  };

  const shareReferralLink = async () => {
    if (!profile) return;

    const referralLink = generateReferralLink();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join MATRATV CARE',
          text: 'Join MATRATV CARE and get premium feminine care products. Use my referral code for exclusive benefits!',
          url: referralLink,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        // Fallback to copy if sharing fails
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Show loading only if user exists but profile is still loading AND we haven't timed out
  if (!profile && loading && user) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your profile...</p>
            <Button
              onClick={() => {
                setLoading(false);
                console.log('🛑 Loading manually stopped');
              }}
              variant="outline"
              className="mt-4"
              size="sm"
            >
              Cancel Loading
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If no profile and not loading, show error
  if (!profile) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We couldn't load your profile data. This might be a temporary issue.
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={retry} className="w-full sm:w-auto">
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-4 md:py-6 lg:py-8 max-w-7xl mx-auto">
      <Seo title={t("profile.title")} description="Manage your profile, view orders, and track referral earnings" />
      
      <div className="mb-4 md:mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2">{t("profile.title")}</h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
          Welcome back, {profile.full_name || user?.email}!
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-3 sm:space-y-4 md:space-y-6">
        <div className="w-full overflow-x-auto">
          <TabsList className="grid grid-cols-4 min-w-full h-auto p-1">
            <TabsTrigger value="personal" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base py-2 sm:py-3 px-2 sm:px-4">
              <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span className="text-[10px] sm:text-xs md:text-sm">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base py-2 sm:py-3 px-2 sm:px-4">
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span className="text-[10px] sm:text-xs md:text-sm">Earnings</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base py-2 sm:py-3 px-2 sm:px-4">
              <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span className="text-[10px] sm:text-xs md:text-sm">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base py-2 sm:py-3 px-2 sm:px-4">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span className="text-[10px] sm:text-xs md:text-sm">Referrals</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <CardTitle className="text-lg sm:text-xl">{t("profile.personalInfo")}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(!editMode)}
                className="w-full sm:w-auto"
              >
                {editMode ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm">Cancel</span>
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    <span className="text-sm">Edit</span>
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
                    <Input
                      id="full_name"
                      {...registerProfile("full_name")}
                      disabled={!editMode}
                      className="h-10 sm:h-11"
                    />
                    {profileErrors.full_name && (
                      <p className="text-xs sm:text-sm text-destructive">{profileErrors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      {...registerProfile("phone")}
                      disabled={!editMode}
                      className="h-10 sm:h-11"
                    />
                    {profileErrors.phone && (
                      <p className="text-xs sm:text-sm text-destructive">{profileErrors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <Input value={user?.email || ""} disabled className="h-10 sm:h-11" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Registration No.</Label>
                    <Input
                      value={profile.registration_number || "Generating..."}
                      disabled
                      className="h-10 sm:h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Member Since</Label>
                    <Input 
                      value={new Date(profile.created_at).toLocaleDateString()} 
                      disabled 
                      className="h-10 sm:h-11"
                    />
                  </div>
                </div>

                {editMode && (
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <Button type="submit" className="w-full sm:w-auto">
                      <Save className="h-4 w-4 mr-2" />
                      {t("profile.save")}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Referral Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Your Referral Code</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Share this code with friends to earn rewards when they subscribe
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Input
                  value={profile.referral_code}
                  disabled
                  className="font-mono text-base sm:text-lg text-center h-10 sm:h-11 flex-1"
                />
                <div className="flex gap-2 sm:gap-3">
                  <Button variant="outline" size="icon" onClick={copyReferralLink} className="h-10 sm:h-11 w-10 sm:w-11">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button onClick={shareReferralLink} className="flex-1 sm:flex-none h-10 sm:h-11">
                    <Share2 className="h-4 w-4 mr-2" />
                    <span className="text-sm">Share</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referred By Information */}
          {referrerInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Referred By
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  You were referred by this member
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium text-sm sm:text-base">
                        {referrerInfo.full_name || 'Anonymous User'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                        Referral Code: {referrerInfo.referral_code}
                      </p>
                      {referrerInfo.phone && (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Phone: {referrerInfo.phone}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs w-fit">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified Referrer
                    </Badge>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    <Info className="h-4 w-4 inline mr-2" />
                    Your referrer earns rewards when you activate your subscription and make purchases.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center">
                  <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-1" />
                  <span className="break-all">{profile.total_earnings.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Available Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center text-green-600">
                  <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-1" />
                  <span className="break-all">{profile.available_balance.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Withdrawn Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center">
                  <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-1" />
                  <span className="break-all">{profile.withdrawn_amount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <CardTitle className="text-lg sm:text-xl">Withdrawal Requests</CardTitle>
              <Button
                disabled={profile.available_balance < 10}
                onClick={() => setWithdrawalDialogOpen(true)}
                className="w-full sm:w-auto text-sm"
              >
                Request Withdrawal
              </Button>
            </CardHeader>
            <CardContent>
              {withdrawalRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No withdrawal requests yet
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                        <TableHead className="text-xs sm:text-sm min-w-[120px]">UPI ID</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="text-xs sm:text-sm">Requested</TableHead>
                        <TableHead className="text-xs sm:text-sm">Processed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawalRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            {formatPrice(request.amount)}
                          </TableCell>
                          <TableCell className="font-mono text-xs sm:text-sm break-all">
                            {request.upi_id || 'N/A'}
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {new Date(request.requested_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {request.processed_at
                              ? new Date(request.processed_at).toLocaleDateString()
                              : '-'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Commission History</CardTitle>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No commissions earned yet. Start referring friends to earn!
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Level</TableHead>
                        <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                        <TableHead className="text-xs sm:text-sm">Type</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              L{commission.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            {formatPrice(commission.commission_amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {(commission.trigger_type === 'subscription_activation') ? 'Sub' : 'Purchase'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(commission.status)}</TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {new Date(commission.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{t("profile.orders")}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No orders yet. Start shopping to see your orders here!
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm min-w-[100px]">Order ID</TableHead>
                        <TableHead className="text-xs sm:text-sm">Items</TableHead>
                        <TableHead className="text-xs sm:text-sm">Total</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs sm:text-sm">
                            {order.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {(order as any).order_items?.length || 0} item(s)
                          </TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            {formatPrice(order.total_amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{t("profile.referredUsers")}</CardTitle>
            </CardHeader>
            <CardContent>
              {referredUsers.length === 0 ? (
                <div className="text-center py-8 sm:py-12 space-y-4 sm:space-y-6">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-sm sm:text-base">No referrals yet</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      Share your referral code to start earning commissions!
                    </p>
                  </div>
                  <Button onClick={shareReferralLink} className="w-full sm:w-auto">
                    <Share2 className="h-4 w-4 mr-2" />
                    <span className="text-sm">Share Referral Link</span>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Name</TableHead>
                        <TableHead className="text-xs sm:text-sm">Level</TableHead>
                        <TableHead className="text-xs sm:text-sm">Joined Date</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referredUsers.map((referredUser, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            {referredUser.full_name || 'User'}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">L{referredUser.level || 1}</TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {new Date(referredUser.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="text-xs">Active</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={shareReferralLink} className="flex-1 h-10 sm:h-11">
                  <Share2 className="h-4 w-4 mr-2" />
                  <span className="text-sm">Share Referral Link</span>
                </Button>
                <Button onClick={copyReferralLink} variant="outline" className="flex-1 h-10 sm:h-11">
                  <Copy className="h-4 w-4 mr-2" />
                  <span className="text-sm">Copy Referral Code</span>
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-xs sm:text-sm">Visit the <strong>Rewards</strong> page to see detailed information about the 7-level referral system and track your earnings by level.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/rewards')}
                    className="w-full sm:w-auto text-xs"
                  >
                    View Rewards
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* UPI-enabled Withdrawal Request Dialog */}
      <WithdrawalRequestDialog
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
        onSuccess={handleWithdrawalSuccess}
      />
    </div>
  );
};
Profile.displayName = "Profile";

export default Profile;
