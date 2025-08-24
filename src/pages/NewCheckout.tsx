import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  ShoppingCart, 
  CreditCard, 
  Lock,
  Loader2,
  AlertCircle,
  Truck,
  Shield,
  CheckCircle,
  ArrowLeft,
  Edit,
  Package
} from "lucide-react";
import { useAuth } from "@/context/NewAuthContext";
import { useCart } from "@/context/CartContext";
import { createOrder, type ShippingAddress } from "@/lib/supabase";
import { distributeCommissions } from "@/lib/referral";
import { toast } from "sonner";
import CartItem from "@/components/cart/CartItem";
import UpiPaymentDialog from "@/components/payment/UpiPaymentDialog";
import OrderSuccess from "@/components/checkout/OrderSuccess";
import { useUpiPayment } from "@/hooks/useUpiPayment";

const shippingSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().regex(/^[+]?[0-9]{10,14}$/, "Please enter a valid phone number"),
  address_line_1: z.string().min(5, "Street address is required"),
  address_line_2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postal_code: z.string().regex(/^[0-9]{6}$/, "Please enter a valid 6-digit postal code"),
  country: z.string().default("India"),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

const Checkout = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [showUpiDialog, setShowUpiDialog] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [currentUpiId, setCurrentUpiId] = useState<string>("");
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [tempOrderRef, setTempOrderRef] = useState<string>("");

  const { user, profile, requireAuth } = useAuth();
  const { items, totalAmount, clearCart } = useCart();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { testUpiConnection, getActiveUpiConfig, createPaymentNotification } = useUpiPayment();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
    reset
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    mode: "onChange",
    defaultValues: {
      country: "India",
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    if (!user) {
      requireAuth();
      return;
    }

    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    // Test UPI configuration
    testUpiConnection().then(isConfigured => {
      if (!isConfigured) {
        console.warn('UPI not configured - payment may fail');
      }
    });

    // Load saved addresses (mock data for now)
    const mockAddresses: ShippingAddress[] = [
      {
        full_name: profile?.full_name || "John Doe",
        phone: profile?.phone || "+91-9876543210",
        address_line_1: "123 Main Street",
        address_line_2: "Apartment 4B",
        city: "Mumbai",
        state: "Maharashtra",
        postal_code: "400001",
        country: "India"
      }
    ];
    setSavedAddresses(mockAddresses);
  }, [user, items.length, navigate, requireAuth, profile, testUpiConnection]);

  useEffect(() => {
    if (profile) {
      setValue('full_name', profile.full_name || '');
      setValue('phone', profile.phone || '');
    }
  }, [profile, setValue]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStepProgress = () => {
    if (orderCompleted) return 100;
    switch (currentStep) {
      case 1: return 25;
      case 2: return 50;
      case 3: return 75;
      default: return 0;
    }
  };

  const handleStepChange = (step: number) => {
    if (step < currentStep || (step === 2 && currentStep === 1 && isValid)) {
      setCurrentStep(step);
    }
  };

  const handleUseAddress = (index: number) => {
    const address = savedAddresses[index];
    Object.keys(address).forEach((key) => {
      setValue(key as keyof ShippingFormData, address[key as keyof ShippingAddress] as any);
    });
    setSelectedAddressIndex(index);
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Mock location to address conversion
          setValue('city', 'Mumbai');
          setValue('state', 'Maharashtra');
          setValue('postal_code', '400001');
          
          toast.success("Location detected successfully");
        } catch (error) {
          toast.error("Failed to get address from location");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        toast.error("Location access denied");
      }
    );
  };

  const handleContinueToPayment = (data: ShippingFormData) => {
    setCurrentStep(2);
  };

  const handlePlaceOrder = async (shippingData: ShippingFormData) => {
    if (!agreeToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    try {
      setLoading(true);
      setCurrentStep(3);

      console.log('🏦 Getting UPI configuration...');

      // Get active UPI configuration (but don't create order yet)
      const upiConfig = await getActiveUpiConfig();
      console.log('✅ UPI config loaded:', upiConfig);

      if (!upiConfig.upi_id) {
        throw new Error('No UPI ID configured. Please contact admin to set up payment method.');
      }

      setCurrentUpiId(upiConfig.upi_id);

      // Generate temporary order reference for UPI display
      const tempRef = `ORD-${Date.now().toString().slice(-8)}`;
      setTempOrderRef(tempRef);

      // Show UPI payment dialog (order will be created when user confirms payment)
      setShowUpiDialog(true);
      setLoading(false);
      setCurrentStep(2); // Go back to step 2 when dialog opens

    } catch (error: any) {
      console.error('UPI setup error:', error);
      setLoading(false);
      setCurrentStep(2);

      // Provide specific error messages
      let errorMessage = 'Failed to setup payment. Please try again.';

      if (error.message) {
        if (error.message.includes('UPI')) {
          errorMessage = 'UPI payment system is not configured. Please contact support.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('auth')) {
          errorMessage = 'Authentication error. Please log in again.';
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    }
  };

  const handlePaymentNotification = async () => {
    if (currentOrder) {
      // Order already exists, prevent duplicate creation
      toast.error("Order already created. Please refresh the page if you encounter issues.");
      return;
    }

    if (!user || !items || items.length === 0) {
      toast.error("Invalid order data. Please refresh and try again.");
      return;
    }

    if (!currentUpiId) {
      toast.error("UPI configuration not found. Please try again.");
      return;
    }

    try {
      console.log('🛒 Creating order after payment confirmation...');

      // Create order with pending status (payment verification handled via UPI notifications)
      const order = await createOrder(user!.id, items, watchedValues as ShippingFormData, 'pending');
      setCurrentOrder(order);

      console.log('✅ Order created:', order.id);

      // Create payment notification
      await createPaymentNotification(
        order.id,
        totalAmount,
        currentUpiId,
        orderNotes || "Payment completed via UPI"
      );

      // Distribute referral commissions
      try {
        await distributeCommissions(order.id, totalAmount, user!.id);
        console.log('✅ Commission distribution completed for order:', order.id);
      } catch (commissionError) {
        console.error('⚠️ Commission distribution failed:', commissionError);
        // Don't fail the order for commission errors
      }

      // Clear cart
      await clearCart();

      // Close UPI dialog and show success state
      setShowUpiDialog(false);
      setOrderCompleted(true);
      setCurrentStep(4); // New success step

      toast.success("Order created successfully! Payment verification is pending.");

    } catch (error: any) {
      console.error('Order creation error:', error);

      let errorMessage = 'Failed to create order. Please try again.';
      if (error.message) {
        if (error.message.includes('orders') && error.message.includes('does not exist')) {
          errorMessage = 'Database not properly configured. Please contact support.';
        } else if (error.message.includes('auth')) {
          errorMessage = 'Authentication error. Please log in again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    }
  };

  if (!user) {
    return null;
  }

  if (items.length === 0) {
    return (
      <>
        <Seo title="Checkout" description="Complete your order" />
        <div className="container py-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-bold">Your cart is empty</h1>
            <p className="text-muted-foreground">Add some products to continue with checkout</p>
            <Button asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title="Checkout" description="Complete your order securely with UPI" />
      
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/cart">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Cart
              </Link>
            </Button>
            
            <h1 className="text-3xl font-bold mb-4">Checkout</h1>
            
            {/* Progress Steps */}
            <div className="space-y-4">
              <Progress value={getStepProgress()} className="h-2" />
              <div className="flex justify-between text-sm">
                <button
                  onClick={() => handleStepChange(1)}
                  className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                  disabled={orderCompleted}
                >
                  {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
                  Shipping
                </button>
                <button
                  onClick={() => handleStepChange(2)}
                  className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                  disabled={currentStep < 2 || orderCompleted}
                >
                  {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
                  Payment
                </button>
                <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {currentStep > 3 ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
                  Processing
                </div>
                <div className={`flex items-center gap-2 ${orderCompleted ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {orderCompleted ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
                  Complete
                </div>
              </div>
            </div>
          </div>

          <div className={`grid gap-8 ${orderCompleted ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
            {/* Main Content */}
            <div className={`${orderCompleted ? 'col-span-1' : 'lg:col-span-2'} space-y-6`}>
              {/* Step 1: Shipping Details */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Saved Addresses */}
                    {savedAddresses.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Use saved address</h4>
                        {savedAddresses.map((address, index) => (
                          <Card 
                            key={index}
                            className={`cursor-pointer transition-colors ${
                              selectedAddressIndex === index ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleUseAddress(index)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{address.full_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {address.address_line_1}, {address.address_line_2 && `${address.address_line_2}, `}
                                    {address.city}, {address.state} {address.postal_code}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{address.phone}</p>
                                </div>
                                {selectedAddressIndex === index && (
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        <Separator />
                      </div>
                    )}

                    <form onSubmit={handleSubmit(handleContinueToPayment)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name *</Label>
                          <Input
                            id="full_name"
                            {...register("full_name")}
                            className={errors.full_name ? "border-destructive" : ""}
                          />
                          {errors.full_name && (
                            <p className="text-sm text-destructive">{errors.full_name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            {...register("phone")}
                            className={errors.phone ? "border-destructive" : ""}
                          />
                          {errors.phone && (
                            <p className="text-sm text-destructive">{errors.phone.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address_line_1">Street Address *</Label>
                        <Input
                          id="address_line_1"
                          {...register("address_line_1")}
                          placeholder="House number, street name"
                          className={errors.address_line_1 ? "border-destructive" : ""}
                        />
                        {errors.address_line_1 && (
                          <p className="text-sm text-destructive">{errors.address_line_1.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address_line_2">Apartment, suite, etc. (optional)</Label>
                        <Input
                          id="address_line_2"
                          {...register("address_line_2")}
                          placeholder="Apartment, suite, floor, etc."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            {...register("city")}
                            className={errors.city ? "border-destructive" : ""}
                          />
                          {errors.city && (
                            <p className="text-sm text-destructive">{errors.city.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            {...register("state")}
                            className={errors.state ? "border-destructive" : ""}
                          />
                          {errors.state && (
                            <p className="text-sm text-destructive">{errors.state.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="postal_code">Postal Code *</Label>
                          <Input
                            id="postal_code"
                            {...register("postal_code")}
                            placeholder="000000"
                            className={errors.postal_code ? "border-destructive" : ""}
                          />
                          {errors.postal_code && (
                            <p className="text-sm text-destructive">{errors.postal_code.message}</p>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGetLocation}
                        disabled={locationLoading}
                        className="w-full md:w-auto"
                      >
                        {locationLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="mr-2 h-4 w-4" />
                        )}
                        Use Current Location
                      </Button>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={!isValid}
                      >
                        Continue to Review
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Review & Payment */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Order Review */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Order Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {items.map((item) => (
                        <CartItem
                          key={item.id}
                          item={item}
                          variant="checkout"
                          showRemoveButton={false}
                          showQuantityControls={false}
                        />
                      ))}
                    </CardContent>
                  </Card>

                  {/* Shipping Address Review */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Shipping Address
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setCurrentStep(1)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <p className="font-medium">{watchedValues.full_name}</p>
                        <p>{watchedValues.address_line_1}</p>
                        {watchedValues.address_line_2 && <p>{watchedValues.address_line_2}</p>}
                        <p>{watchedValues.city}, {watchedValues.state} {watchedValues.postal_code}</p>
                        <p>{watchedValues.phone}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Notes (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Special instructions for your order..."
                        className="min-h-20"
                      />
                    </CardContent>
                  </Card>

                  {/* Terms and Payment */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start space-x-2">
                        <Checkbox 
                          id="terms"
                          checked={agreeToTerms}
                          onCheckedChange={setAgreeToTerms}
                        />
                        <label 
                          htmlFor="terms" 
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I agree to the{" "}
                          <Link to="/terms" className="text-primary hover:underline">
                            Terms and Conditions
                          </Link>{" "}
                          and{" "}
                          <Link to="/privacy" className="text-primary hover:underline">
                            Privacy Policy
                          </Link>
                        </label>
                      </div>

                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          Your payment will be processed securely via UPI. After payment, our admin will verify and update your order status.
                        </AlertDescription>
                      </Alert>

                      <Button
                        onClick={handleSubmit(handlePlaceOrder)}
                        className="w-full"
                        size="lg"
                        disabled={!agreeToTerms || loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing Order...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-5 w-5" />
                            Place Order - {formatPrice(totalAmount)}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 3: Processing */}
              {currentStep === 3 && !orderCompleted && (
                <Card>
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Processing your order...</h3>
                    <p className="text-muted-foreground">
                      Please wait while we create your order and prepare payment options.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Order Success */}
              {orderCompleted && currentOrder && (
                <OrderSuccess
                  orderReference={currentOrder.id.substring(0, 8)}
                  amount={totalAmount}
                  customerName={watchedValues.full_name || profile?.full_name || "Customer"}
                  estimatedDelivery="3-5 business days"
                />
              )}
            </div>

            {/* Order Summary Sidebar */}
            {!orderCompleted && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal ({items.length} items)</span>
                      <span className="font-medium">{formatPrice(totalAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span className="font-medium">Included</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Truck className="h-4 w-4" />
                      <span>Free delivery in 3-5 days</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>100% secure UPI payment</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Badges */}
              <Card>
                <CardContent className="p-4 text-center space-y-3">
                  <div className="flex justify-center">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-medium">Secure UPI Payment</h4>
                  <p className="text-sm text-muted-foreground">
                    Pay securely using any UPI app. Admin verification ensures order accuracy.
                  </p>
                </CardContent>
              </Card>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* UPI Payment Dialog */}
      {showUpiDialog && currentUpiId && (
        <UpiPaymentDialog
          open={showUpiDialog}
          onOpenChange={(open) => {
            setShowUpiDialog(open);
            if (!open) {
              // If dialog is closed without payment, reset to step 2
              setCurrentStep(2);
            }
          }}
          upiId={currentUpiId}
          amount={totalAmount}
          orderReference={currentOrder?.id.substring(0, 8) || tempOrderRef}
          merchantName="MATRATV CARE"
          onPaymentNotification={handlePaymentNotification}
        />
      )}
    </>
  );
};

export default Checkout;
