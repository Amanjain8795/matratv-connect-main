import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { Copy, Check, Smartphone, CreditCard, X, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface UpiPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  upiId: string;
  amount: number;
  orderReference: string;
  merchantName?: string;
  onPaymentNotification: () => void;
}

export default function UpiPaymentDialog({
  open,
  onOpenChange,
  upiId,
  amount,
  orderReference,
  merchantName = "MATRATV CARE",
  onPaymentNotification
}: UpiPaymentDialogProps) {
  const [copied, setCopied] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isPaymentButtonEnabled, setIsPaymentButtonEnabled] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);

  // 30-second countdown timer
  useEffect(() => {
    if (open && !error) {
      setTimeRemaining(30);
      setIsPaymentButtonEnabled(false);
      setOrderCreated(false);

      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsPaymentButtonEnabled(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [open, error]);

  // Validate props when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);

      if (!upiId || !upiId.includes('@')) {
        setError('Invalid UPI ID provided. Please contact support.');
        return;
      }

      if (!amount || amount <= 0) {
        setError('Invalid amount provided. Please try again.');
        return;
      }

      if (!orderReference) {
        setError('Invalid order reference. Please try again.');
        return;
      }
    }
  }, [open, upiId, amount, orderReference]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Generate UPI URL for QR code and payments
  const generateUpiUrl = () => {
    try {
      // Validate UPI ID format
      if (!upiId || !upiId.includes('@')) {
        console.error('Invalid UPI ID format:', upiId);
        return '';
      }

      const params = new URLSearchParams({
        pa: upiId.trim(), // payee address
        pn: merchantName.trim(), // payee name
        am: amount.toFixed(2), // amount with 2 decimal places
        cu: 'INR', // currency
        tn: `Order ${orderReference} - MATRATV CARE` // transaction note
      });
      
      const url = `upi://pay?${params.toString()}`;
      console.log('Generated UPI URL:', url);
      return url;
    } catch (error) {
      console.error('Error generating UPI URL:', error);
      return '';
    }
  };

  const upiUrl = generateUpiUrl();

  const copyUpiId = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(upiId);
      } else {
        // Fallback for non-secure contexts or older browsers
        const textArea = document.createElement('textarea');
        textArea.value = upiId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("UPI ID copied to clipboard!");
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error("Failed to copy UPI ID. Please copy manually: " + upiId);
    }
  };

  const openUpiApp = () => {
    try {
      if (!upiUrl) {
        toast.error("Cannot generate UPI payment link. Please use UPI ID manually.");
        return;
      }

      // For mobile devices, try direct navigation
      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        window.location.href = upiUrl;
      } else {
        // For desktop, show instructions
        toast.success("Please open your mobile UPI app and scan the QR code or use the UPI ID: " + upiId);
      }
      
      // Show additional instructions after a delay
      setTimeout(() => {
        toast.info("If your UPI app didn't open automatically, please copy the UPI ID and use it manually in your UPI app.");
      }, 3000);
    } catch (error) {
      console.error('Failed to open UPI app:', error);
      toast.error("Please open your UPI app manually and use the UPI ID: " + upiId);
    }
  };

  const handlePaymentComplete = async () => {
    if (!isPaymentButtonEnabled || isCreatingOrder || orderCreated) {
      return;
    }

    setIsCreatingOrder(true);

    try {
      // Call the parent's payment notification handler which will now create the order
      await onPaymentNotification();
      setOrderCreated(true);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Failed to process payment:', error);
      toast.error("Failed to process payment. Please try again.");
      setIsCreatingOrder(false);
    }
  };

  const confirmPayment = () => {
    setShowConfirmation(false);
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setShowConfirmation(false);
      setError(null);
      setTimeRemaining(30);
      setIsPaymentButtonEnabled(false);
      setIsCreatingOrder(false);
      setOrderCreated(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {!showConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pay with UPI
              </DialogTitle>
              <DialogDescription>
                Scan QR code or use UPI ID to complete your payment
              </DialogDescription>
            </DialogHeader>

            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Amount Display */}
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatAmount(amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Order #{orderReference}
                    </div>
                  </CardContent>
                </Card>

                {/* QR Code Section */}
                {upiUrl && (
                  <div className="text-center space-y-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-dashed border-border inline-block">
                      <QRCode
                        value={upiUrl}
                        size={160}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Scan with any UPI app (PhonePe, Paytm, GPay, etc.)
                    </p>
                  </div>
                )}

                <Separator />

                {/* UPI ID Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">UPI ID:</span>
                    <Badge variant="secondary">{merchantName}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <code className="flex-1 text-sm font-mono break-all">{upiId}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyUpiId}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={openUpiApp} 
                    className="w-full"
                    size="lg"
                  >
                    <Smartphone className="mr-2 h-5 w-5" />
                    Pay via UPI App
                  </Button>
                  
                  <Button
                    onClick={handlePaymentComplete}
                    variant="outline"
                    className="w-full"
                    disabled={!isPaymentButtonEnabled || isCreatingOrder || orderCreated}
                  >
                    {isCreatingOrder ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Order...
                      </>
                    ) : !isPaymentButtonEnabled ? (
                      `Wait ${timeRemaining}s before confirming payment`
                    ) : orderCreated ? (
                      "Order Created Successfully"
                    ) : (
                      "I have completed the payment"
                    )}
                  </Button>

                  {/* Countdown Timer Display */}
                  {!isPaymentButtonEnabled && !error && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800">
                        Please wait {timeRemaining} seconds before confirming payment
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        This ensures you have enough time to complete the payment
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-center text-muted-foreground space-y-1">
                    <p>• Copy the UPI ID and paste in your UPI app</p>
                    <p>• Or scan the QR code with your UPI app</p>
                    <p>• After payment, click "I have completed the payment"</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
              <DialogDescription>
                Please confirm that you have completed the UPI payment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="text-lg font-semibold">
                      {formatAmount(amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Order #{orderReference}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      UPI ID: {upiId}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Please confirm:</strong> Have you successfully completed the UPI payment for {formatAmount(amount)}? Our admin will verify the payment and update your order status within 24 hours.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowConfirmation(false)} 
                  variant="outline" 
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  onClick={confirmPayment} 
                  className="flex-1"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Yes, I paid
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
